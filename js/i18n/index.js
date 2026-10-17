/**
 * Internacionalización (español / inglés) sin dependencias.
 *
 *   t('clave', { x: 3 })      → texto en el idioma activo, con {x} interpolado
 *   idioma()                  → 'es' | 'en'
 *   poner('en')               → cambia el idioma, lo guarda y avisa a quien se suscribió con alCambiar()
 *   alCambiar(fn)             → fn(idioma) se llama en cada cambio (para volver a pintar sin recargar)
 *   loc(obj, 'nombre')        → obj.nombre_en en inglés (si existe); si no, obj.nombre
 *   montar()                  → aplica data-i18n / data-i18n-attr del HTML estático y <html lang>
 *
 * El idioma se guarda en localStorage['labs-lang'] ('es' | 'en'); por defecto el del navegador
 * (si empieza por "en" → inglés; si no, español). Los diccionarios viven en es.js y en.js:
 * deben tener exactamente las mismas claves (lo comprueba tests/i18n.test.mjs).
 */
import es from './es.js';
import en from './en.js';

const D = { es, en };
const CLAVE = 'labs-lang';
const cbs = new Set();

const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
function detectar() {
  const s = leer();
  if (s === 'es' || s === 'en') return s;
  const nav = (typeof navigator !== 'undefined' && (navigator.language || '')) || 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
}
let L = detectar();

/** Traduce una clave. Si falta en el idioma activo usa el español; si tampoco existe, devuelve la clave. */
export function t(k, v) {
  let s = D[L]?.[k];
  if (s === undefined) s = D.es[k] !== undefined ? D.es[k] : k;
  if (v) for (const x in v) s = s.split(`{${x}}`).join(v[x]);
  return s;
}

export const idioma = () => L;
export const locale = () => (L === 'en' ? 'en-US' : 'es-CO');
export const num = (n) => Number(n || 0).toLocaleString(locale());

/** Campo localizado: item.campo_en si el idioma es inglés y existe; si no, item.campo. */
export function loc(obj, campo) {
  if (!obj) return '';
  if (L === 'en' && obj[`${campo}_en`] != null && obj[`${campo}_en`] !== '') return obj[`${campo}_en`];
  return obj[campo];
}

/** Sufijo de carpeta de datos: '' (español) o 'en/' (datos propios del inglés). */
export const carpetaDatos = () => (L === 'en' ? 'en/' : '');

export function alCambiar(f) { cbs.add(f); return () => cbs.delete(f); }

/** Aplica el idioma al HTML estático. */
function aplicar() {
  const r = document.documentElement;
  r.lang = L;
  document.querySelectorAll('[data-i18n]').forEach((e) => { e.innerHTML = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-attr]').forEach((e) => {
    e.getAttribute('data-i18n-attr').split(';').forEach((par) => {
      const i = par.indexOf(':');
      if (i > 0) e.setAttribute(par.slice(0, i).trim(), t(par.slice(i + 1).trim()));
    });
  });
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-l') === L)));
}

export function montar() { aplicar(); }

export function poner(l) {
  if (l !== 'es' && l !== 'en') return;
  if (l === L) return;
  L = l;
  try { localStorage.setItem(CLAVE, l); } catch { /* sin almacenamiento: vale solo para esta sesión */ }
  aplicar();
  cbs.forEach((f) => { try { f(L); } catch (e) { console.error('[i18n] alCambiar falló', e); } });
}

/** Claves de cada diccionario (para las pruebas). */
export const _diccionarios = D;
