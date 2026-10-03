/**
 * Resumen del docente/administración (vista sobria) con datos reales de sus clases.
 */
import { marca } from '../../core/marca.js';
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import * as C from '../../db/clases.js';
import { consultar } from '../../db/store.js';
import { resumenClase, estadoDe, textoUltima } from '../../db/analitica.js';
import { icono } from '../icons.js';
import { barras, tecladoCalor } from '../graficas.js';
import { pill } from './_staff.js';

const kpi = ({ titulo, valor, unidad = '' }) => h('article', { class: 'kpi' }, h('span', { class: 'kpi__tit' }, titulo), h('div', { class: 'kpi__fila' }, h('strong', { class: 'kpi__num' }, valor, unidad ? h('small', {}, unidad) : null)));

export async function render() {
  const u = state.user, nombre = u.nombre.split(' ')[0];
  const [clases, inscs, sesiones] = await Promise.all([C.listarClases(u), C.inscripcionesDocente(u),
    consultar('sessions', { donde: [['docenteId', '==', u.uid]], orden: ['creadoEn', 'desc'], limite: 600 }).catch(() => [])]);
  const cab = h('header', { class: 'pagina__cab' },
    h('div', {}, h('h1', {}, `Buen día, ${nombre}`), h('p', { class: 'suave' }, 'Resumen de tus grupos · últimos 7 días')),
    h('div', { class: 'fila' }, h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => document.dispatchEvent(new CustomEvent('teclea:paleta')) }, icono('search', { tam: 16 }), 'Buscar'),
      h('a', { class: 'btn btn--primary btn--sm', href: '#/docente' }, 'Ver estudiantes', icono('arrow', { tam: 16 }))));

  if (!clases.length) return h('div', { class: 'pagina' }, cab, h('section', { class: 'panel vacio' }, h('h2', {}, 'Empecemos'), h('p', { class: 'suave' }, 'Crea tu primera clase para obtener un código, agregar estudiantes y ver aquí su progreso.'),
    h('a', { class: 'btn btn--primary', href: '#/docente?tab=clases' }, 'Crear mi primera clase')));

  const r = resumenClase(inscs, sesiones);
  const nombreDe = (uid) => inscs.find((i) => i.uid === uid)?.alias || 'Estudiante';
  const claseDe = (id) => clases.find((c) => c.id === id);
  const reciente = sesiones.slice(0, 8);
  const hay = Object.keys(r.calor).length > 0;
  return h('div', { class: 'pagina' }, cab,
    h('section', { class: 'kpis', 'aria-label': 'Indicadores' },
      kpi({ titulo: 'Activos hoy', valor: r.activos, unidad: ` / ${r.total}` }), kpi({ titulo: 'Velocidad media', valor: r.ppm ? String(r.ppm).replace('.', ',') : '—', unidad: ' PPM' }),
      kpi({ titulo: 'Precisión media', valor: r.precision ? String(r.precision).replace('.', ',') : '—', unidad: ' %' }), kpi({ titulo: 'Requieren apoyo', valor: r.apoyo.length })),
    h('div', { class: 'rejilla-2' },
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Práctica semanal'), h('span', { class: 'suave' }, 'minutos totales por día')), barras(r.minutosSemana.map((d) => ({ etiqueta: d.etiqueta, valor: d.valor })), { alto: 210, unidad: ' min' })),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Teclas con más errores'), h('span', { class: 'suave' }, 'todos los grupos')),
        hay ? [tecladoCalor(r.calor), h('p', { class: 'suave pequeno' }, 'Las teclas más oscuras concentran más errores: conviene reforzarlas en clase.')] : h('p', { class: 'suave' }, 'Aparecerá cuando tus estudiantes practiquen.'))),
    h('div', { class: 'rejilla-2 rejilla-2--desigual' },
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Requieren apoyo'), h('a', { href: '#/docente' }, 'Ver todos')),
        r.apoyo.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, ['Estudiante', 'Clase', 'PPM', 'Última práctica', 'Estado'].map((t) => h('th', { scope: 'col' }, t)))),
          h('tbody', {}, r.apoyo.slice(0, 6).map((i) => h('tr', {}, h('th', { scope: 'row' }, i.alias), h('td', {}, claseDe(i.classId)?.nombre || ''), h('td', { class: 'num' }, Math.round(i.stats?.mejorWpm || 0) || '—'), h('td', {}, textoUltima(i.stats?.ultimaPractica)), h('td', {}, pill(estadoDe(i, claseDe(i.classId)?.grado)))))))) : h('p', { class: 'suave' }, '¡Todos al día! 🎉')),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Actividad reciente')),
        reciente.length ? h('ul', { class: 'actividad' }, reciente.map((s) => h('li', { class: 'actividad__item' }, h('span', { class: 'actividad__ic' }, icono(s.tipo === 'juego' ? 'gamepad' : 'keyboard', { tam: 16 })),
          h('span', {}, h('strong', {}, nombreDe(s.uid)), ` ${s.tipo === 'leccion' ? 'completó una lección' : s.tipo === 'juego' ? 'jugó' : 'practicó'} · ${Math.round(s.wpm)} PPM`), h('time', { class: 'suave' }, textoUltima(s.creadoEn))))) : h('p', { class: 'suave' }, 'Sin actividad todavía.'))),
    h('p', { class: 'suave pequeno' }, `${marca.nombre} · panel docente · solo se muestran apodos.`));
}
