/**
 * Componente de ejercicio: texto + estadísticas en vivo + teclado con manos + pausa.
 * Lo usan las lecciones, la práctica libre, los juegos de texto y los exámenes.
 *
 *   const ej = crearEjercicio({ texto, modo:'guiado'|'libre'|'oculto', estricto, seg, alFin });
 *   contenedor.append(ej.el); ej.enfocar(); ... ej.destruir();
 */
import { state } from '../core/state.js';
import { h } from '../core/utils.js';
import { icono } from '../ui/icons.js';
import { sonido } from '../ui/sonido.js';
import { MotorEscritura } from './motor.js';
import { vistaTexto } from './texto-vista.js';
import { crearTeclado } from './teclado-virtual.js';
import { vincularEntrada } from './entrada.js';
import { personajeSVG, especieDe } from '../ui/personaje.js';
import { confeti } from '../ui/confeti.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function crearEjercicio({ texto, modo = 'libre', estricto = false, seg = 0, grande = false, titulo = '', mostrarTeclado = true, alFin = () => {}, alSalir = null }) {
  const idioma = state.prefs.tecladoIdioma || 'es-LA';
  let intervalo = null, entrada = null, vista = null;
  const estrictoFinal = estricto || state.prefs.modoEstricto;

  // ── Compañero (solo 2.º y 3.º): tu mascota anima, celebra cada racha de aciertos y consuela al fallar ──
  const infantil = document.documentElement.dataset.estilo === 'ludico';
  let amigo = null, burbuja = null, racha = 0, hablaFin = 0;
  const FRASES_RACHA = ['¡Súper! 🌟', '¡Wow, qué rápido! 🚀', '¡Sigue así! 💪', '¡Eres genial! 🎉', '¡Increíble! ✨', '¡Qué bien escribes! 👏'];
  const FRASES_ERROR = ['¡Casi! Tú puedes 💪', 'Sin problema, ¡otra vez! 😊', '¡Con calma, vas muy bien! 🌈'];
  const azar = (l) => l[Math.floor(Math.random() * l.length)];
  function decir(texto, estado, ms = 1600) {
    if (!amigo) return;
    burbuja.textContent = texto; burbuja.classList.add('ej__burbuja--ver');
    amigo.dataset.estado = estado || ''; clearTimeout(hablaFin);
    hablaFin = setTimeout(() => { burbuja.classList.remove('ej__burbuja--ver'); amigo.dataset.estado = ''; }, ms);
  }
  function animarAmigo(ev) {
    if (!infantil || !amigo) return;
    if (ev.tipo === 'inicio') decir('¡Vamos, tú puedes! 🚀', 'salta', 1400);
    else if (ev.tipo === 'avance') { racha++; if (racha % 10 === 0) { decir(azar(FRASES_RACHA), 'salta'); sonido.acierto(); const r = amigo.getBoundingClientRect(); confeti({ cantidad: 28, duracion: 1300, origen: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }); } }
    else if (ev.tipo === 'error') { racha = 0; decir(azar(FRASES_ERROR), 'ay', 1500); }
    else if (ev.tipo === 'fin') decir('¡Lo lograste! 🎊', 'baila', 2500);
  }

  const motor = new MotorEscritura({
    texto, estricto: estrictoFinal, retroceso: state.prefs.permitirRetroceso, seg,
    alEvento: (ev) => {
      vista?.alEvento(ev); animarAmigo(ev);
      if (ev.tipo === 'avance' || ev.tipo === 'borrar') teclado.siguiente(motor.actual ?? null);
      if (ev.tipo === 'error' && ev.avanzo) teclado.siguiente(motor.actual ?? null);
      if (ev.tipo === 'inicio') raiz.classList.add('ej--en-curso');
      if (ev.tipo === 'fin') terminar();
      if (ev.tipo === 'pegado') { aviso.textContent = 'Escribe tú mismo el texto: pegar no está permitido 🙂'; aviso.classList.add('ej__aviso--alerta'); }
    },
  });

  const teclado = crearTeclado({ idioma, manos: true });
  teclado.setModo(mostrarTeclado ? modo : 'oculto');
  vista = vistaTexto(motor);

  // ── HUD ──
  const chipTiempo = h('span', { class: 'ej__dato' }, icono('clock', { tam: 18 }), h('b', {}, seg ? fmt(seg) : '0:00'));
  const chipPpm = h('span', { class: 'ej__dato' }, h('small', {}, 'PPM'), h('b', {}, '0'));
  const chipPre = h('span', { class: 'ej__dato' }, h('small', {}, 'Precisión'), h('b', {}, '100%'));
  const chipErr = h('span', { class: 'ej__dato ej__dato--err' }, h('small', {}, 'Errores'), h('b', {}, '0'));
  const bPausa = h('button', { class: 'btn btn--suave btn--sm', type: 'button', 'aria-label': 'Pausar', onclick: () => pausar() }, icono('pause', { tam: 16 }), 'Pausa');
  const bReiniciar = h('button', { class: 'btn btn--suave btn--sm', type: 'button', 'aria-label': 'Reiniciar el ejercicio', onclick: () => reiniciar() }, icono('refresh', { tam: 16 }), 'Reiniciar');
  const bSalir = alSalir ? h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: alSalir }, icono('x', { tam: 16 }), 'Salir') : null;
  const hud = h('div', { class: 'ej__hud' }, h('div', { class: 'ej__datos' }, chipTiempo, chipPpm, chipPre, chipErr), h('div', { class: 'fila' }, bPausa, bReiniciar, bSalir));

  const aviso = h('p', { class: 'ej__aviso', role: 'status', 'aria-live': 'polite' }, 'Empieza a escribir cuando quieras.');
  const pausaUI = h('div', { class: 'ej__pausa', hidden: true, role: 'dialog', 'aria-label': 'Pausa' },
    h('strong', {}, 'En pausa'), h('p', {}, 'Haz clic o presiona una tecla para continuar.'),
    h('button', { class: 'btn btn--primary', type: 'button', onclick: () => reanudar() }, icono('play', { tam: 18 }), 'Continuar'));
  const zonaTexto = h('div', { class: `ej__texto card ${grande ? 'ej__texto--grande' : ''}` }, vista.el, pausaUI);
  if (infantil) {
    const u = state.user;
    amigo = h('div', { class: 'ej__amigo', 'aria-hidden': 'true' }, personajeSVG(especieDe(u?.avatar), { acc: u?.avatar?.accesorios || [], cabeza: true, tam: 96 }));
    burbuja = h('div', { class: 'ej__burbuja', 'aria-hidden': 'true' });
    amigo.append(burbuja);
  }
  const raiz = h('section', { class: 'ej', 'aria-label': titulo || 'Ejercicio' }, hud, zonaTexto, aviso, teclado.el, amigo);

  entrada = vincularEntrada({
    motor, teclado, zona: zonaTexto,
    alPausar: () => pausar(),
    alFoco: (si) => { if (si && motor.pausado && !motor.terminado) reanudar(); else if (!si && !motor.terminado && motor.inicio != null) pausar(); },
  });

  function pausar() { if (motor.terminado || motor.inicio == null) return; motor.pausar(); pausaUI.hidden = false; }
  function reanudar() { if (!motor.pausado) { entrada.enfocar(); return; } motor.reanudar(); pausaUI.hidden = true; entrada.enfocar(); }

  function actualizarHud() {
    motor.tick();
    const s = motor.segundos();
    chipTiempo.lastChild.textContent = seg ? fmt(Math.ceil(motor.segundosRestantes() ?? seg)) : fmt(s);
    chipPpm.lastChild.textContent = String(motor.ppmEnVivo());
    chipPre.lastChild.textContent = `${Math.round(motor.precision() * 100)}%`;
    chipErr.lastChild.textContent = String(motor.errores);
    if (seg && motor.segundosRestantes() <= 10 && !motor.terminado) chipTiempo.classList.add('ej__dato--urgente');
  }

  function terminar() {
    clearInterval(intervalo);
    actualizarHud();
    raiz.classList.add('ej--fin');
    teclado.siguiente(null);
    sonido.fin();
    aviso.textContent = '¡Listo! Calculando tu resultado…';
    // un respiro para ver el último carácter pintado
    setTimeout(() => alFin({ resultado: motor.resultado(), motor }), 450);
  }

  function reiniciar() {
    clearInterval(intervalo); motor.reiniciar(); vista.reiniciar();
    raiz.classList.remove('ej--en-curso', 'ej--fin'); pausaUI.hidden = true; aviso.textContent = 'Empieza a escribir cuando quieras.';
    chipTiempo.classList.remove('ej__dato--urgente'); actualizarHud(); teclado.siguiente(motor.actual ?? null);
    intervalo = setInterval(actualizarHud, 200); entrada.enfocar();
  }

  teclado.siguiente(motor.actual ?? null);
  intervalo = setInterval(actualizarHud, 200);

  return {
    el: raiz, motor, teclado,
    enfocar: () => setTimeout(() => entrada.enfocar(), 60),
    destruir() { clearInterval(intervalo); entrada?.destruir(); },
  };
}
