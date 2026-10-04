/**
 * Paleta de colores de la interfaz, editable por el administrador.
 * Con DOS colores (principal y de acento) se generan toda la escala violeta/coral, los fondos y las
 * superficies (modo claro y oscuro). Se aplica con una hoja de estilo propia que sobrescribe los tokens de tokens.css.
 * Sin paleta guardada (null) la plataforma se ve con los colores originales.
 */

export const PALETA_ORIGINAL = { primario: '#6C4CF5', acento: '#FF6B5B' };

export const PRESETS = [
  { id: 'violeta', nombre: 'Violeta (original)', primario: '#6C4CF5', acento: '#FF6B5B' },
  { id: 'oceano', nombre: 'Océano', primario: '#1E78C8', acento: '#FFB84D' },
  { id: 'turquesa', nombre: 'Turquesa', primario: '#0E9F9A', acento: '#FF7A59' },
  { id: 'bosque', nombre: 'Bosque', primario: '#2E9E6B', acento: '#F2A93B' },
  { id: 'mandarina', nombre: 'Mandarina', primario: '#F2701A', acento: '#4C6FFF' },
  { id: 'frambuesa', nombre: 'Frambuesa', primario: '#D6336C', acento: '#2FBF9B' },
  { id: 'indigo', nombre: 'Índigo', primario: '#4C5BD4', acento: '#FF8A5C' },
  { id: 'rojo', nombre: 'Rojo escuela', primario: '#C62828', acento: '#F2B632' },
  { id: 'grafito', nombre: 'Grafito', primario: '#4B5563', acento: '#F59E0B' },
  { id: 'lavanda', nombre: 'Lavanda suave', primario: '#8E7CC3', acento: '#F4A7B9' },
];

/* ── Utilidades de color ── */
export const hexValido = (s) => /^#[0-9a-f]{6}$/i.test(String(s || '').trim());
const aRGB = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const luminancia = (hex) => { const [r, g, b] = aRGB(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function contraste(a, b) { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

export function aHSL(hex) {
  const [r, g, b] = aRGB(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; const l = (mx + mn) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; }
  return { h: Math.round(((h * 60) + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
export function deHSL(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
/** Armonías sugeridas a partir de un color. */
export function armonias(hex) {
  const { h, s, l } = aHSL(hex);
  return { Complementario: [deHSL(h + 180, s, l)], Análogos: [deHSL(h - 30, s, l), deHSL(h + 30, s, l)], Triádicos: [deHSL(h + 120, s, l), deHSL(h + 240, s, l)] };
}

/** Texto sobre el color principal: blanco si contrasta (≥ 4.5), si no un azul muy oscuro. */
const tinta = (hex) => (contraste(hex, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#14102E');
const mezcla = (c, pct, con = '#fff') => `color-mix(in srgb, ${c} ${pct}%, ${con})`;

/** Genera el CSS completo para una paleta { primario, acento }. */
export function cssDePaleta({ primario, acento } = {}) {
  if (!hexValido(primario) || !hexValido(acento)) return '';
  const P = primario, A = acento;
  const escala = `
    --violeta-50: ${mezcla(P, 8)}; --violeta-100: ${mezcla(P, 16)}; --violeta-200: ${mezcla(P, 36)}; --violeta-300: ${mezcla(P, 58)}; --violeta-400: ${mezcla(P, 80)};
    --violeta-500: ${P}; --violeta-600: ${mezcla(P, 86, '#000')}; --violeta-700: ${mezcla(P, 70, '#000')}; --violeta-800: ${mezcla(P, 48, '#000')}; --violeta-900: ${mezcla(P, 30, '#000')};
    --coral-300: ${mezcla(A, 50)}; --coral-400: ${mezcla(A, 78)}; --coral-500: ${A}; --coral-600: ${mezcla(A, 84, '#000')};`;
  const claro = `:root, :root[data-theme="light"] {${escala}
    --fondo: ${mezcla(P, 5)}; --superficie-2: ${mezcla(P, 9)};
    --primario: ${P}; --primario-hover: ${mezcla(P, 86, '#000')}; --primario-tinta: ${tinta(P)}; --foco: ${mezcla(P, 70, '#000')}; --enlace: ${mezcla(P, 86, '#000')};
    --borde: color-mix(in srgb, ${P} 18%, transparent);
    --malla-1: ${mezcla(P, 16)}; --malla-2: ${mezcla(P, 8, '#CFEFFF')}; --malla-3: ${mezcla(A, 16)}; --malla-4: ${mezcla(P, 6, '#DFFBEF')};
    --blob-1: ${mezcla(P, 60)}; --blob-2: ${mezcla(A, 62)}; --blob-3: ${mezcla(P, 30, '#5FE3C0')};
    --sombra-boton: 0 4px 0 ${mezcla(P, 70, '#000')}, 0 10px 20px color-mix(in srgb, ${P} 35%, transparent);
  }`;
  const PL = mezcla(P, 62), AL = mezcla(A, 80);
  const oscuro = `:root[data-theme="dark"] {${escala}
    --violeta-500: ${PL};
    --fondo: ${mezcla(P, 14, '#07060F')}; --superficie: ${mezcla(P, 20, '#0A0916')}; --superficie-2: ${mezcla(P, 28, '#0A0916')};
    --primario: ${PL}; --primario-hover: ${mezcla(P, 50)}; --primario-tinta: #14102E; --enlace: ${mezcla(P, 45)};
    --borde: color-mix(in srgb, ${P} 30%, rgba(255, 255, 255, .06)); --coral-500: ${AL};
    --malla-1: ${mezcla(P, 32, '#0A0916')}; --malla-2: ${mezcla(P, 14, '#0B2A44')}; --malla-3: ${mezcla(A, 24, '#0A0916')}; --malla-4: ${mezcla(P, 14, '#0C3A36')};
    --sombra-boton: 0 4px 0 ${mezcla(P, 60, '#000')}, 0 10px 20px rgba(0, 0, 0, .4);
  }`;
  /* Vista sobria (docentes y administración): solo los acentos, los fondos grises se conservan */
  const staff = `:root[data-estilo="staff"] { --primario: ${mezcla(P, 86, '#000')}; --primario-hover: ${mezcla(P, 70, '#000')}; --primario-tinta: ${tinta(P)}; --foco: ${mezcla(P, 86, '#000')}; --enlace: ${mezcla(P, 86, '#000')}; --luz: color-mix(in srgb, ${P} 6%, transparent); --violeta-500: ${P}; --violeta-600: ${mezcla(P, 86, '#000')}; --violeta-700: ${mezcla(P, 72, '#000')}; }
  :root[data-estilo="staff"][data-theme="dark"] { --primario: ${mezcla(P, 62)}; --primario-hover: ${mezcla(P, 46)}; --primario-tinta: #0B1020; --foco: ${mezcla(P, 46)}; --enlace: ${mezcla(P, 46)}; }`;
  return `${claro}\n${oscuro}\n${staff}`;
}

/** Aplica (o quita, con null) la paleta a toda la interfaz. */
export function aplicarPaleta(colores) {
  let el = document.getElementById('tema-marca');
  const css = colores ? cssDePaleta(colores) : '';
  if (!css) { el?.remove(); return; }
  if (!el) { el = document.createElement('style'); el.id = 'tema-marca'; document.head.append(el); }
  el.textContent = css;
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', colores.primario);
}
