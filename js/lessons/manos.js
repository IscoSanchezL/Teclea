/**
 * Guía de manos: dos manos esquemáticas con los 5 dedos; el dedo que corresponde a la tecla siguiente
 * se levanta y se ilumina con su color. Las etiquetas muestran la tecla "de casa" de cada dedo.
 */
import { DEDOS } from './teclado-datos.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };

// x, ancho, alto y base de cada dedo (mano izquierda; la derecha es un espejo)
const IZQ = [
  { id: 'menique-izq', x: 14, w: 34, h: 70, y: 70, casa: 'A' },
  { id: 'anular-izq', x: 56, w: 36, h: 88, y: 52, casa: 'S' },
  { id: 'medio-izq', x: 100, w: 38, h: 98, y: 42, casa: 'D' },
  { id: 'indice-izq', x: 146, w: 38, h: 88, y: 52, casa: 'F' },
  { id: 'pulgar-izq', x: 196, w: 40, h: 56, y: 100, casa: '␣', giro: 38 },
];
const CASA_DER = { 'indice-der': 'J', 'medio-der': 'K', 'anular-der': 'L', 'menique-der': 'Ñ', 'pulgar-der': '␣' };

export function crearManos() {
  const svg = el('svg', { viewBox: '0 0 640 190', class: 'manos', role: 'img', 'aria-hidden': 'true', focusable: 'false' });
  const dedos = {};

  const mano = (lado) => {
    const g = el('g', { class: `mano mano--${lado}` });
    if (lado === 'der') g.setAttribute('transform', 'translate(640 0) scale(-1 1)');
    g.append(el('rect', { x: 8, y: 118, width: 232, height: 66, rx: 30, class: 'mano__palma' }));
    for (const f of IZQ) {
      const id = lado === 'izq' ? f.id : f.id.replace('izq', 'der');
      const dedo = el('g', { class: `dedo-svg dedo-${DEDOS[id].color}`, 'data-dedo': id });
      const r = el('rect', { x: f.x, y: f.y, width: f.w, height: f.h, rx: f.w / 2, class: 'dedo-svg__forma' });
      if (f.giro) r.setAttribute('transform', `rotate(${lado === 'izq' ? -f.giro : f.giro} ${f.x + f.w / 2} ${f.y + f.h})`);
      dedo.append(r);
      // etiqueta con la tecla de casa (se voltea de nuevo en la mano derecha para que no salga espejada)
      const tx = el('text', { x: f.x + f.w / 2, y: f.y + 24, class: 'dedo-svg__tecla', 'text-anchor': 'middle' });
      tx.textContent = lado === 'izq' ? f.casa : CASA_DER[id];
      if (lado === 'der') tx.setAttribute('transform', `translate(${2 * (f.x + f.w / 2)} 0) scale(-1 1)`);
      dedo.append(tx);
      g.append(dedo);
      dedos[id] = dedo;
    }
    return g;
  };
  svg.append(mano('izq'), mano('der'));

  return {
    el: svg,
    /** Enciende un dedo (id de DEDOS) y apaga los demás. `suave` marca un dedo secundario (p. ej. el del Shift). */
    resaltar(principal, secundario = null) {
      for (const [id, nodo] of Object.entries(dedos)) {
        nodo.classList.toggle('dedo-svg--on', id === principal);
        nodo.classList.toggle('dedo-svg--suave', id === secundario && id !== principal);
      }
    },
    limpiar() { this.resaltar(null); },
  };
}
