/**
 * Versión de la app: la que está corriendo en este equipo vs la última publicada, y cómo actualizar de verdad.
 * "En ejecución" = la caché del service worker que servía el código cuando se abrió la página (se lee al arrancar,
 * antes de que un service worker nuevo reemplace las cachés).
 */
import { h } from './utils.js';
import { t } from '../i18n/index.js';

let enEjecucion = null;
export function registrarVersionEnEjecucion() {
  if (!enEjecucion) {
    enEjecucion = (async () => {
      try { for (const k of await caches.keys()) { const m = /^teclea-([0-9a-f]{8,})$/.exec(k); if (m) return m[1]; } } catch { /* sin Cache API */ }
      return null;
    })();
  }
  return enEjecucion;
}
export const versionEnEjecucion = () => enEjecucion || registrarVersionEnEjecucion();

export async function versionPublicada() {
  try { return String((await (await fetch('precache.json', { cache: 'no-store' })).json()).version); } catch { return null; }
}

/** Texto "Versión xxxxxxxx" (la publicada) dentro de un elemento. */
export function textoVersion(el, prefijo = 'Versión ') {
  versionPublicada().then((v) => { if (v) el.textContent = `${prefijo}${v.slice(0, 8)}`; });
  return el;
}

/** Borra service workers y cachés y recarga con la versión más nueva. No toca la sesión ni el avance. */
export async function forzarActualizacion() {
  try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch { /* ok */ }
  try { for (const k of await caches.keys()) await caches.delete(k); } catch { /* ok */ }
  const u = new URL(location.href);
  u.searchParams.set('v', String(Date.now()));   // evita la copia HTTP del navegador; el # de la ruta se conserva
  location.replace(u.toString());
}

/** Aviso fijo (no interrumpe) cuando hay una versión más nueva que la que está corriendo. */
let aviso = null;
async function revisar() {
  if (aviso) return;
  const [corriendo, ultima] = await Promise.all([versionEnEjecucion(), versionPublicada()]);
  if (!corriendo || !ultima || corriendo === ultima) return;
  aviso = h('div', { role: 'status', style: { position: 'fixed', left: '50%', bottom: '1rem', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', gap: '.75rem', alignItems: 'center', padding: '.6rem .6rem .6rem 1rem', borderRadius: '999px', background: 'var(--texto, #111)', color: 'var(--fondo, #fff)', boxShadow: '0 10px 30px rgba(0,0,0,.35)', maxWidth: '92vw' } },
    h('span', { style: { fontWeight: 600 } }, t('ver.nueva')),
    h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: forzarActualizacion }, t('ver.actualizar')));
  document.body.append(aviso);
}
export function vigilarVersionNueva() {
  setTimeout(revisar, 6000);
  setInterval(revisar, 10 * 60 * 1000);
}
