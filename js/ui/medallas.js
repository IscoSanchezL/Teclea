/**
 * Medallas dibujadas en SVG: metal pulido con corona de laurel, cinta en V, argolla y emblema en relieve.
 * medallaSVG({ nivel: 'oro', icono: 'flame', tam: 96, bloqueada: false })
 * Al pasar el puntero (o el dedo) la medalla se inclina en 3D y el brillo la recorre. Sin imágenes externas.
 */
import { marcadoIcono } from './icons.js';

const NIVELES = {
  bronce:   { a: '#FFD2AE', b: '#C9733C', c: '#6B3314', cinta: ['#D9824E', '#8A4421'], banda: 'rgba(255,225,200,.45)' },
  plata:    { a: '#FFFFFF', b: '#B7BFCD', c: '#586275', cinta: ['#3F66D6', '#1E3A9E'], banda: 'rgba(255,255,255,.85)' },
  oro:      { a: '#FFF3B0', b: '#F2B01E', c: '#8C5600', cinta: ['#F7A92A', '#C97806'], banda: 'rgba(255,240,170,.5)' },
  diamante: { a: '#EAFCFF', b: '#4FC3F0', c: '#195F9C', cinta: ['#3DB8F0', '#1B78B8'], banda: 'rgba(230,252,255,.55)' },
  arcoiris: { a: '#F1E6FF', b: '#8A70FA', c: '#3A25AE', cinta: ['#9A82FF', '#4527B8'], banda: 'rgba(255,255,255,.5)' },
};
let n = 0;

/** Una hoja de laurel apuntando hacia `rot` grados. */
const hoja = (x, y, rot, l = 7.4, w = 2.9) =>
  `<path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)})" d="M0 0C${(l * .3).toFixed(1)} ${(-w * 1.35).toFixed(1)} ${(l * .78).toFixed(1)} ${-w} ${l} 0C${(l * .78).toFixed(1)} ${w} ${(l * .3).toFixed(1)} ${(w * 1.35).toFixed(1)} 0 0Z"/>`;

/** Rama de laurel (lado izquierdo); la derecha es su espejo. */
function rama() {
  const cx = 50, cy = 86, partes = [];
  for (let i = 0; i < 7; i++) {
    const th = 108 + i * 19.5, r = (th * Math.PI) / 180, dir = th + 90;
    for (const [dr, giro] of [[28.2, -34], [23.6, 34]]) {
      partes.push(hoja(cx + dr * Math.cos(r), cy + dr * Math.sin(r), dir + giro, 8.6 - i * .15, 2.7));
    }
  }
  return partes.join('');
}
const RAMA = rama();

export function medallaSVG({ nivel = 'oro', icono = 'star', tam = 96, bloqueada = false } = {}) {
  const t = NIVELES[nivel] || NIVELES.oro, id = `md${++n}`;
  const el = document.createElement('span');
  el.className = `medalla ${bloqueada ? 'medalla--bloqueada' : ''} medalla--${nivel}`;
  el.style.setProperty('--tam', `${tam}px`);
  const borde = nivel === 'arcoiris'
    ? `<linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6B8B"/><stop offset=".3" stop-color="#FFD04A"/><stop offset=".6" stop-color="#3DDBB0"/><stop offset="1" stop-color="#6C4CF5"/></linearGradient>` : '';
  const aro = nivel === 'arcoiris' ? `url(#${id}r)` : `url(#${id}a)`;
  const cuñas = Array.from({ length: 16 }, (_, i) => {
    const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2, R = 33;
    return `<path d="M50 86L${(50 + R * Math.cos(a0)).toFixed(1)} ${(86 + R * Math.sin(a0)).toFixed(1)}A${R} ${R} 0 0 1 ${(50 + R * Math.cos(a1)).toFixed(1)} ${(86 + R * Math.sin(a1)).toFixed(1)}Z" fill="${i % 2 ? '#fff' : '#000'}" opacity="${i % 2 ? .13 : .09}"/>`;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 100 128" width="${tam}" height="${tam * 1.28}" role="img" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}a" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset=".45" stop-color="${t.b}"/><stop offset="1" stop-color="${t.c}"/></linearGradient>
      <linearGradient id="${id}i" x1=".9" y1="1" x2=".1" y2="0"><stop offset="0" stop-color="${t.a}"/><stop offset=".5" stop-color="${t.b}"/><stop offset="1" stop-color="${t.c}"/></linearGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
      <linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.cinta[0]}"/><stop offset="1" stop-color="${t.cinta[1]}"/></linearGradient>
      <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.c}"/><stop offset=".5" stop-color="${t.a}"/><stop offset="1" stop-color="${t.c}"/></linearGradient>
      <radialGradient id="${id}b" cx=".3" cy=".2" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}c"><circle cx="50" cy="86" r="38"/></clipPath>
      <filter id="${id}s" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="2.4"/></filter>
      ${borde}
    </defs>
    <ellipse cx="50" cy="124" rx="28" ry="3.6" fill="#140B4A" opacity=".3" filter="url(#${id}s)"/>
    <!-- cinta en V -->
    <polygon points="10,0 28,0 55,42 41,45" fill="url(#${id}k)"/>
    <polygon points="17,0 21,0 50,43 46,44" fill="${t.banda}"/>
    <polygon points="90,0 72,0 45,42 59,45" fill="url(#${id}k)"/>
    <polygon points="83,0 79,0 50,43 54,44" fill="${t.banda}"/>
    <polygon points="72,0 90,0 88,0 59,45 55,43" fill="#000" opacity=".08"/>
    <polygon points="41,45 55,42 50,50" fill="#000" opacity=".25"/>
    <!-- argolla y pasador -->
    <ellipse cx="50" cy="44" rx="6.5" ry="5.2" fill="none" stroke="url(#${id}m)" stroke-width="2.6"/>
    <rect x="43.5" y="46.5" width="13" height="7.5" rx="2.2" fill="url(#${id}m)"/>
    <!-- disco -->
    <circle cx="50" cy="86" r="38.6" fill="#000" opacity=".22" transform="translate(0 1.6)"/>
    <circle cx="50" cy="86" r="38" fill="${aro}"/>
    <circle cx="50" cy="86" r="38" fill="none" stroke="url(#${id}h)" stroke-width="2.2"/>
    <circle cx="50" cy="86" r="35" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.1"/>
    <circle cx="50" cy="86" r="34.2" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>
    <circle cx="50" cy="86" r="33" fill="url(#${id}i)"/>
    <g>${cuñas}</g>
    <!-- corona de laurel -->
    <g fill="${t.a}" fill-opacity=".92" stroke="${t.c}" stroke-opacity=".7" stroke-width=".5" style="filter:drop-shadow(0 .7px .5px rgba(0,0,0,.35))">${RAMA}<g transform="translate(100 0) scale(-1 1)">${RAMA}</g></g>
    <g fill="#fff" opacity=".22">${'<ellipse cx="26" cy="75" rx="1.6" ry=".7" transform="rotate(-50 26 75)"/><ellipse cx="74" cy="75" rx="1.6" ry=".7" transform="rotate(50 74 75)"/>'}</g>
    <path d="M44 112.5Q50 116 56 112.5" fill="none" stroke="url(#${id}m)" stroke-width="2.4" stroke-linecap="round"/>
    <!-- emblema en relieve -->
    <circle cx="50" cy="86" r="17" fill="url(#${id}a)"/>
    <circle cx="50" cy="86" r="17" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.2"/>
    <circle cx="50" cy="86" r="15.4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
    <g transform="translate(35.4 71.4) scale(1.22)" color="#000" opacity=".4"><g transform="translate(0 .9)">${marcadoIcono(icono)}</g></g>
    <g transform="translate(35.4 71.4) scale(1.22)" color="#fff" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.2))">${marcadoIcono(icono)}</g>
    <!-- brillos -->
    <circle cx="50" cy="86" r="38" fill="url(#${id}b)"/>
    <path d="M18 78A33 33 0 0 1 56 54" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>
    <g clip-path="url(#${id}c)"><g class="medalla__brillo"><rect x="-30" y="40" width="26" height="100" fill="url(#${id}g)" transform="rotate(24 50 86)"/></g></g>
    <path class="medalla__chispa" d="M80 52l1.5 4.2 4.2 1.5-4.2 1.5-1.5 4.2-1.5-4.2-4.2-1.5 4.2-1.5z" fill="#fff"/>
    <path class="medalla__chispa medalla__chispa--2" d="M17 100l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" fill="#fff"/>
  </svg>`;

  // Inclinación 3D siguiendo el puntero (solo con puntero fino; en táctil se ve fija)
  if (!bloqueada) {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--ry', `${(x * 26).toFixed(1)}deg`); el.style.setProperty('--rx', `${(-y * 26).toFixed(1)}deg`);
      el.style.setProperty('--gx', `${((x + .5) * 150).toFixed(0)}px`);
      el.classList.add('medalla--viva');
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.style.removeProperty('--gx'); el.classList.remove('medalla--viva'); });
  }
  return el;
}
