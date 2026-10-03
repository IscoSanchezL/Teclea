/**
 * Pinta el texto carácter por carácter: correcto en verde, incorrecto en rojo (con sacudida suave),
 * cursor parpadeante y desplazamiento automático. Solo actualiza los caracteres que cambian (O(1) por tecla).
 */
import { h } from '../core/utils.js';

export function vistaTexto(motor) {
  const spans = motor.chars.map((c) => h('span', { class: `t t--pend ${c === ' ' ? 't--esp' : ''}` }, c));
  const cont = h('div', { class: 'texto', 'aria-label': 'Texto para escribir', role: 'img' }, spans);
  let anterior = 0;

  const marcarActual = () => {
    spans[anterior]?.classList.remove('t--act');
    const s = spans[motor.pos];
    if (s) {
      s.classList.add('t--act'); anterior = motor.pos;
      // Mantiene la línea actual en la segunda fila visible
      const lh = s.offsetHeight || 32;
      const objetivo = s.offsetTop - lh * 1.1;
      if (Math.abs(cont.scrollTop - objetivo) > lh * 0.9 && objetivo > 0) cont.scrollTo({ top: objetivo, behavior: 'smooth' });
      else if (objetivo <= 0 && cont.scrollTop > 0) cont.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pintar = (i) => {
    const s = spans[i]; if (!s) return;
    s.classList.remove('t--pend', 't--ok', 't--mal');
    s.classList.add(motor.estado[i] === 1 ? 't--ok' : motor.estado[i] === 2 ? 't--mal' : 't--pend');
  };

  marcarActual();
  return {
    el: cont,
    alEvento(ev) {
      if (ev.tipo === 'avance') pintar(ev.pos - 1);
      else if (ev.tipo === 'error') {
        if (ev.avanzo) pintar(ev.pos);
        else { const s = spans[ev.pos]; s.classList.remove('t--sacude'); void s.offsetWidth; s.classList.add('t--sacude'); }
      } else if (ev.tipo === 'borrar') pintar(ev.pos);
      marcarActual();
    },
    reiniciar() { spans.forEach((s) => s.classList.remove('t--ok', 't--mal', 't--act', 't--sacude')); spans.forEach((s) => s.classList.add('t--pend')); anterior = 0; cont.scrollTop = 0; marcarActual(); },
  };
}
