/**
 * Gráficas SVG ligeras (sin librerías) para los paneles. En Fase 5 las series reales
 * pueden pasar a Chart.js donde se necesite interacción avanzada.
 */
import { h } from '../core/utils.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

/** Mini gráfica de línea con área. */
export function sparkline(valores, { ancho = 96, alto = 28, color = 'var(--primario)', etiqueta = 'Tendencia' } = {}) {
  const min = Math.min(...valores), max = Math.max(...valores), rango = max - min || 1;
  const pts = valores.map((v, i) => [(i / (valores.length - 1)) * (ancho - 4) + 2, alto - 3 - ((v - min) / rango) * (alto - 8)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const svg = el('svg', { viewBox: `0 0 ${ancho} ${alto}`, width: ancho, height: alto, role: 'img', 'aria-label': `${etiqueta}: de ${valores[0]} a ${valores[valores.length - 1]}`, class: 'spark' });
  svg.append(
    el('path', { d: `${d} L${ancho - 2} ${alto} L2 ${alto} Z`, fill: color, opacity: '.12' }),
    el('path', { d, fill: 'none', stroke: color, 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    el('circle', { cx: pts.at(-1)[0], cy: pts.at(-1)[1], r: '2.6', fill: color }));
  return svg;
}

/** Gráfica de barras con cuadrícula y valores. */
export function barras(datos, { alto = 200, unidad = '' } = {}) {
  const W = 560, H = alto, m = { t: 14, r: 8, b: 26, l: 34 };
  const max = Math.ceil(Math.max(...datos.map((d) => d.valor)) / 50) * 50 || 50;
  const bw = (W - m.l - m.r) / datos.length;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'barras', role: 'img', 'aria-label': `Gráfica de barras: ${datos.map((d) => `${d.etiqueta} ${d.valor}${unidad}`).join(', ')}` });
  for (let i = 0; i <= 4; i++) {
    const y = m.t + ((H - m.t - m.b) * i) / 4;
    svg.append(el('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'barras__linea' }));
    const t = el('text', { x: m.l - 6, y: y + 4, class: 'barras__eje', 'text-anchor': 'end' }); t.textContent = Math.round(max - (max * i) / 4);
    svg.append(t);
  }
  datos.forEach((d, i) => {
    const bh = ((H - m.t - m.b) * d.valor) / max, x = m.l + i * bw + bw * 0.2, y = H - m.b - bh;
    svg.append(el('rect', { x, y, width: bw * 0.6, height: bh, rx: 5, class: 'barras__barra', style: `--i:${i}` }));
    const l = el('text', { x: x + bw * 0.3, y: H - 8, class: 'barras__eje', 'text-anchor': 'middle' }); l.textContent = d.etiqueta;
    svg.append(l);
  });
  return svg;
}

const FILAS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];

/** Teclado con mapa de calor (intensidad 0–1 por tecla). */
export function tecladoCalor(mapa) {
  return h('div', { class: 'tkc', role: 'img', 'aria-label': 'Mapa de calor del teclado: mayores errores en ' + Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k.toUpperCase()).join(', ') },
    FILAS.map((f, i) => h('div', { class: `tkc__fila tkc__fila--${i + 1}` },
      [...f].map((c) => h('span', { class: 'tkc__tecla', style: { '--i': mapa[c] || 0 }, title: `${c.toUpperCase()}: ${Math.round((mapa[c] || 0) * 100)} %` }, c.toUpperCase())))));
}
