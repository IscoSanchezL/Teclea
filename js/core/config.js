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
  // Correo del PRIMER administrador. Debe coincidir con el que
  // pongas en firestore.rules (función bootstrapAdmin).
  adminEmail: 'admin@tu-colegio.edu.co',
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
    apiKey: 'REEMPLAZA_API_KEY',
    authDomain: 'REEMPLAZA.firebaseapp.com',
    projectId: 'REEMPLAZA',
    storageBucket: 'REEMPLAZA.appspot.com',
    messagingSenderId: 'REEMPLAZA',
    appId: 'REEMPLAZA',
  },
  firebaseSdk: '10.14.1', // versión del SDK modular cargado por CDN

  version: '0.1.0',
};

/** ¿Ya pegaste tu configuración real de Firebase? Si no, la app corre en modo demo local. */
export const firebaseConfigurado = () =>
  !String(CONFIG.firebase.apiKey).startsWith('REEMPLAZA');
