/**
 * Selector de idioma ES | EN (barra superior y pantalla de entrada).
 * Cambiar el idioma NO recarga la página: main.js se suscribe con alCambiar() y vuelve a pintar.
 */
import { h } from '../core/utils.js';
import { idioma, poner, t } from '../i18n/index.js';

export function selectorIdioma({ clase = '' } = {}) {
  const actual = idioma();
  const boton = (k, txt, nombre) => h('button', {
    type: 'button', 'data-l': k, lang: k, title: nombre, 'aria-label': nombre,
    'aria-pressed': String(actual === k), onclick: () => poner(k),
  }, txt);
  return h('div', { class: `lang ${clase}`.trim(), role: 'group', 'aria-label': t('idioma.selector') },
    boton('es', 'ES', 'Español'), boton('en', 'EN', 'English'));
}
