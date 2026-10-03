/** Pantalla para docentes que se registraron con Google y esperan la aprobación del administrador. */
import { state } from '../../core/state.js';
import { marca } from '../../core/marca.js';
import { h } from '../../core/utils.js';
import { icono } from '../icons.js';
import { cerrarSesion } from '../../auth/auth.js';
import { navegar } from '../../core/router.js';

export async function render() {
  const u = state.user;
  const rechazado = u.rol === 'rechazado';
  return h('section', { class: 'estado-cuenta card card--vidrio' },
    h('span', { class: `estado-cuenta__ic ${rechazado ? 'estado-cuenta__ic--no' : ''}` }, icono(rechazado ? 'x' : 'clock', { tam: 34 })),
    h('h1', {}, rechazado ? 'Solicitud no aprobada' : 'Tu solicitud está en revisión'),
    h('p', {}, rechazado
      ? `El administrador de ${marca.nombre} no aprobó el acceso docente para ${u.email || 'esta cuenta'}. Si crees que es un error, comunícate con la coordinación del colegio.`
      : `Gracias, ${u.apodo}. El administrador revisará tu solicitud de acceso como docente con la cuenta ${u.email || ''}. Cuando la apruebe, entrarás directo a tu panel — no tienes que hacer nada más.`),
    !rechazado ? h('ul', { class: 'lista-check' },
      h('li', {}, 'Tus datos están protegidos y nadie más puede verlos.'),
      h('li', {}, 'Mientras tanto no tienes acceso a clases ni a estudiantes.'),
      h('li', {}, 'Vuelve a ingresar más tarde con la misma cuenta de Google.')) : null,
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--primary', type: 'button', onclick: () => location.reload() }, 'Revisar de nuevo'),
      h('button', { class: 'btn btn--suave', type: 'button', onclick: async () => { await cerrarSesion(); navegar('/', { reemplazar: true }); } }, 'Cerrar sesión')));
}
