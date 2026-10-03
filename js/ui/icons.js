/**
 * Iconos SVG en línea (propios, trazo redondeado). Heredan el color con currentColor.
 * Son contenido estático y de confianza, por eso se inyectan con innerHTML.
 */
const T = (d) => `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;

const ICONOS = {
  home: T('<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  keyboard: T('<rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>'),
  target: T('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
  gamepad: T('<path d="M6 12h4M8 10v4"/><path d="M15 11.5h.01M18 13.5h.01"/><path d="M7 6h10a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-1.5l-2-2h-3l-2 2H7a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z"/>'),
  trophy: T('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  users: T('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 4.5 5"/>'),
  chart: T('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  shield: T('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  user: T('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  flame: '<path fill="currentColor" d="M12.6 2.2c.3 3.6 4.4 5.2 4.4 9.9a5 5 0 0 1-10 0c0-1.8.8-3.2 1.9-4.2.1 1.7.9 2.8 2 3.1-.9-3.1-.7-6.1 1.7-8.8z"/>',
  coin: T('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5h4.5a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5H15"/>'),
  star: '<path fill="currentColor" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>',
  lock: T('<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  sun: T('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: T('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>'),
  check: T('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  x: T('<path d="M6 6l12 12M18 6L6 18"/>'),
  arrow: T('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  more: '<g fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></g>',
  logout: T('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  play: '<path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/>',
  book: T('<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/>'),
  alert: T('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
  clock: T('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  database: T('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
  download: T('<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>'),
  trash: T('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  sparkle: '<path fill="currentColor" d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z"/>',
  search: T('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  info: T('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  google: '<path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/>',
};

/** icono('home', {tam: 24}) → <span class="icono"> con el SVG dentro */
export function icono(nombre, { tam = 24, titulo = '' } = {}) {
  const span = document.createElement('span');
  span.className = 'icono';
  span.style.setProperty('--tam', `${tam}px`);
  const cuerpo = ICONOS[nombre] || ICONOS.sparkle;
  span.innerHTML = `<svg viewBox="0 0 ${nombre === 'google' ? 24 : 24} 24" width="${tam}" height="${tam}" ${titulo ? `role="img" aria-label="${titulo}"` : 'aria-hidden="true"'} focusable="false">${cuerpo}</svg>`;
  return span;
}
