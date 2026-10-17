import { h } from '../../core/utils.js';
import { mascota } from '../art.js';
import { t } from '../../i18n/index.js';

export async function render() {
  return h('section', { class: 'proximamente card card--vidrio' },
    mascota('triste', { tam: 'xl' }),
    h('div', { class: 'proximamente__texto' },
      h('h1', {}, t('nf.titulo')),
      h('p', {}, t('nf.texto')),
      h('a', { class: 'btn btn--primary', href: '#/' }, t('nf.inicio'))));
}
