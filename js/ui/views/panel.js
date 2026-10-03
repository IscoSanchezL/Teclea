/**
 * Resumen del docente/administración (vista sobria).
 * Hoy muestra datos de EJEMPLO; en la Fase 5 se alimenta de Firestore (enrollments.stats y sessions).
 */
import { marca } from '../../core/marca.js';
import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';
import { h } from '../../core/utils.js';
import { icono } from '../icons.js';
import { sparkline, barras, tecladoCalor } from '../graficas.js';
import { ESTUDIANTES_DEMO, MINUTOS_SEMANA, ERRORES_TECLAS, ACTIVIDAD_DEMO } from '../datos-demo.js';
import { avisoDemo, pill } from './_staff.js';

function kpi({ titulo, valor, unidad = '', delta, bueno = true, serie, color }) {
  return h('article', { class: 'kpi' },
    h('span', { class: 'kpi__tit' }, titulo),
    h('div', { class: 'kpi__fila' },
      h('strong', { class: 'kpi__num' }, valor, unidad ? h('small', {}, unidad) : null),
      serie ? sparkline(serie, { color, etiqueta: titulo }) : null),
    delta ? h('span', { class: `delta ${bueno ? 'delta--bien' : 'delta--mal'}` }, delta, h('small', {}, ' vs. semana anterior')) : null);
}

export async function render() {
  const apoyo = ESTUDIANTES_DEMO.filter((e) => e.estado === 'atrasado' || e.estado === 'inactivo').slice(0, 5);
  const nombre = state.user.nombre.split(' ')[0];

  return h('div', { class: 'pagina' },
    h('header', { class: 'pagina__cab' },
      h('div', {}, h('h1', {}, `Buen día, ${nombre}`), h('p', { class: 'suave' }, 'Resumen de tus grupos · últimos 7 días')),
      h('div', { class: 'fila' },
        h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => document.dispatchEvent(new CustomEvent('teclea:paleta')) }, icono('search', { tam: 16 }), 'Buscar'),
        h('a', { class: 'btn btn--primary btn--sm', href: '#/docente' }, 'Ver estudiantes', icono('arrow', { tam: 16 })))),
    avisoDemo(),

    h('section', { class: 'kpis', 'aria-label': 'Indicadores' },
      kpi({ titulo: 'Activos hoy', valor: '18', unidad: ' / 24', delta: '+3', serie: [11, 14, 12, 16, 15, 17, 18], color: 'var(--primario)' }),
      kpi({ titulo: 'Velocidad media', valor: '19,4', unidad: ' PPM', delta: '+1,8', serie: [16, 16.5, 17, 17.8, 18.4, 19, 19.4], color: 'var(--ok)' }),
      kpi({ titulo: 'Precisión media', valor: '91,2', unidad: ' %', delta: '+0,6', serie: [89.8, 90.1, 90.3, 90.9, 91, 91.1, 91.2], color: 'var(--ok)' }),
      kpi({ titulo: 'Tareas por revisar', valor: '7', delta: '−2', bueno: true, serie: [12, 11, 10, 11, 9, 8, 7], color: 'var(--primario)' })),

    h('div', { class: 'rejilla-2' },
      h('section', { class: 'panel' },
        h('header', { class: 'panel__cab' }, h('h2', {}, 'Práctica semanal'), h('span', { class: 'suave' }, 'minutos totales por día')),
        barras(MINUTOS_SEMANA, { alto: 210, unidad: ' min' })),
      h('section', { class: 'panel' },
        h('header', { class: 'panel__cab' }, h('h2', {}, 'Teclas con más errores'), h('span', { class: 'suave' }, 'todos los grupos')),
        tecladoCalor(ERRORES_TECLAS),
        h('p', { class: 'suave pequeno' }, 'La Ñ y las teclas de las esquinas concentran los errores: conviene reforzar la fila base y los meñiques.'))),

    h('div', { class: 'rejilla-2 rejilla-2--desigual' },
      h('section', { class: 'panel' },
        h('header', { class: 'panel__cab' }, h('h2', {}, 'Requieren apoyo'), h('a', { href: '#/docente' }, 'Ver todos')),
        h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' },
          h('thead', {}, h('tr', {}, ['Estudiante', 'Clase', 'PPM', 'Última práctica', 'Estado'].map((t) => h('th', { scope: 'col' }, t)))),
          h('tbody', {}, apoyo.map((e) => h('tr', {},
            h('th', { scope: 'row' }, e.apodo), h('td', {}, e.clase.replace(/(\d)/, '$1.º ')), h('td', { class: 'num' }, e.ppm), h('td', {}, e.ult), h('td', {}, pill(e.estado)))))))),
      h('section', { class: 'panel' },
        h('header', { class: 'panel__cab' }, h('h2', {}, 'Actividad reciente')),
        h('ul', { class: 'actividad' }, ACTIVIDAD_DEMO.map((a) => h('li', { class: `actividad__item ${a.cuando === 'alerta' ? 'actividad__item--alerta' : ''}` },
          h('span', { class: 'actividad__ic' }, icono(a.icono, { tam: 16 })),
          h('span', {}, h('strong', {}, a.quien), ' ', a.que), h('time', { class: 'suave' }, a.cuando)))))),
    h('p', { class: 'suave pequeno' }, `${marca.nombre} · panel docente · los datos mostrados son ilustrativos.`));
}
