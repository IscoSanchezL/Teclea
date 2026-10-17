/**
 * Estado de conexión visible para el estudiante y registro del service worker.
 * - Sin internet: banner ámbar "Sigues practicando; guardamos todo en este dispositivo".
 * - Al volver: banner verde breve "¡Conectado! Sincronizando…".
 * - Nueva versión de la app: aviso para recargar.
 */
import { h } from '../core/utils.js';
import { icono } from './icons.js';
import { toast } from './overlay.js';
import { t } from '../i18n/index.js';

let banner, ocultar;

function mostrar(clase, icon, texto, ms) {
  clearTimeout(ocultar);
  banner.className = `red red--${clase} red--visible`;
  banner.replaceChildren(icono(icon, { tam: 18 }), h('span', {}, texto));
  if (ms) ocultar = setTimeout(() => banner.classList.remove('red--visible'), ms);
}

export function iniciarConexion() {
  banner = h('div', { class: 'red', role: 'status', 'aria-live': 'polite' });
  document.body.append(banner);
  window.addEventListener('offline', () => mostrar('off', 'info', t('red.sinInternet')));
  window.addEventListener('online', () => mostrar('on', 'check', t('red.conectado'), 3500));
  if (!navigator.onLine) mostrar('off', 'info', t('red.sinInternet'));
}

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const habiaControlador = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('[sw] no se registró', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (habiaControlador) toast(t('red.versionNueva'), { tipo: 'info', ms: 6000 });
  });
}

/** Si el servidor rechaza guardar el avance, se avisa (antes fallaba en silencio). */
let ultimoAviso = 0;
document.addEventListener('teclea:fallo-guardado', (e) => {
  if (Date.now() - ultimoAviso < 20000) return;
  ultimoAviso = Date.now();
  console.warn('[datos] no se pudo guardar', e.detail?.codigo);
  toast(t('red.falloGuardado'), { tipo: 'error', ms: 9000 });
});

/** Avance pendiente: la escritura no llega al servidor (red del colegio, sin internet…). */
let avisoLento = null;
document.addEventListener('teclea:guardado-lento', () => {
  if (avisoLento) return;
  avisoLento = true;
  toast(t('red.guardadoLento'), { tipo: 'info', ms: 12000 });
});
document.addEventListener('teclea:guardado-ok', () => {
  if (avisoLento) { avisoLento = null; toast(t('red.guardadoOk'), { tipo: 'ok', ms: 3000 }); }
});
