/**
 * Pestaña "Retos en vivo" del panel docente: crear, controlar y proyectar el podio de los dos retos
 * (por parejas y final entre compañeros). Se actualiza sola cada pocos segundos mientras hay un reto activo.
 */
import { h } from '../../core/utils.js';
import { t, idioma } from '../../i18n/index.js';
import * as R from '../../db/reto-clase.js';
import { DURACIONES, armarParejas, armarTextoReto, rankingParejas, rankingIndividual } from '../../game/reto-clase.js';
import { icono } from '../icons.js';
import { podio } from '../reto-podio.js';
import { confirmar, toast } from '../overlay.js';
import { segmentado } from '../componentes.js';

const SONDEO_MS = 3000;
const NIVELES_POR_GRADO = { 2: [2], 3: [2], 4: [2, 3], 5: [3, 4], 6: [3, 4, 5] };
const bancos = {};
const cargarTextos = (lang) => (bancos[lang] ||= fetch(lang === 'en' ? 'data/en/texts.json' : 'data/texts.json').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }));

/**
 * @param {{docente:object, clases:object[], inscs:object[], claseId:string|null, alElegirClase:(id:string)=>void}} ctx
 * @returns {{el:HTMLElement, destruir:()=>void}}
 */
export function vistaRetos({ docente, clases, inscs, claseId, alElegirClase }) {
  const el = h('section', { class: 'rv rv--doc pila' });
  let timer = null, vivo = true;
  const clase = clases.find((c) => c.id === claseId) || clases[0];
  const detener = () => { clearInterval(timer); timer = null; };

  if (!clase) { el.append(h('div', { class: 'panel vacio' }, h('p', { class: 'suave' }, t('rv.d.sinClases')))); return { el, destruir: detener }; }
  const alumnos = inscs.filter((i) => i.classId === clase.id).map((i) => ({ uid: i.uid, alias: i.alias }));

  const selector = h('select', { class: 'input input--sm', 'aria-label': t('rv.d.clase'), onchange: (e) => alElegirClase(e.target.value) },
    clases.map((c) => h('option', { value: c.id, selected: c.id === clase.id }, c.nombre)));
  const cabecera = () => h('header', { class: 'panel__cab' }, h('div', {}, h('h2', {}, t('rv.titulo')), h('p', { class: 'suave' }, t('rv.sub'))), h('div', { class: 'fila' }, selector));

  /* ═════════ Crear ═════════ */
  function tarjetasCrear() {
    const tarjeta = (tipo, ic) => h('article', { class: 'panel rv-tipo' },
      h('span', { class: 'rv-tipo__ic', 'aria-hidden': 'true' }, icono(ic, { tam: 28 })), h('h3', {}, t(`rv.${tipo}.nombre`)), h('p', { class: 'suave' }, t(`rv.${tipo}.desc`)),
      h('button', { class: 'btn btn--primary', type: 'button', disabled: alumnos.length < 2, onclick: () => (tipo === 'parejas' ? formParejas() : crearFinal()) }, icono('plus', { tam: 16 }), t('rv.d.crear')));
    return h('div', { class: 'rv-tipos' }, tarjeta('parejas', 'users'), tarjeta('final', 'trophy'));
  }

  async function crearFinal() {
    try { await R.crearReto(docente, clase, { tipo: 'final', seg: 0 }); toast(t('rv.d.creado')); await pintar(); } catch (e) { console.warn(e); toast(t('rv.d.errCrear'), { tipo: 'error', ms: 6000 }); }
  }

  function formParejas() {
    const cfg = { seg: 120, lang: idioma(), parejas: armarParejas(alumnos) };
    const lista = h('ul', { class: 'rv-parejas' });
    const pintarLista = () => lista.replaceChildren(...cfg.parejas.map((p) => h('li', {}, h('b', {}, p.n), h('span', {}, p.alias.join(' + ')), p.uids.length > 2 ? h('small', { class: 'suave' }, ` (${t('rv.d.trio')})`) : null)));
    pintarLista();
    const caja = h('div', { class: 'panel rv-form' },
      h('h3', {}, t('rv.parejas.nombre')),
      h('div', { class: 'pila' }, h('strong', {}, t('rv.d.duracion')), segmentado({ nombre: 'rvdur', etiqueta: t('rv.d.duracion'), valor: String(cfg.seg), alCambiar: (v) => { cfg.seg = Number(v); }, opciones: DURACIONES.map((s) => ({ valor: String(s), etiqueta: t('rv.d.min', { n: s / 60 }) })) })),
      h('div', { class: 'pila' }, h('strong', {}, t('rv.d.idioma')), segmentado({ nombre: 'rvlang', etiqueta: t('rv.d.idioma'), valor: cfg.lang, alCambiar: (v) => { cfg.lang = v; }, opciones: [{ valor: 'es', etiqueta: t('practica.idioma.es') }, { valor: 'en', etiqueta: t('practica.idioma.en') }] })),
      h('div', { class: 'pila' }, h('div', { class: 'fila fila--entre' }, h('strong', {}, t('rv.d.parejasVista')), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { cfg.parejas = armarParejas(alumnos); pintarLista(); } }, icono('refresh', { tam: 16 }), t('rv.d.mezclar'))), lista),
      h('div', { class: 'fila fila--fin' },
        h('button', { class: 'btn btn--suave', type: 'button', onclick: () => pintar() }, t('confirmar.no')),
        h('button', { class: 'btn btn--primary', type: 'button', onclick: async (e) => {
          e.currentTarget.disabled = true;
          try {
            const data = await cargarTextos(cfg.lang);
            const texto = armarTextoReto(data.textos, { niveles: NIVELES_POR_GRADO[clase.grado] || [2, 3], seg: cfg.seg });
            await R.crearReto(docente, clase, { tipo: 'parejas', seg: cfg.seg, texto, parejas: cfg.parejas });
            toast(t('rv.d.creado')); await pintar();
          } catch (err) { console.warn(err); toast(t('rv.d.errCrear'), { tipo: 'error', ms: 6000 }); e.currentTarget.disabled = false; }
        } }, icono('check', { tam: 16 }), t('rv.d.crear'))));
    el.replaceChildren(cabecera(), caja);
  }

  /* ═════════ Reto en marcha ═════════ */
  const accion = (fn) => async (e) => { const b = e.currentTarget; b.disabled = true; try { await fn(); await pintar(); } catch (err) { console.warn(err); toast(t('rv.d.errAccion'), { tipo: 'error' }); b.disabled = false; } };

  function panelActivo(reto, ents) {
    const total = alumnos.length;
    const terminaron = ents.filter((e) => e.terminado).length;
    const autores = ents.filter((e) => e.mensaje);
    const puedeIniciar = reto.tipo === 'parejas' || new Set(autores.map((a) => a.uid)).size >= 2;
    const botones = h('div', { class: 'fila fila--envuelve' },
      reto.estado === 'preparacion' ? h('button', { class: 'btn btn--sun btn--lg', type: 'button', disabled: !puedeIniciar, title: puedeIniciar ? '' : t('rv.d.minMensajes'), onclick: accion(() => R.iniciarReto(reto, alumnos.map((a) => a.uid))) }, icono('play', { tam: 20 }), t('rv.d.iniciar')) : null,
      reto.estado === 'jugando' ? h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; try { await R.cerrarReto(reto); await pintar(); verPodio({ ...reto, estado: 'cerrado' }); } catch (err) { console.warn(err); toast(t('rv.d.errAccion'), { tipo: 'error' }); e.currentTarget.disabled = false; } } }, icono('trophy', { tam: 20 }), t('rv.d.cerrar')) : null,
      h('button', { class: 'btn btn--suave', type: 'button', onclick: async () => { if (await confirmar({ titulo: t('rv.d.cancelarTitulo'), mensaje: t('rv.d.cancelarTexto'), si: t('rv.d.cancelar'), peligro: true })) await accion(() => R.eliminarReto(reto))({ currentTarget: { disabled: false } }); } }, icono('trash', { tam: 16 }), t('rv.d.cancelar')));
    const estado = h('span', { class: `pill rv-estado rv-estado--${reto.estado}` }, h('i'), t(`rv.d.estado.${reto.estado}`));
    const progreso = reto.estado === 'preparacion' && reto.tipo === 'final' ? t('rv.d.listos', { a: autores.length, b: total }) : t('rv.d.progreso', { a: terminaron, b: total });

    let cuerpo;
    if (reto.estado === 'preparacion') {
      cuerpo = reto.tipo === 'final'
        ? h('div', { class: 'pila' }, h('p', { class: 'suave' }, t('rv.d.revisa')),
            autores.length ? h('ul', { class: 'rv-mensajes' }, autores.map((a) => h('li', {}, h('b', {}, a.alias), h('span', {}, `“${a.mensaje}”`), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: accion(() => R.quitarMensaje(a)) }, icono('trash', { tam: 14 }), t('rv.d.quitar')))))
              : h('p', { class: 'suave' }, t('rv.d.sinMensajes')),
            puedeIniciar ? null : h('p', { class: 'rv-aviso' }, t('rv.d.minMensajes')))
        : h('div', { class: 'pila' }, h('strong', {}, t('rv.d.parejasLista')),
            h('ul', { class: 'rv-parejas' }, reto.parejas.map((p) => h('li', {}, h('b', {}, p.n), h('span', {}, p.alias.join(' + '))))),
            h('p', { class: 'suave' }, `${t('rv.d.duracion')}: ${t('rv.d.min', { n: reto.seg / 60 })}`),
            h('details', {}, h('summary', {}, t('rv.d.textoAria')), h('p', { class: 'rv-texto' }, reto.texto)));
    } else {
      cuerpo = h('div', { class: 'pila' }, h('p', { class: 'suave' }, t('rv.d.pantalla')), ents.some((e) => e.terminado) ? podio({ filas: reto.tipo === 'parejas' ? rankingParejas(reto.parejas || [], ents) : rankingIndividual(ents), tipo: reto.tipo }) : h('p', { class: 'suave rv-vacio' }, t('rv.d.esperando')));
    }
    return h('article', { class: 'panel rv-activo' }, h('header', { class: 'fila fila--entre fila--envuelve' }, h('div', {}, h('small', { class: 'suave' }, t('rv.d.activo')), h('h3', {}, t(`rv.${reto.tipo}.nombre`))), h('div', { class: 'fila' }, estado, h('span', { class: 'suave' }, progreso))), cuerpo, botones);
  }

  /* ═════════ Historial ═════════ */
  function historial(cerrados) {
    return h('section', { class: 'panel' }, h('h3', {}, t('rv.d.historial')),
      cerrados.length ? h('ul', { class: 'rv-hist' }, cerrados.map((r) => h('li', {}, h('div', {}, h('strong', {}, t(`rv.${r.tipo}.nombre`)), h('small', { class: 'suave' }, ` · ${new Date(r.creadoEn || Date.now()).toLocaleDateString(idioma() === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short' })}`)),
        h('div', { class: 'fila' },
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => verPodio(r) }, icono('trophy', { tam: 14 }), t('rv.d.verPodio')),
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', 'aria-label': t('rv.d.eliminar'), onclick: accion(() => R.eliminarReto(r)) }, icono('trash', { tam: 14 }))))))
        : h('p', { class: 'suave' }, t('rv.d.sinHistorial')));
  }
  async function verPodio(r) {
    const ents = await R.entradas(r).catch(() => []);
    const { abrirCapa } = await import('../overlay.js');
    abrirCapa({ titulo: `${t('rv.p.titulo')} · ${t(`rv.${r.tipo}.nombre`)}`, tipo: 'dialogo', contenido: podio({ filas: r.tipo === 'parejas' ? rankingParejas(r.parejas || [], ents) : rankingIndividual(ents), tipo: r.tipo }) });
  }

  /* ═════════ Pintado y sondeo ═════════ */
  let firmaPrevia = '';
  async function pintar(solo = false) {
    if (!vivo) return;
    const retos = await R.retosDeClase(docente, clase).catch(() => []);
    const activo = retos.find((r) => R.ACTIVOS.includes(r.estado));
    const ents = activo ? await R.entradas(activo).catch(() => []) : [];
    const firma = JSON.stringify([activo?.id, activo?.estado, ents.map((e) => [e.uid, e.mensaje, e.puntos, e.terminado]), retos.length]);
    if (solo && firma === firmaPrevia) return;
    firmaPrevia = firma;
    if (!vivo) return;
    el.replaceChildren(...[cabecera(), activo ? panelActivo(activo, ents) : (alumnos.length < 2 ? h('p', { class: 'aviso', role: 'note' }, t('rv.d.pocos')) : null), activo ? null : tarjetasCrear(), historial(retos.filter((r) => r.estado === 'cerrado'))].filter(Boolean));
    detener();
    if (activo) timer = setInterval(() => pintar(true), SONDEO_MS);
  }
  pintar();
  return { el, destruir: () => { vivo = false; detener(); } };
}
