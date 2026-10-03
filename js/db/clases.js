/**
 * Clases, inscripciones, alumnos con PIN, tareas y ejercicios del docente. Sin DOM.
 * Funciona igual en modo demo (almacén local) y con Firebase (las reglas de Firestore son la barrera real).
 */
import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';
import { slugUsuario } from '../core/utils.js';
import * as store from './store.js';
import { obtenerFirebase } from './firebase.js';
import { perfilNuevo } from './users.js';
import { nuevoId, cargarInscripciones, refrescarInscripciones } from './progreso.js';

/** Sin I, O, 0, 1 (se confunden). Debe coincidir con la regex de class_codes en firestore.rules. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generarCodigo() {
  const b = new Uint32Array(6); crypto.getRandomValues(b);
  return [...b].map((n) => ALFABETO[n % ALFABETO.length]).join('');
}
export const codigoValido = (c) => /^[A-HJ-NP-Z2-9]{6}$/.test(c);

export const COLORES_CLASE = ['#6C4CF5', '#1E78C8', '#0B8F6D', '#E39A00', '#E84F3F', '#C13C8F', '#4A5568'];
export const CONFIG_CLASE = { rankingVisible: true, metaClase: 20000, mundosBloqueados: [], mundosAbiertos: [] };

/* ═════════════ Clases ═════════════ */
export async function crearClase(docente, { nombre, grado, grupo = '', color = COLORES_CLASE[0] }) {
  let codigo = '';
  for (let i = 0; i < 6; i++) { const c = generarCodigo(); if (!(await store.leer(`class_codes/${c}`))) { codigo = c; break; } }
  if (!codigo) throw new Error('No se pudo generar un código único. Inténtalo otra vez.');
  const id = nuevoId();
  await store.esperarMax(store.lote([
    { tipo: 'set', ruta: `classes/${id}`, datos: { docenteId: docente.uid, nombre: nombre.trim().slice(0, 60), grado, grupo: grupo.trim().slice(0, 20), color, codigo, config: { ...CONFIG_CLASE }, activa: true, creadoEn: store.ahora() } },
    { tipo: 'set', ruta: `class_codes/${codigo}`, datos: { classId: id, docenteId: docente.uid } },
  ]));
  return { id, docenteId: docente.uid, nombre, grado, grupo, color, codigo, config: { ...CONFIG_CLASE }, activa: true };
}

export const listarClases = (docente) => store.consultar('classes', { donde: [['docenteId', '==', docente.uid]] });

export async function actualizarClase(clase, parche) {
  const completo = { ...clase, ...parche };
  if (parche.config) completo.config = { ...clase.config, ...parche.config };
  const { id, creadoEn, ...datos } = completo;
  await store.esperarMax(store.actualizar(`classes/${clase.id}`, Object.fromEntries(Object.keys(parche).map((k) => [k, completo[k]]))));
  return { id, ...datos, creadoEn };
}

export async function regenerarCodigo(clase) {
  let codigo = '';
  for (let i = 0; i < 6; i++) { const c = generarCodigo(); if (!(await store.leer(`class_codes/${c}`))) { codigo = c; break; } }
  if (!codigo) throw new Error('No se pudo generar un código único.');
  await store.esperarMax(store.lote([
    { tipo: 'delete', ruta: `class_codes/${clase.codigo}` },
    { tipo: 'set', ruta: `class_codes/${codigo}`, datos: { classId: clase.id, docenteId: clase.docenteId } },
    { tipo: 'update', ruta: `classes/${clase.id}`, datos: { codigo } },
  ]));
  return codigo;
}

export async function eliminarClase(clase, inscripciones = []) {
  const ops = [...inscripciones.map((i) => ({ tipo: 'delete', ruta: `enrollments/${i.id}` })),
    ...(clase.claveAlumnos ? [{ tipo: 'delete', ruta: `class_access/${clase.claveAlumnos}` }] : []),
    { tipo: 'delete', ruta: `class_codes/${clase.codigo}` }, { tipo: 'delete', ruta: `classes/${clase.id}` }];
  for (let i = 0; i < ops.length; i += 400) await store.esperarMax(store.lote(ops.slice(i, i + 400)));
}

/* ═════════════ Inscripciones ═════════════ */
export const inscripcionesDocente = (docente) => store.consultar('enrollments', { donde: [['docenteId', '==', docente.uid]] });

const statsVacias = () => ({ xp: 0, sesiones: 0, minutos: 0, mejorWpm: 0, precisionProm: 0, medallas: 0, lecciones: 0, caracteres: 0 });

/** El estudiante se une con el código de la clase. */
export async function unirse(user, codigoTexto) {
  const codigo = String(codigoTexto || '').trim().toUpperCase();
  if (!codigoValido(codigo)) throw new Error('El código tiene 6 letras o números (sin I, O, 0 ni 1). Revísalo con tu profe.');
  const cc = await store.leer(`class_codes/${codigo}`).catch(() => null);
  if (!cc) throw new Error('No encontré ninguna clase con ese código. Revísalo e inténtalo otra vez.');
  const ya = await cargarInscripciones(user.uid);
  if (ya.some((i) => i.classId === cc.classId)) throw new Error('Ya estás en esa clase.');
  const id = `${cc.classId}_${user.uid}`;
  await store.esperarMax(store.escribir(`enrollments/${id}`, {
    uid: user.uid, classId: cc.classId, docenteId: cc.docenteId, codigo, alias: user.apodo, avatar: { emoji: user.avatar?.emoji || '🦊', fondo: user.avatar?.fondo || 'violeta' },
    grado: user.grado ?? null, estado: 'activo', stats: statsVacias(), unidoEn: store.ahora(), ultimaConexion: store.ahora(),
  }));
  refrescarInscripciones();
  return { classId: cc.classId, id };
}

export async function salirDeClase(inscripcion) {
  await store.esperarMax(store.borrar(`enrollments/${inscripcion.id}`));
  await store.borrar(`classes/${inscripcion.classId}/ranking/${inscripcion.uid}`).catch(() => {});
  refrescarInscripciones();
}

/** Clases del estudiante: inscripción + datos de la clase. */
export async function misClases(user) {
  const insc = await cargarInscripciones(user.uid);
  return Promise.all(insc.map(async (i) => ({ insc: i, clase: await store.leer(`classes/${i.classId}`).catch(() => null) })));
}

export const actualizarInscripcion = (insc, parche) => store.esperarMax(store.actualizar(`enrollments/${insc.id}`, parche));
export const quitarEstudiante = (insc) => store.esperarMax(store.borrar(`enrollments/${insc.id}`));

/* ═════════════ Docente: clases y alumnos (ver más abajo) ═════════════ */
export const claveValida = (c) => /^[A-Z0-9]{6,12}$/.test(c);
/** Código de acceso sugerido: TECLA + grado + letra del grupo (p. ej. "2.º A" → TECLA2A). */
export function claveSugerida(clase) {
  const letra = (String(clase.nombre).match(/([A-Za-z0-9])\s*$/)?.[1] || String(clase.grupo || 'A').slice(0, 1) || 'A').toUpperCase();
  return `TECLA${clase.grado}${letra}`;
}
const ANIMALES = ['🦊', '🐼', '🐯', '🦁', '🦄', '🐙', '🦖', '🐸', '🐬', '🦉', '🐲', '🐰', '🐻', '🐧', '🦋', '🐢', '🐝', '🦒', '🐘', '🐨', '🦈', '🐞', '🦜', '🐳', '🦔', '🐮', '🐷', '🐵', '🐔', '🦆'];
/** "Ana María Pérez Gómez" → "Ana P." (primer nombre + inicial del primer apellido). */
export function nombreCorto(nombre) {
  const p = String(nombre).trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 20);
  const apellido = p.length >= 3 ? p[2] : p[1];
  return `${p[0].slice(0, 18)} ${apellido[0].toUpperCase()}.`;
}

/* ═════════════ Alumnos de 2.º: ingreso por lista (código de acceso + tocar el nombre) ═════════════ */
/** Lista pública del grupo (null si no existe). Los errores (p. ej. reglas sin publicar) se propagan. */
export const listaPorClave = (clave) => store.leer(`class_access/${String(clave).trim().toUpperCase()}`);

/** Reconstruye la lista pública del grupo desde las inscripciones con usuario (solo apodo corto y animal). */
export async function publicarLista(docente, clase) {
  if (!clase.claveAlumnos) return;
  const insc = (await inscripcionesDocente(docente)).filter((i) => i.classId === clase.id && i.usuario && i.estado !== 'pausado');
  const estudiantes = insc.map((i) => ({ u: i.usuario, a: i.alias, e: i.avatar?.emoji || '🦊' })).sort((x, y) => x.a.localeCompare(y.a, 'es'));
  await store.esperarMax(store.escribir(`class_access/${clase.claveAlumnos}`, { classId: clase.id, docenteId: docente.uid, estudiantes, actualizadoEn: store.ahora() }));
}

/**
 * Crea cuentas de estudiantes (Auth con instancia secundaria + perfil + inscripción) y publica la lista del grupo.
 * Todas las cuentas del grupo usan como contraseña el código de acceso de la clase (ej. TECLA2A).
 * @returns {Promise<Array<{nombre, alias, usuario, emoji, ok, error?}>>}
 */
export async function crearEstudiantes(docente, clase, nombres, { alProgreso = () => {}, clave: claveElegida } = {}) {
  const clave = String(clase.claveAlumnos || claveElegida || claveSugerida(clase)).trim().toUpperCase();
  if (!claveValida(clave)) throw new Error('El código de acceso debe tener de 6 a 12 letras o números, sin espacios ni tildes.');
  const ocupada = await store.leer(`class_access/${clave}`).catch((e) => { if (e?.code === 'permission-denied') throw new Error('Faltan publicar las reglas de seguridad nuevas en Firebase (Firestore → Reglas). Pídele al administrador que las actualice.'); return null; });
  if (ocupada && ocupada.classId !== clase.id) throw new Error('Ese código de acceso ya lo usa otra clase. Elige otro (por ejemplo, agrega el nombre del colegio).');
  if (!clase.claveAlumnos) { await actualizarClase(clase, { claveAlumnos: clave }); clase.claveAlumnos = clave; }
  const fb = state.modo === 'firebase' ? await obtenerFirebase() : null;
  let auth2 = null;
  if (fb) {
    let app2;
    try { app2 = fb.appMod.getApp('teclea-secundaria'); } catch { app2 = fb.appMod.initializeApp(CONFIG.firebase, 'teclea-secundaria'); }
    auth2 = fb.au.getAuth(app2);
  }
  const previas = (await inscripcionesDocente(docente)).filter((i) => i.classId === clase.id);
  const usados = new Set(previas.map((i) => i.usuario).filter(Boolean));
  let n = 0, indiceAnimal = previas.length;
  const salida = [];
  for (const bruto of nombres) {
    const nombre = bruto.trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!nombre) continue;
    alProgreso(++n, nombres.length, nombre);
    const base = slugUsuario(nombre) || 'alumno';
    let usuario = base, k = 1;
    while (usados.has(usuario)) usuario = `${base.slice(0, 20)}${++k}`;
    usados.add(usuario);
    const alias = nombreCorto(nombre), emoji = ANIMALES[indiceAnimal++ % ANIMALES.length];
    try {
      let uid;
      if (auth2) {
        const cred = await fb.au.createUserWithEmailAndPassword(auth2, `${usuario}.${clave.toLowerCase()}@${CONFIG.dominioPin}`, clave);
        uid = cred.user.uid;
        await fb.au.signOut(auth2).catch(() => {});
      } else uid = `demo-${nuevoId()}`;
      const perfil = { ...perfilNuevo({ uid, nombre, rol: 'estudiante', grado: clase.grado, authTipo: 'pin' }), apodo: alias, avatar: { emoji, fondo: 'violeta', marco: null, accesorios: [] },
        creadoPor: docente.uid, creadoEn: store.ahora(), consentimiento: { porDocente: true, en: Date.now() } };
      await store.esperarMax(store.lote([
        { tipo: 'set', ruta: `users/${uid}`, datos: perfil },
        { tipo: 'set', ruta: `enrollments/${clase.id}_${uid}`, datos: {
          uid, classId: clase.id, docenteId: docente.uid, codigo: clase.codigo, alias, avatar: { emoji, fondo: 'violeta' }, grado: clase.grado,
          estado: 'activo', stats: statsVacias(), unidoEn: store.ahora(), ultimaConexion: store.ahora(), pin: clave, usuario } },
      ]));
      salida.push({ nombre, alias, usuario, emoji, ok: true });
    } catch (e) {
      salida.push({ nombre, alias, usuario, emoji, ok: false, error: e?.code === 'auth/email-already-in-use' ? 'Ya existe' : (e?.code || e?.message || 'Error') });
    }
  }
  try { await publicarLista(docente, clase); } catch (e) { console.warn('[lista] no se pudo publicar', e?.code || e); salida.errorLista = e?.code === 'permission-denied' ? 'permiso' : (e?.code || 'error'); }
  return salida;
}

/* ═════════════ Tareas y ejercicios del docente ═════════════ */
export async function crearTarea(docente, clase, { titulo, tipo, refId, instrucciones = '', vence = null }) {
  const id = nuevoId();
  const datos = { classId: clase.id, docenteId: docente.uid, titulo: titulo.trim().slice(0, 120), tipo, refId, instrucciones: instrucciones.slice(0, 1000), activa: true, creadoEn: store.ahora() };
  if (vence) datos.vence = vence;
  await store.esperarMax(store.escribir(`assignments/${id}`, datos));
  return { id, ...datos, creadoEn: Date.now() };
}
export const tareasDeClase = (docente, clase) => store.consultar('assignments', { donde: [['classId', '==', clase.id], ['docenteId', '==', docente.uid]] });
export const eliminarTarea = (t) => store.esperarMax(store.borrar(`assignments/${t.id}`));
export const entregasDeTarea = (docente, tarea) => store.consultar('submissions', { donde: [['assignmentId', '==', tarea.id], ['docenteId', '==', docente.uid]] });

export async function crearEjercicioPropio(docente, clase, { titulo, texto }) {
  const id = nuevoId();
  const datos = { docenteId: docente.uid, classId: clase?.id ?? null, titulo: titulo.trim().slice(0, 120), texto: texto.trim().slice(0, 5000), creadoEn: store.ahora() };
  await store.esperarMax(store.escribir(`custom_exercises/${id}`, datos));
  return { id, ...datos };
}
export const ejerciciosDeClase = (docente, clase) => store.consultar('custom_exercises', { donde: [['classId', '==', clase.id], ['docenteId', '==', docente.uid]] });
export const leerEjercicio = (id) => store.leer(`custom_exercises/${id}`);

/** Tareas de las clases del estudiante, con su entrega (si la hay). */
export async function tareasEstudiante(user) {
  const insc = await cargarInscripciones(user.uid);
  const lista = [];
  for (const i of insc) {
    const [ts, subs] = await Promise.all([
      store.consultar('assignments', { donde: [['classId', '==', i.classId]] }).catch(() => []),
      store.consultar('submissions', { donde: [['uid', '==', user.uid], ['classId', '==', i.classId]] }).catch(() => []),
    ]);
    for (const t of ts.filter((x) => x.activa !== false)) lista.push({ tarea: t, entrega: subs.find((s) => s.assignmentId === t.id) || null, classId: i.classId });
  }
  return lista.sort((a, b) => (a.tarea.vence || 9e15) - (b.tarea.vence || 9e15));
}

/** Tras terminar una actividad: entrega automáticamente las tareas que coincidan. Devuelve las tareas entregadas. */
export async function entregarTareas(user, { tipo, refId, resultado, sesionId }) {
  const hechas = [];
  try {
    for (const { tarea, entrega } of await tareasEstudiante(user)) {
      if (entrega || tarea.tipo !== tipo || tarea.refId !== refId) continue;
      const tarde = tarea.vence && Date.now() > tarea.vence;
      await store.esperarMax(store.escribir(`submissions/${tarea.id}_${user.uid}`, {
        uid: user.uid, assignmentId: tarea.id, classId: tarea.classId, docenteId: tarea.docenteId, sessionId: sesionId || '',
        wpm: Math.min(200, resultado.ppm), precision: Math.min(100, resultado.precision), estado: tarde ? 'tarde' : 'entregada', enviadaEn: store.ahora() }));
      hechas.push(tarea);
    }
  } catch (e) { console.warn('[tareas]', e?.code || e); }
  return hechas;
}

/* ═════════════ Ranking positivo y reto de la clase ═════════════ */
export const rankingDeClase = (classId) => store.consultar(`classes/${classId}/ranking`, {});
export const aportesDeClase = (classId) => store.consultar(`classes/${classId}/aportes`, {});

let cacheCfg = { uid: null, t: 0, v: null };
/** Mundos que el docente abrió o cerró (unión de todas las clases del estudiante). Con caché de 60 s. */
export async function opcionesDeClases(user) {
  if (cacheCfg.uid === user.uid && Date.now() - cacheCfg.t < 60000) return cacheCfg.v;
  const abiertos = new Set(), cerrados = new Set();
  try {
    for (const { clase } of await misClases(user)) { (clase?.config?.mundosAbiertos || []).forEach((n) => abiertos.add(n)); (clase?.config?.mundosBloqueados || []).forEach((n) => cerrados.add(n)); }
  } catch { /* sin permiso o sin red: se usan las reglas normales */ }
  cacheCfg = { uid: user.uid, t: Date.now(), v: { mundosAbiertos: [...abiertos], mundosBloqueados: [...cerrados] } };
  return cacheCfg.v;
}

/**
 * Igual que opcionesDeClases pero sin hacer esperar la pantalla: si tarda más de `ms`, se sigue con las reglas normales
 * (la consulta continúa en segundo plano y queda en caché para la próxima vez).
 */
export function opcionesRapidas(user, ms = 600) {
  return Promise.race([opcionesDeClases(user), new Promise((r) => setTimeout(() => r({ mundosAbiertos: [], mundosBloqueados: [] }), ms))]);
}
