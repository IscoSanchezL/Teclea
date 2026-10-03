/**
 * Logotipo original: una tecla "T" redondeada con destello.
 * (El nombre se toma de CONFIG.appName; cámbialo sin tocar CSS.)
 */
import { marca } from '../core/marca.js';
import { h } from '../core/utils.js';

export function logo({ solo = false } = {}) {
  const icono = h('span', { class: 'logo__marca', 'aria-hidden': 'true' });
  if (marca.logo) {
    // Logo personalizado (subido por el administrador)
    icono.append(h('img', { class: 'logo__img', src: marca.logo, alt: '', width: 40, height: 40, decoding: 'async' }));
    return h('span', { class: 'logo' }, icono, solo ? null : h('span', { class: 'logo__texto' }, marca.nombre));
  }
  icono.append(h('img', { class: 'logo__img', src: 'assets/img/logo-tecla.svg', alt: '', width: 40, height: 40, decoding: 'async' }));
  return h('span', { class: 'logo' }, icono, solo ? null : h('span', { class: 'logo__texto' }, marca.nombre));
}
