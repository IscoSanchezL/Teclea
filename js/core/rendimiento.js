/**
 * Modo ligero automático: en equipos modestos (portátiles escolares, Chromebooks) quita desenfoques,
 * cristal esmerilado y animaciones decorativas infinitas, y desactiva el 3D. Todo sigue funcionando igual.
 *  - Se activa de entrada si el equipo declara poca memoria o pocos núcleos.
 *  - Si no, se mide la fluidez real durante los primeros segundos y se activa (y recuerda) si va lenta.
 */
const CLAVE = 'teclea.ligero';
const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento */ } };

export const esLigero = () => document.documentElement.dataset.ligero === '1';

function poner(on) {
  if (on) document.documentElement.dataset.ligero = '1'; else delete document.documentElement.dataset.ligero;
}

/** Llamar lo antes posible (antes de pintar la interfaz). */
export function iniciarRendimiento() {
  const guardado = leer();
  if (guardado === '1') return poner(true);
  if (guardado === '0') return;
  const modesto = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  if (modesto) poner(true);
}

/** Mide la fluidez ~2,5 s con la interfaz ya pintada; si es baja activa el modo ligero y lo recuerda. */
export function vigilarFluidez() {
  if (esLigero() || leer() === '0') return;
  let cuadros = 0, t0 = 0, vistos = 0;
  const paso = (t) => {
    if (document.hidden) { cuadros = 0; t0 = 0; return requestAnimationFrame(paso); }
    if (!t0) t0 = t;
    cuadros++;
    if (t - t0 < 2500) return requestAnimationFrame(paso);
    const fps = (cuadros * 1000) / (t - t0);
    if (fps < 38 && ++vistos) { poner(true); guardar('1'); }
  };
  setTimeout(() => requestAnimationFrame(paso), 1800);
}

/** Para el panel de ajustes: 'auto' | 'si' | 'no'. */
export function fijarLigero(modo) {
  if (modo === 'si') { guardar('1'); poner(true); }
  else if (modo === 'no') { guardar('0'); poner(false); }
  else { try { localStorage.removeItem(CLAVE); } catch { /* ok */ } poner(false); iniciarRendimiento(); }
}
