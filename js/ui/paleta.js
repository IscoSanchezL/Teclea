/**
 * Paleta de comandos (Ctrl/⌘ + K): saltar a cualquier sección o ejecutar acciones rápidas
 * escribiendo unas letras. Accesible por teclado (↑ ↓ Enter Esc).
 */
import { state } from '../core/state.js';
import { rutasVisibles } from '../core/routes.js';
import { h } from '../core/utils.js';
import { navegar } from '../core/router.js';
import { icono } from './icons.js';
import { abrirCapa } from './overlay.js';
import { alternarTema } from './theme.js';
import { sincronizarPrefs } from './sync-prefs.js';
import { cerrarSesion } from '../auth/auth.js';

const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function comandos() {
  const lista = rutasVisibles().map(({ ruta, item }) => ({
    icono: item.icono, texto: item.etiqueta, pista: 'Ir a', accion: () => navegar(ruta.path),
  }));
  lista.push(
    { icono: 'moon', texto: 'Cambiar tema claro / oscuro', pista: 'Acción', accion: () => alternarTema(sincronizarPrefs) },
    { icono: 'book', texto: 'Aviso de privacidad', pista: 'Ir a', accion: () => navegar('/privacidad') },
    { icono: 'logout', texto: 'Cerrar sesión', pista: 'Cuenta', accion: async () => { await cerrarSesion(); navegar('/', { reemplazar: true }); } });
  return lista;
}

function abrir() {
  if (!state.user) return;
  const todos = comandos();
  let visibles = todos, indice = 0, capa;

  const input = h('input', { class: 'paleta__input', type: 'text', placeholder: 'Escribe para buscar…', 'aria-label': 'Buscar sección o acción', autocomplete: 'off', spellcheck: 'false' });
  const lista = h('ul', { class: 'paleta__lista', role: 'listbox' });

  const pintar = () => {
    lista.replaceChildren(...visibles.map((c, i) => h('li', {
      class: `paleta__item ${i === indice ? 'paleta__item--on' : ''}`, role: 'option', 'aria-selected': String(i === indice),
      onclick: () => elegir(i), onpointermove: () => { if (indice !== i) { indice = i; pintar(); } },
    }, icono(c.icono, { tam: 20 }), h('span', {}, c.texto), h('small', {}, c.pista))));
    if (!visibles.length) lista.append(h('li', { class: 'paleta__vacio' }, 'Sin resultados'));
  };
  const elegir = (i) => { const c = visibles[i]; if (!c) return; capa.cerrar(); setTimeout(c.accion, 120); };

  input.addEventListener('input', () => {
    const q = sinTildes(input.value.trim());
    visibles = q ? todos.filter((c) => sinTildes(c.texto).includes(q)) : todos;
    indice = 0; pintar();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); indice = Math.min(visibles.length - 1, indice + 1); pintar(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); indice = Math.max(0, indice - 1); pintar(); }
    else if (e.key === 'Enter') { e.preventDefault(); elegir(indice); }
  });

  capa = abrirCapa({ titulo: 'Búsqueda rápida', tipo: 'paleta', contenido: h('div', {}, input, lista) });
  pintar();
}

export function iniciarPaleta() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrir(); }
  });
  document.addEventListener('teclea:paleta', abrir);
}
