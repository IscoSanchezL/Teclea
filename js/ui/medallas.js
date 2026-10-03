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
  const dentado = nivel === 'oro' || nivel === 'diamante' || nivel === 'arcoiris';
  const dientes = dentado ? Array.from({ length: 16 }, (_, i) => { const r = (i / 16) * Math.PI * 2; return `<circle cx="${(50 + 38.5 * Math.cos(r)).toFixed(1)}" cy="${(46 + 38.5 * Math.sin(r)).toFixed(1)}" r="4.6"/>`; }).join('') : '';
  const relleno = nivel === 'arcoiris' ? `url(#${id}r)` : `url(#${id}a)`;
  el.innerHTML = `<svg viewBox="0 0 100 112" width="${tam}" height="${tam * 1.12}" role="img" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}a" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset=".5" stop-color="${t.b}"/><stop offset="1" stop-color="${t.c}"/></linearGradient>
      <linearGradient id="${id}i" x1=".85" y1="1" x2=".15" y2="0"><stop offset="0" stop-color="${t.a}"/><stop offset=".55" stop-color="${t.b}"/><stop offset="1" stop-color="${t.c}"/></linearGradient>
      <linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
      <radialGradient id="${id}b" cx=".3" cy=".22" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}c1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6B86"/><stop offset="1" stop-color="#C2294A"/></linearGradient>
      <linearGradient id="${id}c2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E5456B"/><stop offset="1" stop-color="#8F1B38"/></linearGradient>
      <filter id="${id}s" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="2.2"/></filter>
      ${extra}
    </defs>
    <ellipse cx="50" cy="100" rx="26" ry="4.5" fill="#1B0E5C" opacity=".28" filter="url(#${id}s)"/>
    <path d="M28 66 L17 104 L34 96 L43 110 L52 70z" fill="url(#${id}c2)"/><path d="M72 66 L83 104 L66 96 L57 110 L48 70z" fill="url(#${id}c1)"/>
    <path d="M44 74 L43 110 L52 70z" fill="#000" opacity=".18"/>
    <g fill="${relleno}">${dientes}<circle cx="50" cy="46" r="40"/></g>
    <circle cx="50" cy="46" r="40" fill="none" stroke="url(#${id}e)" stroke-width="2.4"/>
    <circle cx="50" cy="46" r="33.5" fill="url(#${id}i)"/>
    <circle cx="50" cy="46" r="33.5" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.6"/>
    <circle cx="50" cy="46" r="29.5" fill="url(#${id}a)"/>
    <circle cx="50" cy="46" r="29.5" fill="none" stroke="url(#${id}e)" stroke-width="1.4"/>
    <path d="M22 40 A28 28 0 0 1 60 19" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="46" r="40" fill="url(#${id}b)"/>
    <g transform="translate(32 28) scale(1.5)" color="${t.c}" opacity=".55" style="transform-box:fill-box"><g transform="translate(0 1.2)">${marcadoIcono(icono)}</g></g>
    <g transform="translate(32 28) scale(1.5)" color="#fff" style="filter:drop-shadow(0 1px 0 rgba(0,0,0,.25))">${marcadoIcono(icono)}</g>
    <circle cx="76" cy="20" r="2" fill="#fff" opacity=".9"/><circle cx="24" cy="66" r="1.2" fill="#fff" opacity=".6"/>
  </svg>`;
  return el;
}
