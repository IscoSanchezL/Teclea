/**
 * "Mi cuarto": el personaje del estudiante (siempre su emoji, nunca la foto) con los accesorios que compró,
 * su mascota y la decoración del cuarto. Es el lugar donde se ven las compras de la tienda.
 * cuarto(usuario, catalogo, { probando }) → <div class="cuarto">. `probando` muestra un artículo sin comprarlo.
 */
import { h } from '../core/utils.js';

export const ZONAS = { cabeza: 'En la cabeza', cara: 'En la cara', espalda: 'Detrás de ti', izquierda: 'Lado izquierdo', derecha: 'Lado derecho', pared: 'En la pared', techo: 'En el techo', estante: 'En el estante' };

/** Devuelve el avatar con el artículo de prueba puesto (sin guardar nada). */
export function conPrueba(av = {}, it, catalogo = []) {
  if (!it) return av;
  const a = { ...av, cuarto: { ...(av.cuarto || {}), deco: { ...(av.cuarto?.deco || {}) } } };
  if (it.categoria === 'fondo') a.fondo = it.fondo;
  if (it.categoria === 'marco') a.marco = it.marco;
  if (it.categoria === 'escena') a.cuarto.escena = it.escena;
  if (it.categoria === 'mascota') a.cuarto.mascota = it.mascota;
  if (it.categoria === 'deco') a.cuarto.deco[it.slot] = it.emoji;
  if (it.categoria === 'accesorio') {
    const otros = (a.accesorios || []).filter((e) => (catalogo.find((c) => c.emoji === e && c.categoria === 'accesorio')?.slot || 'cabeza') !== it.slot);
    a.accesorios = [...otros, it.emoji];
  }
  return a;
}

export function cuarto(u, catalogo = [], { probando = null, clase = '' } = {}) {
  const a = conPrueba(u?.avatar || {}, probando, catalogo);
  const c = a.cuarto || {};
  const zonaDe = (e) => catalogo.find((x) => x.categoria === 'accesorio' && x.emoji === e)?.slot || 'cabeza';
  const puestos = {}; (a.accesorios || []).forEach((e) => { puestos[zonaDe(e)] = e; });
  const piezas = Object.entries(c.deco || {}).map(([zona, emoji]) => h('span', { class: `cuarto__deco cuarto__deco--${zona}`, 'aria-hidden': 'true' }, emoji));
  return h('div', { class: `cuarto ${clase}`, dataset: { escena: c.escena || '', fondo: a.fondo || 'violeta', marco: a.marco || '' }, role: 'img', 'aria-label': 'Tu personaje y tu cuarto' },
    h('span', { class: 'cuarto__ventana', 'aria-hidden': 'true' }),
    h('span', { class: 'cuarto__piso', 'aria-hidden': 'true' }),
    ...piezas,
    h('div', { class: 'pj', 'aria-hidden': 'true' },
      puestos.espalda ? h('span', { class: 'pj__acc pj__acc--espalda' }, puestos.espalda) : null,
      h('span', { class: 'pj__sombra' }),
      h('span', { class: 'pj__cuerpo' }, a.emoji || '🦊'),
      puestos.cara ? h('span', { class: 'pj__acc pj__acc--cara' }, puestos.cara) : null,
      puestos.cabeza ? h('span', { class: 'pj__acc pj__acc--cabeza' }, puestos.cabeza) : null),
    c.mascota ? h('span', { class: 'cuarto__mascota', 'aria-hidden': 'true' }, c.mascota) : null);
}
