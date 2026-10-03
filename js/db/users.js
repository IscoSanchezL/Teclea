/**
 * Capa de datos de usuarios. Misma API en modo demo (localStorage) y Firebase (Firestore).
 * Las REGLAS de Firestore son la verdadera barrera de seguridad; aquí solo
 * enviamos los campos permitidos.
 */
import { CONFIG } from '../core/config.js';
import { almacen } from '../core/utils.js';
import { state } from '../core/state.js';
import { obtenerFirebase } from './firebase.js';

const CLAVE_DEMO = 'teclea:demo-user';

/** Perfil nuevo con valores iniciales (las reglas exigen xp, monedas y racha en 0). */
export function perfilNuevo({ uid, nombre, email = null, rol = 'estudiante', grado = null, authTipo = 'google' }) {
  return {
    uid,
    nombre: String(nombre || 'Estudiante').slice(0, 80),
    apodo: String(nombre || 'Amig@').split(' ')[0].slice(0, 30),
    email,
    rol,
    grado,
    avatar: { emoji: '🦊', fondo: 'violeta', marco: null, accesorios: [] },
    xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, ultimoDia: null, protectores: 0,
    prefs: {},
    authTipo,
    activo: true,
  };
}

/** Decide el rol que el cliente SOLICITA. Las reglas de Firestore validan y pueden rechazarlo. */
export async function rolSolicitado(email) {
  if (!email) return 'estudiante';
  const correo = email.toLowerCase();
  if (correo === CONFIG.adminEmail.toLowerCase()) return 'admin';
  const fb = await obtenerFirebase();
  try {
    const snap = await fb.fs.getDoc(fb.fs.doc(fb.db, 'teacher_whitelist', correo));
    if (snap.exists()) return 'docente';
  } catch { /* sin permiso o sin red → estudiante */ }
  return 'estudiante';
}

// ───────────────────────── Firebase ─────────────────────────

export async function leerPerfil(uid) {
  const fb = await obtenerFirebase();
  const snap = await fb.fs.getDoc(fb.fs.doc(fb.db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function crearPerfil(perfil) {
  const fb = await obtenerFirebase();
  const { serverTimestamp, setDoc, doc } = fb.fs;
  const datos = {
    ...perfil,
    consentimiento: { version: CONFIG.versionAvisoPrivacidad, aceptadoEn: serverTimestamp() },
    creadoEn: serverTimestamp(),
    ultimaConexion: serverTimestamp(),
    creadoPor: perfil.creadoPor ?? null,
  };
  await setDoc(doc(fb.db, 'users', perfil.uid), datos);
  return leerPerfil(perfil.uid);
}

/** Campos que el estudiante puede editar por sí mismo (coinciden con firestore.rules). */
const CAMPOS_EDITABLES = ['apodo', 'grado', 'avatar', 'prefs', 'ultimaConexion', 'solicitudEliminacion'];

export async function actualizarPerfil(uid, parche) {
  const permitido = Object.fromEntries(Object.entries(parche).filter(([k]) => CAMPOS_EDITABLES.includes(k)));
  if (!Object.keys(permitido).length) return;

  if (state.modo === 'firebase') {
    const fb = await obtenerFirebase();
    const resuelto = { ...permitido };
    if ('ultimaConexion' in resuelto) resuelto.ultimaConexion = fb.fs.serverTimestamp();
    if ('solicitudEliminacion' in resuelto) resuelto.solicitudEliminacion = fb.fs.serverTimestamp();
    await fb.fs.updateDoc(fb.fs.doc(fb.db, 'users', uid), resuelto);
    return;
  }
  // Modo demo: se guarda en este navegador
  const guardado = almacen.leer(CLAVE_DEMO);
  if (guardado) almacen.guardar(CLAVE_DEMO, { ...guardado, ...permitido });
}

// ───────────────────────── Demo local ─────────────────────────

export const demo = {
  leer: () => almacen.leer(CLAVE_DEMO),
  crear(rol, grado = 3) {
    const nombres = { estudiante: 'Sofía Demo', docente: 'Profe Demo', admin: 'Admin Demo' };
    const perfil = {
      ...perfilNuevo({ uid: `demo-${rol}`, nombre: nombres[rol], rol, grado: rol === 'estudiante' ? grado : null, authTipo: 'demo' }),
      xp: rol === 'estudiante' ? 140 : 0, monedas: rol === 'estudiante' ? 35 : 0, racha: rol === 'estudiante' ? 3 : 0,
    };
    almacen.guardar(CLAVE_DEMO, perfil);
    return perfil;
  },
  borrar: () => almacen.borrar(CLAVE_DEMO),
};
