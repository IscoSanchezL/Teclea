/**
 * Clases y estudiantes (vista sobria, datos reales): estudiantes, clases y tareas.
 */
import { state } from '../../core/state.js';
import { textoVersion } from '../../core/version.js';
import { h } from '../../core/utils.js';
import * as C from '../../db/clases.js';
import { conSesiones, estadoDe, textoUltima, aCSV, descargar, ETIQUETAS, sembrarEjemplo, sesionesDocente } from '../../db/analitica.js';
import { icono } from '../icons.js';
import { sparkline } from '../graficas.js';
import { toast, confirmar } from '../overlay.js';
import { pill } from './_staff.js';
import { vistaRetos } from './docente-retos.js';
import { t, idioma, locale } from '../../i18n/index.js';
import { modalClase, modalCompartir, modalAlumnos, modalTarea, modalEstudiante } from './docente-modales.js';

let actualRetos = null;
const TABS = [['estudiantes', () => t('doc.tab.estudiantes')], ['clases', () => t('doc.tab.clases')], ['tareas', () => t('doc.tab.tareas')], ['retos', () => t('rv.tab')]];

export async function render({ query }) {
  const docente = state.user;
  let clases = [], inscs = [], sesiones = [];
  let tab = TABS.some(([id]) => id === query.tab) ? query.tab : 'estudiantes';
  let claseSel = 'todas', texto = '', orden = { campo: 'alias', asc: true }, claseTareas = null, claseRetos = null, retosVista = null;
  const raiz = h('div', { class: 'pagina' });
  const cuerpo = h('div', { class: 'pila' });

  async function cargar() {
    [clases, inscs] = await Promise.all([C.listarClases(docente), C.inscripcionesDocente(docente)]);
    sesiones = await sesionesDocente(docente);
    inscs = inscs.map((i) => conSesiones(i, sesiones));
    if (!claseTareas || !clases.some((c) => c.id === claseTareas.id)) claseTareas = clases[0] || null;
  }
  const nombreClase = (id) => clases.find((c) => c.id === id)?.nombre || '—';
  const claseDe = (id) => clases.find((c) => c.id === id);
  const refrescar = async () => { await cargar(); pintar(); };

  /* ── Cabecera ── */
  function cabecera() {
    const acciones = [];
    if (tab === 'estudiantes' && inscs.length) acciones.push(h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: exportarCSV }, icono('download', { tam: 16 }), t('doc.exportar')));
    acciones.push(h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => modalClase({ alGuardar: refrescar }) }, icono('plus', { tam: 16 }), t('doc.nuevaClase')));
    return h('header', { class: 'pagina__cab' },
      h('div', {}, h('h1', {}, t('doc.titulo')), h('p', { class: 'suave' }, `${clases.length} ${clases.length === 1 ? t('doc.clase1') : t('doc.clasesN')} · ${inscs.length} ${t('doc.estudiantes')} · `, textoVersion(h('span', { style: { opacity: .6 } }, ''), `${t('entrar.version', { v: '' }).trim()} `))),
      h('div', { class: 'fila' }, acciones));
  }
  const tabs = () => h('div', { class: 'tabs tabs--4 tabs--staff', role: 'tablist' }, TABS.map(([id, etq]) => h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(id === tab), onclick: () => { tab = id; pintar(); } }, etq())));

  /* ── Estudiantes ── */
  function exportarCSV() {
    const filas = filtrados().map((i) => [i.alias, nombreClase(i.classId), Math.round(i.stats?.mejorWpm || 0), i.stats?.precisionProm || 0, Math.round(i.stats?.minutos || 0), i.stats?.lecciones || 0, textoUltima(i.stats?.ultimaPractica), ETIQUETAS[estadoDe(i, claseDe(i.classId)?.grado)]]);
    descargar('estudiantes-teclea.csv', aCSV([t('doc.csv.cabecera.est'), t('doc.csv.cabecera.clase'), t('doc.csv.cabecera.ppm'), t('doc.csv.cabecera.pre'), t('doc.csv.cabecera.min'), t('doc.csv.cabecera.lec'), t('doc.csv.cabecera.ult'), t('doc.csv.cabecera.estado')], filas));
    toast(t('doc.csvOk'));
  }
  const valorOrden = (i, c) => ({ alias: i.alias.toLowerCase(), clase: nombreClase(i.classId), ppm: i.stats?.mejorWpm || 0, pre: i.stats?.precisionProm || 0, min: i.stats?.minutos || 0, ult: i.stats?.ultimaPractica || 0 })[c];
  const filtrados = () => inscs.filter((i) => (claseSel === 'todas' || i.classId === claseSel) && i.alias.toLowerCase().includes(texto.toLowerCase()))
    .sort((a, b) => { const x = valorOrden(a, orden.campo), y = valorOrden(b, orden.campo); const r = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), idioma()); return orden.asc ? r : -r; });

  function vistaEstudiantes() {
    if (!clases.length) return vacio(t('doc.sinClases'), t('doc.sinClasesTexto'), [h('button', { class: 'btn btn--primary', type: 'button', onclick: () => modalClase({ alGuardar: refrescar }) }, t('doc.crearPrimera')), ...(state.modo === 'demo' ? [ejemploBtn()] : [])]);
    const cuerpoTabla = h('tbody'), contador = h('span', { class: 'suave' });
    const pintarTabla = () => {
      const f = filtrados();
      cuerpoTabla.replaceChildren(...f.map((i) => {
        const mias = sesiones.filter((x) => x.uid === i.uid).slice(0, 8).reverse().map((x) => x.wpm);
        const estado = estadoDe(i, claseDe(i.classId)?.grado);
        return h('tr', { class: 'fila-click', tabindex: 0, onclick: () => abrirEstudiante(i), onkeydown: (e) => { if (e.key === 'Enter') abrirEstudiante(i); } },
          h('th', { scope: 'row' }, i.alias, i.estado === 'pausado' ? h('small', { class: 'suave' }, ` · ${t('doc.pausado')}`) : null), h('td', {}, nombreClase(i.classId)),
          h('td', { class: 'num' }, i.stats?.mejorWpm ? Math.round(i.stats.mejorWpm) : '—'), h('td', { class: 'num' }, i.stats?.precisionProm ? `${i.stats.precisionProm} %` : '—'),
          h('td', { class: 'num' }, t('doc.min', { n: Math.round(i.stats?.minutos || 0) })), h('td', { class: 'tabla__spark' }, mias.length > 1 ? sparkline(mias, { color: estado === 'atrasado' || estado === 'inactivo' ? 'var(--mal)' : 'var(--ok)', etiqueta: t('doc.evolucion', { n: i.alias }) }) : ''),
          h('td', {}, textoUltima(i.stats?.ultimaPractica)), h('td', {}, pill(estado)));
      }));
      if (!f.length) cuerpoTabla.append(h('tr', {}, h('td', { colspan: 8, class: 'tabla__vacio' }, inscs.length ? t('doc.ningunoCoincide') : t('doc.sinEstudiantes'))));
      contador.textContent = `${f.length} ${f.length === 1 ? t('doc.estudiante') : t('doc.estudiantes')}`;
    };
    const th = (campo, etq, num) => h('th', { scope: 'col', class: num ? 'num' : '', 'aria-sort': orden.campo === campo ? (orden.asc ? 'ascending' : 'descending') : 'none' },
      h('button', { class: 'tabla__orden', type: 'button', onclick: () => { orden = { campo, asc: orden.campo === campo ? !orden.asc : true }; pintar(); } }, etq, icono('arrow', { tam: 12 })));
    const chips = [{ id: 'todas', nombre: t('doc.todasClases') }, ...clases].map((c) => h('button', { class: 'filtro', type: 'button', 'aria-pressed': String(c.id === claseSel), onclick: () => { claseSel = c.id; pintar(); } }, c.nombre));
    pintarTabla();
    return h('section', { class: 'panel panel--tabla' },
      h('div', { class: 'tabla-herr' }, h('div', { class: 'filtros', role: 'group', 'aria-label': t('doc.filtrarClase') }, chips),
        h('div', { class: 'fila' }, contador, h('input', { class: 'input input--sm', type: 'search', placeholder: t('doc.buscarPh'), 'aria-label': t('doc.buscarAria'), value: texto, oninput: (e) => { texto = e.target.value; pintarTabla(); } }))),
      h('div', { class: 'tabla-scroll tabla-scroll--fija' }, h('table', { class: 'tabla tabla--lista' }, h('thead', {}, h('tr', {}, th('alias', t('doc.th.est')), th('clase', t('doc.th.clase')), th('ppm', t('doc.th.ppm'), true), th('pre', t('doc.th.pre'), true), th('min', t('doc.th.tiempo'), true), h('th', { scope: 'col' }, t('doc.th.evolucion')), th('ult', t('doc.th.ult')), h('th', { scope: 'col' }, t('doc.th.estado')))), cuerpoTabla)));
  }
  const abrirEstudiante = (i) => modalEstudiante({ insc: i, clase: claseDe(i.classId), sesiones, alCambiar: refrescar });

  /* ── Clases ── */
  function vistaClases() {
    if (!clases.length) return vistaEstudiantes();
    return h('section', { class: 'clases-grid' }, clases.map((c) => {
      const n = inscs.filter((i) => i.classId === c.id).length;
      const porLista = Number(c.grado) <= 2;   // solo 2.º ingresa por lista; de 3.º a 6.º todos entran con Google
      return h('article', { class: 'panel clase-panel' },
        h('header', { class: 'clase-panel__cab', style: { '--c': c.color || '#6C4CF5' } }, h('div', {}, h('h2', {}, c.nombre), h('small', { class: 'suave' }, `${t('grado.etq', { g: c.grado })}${c.grupo ? ` · ${c.grupo}` : ''} · ${n} ${n === 1 ? t('doc.estudiante') : t('doc.estudiantes')}`)),
          h('div', { class: 'codigos' },
            porLista && c.claveAlumnos ? h('div', { class: 'codigos__item' }, h('small', {}, t('doc.ingresoLista')), h('button', { class: 'codigo codigo--acceso', type: 'button', title: t('doc.ingresoListaTitle'), onclick: async () => { try { await navigator.clipboard.writeText(c.claveAlumnos); toast(t('doc.codigoCopiado', { c: c.claveAlumnos })); } catch { toast(t('doc.codigoMostrar', { c: c.claveAlumnos }), { tipo: 'info' }); } } }, c.claveAlumnos, icono('copy', { tam: 14 }))) : null,
            h('div', { class: 'codigos__item' }, h('small', {}, t('doc.conGoogle')), h('button', { class: 'codigo', type: 'button', title: t('doc.compartirTitle'), onclick: () => modalCompartir(c) }, c.codigo, icono('qr', { tam: 14 }))))),
        h('div', { class: 'fila fila--envuelve' },
          porLista ? h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => modalAlumnos({ clase: c, alTerminar: refrescar }) }, icono('users', { tam: 16 }), t('doc.agregarEst')) : null,
          porLista && c.claveAlumnos ? h('button', { class: 'btn btn--suave btn--sm', type: 'button', title: t('doc.publicarTitle'), onclick: async () => { try { await C.publicarLista(docente, c); toast(t('doc.listaPublicada', { c: c.claveAlumnos })); } catch (e) { toast(e?.code === 'permission-denied' ? t('doc.faltanReglas') : t('doc.noPublicar'), { tipo: 'error', ms: 6000 }); } } }, icono('refresh', { tam: 16 }), t('doc.publicarLista')) : null,
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => modalClase({ clase: c, alGuardar: refrescar }) }, icono('edit', { tam: 16 }), t('doc.editar')),
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: t('doc.codigoNuevoQ'), mensaje: t('doc.codigoNuevoMsg'), si: t('doc.generar') })) { try { await C.regenerarCodigo(c); await refrescar(); toast(t('doc.codigoRenovado')); } catch (e) { toast(e.message, { tipo: 'error' }); } } } }, icono('refresh', { tam: 16 }), t('doc.nuevoCodigo')),
          h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: t('doc.eliminarQ', { n: c.nombre }), mensaje: t('doc.eliminarMsg'), si: t('doc.eliminar'), peligro: true })) { await C.eliminarClase(c, inscs.filter((i) => i.classId === c.id)); await refrescar(); toast(t('doc.claseEliminada')); } } }, icono('trash', { tam: 16 }), t('doc.eliminar'))));
    }));
  }

  /* ── Tareas ── */
  async function vistaTareas() {
    if (!clases.length) return vistaEstudiantes();
    const sel = h('select', { class: 'input input--sm', 'aria-label': t('doc.claseAria'), onchange: (e) => { claseTareas = clases.find((c) => c.id === e.target.value); pintar(); } }, clases.map((c) => h('option', { value: c.id, selected: c.id === claseTareas.id }, c.nombre)));
    const tareas = await C.tareasDeClase(docente, claseTareas).catch(() => []);
    const entregasPor = {};
    await Promise.all(tareas.map(async (tr) => { entregasPor[tr.id] = await C.entregasDeTarea(docente, tr).catch(() => []); }));
    const total = inscs.filter((i) => i.classId === claseTareas.id).length;
    return h('section', { class: 'panel' },
      h('header', { class: 'panel__cab' }, h('div', { class: 'fila' }, h('h2', {}, t('doc.tareas')), sel), h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => modalTarea({ clase: claseTareas, alGuardar: refrescar }) }, icono('plus', { tam: 16 }), t('doc.nuevaTarea'))),
      tareas.length ? h('ul', { class: 'tareas tareas--docente' }, tareas.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0)).map((tr) => {
        const ents = entregasPor[tr.id] || [];
        return h('li', { class: 'tarea' }, h('div', { class: 'tarea__txt' }, h('strong', {}, tr.titulo), h('small', { class: 'suave' }, `${['leccion', 'ejercicio', 'juego'].includes(tr.tipo) ? t(`doc.tipo.${tr.tipo}`) : tr.tipo}${tr.vence ? t('doc.vence', { f: new Date(tr.vence).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) }) : ''}`)),
          h('span', { class: 'pill pill--ok' }, t('doc.entregas', { a: ents.length, b: total })),
          h('div', { class: 'fila' }, h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => verEntregas(tr, ents) }, t('doc.verEntregas')),
            h('button', { class: 'btn btn--suave btn--sm', type: 'button', 'aria-label': t('doc.eliminarAria', { t: tr.titulo }), onclick: async () => { if (await confirmar({ titulo: t('doc.eliminarTareaQ'), mensaje: t('doc.eliminarTareaMsg'), si: t('doc.eliminar'), peligro: true })) { await C.eliminarTarea(tr); refrescar(); } } }, icono('trash', { tam: 16 }))));
      })) : h('p', { class: 'suave' }, t('doc.sinTareas')));
  }
  async function verEntregas(tr, ents) {
    const { abrirCapa } = await import('../overlay.js');
    const quien = (uid) => inscs.find((i) => i.uid === uid)?.alias || '—';
    const filas = inscs.filter((i) => i.classId === tr.classId).map((i) => ({ i, e: ents.find((x) => x.uid === i.uid) }));
    abrirCapa({ titulo: tr.titulo, tipo: 'dialogo', contenido: h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, [t('doc.th.est'), t('doc.ent.th.estado'), t('doc.th.ppm'), t('doc.th.pre'), t('doc.ent.th.nota')].map((x) => h('th', { scope: 'col' }, x)))),
      h('tbody', {}, filas.map(({ i, e }) => h('tr', {}, h('th', { scope: 'row' }, i.alias), h('td', {}, e ? (e.estado === 'tarde' ? t('doc.ent.tarde') : t('doc.ent.entregada')) : t('doc.ent.pendiente')), h('td', { class: 'num' }, e ? e.wpm : '—'), h('td', { class: 'num' }, e ? `${e.precision} %` : '—'),
        h('td', {}, e ? h('input', { class: 'input input--sm', type: 'number', min: 0, max: 5, step: 0.1, value: e.nota ?? '', 'aria-label': t('doc.ent.notaAria', { n: i.alias }), style: { width: '5rem' },
          onchange: async (ev) => { try { await import('../../db/store.js').then((s) => s.esperarMax(s.actualizar(`submissions/${e.id}`, { nota: Number(ev.target.value) }))); e.nota = Number(ev.target.value); toast(t('doc.ent.notaOk')); } catch { toast(t('doc.ent.notaErr'), { tipo: 'error' }); } } }) : '')))))) });
  }

  const vacio = (titulo, texto, botones = []) => h('section', { class: 'panel vacio' }, h('h2', {}, titulo), h('p', { class: 'suave' }, texto), h('div', { class: 'fila fila--envuelve' }, botones));
  const ejemploBtn = () => h('button', { class: 'btn btn--suave', type: 'button', onclick: async () => {
    const c = await C.crearClase(docente, { nombre: t('doc.ejemploNombre'), grado: 4, grupo: 'Demo' }); await sembrarEjemplo(docente, c); await refrescar(); toast(t('doc.ejemploOk'));
  } }, t('doc.ejemploBtn'));

  async function pintar() {
    retosVista?.destruir(); retosVista = null;
    if (tab === 'retos') {
      retosVista = vistaRetos({ docente, clases, inscs, claseId: claseRetos || clases[0]?.id || null, alElegirClase: (id) => { claseRetos = id; pintar(); } });
      actualRetos = retosVista;
    }
    const contenido = tab === 'retos' ? retosVista.el : tab === 'tareas' ? await vistaTareas() : tab === 'clases' ? vistaClases() : vistaEstudiantes();
    raiz.replaceChildren(...[cabecera(), state.modo === 'demo' ? h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, t('doc.demoAviso'))) : null, tabs(), contenido].filter(Boolean));
  }
  await cargar(); await pintar();
  return raiz;
}

export function destroy() { actualRetos?.destruir(); actualRetos = null; }
