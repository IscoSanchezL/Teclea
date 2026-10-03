/**
 * Toasts, hojas inferiores (sheet) y diálogos de confirmación accesibles.
 */
import { h } from '../core/utils.js';
import { icono } from './icons.js';

/** Mensaje flotante. tipo: ok | error | info */
export function toast(mensaje, { tipo = 'ok', ms = 3600 } = {}) {
  const raiz = document.getElementById('toast-root');
  if (!raiz) return;
  const ic = tipo === 'ok' ? 'check' : tipo === 'error' ? 'x' : 'info';
  const t = h('div', { class: `toast toast--${tipo}`, role: tipo === 'error' ? 'alert' : 'status' },
    icono(ic, { tam: 20 }), h('span', {}, mensaje));
  raiz.append(t);
  requestAnimationFrame(() => t.classList.add('toast--visible'));
  setTimeout(() => {
    t.classList.remove('toast--visible');
    setTimeout(() => t.remove(), 400);
  }, ms);
}

const FOCOS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/** Abre una capa modal (centro en escritorio, inferior en móvil). Devuelve {cerrar}. */
export function abrirCapa({ titulo, contenido, tipo = 'hoja', alCerrar }) {
  const previo = document.activeElement;
  const raiz = document.getElementById('sheet-root');
  const idTitulo = `capa-titulo-${Date.now()}`;

  const cerrar = () => {
    document.removeEventListener('keydown', teclas);
    fondo.classList.remove('capa--visible');
    setTimeout(() => { fondo.remove(); previo?.focus?.(); alCerrar?.(); }, 250);
  };
  const panel = h('div', { class: `capa__panel capa__panel--${tipo}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': idTitulo },
    h('div', { class: 'capa__cabecera' },
      h('h2', { id: idTitulo, class: 'capa__titulo' }, titulo),
      h('button', { class: 'btn btn--icono btn--suave', 'aria-label': 'Cerrar', onclick: cerrar }, icono('x', { tam: 20 }))),
    h('div', { class: 'capa__cuerpo' }, contenido));
  const fondo = h('div', { class: 'capa', onclick: (e) => { if (e.target === fondo) cerrar(); } }, panel);

  function teclas(e) {
    if (e.key === 'Escape') return cerrar();
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll(FOCOS)];
    if (!f.length) return;
    const primero = f[0], ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }
  document.addEventListener('keydown', teclas);
  raiz.append(fondo);
  requestAnimationFrame(() => { fondo.classList.add('capa--visible'); (panel.querySelector(FOCOS) || panel).focus(); });
  return { cerrar, panel };
}

/** Confirmación con promesa: if (await confirmar({...})) ... */
export function confirmar({ titulo, mensaje, si = 'Sí, continuar', no = 'Cancelar', peligro = false }) {
  return new Promise((resolver) => {
    let decidido = false;
    const fin = (v) => { decidido = true; capa.cerrar(); resolver(v); };
    const capa = abrirCapa({
      titulo, tipo: 'dialogo',
      contenido: h('div', { class: 'pila' },
        h('p', {}, mensaje),
        h('div', { class: 'fila fila--fin' },
          h('button', { class: 'btn btn--suave', onclick: () => fin(false) }, no),
          h('button', { class: `btn ${peligro ? 'btn--peligro' : 'btn--primary'}`, onclick: () => fin(true) }, si))),
      alCerrar: () => { if (!decidido) resolver(false); },
    });
  });
}
