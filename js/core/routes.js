/**
 * Tabla de rutas. Cada ruta se carga bajo demanda (import dinámico),
 * así la portada pesa poco y el resto se descarga solo cuando se visita.
 *
 *  acceso: 'publica' | 'sesion' | ['docente','admin'] (roles permitidos)
 *  nav:    cómo aparece en el menú: { icono, etiqueta, orden, movil, grupo }
 *          `staff` sobrescribe esos campos para docentes/administración (null = no se muestra)
 *          `solo: 'estudiante'` oculta la ruta del menú del personal.
 */
import { state } from './state.js';

const placeholder = (clave) => () =>
  import('../ui/views/proximamente.js').then((m) => ({ render: (ctx) => m.render({ ...ctx, clave }) }));

const esStaff = (u) => u && (u.rol === 'docente' || u.rol === 'admin');

export const RUTAS = [
  {
    path: '/', acceso: 'publica', titulo: 'Inicio',
    load: () => (!state.user ? import('../ui/views/portada.js') : esStaff(state.user) ? import('../ui/views/panel.js') : import('../ui/views/inicio.js')),
    nav: { icono: 'home', etiqueta: 'Inicio', orden: 1, movil: true, staff: { icono: 'chart', etiqueta: 'Resumen', grupo: 'General' } },
  },
  { path: '/pendiente', acceso: 'sesion', titulo: 'Solicitud en revisión', load: () => import('../ui/views/pendiente.js') },
  { path: '/entrar', acceso: 'publica', titulo: 'Entrar', load: () => import('../ui/views/entrar.js') },
  { path: '/bienvenida', acceso: 'sesion', titulo: 'Bienvenida', load: () => import('../ui/views/bienvenida.js') },
  { path: '/leccion', acceso: 'sesion', solo: 'estudiante', titulo: 'Lección', load: () => import('../ui/views/leccion.js'), padre: '/aprende' },
  { path: '/introduccion', acceso: 'sesion', solo: 'estudiante', titulo: 'Postura y manos', load: () => import('../ui/views/introduccion.js'), padre: '/aprende' },
  {
    path: '/aprende', acceso: 'sesion', solo: 'estudiante', titulo: 'Aprende a teclear', load: () => import('../ui/views/aprende.js'),
    nav: { icono: 'keyboard', etiqueta: 'Aprende', orden: 2, movil: true },
  },
  {
    path: '/practica', acceso: 'sesion', solo: 'estudiante', titulo: 'Práctica libre', load: () => import('../ui/views/practica.js'),
    nav: { icono: 'target', etiqueta: 'Práctica', orden: 3, movil: false },
  },
  {
    path: '/juegos', acceso: 'sesion', solo: 'estudiante', titulo: 'Juegos', load: placeholder('juegos'),
    nav: { icono: 'gamepad', etiqueta: 'Juegos', orden: 4, movil: true },
  },
  {
    path: '/logros', acceso: 'sesion', solo: 'estudiante', titulo: 'Mis logros', load: placeholder('logros'),
    nav: { icono: 'trophy', etiqueta: 'Logros', orden: 5, movil: true },
  },
  {
    path: '/clases', acceso: 'sesion', solo: 'estudiante', titulo: 'Mis clases', load: placeholder('clases'),
    nav: { icono: 'users', etiqueta: 'Mis clases', orden: 6, movil: false },
  },
  {
    path: '/docente', acceso: ['docente', 'admin'], titulo: 'Clases y estudiantes', load: () => import('../ui/views/docente.js'),
    nav: { icono: 'users', etiqueta: 'Clases', orden: 7, movil: true, staff: { icono: 'users', etiqueta: 'Clases y estudiantes', grupo: 'General' } },
  },
  {
    path: '/admin', acceso: ['admin'], titulo: 'Administración', load: () => import('../ui/views/admin.js'),
    nav: { icono: 'shield', etiqueta: 'Admin', orden: 8, movil: true, staff: { icono: 'shield', etiqueta: 'Administración', grupo: 'Sistema' } },
  },
  {
    path: '/perfil', acceso: 'sesion', titulo: 'Perfil y ajustes', load: () => import('../ui/views/perfil.js'),
    nav: { icono: 'user', etiqueta: 'Perfil', orden: 9, movil: true, staff: { icono: 'user', etiqueta: 'Cuenta y ajustes', grupo: 'Sistema' } },
  },
  { path: '/privacidad', acceso: 'publica', titulo: 'Aviso de privacidad', load: () => import('../ui/views/privacidad.js') },
];

export const RUTA_404 = {
  path: '*', acceso: 'publica', titulo: 'No encontrada', load: () => import('../ui/views/no-encontrada.js'),
};

export const buscarRuta = (path) => RUTAS.find((r) => r.path === path) || RUTA_404;

/** Devuelve cómo se muestra la ruta en el menú para el usuario actual, o null si no debe verse. */
export function itemNav(ruta, u = state.user) {
  if (!ruta.nav || !u) return null;
  if (u.rol === 'pendiente' || u.rol === 'rechazado') return null;
  const staff = esStaff(u);
  if (Array.isArray(ruta.acceso) && !ruta.acceso.includes(u.rol)) return null;
  if (staff && ruta.solo === 'estudiante') return null;
  if (!staff && ruta.path === '/admin') return null;
  const { staff: extra, ...base } = ruta.nav;
  return staff ? { ...base, ...(extra || {}) } : base;
}

export const rutasVisibles = (u = state.user) =>
  RUTAS.map((r) => ({ ruta: r, item: itemNav(r, u) })).filter((x) => x.item).sort((a, b) => a.item.orden - b.item.orden);
