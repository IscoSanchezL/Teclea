/**
 * Retos diarios (3 por día, deterministas por fecha y grado) con recompensa en monedas y XP.
 * El progreso se calcula con las sesiones de HOY (resumenHoy); reclamar guarda challenge_progress.
 */
import { perfilDeGrado } from '../core/grados.js';
import { monedasDeXP } from './xp.js';
import { hoyISO } from './xp.js';
import * as store from '../db/store.js';
import { nivelPorXP } from '../core/levels.js';
import { state, setState } from '../core/state.js';
import { t } from '../i18n/index.js';

function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const semilla = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

const PLANTILLAS = [
  { tipo: 'minutos', titulo: (m) => t('reto.minutos', { n: m }), metas: [3, 5, 8], campo: 'minutos', icono: 'clock', xp: 25, monedas: 12 },
  { tipo: 'lecciones', titulo: (m) => (m === 1 ? t('reto.leccion1') : t('reto.lecciones', { n: m })), metas: [1, 2], campo: 'lecciones', icono: 'keyboard', xp: 30, monedas: 15 },
  { tipo: 'precision', titulo: (m) => t('reto.precision', { n: m }), metas: [90, 95], campo: 'precision', icono: 'target', xp: 25, monedas: 12 },
  { tipo: 'juegos', titulo: (m) => (m === 1 ? t('reto.juego1') : t('reto.juegos', { n: m })), metas: [1, 2, 3], campo: 'juegos', icono: 'gamepad', xp: 20, monedas: 10 },
  { tipo: 'practica', titulo: () => t('reto.practica'), metas: [1], campo: 'practicas', icono: 'book', xp: 20, monedas: 10 },
  { tipo: 'velocidad', titulo: (m) => t('reto.velocidad', { n: m }), metas: [null], campo: 'mejorPpm', icono: 'bolt', xp: 30, monedas: 15 },
];

/** 3 retos del día. */
export function retosDelDia(fecha = hoyISO(), grado = 4, uid = '') {
  const rng = mulberry(semilla(`${fecha}|${grado}`));
  const p = perfilDeGrado(grado);
  const orden = [...PLANTILLAS.slice(1)].sort(() => rng() - 0.5);
  const elegidas = [PLANTILLAS[0], orden[0], orden[1]];
  return elegidas.map((pl, i) => {
    let meta = pl.metas[Math.floor(rng() * pl.metas.length)];
    if (pl.tipo === 'velocidad') meta = Math.max(3, Math.round(p.ppmMin * 0.8));
    if (grado <= 3 && pl.tipo === 'minutos') meta = Math.min(meta, 5);
    return { id: `${fecha}-${i + 1}`, tipo: pl.tipo, titulo: pl.titulo(meta), meta, icono: pl.icono, campo: pl.campo, xp: pl.xp, monedas: pl.monedas };
  });
}

/** Progreso (0–meta) de un reto según el resumen de hoy. */
export function progresoReto(reto, hoy) {
  const v = hoy?.[reto.campo] || 0;
  return Math.min(reto.meta, Math.round(v * 10) / 10);
}
export const retoCumplido = (reto, hoy) => progresoReto(reto, hoy) >= reto.meta;

export async function retosReclamados(uid, fecha = hoyISO()) {
  const docs = await store.consultar('challenge_progress', { donde: [['uid', '==', uid]] });
  return new Set(docs.filter((d) => String(d.retoId).startsWith(fecha) && d.completado).map((d) => d.retoId));
}

/** Reclama la recompensa (XP + monedas). Devuelve {xp, monedas, usuario}. */
export async function reclamarReto(user, reto) {
  const xp = reto.xp, monedas = Math.min(300, reto.monedas + monedasDeXP(0));
  await store.esperarMax(store.lote([
    { tipo: 'set', ruta: `challenge_progress/${user.uid}_${reto.id}`, datos: { uid: user.uid, retoId: reto.id, progreso: reto.meta, completado: true, actualizadoEn: store.ahora() } },
    { tipo: 'update', ruta: `users/${user.uid}`, datos: { xp: store.sumar(xp), monedas: store.sumar(monedas), nivel: nivelPorXP((user.xp || 0) + xp).nivel } },
  ]));
  const u = { ...user, xp: (user.xp || 0) + xp, monedas: (user.monedas || 0) + monedas, nivel: nivelPorXP((user.xp || 0) + xp).nivel };
  if (state.user?.uid === user.uid) setState({ user: u });
  return { xp, monedas, usuario: u };
}
