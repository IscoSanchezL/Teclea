/** Confeti ligero en <canvas> (≈ 1 KB, sin librerías). No hace nada con movimiento reducido. */
import { movimientoReducido } from '../core/utils.js';

const COLORES = ['#8A70FA', '#FF6B5B', '#FFD04A', '#3DDBB0', '#4FB6FF', '#FF8AD8'];

export function confeti({ cantidad = 110, duracion = 2200, origen = null } = {}) {
  if (movimientoReducido()) return;
  const c = document.createElement('canvas');
  c.className = 'confeti'; c.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.append(c);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const ox = origen?.x ?? innerWidth / 2, oy = origen?.y ?? innerHeight * 0.35;
  const parts = Array.from({ length: cantidad }, () => {
    const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: 6 + Math.random() * 7, h: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: COLORES[(Math.random() * COLORES.length) | 0] };
  });
  const t0 = performance.now();
  (function cuadro(t) {
    const p = (t - t0) / duracion;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const q of parts) {
      q.vy += 0.28; q.vx *= 0.99; q.x += q.vx; q.y += q.vy; q.r += q.vr;
      g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.globalAlpha = Math.max(0, 1 - p * p);
      g.fillStyle = q.col; g.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); g.restore();
    }
    if (p < 1) requestAnimationFrame(cuadro); else c.remove();
  })(t0);
}
