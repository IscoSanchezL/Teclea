/**
 * Currículo en el cliente: carga perezosa por mundo, desbloqueo, ajuste por grado y estrellas.
 * (Lógica pura salvo `fetch`, para poder probarla en Node.)
 */
import { perfilDeGrado } from '../core/grados.js';

const cacheMundos = new Map();
let cacheIndice = null;

/** Base de la URL de datos (en Node se inyecta un lector de archivos). */
let cargador = async (ruta) => { const r = await fetch(ruta); if (!r.ok) throw new Error(`HTTP ${r.status} en ${ruta}`); return r.json(); };
export const _inyectarCargador = (f) => { cargador = f; };

/** Índice liviano de TODAS las lecciones (≈ 15 KB). */
export async function cargarIndice() {
  if (!cacheIndice) cacheIndice = (await cargador('data/lessons/index.json')).lecciones;
  return cacheIndice;
}

/** Lecciones completas de un mundo (≈ 12 KB). */
export async function cargarMundo(n) {
  if (!cacheMundos.has(n)) cacheMundos.set(n, cargador(`data/lessons/m${n}.json`));
  return cacheMundos.get(n);
}

export async function cargarLeccion(id) {
  const n = Number(id.match(/^m(\d+)-/)?.[1]);
  if (!n) return null;
  const mundo = await cargarMundo(n);
  return mundo.lecciones.find((l) => l.id === id) || null;
}

/** Lección siguiente en el orden global (o null si era la última). */
export async function siguienteDe(id) {
  const idx = await cargarIndice();
  const i = idx.findIndex((l) => l.id === id);
  return i >= 0 && i < idx.length - 1 ? idx[i + 1] : null;
}

/**
 * Estado de cada lección según el progreso: 'bloqueada' | 'disponible' | 'actual' | 'completada'.
 * Regla: una lección se abre cuando la anterior (en el orden global) tiene al menos 1 estrella.
 * `mundosAbiertos` permite al docente abrir mundos completos; `mundosBloqueados`, cerrarlos.
 */
export function estadoLecciones(indice, progreso, { mundosAbiertos = [], mundosBloqueados = [] } = {}) {
  const estados = {};
  let actualAsignado = false;
  indice.forEach((l, i) => {
    const p = progreso[l.id];
    const hecha = p && p.estrellas >= 1;
    const anterior = i === 0 ? true : (progreso[indice[i - 1].id]?.estrellas || 0) >= 1;
    let estado = hecha ? 'completada' : anterior ? 'disponible' : 'bloqueada';
    if (mundosAbiertos.includes(l.mundo) && estado === 'bloqueada') estado = 'disponible';
    if (mundosBloqueados.includes(l.mundo)) estado = hecha ? 'completada' : 'bloqueada';
    if (estado === 'disponible' && !actualAsignado) { estado = 'actual'; actualAsignado = true; }
    estados[l.id] = estado;
  });
  return estados;
}

/** Progreso del mundo: {hechas, total, estrellas, maxEstrellas, completo}. */
export function resumenMundo(indice, progreso, mundo) {
  const ls = indice.filter((l) => l.mundo === mundo);
  const hechas = ls.filter((l) => (progreso[l.id]?.estrellas || 0) >= 1).length;
  const estrellas = ls.reduce((s, l) => s + (progreso[l.id]?.estrellas || 0), 0);
  return { hechas, total: ls.length, estrellas, maxEstrellas: ls.length * 3, completo: hechas === ls.length };
}

/** Mundo en el que está trabajando el estudiante (el de la lección "actual"). */
export function mundoActual(indice, estados) {
  const l = indice.find((x) => estados[x.id] === 'actual');
  return l ? l.mundo : indice.at(-1).mundo;
}

/* ─────────── Ajuste por grado ─────────── */
export const FACTOR_LARGO = { 2: 0.6, 3: 0.8, 4: 1, 5: 1.2, 6: 1.4 };

/** Acorta/alarga el ejercicio según el grado (los textos traen ~1,4 × la base). Cortes siempre en límite de palabra. */
export function textoParaGrado(ej, leccion, grado) {
  if (ej.modo === 'tiempo' || ej.t === 'guiado') return ej.texto;
  const factor = FACTOR_LARGO[grado] ?? 1;
  const largo = Math.round((leccion.base || 120) * factor);
  if (ej.texto.length <= largo) return ej.texto;
  const c = ej.texto.slice(0, largo + 1);
  const i = c.lastIndexOf(' ');
  return (i > largo * 0.6 ? c.slice(0, i) : ej.texto.slice(0, largo)).trim();
}

/** Segundos de un ejercicio contrarreloj, un poco más generosos en grados bajos. */
export function segundosParaGrado(ej, grado) {
  if (!ej.seg) return 0;
  return grado <= 3 ? Math.round(ej.seg * 1.25) : ej.seg;
}

/**
 * Estrellas (0–3) con la meta del grado:
 *   3★ precisión ≥ meta y PPM ≥ PPM máx. del grado × factor de la lección
 *   2★ precisión ≥ meta − 4 pts y PPM ≥ PPM mín. × factor
 *   1★ precisión ≥ meta − 12 pts (se completó)
 */
export function calcularEstrellas({ ppm, precision, completo = true }, leccion, grado, metaClase = null) {
  const p = metaClase || perfilDeGrado(grado);
  const reqPre = Math.max(p.precision, leccion.meta.precision * 100);
  const f = leccion.meta.ppm;
  if (!completo && !leccion.ejercicios?.at(-1)?.modo) return 0;
  if (precision >= reqPre && ppm >= p.ppmMax * f) return 3;
  if (precision >= reqPre - 4 && ppm >= p.ppmMin * f) return 2;
  if (precision >= reqPre - 12) return 1;
  return 0;
}

/** Ruta recomendada por grado (mundos que se esperan en el año escolar). */
export const MUNDOS_RECOMENDADOS = { 2: [1, 2, 3, 4], 3: [1, 2, 3, 4, 5, 6], 4: [1, 2, 3, 4, 5, 6, 7, 8], 5: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };
