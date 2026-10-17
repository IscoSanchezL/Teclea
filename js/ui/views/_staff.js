/** Piezas compartidas por las vistas sobrias (docente/administración). */
import { h } from '../../core/utils.js';
import { icono } from '../icons.js';
import { t } from '../../i18n/index.js';

export const ETIQUETA_ESTADO = { get ok() { return t('estado.ok'); }, get destacado() { return t('estado.destacado'); }, get atrasado() { return t('estado.atrasado'); }, get inactivo() { return t('estado.inactivo'); } };

export const pill = (estado) => h('span', { class: `pill pill--${estado}` }, h('i'), ETIQUETA_ESTADO[estado] || estado);

export function avisoDemo(texto = t('staff.avisoDemo')) {
  return h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, texto));
}
