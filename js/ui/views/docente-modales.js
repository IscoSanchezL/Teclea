/**
 * Ventanas del panel docente: nueva/editar clase, alumnos con PIN, tareas, ejercicios, detalle del estudiante, boletín.
 */
import { state } from '../../core/state.js';
import { marca } from '../../core/marca.js';
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
  const sel = h('select', { class: 'input' }, opciones.map(([v, t]) => h('option', { value: v, selected: String(v) === String(valor) }, t)));
  return { sel, nodo: h('div', { class: 'campo' }, h('label', { class: 'campo__etiqueta' }, etiqueta), sel) };
};

/* ═════════════ Clase: crear / editar ═════════════ */
export function modalClase({ clase = null, alGuardar }) {
  const nombre = campo({ etiqueta: 'Nombre de la clase', value: clase?.nombre || '', maxlength: 60, placeholder: 'Ej.: 4.º A', required: true });
  const grupo = campo({ etiqueta: 'Grupo o jornada (opcional)', value: clase?.grupo || '', maxlength: 20, placeholder: 'Ej.: Mañana' });
  const grado = campoSelect('Grado', GRADOS.map((g) => [g, `${g}.º`]), clase?.grado || 4);
  let color = clase?.color || C.COLORES_CLASE[0];
  const colores = h('div', { class: 'colores' }, C.COLORES_CLASE.map((c) => h('button', { type: 'button', class: 'color', style: { background: c }, 'aria-label': `Color ${c}`, 'aria-pressed': String(c === color),
    onclick: (e) => { color = c; colores.querySelectorAll('.color').forEach((b) => b.setAttribute('aria-pressed', 'false')); e.currentTarget.setAttribute('aria-pressed', 'true'); } })));
  let ranking = clase?.config?.rankingVisible !== false;
  const meta = campo({ etiqueta: 'Meta del reto de la clase (letras)', type: 'number', min: 1000, max: 1000000, step: 1000, value: clase?.config?.metaClase || 20000, ayuda: 'Entre todos suman letras escritas hasta llegar a la meta.' });
  const mundos = new Set(clase?.config?.mundosBloqueados || []);
  const abiertos = new Set(clase?.config?.mundosAbiertos || []);
  const repintar = [];
  const chipsMundos = h('div', { class: 'filtros' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
    const b = h('button', { type: 'button', class: 'filtro', 'aria-pressed': 'false', title: 'Clic: normal → abierto → cerrado' }, `Mundo ${n}`);
    const pintar = () => { b.dataset.estado = mundos.has(n) ? 'cerrado' : abiertos.has(n) ? 'abierto' : ''; b.setAttribute('aria-pressed', String(mundos.has(n) || abiertos.has(n))); b.textContent = `Mundo ${n}${mundos.has(n) ? ' · cerrado' : abiertos.has(n) ? ' · abierto' : ''}`; };
    b.onclick = () => { if (mundos.has(n)) mundos.delete(n); else if (abiertos.has(n)) { abiertos.delete(n); mundos.add(n); } else abiertos.add(n); pintar(); };
    pintar(); repintar.push(pintar); return b;
  }));
  // Acciones masivas: todos abiertos, todos cerrados o todos en su estado normal (sin selección)
  const masivo = (texto, aplicar) => h('button', { type: 'button', class: 'btn btn--suave btn--sm', onclick: () => { for (let n = 1; n <= 10; n++) { abiertos.delete(n); mundos.delete(n); aplicar(n); } repintar.forEach((f) => f()); } }, texto);
  const accionesMundos = h('div', { class: 'fila fila--envuelve' },
    masivo('Seleccionar todos', (n) => abiertos.add(n)), masivo('Deseleccionar', () => {}), masivo('Cerrar todos', (n) => mundos.add(n)));
  const err = h('p', { class: 'mensaje-error', hidden: true });
  const form = h('form', { class: 'pila', onsubmit: async (e) => {
    e.preventDefault();
    if (!nombre.input.value.trim()) { err.textContent = 'Escribe el nombre de la clase.'; err.hidden = false; return; }
    const cfg = { rankingVisible: ranking, metaClase: Math.max(1000, Number(meta.input.value) || 20000), mundosBloqueados: [...mundos], mundosAbiertos: [...abiertos] };
    try {
      const datos = { nombre: nombre.input.value.trim(), grupo: grupo.input.value.trim(), grado: Number(grado.sel.value), color };
      const c = clase ? await C.actualizarClase(clase, { ...datos, config: { ...clase.config, ...cfg } }) : await C.crearClase(state.user, datos);
      if (!clase) { await C.actualizarClase(c, { config: { ...c.config, ...cfg } }).catch(() => {}); }
      capa.cerrar(); alGuardar?.(c); toast(clase ? 'Clase actualizada' : `Clase creada · código ${c.codigo}`);
    } catch (er) { err.textContent = er.message || 'No se pudo guardar.'; err.hidden = false; }
  } },
    nombre.nodo, h('div', { class: 'rejilla-campos' }, grado.nodo, grupo.nodo), h('div', { class: 'campo' }, h('span', { class: 'campo__etiqueta' }, 'Color'), colores),
    interruptor({ etiqueta: 'Mostrar ranking positivo', descripcion: 'Los estudiantes ven “más constantes” y “mayor mejora” (solo apodos).', activo: ranking, alCambiar: (v) => { ranking = v; } }),
    meta.nodo,
    h('div', { class: 'campo' }, h('span', { class: 'campo__etiqueta' }, 'Mundos de lecciones'), accionesMundos, chipsMundos, h('span', { class: 'campo__ayuda suave' }, 'Toca un mundo para abrirlo (sin esperar el desbloqueo) o cerrarlo. “Seleccionar todos” abre todos; “Deseleccionar” los deja en su estado normal.')),
    err, h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'submit' }, clase ? 'Guardar cambios' : 'Crear clase')));
  const capa = abrirCapa({ titulo: clase ? 'Editar clase' : 'Nueva clase', contenido: form, tipo: 'dialogo' });
}

/* ═════════════ Compartir clase (código + enlace + QR) ═════════════ */
export async function modalCompartir(clase) {
  const enlace = `${location.origin}${location.pathname}#/unirse?codigo=${clase.codigo}`;
  const qr = h('div', { class: 'compartir__qr' });
  qrSVG(enlace, { tam: 176 }).then((s) => { if (s) qr.append(s); });
  abrirCapa({ titulo: `Unirse a ${clase.nombre}`, tipo: 'dialogo', contenido: h('div', { class: 'compartir' },
    h('p', { class: 'suave' }, 'Los estudiantes con cuenta de Google escriben este código en “Mis clases”.'),
    h('div', { class: 'compartir__codigo' }, clase.codigo),
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(clase.codigo); toast('Código copiado'); } catch { toast(clase.codigo, { tipo: 'info' }); } } }, icono('copy', { tam: 16 }), 'Copiar código'),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(enlace); toast('Enlace copiado'); } catch { toast(enlace, { tipo: 'info' }); } } }, icono('copy', { tam: 16 }), 'Copiar enlace'),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => imprimir(h('div', { class: 'hoja' }, h('h1', {}, `${marca.nombre} · ${clase.nombre}`), h('p', {}, 'Escribe este código en “Mis clases” o escanea el QR:'), h('div', { class: 'compartir__codigo' }, clase.codigo), qr.cloneNode(true)))}, icono('printer', { tam: 16 }), 'Imprimir')),
    qr) });
}

/* ═════════════ Alumnos con PIN ═════════════ */
export function tarjetasAcceso(clase, lista) {
  const url = `${location.host}${location.pathname}`;
  return h('div', { class: 'hoja' }, h('h1', {}, `${marca.nombre} · ${clase.nombre}`),
    h('p', {}, `Entra a ${url} → pulsa “Código de clase” → escribe el código y toca tu nombre.`),
    h('div', { class: 'compartir__codigo' }, clase.claveAlumnos || ''),
    h('div', { class: 'tarjetas-acceso' }, lista.filter((a) => a.ok !== false).map((a) => h('div', { class: 'tarjeta-acceso' }, h('span', { style: { fontSize: '2.4rem' } }, a.emoji || '🦊'), h('strong', {}, a.alias || a.nombre), h('small', {}, a.nombre)))));
}

export function modalAlumnos({ clase, alTerminar }) {
  const area = h('textarea', { class: 'input', rows: 8, placeholder: 'Un nombre por línea:\nSofía Martínez\nJuan David Rojas\n…', 'aria-label': 'Nombres de los estudiantes' });
  const cont = h('div', { class: 'pila' });
  const fijada = Boolean(clase.claveAlumnos);
  const clave = campo({ etiqueta: 'Código de acceso de la clase', value: clase.claveAlumnos || C.claveSugerida(clase), maxlength: 12, autocapitalize: 'characters', readonly: fijada || null,
    ayuda: fijada ? 'Este código ya quedó fijado para el grupo. Los niños lo escriben y tocan su nombre.' : 'Lo escriben los niños para ver la lista de su salón (6 a 12 letras o números, sin espacios). Ej.: TECLA2A. Después de crear los estudiantes no se puede cambiar.' });
  clave.input.addEventListener('input', () => { clave.input.value = clave.input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
  const boton = h('button', { class: 'btn btn--primary', type: 'button' }, icono('plus', { tam: 16 }), 'Crear cuentas');
  boton.onclick = async () => {
    const nombres = area.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 60);
    if (!nombres.length) return toast('Escribe al menos un nombre.', { tipo: 'error' });
    if (!C.claveValida(clave.input.value)) return toast('El código debe tener de 6 a 12 letras o números, sin espacios.', { tipo: 'error' });
    boton.disabled = true; area.disabled = true;
    const prog = h('p', { class: 'suave', 'aria-live': 'polite' }, 'Creando cuentas…'); cont.replaceChildren(prog);
    const lista = await C.crearEstudiantes(state.user, clase, nombres, { clave: clave.input.value, alProgreso: (i, t, n) => { prog.textContent = `Creando ${i} de ${t}: ${n}`; } });
    const pendientes = lista.filter((a) => a.pendiente);
    alTerminar?.();
    const ok = lista.filter((a) => a.ok), mal = lista.filter((a) => !a.ok);
    cont.replaceChildren(...[h('p', {}, `${ok.length} cuentas listas${mal.length ? `, ${mal.length} con problemas` : ''}.`),
      pendientes.length ? h('div', { class: 'aviso pila', role: 'alert' }, h('p', {}, `⏳ Firebase limita cuántas cuentas se crean seguidas desde la misma conexión. Quedaron ${pendientes.length} pendientes. No pasa nada: espera unos 10 a 15 minutos y pulsa “Continuar con los pendientes”. Las que ya se crearon no se repiten.`), h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => { area.value = pendientes.map((a) => a.nombre).join('\n'); boton.disabled = false; area.disabled = false; cont.replaceChildren(h('p', { class: 'suave' }, 'Pendientes listos abajo. Cuando hayan pasado unos minutos, pulsa “Crear cuentas”.')); } }, 'Continuar con los pendientes')) : null,
      lista.errorLista ? h('p', { class: 'mensaje-error', role: 'alert' }, lista.errorLista === 'permiso' ? '⚠ Las cuentas se crearon, pero la lista de la clase NO se pudo publicar: faltan las reglas de seguridad nuevas en Firebase. El administrador debe pegarlas en Firestore → Reglas → Publicar. Después pulsa “Publicar lista” en la tarjeta de la clase.' : `⚠ Las cuentas se crearon, pero no se pudo publicar la lista (${lista.errorLista}). Revisa la conexión e inténtalo de nuevo.`) : h('p', { class: 'suave' }, `✔ Lista publicada. Los niños escriben ${clase.claveAlumnos} y tocan su nombre.`),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, ['Estudiante', 'Aparece como', '', ''].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, lista.map((a) => h('tr', {}, h('th', { scope: 'row' }, a.nombre), h('td', {}, a.ok ? `${a.emoji} ${a.alias}` : '—'), h('td', {}, ''), h('td', { class: a.ok ? '' : 'mensaje-error' }, a.ok ? '' : a.error)))))),
      h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'button', onclick: () => imprimir(tarjetasAcceso(clase, lista)) }, icono('printer', { tam: 16 }), 'Imprimir tarjetas'))].filter(Boolean));
  };
  abrirCapa({ titulo: `Agregar estudiantes a ${clase.nombre}`, tipo: 'dialogo', contenido: h('div', { class: 'pila' },
    h('p', { class: 'suave' }, 'Para niños sin cuenta de Google (ideal 2.º): escribe un nombre por línea. Los niños entran con el código de acceso de la clase y tocan su nombre en la lista (se muestra solo el nombre y la inicial del apellido). Nunca pedimos correo.'),
    clave.nodo, area, h('div', { class: 'fila fila--fin' }, boton), cont) });
}

/* ═════════════ Tareas ═════════════ */
export async function modalTarea({ clase, alGuardar }) {
  const indice = await cargarIndice();
  const ejercicios = await C.ejerciciosDeClase(state.user, clase).catch(() => []);
  const titulo = campo({ etiqueta: 'Título', maxlength: 120, required: true, placeholder: 'Ej.: Practicar la fila base' });
  const tipo = campoSelect('Qué deben hacer', [['leccion', 'Completar una lección'], ['ejercicio', 'Escribir un texto mío'], ['juego', 'Jugar un minijuego']], 'leccion');
  const lec = campoSelect('Lección', indice.map((l) => [l.id, `Mundo ${l.mundo} · ${l.titulo}`]), indice[0]?.id);
  const ejSel = campoSelect('Texto', ejercicios.length ? ejercicios.map((e) => [e.id, e.titulo]) : [['', 'Aún no tienes textos: créalo abajo']], ejercicios[0]?.id);
  const juego = campoSelect('Juego', JUEGOS.map((j) => [j.id, j.nombre]), JUEGOS[0].id);
  const nuevoTit = campo({ etiqueta: 'Título del texto nuevo', maxlength: 120 });
  const nuevoTexto = h('textarea', { class: 'input', rows: 4, maxlength: 5000, placeholder: 'Escribe o pega el texto que deben copiar (máx. 5000 letras)…' });
  const bloqueEj = h('div', { class: 'pila', hidden: true }, ejSel.nodo, h('details', {}, h('summary', {}, 'Crear un texto nuevo'), nuevoTit.nodo, nuevoTexto));
  const instr = campo({ etiqueta: 'Instrucciones (opcional)', maxlength: 500 });
  const vence = campo({ etiqueta: 'Fecha límite (opcional)', type: 'date' });
  const mostrar = () => { lec.nodo.hidden = tipo.sel.value !== 'leccion'; bloqueEj.hidden = tipo.sel.value !== 'ejercicio'; juego.nodo.hidden = tipo.sel.value !== 'juego'; };
  tipo.sel.onchange = mostrar; mostrar();
  const err = h('p', { class: 'mensaje-error', hidden: true });
  const capa = abrirCapa({ titulo: `Nueva tarea · ${clase.nombre}`, tipo: 'dialogo', contenido: h('form', { class: 'pila', onsubmit: async (e) => {
    e.preventDefault(); err.hidden = true;
    try {
      let refId = tipo.sel.value === 'leccion' ? lec.sel.value : tipo.sel.value === 'juego' ? juego.sel.value : ejSel.sel.value;
      if (tipo.sel.value === 'ejercicio' && nuevoTexto.value.trim().length >= 5) refId = (await C.crearEjercicioPropio(state.user, clase, { titulo: nuevoTit.input.value || titulo.input.value, texto: nuevoTexto.value })).id;
      if (!refId) throw new Error('Elige o escribe el texto del ejercicio.');
      const t = await C.crearTarea(state.user, clase, { titulo: titulo.input.value || 'Tarea', tipo: tipo.sel.value, refId, instrucciones: instr.input.value, vence: vence.input.value ? new Date(`${vence.input.value}T23:59:59`).getTime() : null });
      capa.cerrar(); alGuardar?.(t); toast('Tarea creada');
    } catch (er) { err.textContent = er.message || 'No se pudo crear la tarea.'; err.hidden = false; }
  } }, titulo.nodo, tipo.nodo, lec.nodo, bloqueEj, juego.nodo, instr.nodo, vence.nodo, err, h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'submit' }, 'Crear tarea'))) });
}

/* ═════════════ Detalle de un estudiante ═════════════ */
export async function modalEstudiante({ insc, clase, sesiones, alCambiar }) {
  const s = insc.stats || {}, est = estadoDe(insc, clase?.grado), p = perfilDeGrado(insc.grado || clase?.grado || 4);
  const mias = sesiones.filter((x) => x.uid === insc.uid).sort((a, b) => (a.creadoEn || 0) - (b.creadoEn || 0));
  const serie = mias.slice(-12).map((x) => x.wpm);
  const calor = resumenClase([insc], mias).calor;
  const nota = h('textarea', { class: 'input', rows: 3, maxlength: 500, 'aria-label': 'Nota del docente' }, insc.notaDocente || '');
  const dato = (t, v) => h('div', { class: 'dato' }, h('small', {}, t), h('strong', {}, v));
  const capa = abrirCapa({ titulo: insc.alias, tipo: 'dialogo', contenido: h('div', { class: 'pila' },
    h('div', { class: 'fila fila--entre' }, pill(est), h('span', { class: 'suave' }, `${clase?.nombre || ''} · última práctica: ${textoUltima(s.ultimaPractica)}`)),
    h('div', { class: 'datos' }, dato('Mejor PPM', s.mejorWpm ? Math.round(s.mejorWpm) : '—'), dato('Precisión', s.precisionProm ? `${s.precisionProm} %` : '—'), dato('Minutos', Math.round(s.minutos || 0)), dato('Lecciones', s.lecciones || 0), dato('XP', s.xp || 0), dato('Medallas', s.medallas || 0)),
    h('p', { class: 'suave' }, `Meta de ${insc.grado || clase?.grado || 4}.º: ${p.ppmMin}–${p.ppmMax} PPM · ${p.precision} % de precisión.`),
    serie.length > 1 ? h('div', {}, h('small', { class: 'suave' }, 'Evolución de PPM (últimas sesiones)'), h('div', {}, sparkline(serie, { ancho: 320, alto: 56, etiqueta: 'PPM' }))) : null,
    Object.keys(calor).length ? h('div', {}, h('small', { class: 'suave' }, 'Teclas con más errores'), tecladoCalor(calor)) : null,
    insc.pin ? h('p', {}, h('strong', {}, 'Acceso: '), `código de acceso ${clase?.claveAlumnos || insc.pin}`) : null,
    h('label', { class: 'campo' }, h('span', { class: 'campo__etiqueta' }, 'Nota privada'), nota),
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: async () => { try { await C.actualizarInscripcion(insc, { notaDocente: nota.value.slice(0, 500) }); insc.notaDocente = nota.value; toast('Nota guardada'); } catch { toast('No se pudo guardar.', { tipo: 'error' }); } } }, 'Guardar nota'),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => imprimir(boletin({ insc, clase, mias })) }, icono('printer', { tam: 16 }), 'Boletín'),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { const nuevo = insc.estado === 'pausado' ? 'activo' : 'pausado'; await C.actualizarInscripcion(insc, { estado: nuevo }); insc.estado = nuevo; if (clase?.claveAlumnos) await C.publicarLista(state.user, clase).catch(() => {}); toast(nuevo === 'pausado' ? 'Estudiante pausado' : 'Estudiante reactivado'); alCambiar?.(); } }, insc.estado === 'pausado' ? 'Reactivar' : 'Pausar'),
      h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: `¿Quitar a ${insc.alias}?`, mensaje: 'Dejará de aparecer en esta clase. Su cuenta y progreso no se borran.', si: 'Quitar', peligro: true })) { await C.quitarEstudiante(insc); if (clase?.claveAlumnos) await C.publicarLista(state.user, clase).catch(() => {}); capa.cerrar(); alCambiar?.(); } } }, 'Quitar de la clase'))) });
}

/* ═════════════ Boletín imprimible ═════════════ */
export function boletin({ insc, clase, mias = [] }) {
  const s = insc.stats || {}, p = perfilDeGrado(insc.grado || clase?.grado || 4);
  const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const fila = (t, v, extra = '') => h('tr', {}, h('th', { scope: 'row' }, t), h('td', {}, v), h('td', {}, extra));
  return h('div', { class: 'hoja boletin' },
    h('header', { class: 'boletin__cab' }, marca.logo ? h('img', { src: marca.logo, alt: '', width: 56, height: 56 }) : null, h('div', {}, h('h1', {}, `${marca.nombre} · Boletín de mecanografía`), h('p', {}, marca.colegio || ''))),
    h('p', {}, h('strong', {}, 'Estudiante: '), insc.alias, ' · ', h('strong', {}, 'Clase: '), clase?.nombre || '', ' · ', h('strong', {}, 'Fecha: '), fecha),
    h('table', { class: 'boletin__tabla' }, h('thead', {}, h('tr', {}, h('th', {}, 'Indicador'), h('th', {}, 'Resultado'), h('th', {}, 'Meta del grado'))),
      h('tbody', {}, fila('Mejor velocidad', `${Math.round(s.mejorWpm || 0)} PPM`, `${p.ppmMin}–${p.ppmMax} PPM`), fila('Precisión promedio', `${s.precisionProm || 0} %`, `${p.precision} %`),
        fila('Tiempo practicado', `${Math.round(s.minutos || 0)} min`), fila('Sesiones', s.sesiones || 0), fila('Lecciones completadas', s.lecciones || 0), fila('Medallas', s.medallas || 0), fila('Última práctica', textoUltima(s.ultimaPractica)))),
    insc.notaDocente ? h('p', {}, h('strong', {}, 'Observaciones del docente: '), insc.notaDocente) : null,
    h('p', { class: 'boletin__pie' }, 'PPM = palabras por minuto (una palabra = 5 caracteres, descontando errores sin corregir). Documento generado por TECLEA.'));
}
