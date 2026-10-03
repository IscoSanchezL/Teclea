/**
 * Navegación: barra lateral flotante (estudiantes, escritorio), barra lateral fija con etiquetas
 * (docentes/administración), barra inferior (móvil) y barra superior.
 */
import { marca } from '../core/marca.js';
import { state, subscribe } from '../core/state.js';
import { rutasVisibles, buscarRuta } from '../core/routes.js';
import { h, contar } from '../core/utils.js';
import { nivelPorXP } from '../core/levels.js';
import { icono } from './icons.js';
import { logo } from './logo.js';
import { mascota } from './art.js';
import { avatar } from './avatar.js';
import { alternarTema } from './theme.js';
import { sincronizarPrefs } from './sync-prefs.js';
import { abrirCapa } from './overlay.js';
import { CONFIG } from '../core/config.js';

const $ = (id) => document.getElementById(id);
const esStaff = () => state.user?.rol === 'docente' || state.user?.rol === 'admin';
const ROL = { docente: 'Docente', admin: 'Administración', estudiante: 'Estudiante' };

/** Título para la miga de pan: usa la etiqueta del menú (p. ej. "Resumen") si la hay. */
const tituloDe = (path) => rutasVisibles().find((x) => x.ruta.path === path)?.item.etiqueta || buscarRuta(path).titulo;

function enlace({ ruta, item }, clase) {
  return h('a', { class: clase, href: `#${ruta.path}`, dataset: { ruta: ruta.path } },
    icono(item.icono, { tam: esStaff() ? 20 : 24 }),
    h('span', { class: 'nav-item__texto' }, item.etiqueta));
}

function botonTema() {
  const oscuro = document.documentElement.dataset.theme === 'dark';
  return h('button', {
    class: 'btn btn--icono btn--suave', type: 'button',
    'aria-label': oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
    onclick: () => alternarTema(sincronizarPrefs),
  }, icono(oscuro ? 'sun' : 'moon', { tam: 22 }));
}

/** Botón de cerrar sesión siempre visible (equipos compartidos: cada persona debe salir de su perfil). */
function botonSalir() {
  return h('button', {
    class: 'btn btn--salir btn--sm', type: 'button', title: 'Cerrar sesión', 'aria-label': 'Cerrar sesión',
    onclick: async () => { const { cerrarSesion } = await import('../auth/auth.js'); await cerrarSesion(); location.hash = '#/'; },
  }, icono('logout', { tam: 18 }), h('span', { class: 'btn--salir__txt' }, 'Salir'));
}

function botonBuscar() {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  return h('button', { class: 'buscar', type: 'button', 'aria-label': 'Abrir búsqueda rápida', onclick: () => document.dispatchEvent(new CustomEvent('teclea:paleta')) },
    icono('search', { tam: 18 }), h('span', {}, 'Buscar o ir a…'), h('kbd', {}, mac ? '⌘ K' : 'Ctrl K'));
}

function chip(clase, nombreIcono, valor, etiqueta) {
  const num = h('span', { class: 'chip__num', dataset: { valor: 0 } }, '0');
  contar(num, valor, { duracion: 700 });
  return h('span', { class: `chip ${clase}`, title: etiqueta, role: 'group', 'aria-label': `${etiqueta}: ${valor}` }, icono(nombreIcono, { tam: 20 }), num);
}

function renderSidebar() {
  const raiz = $('sidebar');
  if (!state.user) return raiz.replaceChildren();
  const visibles = rutasVisibles();

  if (esStaff()) {
    const grupos = [...new Set(visibles.map((x) => x.item.grupo || 'General'))];
    raiz.replaceChildren(
      h('a', { class: 'sidebar__logo', href: '#/', 'aria-label': 'Ir al inicio' }, logo()),
      h('nav', { class: 'sidebar__lista', 'aria-label': 'Secciones' },
        grupos.map((g) => h('div', { class: 'sidebar__grupo' },
          h('p', { class: 'sidebar__rotulo' }, g),
          visibles.filter((x) => (x.item.grupo || 'General') === g).map((x) => enlace(x, 'nav-item'))))),
      h('a', { class: 'sidebar__usuario', href: '#/perfil' },
        avatar(state.user, { tam: 'sm', clase: 'sidebar__avatar' }),
        h('span', { class: 'sidebar__quien' }, h('strong', {}, state.user.nombre), h('small', {}, `${ROL[state.user.rol]} · ${marca.colegio}`))));
    return;
  }
  raiz.replaceChildren(
    h('a', { class: 'sidebar__logo', href: '#/', 'aria-label': 'Ir al inicio' }, logo({ solo: true })),
    h('nav', { class: 'sidebar__lista', 'aria-label': 'Secciones' }, visibles.map((x) => enlace(x, 'nav-item'))));
}

function renderBottomNav() {
  const raiz = $('bottomnav');
  if (!state.user) return raiz.replaceChildren();
  const todos = rutasVisibles();
  const principales = todos.filter((x) => x.item.movil).slice(0, esStaff() ? 4 : 5);
  const extra = todos.filter((x) => !principales.includes(x));
  const hijos = principales.map((x) => enlace(x, 'nav-item'));
  if (extra.length) {
    hijos.push(h('button', {
      class: 'nav-item', type: 'button', 'aria-haspopup': 'dialog',
      onclick: () => {
        let capa;
        const enlaces = extra.map((x) => {
          const a = enlace(x, 'tarjeta-mas');
          a.addEventListener('click', () => capa.cerrar());
          return a;
        });
        capa = abrirCapa({ titulo: 'Más secciones', contenido: h('div', { class: 'rejilla-mas' }, enlaces) });
      },
    }, icono('more', { tam: 24 }), h('span', { class: 'nav-item__texto' }, 'Más')));
  }
  raiz.replaceChildren(...hijos);
}

function renderTopbar() {
  const raiz = $('topbar');
  const u = state.user;
  if (!u) {
    raiz.replaceChildren(
      h('a', { class: 'topbar__marca', href: '#/', 'aria-label': 'Ir al inicio' }, logo()),
      h('div', { class: 'topbar__acciones' }, botonTema(), h('a', { class: 'btn btn--primary btn--sm', href: '#/entrar' }, 'Entrar')));
    return;
  }
  if (u.rol === 'pendiente' || u.rol === 'rechazado') {
    raiz.replaceChildren(
      h('a', { class: 'topbar__marca', href: '#/', 'aria-label': 'Inicio' }, logo()),
      h('div', { class: 'topbar__acciones' }, botonTema(), botonSalir()));
    return;
  }
  if (esStaff()) {
    raiz.replaceChildren(
      h('div', { class: 'topbar__migas' },
        h('span', { class: 'suave' }, marca.colegio), icono('arrow', { tam: 14 }),
        h('strong', { id: 'topbar-titulo' }, tituloDe(state.ruta))),
      h('div', { class: 'topbar__acciones' }, botonBuscar(), botonTema(),
        h('span', { class: 'rol-pill' }, ROL[u.rol]), botonSalir()));
    return;
  }
  const nivel = nivelPorXP(u.xp);
  raiz.replaceChildren(
    h('div', { class: 'topbar__saludo' },
      mascota('saludo', { tam: 'xs', animada: false }),
      h('div', {}, h('span', { class: 'topbar__hola' }, `¡Hola, ${u.apodo}!`), h('span', { class: 'topbar__nivel suave' }, `Nivel ${nivel.nivel} · ${nivel.nombre}`))),
    h('div', { class: 'topbar__acciones' },
      chip('chip--racha', 'flame', u.racha || 0, 'Racha de días'),
      chip('chip--moneda', 'coin', u.monedas || 0, 'Monedas'),
      chip('chip--xp', 'star', u.xp || 0, 'Puntos de experiencia'),
      botonTema(), botonSalir(),
      h('a', { class: 'avatar-mini', href: '#/perfil', 'aria-label': 'Mi perfil' }, avatar(u, { tam: 'md' }))));
}

/** Marca el ítem activo (aria-current) y actualiza el título de la barra superior. */
export function marcarRutaActiva(path) {
  const activa = buscarRuta(path).padre || path; // /leccion resalta "Aprende"
  document.querySelectorAll('[data-ruta]').forEach((a) => {
    if (a.dataset.ruta === activa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const t = document.getElementById('topbar-titulo');
  if (t) t.textContent = tituloDe(path);
}

export function redibujarNav() {
  $('app').dataset.shell = state.user ? 'app' : 'public';
  renderSidebar(); renderBottomNav(); renderTopbar();
  marcarRutaActiva(state.ruta);
}

/** Se llama una vez; vuelve a dibujar cuando cambia el usuario o el tema. */
export function iniciarNav() {
  let ultimo = '';
  subscribe((s) => {
    const firma = `${s.user?.uid}|${s.user?.rol}|${s.user?.xp}|${s.user?.monedas}|${s.user?.racha}|${s.user?.apodo}|${s.user?.avatar?.emoji}|${s.user?.avatar?.fondo}|${s.user?.foto ? 1 : 0}|${s.prefs.tema}|${document.documentElement.dataset.estilo}`;
    if (firma !== ultimo) { ultimo = firma; redibujarNav(); }
  });
  redibujarNav();
}
