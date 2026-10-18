/**
 * Reproductor de lecciones:  Introducción → Guiado → Libre → Prueba (estrellas) → Resultado.
 */
import { opcionesRapidas } from '../../db/clases.js';
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { perfilDeGrado } from '../../core/grados.js';
import { cargarLeccion, cargarIndice, siguienteDe, estadoLecciones, textoParaGrado, segundosParaGrado, calcularEstrellas } from '../../lessons/curriculo.js';
import { crearEjercicio } from '../../lessons/ejercicio-ui.js';
import { crearTeclado } from '../../lessons/teclado-virtual.js';
import { DEDOS, dedoDeCaracter, pasosPara } from '../../lessons/teclado-datos.js';
import { cargarProgreso, registrarActividad } from '../../db/progreso.js';
import { mascota } from '../art.js';
import { icono } from '../icons.js';
import { panelResultado } from '../resultado.js';
import { confirmar, toast } from '../overlay.js';
import { sonido } from '../sonido.js';
import { t } from '../../i18n/index.js';

let actual = null;     // ejercicio activo (para limpiar al salir)
let detenerDemo = null;
let quitarEscucha = null;

const etapas = () => ['intro', 'guiado', 'libre', 'prueba'].map((k) => [k, t(`leccion.etapa.${k}`)]);
const mensajeTipo = (tipo) => (['nueva', 'repaso', 'palabras', 'ritmo', 'tema', 'precision', 'velocidad', 'jefe', 'reto'].includes(tipo) ? t(`leccion.msg.${tipo}`) : t('leccion.msg.vamos'));

export async function render({ query }) {
  const u = state.user;
  const [leccion, indice, progreso, opciones] = await Promise.all([cargarLeccion(query.id || ''), cargarIndice(), cargarProgreso(u.uid), opcionesRapidas(state.user)]);
  if (!leccion) { toast(t('leccion.noEncontre'), { tipo: 'error' }); navegar('/aprende', { reemplazar: true }); return h('div'); }
  const estados = estadoLecciones(indice, progreso, opciones);
  if (estados[leccion.id] === 'bloqueada') { toast(t('leccion.completaAnterior'), { tipo: 'info' }); navegar('/aprende', { reemplazar: true }); return h('div'); }

  const grado = u.grado || 4;
  const cont = h('div', { class: 'leccion' });
  let acumTeclas = {};
  const mezclarTeclas = (pt) => { for (const [c, v] of Object.entries(pt || {})) { const a = (acumTeclas[c] ||= { ok: 0, err: 0 }); a.ok += v.ok; a.err += v.err; } };
  const limpiar = () => { actual?.destruir(); actual = null; detenerDemo?.(); detenerDemo = null; quitarEscucha?.(); quitarEscucha = null; };

  const pasos = (activo) => h('ol', { class: 'pasos-ej', 'aria-label': t('leccion.etapasAria') },
    etapas().map(([k, txt], i) => h('li', { class: `pasos-ej__p ${k === activo ? 'pasos-ej__p--on' : etapas().findIndex(([x]) => x === activo) > i ? 'pasos-ej__p--ok' : ''}`, 'aria-current': k === activo ? 'step' : null }, h('span', {}, String(i + 1)), txt)));

  const cabecera = (activo) => h('header', { class: 'leccion__cab' },
    h('div', {}, h('span', { class: 'etiqueta' }, t('leccion.cab', { m: leccion.mundo, n: leccion.n })), h('h1', {}, leccion.titulo)),
    pasos(activo),
    h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: salir }, icono('x', { tam: 16 }), t('leccion.salir')));

  async function salir() {
    const ok = await confirmar({ titulo: t('leccion.salir.titulo'), mensaje: t('leccion.salir.mensaje'), si: t('leccion.salir.si'), no: t('leccion.salir.no') });
    if (ok) { limpiar(); navegar('/aprende'); }
  }
  const montar = (...nodos) => { limpiar(); cont.replaceChildren(...nodos.filter(Boolean)); window.scrollTo({ top: 0 }); };

  /* ── Introducción ── */
  function intro() {
    const mejor = progreso[leccion.id];
    const kb = crearTeclado({ idioma: state.prefs.tecladoIdioma, manos: true });
    kb.setModo('guiado');
    const demoChars = leccion.nuevas.length ? leccion.nuevas.filter((c) => c.length === 1) : [...leccion.alcance].filter((c) => /[a-zñ]/.test(c)).slice(-6);
    const chars = demoChars.length ? demoChars : ['f', 'j'];
    const chips = leccion.nuevas.filter((c) => c.length === 1).map((c) => {
      const d = dedoDeCaracter(c, state.prefs.tecladoIdioma) || 'indice-der';
      return h('li', { class: `tecla-chip dedo-${DEDOS[d].color}` }, h('kbd', {}, c.toUpperCase()), h('span', {}, DEDOS[d].nombre));
    });
    // Primera vez (y con teclado físico): se activa al presionar la tecla que brilla. Ya jugada o en pantalla táctil: libre.
    const conTeclado = !window.matchMedia('(pointer: coarse)').matches;
    const bloqueado = !mejor && conTeclado;
    const boton = h('button', { class: `btn btn--primary btn--lg ${bloqueado ? 'btn--esperando' : ''}`, type: 'button', disabled: bloqueado || null, onclick: () => ejercicio(0), autofocus: !bloqueado }, icono('play', { tam: 20 }), t('leccion.empezar'));
    const pista = h('p', { class: `intro__pista ${bloqueado ? '' : 'intro__pista--oculta'}`, 'aria-live': 'polite' }, bloqueado ? t('leccion.pista') : '');
    montar(cabecera('intro'),
      h('div', { class: 'intro' },
        h('section', { class: 'intro__info card' },
          h('div', { class: 'fila' }, mascota('senala', { tam: 'sm' }), h('p', { class: 'burbuja' }, mensajeTipo(leccion.tipo))),
          h('h2', {}, t('leccion.objetivo')), h('p', {}, leccion.objetivo),
          chips.length ? h('ul', { class: 'tecla-chips', 'aria-label': t('leccion.teclasNuevas') }, chips) : null,
          leccion.tip ? h('p', { class: 'intro__tip' }, icono('bulb', { tam: 20 }), leccion.tip) : null,
          mejor ? h('p', { class: 'suave' }, t('leccion.mejor', { est: `${'★'.repeat(mejor.estrellas)}${'☆'.repeat(3 - mejor.estrellas)}`, ppm: mejor.mejorWpm, pre: mejor.mejorPrecision })) : null,
          boton, pista),
        h('section', { class: 'intro__demo card' }, h('h2', {}, t('leccion.asiSeHace')), h('p', { class: 'suave' }, t('leccion.asiTexto')), kb.el)));
    detenerDemo = kb.demo(chars);
    if (bloqueado) {
      let saltar = null;
      const permitidas = new Set(chars.flatMap((c) => pasosPara(c, state.prefs.tecladoIdioma).map((p) => p.code)));
      const habilitar = () => {
        if (!boton.disabled) return;
        boton.disabled = false; boton.classList.remove('btn--esperando'); boton.classList.add('btn--listo');
        pista.textContent = t('leccion.pistaOk'); sonido.acierto(); clearTimeout(saltar); boton.focus({ preventScroll: true });
      };
      const alTecla = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey && e.key !== 'AltGraph') return;
        kb.presionar(e.code, true); setTimeout(() => kb.presionar(e.code, false), 160);
        // Basta con pulsar CUALQUIERA de las teclas de la demostración (el brillo cambia cada segundo y el niño puede tardar)
        if (boton.disabled) { if (e.key.length === 1 || /^(Key|Digit)/.test(e.code) || permitidas.has(e.code)) habilitar(); }
        else if (e.key === 'Enter') { e.preventDefault(); boton.click(); }
      };
      document.addEventListener('keydown', alTecla, true);
      quitarEscucha = () => { document.removeEventListener('keydown', alTecla, true); clearTimeout(saltar); };
      // Por si el teclado no responde: a los 12 s se ofrece continuar igual
      saltar = setTimeout(() => { if (boton.disabled) { boton.disabled = false; boton.classList.remove('btn--esperando'); pista.textContent = t('leccion.pistaNoFunciona'); } }, 6000);
    }
  }

  /* ── Ejercicios ── */
  const nombres = () => [['guiado', t('leccion.ej.guiado'), t('leccion.ej.guiadoAyuda')], ['libre', t('leccion.ej.libre'), t('leccion.ej.libreAyuda')], ['prueba', t('leccion.ej.prueba'), t('leccion.ej.pruebaAyuda')]];
  function ejercicio(i, repetido = false) {
    const def = leccion.ejercicios[i];
    const [clave, titulo, ayuda] = nombres()[i];
    const modo = def.ocultarTeclado ? 'oculto' : clave === 'guiado' ? 'guiado' : 'libre';
    const texto = textoParaGrado(def, leccion, grado);
    const ej = crearEjercicio({
      texto, modo, estricto: Boolean(def.estricto), seg: def.modo === 'tiempo' ? segundosParaGrado(def, grado) : 0, grande: grado <= 3, titulo,
      alFin: ({ resultado, motor }) => { mezclarTeclas(motor.porTecla); if (i < 2) entre(i, resultado); else resultadoFinal(resultado); },
    });
    const nota = def.estricto ? t('leccion.ej.estricto') : def.ocultarTeclado ? t('leccion.ej.oculto') : ayuda;
    montar(cabecera(clave), h('div', { class: 'ej-cab' }, h('h2', {}, t('leccion.ej.num', { titulo, i: i + 1 })), h('p', { class: 'suave' }, nota)), ej.el);
    actual = ej; // después de montar(): montar() limpia el ejercicio anterior
    ej.enfocar();
  }

  // Premio por cada paso terminado (XP y monedas pequeños; las estrellas siguen siendo de la Prueba final)
  const premiados = new Set();
  function entre(i, r) {
    const ultimoGuiado = i === 0;
    const premio = h('p', { class: 'chip', hidden: true });
    if (!premiados.has(i) && !r.banderas?.pegado && !r.banderas?.imposible) {
      premiados.add(i);
      registrarActividad({ user: state.user, tipo: 'practica', refId: `${leccion.id}:paso${i + 1}`, resultado: r })
        .then((g) => { if (g?.xp) { premio.textContent = t('leccion.premio', { xp: g.xp, monedas: g.monedas }); premio.hidden = false; } })
        .catch((e) => console.warn('[leccion] premio del paso', e?.code || e));
    }
    montar(cabecera(i === 0 ? 'guiado' : 'libre'),
      h('section', { class: 'entre card card--vidrio' },
        mascota(r.precision >= 90 ? 'celebra' : 'anima', { tam: 'md' }),
        h('h2', {}, r.precision >= 95 ? t('leccion.entre.excelente') : r.precision >= 85 ? t('leccion.entre.muyBien') : t('leccion.entre.intento')),
        h('p', {}, t('leccion.entre.resumen', { ppm: r.ppm, pre: r.precision, err: r.errores, errTxt: r.errores === 1 ? t('leccion.error') : t('leccion.errores') })),
        premio,
        h('p', { class: 'suave' }, ultimoGuiado ? t('leccion.entre.siguiente1') : t('leccion.entre.siguiente2')),
        h('div', { class: 'fila fila--envuelve' },
          h('button', { class: 'btn btn--suave', type: 'button', onclick: () => ejercicio(i) }, icono('refresh', { tam: 18 }), t('leccion.repetir')),
          h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => ejercicio(i + 1), autofocus: true }, t('leccion.continuar'), icono('arrow', { tam: 18 })))));
    sonido.acierto();
  }

  /* ── Resultado final (con estrellas) ── */
  async function resultadoFinal(resultado) {
    const sospechoso = resultado.banderas.pegado || resultado.banderas.imposible;
    const metaClase = null; // Fase 5: meta de la clase del estudiante
    const estrellas = sospechoso ? 0 : calcularEstrellas(resultado, leccion, grado, metaClase);
    const resumen = (async () => {
      const r = await registrarActividad({ user: state.user, tipo: 'leccion', refId: leccion.id, resultado, leccion, estrellas, porTecla: acumTeclas });
      try { const { evaluarInsignias } = await import('../../game/insignias.js'); r.insignias = await evaluarInsignias({ user: r.usuario, evento: 'leccion', leccion, estrellas, resultado, resumen: r }); } catch (e) { console.warn('[insignias]', e); }
      if (estrellas >= 1) import('../../db/clases.js').then((m) => m.entregarTareas(r.usuario, { tipo: 'leccion', refId: leccion.id, resultado, sesionId: r.sesionId })).catch(() => {});
      return r;
    })();
    const sig = estrellas >= 1 ? await siguienteDe(leccion.id) : null;
    const esJefe = leccion.tipo === 'jefe';
    const p = perfilDeGrado(grado);
    const acciones = [];
    if (estrellas >= 1 && sig) acciones.push({ texto: esJefe && sig.mundo !== leccion.mundo ? t('leccion.alMundo', { n: sig.mundo }) : t('leccion.siguienteLeccion'), clase: 'btn--primary btn--lg', principal: true, icono: 'arrow', onclick: () => navegar(`/leccion?id=${sig.id}`) });
    if (estrellas >= 1 && !sig) acciones.push({ texto: t('leccion.cursoCompleto'), clase: 'btn--primary btn--lg', principal: true, onclick: () => navegar('/logros') });
    acciones.push({ texto: estrellas >= 1 ? t('leccion.repetirEstrellas') : t('leccion.intentarOtra'), clase: estrellas >= 1 ? 'btn--suave' : 'btn--primary btn--lg', principal: estrellas < 1, icono: 'refresh', onclick: () => { acumTeclas = {}; ejercicio(2); } });
    if (estrellas < 1) acciones.push({ texto: t('leccion.repasarGuiado'), onclick: () => { acumTeclas = {}; ejercicio(0); } });
    acciones.push({ texto: t('leccion.volverMapa'), onclick: () => navegar('/aprende') });

    const panel = panelResultado({
      titulo: esJefe && estrellas >= 1 ? t('leccion.res.mundoCompleto', { n: leccion.mundo }) : estrellas >= 1 ? t('leccion.res.superada') : t('leccion.res.todaviaNo'),
      subtitulo: t('inicio.sigLeccion', { m: leccion.mundo, titulo: leccion.titulo }), estrellas, resultado, resumen, acciones,
    });
    const aviso = sospechoso ? h('p', { class: 'mensaje-error' }, t('leccion.res.sospechoso')) : null;
    const meta = h('p', { class: 'suave pequeno' }, t('leccion.res.meta', { g: grado, ppm: Math.round(p.ppmMax * leccion.meta.ppm), pre: Math.max(p.precision, Math.round(leccion.meta.precision * 100)) }));
    montar(cabecera('prueba'), panel, aviso, meta);
    setTimeout(() => cont.querySelector('[autofocus]')?.focus(), 1800);
  }

  // La introducción arranca en despues(): el router destruye la vista anterior ANTES, y así no borra las escuchas de esta
  cont.__iniciar = intro;
  return cont;
}

export function despues(nodo) { nodo?.__iniciar?.(); }

/** Hay un ejercicio en curso: el cambio de idioma no reinicia la vista (se actualiza al navegar). */
export const conservarAlCambiarIdioma = true;

export function destroy() { actual?.destruir(); actual = null; detenerDemo?.(); detenerDemo = null; quitarEscucha?.(); quitarEscucha = null; }
