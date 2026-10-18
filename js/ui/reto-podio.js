/**
 * Podio con los 3 primeros puestos y tabla completa. Lo usan el docente (para proyectar) y los estudiantes.
 *   filas: salida de rankingParejas() o rankingIndividual() (con `puesto`, `puntos`, `ppm`, `precision`)
 */
import { h } from '../core/utils.js';
import { t, num } from '../i18n/index.js';

const MEDALLA = { 1: '🥇', 2: '🥈', 3: '🥉' };
const nombreDe = (f) => f.nombre || f.alias;

export function podio({ filas, tipo }) {
  if (!filas.length) return h('p', { class: 'suave rv-vacio' }, t('rv.p.nadie'));
  const top = filas.filter((f) => f.puesto <= 3).slice(0, 3);
  const orden = top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : top;
  const columna = (f) => h('li', { class: `rv-podio__col rv-podio__col--${Math.min(f.puesto, 3)}` },
    h('span', { class: 'rv-podio__medalla', 'aria-hidden': 'true' }, MEDALLA[f.puesto] || ''),
    h('strong', { class: 'rv-podio__nombre' }, nombreDe(f)),
    h('span', { class: 'rv-podio__pts' }, t('rv.p.pts', { n: num(f.puntos) })),
    h('span', { class: 'rv-podio__base' }, h('b', {}, f.puesto)));
  const col1 = tipo === 'parejas' ? t('rv.p.pareja') : t('rv.p.jugador');
  return h('section', { class: 'rv-podio', 'aria-label': t('rv.p.titulo') },
    h('ol', { class: 'rv-podio__tarima' }, orden.map(columna)),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla rv-tabla' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, t('rv.p.puesto')), h('th', { scope: 'col' }, col1), h('th', { scope: 'col', class: 'num' }, t('rv.p.puntos')), h('th', { scope: 'col', class: 'num' }, t('rv.p.ppm')), h('th', { scope: 'col', class: 'num' }, t('rv.p.prec')),
        tipo === 'parejas' ? h('th', { scope: 'col', class: 'num' }, '✓') : null)),
      h('tbody', {}, filas.map((f) => h('tr', { class: f.puesto <= 3 ? 'rv-tabla__top' : '' },
        h('td', {}, MEDALLA[f.puesto] ? `${MEDALLA[f.puesto]} ${f.puesto}` : String(f.puesto)), h('th', { scope: 'row' }, nombreDe(f)),
        h('td', { class: 'num' }, num(f.puntos)), h('td', { class: 'num' }, f.ppm ? Math.round(f.ppm) : '—'), h('td', { class: 'num' }, f.precision ? `${Math.round(f.precision)} %` : '—'),
        tipo === 'parejas' ? h('td', { class: 'num' }, `${f.terminaron}/${f.total}`) : null))))),
    h('small', { class: 'suave' }, t('rv.p.regla')));
}
