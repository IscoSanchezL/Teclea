/**
 * Mis logros: nivel, racha, monedas, retos del día, vitrina de medallas por categoría y calendario.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { nivelPorXP } from '../../core/levels.js';
import { cargarInsignias, resumenHoy, cargarProgreso } from '../../db/progreso.js';
import { cargarCatalogo } from '../../game/insignias.js';
import { anillo } from '../componentes.js';
import { medallaSVG } from '../medallas.js';
import { icono } from '../icons.js';
import { tarjetaRetos } from '../retos-ui.js';
import { abrirCapa } from '../overlay.js';

const CATEGORIAS = { todas: 'Todas', constancia: 'Constancia', velocidad: 'Velocidad', precision: 'Precisión', exploracion: 'Exploración', juegos: 'Juegos', primera: 'Primeras veces', clase: 'Clase', secretas: 'Secretas' };

export async function render() {
  const u = state.user;
  const [cat, ganadas, hoy, progreso] = await Promise.all([cargarCatalogo(), cargarInsignias(u.uid), resumenHoy(u.uid).catch(() => ({})), cargarProgreso(u.uid)]);
  const nivel = nivelPorXP(u.xp || 0);
  const estrellas = Object.values(progreso).reduce((a, p) => a + (p.estrellas || 0), 0);

  const hero = h('section', { class: 'card card--hero logros__hero' },
    anillo({ valor: nivel.progreso, tam: 132, grosor: 12, color: 'var(--sol-400)', etiqueta: `Nivel ${nivel.nivel}` }, h('strong', { class: 'logros__nivel' }, nivel.nivel)),
    h('div', { class: 'logros__datos' },
      h('span', { class: 'etiqueta' }, `Nivel ${nivel.nivel}`), h('h1', {}, nivel.nombre),
      h('p', { class: 'suave' }, nivel.siguiente ? `${nivel.siguiente.xp - (u.xp || 0)} XP para “${nivel.siguiente.nombre}”` : '¡Nivel máximo!'),
      h('ul', { class: 'logros__chips' },
        h('li', {}, icono('flame', { tam: 18 }), h('b', {}, u.racha || 0), ' días de racha'),
        h('li', {}, icono('shield', { tam: 18 }), h('b', {}, u.protectores || 0), ' protectores'),
        h('li', {}, icono('coin', { tam: 18 }), h('b', {}, u.monedas || 0), ' monedas'),
        h('li', {}, icono('star', { tam: 18 }), h('b', {}, estrellas), ' estrellas'),
        h('li', {}, icono('medal', { tam: 18 }), h('b', {}, ganadas.size), ` de ${cat.length} medallas`)),
      h('a', { class: 'btn btn--sun btn--sm', href: '#/tienda' }, icono('bag', { tam: 18 }), 'Ir a la tienda')));

  const retos = await tarjetaRetos({ hoy });

  const vitrina = h('div', { class: 'vitrina' });
  const filtros = h('div', { class: 'filtros', role: 'group', 'aria-label': 'Categorías' });
  const usadas = ['todas', ...Object.keys(CATEGORIAS).filter((c) => c !== 'todas' && cat.some((m) => m.categoria === c))];
  let sel = 'todas';
  const detalle = (m, ok) => abrirCapa({ titulo: ok || m.categoria !== 'secretas' ? m.nombre : 'Medalla secreta', tipo: 'dialogo',
    contenido: h('div', { class: 'medalla-detalle' }, medallaSVG({ nivel: m.nivel, icono: m.icono, tam: 140, bloqueada: !ok }),
      h('p', {}, ok || m.categoria !== 'secretas' ? m.descripcion : 'Descubre cómo conseguirla jugando.'), h('small', { class: 'suave' }, ok ? '¡Ya es tuya!' : 'Aún no la tienes') ) });
  const pintar = () => {
    filtros.replaceChildren(...usadas.map((c) => h('button', { class: 'filtro', type: 'button', 'aria-pressed': String(c === sel), onclick: () => { sel = c; pintar(); } }, CATEGORIAS[c] || c)));
    const lista = cat.filter((m) => sel === 'todas' || m.categoria === sel).sort((a, b) => Number(ganadas.has(b.id)) - Number(ganadas.has(a.id)));
    vitrina.replaceChildren(...lista.map((m) => { const ok = ganadas.has(m.id), oculta = !ok && m.categoria === 'secretas';
      return h('button', { class: `vit ${ok ? 'vit--ok' : ''}`, type: 'button', onclick: () => detalle(m, ok), 'aria-label': `${oculta ? 'Medalla secreta' : m.nombre}, ${ok ? 'conseguida' : 'bloqueada'}` },
        medallaSVG({ nivel: m.nivel, icono: oculta ? 'lock' : m.icono, tam: 76, bloqueada: !ok }), h('strong', {}, oculta ? '???' : m.nombre)); }));
  };
  pintar();

  return h('div', { class: 'logros' }, hero,
    h('div', { class: 'logros__cuerpo' },
      h('section', { class: 'card' }, h('div', { class: 'fila fila--entre' }, h('h2', { class: 'seccion__titulo' }, 'Mi vitrina'), h('span', { class: 'suave' }, `${ganadas.size} / ${cat.length}`)), filtros, vitrina),
      h('aside', { class: 'logros__lateral' }, retos)));
}
