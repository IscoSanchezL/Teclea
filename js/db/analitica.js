/**
 * Análisis para el docente (sin DOM): estado de cada estudiante, resumen de clase, CSV y datos de ejemplo (solo demo).
 */
import { perfilDeGrado } from '../core/grados.js';
import { hoyISO } from '../game/xp.js';
import * as store from './store.js';
import { nuevoId } from './progreso.js';

const DIA = 86400000;
const inicioDia = (ms = Date.now()) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const diasDesde = (ms) => (ms ? Math.floor((inicioDia() - inicioDia(ms)) / DIA) : null);

export function textoUltima(ms) {
  const d = diasDesde(ms);
  if (d == null) return '—';
  return d <= 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`;
}

/** nuevo | inactivo | atrasado | destacado | ok */
export function estadoDe(insc, grado = insc.grado || 4) {
  const s = insc.stats || {};
  if (!s.sesiones) return 'nuevo';
  const dias = diasDesde(s.ultimaPractica);
  if (dias == null || dias >= 7) return 'inactivo';
  const p = perfilDeGrado(grado);
  if (s.sesiones >= 3 && (s.mejorWpm < p.ppmMin * 0.6 || s.precisionProm < p.precision - 10)) return 'atrasado';
  if (s.mejorWpm >= p.ppmMax && s.precisionProm >= p.precision) return 'destacado';
  return 'ok';
}

const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const r1 = (n) => Math.round(n * 10) / 10;

/** Resumen de una lista de inscripciones y las sesiones recientes. */
export function resumenClase(inscs, sesiones = []) {
  const activos = inscs.filter((i) => diasDesde(i.stats?.ultimaPractica) === 0).length;
  const conDatos = inscs.filter((i) => i.stats?.sesiones);
  const semana = Array.from({ length: 7 }, (_, k) => {
    const dia = inicioDia(Date.now() - (6 - k) * DIA);
    const mins = sesiones.filter((s) => inicioDia(s.creadoEn || 0) === dia).reduce((a, s) => a + (s.duracionSeg || 0), 0) / 60;
    return { etiqueta: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][new Date(dia).getDay()], valor: Math.round(mins) };
  });
  const errores = {};
  for (const s of sesiones) for (const [c, v] of Object.entries(s.erroresPorTecla || {})) errores[c] = (errores[c] || 0) + v;
  const max = Math.max(1, ...Object.values(errores));
  const calor = Object.fromEntries(Object.entries(errores).map(([k, v]) => [k, v / max]));
  return {
    total: inscs.length, activos, ppm: r1(media(conDatos.map((i) => i.stats.mejorWpm || 0))), precision: r1(media(conDatos.map((i) => i.stats.precisionProm || 0))),
    minutosSemana: semana, calor, apoyo: inscs.filter((i) => ['atrasado', 'inactivo'].includes(estadoDe(i))),
  };
}

export const ETIQUETAS = { ok: 'Al día', destacado: 'Destacado', atrasado: 'Atrasado', inactivo: 'Inactivo', nuevo: 'Sin empezar' };

export function aCSV(encabezado, filas) {
  const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + [encabezado, ...filas].map((f) => f.map(enc).join(',')).join('\n'); // BOM: Excel respeta las tildes
}

export function descargar(nombre, texto, tipo = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo })); a.download = nombre;
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** SOLO modo demo: crea una clase con alumnos y actividad de ejemplo para explorar el panel. */
export async function sembrarEjemplo(docente, clase) {
  const nombres = ['Sofía M.', 'Juan D.', 'Valentina R.', 'Tomás P.', 'Isabella G.', 'Mateo L.', 'Camila S.', 'Daniel O.'];
  const p = perfilDeGrado(clase.grado);
  const ops = [];
  nombres.forEach((nombre, i) => {
    const uid = `demo-ej-${nuevoId()}`;
    const ppm = Math.round(p.ppmMin * (0.5 + (i % 5) * 0.28) * 10) / 10, pre = Math.min(99, 76 + (i * 3) % 22);
    const ultima = Date.now() - [0, 0, 1, 4, 0, 1, 9, 0][i] * DIA;
    ops.push({ tipo: 'set', ruta: `users/${uid}`, datos: { uid, nombre, apodo: nombre.split(' ')[0], rol: 'estudiante', grado: clase.grado, creadoPor: docente.uid, avatar: { emoji: ['🦊', '🐼', '🐯', '🦁', '🦄', '🐙', '🦖', '🐸'][i], fondo: 'violeta' }, xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, protectores: 0, prefs: {}, authTipo: 'pin', activo: true } });
    ops.push({ tipo: 'set', ruta: `enrollments/${clase.id}_${uid}`, datos: { uid, classId: clase.id, docenteId: docente.uid, codigo: clase.codigo, alias: nombre.split(' ')[0], avatar: { emoji: ['🦊', '🐼', '🐯', '🦁', '🦄', '🐙', '🦖', '🐸'][i], fondo: 'violeta' }, grado: clase.grado, estado: 'activo', pin: String(1000 + i * 137),
      stats: { xp: 80 + i * 45, sesiones: 6 + i, minutos: 20 + i * 9, mejorWpm: ppm, precisionProm: pre, medallas: i % 4, lecciones: 3 + i, caracteres: 900 + i * 400, ppmInicial: Math.max(3, ppm - 4 - i % 3), ultimaPractica: ultima }, unidoEn: Date.now() - 12 * DIA, ultimaConexion: ultima } });
    ops.push({ tipo: 'set', ruta: `classes/${clase.id}/ranking/${uid}`, datos: { apodo: nombre.split(' ')[0], avatar: { emoji: ['🦊', '🐼', '🐯', '🦁', '🦄', '🐙', '🦖', '🐸'][i], fondo: 'violeta' }, puntos: 80 + i * 45, mejora: 4 + i % 3 + i * .5 } });
    ops.push({ tipo: 'set', ruta: `classes/${clase.id}/aportes/${uid}`, datos: { caracteres: 900 + i * 400, sesiones: 6 + i } });
    for (let d = 0; d < 6; d++) ops.push({ tipo: 'set', ruta: `sessions/${nuevoId()}`, datos: { uid, classId: clase.id, docenteId: docente.uid, tipo: 'leccion', refId: 'm1-l01', wpm: ppm * (0.7 + d * 0.05), precision: pre, errores: 4, duracionSeg: 90 + d * 15, caracteres: 120, dia: hoyISO(), creadoEn: Date.now() - d * DIA * (i % 2 ? 1 : 0.5) - 3600000,
      erroresPorTecla: { ñ: 1 + ((d + i) % 4), p: 2, q: i % 3 } } });
  });
  for (let i = 0; i < ops.length; i += 400) await store.lote(ops.slice(i, i + 400));
}

/** Sesiones de los últimos `dias` días de los estudiantes del docente. Igualdad + "in" (sin índice compuesto). */
export async function sesionesDocente(docente, dias = 7) {
  const fechas = Array.from({ length: Math.min(30, dias) }, (_, k) => hoyISO(new Date(Date.now() - k * DIA)));
  const lista = await store.consultar('sessions', { donde: [['docenteId', '==', docente.uid], ['dia', 'in', fechas]] }).catch(() => []);
  return lista.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
}
