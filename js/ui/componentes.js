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

/**
 * Anillo de progreso SVG. valor 0–1. `centro` es el contenido (texto o nodo) que va dentro.
 * anillo({ valor: .4, tam: 120, grosor: 12, color: 'var(--sol-400)' }, '40 %')
 */
export function anillo({ valor = 0, tam = 120, grosor = 12, color = 'var(--primario)', etiqueta = '' }, ...centro) {
  const NS = 'http://www.w3.org/2000/svg';
  const r = (tam - grosor) / 2, c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, valor));
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${tam} ${tam}`);
  svg.setAttribute('aria-hidden', 'true');
  const pista = document.createElementNS(NS, 'circle');
  const barra = document.createElementNS(NS, 'circle');
  for (const [el, clase] of [[pista, 'anillo__pista'], [barra, 'anillo__valor']]) {
    el.setAttribute('class', clase); el.setAttribute('cx', tam / 2); el.setAttribute('cy', tam / 2);
    el.setAttribute('r', r); el.setAttribute('stroke-width', grosor);
  }
  barra.style.stroke = color;
  barra.style.strokeDasharray = c;
  barra.style.strokeDashoffset = c; // arranca vacío y se llena
  requestAnimationFrame(() => requestAnimationFrame(() => { barra.style.strokeDashoffset = c * (1 - v); }));
  svg.append(pista, barra);
  const cont = h('div', { class: 'anillo', style: { '--tam': `${tam}px` }, role: etiqueta ? 'img' : null, 'aria-label': etiqueta || null }, svg,
    h('div', { class: 'anillo__centro' }, ...centro));
  return cont;
}
