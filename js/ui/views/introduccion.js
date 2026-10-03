/**
 * Introducción interactiva: postura del cuerpo (5 puntos con mini quiz "¿bien o mal?"),
 * posición de manos y reglas de oro. Las ilustraciones son SVG propios (se pueden reemplazar por arte final).
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { icono } from '../icons.js';
import { mascota } from '../art.js';
import { crearManos } from '../../lessons/manos.js';
import { confeti } from '../confeti.js';
import { sonido } from '../sonido.js';
import { guardarPerfil } from '../../auth/auth.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (t, a = {}, ...hijos) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); hijos.forEach((x) => e.append(x)); return e; };

/** Figura lateral de una persona frente a un escritorio. Parámetros según el punto de postura. */
function figura({ espalda = 'recta', pies = 'suelo', codos = 90, pantalla = 'ojos', munecas = 'flotan' }) {
  const svg = s('svg', { viewBox: '0 0 300 220', class: 'postura-svg', role: 'img', 'aria-hidden': 'true' });
  svg.append(s('rect', { x: 0, y: 200, width: 300, height: 20, rx: 6, class: 'ps-suelo' }));
  // escritorio
  svg.append(s('rect', { x: 150, y: 120, width: 140, height: 10, rx: 4, class: 'ps-mesa' }), s('rect', { x: 276, y: 130, width: 8, height: 70, class: 'ps-mesa' }));
  // teclado y pantalla
  svg.append(s('rect', { x: 170, y: 114, width: 54, height: 6, rx: 3, class: 'ps-teclado' }));
  const py = pantalla === 'ojos' ? 52 : 82, dist = pantalla === 'cerca' ? 0 : 0;
  svg.append(s('rect', { x: 256, y: py, width: 8, height: 62, rx: 3, class: 'ps-pantalla' }), s('rect', { x: 258, y: py + 62, width: 4, height: 8, class: 'ps-mesa' }));
  // silla
  svg.append(s('rect', { x: 70, y: 142, width: 54, height: 8, rx: 4, class: 'ps-silla' }), s('rect', { x: 66, y: 96, width: 8, height: 54, rx: 4, class: 'ps-silla' }), s('rect', { x: 94, y: 150, width: 6, height: 50, class: 'ps-silla' }));
  const cadera = [100, 140];
  const inclina = espalda === 'recta' ? 0 : espalda === 'encorvada' ? 26 : -14;
  const hombro = [cadera[0] + Math.sin((inclina * Math.PI) / 180) * 60, cadera[1] - Math.cos((inclina * Math.PI) / 180) * 60];
  const cabeza = [hombro[0] + (espalda === 'encorvada' ? 24 : espalda === 'recta' ? 4 : -6), hombro[1] - (espalda === 'encorvada' ? 18 : 24)];
  // piernas
  const rodilla = [cadera[0] + 46, cadera[1] + 4];
  const pie = pies === 'suelo' ? [rodilla[0] + 4, 198] : pies === 'cruzados' ? [rodilla[0] + 22, 186] : [rodilla[0] + 4, 178];
  svg.append(s('polyline', { points: `${cadera} ${rodilla} ${pie}`, class: 'ps-cuerpo' }));
  svg.append(s('line', { x1: cadera[0], y1: cadera[1], x2: hombro[0], y2: hombro[1], class: 'ps-cuerpo' }));
  svg.append(s('circle', { cx: cabeza[0], cy: cabeza[1], r: 13, class: 'ps-cabeza' }));
  // brazo: ángulo del codo
  const largo = 42;
  const ang = (codos * Math.PI) / 180;
  const codo = [hombro[0] + 6, hombro[1] + largo * (codos > 120 ? 0.5 : 0.95)];
  const mano = codos > 120 ? [codo[0] + largo * 1.1, codo[1] - 22] : [codo[0] + largo, codo[1] + (munecas === 'apoyadas' ? 14 : 0)];
  svg.append(s('polyline', { points: `${hombro} ${codo} ${mano}`, class: 'ps-brazo' }));
  void ang;
  return svg;
}

const PUNTOS = [
  { id: 'espalda', titulo: 'Espalda recta', texto: 'Siéntate con la espalda recta y apoyada en el respaldo. Así no te cansas.', bien: { espalda: 'recta' }, mal: { espalda: 'encorvada' }, malTxt: 'Encorvarse cansa la espalda y el cuello.' },
  { id: 'pies', titulo: 'Pies en el suelo', texto: 'Los dos pies planos en el piso, sin cruzar las piernas.', bien: { pies: 'suelo' }, mal: { pies: 'cruzados' }, malTxt: 'Con los pies en el aire o cruzados pierdes equilibrio.' },
  { id: 'codos', titulo: 'Codos en ángulo recto (90°)', texto: 'Tus codos se doblan como una L: ni muy altos ni muy estirados.', bien: { codos: 90 }, mal: { codos: 160 }, malTxt: 'Con los brazos estirados te cansas rápido y fallas más.' },
  { id: 'pantalla', titulo: 'Pantalla a la altura de los ojos', texto: 'Mira la pantalla de frente, a un brazo de distancia.', bien: { pantalla: 'ojos' }, mal: { pantalla: 'baja' }, malTxt: 'Mirar hacia abajo dobla el cuello. ¡Sube la pantalla!' },
  { id: 'munecas', titulo: 'Muñecas flotando', texto: 'Las muñecas quedan en el aire, rectas. Solo tus dedos tocan las teclas.', bien: { munecas: 'flotan' }, mal: { munecas: 'apoyadas' }, malTxt: 'Apoyar las muñecas fuerte puede lastimarlas.' },
];

const REGLAS = [
  ['No mires el teclado', 'Tus dedos aprenden dónde está cada tecla. Mira solo la pantalla.', 'eye'],
  ['Ritmo antes que velocidad', 'Escribe parejo, como un tambor. La velocidad llega sola.', 'bolt'],
  ['Precisión primero', 'Equivocarte frena más que ir despacio. Cada tecla cuenta.', 'target'],
  ['Practica un poquito cada día', 'Diez minutos diarios valen más que una hora una vez por semana.', 'flame'],
];

export async function render() {
  const cont = h('div', { class: 'intro-curso' });
  let paso = 0; const aciertos = new Set();
  const total = PUNTOS.length + 2; // postura(5) + manos + reglas

  const barra = () => h('div', { class: 'intro-curso__barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': paso + 1 }, h('i', { style: { width: `${((paso + 1) / total) * 100}%` } }));
  const nav = (siguiente, textoSig = 'Continuar', deshabilitado = false) => h('div', { class: 'fila fila--fin' },
    paso > 0 ? h('button', { class: 'btn btn--suave', type: 'button', onclick: () => ir(paso - 1) }, 'Atrás') : null,
    h('button', { class: 'btn btn--primary btn--lg', type: 'button', disabled: deshabilitado, onclick: siguiente }, textoSig, icono('arrow', { tam: 18 })));

  function postura(i) {
    const p = PUNTOS[i];
    const mostrarMal = Math.random() < 0.5;
    const respuesta = h('p', { class: 'quiz__resp', role: 'status', 'aria-live': 'polite' });
    const params = mostrarMal ? p.mal : p.bien;
    const resolver = (diceBien) => {
      const correcto = diceBien === !mostrarMal;
      respuesta.className = `quiz__resp ${correcto ? 'quiz__resp--ok' : 'quiz__resp--no'}`;
      respuesta.textContent = correcto ? (mostrarMal ? `¡Correcto! Está mal. ${p.malTxt}` : '¡Correcto! Así se hace.') : (mostrarMal ? `Mira otra vez: esta postura está mal. ${p.malTxt}` : 'Casi: esta es la postura correcta.');
      if (correcto) { aciertos.add(i); sonido.acierto(); } else sonido.error();
      btnSig.disabled = false;
    };
    const btnSig = h('button', { class: 'btn btn--primary btn--lg', type: 'button', disabled: true, onclick: () => ir(paso + 1) }, 'Continuar', icono('arrow', { tam: 18 }));
    cont.replaceChildren(barra(), h('section', { class: 'card intro-curso__card' },
      h('span', { class: 'etiqueta' }, `Postura ${i + 1} de ${PUNTOS.length}`), h('h1', {}, p.titulo), h('p', {}, p.texto),
      h('div', { class: 'quiz' }, h('figure', { class: 'quiz__fig' }, figura(params), h('figcaption', {}, '¿Esta postura está bien o mal?')),
        h('div', { class: 'quiz__botones' },
          h('button', { class: 'btn btn--mint btn--lg', type: 'button', onclick: () => resolver(true) }, icono('check', { tam: 20 }), 'Está bien'),
          h('button', { class: 'btn btn--coral btn--lg', type: 'button', onclick: () => resolver(false) }, icono('x', { tam: 20 }), 'Está mal'), respuesta)),
      h('div', { class: 'fila fila--fin' }, paso > 0 ? h('button', { class: 'btn btn--suave', type: 'button', onclick: () => ir(paso - 1) }, 'Atrás') : null, btnSig)));
  }

  function manos() {
    const m = crearManos(); const orden = ['indice-izq', 'medio-izq', 'anular-izq', 'menique-izq', 'indice-der', 'medio-der', 'anular-der', 'menique-der', 'pulgar-izq'];
    let i = 0; m.resaltar(orden[0]);
    const id = setInterval(() => { if (!cont.isConnected) return clearInterval(id); i++; m.resaltar(orden[i % orden.length]); }, 1100);
    cont.replaceChildren(barra(), h('section', { class: 'card intro-curso__card' },
      h('span', { class: 'etiqueta' }, 'Posición de las manos'), h('h1', {}, 'La fila base: tu casa'),
      h('p', {}, 'Tus dedos descansan sobre ', h('strong', {}, 'A S D F'), ' (mano izquierda) y ', h('strong', {}, 'J K L Ñ'), ' (mano derecha). Los pulgares están sobre la barra espaciadora.'),
      h('p', { class: 'intro__tip' }, icono('bulb', { tam: 20 }), 'Las teclas F y J tienen un puntito en relieve: sirven para encontrar la posición sin mirar.'),
      m.el, h('ul', { class: 'leyenda-dedos' }, [['menique', 'Meñique'], ['anular', 'Anular'], ['medio', 'Medio'], ['indice', 'Índice'], ['pulgar', 'Pulgar']].map(([d, n]) => h('li', {}, h('i', { class: `dedo-${d}` }), n))),
      nav(() => ir(paso + 1))));
  }

  function reglas() {
    cont.replaceChildren(barra(), h('section', { class: 'card intro-curso__card' },
      h('div', { class: 'fila' }, mascota('celebra', { tam: 'md' }), h('div', {}, h('span', { class: 'etiqueta' }, 'Reglas de oro'), h('h1', {}, '¡Ya estás listo!'))),
      h('ul', { class: 'reglas' }, REGLAS.map(([t, x, ic]) => h('li', {}, h('span', { class: 'reglas__ic' }, icono(ic, { tam: 22 })), h('div', {}, h('strong', {}, t), h('p', {}, x))))),
      h('p', { class: 'suave' }, `Acertaste ${aciertos.size} de ${PUNTOS.length} preguntas de postura.`),
      h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--suave', type: 'button', onclick: () => ir(paso - 1) }, 'Atrás'),
        h('button', { class: 'btn btn--sun btn--lg', type: 'button', onclick: async () => { try { await guardarPerfil({ prefs: { ...state.prefs, introHecha: true } }); } catch { /* sin red: se repite después */ } confeti(); navegar('/aprende'); } }, icono('play', { tam: 20 }), '¡A la primera lección!'))));
  }

  function ir(n) { paso = Math.max(0, Math.min(total - 1, n)); if (paso < PUNTOS.length) postura(paso); else if (paso === PUNTOS.length) manos(); else reglas(); window.scrollTo({ top: 0 }); }
  ir(0);
  return cont;
}
