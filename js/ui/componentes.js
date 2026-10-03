/**
 * Componentes de formulario reutilizables y accesibles.
 */
import { h } from '../core/utils.js';

let contador = 0;
const uid = (p) => `${p}-${++contador}`;

/** Control segmentado (radios reales, navegable con flechas). */
export function segmentado({ nombre, etiqueta, opciones, valor, alCambiar }) {
  const grupo = h('div', { class: 'segmentado', role: 'radiogroup', 'aria-label': etiqueta });
  opciones.forEach((op) => {
    const id = uid('seg');
    const input = h('input', {
      type: 'radio', name: nombre, id, value: op.valor, checked: op.valor === valor,
      onchange: () => alCambiar(op.valor),
    });
    grupo.append(input, h('label', { for: id }, op.etiqueta));
  });
  return grupo;
}

/** Fila con interruptor (role="switch"). */
export function interruptor({ etiqueta, descripcion, activo, alCambiar }) {
  const idDesc = uid('desc');
  const btn = h('button', {
    type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(!!activo),
    'aria-label': etiqueta, 'aria-describedby': descripcion ? idDesc : null,
    onclick: () => {
      const nuevo = btn.getAttribute('aria-checked') !== 'true';
      btn.setAttribute('aria-checked', String(nuevo));
      alCambiar(nuevo);
    },
  }, h('span', { class: 'switch__bola' }));
  return h('div', { class: 'fila-ajuste' },
    h('div', { class: 'fila-ajuste__texto' },
      h('strong', {}, etiqueta),
      descripcion ? h('span', { id: idDesc, class: 'suave' }, descripcion) : null),
    btn);
}

/** Campo de texto con etiqueta visible y ayuda opcional. */
export function campo({ etiqueta, id = uid('campo'), ayuda, ...attrs }) {
  const idAyuda = `${id}-ayuda`;
  const input = h('input', { id, class: 'input', 'aria-describedby': ayuda ? idAyuda : null, ...attrs });
  return {
    input,
    nodo: h('div', { class: 'campo' },
      h('label', { for: id, class: 'campo__etiqueta' }, etiqueta),
      input,
      ayuda ? h('span', { id: idAyuda, class: 'campo__ayuda suave' }, ayuda) : null),
  };
}

/** Tarjeta de sección con título. */
export function seccion(titulo, ...hijos) {
  return h('section', { class: 'card seccion' }, h('h2', { class: 'seccion__titulo' }, titulo), ...hijos);
}
