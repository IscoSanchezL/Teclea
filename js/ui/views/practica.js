/**
 * Práctica libre (textos por tema, dificultad y duración) y refuerzo adaptativo de teclas débiles.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { perfilDeGrado } from '../../core/grados.js';
import { crearEjercicio } from '../../lessons/ejercicio-ui.js';
import { generarRefuerzo, calentamiento } from '../../lessons/refuerzo.js';
import { registrarActividad, teclasDebiles } from '../../db/progreso.js';
import { icono } from '../icons.js';
import { mascota } from '../art.js';
import { segmentado } from '../componentes.js';
import { panelResultado } from '../resultado.js';
import { confirmar, toast } from '../overlay.js';

let actual = null;
let cacheTextos = null, cachePalabras = null;
const cargarTextos = async () => (cacheTextos ||= (await fetch('data/texts.json')).json());
const cargarPalabras = async () => (cachePalabras ||= (await fetch('data/palabras.json')).json());

const NIVELES_POR_GRADO = { 2: [2], 3: [2], 4: [2, 3], 5: [3, 4], 6: [3, 4, 5] };
const NOMBRE_TEMA = { animales: 'Animales', escuela: 'Escuela', familia: 'Familia', naturaleza: 'Naturaleza', deportes: 'Deportes', tecnologia: 'Tecnología', ciencia: 'Ciencia',
  colombia: 'Colombia', comida: 'Comida', valores: 'Valores', refranes: 'Refranes', trabalenguas: 'Trabalenguas', pangramas: 'Pangramas', numeros: 'Números', signos: 'Signos',
  cuento: 'Cuentos', historia: 'Historia', espacio: 'Espacio', dialogo: 'Diálogos' };

function mezclar(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/** Arma un texto largo (suficiente para el tiempo elegido) con textos del tema y nivel. */
function armarTexto(textos, { tema, nivel, seg, grado }) {
  const niveles = nivel === 'grado' ? (NIVELES_POR_GRADO[grado] || [2, 3]) : nivel === 'facil' ? [2] : nivel === 'medio' ? [3] : [4, 5];
  let pool = textos.filter((t) => niveles.includes(t.nivel) && (tema === 'todos' || t.tema === tema));
  if (pool.length < 3) pool = textos.filter((t) => tema === 'todos' || t.tema === tema);
  const objetivo = Math.max(120, Math.round(seg * 7)); // caracteres: más de lo que se alcanza a escribir
  const out = []; let len = 0;
  for (const t of mezclar(pool)) { out.push(t.texto); len += t.texto.length + 1; if (len >= objetivo) break; }
  return out.join(' ');
}

export async function render({ query }) {
  const u = state.user;
  const grado = u.grado || 4;
  const cont = h('div', { class: 'practica' });
  const limpiar = () => { actual?.destruir(); actual = null; };
  const montar = (...n) => { limpiar(); cont.replaceChildren(...n.filter(Boolean)); window.scrollTo({ top: 0 }); };

  function guardarYMostrar({ resultado, motor, refId, titulo, volver, tarea = null }) {
    const resumen = (async () => {
      const r = await registrarActividad({ user: state.user, tipo: 'practica', refId, resultado, porTecla: motor.porTecla });
      try { const { evaluarInsignias } = await import('../../game/insignias.js'); r.insignias = await evaluarInsignias({ user: r.usuario, evento: 'practica', resultado, resumen: r, refId }); } catch (e) { console.warn('[insignias]', e); }
      if (tarea) import('../../db/clases.js').then((m) => m.entregarTareas(r.usuario, { tipo: 'ejercicio', refId: tarea, resultado, sesionId: r.sesionId })).catch(() => {});
      return r;
    })();
    montar(panelResultado({ titulo, subtitulo: 'Práctica', estrellas: null, resultado, resumen,
      acciones: [{ texto: 'Otra práctica', clase: 'btn--primary btn--lg', principal: true, icono: 'refresh', onclick: volver }, { texto: 'Volver al curso', onclick: () => navegar('/aprende') }] }));
  }

  /* ── Refuerzo ── */
  async function refuerzo() {
    const [debiles, vocab] = await Promise.all([teclasDebiles(u.uid, 5), cargarPalabras()]);
    if (!debiles.length) {
      montar(h('section', { class: 'proximamente card card--vidrio' }, mascota('piensa', { tam: 'lg' }), h('div', { class: 'proximamente__texto' },
        h('h1', {}, 'Aún no tengo suficientes datos'), h('p', {}, 'Completa algunas lecciones y volveré con ejercicios para las teclas que más te cuestan.'),
        h('a', { class: 'btn btn--primary', href: '#/aprende' }, 'Ir al curso'))));
      return;
    }
    const chars = debiles.map((d) => d.c);
    const calent = calentamiento(chars);
    const texto = generarRefuerzo(chars, vocab, { largo: grado <= 3 ? 90 : 140, conTilde: grado >= 5 });
    let motorA = null;
    const etapa = (i) => {
      const guiado = i === 0;
      const ej = crearEjercicio({
        texto: guiado ? calent : texto, modo: guiado ? 'guiado' : 'libre', grande: grado <= 3, titulo: 'Refuerzo',
        alSalir: async () => { if (await confirmar({ titulo: '¿Salir del refuerzo?', mensaje: 'No se guardará este ejercicio.', si: 'Salir', no: 'Seguir' })) navegar('/aprende'); },
        alFin: ({ resultado, motor }) => {
          if (guiado) { motorA = motor; etapa(1); return; }
          // se combinan las estadísticas por tecla de los dos ejercicios
          for (const [c, v] of Object.entries(motorA.porTecla)) { const a = (motor.porTecla[c] ||= { ok: 0, err: 0 }); a.ok += v.ok; a.err += v.err; }
          guardarYMostrar({ resultado, motor, refId: 'refuerzo', titulo: '¡Refuerzo completado!', volver: () => navegar('/practica?modo=refuerzo') });
        },
      });
      montar(h('div', { class: 'ej-cab' }, h('h1', {}, guiado ? 'Calentamiento' : 'Refuerzo de tus teclas débiles'),
        h('p', { class: 'suave' }, `Practicamos: ${chars.map((c) => c.toUpperCase()).join('  ')}`)), ej.el);
      actual = ej;
      ej.enfocar();
    };
    etapa(0);
  }

  /* ── Configuración de práctica libre ── */
  async function configurar() {
    const data = await cargarTextos();
    const temas = ['todos', ...data.temas.filter((t) => t !== 'signos')];
    let cfg = { tema: 'todos', nivel: 'grado', seg: 120, oculto: false };
    const chips = temas.map((t) => h('button', { class: 'filtro', type: 'button', 'aria-pressed': String(t === cfg.tema), onclick: (e) => { cfg.tema = t; chips.forEach((b) => b.setAttribute('aria-pressed', 'false')); e.currentTarget.setAttribute('aria-pressed', 'true'); } }, t === 'todos' ? 'Todos los temas' : (NOMBRE_TEMA[t] || t)));
    const p = perfilDeGrado(grado);
    montar(h('section', { class: 'card practica__cfg' },
      h('div', { class: 'fila' }, mascota('anima', { tam: 'sm' }), h('div', {}, h('h1', {}, 'Práctica libre'), h('p', { class: 'suave' }, `Elige qué quieres practicar. Meta de ${grado}.º: ${p.ppmMin}–${p.ppmMax} PPM con ${p.precision} % de precisión.`))),
      h('div', { class: 'pila' }, h('strong', {}, 'Tema'), h('div', { class: 'filtros' }, chips)),
      h('div', { class: 'pila' }, h('strong', {}, 'Dificultad'), segmentado({ nombre: 'dif', etiqueta: 'Dificultad', valor: cfg.nivel, alCambiar: (v) => { cfg.nivel = v; },
        opciones: [{ valor: 'grado', etiqueta: `Para ${grado}.º` }, { valor: 'facil', etiqueta: 'Fácil' }, { valor: 'medio', etiqueta: 'Medio' }, { valor: 'dificil', etiqueta: 'Difícil' }] })),
      h('div', { class: 'pila' }, h('strong', {}, 'Duración'), segmentado({ nombre: 'dur', etiqueta: 'Duración', valor: String(cfg.seg), alCambiar: (v) => { cfg.seg = Number(v); },
        opciones: [{ valor: '60', etiqueta: '1 min' }, { valor: '120', etiqueta: '2 min' }, { valor: '180', etiqueta: '3 min' }, { valor: '300', etiqueta: '5 min' }] })),
      h('label', { class: 'consentimiento' }, h('input', { type: 'checkbox', onchange: (e) => { cfg.oculto = e.target.checked; } }), h('span', {}, 'Ocultar el teclado (reto: ¡a ciegas!)')),
      h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => correr(data.textos, cfg) }, icono('play', { tam: 20 }), 'Empezar'))));
  }

  function correr(textos, cfg) {
    const texto = armarTexto(textos, { ...cfg, grado });
    const ej = crearEjercicio({
      texto, modo: cfg.oculto ? 'oculto' : 'libre', seg: cfg.seg, grande: grado <= 3, titulo: 'Práctica libre',
      alSalir: async () => { if (await confirmar({ titulo: '¿Salir de la práctica?', mensaje: 'No se guardará este ejercicio.', si: 'Salir', no: 'Seguir' })) configurar(); },
      alFin: ({ resultado, motor }) => guardarYMostrar({ resultado, motor, refId: `tema:${cfg.tema}:${cfg.seg}s`, titulo: '¡Práctica terminada!', volver: configurar }),
    });
    montar(h('div', { class: 'ej-cab' }, h('h1', {}, 'Práctica libre'), h('p', { class: 'suave' }, `${Math.round(cfg.seg / 60)} min · escribe sin parar hasta que se acabe el tiempo.`)), ej.el);
    actual = ej;
    ej.enfocar();
  }

  async function ejercicioDocente(id) {
    const { leerEjercicio } = await import('../../db/clases.js');
    const ej = await leerEjercicio(id).catch(() => null);
    if (!ej) { toast('No encontré ese ejercicio.', { tipo: 'error' }); return configurar(); }
    const motorUI = crearEjercicio({
      texto: ej.texto, modo: 'libre', grande: grado <= 3, titulo: ej.titulo,
      alSalir: async () => { if (await confirmar({ titulo: '¿Salir del ejercicio?', mensaje: 'No se guardará este ejercicio.', si: 'Salir', no: 'Seguir' })) navegar('/clases'); },
      alFin: ({ resultado, motor }) => guardarYMostrar({ resultado, motor, refId: `ej:${id}`, tarea: id, titulo: '¡Ejercicio terminado!', volver: () => navegar('/clases') }),
    });
    montar(h('div', { class: 'ej-cab' }, h('h1', {}, ej.titulo), h('p', { class: 'suave' }, 'Ejercicio de tu profe')), motorUI.el);
    actual = motorUI; motorUI.enfocar();
  }

  if (query.ej) await ejercicioDocente(query.ej); else if (query.modo === 'refuerzo') await refuerzo(); else await configurar();
  return cont;
}

export function destroy() { actual?.destruir(); actual = null; }
