/**
 * Motor de medallas: evalúa el catálogo (data/badges.json) tras cada actividad y otorga las nuevas.
 * Lógica sin DOM (se prueba en Node con el emulador).
 */
import { state } from '../core/state.js';
import { perfilDeGrado } from '../core/grados.js';
import * as store from '../db/store.js';
import { cargarProgreso, cargarInsignias, cargarInscripciones, otorgarInsignia } from '../db/progreso.js';
import { cargarIndice } from '../lessons/curriculo.js';

let cargador = async (r) => { const x = await fetch(r); if (!x.ok) throw new Error(`HTTP ${x.status}`); return x.json(); };
export const _inyectarCargador = (f) => { cargador = f; };
let catalogo = null;
let contCache = { uid: null, c: null };

export async function cargarCatalogo() {
  if (!catalogo) catalogo = (await cargador('data/badges.json')).insignias;
  return catalogo;
}
export const _reiniciar = () => { contCache = { uid: null, c: null }; };

/** Contadores del estudiante (documento contadores/{uid}). */
export async function cargarContadores(uid) {
  if (contCache.uid !== uid) contCache = { uid, c: (await store.leer(`contadores/${uid}`))?.c || {} };
  return contCache.c;
}

async function incrementar(uid, incs) {
  const c = await cargarContadores(uid);
  const ops = {};
  for (const [k, v] of Object.entries(incs)) { if (v) { ops[`c.${k}`] = store.sumar(v); c[k] = (c[k] || 0) + v; } }
  if (!Object.keys(ops).length) return;
  ops.actualizadoEn = store.ahora();
  try { await store.esperarMax(store.actualizar(`contadores/${uid}`, ops)); } catch (e) {
    if (e?.code !== 'not-found') throw e;
    await store.esperarMax(store.escribir(`contadores/${uid}`, { c: { ...c }, actualizadoEn: store.ahora() }));
  }
}

function cumple(cond, x) {
  const { user, evento, leccion, estrellas, resultado, progreso, indice, contadores, hora } = x;
  const grado = user.grado || 4;
  switch (cond.t) {
    case 'racha': return (user.racha || 0) >= cond.n;
    case 'precision': return evento === 'leccion' && estrellas >= 1 && resultado.precision >= cond.min && resultado.caracteres >= cond.chars;
    case 'contador': return (contadores[cond.k] || 0) >= cond.n;
    case 'ppm_rel': return evento === 'leccion' && estrellas >= 1 && leccion.mundo >= 3 && resultado.precision >= 85 && resultado.ppm >= perfilDeGrado(grado).ppmMax * cond.f;
    case 'tres_estrellas': return Object.values(progreso).some((p) => p.estrellas === 3);
    case 'mundo': { const ls = indice.filter((l) => l.mundo === cond.n); return ls.length > 0 && ls.every((l) => (progreso[l.id]?.estrellas || 0) >= 1); }
    case 'lecciones': return indice.filter((l) => (progreso[l.id]?.estrellas || 0) >= 1).length >= cond.n;
    case 'leccion3': return progreso[cond.id]?.estrellas === 3;
    case 'juego': return (contadores[`juego_${cond.id}`] || 0) > 0;
    case 'primera': return cond.ev === 'refuerzo' ? (evento === 'practica' && x.refId === 'refuerzo') : evento === cond.ev;
    case 'hora': return ['leccion', 'practica', 'juego'].includes(evento) && (cond.despues != null ? hora >= cond.despues : hora < cond.antes);
    case 'oculto': return evento === 'leccion' && estrellas >= 1 && leccion?.mundo === 10 && Boolean(leccion.ejercicios?.[2]?.ocultarTeclado);
    case 'evento': return evento === cond.ev;
    default: return false;
  }
}

/**
 * @param {object} p  {user, evento:'leccion'|'practica'|'juego'|'compra'|'reto'|'reto_clase'|…, leccion?, estrellas?, resultado?, resumen?, juego?, refId?, hora?}
 * @returns {Promise<Array>} medallas nuevas [{id, nombre, descripcion, nivel, icono}]
 */
export async function evaluarInsignias({ user, evento, leccion = null, estrellas = 0, resultado = null, resumen = null, juego = null, refId = null, hora = new Date().getHours() }) {
  const uid = user.uid;
  const [cat, ganadas, progreso, indice] = await Promise.all([cargarCatalogo(), cargarInsignias(uid), cargarProgreso(uid), cargarIndice()]);

  // 1) Contadores
  const incs = {};
  if (['leccion', 'practica', 'juego'].includes(evento)) incs.sesiones = 1;
  if (evento === 'leccion' && estrellas >= 1 && resultado?.precision === 100 && resultado.caracteres >= 60) incs.perfectas = 1;
  if (evento === 'practica') { incs.practicas = 1; if (refId === 'refuerzo') incs.refuerzos = 1; }
  if (evento === 'juego') { incs.juegos = 1; if (juego) incs[`juego_${juego}`] = 1; }
  if (resumen?.racha?.cambio) incs.dias = 1;
  if (Object.keys(incs).length) await incrementar(uid, incs);
  const contadores = await cargarContadores(uid);

  // 2) Evaluación
  const ctx = { user, evento, leccion, estrellas, resultado: resultado || {}, progreso, indice, contadores, hora, refId };
  const nuevas = [];
  for (const m of cat) {
    if (ganadas.has(m.id)) continue;
    let ok = false;
    try { ok = cumple(m.cond, ctx); } catch { ok = false; }
    if (ok && await otorgarInsignia(uid, m.id)) nuevas.push({ id: m.id, nombre: m.nombre, descripcion: m.descripcion, nivel: m.nivel, icono: m.icono });
  }

  // 3) Resumen para el docente
  if (nuevas.length) {
    const insc = await cargarInscripciones(uid);
    for (const i of insc) store.enSegundoPlano(store.actualizar(`enrollments/${i.id}`, { 'stats.medallas': store.sumar(nuevas.length) }), 'medallas de la inscripción');
  }
  return nuevas;
}
