/**
 * Cierre de sesión por inactividad (equipos compartidos): se avisa un minuto antes y luego se cierra.
 * Cualquier tecla, clic, toque o desplazamiento reinicia el contador. Estudiantes 20 min; docentes y admin 40 min.
 */
import { state, subscribe, esDocente } from './state.js';

const AVISO_MS = 60 * 1000;
let reloj = null, aviso = null, activo = false, ultimo = 0;

const limite = () => (esDocente() ? 40 : 20) * 60 * 1000;

function programar() {
  clearTimeout(reloj); clearTimeout(aviso);
  if (!state.user) return;
  const ms = limite();
  aviso = setTimeout(async () => { const { toast } = await import('../ui/overlay.js'); toast('Por seguridad, tu sesión se cerrará en 1 minuto si no haces nada.', { tipo: 'info', ms: 8000 }); }, ms - AVISO_MS);
  reloj = setTimeout(async () => {
    if (!state.user) return;
    const { cerrarSesion } = await import('../auth/auth.js');
    const { toast } = await import('../ui/overlay.js');
    await cerrarSesion(); location.hash = '#/entrar';
    toast('Cerramos tu sesión por inactividad. ¡Vuelve a entrar cuando quieras!', { tipo: 'info', ms: 6000 });
  }, ms);
}

function actividad() {
  const t = Date.now();
  if (t - ultimo < 5000) return; // no reprogramar en cada pulsación
  ultimo = t; programar();
}

export function iniciarInactividad() {
  if (activo) return; activo = true;
  ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((e) => document.addEventListener(e, actividad, { passive: true, capture: true }));
  let uid = null;
  subscribe((s) => { const nuevo = s.user?.uid || null; if (nuevo !== uid) { uid = nuevo; ultimo = 0; if (uid) programar(); else { clearTimeout(reloj); clearTimeout(aviso); } } });
}
