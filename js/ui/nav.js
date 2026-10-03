/**
 * Navegación: barra lateral flotante (escritorio/tablet), barra inferior (móvil)
 * y barra superior (saludo, racha, monedas, XP, tema).
 */
import { state, subscribe } from '../core/state.js';
import { RUTAS, visibleParaUsuario } from '../core/routes.js';
import { h, contar } from '../core/utils.js';
import { nivelPorXP } from '../core/levels.js';
import { icono } from './icons.js';
import { logo } from './logo.js';
import { mascota } from './art.js';
import { alternarTema } from './theme.js';
import { sincronizarPrefs } from './sync-prefs.js';
import { abrirCapa } from './overlay.js';

const $ = (id) => document.getElementById(id);

function itemsVisibles() {
  return RUTAS.filter(visibleParaUsuario).sort((a, b) => a.nav.orden - b.nav.orden);
}

function enlace(ruta, clase) {
  return h('a', { class: clase, href: `#${ruta.path}`, dataset: { ruta: ruta.path } },
    icono(ruta.nav.icono, { tam: 24 }),
    h('span', { class: 'nav-item__texto' }, ruta.nav.etiqueta));
}

function botonTema() {
  const oscuro = document.documentElement.dataset.theme === 'dark';
  return h('button', {
    class: 'btn btn--icono btn--suave', type: 'button',
    'aria-label': oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
    onclick: () => alternarTema(sincronizarPrefs),
  }, icono(oscuro ? 'sun' : 'moon', { tam: 22 }));
}

function chip(clase, nombreIcono, valor, etiqueta) {
  const num = h('span', { class: 'chip__num', dataset: { valor: 0 } }, '0');
  contar(num, valor, { duracion: 700 });
  return h('span', { class: `chip ${clase}`, title: etiqueta, role: 'group', 'aria-label': `${etiqueta}: ${valor}` },
    icono(nombreIcono, { tam: 20 }), num);
}

function renderSidebar() {
  const raiz = $('sidebar');
  if (!state.user) return raiz.replaceChildren();
  raiz.replaceChildren(
    h('a', { class: 'sidebar__logo', href: '#/', 'aria-label': 'Ir al inicio' }, logo({ solo: true })),
    h('nav', { class: 'sidebar__lista', 'aria-label': 'Secciones' }, itemsVisibles().map((r) => enlace(r, 'nav-item'))));
}

function renderBottomNav() {
  const raiz = $('bottomnav');
  if (!state.user) return raiz.replaceChildren();
  const todos = itemsVisibles();
  const principales = todos.filter((r) => r.nav.movil);
  const extra = todos.filter((r) => !r.nav.movil);
  const hijos = principales.map((r) => enlace(r, 'nav-item'));
  if (extra.length) {
    hijos.push(h('button', {
      class: 'nav-item', type: 'button', 'aria-haspopup': 'dialog',
      onclick: () => {
        let capa;
        const enlaces = extra.map((r) => {
          const a = enlace(r, 'tarjeta-mas');
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
      h('div', { class: 'topbar__acciones' },
        botonTema(),
        h('a', { class: 'btn btn--primary btn--sm', href: '#/entrar' }, 'Entrar')));
    return;
  }
  const nivel = nivelPorXP(u.xp);
  raiz.replaceChildren(
    h('div', { class: 'topbar__saludo' },
      mascota('saludo', { tam: 'xs', animada: false }),
      h('div', {},
        h('span', { class: 'topbar__hola' }, `¡Hola, ${u.apodo}!`),
        h('span', { class: 'topbar__nivel suave' }, `Nivel ${nivel.nivel} · ${nivel.nombre}`))),
    h('div', { class: 'topbar__acciones' },
      chip('chip--racha', 'flame', u.racha || 0, 'Racha de días'),
      chip('chip--moneda', 'coin', u.monedas || 0, 'Monedas'),
      chip('chip--xp', 'star', u.xp || 0, 'Puntos de experiencia'),
      botonTema(),
      h('a', { class: 'avatar-mini', href: '#/perfil', 'aria-label': 'Mi perfil' }, u.avatar?.emoji || '🦊')));
}

/** Marca el ítem activo (aria-current) según la ruta. */
export function marcarRutaActiva(path) {
  document.querySelectorAll('[data-ruta]').forEach((a) => {
    const activo = a.dataset.ruta === path;
    if (activo) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

export function redibujarNav() {
  const app = $('app');
  app.dataset.shell = state.user ? 'app' : 'public';
  renderSidebar();
  renderBottomNav();
  renderTopbar();
  marcarRutaActiva(state.ruta);
}

/** Se llama una vez; vuelve a dibujar cuando cambia el usuario o el tema. */
export function iniciarNav() {
  let ultimo = '';
  subscribe((s) => {
    const firma = `${s.user?.uid}|${s.user?.xp}|${s.user?.monedas}|${s.user?.racha}|${s.user?.apodo}|${s.user?.avatar?.emoji}|${s.prefs.tema}`;
    if (firma !== ultimo) { ultimo = firma; redibujarNav(); }
  });
  redibujarNav();
}
