/**
 * Aviso de privacidad (plantilla) — Ley 1581 de 2012 (habeas data) y Decreto 1377 de 2013.
 * IMPORTANTE: revísalo con el área jurídica del colegio antes de usarlo con estudiantes.
 */
import { marca, colegioMarca } from '../../core/marca.js';
import { CONFIG } from '../../core/config.js';
import { h } from '../../core/utils.js';
import { t } from '../../i18n/index.js';

export async function render() {
  const li = (...x) => h('li', {}, ...x);
  return h('article', { class: 'card card--vidrio texto-legal' },
    h('h1', {}, t('priv.titulo')),
    h('p', { class: 'suave' }, t('priv.version', { v: CONFIG.versionAvisoPrivacidad })),

    h('h2', {}, t('priv.h1')),
    h('p', {}, `${t('priv.p1', { colegio: colegioMarca(), nombre: marca.nombre })} `, h('a', { href: `mailto:${CONFIG.contacto}` }, CONFIG.contacto), '.'),

    h('h2', {}, t('priv.h2')),
    h('p', {}, t('priv.p2')),

    h('h2', {}, t('priv.h3')),
    h('ul', {},
      li(t('priv.l1')),
      li(t('priv.l2')),
      li(t('priv.l3')),
      li(t('priv.l4'))),
    h('p', {}, t('priv.p3')),

    h('h2', {}, t('priv.h4')),
    h('ul', {},
      li(t('priv.n1')),
      li(t('priv.n2')),
      li(t('priv.n3')),
      li(t('priv.n4'))),

    h('h2', {}, t('priv.h5')),
    h('p', {}, t('priv.p4')),

    h('h2', {}, t('priv.h6')),
    h('p', {}, t('priv.p5')),

    h('h2', {}, t('priv.h7')),
    h('p', {}, t('priv.p6')),

    h('a', { class: 'btn btn--suave', href: '#/' }, t('priv.volver')));
}
