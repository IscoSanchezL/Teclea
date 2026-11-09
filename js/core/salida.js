/**
 * Motivo por el que se cerró la sesión (para explicárselo al estudiante en la pantalla de entrada
 * y para saber qué pasó cuando alguien dice "me sacó").
 */
const CLAVE = 'teclea.salida';
export function marcarSalida(motivo) { try { localStorage.setItem(CLAVE, JSON.stringify({ motivo, en: Date.now() })); } catch { /* sin almacenamiento */ } }
/** Motivo reciente (menos de 15 min). NO se borra al leerlo: la pantalla de entrada puede dibujarse dos veces seguidas. */
export function tomarSalida() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    return s && Date.now() - s.en < 15 * 60 * 1000 ? s.motivo : null;
  } catch { return null; }
}
/** Se borra cuando la persona vuelve a entrar. */
export function limpiarSalida() { try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ } }
export const ultimaSalida = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; } };
