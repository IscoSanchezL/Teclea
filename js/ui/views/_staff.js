/** Piezas compartidas por las vistas sobrias (docente/administración). */
import { h } from '../../core/utils.js';
import { icono } from '../icons.js';

export const ETIQUETA_ESTADO = { ok: 'Al día', destacado: 'Destacado', atrasado: 'Atrasado', inactivo: 'Inactivo' };

export const pill = (estado) => h('span', { class: `pill pill--${estado}` }, h('i'), ETIQUETA_ESTADO[estado] || estado);

export function avisoDemo(texto = 'Estás viendo datos de ejemplo. Se conectarán a tus clases reales en la Fase 5.') {
  return h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, texto));
}
