/**
 * Estado global mínimo con suscripciones (sin librerías).
 * state.user  → perfil del usuario (o null si no ha entrado)
 * state.prefs → preferencias de accesibilidad / sonido / tema
 * state.modo  → 'demo' (sin Firebase) | 'firebase'
 */
export const PREFS_POR_DEFECTO = Object.freeze({
  tema: 'auto',            // auto | claro | oscuro
  texto: 'normal',         // normal | grande | enorme
  fuente: 'normal',        // normal | dislexia
  daltonico: false,
  movimiento: 'auto',      // auto | reducido
  sonido: true,
  volumen: 0.6,
  vibracion: true,
  tecladoIdioma: 'es-LA',  // es-LA | es-ES
  modoEstricto: false,     // bloquear avance si hay error
  permitirRetroceso: true,
});

export const state = {
  listo: false,
  modo: 'demo',
  user: null,
  prefs: { ...PREFS_POR_DEFECTO },
  ruta: '/',
};

const oyentes = new Set();

/** Actualiza el estado y avisa a los suscriptores. */
export function setState(parche) {
  Object.assign(state, parche);
  oyentes.forEach((fn) => {
    try { fn(state); } catch (e) { console.error('[state] suscriptor falló', e); }
  });
}

/** Suscribe una función; devuelve la función para cancelar. */
export function subscribe(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export const esDocente = () => state.user?.rol === 'docente' || state.user?.rol === 'admin';
export const esAdmin = () => state.user?.rol === 'admin';
