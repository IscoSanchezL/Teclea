/**
 * Escena 3D de portada/acceso hecha solo con CSS: teclado inclinado con teclas luminosas por dedo
 * y tarjetas de cristal flotantes con métricas. Muy liviana (≈ 60 elementos, sin imágenes).
 */
import { h, movimientoReducido } from '../core/utils.js';
import { icono } from './icons.js';
import { sparkline } from './graficas.js';
import { anillo } from './componentes.js';
import { medallaSVG } from './medallas.js';

const FILAS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
];
const DEDO = { q: 'menique', a: 'menique', z: 'menique', w: 'anular', s: 'anular', x: 'anular', e: 'medio', d: 'medio', c: 'medio',
  r: 'indice', f: 'indice', v: 'indice', t: 'indice', g: 'indice', b: 'indice', y: 'indice', h: 'indice', n: 'indice', u: 'indice', j: 'indice', m: 'indice',
  i: 'medio', k: 'medio', ',': 'medio', o: 'anular', l: 'anular', '.': 'anular', p: 'menique', 'ñ': 'menique', '-': 'menique' };

let temporizador = null;

export function hero3d({ compacto = false } = {}) {
  const teclas = [];
  const kb = h('div', { class: 'h3d__kb' }, FILAS.map((fila, i) => h('div', { class: `h3d__fila h3d__fila--${i}` },
    fila.map((c) => { const k = h('span', { class: `h3d__k dedo-${DEDO[c]}` }, c.toUpperCase()); teclas.push(k); return k; }))),
    h('div', { class: 'h3d__fila' }, h('span', { class: 'h3d__k h3d__k--espacio dedo-pulgar' })));

  const escena = h('div', { class: `h3d ${compacto ? 'h3d--compacto' : ''}`, 'aria-hidden': 'true', 'data-tilt': '' },
    h('div', { class: 'h3d__halo' }),
    h('div', { class: 'h3d__plano' }, kb),
    h('div', { class: 'h3d__card h3d__card--ppm' },
      h('small', {}, 'Velocidad'), h('strong', {}, '32', h('em', {}, ' PPM')),
      sparkline([12, 15, 14, 19, 22, 25, 29, 32], { ancho: 110, alto: 30, color: '#3DDBB0' })),
    h('div', { class: 'h3d__card h3d__card--pre' },
      anillo({ valor: 0.96, tam: 70, grosor: 8, color: '#FFD04A' }, h('b', {}, '96%')), h('small', {}, 'Precisión')),
    h('div', { class: 'h3d__card h3d__card--racha' }, icono('flame', { tam: 22 }), h('strong', {}, '12'), h('small', {}, 'días de racha')),
    h('div', { class: 'h3d__medalla' }, medallaSVG({ nivel: 'oro', icono: 'bolt', tam: compacto ? 56 : 78 })));

  // Teclas que "se escriben solas" (se detiene si cambias de pantalla o prefieres menos movimiento)
  clearInterval(temporizador);
  if (!movimientoReducido()) {
    temporizador = setInterval(() => {
      if (!escena.isConnected) { clearInterval(temporizador); return; }
      const k = teclas[Math.floor(Math.random() * teclas.length)];
      k.classList.add('h3d__k--on');
      setTimeout(() => k.classList.remove('h3d__k--on'), 220);
    }, 260);
  }
  return escena;
}
