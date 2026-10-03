/**
 * Efectos de interacción "vivos" (todos desactivados con movimiento reducido):
 *  - Foco de luz que sigue al puntero sobre tarjetas (.card, .tile, .modulo, .grado-card…)
 *  - Inclinación 3D suave en elementos con data-tilt
 *  - Botones magnéticos (.btn--lg) que se acercan un poco al puntero
 */
import { movimientoReducido } from '../core/utils.js';

const SELECTOR_LUZ = '.card, .tile, .modulo, .grado-card, .mundo-mini, .paso';

export function iniciarEfectos() {
  if (!window.matchMedia('(hover: hover)').matches) return; // táctil: sin efectos de puntero
  let cuadro = 0, ultimo = null;

  const procesar = () => {
    cuadro = 0;
    if (!ultimo || movimientoReducido()) return;
    const { x, y, objetivo } = ultimo;

    const luz = objetivo.closest?.(SELECTOR_LUZ);
    if (luz) {
      const r = luz.getBoundingClientRect();
      luz.style.setProperty('--mx', `${x - r.left}px`);
      luz.style.setProperty('--my', `${y - r.top}px`);
    }
    const tilt = objetivo.closest?.('[data-tilt]');
    if (tilt) {
      const r = tilt.getBoundingClientRect();
      const nx = (x - r.left) / r.width - 0.5, ny = (y - r.top) / r.height - 0.5;
      tilt.style.setProperty('--ry', `${(nx * 7).toFixed(2)}deg`);
      tilt.style.setProperty('--rx', `${(-ny * 7).toFixed(2)}deg`);
    }
    const mag = objetivo.closest?.('.btn--lg');
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.translate = `${((x - (r.left + r.width / 2)) * 0.12).toFixed(1)}px ${((y - (r.top + r.height / 2)) * 0.18).toFixed(1)}px`;
    }
  };

  document.addEventListener('pointermove', (e) => {
    ultimo = { x: e.clientX, y: e.clientY, objetivo: e.target };
    if (!cuadro) cuadro = requestAnimationFrame(procesar);
  }, { passive: true });

  document.addEventListener('pointerout', (e) => {
    const t = e.target.closest?.('[data-tilt]');
    if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); }
    const m = e.target.closest?.('.btn--lg');
    if (m && !m.contains(e.relatedTarget)) m.style.translate = '';
  }, { passive: true });
}
