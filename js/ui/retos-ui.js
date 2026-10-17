/**
 * Tarjeta de retos diarios (Inicio y Logros): progreso del día y botón para reclamar la recompensa.
 */
import { h } from '../core/utils.js';
import { state } from '../core/state.js';
import { icono } from './icons.js';
import { toast } from './overlay.js';
import { sonido } from './sonido.js';
import { confeti } from './confeti.js';
import { retosDelDia, progresoReto, retoCumplido, retosReclamados, reclamarReto } from '../game/retos.js';
import { t } from '../i18n/index.js';

export async function tarjetaRetos({ hoy, titulo = t('reto.titulo'), alReclamar } = {}) {
  const u = state.user;
  const retos = retosDelDia(undefined, u.grado || 4, u.uid);
  const reclamados = await retosReclamados(u.uid).catch(() => new Set());
  const lista = h('ul', { class: 'retos' });
  const pintar = () => lista.replaceChildren(...retos.map((r) => {
    const hecho = reclamados.has(r.id), listo = !hecho && retoCumplido(r, hoy), p = progresoReto(r, hoy);
    const btn = listo ? h('button', { class: 'btn btn--sun btn--sm', type: 'button', onclick: async (e) => {
      e.currentTarget.disabled = true;
      try {
        const g = await reclamarReto(state.user, r); reclamados.add(r.id); sonido.acierto(); confeti({ cantidad: 50 });
        toast(t('reto.monedas', { xp: g.xp, monedas: g.monedas })); pintar(); alReclamar?.(g);
        import('../game/insignias.js').then((m) => m.evaluarInsignias({ user: g.usuario, evento: 'reto' })).catch(() => {});
      } catch (err) { console.warn(err); toast(t('reto.errReclamar'), { tipo: 'error' }); e.currentTarget.disabled = false; }
    } }, t('reto.reclamar')) : null;
    return h('li', { class: `reto ${hecho ? 'reto--hecho' : ''} ${listo ? 'reto--listo' : ''}` },
      h('span', { class: 'reto__ic', 'aria-hidden': 'true' }, icono(hecho ? 'check' : r.icono, { tam: 20 })),
      h('div', { class: 'reto__cuerpo' }, h('span', { class: 'reto__tit' }, r.titulo),
        h('span', { class: 'reto__barra', role: 'progressbar', 'aria-label': r.titulo, 'aria-valuemin': 0, 'aria-valuemax': r.meta, 'aria-valuenow': p }, h('i', { style: { width: `${Math.round((hecho ? 1 : p / r.meta) * 100)}%` } })),
        h('small', { class: 'suave' }, hecho ? t('reto.reclamado') : t('reto.avance', { a: Math.floor(p), b: r.meta, xp: r.xp, monedas: r.monedas }))),
      btn);
  }));
  pintar();
  return h('section', { class: 'card' }, h('h2', { class: 'seccion__titulo' }, titulo), lista);
}
