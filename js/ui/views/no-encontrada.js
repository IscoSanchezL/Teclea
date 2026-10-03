import { h } from '../../core/utils.js';
import { mascota } from '../art.js';

export async function render() {
  return h('section', { class: 'proximamente card card--vidrio' },
    mascota('triste', { tam: 'xl' }),
    h('div', { class: 'proximamente__texto' },
      h('h1', {}, 'Esta página se perdió'),
      h('p', {}, 'Tecli buscó por todos lados y no la encontró. Volvamos al inicio.'),
      h('a', { class: 'btn btn--primary', href: '#/' }, 'Ir al inicio')));
}
