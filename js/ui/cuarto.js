/**
 * "Mi cuarto": la mascota del estudiante con los accesorios que compró y la decoración del cuarto.
 * Las mascotas y las prendas están dibujadas juntas (js/ui/personaje.js), así que encajan siempre.
 * cuarto(usuario, catalogo, { probando }) → <div class="cuarto">. `probando` muestra un artículo sin comprarlo.
 */
import { h } from '../core/utils.js';
import { personajeSVG, especieDe, zonaDeAccesorio } from './personaje.js';
import { decoSVG } from './decoracion.js';

export const ZONAS = { cabeza: 'En la cabeza', cara: 'En la cara', cuello: 'En el cuello', espalda: 'Detrás de ti', izquierda: 'Lado izquierdo', derecha: 'Lado derecho', pared: 'En la pared', techo: 'En el techo', estante: 'En el estante' };

/** Devuelve el avatar con el artículo de prueba puesto (sin guardar nada). */
export function conPrueba(av = {}, it) {
  if (!it) return av;
  const a = { ...av, cuarto: { ...(av.cuarto || {}), deco: { ...(av.cuarto?.deco || {}) } } };
  if (it.categoria === 'fondo') a.fondo = it.fondo;
  if (it.categoria === 'marco') a.marco = it.marco;
  if (it.categoria === 'escena') a.cuarto.escena = it.escena;
  if (it.categoria === 'mascota') a.mascota = it.especie;
  if (it.categoria === 'deco') a.cuarto.deco[it.slot] = it.emoji;
  if (it.categoria === 'accesorio') a.accesorios = [...(a.accesorios || []).filter((e) => zonaDeAccesorio(e) !== it.slot), it.emoji];
  return a;
}

export function cuarto(u, catalogo = [], { probando = null, clase = '' } = {}) {
  const a = conPrueba(u?.avatar || {}, probando);
  const c = a.cuarto || {};
  const piezas = Object.entries(c.deco || {}).map(([zona, emoji]) => h('span', { class: `cuarto__deco cuarto__deco--${zona}`, 'aria-hidden': 'true' }, decoSVG(emoji)));
  return h('div', { class: `cuarto ${clase}`, dataset: { escena: c.escena || '', fondo: a.fondo || 'violeta', marco: a.marco || '' }, role: 'img', 'aria-label': 'Tu mascota y tu cuarto' },
    h('span', { class: 'cuarto__ventana', 'aria-hidden': 'true' }),
    h('span', { class: 'cuarto__piso', 'aria-hidden': 'true' }),
    ...piezas,
    h('div', { class: 'pj', 'aria-hidden': 'true' }, personajeSVG(especieDe(a), { acc: a.accesorios || [], tam: 200 })));
}
