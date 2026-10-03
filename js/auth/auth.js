/**
 * Autenticación.
 *  1) Google (cuenta personal o institucional Workspace).
 *  2) Código de acceso de la clase (ej. TECLA2A) y toque de su nombre en la lista (niños de 2.º, sin cuenta Google).
 *     Internamente es correo/contraseña de Firebase con un correo "inventado":
 *        correo     = usuario.CODIGO@alumnos.teclea.local
 *        contraseña = CLAVE de la clase (≥ 6 caracteres, la misma para todo el grupo; ej. TECLA2A)
 *     El docente crea estas cuentas (Fase 5) con una instancia secundaria de la app.
 *  3) Modo demo local (si Firebase no está configurado).
 */
import { CONFIG, firebaseConfigurado } from '../core/config.js';
import { state, setState } from '../core/state.js';
import { slugUsuario } from '../core/utils.js';
import { obtenerFirebase } from '../db/firebase.js';
import { actualizar } from '../db/store.js';
import { leerPerfil, crearPerfil, perfilNuevo, rolSolicitado, actualizarPerfil, demo } from '../db/users.js';
import { aplicarEstiloUsuario, cambiarPrefs } from '../ui/theme.js';

/** Mensajes amables para los errores de Firebase. */
const ERRORES = {
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar. ¡Inténtalo otra vez!',
  'auth/cancelled-popup-request': 'Ya hay una ventana de Google abierta.',
  'auth/network-request-failed': 'No hay conexión a internet. Revisa tu red e inténtalo de nuevo.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a probar.',
  'auth/invalid-credential': 'Usuario, PIN o código de clase incorrectos. Pídele ayuda a tu profe.',
  'auth/user-not-found': 'Usuario, PIN o código de clase incorrectos. Pídele ayuda a tu profe.',
  'auth/wrong-password': 'Usuario, PIN o código de clase incorrectos. Pídele ayuda a tu profe.',
  'auth/unauthorized-domain': 'Este sitio aún no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).',
  'permission-denied': 'No tienes permiso para esa acción. Avísale a tu docente o al administrador: faltan publicar las reglas nuevas.',
};
export const mensajeError = (e) => ERRORES[e?.code] || 'Algo salió mal. Inténtalo de nuevo en un momento.';

/** Aplica el perfil cargado: estado, estilo por grado y preferencias guardadas en la nube. */
function activarPerfil(perfil) {
  setState({ user: perfil });
  aplicarEstiloUsuario(perfil);
  if (perfil?.prefs && Object.keys(perfil.prefs).length) cambiarPrefs(perfil.prefs);
}

async function perfilDesdeFirebase(fbUser) {
  let perfil = await leerPerfil(fbUser.uid);
  if (!perfil) {
    const email = fbUser.email || null;
    const intencion = sessionStorage.getItem('teclea:intencion') === 'docente';
    const rol = await rolSolicitado(fbUser.emailVerified ? email : null, { intencionDocente: intencion });
    perfil = await crearPerfil(perfilNuevo({
      uid: fbUser.uid, nombre: fbUser.displayName || 'Estudiante', email, rol,
      authTipo: fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'pin',
    }));
  } else {
    actualizarPerfil(fbUser.uid, { ultimaConexion: true }).catch(() => {});
    // La cuenta del administrador siempre figura como admin (por si se registró antes como estudiante).
    if (fbUser.emailVerified && fbUser.email?.toLowerCase() === CONFIG.adminEmail.toLowerCase() && perfil.rol !== 'admin') {
      try { await actualizar(`users/${fbUser.uid}`, { rol: 'admin' }); perfil.rol = 'admin'; } catch { /* reglas */ }
    }
  }
  try { sessionStorage.removeItem('teclea:intencion'); } catch { /* sin almacenamiento */ }
  return perfil;
}

/** Arranque: restaura la sesión (si existe) y deja state.listo = true. */
export async function iniciarAuth() {
  if (!firebaseConfigurado()) {
    setState({ modo: 'demo' });
    const d = await demo.leer();
    if (d) activarPerfil(d);
    setState({ listo: true });
    return;
  }

  setState({ modo: 'firebase' });
  try {
    const fb = await obtenerFirebase();
    // Resultado de un inicio por redirección (respaldo cuando el navegador bloquea ventanas emergentes).
    await fb.au.getRedirectResult(fb.auth).catch(() => null);
    await new Promise((resolver) => {
      let primera = true;
      fb.au.onAuthStateChanged(fb.auth, async (fbUser) => {
        try {
          if (fbUser) activarPerfil(await perfilDesdeFirebase(fbUser));
          else { setState({ user: null }); aplicarEstiloUsuario(null); }
        } catch (e) {
          console.error('[auth] no se pudo cargar el perfil', e);
          setState({ user: null });
        }
        if (primera) { primera = false; resolver(); }
      });
    });
  } catch (e) {
    console.error('[auth] Firebase no pudo iniciar; sigo en modo demo', e);
    setState({ modo: 'demo' });
    const d = await demo.leer();
    if (d) activarPerfil(d);
  }
  setState({ listo: true });
}

export async function entrarConGoogle({ docente = false } = {}) {
  try { sessionStorage.setItem('teclea:intencion', docente ? 'docente' : 'estudiante'); } catch { /* sin almacenamiento */ }
  const fb = await obtenerFirebase();
  const proveedor = new fb.au.GoogleAuthProvider();
  proveedor.setCustomParameters({
    prompt: 'select_account',
    ...(CONFIG.dominioInstitucional ? { hd: CONFIG.dominioInstitucional } : {}),
  });
  try {
    await fb.au.signInWithPopup(fb.auth, proveedor);
  } catch (e) {
    if (e.code === 'auth/popup-blocked') return fb.au.signInWithRedirect(fb.auth, proveedor);
    throw e;
  }
}

/** Ingreso de niños (2.º): código de acceso de la clase (ej. TECLA2A) + el nombre que toca el niño en la lista. */
export async function entrarPorLista({ clave, usuario }) {
  const fb = await obtenerFirebase();
  const k = String(clave).trim().toUpperCase();
  const correo = `${slugUsuario(usuario)}.${k.toLowerCase()}@${CONFIG.dominioPin}`;
  await fb.au.signInWithEmailAndPassword(fb.auth, correo, k);
}

export async function entrarDemo(rol, grado = 3) {
  activarPerfil(await demo.crear(rol, grado));
}

export async function cerrarSesion() {
  if (state.modo === 'demo') {
    demo.borrar();
    setState({ user: null });
    aplicarEstiloUsuario(null);
    return;
  }
  const fb = await obtenerFirebase();
  await fb.au.signOut(fb.auth);
}

/** Guarda cambios del perfil y refresca el estado (usa la capa de datos). */
export async function guardarPerfil(parche) {
  const uid = state.user.uid;
  await actualizarPerfil(uid, parche);
  const user = { ...state.user, ...parche };
  setState({ user });
  if ('grado' in parche) aplicarEstiloUsuario(user);
}
