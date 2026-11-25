/**
 * Duelos entre compañeros (datos). Sin DOM.
 *   classes/{clase}/en_linea/{uid}  → quién está AHORA en la sala de duelos (apodo + avatar; nunca nombre ni foto)
 *   classes/{clase}/duelos/{id}     → un duelo de dos jugadores (invitado → aceptado → fin) con el avance de cada uno
 * Solo se ven compañeros de la misma clase, y el docente puede apagarlos (config.duelos = false).
 */
import * as store from './store.js';
import { misClases } from './clases.js';
import { nuevoId } from './progreso.js';
import { SEG_NIVEL } from '../game/duelo.js';

const ruta = (classId, ...r) => ['classes', classId, ...r].join('/');
export const avatarMini = (u) => ({ emoji: u?.avatar?.emoji || '🦊', fondo: u?.avatar?.fondo || 'violeta', ...(u?.avatar?.mascota ? { mascota: u.avatar.mascota } : {}) });
const apodoDe = (u) => String(u?.apodo || u?.nombre || '—').slice(0, 30);

/** Clases del estudiante donde los duelos están permitidos (máximo 2: cada una cuesta lecturas y escrituras). */
export async function clasesConDuelos(user) {
  const todas = await misClases(user);
  const activas = todas.filter((c) => c.clase && c.clase.config?.duelos !== false);
  return { activas: activas.slice(0, 2).map((c) => ({ id: c.insc.classId, nombre: c.clase.nombre })), hayClases: todas.length > 0, apagados: todas.length > 0 && activas.length === 0 };
}

/* ═════════ Sala ═════════ */
export const publicarPresencia = (user, classId, estado = 'libre') =>
  store.esperarMax(store.escribir(ruta(classId, 'en_linea', user.uid), { apodo: apodoDe(user), avatar: avatarMini(user), estado, visto: store.ahora() }));
export const salirDeSala = (user, classId) => store.borrar(ruta(classId, 'en_linea', user.uid)).catch(() => {});
export const escucharSala = (classId, alCambiar, alError) => store.escucharColeccion(ruta(classId, 'en_linea'), {}, alCambiar, alError);

/* ═════════ Duelos ═════════ */
export async function retar(user, rival, classId, texto, nivel = 'medio') {
  const id = nuevoId();
  const datos = { de: user.uid, a: rival.uid, deApodo: apodoDe(user), aApodo: String(rival.apodo || '—').slice(0, 30), deAv: avatarMini(user), aAv: rival.avatar || { emoji: '🦊', fondo: 'violeta' },
    estado: 'invitado', texto, seg: SEG_NIVEL[nivel] || SEG_NIVEL.medio, creadoEn: store.ahora(), prog: {} };
  await store.esperarMax(store.escribir(ruta(classId, 'duelos', id), datos));
  return { id, classId, ...datos, creadoEn: Date.now() };
}
export const responder = (classId, id, acepta) => store.esperarMax(store.actualizar(ruta(classId, 'duelos', id), acepta ? { estado: 'aceptado', aceptadoEn: store.ahora() } : { estado: 'rechazado' }));
export const cancelar = (classId, id) => store.esperarMax(store.actualizar(ruta(classId, 'duelos', id), { estado: 'cancelado' }));
export const guardarAvance = (classId, id, uid, prog) => store.actualizar(ruta(classId, 'duelos', id), { [`prog.${uid}`]: prog });
export const cerrarDuelo = (classId, id) => store.actualizar(ruta(classId, 'duelos', id), { estado: 'fin' });
export const borrarDuelo = (classId, id) => store.borrar(ruta(classId, 'duelos', id)).catch(() => {});
export const escucharInvitaciones = (user, classId, alCambiar, alError) =>
  store.escucharColeccion(ruta(classId, 'duelos'), { donde: [['a', '==', user.uid], ['estado', '==', 'invitado']] }, alCambiar, alError);
export const escucharDuelo = (classId, id, alCambiar, alError) => store.escucharDoc(ruta(classId, 'duelos', id), alCambiar, alError);
