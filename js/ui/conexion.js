/**
 * Estado de conexión visible para el estudiante y registro del service worker.
 * - Sin internet: banner ámbar "Sigues practicando; guardamos todo en este dispositivo".
 * - Al volver: banner verde breve "¡Conectado! Sincronizando…".
 * - Nueva versión de la app: aviso para recargar.
 */
import { h } from '../core/utils.js';
import { icono } from './icons.js';
import { toast } from './overlay.js';

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
  window.addEventListener('offline', () => mostrar('off', 'info', 'Sin internet: sigue practicando, guardamos todo en este dispositivo.'));
  window.addEventListener('online', () => mostrar('on', 'check', '¡Conectado! Sincronizando tu progreso…', 3500));
  if (!navigator.onLine) mostrar('off', 'info', 'Sin internet: sigue practicando, guardamos todo en este dispositivo.');
}

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const habiaControlador = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('[sw] no se registró', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (habiaControlador) toast('Hay una versión nueva de TECLEA. Se aplicará al recargar.', { tipo: 'info', ms: 6000 });
  });
}
