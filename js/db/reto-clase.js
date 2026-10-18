/**
 * Retos en vivo (parejas / final): colecciones `challenges` y `challenge_entries`. Sin DOM.
 * El docente crea y controla el reto; los estudiantes de la clase lo consultan cada pocos segundos.
 */
import * as store from './store.js';
import { nuevoId, cargarInscripciones } from './progreso.js';
import { puntos, repartirMensajes } from '../game/reto-clase.js';

export const ACTIVOS = ['preparacion', 'jugando'];
const orden = (a, b) => (b.creadoEn || 0) - (a.creadoEn || 0);

/* ═════════════ Docente ═════════════ */
export async function crearReto(docente, clase, { tipo, seg = 120, texto = '', parejas = [] }) {
  const id = nuevoId();
  const datos = { docenteId: docente.uid, classId: clase.id, claseNombre: clase.nombre, tipo, estado: 'preparacion', seg, texto, parejas, asignacion: {}, creadoEn: store.ahora() };
  await store.esperarMax(store.escribir(`challenges/${id}`, datos));
  return { id, ...datos, creadoEn: Date.now() };
}

export const retosDeClase = async (docente, clase) => (await store.consultar('challenges', { donde: [['docenteId', '==', docente.uid], ['classId', '==', clase.id]] })).sort(orden);
export const leerReto = (id) => store.leer(`challenges/${id}`);
export const actualizarReto = (id, parche) => store.esperarMax(store.actualizar(`challenges/${id}`, parche));
export const eliminarReto = async (reto) => {
  const ents = await entradas(reto).catch(() => []);
  const ops = [...ents.map((e) => ({ tipo: 'delete', ruta: `challenge_entries/${e.id}` })), { tipo: 'delete', ruta: `challenges/${reto.id}` }];
  await store.esperarMax(store.lote(ops));
};

/** Pasa a "jugando". En el reto final reparte los mensajes (jugadores = todos los inscritos de la clase). */
export async function iniciarReto(reto, jugadoresUids = []) {
  const parche = { estado: 'jugando', iniciadoEn: store.ahora() };
  if (reto.tipo === 'final') {
    const ents = await entradas(reto);
    const autores = ents.filter((e) => e.mensaje).map((e) => e.uid);
    parche.asignacion = repartirMensajes(jugadoresUids, autores);
  }
  await actualizarReto(reto.id, parche);
}
export const cerrarReto = (reto) => actualizarReto(reto.id, { estado: 'cerrado', cerradoEn: store.ahora() });

// classId y docenteId acompañan al filtro porque las reglas de Firestore los exigen para poder listar (docente o compañero de la clase).
export const entradas = (reto) => store.consultar('challenge_entries', { donde: [['challengeId', '==', reto.id], ['classId', '==', reto.classId], ['docenteId', '==', reto.docenteId]] });
export const quitarMensaje = (entrada) => store.esperarMax(store.borrar(`challenge_entries/${entrada.id}`));

/* ═════════════ Estudiante ═════════════ */
/** Reto abierto de las clases del estudiante (el más reciente), o null. */
export async function retoActivoDeAlumno(user) {
  const insc = await cargarInscripciones(user.uid).catch(() => []);
  const todos = [];
  await Promise.all(insc.map(async (i) => {
    const r = await store.consultar('challenges', { donde: [['classId', '==', i.classId], ['estado', 'in', ACTIVOS]] }).catch(() => []);
    todos.push(...r);
  }));
  return todos.sort(orden)[0] || null;
}

const base = (user, reto) => ({ challengeId: reto.id, classId: reto.classId, docenteId: reto.docenteId, uid: user.uid, alias: String(user.apodo || user.nombre || '—').slice(0, 40) });
const rutaEntrada = (user, reto) => `challenge_entries/${reto.id}_${user.uid}`;
export const miEntrada = (user, reto) => store.leer(rutaEntrada(user, reto));

/** Reto final: guarda (o cambia) el mensaje del estudiante antes de que empiece. */
export async function guardarMensaje(user, reto, mensaje) {
  const previa = await miEntrada(user, reto);
  if (previa?.terminado) throw new Error('ya-termino');
  if (previa) await store.esperarMax(store.actualizar(rutaEntrada(user, reto), { mensaje }));
  else await store.esperarMax(store.escribir(rutaEntrada(user, reto), { ...base(user, reto), mensaje, terminado: false, creadoEn: store.ahora() }));
}

/** Guarda el resultado del estudiante (una sola vez: después queda bloqueado por las reglas). */
export async function guardarResultado(user, reto, { ppm, precision }) {
  const wpm = Math.min(200, Math.round(ppm * 10) / 10), prec = Math.round(precision * 10) / 10;
  const datos = { wpm, precision: prec, puntos: puntos(wpm, prec), terminado: true };
  const previa = await miEntrada(user, reto);
  if (previa?.terminado) return previa;
  if (previa) await store.esperarMax(store.actualizar(rutaEntrada(user, reto), datos));
  else await store.esperarMax(store.escribir(rutaEntrada(user, reto), { ...base(user, reto), ...datos, creadoEn: store.ahora() }));
  return { ...(previa || base(user, reto)), ...datos };
}
