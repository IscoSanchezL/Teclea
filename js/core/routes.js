/**
 * Tabla de rutas. Cada ruta se carga bajo demanda (import dinámico),
 * así la portada pesa poco y el resto se descarga solo cuando se visita.
 *
 *  acceso: 'publica' | 'sesion' | ['docente','admin'] (roles permitidos)
 *  nav:    si aparece en la barra lateral / inferior (orden y grupo)
 */
import { state } from './state.js';

const placeholder = (clave) => () =>
  import('../ui/views/proximamente.js').then((m) => ({ render: (ctx) => m.render({ ...ctx, clave }) }));

export const RUTAS = [
  {
    path: '/', acceso: 'publica', titulo: 'Inicio',
    load: () => (state.user ? import('../ui/views/inicio.js') : import('../ui/views/portada.js')),
    nav: { icono: 'home', etiqueta: 'Inicio', orden: 1, movil: true },
  },
  { path: '/entrar', acceso: 'publica', titulo: 'Entrar', load: () => import('../ui/views/entrar.js') },
  { path: '/bienvenida', acceso: 'sesion', titulo: 'Bienvenida', load: () => import('../ui/views/bienvenida.js'), sinNav: true },
  {
    path: '/aprende', acceso: 'sesion', titulo: 'Aprende a teclear', load: placeholder('aprende'),
    nav: { icono: 'keyboard', etiqueta: 'Aprende', orden: 2, movil: true },
  },
  {
    path: '/practica', acceso: 'sesion', titulo: 'Práctica libre', load: placeholder('practica'),
    nav: { icono: 'target', etiqueta: 'Práctica', orden: 3, movil: false },
  },
  {
    path: '/juegos', acceso: 'sesion', titulo: 'Juegos', load: placeholder('juegos'),
    nav: { icono: 'gamepad', etiqueta: 'Juegos', orden: 4, movil: true },
  },
  {
    path: '/logros', acceso: 'sesion', titulo: 'Mis logros', load: placeholder('logros'),
    nav: { icono: 'trophy', etiqueta: 'Logros', orden: 5, movil: true },
  },
  {
    path: '/clases', acceso: 'sesion', titulo: 'Mis clases', load: placeholder('clases'),
    nav: { icono: 'users', etiqueta: 'Mis clases', orden: 6, movil: false },
  },
  {
    path: '/docente', acceso: ['docente', 'admin'], titulo: 'Panel docente', load: placeholder('docente'),
    nav: { icono: 'chart', etiqueta: 'Docente', orden: 7, movil: false },
  },
  {
    path: '/admin', acceso: ['admin'], titulo: 'Panel admin', load: placeholder('admin'),
    nav: { icono: 'shield', etiqueta: 'Admin', orden: 8, movil: false },
  },
  {
    path: '/perfil', acceso: 'sesion', titulo: 'Perfil y ajustes', load: () => import('../ui/views/perfil.js'),
    nav: { icono: 'user', etiqueta: 'Perfil', orden: 9, movil: true },
  },
  { path: '/privacidad', acceso: 'publica', titulo: 'Aviso de privacidad', load: () => import('../ui/views/privacidad.js') },
];

export const RUTA_404 = {
  path: '*', acceso: 'publica', titulo: 'No encontrada', load: () => import('../ui/views/no-encontrada.js'),
};

export const buscarRuta = (path) => RUTAS.find((r) => r.path === path) || RUTA_404;

/** ¿El usuario actual puede ver este ítem de navegación? */
export function visibleParaUsuario(ruta) {
  if (!ruta.nav) return false;
  if (ruta.acceso === 'publica') return true;
  if (!state.user) return false;
  if (ruta.acceso === 'sesion') return true;
  return ruta.acceso.includes(state.user.rol);
}
