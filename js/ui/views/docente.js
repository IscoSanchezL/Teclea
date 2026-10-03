/**
 * Clases y estudiantes (vista sobria, datos reales): estudiantes, clases y tareas.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import * as C from '../../db/clases.js';
import { estadoDe, textoUltima, aCSV, descargar, ETIQUETAS, sembrarEjemplo } from '../../db/analitica.js';
import { icono } from '../icons.js';
import { sparkline } from '../graficas.js';
import { toast, confirmar } from '../overlay.js';
import { pill } from './_staff.js';
import { modalClase, modalCompartir, modalAlumnos, modalTarea, modalEstudiante } from './docente-modales.js';

const TABS = [['estudiantes', 'Estudiantes'], ['clases', 'Clases'], ['tareas', 'Tareas']];

export async function render({ query }) {
  const docente = state.user;
  let clases = [], inscs = [], sesiones = [];
  let tab = TABS.some(([t]) => t === query.tab) ? query.tab : 'estudiantes';
  let claseSel = 'todas', texto = '', orden = { campo: 'alias', asc: true }, claseTareas = null;
  const raiz = h('div', { class: 'pagina' });
  const cuerpo = h('div', { class: 'pila' });

  async function cargar() {
    [clases, inscs] = await Promise.all([C.listarClases(docente), C.inscripcionesDocente(docente)]);
    sesiones = await import('../../db/store.js').then((s) => s.consultar('sessions', { donde: [['docenteId', '==', docente.uid]], orden: ['creadoEn', 'desc'], limite: 600 })).catch(() => []);
    if (!claseTareas || !clases.some((c) => c.id === claseTareas.id)) claseTareas = clases[0] || null;
  }
  const nombreClase = (id) => clases.find((c) => c.id === id)?.nombre || '—';
  const claseDe = (id) => clases.find((c) => c.id === id);
  const refrescar = async () => { await cargar(); pintar(); };

  /* ── Cabecera ── */
  function cabecera() {
    const acciones = [];
    if (tab === 'estudiantes' && inscs.length) acciones.push(h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: exportarCSV }, icono('download', { tam: 16 }), 'Exportar CSV'));
    acciones.push(h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => modalClase({ alGuardar: refrescar }) }, icono('plus', { tam: 16 }), 'Nueva clase'));
    return h('header', { class: 'pagina__cab' },
      h('div', {}, h('h1', {}, 'Clases y estudiantes'), h('p', { class: 'suave' }, `${clases.length} ${clases.length === 1 ? 'clase' : 'clases'} · ${inscs.length} estudiantes`)),
      h('div', { class: 'fila' }, acciones));
  }
  const tabs = () => h('div', { class: 'tabs tabs--3 tabs--staff', role: 'tablist' }, TABS.map(([id, t]) => h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(id === tab), onclick: () => { tab = id; pintar(); } }, t)));

  /* ── Estudiantes ── */
  function exportarCSV() {
    const filas = filtrados().map((i) => [i.alias, nombreClase(i.classId), Math.round(i.stats?.mejorWpm || 0), i.stats?.precisionProm || 0, Math.round(i.stats?.minutos || 0), i.stats?.lecciones || 0, textoUltima(i.stats?.ultimaPractica), ETIQUETAS[estadoDe(i, claseDe(i.classId)?.grado)]]);
    descargar('estudiantes-teclea.csv', aCSV(['Estudiante', 'Clase', 'PPM', 'Precisión (%)', 'Minutos', 'Lecciones', 'Última práctica', 'Estado'], filas));
    toast('CSV exportado');
  }
  const valorOrden = (i, c) => ({ alias: i.alias.toLowerCase(), clase: nombreClase(i.classId), ppm: i.stats?.mejorWpm || 0, pre: i.stats?.precisionProm || 0, min: i.stats?.minutos || 0, ult: i.stats?.ultimaPractica || 0 })[c];
  const filtrados = () => inscs.filter((i) => (claseSel === 'todas' || i.classId === claseSel) && i.alias.toLowerCase().includes(texto.toLowerCase()))
    .sort((a, b) => { const x = valorOrden(a, orden.campo), y = valorOrden(b, orden.campo); const r = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'es'); return orden.asc ? r : -r; });

  function vistaEstudiantes() {
    if (!clases.length) return vacio('Aún no tienes clases', 'Crea tu primera clase para obtener un código y agregar estudiantes.', [h('button', { class: 'btn btn--primary', type: 'button', onclick: () => modalClase({ alGuardar: refrescar }) }, 'Crear mi primera clase'), ...(state.modo === 'demo' ? [ejemploBtn()] : [])]);
    const cuerpoTabla = h('tbody'), contador = h('span', { class: 'suave' });
    const pintarTabla = () => {
      const f = filtrados();
      cuerpoTabla.replaceChildren(...f.map((i) => {
        const mias = sesiones.filter((x) => x.uid === i.uid).slice(0, 8).reverse().map((x) => x.wpm);
        const estado = estadoDe(i, claseDe(i.classId)?.grado);
        return h('tr', { class: 'fila-click', tabindex: 0, onclick: () => abrirEstudiante(i), onkeydown: (e) => { if (e.key === 'Enter') abrirEstudiante(i); } },
          h('th', { scope: 'row' }, i.alias, i.estado === 'pausado' ? h('small', { class: 'suave' }, ' · pausado') : null), h('td', {}, nombreClase(i.classId)),
          h('td', { class: 'num' }, i.stats?.mejorWpm ? Math.round(i.stats.mejorWpm) : '—'), h('td', { class: 'num' }, i.stats?.precisionProm ? `${i.stats.precisionProm} %` : '—'),
          h('td', { class: 'num' }, `${Math.round(i.stats?.minutos || 0)} min`), h('td', { class: 'tabla__spark' }, mias.length > 1 ? sparkline(mias, { color: estado === 'atrasado' || estado === 'inactivo' ? 'var(--mal)' : 'var(--ok)', etiqueta: `Evolución de ${i.alias}` }) : ''),
          h('td', {}, textoUltima(i.stats?.ultimaPractica)), h('td', {}, pill(estado)));
      }));
      if (!f.length) cuerpoTabla.append(h('tr', {}, h('td', { colspan: 8, class: 'tabla__vacio' }, inscs.length ? 'Ningún estudiante coincide con el filtro.' : 'Todavía no hay estudiantes. Comparte el código de la clase o crea cuentas con PIN desde la pestaña “Clases”.')));
      contador.textContent = `${f.length} estudiante${f.length === 1 ? '' : 's'}`;
    };
    const th = (campo, etq, num) => h('th', { scope: 'col', class: num ? 'num' : '', 'aria-sort': orden.campo === campo ? (orden.asc ? 'ascending' : 'descending') : 'none' },
      h('button', { class: 'tabla__orden', type: 'button', onclick: () => { orden = { campo, asc: orden.campo === campo ? !orden.asc : true }; pintar(); } }, etq, icono('arrow', { tam: 12 })));
    const chips = [{ id: 'todas', nombre: 'Todas las clases' }, ...clases].map((c) => h('button', { class: 'filtro', type: 'button', 'aria-pressed': String(c.id === claseSel), onclick: () => { claseSel = c.id; pintar(); } }, c.nombre));
    pintarTabla();
    return h('section', { class: 'panel panel--tabla' },
      h('div', { class: 'tabla-herr' }, h('div', { class: 'filtros', role: 'group', 'aria-label': 'Filtrar por clase' }, chips),
        h('div', { class: 'fila' }, contador, h('input', { class: 'input input--sm', type: 'search', placeholder: 'Buscar estudiante…', 'aria-label': 'Buscar estudiante', value: texto, oninput: (e) => { texto = e.target.value; pintarTabla(); } }))),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla tabla--lista' }, h('thead', {}, h('tr', {}, th('alias', 'Estudiante'), th('clase', 'Clase'), th('ppm', 'PPM', true), th('pre', 'Precisión', true), th('min', 'Tiempo', true), h('th', { scope: 'col' }, 'Evolución'), th('ult', 'Última práctica'), h('th', { scope: 'col' }, 'Estado'))), cuerpoTabla)));
  }
  const abrirEstudiante = (i) => modalEstudiante({ insc: i, clase: claseDe(i.classId), sesiones, alCambiar: refrescar });

  /* ── Clases ── */
  function vistaClases() {
    if (!clases.length) return vistaEstudiantes();
    return h('section', { class: 'clases-grid' }, clases.map((c) => {
      const n = inscs.filter((i) => i.classId === c.id).length;
      return h('article', { class: 'panel clase-panel' },
        h('header', { class: 'clase-panel__cab', style: { '--c': c.color || '#6C4CF5' } }, h('div', {}, h('h2', {}, c.nombre), h('small', { class: 'suave' }, `${c.grado}.º${c.grupo ? ` · ${c.grupo}` : ''} · ${n} estudiante${n === 1 ? '' : 's'}`)),
          h('button', { class: 'codigo', type: 'button', title: 'Compartir código, enlace y QR', onclick: () => modalCompartir(c) }, c.codigo, icono('qr', { tam: 14 }))),
        h('div', { class: 'fila fila--envuelve' },
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => modalAlumnos({ clase: c, alTerminar: refrescar }) }, icono('users', { tam: 16 }), 'Agregar estudiantes'),
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => modalClase({ clase: c, alGuardar: refrescar }) }, icono('edit', { tam: 16 }), 'Editar'),
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: '¿Generar un código nuevo?', mensaje: 'El código anterior dejará de funcionar para nuevos estudiantes. Los que ya están dentro no se afectan.', si: 'Generar' })) { try { await C.regenerarCodigo(c); await refrescar(); toast('Código renovado'); } catch (e) { toast(e.message, { tipo: 'error' }); } } } }, icono('refresh', { tam: 16 }), 'Nuevo código'),
          h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: `¿Eliminar ${c.nombre}?`, mensaje: 'Se elimina la clase y su lista de estudiantes. Las cuentas de los estudiantes y su progreso NO se borran.', si: 'Eliminar', peligro: true })) { await C.eliminarClase(c, inscs.filter((i) => i.classId === c.id)); await refrescar(); toast('Clase eliminada'); } } }, icono('trash', { tam: 16 }), 'Eliminar')));
    }));
  }

  /* ── Tareas ── */
  async function vistaTareas() {
    if (!clases.length) return vistaEstudiantes();
    const sel = h('select', { class: 'input input--sm', 'aria-label': 'Clase', onchange: (e) => { claseTareas = clases.find((c) => c.id === e.target.value); pintar(); } }, clases.map((c) => h('option', { value: c.id, selected: c.id === claseTareas.id }, c.nombre)));
    const tareas = await C.tareasDeClase(docente, claseTareas).catch(() => []);
    const entregasPor = {};
    await Promise.all(tareas.map(async (t) => { entregasPor[t.id] = await C.entregasDeTarea(docente, t).catch(() => []); }));
    const total = inscs.filter((i) => i.classId === claseTareas.id).length;
    return h('section', { class: 'panel' },
      h('header', { class: 'panel__cab' }, h('div', { class: 'fila' }, h('h2', {}, 'Tareas'), sel), h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => modalTarea({ clase: claseTareas, alGuardar: refrescar }) }, icono('plus', { tam: 16 }), 'Nueva tarea')),
      tareas.length ? h('ul', { class: 'tareas tareas--docente' }, tareas.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0)).map((t) => {
        const ents = entregasPor[t.id] || [];
        return h('li', { class: 'tarea' }, h('div', { class: 'tarea__txt' }, h('strong', {}, t.titulo), h('small', { class: 'suave' }, `${{ leccion: 'Lección', ejercicio: 'Texto propio', juego: 'Juego' }[t.tipo] || t.tipo}${t.vence ? ` · vence ${new Date(t.vence).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}` : ''}`)),
          h('span', { class: 'pill pill--ok' }, `${ents.length} / ${total} entregas`),
          h('div', { class: 'fila' }, h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => verEntregas(t, ents) }, 'Ver entregas'),
            h('button', { class: 'btn btn--suave btn--sm', type: 'button', 'aria-label': `Eliminar ${t.titulo}`, onclick: async () => { if (await confirmar({ titulo: '¿Eliminar tarea?', mensaje: 'Los estudiantes dejarán de verla.', si: 'Eliminar', peligro: true })) { await C.eliminarTarea(t); refrescar(); } } }, icono('trash', { tam: 16 }))));
      })) : h('p', { class: 'suave' }, 'Aún no hay tareas en esta clase. Crea una: pueden ser lecciones, textos tuyos o juegos.'));
  }
  async function verEntregas(t, ents) {
    const { abrirCapa } = await import('../overlay.js');
    const quien = (uid) => inscs.find((i) => i.uid === uid)?.alias || '—';
    const filas = inscs.filter((i) => i.classId === t.classId).map((i) => ({ i, e: ents.find((x) => x.uid === i.uid) }));
    abrirCapa({ titulo: t.titulo, tipo: 'dialogo', contenido: h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, ['Estudiante', 'Estado', 'PPM', 'Precisión', 'Nota'].map((x) => h('th', { scope: 'col' }, x)))),
      h('tbody', {}, filas.map(({ i, e }) => h('tr', {}, h('th', { scope: 'row' }, i.alias), h('td', {}, e ? (e.estado === 'tarde' ? 'Entregada tarde' : 'Entregada') : 'Pendiente'), h('td', { class: 'num' }, e ? e.wpm : '—'), h('td', { class: 'num' }, e ? `${e.precision} %` : '—'),
        h('td', {}, e ? h('input', { class: 'input input--sm', type: 'number', min: 0, max: 5, step: 0.1, value: e.nota ?? '', 'aria-label': `Nota de ${i.alias}`, style: { width: '5rem' },
          onchange: async (ev) => { try { await import('../../db/store.js').then((s) => s.esperarMax(s.actualizar(`submissions/${e.id}`, { nota: Number(ev.target.value) }))); e.nota = Number(ev.target.value); toast('Nota guardada'); } catch { toast('No se pudo guardar la nota.', { tipo: 'error' }); } } }) : '')))))) });
  }

  const vacio = (titulo, texto, botones = []) => h('section', { class: 'panel vacio' }, h('h2', {}, titulo), h('p', { class: 'suave' }, texto), h('div', { class: 'fila fila--envuelve' }, botones));
  const ejemploBtn = () => h('button', { class: 'btn btn--suave', type: 'button', onclick: async () => {
    const c = await C.crearClase(docente, { nombre: '4.º A (ejemplo)', grado: 4, grupo: 'Demo' }); await sembrarEjemplo(docente, c); await refrescar(); toast('Clase de ejemplo creada');
  } }, 'Crear clase de ejemplo (demo)');

  async function pintar() {
    const contenido = tab === 'tareas' ? await vistaTareas() : tab === 'clases' ? vistaClases() : vistaEstudiantes();
    raiz.replaceChildren(cabecera(), state.modo === 'demo' ? h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, 'Modo demostración: los datos viven solo en este navegador. Con Firebase configurado se guardan en la nube.')) : null, tabs(), contenido);
  }
  await cargar(); await pintar();
  return raiz;
}
