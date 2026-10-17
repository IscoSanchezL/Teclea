/**
 * Mis clases (estudiante): unirse con código, tareas, reto de la clase y ranking positivo.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { misClases, unirse, salirDeClase, tareasEstudiante, rankingDeClase, aportesDeClase } from '../../db/clases.js';
import { icono } from '../icons.js';
import { avatar } from '../avatar.js';
import { toast, confirmar } from '../overlay.js';
import { campo } from '../componentes.js';
import { t, locale } from '../../i18n/index.js';

const enlaceTarea = (t) => (t.tipo === 'leccion' ? `#/leccion?id=${t.refId}` : t.tipo === 'ejercicio' ? `#/practica?ej=${t.refId}` : t.tipo === 'juego' ? `#/juegos?id=${t.refId}` : '#/aprende');
const fechaCorta = (ms) => new Date(ms).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });

export async function render({ query } = {}) {
  const u = state.user;
  const raiz = h('div', { class: 'clases-est' });

  async function pintar() {
    const [clases, tareas] = await Promise.all([misClases(u), tareasEstudiante(u).catch(() => [])]);
    const unir = campo({ etiqueta: t('cl.codigo'), maxlength: 6, autocomplete: 'off', autocapitalize: 'characters', placeholder: t('unirse.ph'), ayuda: t('cl.ayuda') });
    unir.input.style.textTransform = 'uppercase'; if (query?.codigo) unir.input.value = query.codigo;
    const enviar = async (e) => {
      e.preventDefault();
      try { await unirse(state.user, unir.input.value); toast(t('cl.unido')); pintar(); } catch (err) { toast(err.message || t('cl.noUnir'), { tipo: 'error' }); }
    };
    const formulario = h('form', { class: 'card clases-est__unir', onsubmit: enviar }, h('h2', { class: 'seccion__titulo' }, t('cl.unirme')),
      h('div', { class: 'fila fila--envuelve' }, unir.nodo, h('button', { class: 'btn btn--primary', type: 'submit' }, icono('plus', { tam: 18 }), t('cl.unirmeBtn'))));

    const tarjetas = await Promise.all(clases.filter((c) => c.clase).map(async ({ insc, clase }) => {
      const [rank, aportes] = await Promise.all([rankingDeClase(clase.id).catch(() => []), aportesDeClase(clase.id).catch(() => [])]);
      const total = aportes.reduce((a, x) => a + (x.caracteres || 0), 0), meta = clase.config?.metaClase || 20000;
      const lista = (campo, etq, sufijo) => h('ol', { class: 'rank' }, [...rank].sort((a, b) => (b[campo] || 0) - (a[campo] || 0)).slice(0, 5).map((r, i) =>
        h('li', { class: r.id === u.uid ? 'rank__yo' : '' }, h('span', { class: 'rank__pos' }, i + 1), avatar({ avatar: r.avatar }, { tam: 'sm' }), h('span', { class: 'rank__nombre' }, r.apodo), h('b', {}, `${r[campo] > 0 && campo === 'mejora' ? '+' : ''}${r[campo] || 0}${sufijo}`))));
      return h('section', { class: 'card clase-est' },
        h('header', { class: 'clase-est__cab', style: { '--c': clase.color || '#6C4CF5' } },
          h('div', {}, h('h2', {}, clase.nombre), h('small', { class: 'suave' }, `${t('grado.etq', { g: clase.grado })}${clase.grupo ? ` · ${clase.grupo}` : ''}`)),
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: t('cl.salirQ'), mensaje: t('cl.salirMsg'), si: t('cl.salirSi'), no: t('cl.quedarme'), peligro: true })) { await salirDeClase(insc); pintar(); } } }, t('cl.salirSi'))),
        h('div', { class: 'clase-est__reto' }, h('strong', {}, t('cl.reto')), h('span', { class: 'suave' }, t('cl.retoTexto', { a: total.toLocaleString(locale()), b: meta.toLocaleString(locale()) })),
          h('span', { class: 'reto__barra' }, h('i', { style: { width: `${Math.min(100, (total / meta) * 100)}%` } }))),
        clase.config?.rankingVisible === false || !rank.length ? h('p', { class: 'suave' }, t('cl.vacioRank')) :
          h('div', { class: 'clase-est__ranks' }, h('div', {}, h('h3', {}, t('cl.constantes')), lista('puntos', '', ` ${t('cl.xp')}`)), h('div', {}, h('h3', {}, t('cl.mejora')), lista('mejora', '', ` ${t('cl.ppm')}`))));
    }));

    const pendientes = tareas.filter((t) => !t.entrega);
    const hechas = tareas.filter((t) => t.entrega);
    const bloqueTareas = h('section', { class: 'card' }, h('h2', { class: 'seccion__titulo' }, t('cl.misTareas')),
      tareas.length ? h('ul', { class: 'tareas' }, [...pendientes, ...hechas].map(({ tarea, entrega }) => h('li', { class: `tarea ${entrega ? 'tarea--hecha' : ''}` },
        h('span', { class: 'tarea__ic' }, icono(entrega ? 'check' : tarea.tipo === 'juego' ? 'gamepad' : 'keyboard', { tam: 18 })),
        h('div', { class: 'tarea__txt' }, h('strong', {}, tarea.titulo), tarea.instrucciones ? h('small', { class: 'suave' }, tarea.instrucciones) : null,
          h('small', { class: 'suave' }, entrega ? `${t('cl.entregada', { w: entrega.wpm, p: entrega.precision })}${entrega.nota != null ? ` · ${t('cl.nota', { n: entrega.nota })}` : ''}` : tarea.vence ? t('cl.vence', { f: fechaCorta(tarea.vence) }) : t('cl.sinFecha'))),
        entrega ? null : h('a', { class: 'btn btn--primary btn--sm', href: enlaceTarea(tarea) }, t('cl.tarea.hacer'))))) : h('p', { class: 'suave' }, t('cl.sinTareas')));

    raiz.replaceChildren(h('header', { class: 'juegos__cab' }, h('h1', {}, t('cl.titulo')), h('p', { class: 'suave' }, t('cl.sub'))),
      formulario, clases.length ? h('div', { class: 'pila' }, tarjetas) : h('p', { class: 'suave' }, t('cl.sinClases')), bloqueTareas);
  }
  await pintar();
  return raiz;
}
