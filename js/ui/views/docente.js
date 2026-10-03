/**
 * Clases y estudiantes (vista sobria): filtro por clase, búsqueda, orden y exportación CSV.
 * Datos de EJEMPLO hasta la Fase 5.
 */
import { h } from '../../core/utils.js';
import { icono } from '../icons.js';
import { sparkline } from '../graficas.js';
import { toast } from '../overlay.js';
import { CLASES_DEMO, ESTUDIANTES_DEMO } from '../datos-demo.js';
import { avisoDemo, pill, ETIQUETA_ESTADO } from './_staff.js';

const nombreClase = (id) => CLASES_DEMO.find((c) => c.id === id)?.nombre || id;

function csv(filas) {
  const enc = ['Estudiante', 'Clase', 'PPM', 'Precisión (%)', 'Minutos', 'Última práctica', 'Estado'];
  const lineas = filas.map((e) => [e.apodo, nombreClase(e.clase), e.ppm, e.pre, e.min, e.ult, ETIQUETA_ESTADO[e.estado]].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return '﻿' + [enc.join(','), ...lineas].join('\n'); // BOM para que Excel respete las tildes
}

export async function render() {
  let clase = 'todas', texto = '', orden = { campo: 'apodo', asc: true };

  const cuerpo = h('tbody');
  const contador = h('span', { class: 'suave' });

  const filtrados = () => ESTUDIANTES_DEMO
    .filter((e) => (clase === 'todas' || e.clase === clase) && e.apodo.toLowerCase().includes(texto.toLowerCase()))
    .sort((a, b) => {
      const va = a[orden.campo], vb = b[orden.campo];
      const r = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es');
      return orden.asc ? r : -r;
    });

  function pintar() {
    const filas = filtrados();
    cuerpo.replaceChildren(...filas.map((e) => h('tr', {},
      h('th', { scope: 'row' }, e.apodo),
      h('td', {}, nombreClase(e.clase)),
      h('td', { class: 'num' }, e.ppm),
      h('td', { class: 'num' }, `${e.pre} %`),
      h('td', { class: 'num' }, `${e.min} min`),
      h('td', { class: 'tabla__spark' }, sparkline(e.serie, { color: e.estado === 'atrasado' || e.estado === 'inactivo' ? 'var(--mal)' : 'var(--ok)', etiqueta: `Evolución de ${e.apodo}` })),
      h('td', {}, e.ult),
      h('td', {}, pill(e.estado)))));
    if (!filas.length) cuerpo.append(h('tr', {}, h('td', { colspan: 8, class: 'tabla__vacio' }, 'Ningún estudiante coincide con el filtro.')));
    contador.textContent = `${filas.length} estudiante${filas.length === 1 ? '' : 's'}`;
    document.querySelectorAll('.tabla th[data-campo]').forEach((th) => th.setAttribute('aria-sort', th.dataset.campo === orden.campo ? (orden.asc ? 'ascending' : 'descending') : 'none'));
  }

  const cab = (campo, etiqueta, num) => h('th', {
    scope: 'col', class: num ? 'num' : '', dataset: { campo }, 'aria-sort': 'none',
  }, h('button', { class: 'tabla__orden', type: 'button', onclick: () => { orden = { campo, asc: orden.campo === campo ? !orden.asc : true }; pintar(); } }, etiqueta, icono('arrow', { tam: 12 })));

  const chips = [{ id: 'todas', nombre: 'Todas las clases' }, ...CLASES_DEMO].map((c) => h('button', {
    class: 'filtro', type: 'button', 'aria-pressed': String(c.id === clase),
    onclick: (ev) => { clase = c.id; chips.forEach((b) => b.setAttribute('aria-pressed', String(b === ev.currentTarget))); pintar(); },
  }, c.nombre));

  const buscador = h('input', { class: 'input input--sm', type: 'search', placeholder: 'Buscar estudiante…', 'aria-label': 'Buscar estudiante', oninput: (e) => { texto = e.target.value; pintar(); } });

  const tarjetasClase = CLASES_DEMO.map((c) => h('article', { class: 'clase' },
    h('div', {}, h('strong', {}, c.nombre), h('span', { class: 'suave' }, `${c.estudiantes} estudiantes`)),
    h('button', {
      class: 'codigo', type: 'button', title: 'Copiar código de clase', 'aria-label': `Copiar código de la clase ${c.nombre}: ${c.codigo}`,
      onclick: async () => { try { await navigator.clipboard.writeText(c.codigo); toast(`Código ${c.codigo} copiado`); } catch { toast(`Código: ${c.codigo}`, { tipo: 'info' }); } },
    }, c.codigo, icono('book', { tam: 14 }))));

  const pagina = h('div', { class: 'pagina' },
    h('header', { class: 'pagina__cab' },
      h('div', {}, h('h1', {}, 'Clases y estudiantes'), h('p', { class: 'suave' }, 'Progreso, velocidad y precisión por estudiante')),
      h('div', { class: 'fila' },
        h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => {
          const blob = new Blob([csv(filtrados())], { type: 'text/csv;charset=utf-8' });
          const a = h('a', { href: URL.createObjectURL(blob), download: 'estudiantes-teclea.csv' });
          document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
          toast('CSV exportado');
        } }, icono('download', { tam: 16 }), 'Exportar CSV'),
        h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => toast('Crear clases llega en la Fase 5.', { tipo: 'info' }) }, 'Nueva clase'))),
    avisoDemo(),
    h('section', { class: 'clases', 'aria-label': 'Clases y códigos' }, tarjetasClase),
    h('section', { class: 'panel panel--tabla' },
      h('div', { class: 'tabla-herr' }, h('div', { class: 'filtros', role: 'group', 'aria-label': 'Filtrar por clase' }, chips), h('div', { class: 'fila' }, contador, buscador)),
      h('div', { class: 'tabla-scroll' },
        h('table', { class: 'tabla tabla--lista' },
          h('thead', {}, h('tr', {}, cab('apodo', 'Estudiante'), cab('clase', 'Clase'), cab('ppm', 'PPM', true), cab('pre', 'Precisión', true), cab('min', 'Tiempo', true),
            h('th', { scope: 'col' }, 'Evolución'), cab('ult', 'Última práctica'), cab('estado', 'Estado'))),
          cuerpo))));
  pintar();
  return pagina;
}
