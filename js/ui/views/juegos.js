/**
 * Juegos: cuadrícula de 5 minijuegos + ejecución + resultado (XP, monedas, medallas).
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { almacen } from '../../core/utils.js';
import { JUEGOS } from '../../game/juegos.js';
import { registrarActividad } from '../../db/progreso.js';
import { icono } from '../icons.js';
import { panelResultado } from '../resultado.js';
import { confirmar } from '../overlay.js';

let actual = null;
let vocabCache = null;
const cargarVocab = async () => (vocabCache ||= (await fetch('data/palabras.json')).json());
const claveMejor = (uid, id) => `teclea:mejor:${uid}:${id}`;
const leerMejor = (uid, id) => { try { return Number(localStorage.getItem(claveMejor(uid, id))) || 0; } catch { return 0; } };
const guardarMejor = (uid, id, v) => { try { localStorage.setItem(claveMejor(uid, id), String(v)); } catch { /* sin almacenamiento */ } };

export async function render({ query }) {
  const u = state.user, grado = u.grado || 4;
  const cont = h('div', { class: 'juegos' });
  const limpiar = () => { actual?.destruir(); actual = null; };
  const montar = (...n) => { limpiar(); cont.replaceChildren(...n.filter(Boolean)); window.scrollTo({ top: 0 }); };

  function menu() {
    montar(h('header', { class: 'juegos__cab' }, h('h1', {}, 'Juegos'), h('p', { class: 'suave' }, 'Practicar jugando también cuenta: ganas XP, monedas y medallas.')),
      h('div', { class: 'juegos__rejilla' }, JUEGOS.map((j, i) => h('button', { class: 'juego-tarjeta reveal', style: { '--g1': j.color[0], '--g2': j.color[1], '--i': i }, type: 'button', onclick: () => jugar(j) },
        h('span', { class: 'juego-tarjeta__ic' }, icono(j.icono, { tam: 34 })),
        h('strong', {}, j.nombre), h('span', {}, j.texto),
        leerMejor(u.uid, j.id) ? h('small', { class: 'juego-tarjeta__mejor' }, `Tu mejor: ${leerMejor(u.uid, j.id)} pts`) : h('small', { class: 'juego-tarjeta__mejor' }, '¡Sé el primero en tu marca!'),
        h('span', { class: 'juego-tarjeta__jugar' }, icono('play', { tam: 18 }), 'Jugar')))));
  }

  async function jugar(j) {
    const vocab = await cargarVocab();
    const zona = h('div', { class: `jg jg--${j.id}` });
    const mejorPrevio = leerMejor(u.uid, j.id);
    montar(h('div', { class: 'jg__barra' },
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: '¿Salir del juego?', mensaje: 'No se guardará esta partida.', si: 'Salir', no: 'Seguir' })) menu(); } }, icono('arrow', { tam: 18 }), 'Salir'),
      h('h1', {}, j.nombre)), zona);
    actual = j.crear({ zona, grado, vocab, mejorPrevio, alFin: (r) => terminar(j, r, mejorPrevio) });
    // el router devuelve el foco al título tras cargar la vista: se recupera el campo de escritura
    let n = 0; const pulso = setInterval(() => { const a = document.activeElement?.tagName; if (!actual || !zona.isConnected || ++n > 20) return clearInterval(pulso); if (a === 'H1' || a === 'BODY') zona.querySelector('.entrada-oculta')?.focus({ preventScroll: true }); }, 150);
  }

  function terminar(j, r, mejorPrevio) {
    const dur = Math.max(3, r.duracionSeg);
    const chars = Math.min(r.chars, dur * 12);
    const ppm = Math.min(200, Math.round((chars / 5 / (dur / 60)) * 10) / 10);
    const total = chars + r.errores;
    const precision = total ? Math.round((chars / total) * 1000) / 10 : 100;
    const resultado = { ppm, precision, errores: r.errores, duracionSeg: dur, caracteres: chars, porTecla: {} };
    const nuevoRecord = r.puntos > mejorPrevio;
    if (nuevoRecord) guardarMejor(u.uid, j.id, r.puntos);
    const resumen = (async () => {
      const g = await registrarActividad({ user: state.user, tipo: 'juego', refId: j.id, resultado, puntos: r.puntos });
      try { const { evaluarInsignias } = await import('../../game/insignias.js'); g.insignias = await evaluarInsignias({ user: g.usuario, evento: 'juego', juego: j.id, resultado, resumen: g, refId: j.id }); } catch (e) { console.warn('[insignias]', e); }
      import('../../db/clases.js').then((m) => m.entregarTareas(g.usuario, { tipo: 'juego', refId: j.id, resultado, sesionId: g.sesionId })).catch(() => {});
      return g;
    })();
    montar(panelResultado({ titulo: `${r.puntos} puntos`, subtitulo: j.nombre, estrellas: null, resultado, resumen,
      acciones: [{ texto: 'Jugar otra vez', clase: 'btn--primary btn--lg', principal: true, icono: 'refresh', onclick: () => jugar(j) }, { texto: 'Más juegos', onclick: menu }] }),
      nuevoRecord && mejorPrevio ? h('p', { class: 'chip chip--racha juegos__record' }, icono('bolt', { tam: 18 }), `¡Nuevo récord! Antes: ${mejorPrevio} pts`) : null);
  }

  const j = JUEGOS.find((x) => x.id === query.id);
  if (j) await jugar(j); else menu();
  return cont;
}
export function destroy() { actual?.destruir(); actual = null; }
