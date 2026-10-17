/**
 * Resumen del docente/administración (vista sobria) con datos reales de sus clases.
 */
import { marca } from '../../core/marca.js';
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import * as C from '../../db/clases.js';
import { resumenClase, estadoDe, textoUltima, sesionesDocente } from '../../db/analitica.js';
import { icono } from '../icons.js';
import { barras, tecladoCalor } from '../graficas.js';
import { pill } from './_staff.js';
import { t, idioma } from '../../i18n/index.js';

const num1 = (n) => String(n).replace('.', idioma() === 'en' ? '.' : ',');
const kpi = ({ titulo, valor, unidad = '' }) => h('article', { class: 'kpi' }, h('span', { class: 'kpi__tit' }, titulo), h('div', { class: 'kpi__fila' }, h('strong', { class: 'kpi__num' }, valor, unidad ? h('small', {}, unidad) : null)));

export async function render() {
  const u = state.user, nombre = u.nombre.split(' ')[0];
  const [clases, inscs, sesiones] = await Promise.all([C.listarClases(u), C.inscripcionesDocente(u),
    sesionesDocente(u)]);
  const cab = h('header', { class: 'pagina__cab' },
    h('div', {}, h('h1', {}, t('panel.buenDia', { n: nombre })), h('p', { class: 'suave' }, t('panel.sub'))),
    h('div', { class: 'fila' }, h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => document.dispatchEvent(new CustomEvent('teclea:paleta')) }, icono('search', { tam: 16 }), t('panel.buscar')),
      h('a', { class: 'btn btn--primary btn--sm', href: '#/docente' }, t('panel.verEst'), icono('arrow', { tam: 16 }))));

  if (!clases.length) return h('div', { class: 'pagina' }, cab, h('section', { class: 'panel vacio' }, h('h2', {}, t('panel.empecemos')), h('p', { class: 'suave' }, t('panel.crea')),
    h('a', { class: 'btn btn--primary', href: '#/docente?tab=clases' }, t('panel.crearPrimera'))));

  const r = resumenClase(inscs, sesiones);
  const nombreDe = (uid) => inscs.find((i) => i.uid === uid)?.alias || t('panel.estudianteGen');
  const claseDe = (id) => clases.find((c) => c.id === id);
  const reciente = sesiones.slice(0, 8);
  const hay = Object.keys(r.calor).length > 0;
  return h('div', { class: 'pagina' }, cab,
    h('section', { class: 'kpis', 'aria-label': t('panel.indicadores') },
      kpi({ titulo: t('panel.activosHoy'), valor: r.activos, unidad: ` / ${r.total}` }), kpi({ titulo: t('panel.velMedia'), valor: r.ppm ? num1(r.ppm) : '—', unidad: ` ${t('cl.ppm')}` }),
      kpi({ titulo: t('panel.preMedia'), valor: r.precision ? num1(r.precision) : '—', unidad: ' %' }), kpi({ titulo: t('panel.apoyo'), valor: r.apoyo.length })),
    h('div', { class: 'rejilla-2' },
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('panel.practicaSemanal')), h('span', { class: 'suave' }, t('panel.minDia'))), barras(r.minutosSemana.map((d) => ({ etiqueta: d.etiqueta, valor: d.valor })), { alto: 210, unidad: ` ${t('panel.minUnidad')}` })),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('panel.teclasErrores')), h('span', { class: 'suave' }, t('panel.todosGrupos'))),
        hay ? [tecladoCalor(r.calor), h('p', { class: 'suave pequeno' }, t('panel.calorTexto'))] : h('p', { class: 'suave' }, t('panel.aparecera')))),
    h('div', { class: 'rejilla-2 rejilla-2--desigual' },
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('panel.apoyo')), h('a', { href: '#/docente' }, t('panel.verTodos'))),
        r.apoyo.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, [t('panel.th.est'), t('panel.th.clase'), t('panel.th.ppm'), t('panel.th.ultima'), t('panel.th.estado')].map((txt) => h('th', { scope: 'col' }, txt)))),
          h('tbody', {}, r.apoyo.slice(0, 6).map((i) => h('tr', {}, h('th', { scope: 'row' }, i.alias), h('td', {}, claseDe(i.classId)?.nombre || ''), h('td', { class: 'num' }, Math.round(i.stats?.mejorWpm || 0) || '—'), h('td', {}, textoUltima(i.stats?.ultimaPractica)), h('td', {}, pill(estadoDe(i, claseDe(i.classId)?.grado)))))))) : h('p', { class: 'suave' }, t('panel.todosAlDia'))),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('panel.actividad'))),
        reciente.length ? h('ul', { class: 'actividad' }, reciente.map((s) => h('li', { class: 'actividad__item' }, h('span', { class: 'actividad__ic' }, icono(s.tipo === 'juego' ? 'gamepad' : 'keyboard', { tam: 16 })),
          h('span', {}, h('strong', {}, nombreDe(s.uid)), ` ${s.tipo === 'leccion' ? t('panel.completo') : s.tipo === 'juego' ? t('panel.jugo') : t('panel.practico')} · ${Math.round(s.wpm)} ${t('cl.ppm')}`), h('time', { class: 'suave' }, textoUltima(s.creadoEn))))) : h('p', { class: 'suave' }, t('panel.sinActividad')))),
    h('p', { class: 'suave pequeno' }, t('panel.pie', { nombre: marca.nombre })));
}
