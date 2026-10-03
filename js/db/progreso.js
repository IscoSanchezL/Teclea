/**
 * Repositorio de progreso del estudiante (lecciones, sesiones, XP, racha, estadísticas por tecla).
 * Sin DOM: funciona igual en el navegador (local o Firestore) y en las pruebas de Node con el emulador.
 */
import { state, setState } from '../core/state.js';
import { nivelPorXP } from '../core/levels.js';
import { xpLeccion, xpPractica, xpJuego, monedasDeXP, actualizarRacha, hoyISO } from '../game/xp.js';
import * as store from './store.js';

let cache = { uid: null, progreso: null, inscripciones: null, teclas: null, insignias: null };
const reiniciarCache = (uid) => { cache = { uid, progreso: null, inscripciones: null, teclas: null, insignias: null }; };
const asegurar = (uid) => { if (cache.uid !== uid) reiniciarCache(uid); };

export const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const hex = (c) => `k${c.codePointAt(0).toString(16)}`;
const desdeHex = (k) => String.fromCodePoint(parseInt(k.slice(1), 16));

/* ───────── Lecturas (con caché por sesión) ───────── */
export async function cargarProgreso(uid) {
  asegurar(uid);
  if (!cache.progreso) {
    const docs = await store.consultar('lessons_progress', { donde: [['uid', '==', uid]] });
    cache.progreso = Object.fromEntries(docs.map((d) => [d.lessonId, d]));
  }
  return cache.progreso;
}

/** Fuerza a releer las inscripciones (tras unirse o salir de una clase). */
export const refrescarInscripciones = () => { cache.inscripciones = null; };

export async function cargarInscripciones(uid) {
  asegurar(uid);
  if (!cache.inscripciones) cache.inscripciones = await store.consultar('enrollments', { donde: [['uid', '==', uid]] });
  return cache.inscripciones;
}

/** {caracter: {ok, err}} acumulado de toda la historia del estudiante. */
export async function cargarTeclas(uid) {
  asegurar(uid);
  if (!cache.teclas) {
    const d = await store.leer(`key_stats/${uid}`);
    cache.teclas = Object.fromEntries(Object.entries(d?.teclas || {}).map(([k, v]) => [desdeHex(k), { ok: v.ok || 0, err: v.err || 0 }]));
  }
  return cache.teclas;
}

/** Teclas con más fallos relativos (mín. 6 intentos), de peor a mejor. */
export async function teclasDebiles(uid, max = 6) {
  const t = await cargarTeclas(uid);
  return Object.entries(t)
    .map(([c, { ok, err }]) => ({ c, intentos: ok + err, tasa: (ok + err) ? err / (ok + err) : 0, err }))
    .filter((x) => x.intentos >= 6 && x.tasa >= 0.08 && x.c.trim())
    .sort((a, b) => b.tasa - a.tasa || b.err - a.err)
    .slice(0, max);
}

/** Resumen de hoy: minutos, mejor PPM, precisión media y nº de sesiones (para el inicio y los retos). */
export async function resumenHoy(uid) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  // Igualdad por día (sin rango) para no exigir índices compuestos en Firestore
  const ses = await store.consultar('sessions', { donde: [['uid', '==', uid], ['dia', '==', hoyISO()]] });
  const hoy = ses;
  const minutos = hoy.reduce((a, x) => a + (x.duracionSeg || 0), 0) / 60;
  const porTipo = (t) => hoy.filter((x) => x.tipo === t).length;
  return {
    sesiones: hoy.length, minutos: Math.round(minutos * 10) / 10,
    lecciones: porTipo('leccion'), practicas: porTipo('practica'), juegos: porTipo('juego'),
    mejorPpm: hoy.reduce((m, x) => Math.max(m, x.wpm || 0), 0),
    precision: hoy.length ? Math.round(hoy.reduce((a, x) => a + (x.precision || 0), 0) / hoy.length) : 0,
  };
}

export async function cargarInsignias(uid) {
  asegurar(uid);
  if (!cache.insignias) cache.insignias = new Set((await store.consultar('badges_earned', { donde: [['uid', '==', uid]] })).map((d) => d.badgeId));
  return cache.insignias;
}

/* ───────── Escrituras ───────── */

/** Estadísticas por tecla (se actualiza aparte: usa rutas con punto, que no sirven dentro de `set`). */
async function guardarTeclas(uid, porTecla) {
  const ops = {};
  for (const [c, v] of Object.entries(porTecla)) {
    if (!c.trim()) continue;
    if (v.ok) ops[`teclas.${hex(c)}.ok`] = store.sumar(v.ok);
    if (v.err) ops[`teclas.${hex(c)}.err`] = store.sumar(v.err);
  }
  if (!Object.keys(ops).length) return;
  ops.actualizadoEn = store.ahora();
  try { await store.actualizar(`key_stats/${uid}`, ops); } catch (e) {
    if (e?.code !== 'not-found') throw e;
    const teclas = {};
    for (const [c, v] of Object.entries(porTecla)) if (c.trim()) teclas[hex(c)] = { ok: v.ok || 0, err: v.err || 0 };
    await store.escribir(`key_stats/${uid}`, { teclas, actualizadoEn: store.ahora() });
  }
  if (cache.teclas) for (const [c, v] of Object.entries(porTecla)) { const t = (cache.teclas[c] ||= { ok: 0, err: 0 }); t.ok += v.ok || 0; t.err += v.err || 0; }
}

function flagsDe(banderas = {}) { const f = Object.fromEntries(Object.entries(banderas).filter(([, v]) => v)); return Object.keys(f).length ? f : undefined; }
function erroresPorTecla(porTecla) {
  const e = {}; for (const [c, v] of Object.entries(porTecla || {})) if (v.err > 0 && c.trim() && Object.keys(e).length < 60) e[c] = v.err; return e;
}

/**
 * Registra el resultado de una actividad: sesión + (progreso de lección) + XP/monedas/racha + estadísticas de inscripciones.
 * @param {object} p
 * @param {object} p.user              perfil actual
 * @param {'leccion'|'practica'|'juego'|'examen'|'asignacion'} p.tipo
 * @param {string} p.refId
 * @param {object} p.resultado         salida de MotorEscritura.resultado() (o {ppm, precision,...} para juegos)
 * @param {object} [p.leccion]         lección (solo tipo 'leccion')
 * @param {number} [p.estrellas]
 * @param {object} [p.porTecla]        errores/aciertos por tecla de TODOS los ejercicios (para refuerzo)
 * @param {number} [p.puntos]          puntos del juego
 * @returns resumen {xp, desglose, monedas, nivel, subioNivel, racha, esRecord, primeraVez, estrellas, usoProtector}
 */
export async function registrarActividad({ user, tipo, refId, resultado, leccion = null, estrellas = 0, porTecla = null, puntos = 0, classId = null }) {
  const uid = user.uid;
  const [progreso, inscripciones] = await Promise.all([cargarProgreso(uid), cargarInscripciones(uid)]);
  const prev = leccion ? progreso[leccion.id] : null;
  const grado = user.grado || 4;
  const primeraVez = leccion ? !prev?.completada : false;

  // ── XP ──
  const calc = tipo === 'leccion' ? xpLeccion({ estrellas, precision: resultado.precision, ppm: resultado.ppm, primeraVez, grado })
    : tipo === 'juego' ? xpJuego(puntos)
    : xpPractica({ segundos: resultado.duracionSeg, precision: resultado.precision, ppm: resultado.ppm, grado });
  const xpGanado = calc.total;
  const monedas = monedasDeXP(xpGanado);
  const xpNuevo = (user.xp || 0) + xpGanado;
  const nivelAntes = nivelPorXP(user.xp || 0).nivel;
  const nivelDespues = nivelPorXP(xpNuevo);

  // ── Racha ──
  const r = actualizarRacha(user);

  // ── Clase vinculada (la primera, o la indicada) ──
  const insc = (classId ? inscripciones.find((i) => i.classId === classId) : inscripciones[0]) || null;

  const ops = [];
  const sesionId = nuevoId();
  const sesion = {
    uid, tipo, refId, wpm: resultado.ppm, precision: resultado.precision, errores: resultado.errores,
    duracionSeg: resultado.duracionSeg, caracteres: resultado.caracteres,
    dia: hoyISO(), creadoEn: store.ahora(),
  };
  const ept = erroresPorTecla(porTecla || resultado.porTecla);
  if (Object.keys(ept).length) sesion.erroresPorTecla = ept;
  const fl = flagsDe(resultado.banderas); if (fl) sesion.flags = fl;
  if (insc) { sesion.classId = insc.classId; sesion.docenteId = insc.docenteId; }
  ops.push({ tipo: 'set', ruta: `sessions/${sesionId}`, datos: sesion });

  // ── Progreso de lección ──
  let nuevoProg = null, esRecord = false;
  if (leccion) {
    esRecord = !prev || resultado.ppm > (prev.mejorWpm || 0);
    nuevoProg = {
      uid, lessonId: leccion.id, mundo: leccion.mundo,
      estrellas: Math.max(prev?.estrellas || 0, estrellas),
      mejorWpm: Math.max(prev?.mejorWpm || 0, resultado.ppm),
      mejorPrecision: Math.max(prev?.mejorPrecision || 0, resultado.precision),
      intentos: (prev?.intentos || 0) + 1,
      completada: Boolean(prev?.completada) || estrellas >= 1,
      docenteIds: [...new Set(inscripciones.map((i) => i.docenteId))].slice(0, 3),
      actualizadoEn: store.ahora(),
    };
    ops.push({ tipo: 'set', ruta: `lessons_progress/${uid}_${leccion.id}`, datos: nuevoProg });
  }

  // ── Perfil: XP, monedas, nivel, racha ──
  const parche = { xp: store.sumar(xpGanado), monedas: store.sumar(monedas), nivel: nivelDespues.nivel };
  if (r.cambio) Object.assign(parche, { racha: r.racha, rachaMax: r.rachaMax, ultimoDia: r.ultimoDia, protectores: r.protectores });
  ops.push({ tipo: 'update', ruta: `users/${uid}`, datos: parche });

  // ── Resumen para el docente (inscripciones) ──
  const minutos = Math.round((resultado.duracionSeg / 60) * 10) / 10;
  for (const i of inscripciones) {
    const s = i.stats || {};
    const sesiones = (s.sesiones || 0) + 1;
    const datos = {
      'stats.xp': store.sumar(xpGanado), 'stats.sesiones': store.sumar(1), 'stats.minutos': store.sumar(minutos),
      'stats.mejorWpm': Math.max(s.mejorWpm || 0, resultado.ppm),
      'stats.precisionProm': Math.round((((s.precisionProm || 0) * (sesiones - 1)) + resultado.precision) / sesiones * 10) / 10,
      'stats.ultimaPractica': store.ahora(), ultimaConexion: store.ahora(),
    };
    if (leccion && estrellas >= 1 && !prev?.completada) datos['stats.lecciones'] = store.sumar(1);
    if (leccion) datos['stats.mundo'] = leccion.mundo;
    const chars = Math.min(5000, resultado.caracteres || 0);
    datos['stats.caracteres'] = store.sumar(chars);
    if (s.ppmInicial == null) datos['stats.ppmInicial'] = resultado.ppm;
    ops.push({ tipo: 'update', ruta: `enrollments/${i.id}`, datos });
    // Ranking positivo (solo apodo y avatar, nunca nombre ni foto) y aporte al reto de la clase
    const mejorNuevo = Math.max(s.mejorWpm || 0, resultado.ppm);
    ops.push({ tipo: 'set', ruta: `classes/${i.classId}/ranking/${uid}`, datos: {
      apodo: String(user.apodo || 'Estudiante').slice(0, 30), avatar: { emoji: user.avatar?.emoji || '🦊', fondo: user.avatar?.fondo || 'violeta' },
      puntos: Math.min(100000, (s.xp || 0) + xpGanado), mejora: Math.round(Math.max(-100, Math.min(200, mejorNuevo - (s.ppmInicial ?? resultado.ppm))) * 10) / 10, actualizadoEn: store.ahora() } });
    ops.push({ tipo: 'set', ruta: `classes/${i.classId}/aportes/${uid}`, datos: { caracteres: Math.min(10000000, (s.caracteres || 0) + chars), sesiones: Math.min(100000, (s.sesiones || 0) + 1), actualizadoEn: store.ahora() } });
  }

  const estadoEscritura = await store.esperarMax(store.lote(ops)); // sin red: queda en cola y se sincroniza al reconectar

  // ── Caché y estado local ──
  if (nuevoProg) progreso[leccion.id] = { ...nuevoProg, actualizadoEn: Date.now() };
  for (const i of inscripciones) {
    const s = (i.stats ||= {});
    s.xp = (s.xp || 0) + xpGanado; s.sesiones = (s.sesiones || 0) + 1; s.minutos = (s.minutos || 0) + minutos;
    if (s.ppmInicial == null) s.ppmInicial = resultado.ppm;
    s.caracteres = (s.caracteres || 0) + Math.min(5000, resultado.caracteres || 0);
    s.mejorWpm = Math.max(s.mejorWpm || 0, resultado.ppm);
    if (leccion && estrellas >= 1 && !prev?.completada) s.lecciones = (s.lecciones || 0) + 1;
  }
  const userNuevo = { ...user, xp: xpNuevo, monedas: (user.monedas || 0) + monedas, nivel: nivelDespues.nivel };
  if (r.cambio) Object.assign(userNuevo, { racha: r.racha, rachaMax: r.rachaMax, ultimoDia: r.ultimoDia, protectores: r.protectores });
  if (state.user?.uid === uid) setState({ user: userNuevo });

  // Estadísticas por tecla: no bloquean la pantalla de resultados
  const teclas = porTecla || resultado.porTecla;
  if (teclas) store.enSegundoPlano(guardarTeclas(uid, teclas), 'estadísticas por tecla');

  return {
    xp: xpGanado, desglose: calc.desglose, monedas, nivel: nivelDespues, subioNivel: nivelDespues.nivel > nivelAntes,
    racha: r, esRecord, primeraVez, estrellas, usuario: userNuevo, sesionId, mejorAnterior: prev?.mejorWpm || 0, enCola: estadoEscritura === 'en-cola',
  };
}

/** Marca una insignia ganada (idempotente: no duplica). Devuelve true si era nueva. */
export async function otorgarInsignia(uid, badgeId) {
  const ya = await cargarInsignias(uid);
  if (ya.has(badgeId)) return false;
  await store.esperarMax(store.escribir(`badges_earned/${uid}_${badgeId}`, { uid, badgeId, ganadaEn: store.ahora() }));
  ya.add(badgeId);
  return true;
}

export const _reiniciarCache = () => reiniciarCache(null);
export { hoyISO };
