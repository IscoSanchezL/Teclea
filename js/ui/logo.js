/**
 * Logotipo original: una tecla "T" redondeada con destello.
 * (El nombre se toma de CONFIG.appName; cámbialo sin tocar CSS.)
 */
import { marca } from '../core/marca.js';
import { h } from '../core/utils.js';

let n = 0; // id único por instancia (un gradiente en un SVG oculto no se vería en los demás)

export function logo({ solo = false } = {}) {
  const id = `lg-${++n}`;
  const icono = h('span', { class: 'logo__marca', 'aria-hidden': 'true' });
  if (marca.logo) {
    // Logo personalizado (subido por el administrador)
    icono.append(h('img', { class: 'logo__img', src: marca.logo, alt: '', width: 40, height: 40, decoding: 'async' }));
    return h('span', { class: 'logo' }, icono, solo ? null : h('span', { class: 'logo__texto' }, marca.nombre));
  }
  icono.innerHTML = `
    <svg viewBox="0 0 48 48" width="40" height="40" focusable="false">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#8A70FA"/><stop offset="1" stop-color="#4527B8"/>
        </linearGradient>
      </defs>
      <rect x="3" y="5" width="42" height="40" rx="14" fill="#2B1A7A" opacity=".35"/>
      <rect x="3" y="2" width="42" height="40" rx="14" fill="url(#${id})"/>
      <rect x="6" y="4" width="36" height="14" rx="9" fill="#fff" opacity=".18"/>
      <path d="M15 14h18M24 14v16" stroke="#fff" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <circle cx="38" cy="9" r="3.2" fill="#FFD04A"/>
    </svg>`;
  return h('span', { class: 'logo' }, icono, solo ? null : h('span', { class: 'logo__texto' }, marca.nombre));
}
