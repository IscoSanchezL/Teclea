/**
 * Reproductor de lecciones:  Introducción → Guiado → Libre → Prueba (estrellas) → Resultado.
 */
import { opcionesDeClases } from '../../db/clases.js';
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { perfilDeGrado } from '../../core/grados.js';
import { cargarLeccion, cargarIndice, siguienteDe, estadoLecciones, textoParaGrado, segundosParaGrado, calcularEstrellas } from '../../lessons/curriculo.js';
import { crearEjercicio } from '../../lessons/ejercicio-ui.js';
import { crearTeclado } from '../../lessons/teclado-virtual.js';
import { DEDOS, dedoDeCaracter } from '../../lessons/teclado-datos.js';
import { cargarProgreso, registrarActividad } from '../../db/progreso.js';
import { mascota } from '../art.js';
import { icono } from '../icons.js';
import { panelResultado } from '../resultado.js';
import { confirmar, toast } from '../overlay.js';
import { sonido } from '../sonido.js';

let actual = null;     // ejercicio activo (para limpiar al salir)
let detenerDemo = null;

const ETAPAS = [['intro', 'Introducción'], ['guiado', 'Guiado'], ['libre', 'Sin ayuda'], ['prueba', 'Prueba']];
const MENSAJE_TIPO = {
  nueva: 'Vamos con teclas nuevas. Mira bien qué dedo usa cada una.',
  repaso: 'Repasar es la clave de la memoria muscular. ¡Sin prisa!',
  palabras: 'Ahora escribimos palabras de verdad. Ritmo parejo.',
  ritmo: 'Un ritmo constante vale más que correr y equivocarse.',
  tema: 'Textos reales: lee un poquito adelante mientras escribes.',
  precision: 'Hoy cada tecla cuenta: si te equivocas, no avanzas.',
  velocidad: 'Reto de velocidad: ¡rápido pero sin perder la precisión!',
  jefe: '¡Jefe del mundo! Demuestra todo lo que aprendiste.',
  reto: '¡Un reto para campeones del teclado!',
};

export async function render({ query }) {
  const u = state.user;
  const leccion = await cargarLeccion(query.id || '');
  if (!leccion) { toast('No encontré esa lección.', { tipo: 'error' }); navegar('/aprende', { reemplazar: true }); return h('div'); }
  const [indice, progreso] = await Promise.all([cargarIndice(), cargarProgreso(u.uid)]);
  const estados = estadoLecciones(indice, progreso, await opcionesDeClases(state.user));
  if (estados[leccion.id] === 'bloqueada') { toast('Completa la lección anterior para abrir esta. 🔒', { tipo: 'info' }); navegar('/aprende', { reemplazar: true }); return h('div'); }

  const grado = u.grado || 4;
  const cont = h('div', { class: 'leccion' });
  let acumTeclas = {};
  const mezclarTeclas = (pt) => { for (const [c, v] of Object.entries(pt || {})) { const a = (acumTeclas[c] ||= { ok: 0, err: 0 }); a.ok += v.ok; a.err += v.err; } };
  const limpiar = () => { actual?.destruir(); actual = null; detenerDemo?.(); detenerDemo = null; };

  const pasos = (activo) => h('ol', { class: 'pasos-ej', 'aria-label': 'Etapas de la lección' },
    ETAPAS.map(([k, t], i) => h('li', { class: `pasos-ej__p ${k === activo ? 'pasos-ej__p--on' : ETAPAS.findIndex(([x]) => x === activo) > i ? 'pasos-ej__p--ok' : ''}`, 'aria-current': k === activo ? 'step' : null }, h('span', {}, String(i + 1)), t)));

  const cabecera = (activo) => h('header', { class: 'leccion__cab' },
    h('div', {}, h('span', { class: 'etiqueta' }, `Mundo ${leccion.mundo} · Lección ${leccion.n}`), h('h1', {}, leccion.titulo)),
    pasos(activo),
    h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: salir }, icono('x', { tam: 16 }), 'Salir'));

  async function salir() {
    const ok = await confirmar({ titulo: '¿Salir de la lección?', mensaje: 'Perderás el ejercicio en curso, pero tu progreso anterior se conserva.', si: 'Sí, salir', no: 'Seguir practicando' });
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
    montar(cabecera('intro'),
      h('div', { class: 'intro' },
        h('section', { class: 'intro__info card' },
          h('div', { class: 'fila' }, mascota('senala', { tam: 'sm' }), h('p', { class: 'burbuja' }, MENSAJE_TIPO[leccion.tipo] || '¡Vamos!')),
          h('h2', {}, 'Tu objetivo'), h('p', {}, leccion.objetivo),
          chips.length ? h('ul', { class: 'tecla-chips', 'aria-label': 'Teclas nuevas' }, chips) : null,
          leccion.tip ? h('p', { class: 'intro__tip' }, icono('bulb', { tam: 20 }), leccion.tip) : null,
          mejor ? h('p', { class: 'suave' }, `Tu mejor resultado: ${'★'.repeat(mejor.estrellas)}${'☆'.repeat(3 - mejor.estrellas)} · ${mejor.mejorWpm} PPM · ${mejor.mejorPrecision} %`) : null,
          h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => ejercicio(0), autofocus: true }, icono('play', { tam: 20 }), '¡Empezar!')),
        h('section', { class: 'intro__demo card' }, h('h2', {}, 'Así se hace'), h('p', { class: 'suave' }, 'La tecla iluminada y el dedo que sube te muestran cómo escribirla.'), kb.el)));
    detenerDemo = kb.demo(chars);
  }

  /* ── Ejercicios ── */
  const NOMBRES = [['guiado', 'Ejercicio guiado', 'Sigue la tecla iluminada y el dedo señalado.'], ['libre', 'Ejercicio sin ayuda', 'Ahora sin pistas: ¡confía en tus dedos!'], ['prueba', 'Prueba final', 'Consigue tus estrellas. ¡Tú puedes!']];
  function ejercicio(i, repetido = false) {
    const def = leccion.ejercicios[i];
    const [clave, titulo, ayuda] = NOMBRES[i];
    const modo = def.ocultarTeclado ? 'oculto' : clave === 'guiado' ? 'guiado' : 'libre';
    const texto = textoParaGrado(def, leccion, grado);
    const ej = crearEjercicio({
      texto, modo, estricto: Boolean(def.estricto), seg: def.modo === 'tiempo' ? segundosParaGrado(def, grado) : 0, grande: grado <= 3, titulo,
      alFin: ({ resultado, motor }) => { mezclarTeclas(motor.porTecla); if (i < 2) entre(i, resultado); else resultadoFinal(resultado); },
    });
    const nota = def.estricto ? 'Modo estricto: si te equivocas, repite la tecla hasta acertar.' : def.ocultarTeclado ? 'El teclado está oculto: ¡a ciegas!' : ayuda;
    montar(cabecera(clave), h('div', { class: 'ej-cab' }, h('h2', {}, `${titulo} ${i + 1} de 3`), h('p', { class: 'suave' }, nota)), ej.el);
    actual = ej; // después de montar(): montar() limpia el ejercicio anterior
    ej.enfocar();
  }

  function entre(i, r) {
    const ultimoGuiado = i === 0;
    montar(cabecera(i === 0 ? 'guiado' : 'libre'),
      h('section', { class: 'entre card card--vidrio' },
        mascota(r.precision >= 90 ? 'celebra' : 'anima', { tam: 'md' }),
        h('h2', {}, r.precision >= 95 ? '¡Excelente!' : r.precision >= 85 ? '¡Muy bien!' : '¡Buen intento!'),
        h('p', {}, `${r.ppm} PPM · ${r.precision} % de precisión · ${r.errores} ${r.errores === 1 ? 'error' : 'errores'}`),
        h('p', { class: 'suave' }, ultimoGuiado ? 'Ahora vienen los mismos movimientos, pero sin ayudas.' : 'Último paso: la prueba final con estrellas.'),
        h('div', { class: 'fila fila--envuelve' },
          h('button', { class: 'btn btn--suave', type: 'button', onclick: () => ejercicio(i) }, icono('refresh', { tam: 18 }), 'Repetir'),
          h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => ejercicio(i + 1), autofocus: true }, 'Continuar', icono('arrow', { tam: 18 })))));
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
    if (estrellas >= 1 && sig) acciones.push({ texto: esJefe && sig.mundo !== leccion.mundo ? `¡Al mundo ${sig.mundo}!` : 'Siguiente lección', clase: 'btn--primary btn--lg', principal: true, icono: 'arrow', onclick: () => navegar(`/leccion?id=${sig.id}`) });
    if (estrellas >= 1 && !sig) acciones.push({ texto: '¡Curso completado! Ver logros', clase: 'btn--primary btn--lg', principal: true, onclick: () => navegar('/logros') });
    acciones.push({ texto: estrellas >= 1 ? 'Repetir para más estrellas' : 'Intentar de nuevo', clase: estrellas >= 1 ? 'btn--suave' : 'btn--primary btn--lg', principal: estrellas < 1, icono: 'refresh', onclick: () => { acumTeclas = {}; ejercicio(2); } });
    if (estrellas < 1) acciones.push({ texto: 'Repasar el ejercicio guiado', onclick: () => { acumTeclas = {}; ejercicio(0); } });
    acciones.push({ texto: 'Volver al mapa', onclick: () => navegar('/aprende') });

    const panel = panelResultado({
      titulo: esJefe && estrellas >= 1 ? `¡Mundo ${leccion.mundo} completado!` : estrellas >= 1 ? '¡Lección superada!' : 'Todavía no, ¡sigue practicando!',
      subtitulo: `Mundo ${leccion.mundo} · ${leccion.titulo}`, estrellas, resultado, resumen, acciones,
    });
    const aviso = sospechoso ? h('p', { class: 'mensaje-error' }, 'Detectamos pegado de texto o una velocidad imposible, por eso esta vez no suma estrellas. ¡Escribe tú mismo!') : null;
    const meta = h('p', { class: 'suave pequeno' }, `Meta de ${grado}.º para esta lección: ${Math.round(p.ppmMax * leccion.meta.ppm)} PPM y ${Math.max(p.precision, Math.round(leccion.meta.precision * 100))} % de precisión para 3 estrellas.`);
    montar(cabecera('prueba'), panel, aviso, meta);
    setTimeout(() => cont.querySelector('[autofocus]')?.focus(), 1800);
  }

  intro();
  return cont;
}

export function destroy() { actual?.destruir(); actual = null; detenerDemo?.(); detenerDemo = null; }
