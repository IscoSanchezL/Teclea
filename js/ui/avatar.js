/**
 * Avatar: foto real (si el usuario la subió) o emoji sobre un fondo de color.
 * avatar(usuario, { tam: 'sm'|'md'|'lg'|'xl' })
 */
import { h } from '../core/utils.js';

export const FONDOS_AVATAR = ['violeta', 'coral', 'menta', 'sol', 'cielo', 'noche'];
export const EMOJIS_AVATAR = ['🦊', '🐼', '🐯', '🦁', '🦄', '🐙', '🦖', '🐸', '🐬', '🦉', '🐲', '🤖', '🚀', '⚡', '🎮', '🌟'];

export function avatar(u, { tam = 'md', clase = '' } = {}) {
  const a = u?.avatar || {};
  const caja = h('span', { class: `avatar avatar--${tam} ${clase}`, dataset: { fondo: a.fondo || 'violeta', marco: a.marco || '' }, 'aria-hidden': 'true' });
  if (u?.foto) caja.append(h('img', { src: u.foto, alt: '', decoding: 'async', draggable: 'false' }));
  else caja.append(h('span', { class: 'avatar__emoji' }, a.emoji || '🦊'));
  return caja;
}
