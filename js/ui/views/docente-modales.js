/**
 * Ventanas del panel docente: nueva/editar clase, alumnos con PIN, tareas, ejercicios, detalle del estudiante, boletín.
 */
import { state } from '../../core/state.js';
import { marca, colegioMarca } from '../../core/marca.js';
import { t, locale } from '../../i18n/index.js';
import { h, imprimir } from '../../core/utils.js';
import { GRADOS, perfilDeGrado } from '../../core/grados.js';
import * as C from '../../db/clases.js';
import { estadoDe, textoUltima, resumenClase, ETIQUETAS } from '../../db/analitica.js';
import { cargarIndice } from '../../lessons/curriculo.js';
import { JUEGOS } from '../../game/juegos.js';
import { icono } from '../icons.js';
import { abrirCapa, toast, confirmar } from '../overlay.js';
import { campo, interruptor } from '../componentes.js';
import { sparkline, tecladoCalor } from '../graficas.js';
import { qrSVG } from '../qr.js';
import { pill } from './_staff.js';

const campoSelect = (etiqueta, opciones, valor) => {
  const sel = h('select', { class: 'input' }, opciones.map(([v, etq]) => h('option', { value: v, selected: String(v) === String(valor) }, etq)));
  return { sel, nodo: h('div', { class: 'campo' }, h('label', { class: 'campo__etiqueta' }, etiqueta), sel) };
};

/* ═════════════ Clase: crear / editar ═════════════ */
export function modalClase({ clase = null, alGuardar }) {
  const nombre = campo({ etiqueta: t('dm.nombreClase'), value: clase?.nombre || '', maxlength: 60, placeholder: t('dm.nombrePh'), required: true });
  const grupo = campo({ etiqueta: t('dm.grupo'), value: clase?.grupo || '', maxlength: 20, placeholder: t('dm.grupoPh') });
  const grado = campoSelect(t('dm.grado'), GRADOS.map((g) => [g, t('grado.etq', { g })]), clase?.grado || 4);
  let color = clase?.color || C.COLORES_CLASE[0];
  const colores = h('div', { class: 'colores' }, C.COLORES_CLASE.map((c) => h('button', { type: 'button', class: 'color', style: { background: c }, 'aria-label': t('dm.colorAria', { c }), 'aria-pressed': String(c === color),
    onclick: (e) => { color = c; colores.querySelectorAll('.color').forEach((b) => b.setAttribute('aria-pressed', 'false')); e.currentTarget.setAttribute('aria-pressed', 'true'); } })));
  let ranking = clase?.config?.rankingVisible !== false;
  const meta = campo({ etiqueta: t('dm.meta'), type: 'number', min: 1000, max: 1000000, step: 1000, value: clase?.config?.metaClase || 20000, ayuda: t('dm.metaAyuda') });
  const mundos = new Set(clase?.config?.mundosBloqueados || []);
  const abiertos = new Set(clase?.config?.mundosAbiertos || []);
  const repintar = [];
  const chipsMundos = h('div', { class: 'filtros' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
    const b = h('button', { type: 'button', class: 'filtro', 'aria-pressed': 'false', title: t('dm.mundoTitle') }, t('dm.mundo', { n }));
    const pintar = () => { b.dataset.estado = mundos.has(n) ? 'cerrado' : abiertos.has(n) ? 'abierto' : ''; b.setAttribute('aria-pressed', String(mundos.has(n) || abiertos.has(n))); b.textContent = `${t('dm.mundo', { n })}${mundos.has(n) ? ` · ${t('dm.cerrado')}` : abiertos.has(n) ? ` · ${t('dm.abierto')}` : ''}`; };
    b.onclick = () => { if (mundos.has(n)) mundos.delete(n); else if (abiertos.has(n)) { abiertos.delete(n); mundos.add(n); } else abiertos.add(n); pintar(); };
    pintar(); repintar.push(pintar); return b;
  }));
  // Acciones masivas: todos abiertos, todos cerrados o todos en su estado normal (sin selección)
  const masivo = (texto, aplicar) => h('button', { type: 'button', class: 'btn btn--suave btn--sm', onclick: () => { for (let n = 1; n <= 10; n++) { abiertos.delete(n); mundos.delete(n); aplicar(n); } repintar.forEach((f) => f()); } }, texto);
  const accionesMundos = h('div', { class: 'fila fila--envuelve' },
    masivo(t('dm.selTodos'), (n) => abiertos.add(n)), masivo(t('dm.deselTodos'), () => {}), masivo(t('dm.cerrarTodos'), (n) => mundos.add(n)));
  const err = h('p', { class: 'mensaje-error', hidden: true });
  const form = h('form', { class: 'pila', onsubmit: async (e) => {
    e.preventDefault();
    if (!nombre.input.value.trim()) { err.textContent = t('dm.errNombre'); err.hidden = false; return; }
    const cfg = { rankingVisible: ranking, metaClase: Math.max(1000, Number(meta.input.value) || 20000), mundosBloqueados: [...mundos], mundosAbiertos: [...abiertos] };
    try {
      const datos = { nombre: nombre.input.value.trim(), grupo: grupo.input.value.trim(), grado: Number(grado.sel.value), color };
      const c = clase ? await C.actualizarClase(clase, { ...datos, config: { ...clase.config, ...cfg } }) : await C.crearClase(state.user, datos);
      if (!clase) { await C.actualizarClase(c, { config: { ...c.config, ...cfg } }).catch(() => {}); }
      capa.cerrar(); alGuardar?.(c); toast(clase ? t('dm.claseActualizada') : t('dm.claseCreada', { c: c.codigo }));
    } catch (er) { err.textContent = er.message || t('dm.noGuardar'); err.hidden = false; }
  } },
    nombre.nodo, h('div', { class: 'rejilla-campos' }, grado.nodo, grupo.nodo), h('div', { class: 'campo' }, h('span', { class: 'campo__etiqueta' }, t('dm.color')), colores),
    interruptor({ etiqueta: t('dm.ranking'), descripcion: t('dm.rankingDesc'), activo: ranking, alCambiar: (v) => { ranking = v; } }),
    meta.nodo,
    h('div', { class: 'campo' }, h('span', { class: 'campo__etiqueta' }, t('dm.mundos')), accionesMundos, chipsMundos, h('span', { class: 'campo__ayuda suave' }, t('dm.mundosAyuda'))),
    err, h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'submit' }, clase ? t('dm.guardarCambios') : t('dm.crearClase'))));
  const capa = abrirCapa({ titulo: clase ? t('dm.editarClase') : t('dm.nuevaClase'), contenido: form, tipo: 'dialogo' });
}

/* ═════════════ Compartir clase (código + enlace + QR) ═════════════ */
export async function modalCompartir(clase) {
  const enlace = `${location.origin}${location.pathname}#/unirse?codigo=${clase.codigo}`;
  const qr = h('div', { class: 'compartir__qr' });
  qrSVG(enlace, { tam: 176 }).then((s) => { if (s) qr.append(s); });
  abrirCapa({ titulo: t('dm.unirseA', { n: clase.nombre }), tipo: 'dialogo', contenido: h('div', { class: 'compartir' },
    h('p', { class: 'suave' }, t('dm.googleCodigo')),
    h('div', { class: 'compartir__codigo' }, clase.codigo),
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(clase.codigo); toast(t('dm.codigoCopiado')); } catch { toast(clase.codigo, { tipo: 'info' }); } } }, icono('copy', { tam: 16 }), t('dm.copiarCodigo')),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(enlace); toast(t('dm.enlaceCopiado')); } catch { toast(enlace, { tipo: 'info' }); } } }, icono('copy', { tam: 16 }), t('dm.copiarEnlace')),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => imprimir(h('div', { class: 'hoja' }, h('h1', {}, `${marca.nombre} · ${clase.nombre}`), h('p', {}, t('dm.escribeCodigoQR')), h('div', { class: 'compartir__codigo' }, clase.codigo), qr.cloneNode(true)))}, icono('printer', { tam: 16 }), t('dm.imprimir'))),
    qr) });
}

/* ═════════════ Alumnos con PIN ═════════════ */
export function tarjetasAcceso(clase, lista) {
  const url = `${location.host}${location.pathname}`;
  return h('div', { class: 'hoja' }, h('h1', {}, `${marca.nombre} · ${clase.nombre}`),
    h('p', {}, t('dm.tarjetaInstr', { url })),
    h('div', { class: 'compartir__codigo' }, clase.claveAlumnos || ''),
    h('div', { class: 'tarjetas-acceso' }, lista.filter((a) => a.ok !== false).map((a) => h('div', { class: 'tarjeta-acceso' }, h('span', { style: { fontSize: '2.4rem' } }, a.emoji || '🦊'), h('strong', {}, a.alias || a.nombre), h('small', {}, a.nombre)))));
}

export function modalAlumnos({ clase, alTerminar }) {
  const area = h('textarea', { class: 'input', rows: 8, placeholder: t('dm.nombresPh').replace(/\\n/g, '\n'), 'aria-label': t('dm.nombresAria') });
  const cont = h('div', { class: 'pila' });
  const fijada = Boolean(clase.claveAlumnos);
  const clave = campo({ etiqueta: t('dm.claveEtq'), value: clase.claveAlumnos || C.claveSugerida(clase), maxlength: 12, autocapitalize: 'characters', readonly: fijada || null,
    ayuda: fijada ? t('dm.claveFijada') : t('dm.claveAyuda') });
  clave.input.addEventListener('input', () => { clave.input.value = clave.input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
  const boton = h('button', { class: 'btn btn--primary', type: 'button' }, icono('plus', { tam: 16 }), t('dm.crearCuentas'));
  boton.onclick = async () => {
    const nombres = area.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 60);
    if (!nombres.length) return toast(t('dm.alMenosUno'), { tipo: 'error' });
    if (!C.claveValida(clave.input.value)) return toast(t('dm.claveInvalida'), { tipo: 'error' });
    boton.disabled = true; area.disabled = true;
    const prog = h('p', { class: 'suave', 'aria-live': 'polite' }, t('dm.creando')); cont.replaceChildren(prog);
    const lista = await C.crearEstudiantes(state.user, clase, nombres, { clave: clave.input.value, alProgreso: (i, tot, n) => { prog.textContent = t('dm.creandoN', { i, t: tot, n }); } });
    const pendientes = lista.filter((a) => a.pendiente);
    alTerminar?.();
    const ok = lista.filter((a) => a.ok), mal = lista.filter((a) => !a.ok);
    cont.replaceChildren(...[h('p', {}, `${t('dm.cuentasListas', { n: ok.length })}${mal.length ? t('dm.conProblemas', { n: mal.length }) : ''}.`),
      pendientes.length ? h('div', { class: 'aviso pila', role: 'alert' }, h('p', {}, t('dm.pendientes', { n: pendientes.length })), h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => { area.value = pendientes.map((a) => a.nombre).join('\n'); boton.disabled = false; area.disabled = false; cont.replaceChildren(h('p', { class: 'suave' }, t('dm.pendientesListos'))); } }, t('dm.continuarPend'))) : null,
      lista.errorLista ? h('p', { class: 'mensaje-error', role: 'alert' }, lista.errorLista === 'permiso' ? t('dm.errPermiso') : t('dm.errLista', { e: lista.errorLista })) : h('p', { class: 'suave' }, t('dm.listaOk', { c: clase.claveAlumnos })),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, [t('dm.th.est'), t('dm.th.aparece'), '', ''].map((txt) => h('th', { scope: 'col' }, txt)))),
        h('tbody', {}, lista.map((a) => h('tr', {}, h('th', { scope: 'row' }, a.nombre), h('td', {}, a.ok ? `${a.emoji} ${a.alias}` : '—'), h('td', {}, ''), h('td', { class: a.ok ? '' : 'mensaje-error' }, a.ok ? '' : a.error)))))),
      h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'button', onclick: () => imprimir(tarjetasAcceso(clase, lista)) }, icono('printer', { tam: 16 }), t('dm.imprimirTarjetas')))].filter(Boolean));
  };
  abrirCapa({ titulo: t('dm.agregarA', { n: clase.nombre }), tipo: 'dialogo', contenido: h('div', { class: 'pila' },
    h('p', { class: 'suave' }, t('dm.agregarTexto')),
    clave.nodo, area, h('div', { class: 'fila fila--fin' }, boton), cont) });
}

/* ═════════════ Tareas ═════════════ */
export async function modalTarea({ clase, alGuardar }) {
  const indice = await cargarIndice();
  const ejercicios = await C.ejerciciosDeClase(state.user, clase).catch(() => []);
  const titulo = campo({ etiqueta: t('dm.titulo'), maxlength: 120, required: true, placeholder: t('dm.tituloPh') });
  const tipo = campoSelect(t('dm.queHacer'), [['leccion', t('dm.op.leccion')], ['ejercicio', t('dm.op.ejercicio')], ['juego', t('dm.op.juego')]], 'leccion');
  const lec = campoSelect(t('dm.leccion'), indice.map((l) => [l.id, t('inicio.sigLeccion', { m: l.mundo, titulo: l.titulo })]), indice[0]?.id);
  const ejSel = campoSelect(t('dm.texto'), ejercicios.length ? ejercicios.map((e) => [e.id, e.titulo]) : [['', t('dm.sinTextos')]], ejercicios[0]?.id);
  const juego = campoSelect(t('dm.juego'), JUEGOS.map((j) => [j.id, j.nombre]), JUEGOS[0].id);
  const nuevoTit = campo({ etiqueta: t('dm.tituloTextoNuevo'), maxlength: 120 });
  const nuevoTexto = h('textarea', { class: 'input', rows: 4, maxlength: 5000, placeholder: t('dm.textoPh') });
  const bloqueEj = h('div', { class: 'pila', hidden: true }, ejSel.nodo, h('details', {}, h('summary', {}, t('dm.crearTexto')), nuevoTit.nodo, nuevoTexto));
  const instr = campo({ etiqueta: t('dm.instr'), maxlength: 500 });
  const vence = campo({ etiqueta: t('dm.fechaLimite'), type: 'date' });
  const mostrar = () => { lec.nodo.hidden = tipo.sel.value !== 'leccion'; bloqueEj.hidden = tipo.sel.value !== 'ejercicio'; juego.nodo.hidden = tipo.sel.value !== 'juego'; };
  tipo.sel.onchange = mostrar; mostrar();
  const err = h('p', { class: 'mensaje-error', hidden: true });
  const capa = abrirCapa({ titulo: t('dm.tareaNueva', { n: clase.nombre }), tipo: 'dialogo', contenido: h('form', { class: 'pila', onsubmit: async (e) => {
    e.preventDefault(); err.hidden = true;
    try {
      let refId = tipo.sel.value === 'leccion' ? lec.sel.value : tipo.sel.value === 'juego' ? juego.sel.value : ejSel.sel.value;
      if (tipo.sel.value === 'ejercicio' && nuevoTexto.value.trim().length >= 5) refId = (await C.crearEjercicioPropio(state.user, clase, { titulo: nuevoTit.input.value || titulo.input.value, texto: nuevoTexto.value })).id;
      if (!refId) throw new Error(t('dm.elige'));
      const tarea = await C.crearTarea(state.user, clase, { titulo: titulo.input.value || t('dm.tareaDef'), tipo: tipo.sel.value, refId, instrucciones: instr.input.value, vence: vence.input.value ? new Date(`${vence.input.value}T23:59:59`).getTime() : null });
      capa.cerrar(); alGuardar?.(tarea); toast(t('dm.tareaCreada'));
    } catch (er) { err.textContent = er.message || t('dm.noTarea'); err.hidden = false; }
  } }, titulo.nodo, tipo.nodo, lec.nodo, bloqueEj, juego.nodo, instr.nodo, vence.nodo, err, h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'submit' }, t('dm.crearTarea')))) });
}

/* ═════════════ Detalle de un estudiante ═════════════ */
export async function modalEstudiante({ insc, clase, sesiones, alCambiar }) {
  const s = insc.stats || {}, est = estadoDe(insc, clase?.grado), p = perfilDeGrado(insc.grado || clase?.grado || 4);
  const mias = sesiones.filter((x) => x.uid === insc.uid).sort((a, b) => (a.creadoEn || 0) - (b.creadoEn || 0));
  const serie = mias.slice(-12).map((x) => x.wpm);
  const calor = resumenClase([insc], mias).calor;
  const nota = h('textarea', { class: 'input', rows: 3, maxlength: 500, 'aria-label': t('dm.notaAria') }, insc.notaDocente || '');
  const dato = (etq, v) => h('div', { class: 'dato' }, h('small', {}, etq), h('strong', {}, v));
  const capa = abrirCapa({ titulo: insc.alias, tipo: 'dialogo', contenido: h('div', { class: 'pila' },
    h('div', { class: 'fila fila--entre' }, pill(est), h('span', { class: 'suave' }, t('dm.ultima', { c: clase?.nombre || '', u: textoUltima(s.ultimaPractica) }))),
    h('div', { class: 'datos' }, dato(t('dm.mejorPpm'), s.mejorWpm ? Math.round(s.mejorWpm) : '—'), dato(t('dm.precision'), s.precisionProm ? `${s.precisionProm} %` : '—'), dato(t('dm.minutos'), Math.round(s.minutos || 0)), dato(t('dm.lecciones'), s.lecciones || 0), dato('XP', s.xp || 0), dato(t('dm.medallas'), s.medallas || 0)),
    h('p', { class: 'suave' }, t('dm.metaDe', { g: insc.grado || clase?.grado || 4, a: p.ppmMin, b: p.ppmMax, c: p.precision })),
    serie.length > 1 ? h('div', {}, h('small', { class: 'suave' }, t('dm.evolPpm')), h('div', {}, sparkline(serie, { ancho: 320, alto: 56, etiqueta: t('dm.ppm') }))) : null,
    Object.keys(calor).length ? h('div', {}, h('small', { class: 'suave' }, t('dm.teclasErrores')), tecladoCalor(calor)) : null,
    insc.pin ? h('p', {}, h('strong', {}, `${t('dm.acceso')} `), t('dm.codigoAcceso', { c: clase?.claveAlumnos || insc.pin })) : null,
    h('label', { class: 'campo' }, h('span', { class: 'campo__etiqueta' }, t('dm.notaPrivada')), nota),
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: async () => { try { await C.actualizarInscripcion(insc, { notaDocente: nota.value.slice(0, 500) }); insc.notaDocente = nota.value; toast(t('dm.notaGuardada')); } catch { toast(t('dm.noGuardar'), { tipo: 'error' }); } } }, t('dm.guardarNota')),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => imprimir(boletin({ insc, clase, mias })) }, icono('printer', { tam: 16 }), t('dm.boletin')),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { const nuevo = insc.estado === 'pausado' ? 'activo' : 'pausado'; await C.actualizarInscripcion(insc, { estado: nuevo }); insc.estado = nuevo; if (clase?.claveAlumnos) await C.publicarLista(state.user, clase).catch(() => {}); toast(nuevo === 'pausado' ? t('dm.pausado') : t('dm.reactivado')); alCambiar?.(); } }, insc.estado === 'pausado' ? t('dm.reactivar') : t('dm.pausar')),
      h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: t('dm.quitarQ', { n: insc.alias }), mensaje: t('dm.quitarMsg'), si: t('dm.quitar'), peligro: true })) { await C.quitarEstudiante(insc); if (clase?.claveAlumnos) await C.publicarLista(state.user, clase).catch(() => {}); capa.cerrar(); alCambiar?.(); } } }, t('dm.quitarClase')))) });
}

/* ═════════════ Boletín imprimible ═════════════ */
export function boletin({ insc, clase, mias = [] }) {
  const s = insc.stats || {}, p = perfilDeGrado(insc.grado || clase?.grado || 4);
  const fecha = new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const fila = (etq, v, extra = '') => h('tr', {}, h('th', { scope: 'row' }, etq), h('td', {}, v), h('td', {}, extra));
  return h('div', { class: 'hoja boletin' },
    h('header', { class: 'boletin__cab' }, marca.logo ? h('img', { src: marca.logo, alt: '', width: 56, height: 56 }) : null, h('div', {}, h('h1', {}, t('dm.bol.titulo', { n: marca.nombre })), h('p', {}, colegioMarca() || ''))),
    h('p', {}, h('strong', {}, `${t('dm.bol.est')} `), insc.alias, ' · ', h('strong', {}, `${t('dm.bol.clase')} `), clase?.nombre || '', ' · ', h('strong', {}, `${t('dm.bol.fecha')} `), fecha),
    h('table', { class: 'boletin__tabla' }, h('thead', {}, h('tr', {}, h('th', {}, t('dm.bol.indicador')), h('th', {}, t('dm.bol.resultado')), h('th', {}, t('dm.bol.meta')))),
      h('tbody', {}, fila(t('dm.bol.vel'), `${Math.round(s.mejorWpm || 0)} ${t('dm.ppm')}`, `${p.ppmMin}–${p.ppmMax} ${t('dm.ppm')}`), fila(t('dm.bol.pre'), `${s.precisionProm || 0} %`, `${p.precision} %`),
        fila(t('dm.bol.tiempo'), t('doc.min', { n: Math.round(s.minutos || 0) })), fila(t('dm.bol.sesiones'), s.sesiones || 0), fila(t('dm.bol.lecciones'), s.lecciones || 0), fila(t('dm.bol.medallas'), s.medallas || 0), fila(t('dm.bol.ultima'), textoUltima(s.ultimaPractica)))),
    insc.notaDocente ? h('p', {}, h('strong', {}, `${t('dm.bol.obs')} `), insc.notaDocente) : null,
    h('p', { class: 'boletin__pie' }, t('dm.bol.pie')));
}
