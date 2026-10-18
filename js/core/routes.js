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
import { t } from '../i18n/index.js';

const placeholder = (clave) => () =>
  import('../ui/views/proximamente.js').then((m) => ({ render: (ctx) => m.render({ ...ctx, clave }) }));

const esStaff = (u) => u && (u.rol === 'docente' || u.rol === 'admin');

export const RUTAS = [
  {
    path: '/', acceso: 'publica', get titulo() { return t('ruta.inicio'); },
    load: () => (!state.user ? import('../ui/views/portada.js') : esStaff(state.user) ? import('../ui/views/panel.js') : import('../ui/views/inicio.js')),
    nav: { icono: 'home', get etiqueta() { return t('ruta.inicio'); }, orden: 1, movil: true, staff: { icono: 'chart', get etiqueta() { return t('ruta.resumen'); }, get grupo() { return t('nav.grupo.general'); } } },
  },
  { path: '/pendiente', acceso: 'sesion', get titulo() { return t('ruta.pendiente'); }, load: () => import('../ui/views/pendiente.js') },
  { path: '/entrar', acceso: 'publica', get titulo() { return t('ruta.entrar'); }, load: () => import('../ui/views/entrar.js') },
  { path: '/unirse', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.unirse'); }, load: () => import('../ui/views/unirse.js') },
  { path: '/bienvenida', acceso: 'sesion', get titulo() { return t('ruta.bienvenida'); }, load: () => import('../ui/views/bienvenida.js') },
  { path: '/leccion', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.leccion'); }, load: () => import('../ui/views/leccion.js'), padre: '/aprende' },
  { path: '/introduccion', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.introduccion'); }, load: () => import('../ui/views/introduccion.js'), padre: '/aprende' },
  {
    path: '/aprende', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.aprende'); }, load: () => import('../ui/views/aprende.js'),
    nav: { icono: 'keyboard', get etiqueta() { return t('ruta.aprende.nav'); }, orden: 2, movil: true },
  },
  {
    path: '/practica', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.practica'); }, load: () => import('../ui/views/practica.js'),
    nav: { icono: 'target', get etiqueta() { return t('ruta.practica.nav'); }, orden: 3, movil: false },
  },
  {
    path: '/juegos', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.juegos'); }, load: () => import('../ui/views/juegos.js'),
    nav: { icono: 'gamepad', get etiqueta() { return t('ruta.juegos'); }, orden: 4, movil: true },
  },
  { path: '/reto', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.reto'); }, load: () => import('../ui/views/reto.js'), padre: '/' },
  {
    path: '/logros', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.logros'); }, load: () => import('../ui/views/logros.js'),
    nav: { icono: 'trophy', get etiqueta() { return t('ruta.logros.nav'); }, orden: 5, movil: true },
  },
  {
    path: '/tienda', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.tienda'); }, load: () => import('../ui/views/tienda.js'),
    nav: { icono: 'bag', get etiqueta() { return t('ruta.tienda'); }, orden: 5.5, movil: false },
  },
  {
    path: '/clases', acceso: 'sesion', solo: 'estudiante', get titulo() { return t('ruta.clases'); }, load: () => import('../ui/views/clases.js'),
    nav: { icono: 'users', get etiqueta() { return t('ruta.clases'); }, orden: 6, movil: false },
  },
  {
    path: '/docente', acceso: ['docente', 'admin'], get titulo() { return t('ruta.docente'); }, load: () => import('../ui/views/docente.js'),
    nav: { icono: 'users', get etiqueta() { return t('ruta.docente.nav'); }, orden: 7, movil: true, staff: { icono: 'users', get etiqueta() { return t('ruta.docente'); }, get grupo() { return t('nav.grupo.general'); } } },
  },
  {
    path: '/admin', acceso: ['admin'], get titulo() { return t('ruta.admin'); }, load: () => import('../ui/views/admin.js'),
    nav: { icono: 'shield', get etiqueta() { return t('ruta.admin.nav'); }, orden: 8, movil: true, staff: { icono: 'shield', get etiqueta() { return t('ruta.admin'); }, get grupo() { return t('nav.grupo.sistema'); } } },
  },
  {
    path: '/perfil', acceso: 'sesion', get titulo() { return t('ruta.perfil'); }, load: () => import('../ui/views/perfil.js'),
    nav: { icono: 'user', get etiqueta() { return t('ruta.perfil.nav'); }, orden: 9, movil: true, staff: { icono: 'user', get etiqueta() { return t('ruta.perfil.staff'); }, get grupo() { return t('nav.grupo.sistema'); } } },
  },
  { path: '/privacidad', acceso: 'publica', get titulo() { return t('ruta.privacidad'); }, load: () => import('../ui/views/privacidad.js') },
];

export const RUTA_404 = {
  path: '*', acceso: 'publica', get titulo() { return t('ruta.nf'); }, load: () => import('../ui/views/no-encontrada.js'),
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
