/**
 * ============================================================
 *  TECLEA · Configuración central
 * ============================================================
 *  Este es el ÚNICO archivo que necesitas editar para
 *  personalizar la plataforma (nombre, colegio, Firebase).
 * ============================================================
 */
export const CONFIG = {
  // ── Identidad (nombre provisional, cámbialo cuando quieras) ──
  appName: 'TECLEA',
  lema: 'Aprende a teclear jugando',
  colegio: 'Mi Colegio',
  contacto: 'soporte@tu-colegio.edu.co',

  // ── Roles y acceso ──
  // Único administrador. Debe coincidir con el correo de firestore.rules (función bootstrapAdmin).
  // Solo esta cuenta de Google (verificada) puede ser administrador.
  adminEmail: 'franksanlo@gmail.com',
  // Dominio de Google Workspace del colegio (ej. 'micolegio.edu.co').
  // Si lo llenas, Google sugerirá esa cuenta institucional. Déjalo '' si no aplica.
  dominioInstitucional: '',
  // Dominio "inventado" para las cuentas con usuario + PIN (nunca recibe correos).
  dominioPin: 'alumnos.teclea.local',

  // ── Privacidad (Ley 1581 de 2012) ──
  versionAvisoPrivacidad: '2026-01',

  // ── Firebase ──
  // Pega aquí el objeto de configuración de tu app web (Consola Firebase →
  // Configuración del proyecto → Tus apps → SDK). Estos valores NO son
  // secretos; la seguridad la dan las reglas de Firestore.
  firebase: {
    apiKey: 'AIzaSyBSwy1zjagQp2oiW4sF6XH3bUFgiFg8Yjk',
    authDomain: 'teclea-colegio.firebaseapp.com',
    projectId: 'teclea-colegio',
    storageBucket: 'teclea-colegio.firebasestorage.app',
    messagingSenderId: '888092917884',
    appId: '1:888092917884:web:b56ad94dd2e0e27d83c9f9',
  },
  // App Check (recomendado): clave pública de reCAPTCHA v3 registrada en Firebase → App Check.
  // Evita que otros sitios o scripts usen tu proyecto. Déjala '' hasta registrarla (ver docs/CONFIABILIDAD.md).
  appCheckSiteKey: '',
  appCheckProveedor: 'v3', // 'enterprise' (Fraud Defense / reCAPTCHA Enterprise) o 'v3' (clásico, obsoleto)
  firebaseSdk: '10.14.1', // versión del SDK modular cargado por CDN

  version: '0.1.0',
};

/** ¿Ya pegaste tu configuración real de Firebase? Si no, la app corre en modo demo local. */
export const firebaseConfigurado = () =>
  !String(CONFIG.firebase.apiKey).startsWith('REEMPLAZA');
