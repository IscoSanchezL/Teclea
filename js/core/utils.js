/**
 * Utilidades pequeñas y sin dependencias.
 */

/** Crea elementos del DOM: h('div', {class:'x', onclick: fn}, 'texto', otroNodo) */
export function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      // Las variables CSS (--x) requieren setProperty; Object.assign no las aplica.
      for (const [prop, valor] of Object.entries(v)) {
        if (prop.startsWith('--')) el.style.setProperty(prop, valor);
        else el.style[prop] = valor;
      }
    }
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  agregar(el, hijos);
  return el;
}

function agregar(el, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo == null || hijo === false) continue;
    el.append(hijo.nodeType ? hijo : document.createTextNode(String(hijo)));
  }
}

export const qs = (sel, raiz = document) => raiz.querySelector(sel);
export const qsa = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ¿El usuario (o su sistema) pidió menos movimiento? */
export const movimientoReducido = () =>
  document.documentElement.dataset.motion === 'reducido';

/** localStorage a prueba de fallos (modo privado, bloqueado, etc.). */
export const almacen = {
  leer(clave, defecto = null) {
    try {
      const v = localStorage.getItem(clave);
      return v == null ? defecto : JSON.parse(v);
    } catch { return defecto; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch { return false; }
  },
  borrar(clave) {
    try { localStorage.removeItem(clave); } catch { /* sin acceso, se ignora */ }
  },
};

/** Anima un número desde su valor actual hasta `hasta` (respeta movimiento reducido). */
export function contar(el, hasta, { duracion = 900 } = {}) {
  const destino = Math.round(Number(hasta) || 0);
  const desde = Number(el.dataset.valor ?? 0);
  el.dataset.valor = destino;
  if (movimientoReducido() || desde === destino) { el.textContent = destino.toLocaleString('es-CO'); return; }
  const t0 = performance.now();
  const paso = (t) => {
    const p = clamp((t - t0) / duracion, 0, 1);
    const suave = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(desde + (destino - desde) * suave).toLocaleString('es-CO');
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/** Anuncia un mensaje a lectores de pantalla. */
export function anunciar(msg) {
  const r = document.getElementById('sr-announcer');
  if (!r) return;
  r.textContent = '';
  setTimeout(() => { r.textContent = msg; }, 50);
}

/** Quita tildes y caracteres raros: "Ñandú Pérez" → "nandu.perez" */
export function slugUsuario(texto) {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24);
}

/** Descarga un objeto como archivo JSON. */
export function descargarJSON(nombre, objeto) {
  const blob = new Blob([JSON.stringify(objeto, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: nombre });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
