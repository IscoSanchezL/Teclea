/**
 * Medallas dibujadas en SVG (aspecto brillante tipo 3D), sin imágenes externas.
 * medallaSVG({ nivel: 'oro', icono: 'flame', tam: 96, bloqueada: false })
 */
import { marcadoIcono } from './icons.js';

const NIVELES = {
  bronce:   { a: '#F2B38A', b: '#B8662E', c: '#7A3F17', borde: '#E8A06B' },
  plata:    { a: '#F3F5F9', b: '#A9B3C4', c: '#667085', borde: '#DCE1EA' },
  oro:      { a: '#FFE58A', b: '#F5B301', c: '#A66F00', borde: '#FFD54A' },
  diamante: { a: '#B9F3FF', b: '#38B6E8', c: '#1D6FA5', borde: '#8CE3FF' },
  arcoiris: { a: '#FFB3D1', b: '#8A70FA', c: '#3F2BB8', borde: '#FFFFFF' },
};
let n = 0;

export function medallaSVG({ nivel = 'oro', icono = 'star', tam = 96, bloqueada = false } = {}) {
  const t = NIVELES[nivel] || NIVELES.oro, id = `md${++n}`;
  const el = document.createElement('span');
  el.className = `medalla ${bloqueada ? 'medalla--bloqueada' : ''}`;
  el.style.setProperty('--tam', `${tam}px`);
  const extra = nivel === 'arcoiris'
    ? `<linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6B5B"/><stop offset=".35" stop-color="#FFD04A"/><stop offset=".65" stop-color="#3DDBB0"/><stop offset="1" stop-color="#6C4CF5"/></linearGradient>` : '';
  el.innerHTML = `<svg viewBox="0 0 100 110" width="${tam}" height="${tam * 1.1}" role="img" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset=".55" stop-color="${t.b}"/><stop offset="1" stop-color="${t.c}"/></linearGradient>
      <radialGradient id="${id}b" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient>
      ${extra}
    </defs>
    <path d="M30 66 L20 104 L36 96 L44 108 L52 70z" fill="#E4405F"/><path d="M70 66 L80 104 L64 96 L56 108 L48 70z" fill="#B3243F"/>
    <circle cx="50" cy="46" r="40" fill="${nivel === 'arcoiris' ? `url(#${id}r)` : `url(#${id}a)`}"/>
    <circle cx="50" cy="46" r="33" fill="${t.c}" opacity=".35"/>
    <circle cx="50" cy="46" r="31" fill="url(#${id}a)"/>
    <circle cx="50" cy="46" r="40" fill="none" stroke="${t.borde}" stroke-width="2" opacity=".9"/>
    <circle cx="50" cy="46" r="40" fill="url(#${id}b)"/>
    <g transform="translate(32 28) scale(1.5)" color="#fff" style="filter:drop-shadow(0 2px 1px rgba(0,0,0,.35))">${marcadoIcono(icono)}</g>
  </svg>`;
  return el;
}
