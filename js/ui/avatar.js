/**
 * Avatar: foto real (si el usuario la subió) o emoji sobre un fondo de color.
 * avatar(usuario, { tam: 'sm'|'md'|'lg'|'xl' })
 */
import { h } from '../core/utils.js';
import { personajeSVG, especieDe } from './personaje.js';

export const FONDOS_AVATAR = ['violeta', 'coral', 'menta', 'sol', 'cielo', 'noche'];
export const EMOJIS_AVATAR = ['🦊', '🐼', '🐯', '🦁', '🦄', '🐙', '🦖', '🐸', '🐬', '🦉', '🐲', '🤖', '🚀', '⚡', '🎮', '🌟'];

export function avatar(u, { tam = 'md', clase = '' } = {}) {
  const a = u?.avatar || {};
  const caja = h('span', { class: `avatar avatar--${tam} ${clase}`, dataset: { fondo: a.fondo || 'violeta', marco: a.marco || '' }, 'aria-hidden': 'true' });
  if (u?.foto) caja.append(h('img', { src: u.foto, alt: '', decoding: 'async', draggable: 'false' }));
  else if (a.mascota) caja.append(personajeSVG(especieDe(a), { acc: a.accesorios || [], cabeza: true, tam: 100, clase: 'avatar__pj' }));
  else {
    caja.append(h('span', { class: 'avatar__emoji' }, a.emoji || '🦊'));
    if (a.accesorios?.length) a.accesorios.slice(0, 2).forEach((e, i) => caja.append(h('span', { class: `avatar__acc avatar__acc--${i}` }, e)));
  }
  return caja;
}
