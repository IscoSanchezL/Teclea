/**
 * Enrutador por hash (#/ruta) — funciona en GitHub Pages sin configuración.
 * - Guardas de sesión y de rol.
 * - Transiciones suaves con View Transitions API (con respaldo sin ella).
 * - Gestión de foco y anuncio para lectores de pantalla.
 */
import { state, setState } from './state.js';
import { buscarRuta } from './routes.js';
import { movimientoReducido, anunciar, h } from './utils.js';
import { CONFIG } from './config.js';

let vistaActual = null;   // módulo de la vista montada (para destroy())
let token = 0;            // evita condiciones de carrera entre navegaciones rápidas
let alMontar = () => {};  // callback (nav) cuando cambia la ruta

export function iniciarRouter({ onRuta }) {
  alMontar = onRuta || alMontar;
  window.addEventListener('hashchange', resolver);
  resolver();
}

/** Navega a una ruta: navegar('/aprende') */
export function navegar(path, { reemplazar = false } = {}) {
  const destino = `#${path}`;
  if (reemplazar) location.replace(destino);
  else if (location.hash !== destino) location.hash = path;
  else resolver();
}

export function parsearHash() {
  const crudo = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = crudo.split('?');
  return { path: path.startsWith('/') ? path : `/${path}`, query: Object.fromEntries(new URLSearchParams(qs)) };
}

/** Aplica las guardas; devuelve la ruta final (puede ser una redirección). */
function aplicarGuardas(ruta, query) {
  const u = state.user;
  if (ruta.acceso !== 'publica' && !u) {
    return { redirigir: `/entrar?volver=${encodeURIComponent(location.hash.replace(/^#/, ''))}` };
  }
  if (Array.isArray(ruta.acceso) && !ruta.acceso.includes(u?.rol)) {
    return { redirigir: '/', aviso: 'Esa zona es solo para docentes o administración.' };
  }
  // Estudiante sin grado → primero la bienvenida.
  if (u && u.rol === 'estudiante' && !u.grado && ruta.path !== '/bienvenida' && ruta.acceso === 'sesion') {
    return { redirigir: '/bienvenida' };
  }
  if (u && ruta.path === '/entrar') return { redirigir: query.volver || '/' };
  return null;
}

async function resolver() {
  const miToken = ++token;
  const { path, query } = parsearHash();
  const ruta = buscarRuta(path);
  const guarda = aplicarGuardas(ruta, query);
  if (guarda) {
    if (guarda.aviso) import('../ui/overlay.js').then((m) => m.toast(guarda.aviso, { tipo: 'info' }));
    return navegar(guarda.redirigir, { reemplazar: true });
  }

  const contenedor = document.getElementById('view');
  const temporizador = setTimeout(() => contenedor.setAttribute('aria-busy', 'true'), 150);

  let mod, nodo;
  try {
    mod = await ruta.load();
    nodo = await mod.render({ path, query, ruta });
  } catch (e) {
    console.error('[router] error cargando vista', e);
    nodo = h('section', { class: 'estado-error card' },
      h('h1', {}, 'Ups, algo no cargó'),
      h('p', {}, 'Revisa tu conexión e inténtalo otra vez.'),
      h('button', { class: 'btn btn--primary', onclick: () => location.reload() }, 'Reintentar'));
    mod = null;
  }
  clearTimeout(temporizador);
  if (miToken !== token) return; // llegó una navegación más nueva

  const montar = () => {
    vistaActual?.destroy?.();
    vistaActual = mod;
    contenedor.replaceChildren(nodo);
    contenedor.removeAttribute('aria-busy');
    setState({ ruta: path });
    document.title = `${ruta.titulo} · ${CONFIG.appName}`;
    window.scrollTo({ top: 0 });
    alMontar(ruta);
    mod?.despues?.(nodo);
    const foco = contenedor.querySelector('h1') || contenedor;
    foco.setAttribute('tabindex', '-1');
    foco.focus({ preventScroll: true });
    anunciar(`${ruta.titulo}`);
  };

  if (document.startViewTransition && !movimientoReducido()) {
    document.startViewTransition(montar);
  } else {
    montar();
  }
}
