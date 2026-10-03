/**
 * Teclado decorativo con colores por dedo (distribución español Latinoamérica).
 * Sirve de vitrina en la portada; el teclado virtual funcional llega en la Fase 2.
 *
 *   const kb = tecladoDeco();  kb.el → nodo;  kb.pulsar('ñ') → ilumina la tecla un instante
 */
import { h } from '../core/utils.js';

const FILAS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const DEDO = {
  q: 'menique', a: 'menique', z: 'menique', p: 'menique', 'ñ': 'menique',
  w: 'anular', s: 'anular', x: 'anular', o: 'anular', l: 'anular',
  e: 'medio', d: 'medio', c: 'medio', i: 'medio', k: 'medio',
  r: 'indice', f: 'indice', v: 'indice', t: 'indice', g: 'indice', b: 'indice',
  y: 'indice', h: 'indice', n: 'indice', u: 'indice', j: 'indice', m: 'indice',
};
const SIN_TILDE = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };

export function tecladoDeco() {
  const teclas = new Map();
  const filas = FILAS.map((fila, i) => h('div', { class: `tkb__fila tkb__fila--${i + 1}` },
    [...fila].map((c) => {
      const t = h('span', { class: `tkb__tecla dedo-${DEDO[c]}`, dataset: { k: c } }, c.toUpperCase());
      // Puntos de referencia táctiles en F y J
      if (c === 'f' || c === 'j') t.append(h('i', { class: 'tkb__punto' }));
      teclas.set(c, t);
      return t;
    })));
  const barra = h('span', { class: 'tkb__tecla tkb__espacio dedo-pulgar', dataset: { k: ' ' } });
  teclas.set(' ', barra);
  const el = h('div', { class: 'tkb', 'aria-hidden': 'true' }, ...filas, h('div', { class: 'tkb__fila tkb__fila--4' }, barra));

  const pulsar = (ch) => {
    const c = String(ch).toLowerCase();
    const t = teclas.get(SIN_TILDE[c] || c);
    if (!t) return;
    t.classList.add('tkb__tecla--on');
    setTimeout(() => t.classList.remove('tkb__tecla--on'), 140);
  };
  return { el, pulsar };
}
