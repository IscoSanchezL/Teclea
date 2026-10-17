/** Pantalla para docentes que se registraron con Google y esperan la aprobación del administrador. */
import { state } from '../../core/state.js';
import { marca } from '../../core/marca.js';
import { h } from '../../core/utils.js';
import { icono } from '../icons.js';
import { cerrarSesion } from '../../auth/auth.js';
import { navegar } from '../../core/router.js';
import { t } from '../../i18n/index.js';

export async function render() {
  const u = state.user;
  const rechazado = u.rol === 'rechazado';
  return h('section', { class: 'estado-cuenta card card--vidrio' },
    h('span', { class: `estado-cuenta__ic ${rechazado ? 'estado-cuenta__ic--no' : ''}` }, icono(rechazado ? 'x' : 'clock', { tam: 34 })),
    h('h1', {}, rechazado ? t('pend.noAprobada') : t('pend.enRevision')),
    h('p', {}, rechazado
      ? t('pend.rechazado', { nombre: marca.nombre, email: u.email || t('pend.estaCuenta') })
      : t('pend.gracias', { n: u.apodo, email: u.email || '' })),
    !rechazado ? h('ul', { class: 'lista-check' },
      h('li', {}, t('pend.l1')),
      h('li', {}, t('pend.l2')),
      h('li', {}, t('pend.l3'))) : null,
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--primary', type: 'button', onclick: () => location.reload() }, t('pend.revisar')),
      h('button', { class: 'btn btn--suave', type: 'button', onclick: async () => { await cerrarSesion(); navegar('/', { reemplazar: true }); } }, t('unirse.cerrar'))));
}
