/**
 * Duelos de teclas con compañeros (solo los que están EN LÍNEA en la sala).
 *   #/duelos  → sala: quién está en línea, retar, responder invitaciones → cuenta regresiva → carrera → resultado
 * "En línea" = tener abierta esta sala (latido cada 30 s). Solo se ven compañeros de la misma clase, con apodo y avatar.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import * as D from '../../db/duelos.js';
import { registrarActividad } from '../../db/progreso.js';
import { textoDuelo, estaEnLinea, invitacionVigente, estadoDuelo, puntosDuelo, LATIDO_MS, CUENTA_REGRESIVA, GRACIA_MS } from '../../game/duelo.js';
import { crearEjercicio } from '../../lessons/ejercicio-ui.js';
import { panelResultado } from '../resultado.js';
import { avatar } from '../avatar.js';
import { icono } from '../icons.js';
import { mascota } from '../art.js';
import { toast } from '../overlay.js';
import { t, idioma } from '../../i18n/index.js';

let limpiezas = [];
const aLimpiar = (f) => { limpiezas.push(f); return f; };
function limpiarTodo() { const l = limpiezas; limpiezas = []; l.forEach((f) => { try { f(); } catch { /* ya liberado */ } }); }

const vocabCache = {};
const cargarVocab = async () => {
  const lang = idioma();
  const pedir = (l) => (vocabCache[l] ||= fetch(l === 'en' ? 'data/en/palabras.json' : 'data/palabras.json').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }));
  return pedir(lang).catch(() => pedir('es'));
};

export async function render() {
  limpiarTodo();
  const u = state.user, grado = u.grado || 4;
  const raiz = h('div', { class: 'dl' });
  const info = await D.clasesConDuelos(u).catch(() => ({ activas: [], hayClases: false, apagados: false }));

  const volver = h('a', { class: 'btn btn--suave btn--sm', href: '#/juegos' }, icono('arrow', { tam: 16 }), t('duelo.volver'));
  if (!info.activas.length) {
    const msg = info.apagados ? t('duelo.apagados') : t('duelo.sinClase');
    raiz.append(h('section', { class: 'card dl-centro' }, mascota('piensa', { tam: 'lg' }), h('h1', {}, t('duelo.titulo')), h('p', { class: 'suave' }, msg), volver));
    return raiz;
  }

  /* ───────── estado ───────── */
  const clases = info.activas;                       // [{id, nombre}]
  const nombreClase = (id) => clases.find((c) => c.id === id)?.nombre || '';
  let enLinea = new Map();                           // uid → {uid, apodo, avatar, estado, classId}
  let invitaciones = [];                             // duelos vigentes que me enviaron
  let miEstado = 'libre', modo = 'sala';             // 'sala' | 'espera' | 'cuenta' | 'juego' | 'fin'
  let pendiente = null, partida = null, destruido = false, ultimaRespuesta = '';
  const porClase = {};                               // classId → lista cruda de presencias

  const zona = h('div', { class: 'dl__zona' });
  raiz.append(zona);
  const montar = (...n) => zona.replaceChildren(...n.filter(Boolean));

  /* ───────── presencia (latido) ───────── */
  const publicar = (estado = miEstado) => { miEstado = estado; clases.forEach((c) => D.publicarPresencia(u, c.id, estado).catch((e) => console.warn('[duelos] presencia', e?.code || e))); };
  publicar('libre');
  const latido = setInterval(() => publicar(), LATIDO_MS); aLimpiar(() => clearInterval(latido));
  const salir = () => clases.forEach((c) => D.salirDeSala(u, c.id));
  aLimpiar(salir);
  const alCerrarPagina = () => salir(); window.addEventListener('pagehide', alCerrarPagina); aLimpiar(() => window.removeEventListener('pagehide', alCerrarPagina));

  /* ───────── escuchar la sala y las invitaciones ───────── */
  const recomponerSala = () => {
    const nuevos = new Map();
    for (const [classId, lista] of Object.entries(porClase)) {
      const ref = Math.max(0, ...lista.map((p) => p.visto || 0));     // hora del servidor más reciente (la mía, que acaba de latir)
      for (const p of lista) if (p.id !== u.uid && estaEnLinea(p, ref)) nuevos.set(`${classId}:${p.id}`, { uid: p.id, apodo: p.apodo, avatar: p.avatar, estado: p.estado, classId });
    }
    enLinea = nuevos; if (modo === 'sala') pintarSala();
  };
  clases.forEach((c) => aLimpiar(D.escucharSala(c.id, (lista) => { porClase[c.id] = lista; recomponerSala(); }, (e) => console.warn('[duelos] sala', e?.code || e))));
  clases.forEach((c) => aLimpiar(D.escucharInvitaciones(u, c.id, (lista) => {
    const ahora = Date.now();
    invitaciones = lista.filter((d) => invitacionVigente(d, ahora)).map((d) => ({ ...d, classId: c.id }));
    lista.filter((d) => !invitacionVigente(d, ahora)).forEach((d) => D.borrarDuelo(c.id, d.id));      // invitaciones viejas: se limpian
    // Si yo estaba esperando a esa misma persona y me reta a la vez, se acepta la suya
    const cruzada = invitaciones.find((d) => modo === 'espera' && pendiente && d.de === pendiente.a);
    if (cruzada) { D.cancelar(pendiente.classId, pendiente.id).catch(() => {}); pendiente = null; aceptar(cruzada); return; }
    if (modo === 'sala') pintarSala();
  }, (e) => console.warn('[duelos] invitaciones', e?.code || e))));

  /* ───────── Sala ───────── */
  function tarjetaJugador(p) {
    const ocupado = p.estado === 'jugando';
    return h('li', { class: `dl-jugador ${ocupado ? 'dl-jugador--ocupado' : ''}` },
      avatar({ avatar: p.avatar }, { tam: 'md' }),
      h('div', { class: 'dl-jugador__datos' }, h('strong', {}, p.apodo), h('small', { class: 'suave' }, ocupado ? t('duelo.jugando') : (clases.length > 1 ? nombreClase(p.classId) : t('duelo.libre')))),
      h('button', { class: 'btn btn--primary btn--sm', type: 'button', disabled: ocupado || null, onclick: () => retar(p) }, icono('bolt', { tam: 16 }), t('duelo.retar')));
  }
  function pintarSala() {
    const lista = [...enLinea.values()].sort((a, b) => a.apodo.localeCompare(b.apodo, idioma()));
    const invs = invitaciones.map((d) => h('div', { class: 'dl-invitacion card', role: 'alert' },
      avatar({ avatar: d.deAv }, { tam: 'md' }),
      h('div', { class: 'dl-invitacion__txt' }, h('strong', {}, t('duelo.teReta', { n: d.deApodo })), h('small', { class: 'suave' }, t('duelo.mismoTexto'))),
      h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => aceptar(d) }, t('duelo.acepto')),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => rechazar(d) }, t('duelo.ahoraNo'))));
    montar(
      h('header', { class: 'dl__cab' }, h('div', {}, h('h1', {}, t('duelo.titulo')), h('p', { class: 'suave' }, t('duelo.sub'))), volver),
      ...invs,
      h('section', { class: 'card dl-sala' },
        h('h2', {}, t('duelo.enLinea', { n: lista.length })),
        lista.length
          ? h('ul', { class: 'dl-lista' }, lista.map(tarjetaJugador))
          : h('div', { class: 'dl-vacio' }, mascota('anima', { tam: 'md' }), h('p', {}, t('duelo.nadie')), h('small', { class: 'suave' }, t('duelo.nadieAyuda')))),
      h('p', { class: 'suave pequeno dl__nota' }, icono('lock', { tam: 14 }), ' ', t('duelo.privacidad')));
  }

  /* ───────── Retar / responder ───────── */
  async function retar(p) {
    if (modo !== 'sala') return;
    modo = 'espera';
    try {
      const texto = textoDuelo(grado, await cargarVocab());
      pendiente = await D.retar(u, { uid: p.uid, apodo: p.apodo, avatar: p.avatar }, p.classId, texto);
    } catch (e) { console.warn('[duelos] retar', e?.code || e); modo = 'sala'; toast(t('duelo.noPudo'), { tipo: 'error' }); pintarSala(); return; }
    const desistir = async () => { if (!pendiente) return; clearTimeout(venc); bajar(); const d = pendiente; pendiente = null; await D.cancelar(d.classId, d.id).catch(() => {}); modo = 'sala'; pintarSala(); };
    const venc = setTimeout(() => { if (modo === 'espera') { toast(t('duelo.noRespondio', { n: p.apodo }), { tipo: 'info' }); desistir(); } }, 60000);
    const bajar = D.escucharDuelo(pendiente.classId, pendiente.id, (d) => {
      if (!d || modo !== 'espera') return;
      if (d.estado === 'aceptado') { clearTimeout(venc); bajar(); const cl = pendiente.classId; pendiente = null; empezar({ ...d, classId: cl }); }
      else if (d.estado === 'rechazado' || d.estado === 'cancelado') { clearTimeout(venc); bajar(); toast(t('duelo.rechazo', { n: p.apodo }), { tipo: 'info' }); pendiente = null; modo = 'sala'; pintarSala(); }
    }, (e) => console.warn('[duelos] espera', e?.code || e));
    aLimpiar(() => { clearTimeout(venc); bajar(); if (pendiente) D.cancelar(pendiente.classId, pendiente.id).catch(() => {}); });
    montar(h('section', { class: 'card dl-centro' }, avatar({ avatar: p.avatar }, { tam: 'xl' }), h('h2', {}, t('duelo.esperando', { n: p.apodo })), h('p', { class: 'suave' }, t('duelo.esperandoAyuda')),
      h('button', { class: 'btn btn--suave', type: 'button', onclick: desistir }, t('duelo.cancelar'))));
  }
  async function aceptar(d) {
    if (modo !== 'sala' && modo !== 'espera') return;
    modo = 'espera';
    try { await D.responder(d.classId, d.id, true); } catch (e) { console.warn('[duelos] aceptar', e?.code || e); modo = 'sala'; toast(t('duelo.noPudo'), { tipo: 'error' }); pintarSala(); return; }
    const bajar = D.escucharDuelo(d.classId, d.id, (x) => { if (x && x.estado === 'aceptado' && modo === 'espera') { bajar(); empezar({ ...x, classId: d.classId }); } });
    aLimpiar(bajar);
  }
  async function rechazar(d) { await D.responder(d.classId, d.id, false).catch(() => {}); invitaciones = invitaciones.filter((x) => x.id !== d.id); pintarSala(); }

  /* ───────── Partida ───────── */
  function empezar(duelo) {
    partida = { duelo, yo: u.uid, rival: duelo.de === u.uid ? duelo.a : duelo.de, rivalApodo: duelo.de === u.uid ? duelo.aApodo : duelo.deApodo, rivalAv: duelo.de === u.uid ? duelo.aAv : duelo.deAv };
    modo = 'cuenta'; publicar('jugando');
    let n = CUENTA_REGRESIVA;
    const num = h('div', { class: 'dl-cuenta__n', 'aria-live': 'assertive' }, String(n));
    montar(h('section', { class: 'card dl-centro dl-cuenta' }, h('div', { class: 'dl-vs' }, avatar({ avatar: u.avatar }, { tam: 'xl' }), h('span', { class: 'dl-vs__vs' }, 'VS'), avatar({ avatar: partida.rivalAv }, { tam: 'xl' })),
      h('h2', {}, t('duelo.contraN', { n: partida.rivalApodo })), num, h('p', { class: 'suave' }, t('duelo.prepara'))));
    const id = setInterval(() => { n -= 1; if (n <= 0) { clearInterval(id); correr(); } else num.textContent = String(n); }, 1000);
    aLimpiar(() => clearInterval(id));
  }

  function correr() {
    if (destruido) return;
    modo = 'juego';
    const { duelo, yo, rival } = partida;
    const largo = duelo.texto.length;
    let ej = null, ya = false, rivalTermino = false, ultimo = '';
    let esperaFin = null, fase = 'jugando', resultadoMio = null;
    const barra = (av, apodo, cls) => { const fill = h('i', { style: { width: '0%' } }); const pct = h('b', {}, '0%'); return { el: h('div', { class: `dl-barra ${cls}` }, avatar({ avatar: av }, { tam: 'sm' }), h('div', { class: 'dl-barra__pista' }, h('span', {}, apodo), h('div', { class: 'dl-barra__riel' }, fill)), pct), fill, pct }; };
    const mia = barra(u.avatar, t('duelo.tu'), 'dl-barra--yo'), suya = barra(partida.rivalAv, partida.rivalApodo, 'dl-barra--rival');
    const poner = (b, pos) => { const p = Math.min(100, Math.round((pos / largo) * 100)); b.fill.style.width = `${p}%`; b.pct.textContent = `${p}%`; };
    const aviso = h('p', { class: 'dl__aviso', role: 'status', hidden: true });

    ej = crearEjercicio({
      texto: duelo.texto, modo: grado <= 3 ? 'guiado' : 'libre', estricto: true, seg: duelo.seg, grande: grado <= 3, titulo: t('duelo.titulo'),
      alFin: ({ resultado, motor }) => terminar(resultado, motor),
    });
    montar(h('section', { class: 'dl-carrera' }, h('div', { class: 'dl-barras' }, mia.el, suya.el), aviso, ej.el));
    ej.enfocar();
    aLimpiar(() => ej?.destruir());

    // Mi avance: se ve al instante y se comparte cada ~1,5 s (solo si cambió)
    const reloj = setInterval(() => {
      const m = ej.motor; if (!m || ya) return;
      poner(mia, m.pos);
      const huella = `${m.pos}/${m.errores}`;
      if (huella !== ultimo) { ultimo = huella; D.guardarAvance(duelo.classId, duelo.id, yo, { pos: m.pos, err: Math.min(m.errores, 3000), fin: false }).catch(() => {}); }
    }, 1500);
    const pintar = setInterval(() => { if (ej?.motor && !ya) poner(mia, ej.motor.pos); }, 120);
    aLimpiar(() => { clearInterval(reloj); clearInterval(pintar); });

    // Avance del rival en vivo
    let gracia = null;
    const bajar = D.escucharDuelo(duelo.classId, duelo.id, (d) => {
      if (!d) return;
      partida.duelo = { ...partida.duelo, ...d, prog: { ...(d.prog || {}), ...(ya ? { [yo]: partida.duelo.prog?.[yo] } : {}) } };
      const p = d.prog?.[rival]; if (p) poner(suya, p.pos || 0);
      if (p?.fin && p.completo && !ya && !rivalTermino) {
        rivalTermino = true; aviso.hidden = false; aviso.textContent = t('duelo.rivalTermino', { n: partida.rivalApodo, s: Math.round(GRACIA_MS / 1000) });
        gracia = setTimeout(() => { if (!ya) ej.motor.terminar(); }, GRACIA_MS);        // se acaba el tiempo extra
      }
      if (ya) evaluar();
    }, (e) => console.warn('[duelos] partida', e?.code || e));
    aLimpiar(() => { bajar(); clearTimeout(gracia); });

    function terminar(resultado, motor) {
      if (ya) return; ya = true; clearInterval(reloj); clearInterval(pintar);
      const completo = motor.pos >= largo;
      poner(mia, motor.pos);
      resultadoMio = resultado;
      const final = { pos: motor.pos, err: Math.min(motor.errores, 3000), fin: true, completo, ms: Math.min(400000, Math.round(motor.msActivos())) };
      partida.duelo = { ...partida.duelo, prog: { ...(partida.duelo.prog || {}), [yo]: final } };
      D.guardarAvance(duelo.classId, duelo.id, yo, final).catch(() => {});
      aviso.hidden = false; aviso.textContent = t('duelo.esperandoRival', { n: partida.rivalApodo });
      // si el rival no termina (se fue o se quedó), no se espera para siempre
      esperaFin = setTimeout(() => evaluar(true), GRACIA_MS + 5000);
      aLimpiar(() => clearTimeout(esperaFin));
      evaluar();
    }
    function evaluar(abandono = false) {
      if (fase !== 'jugando') return;
      const mio = { ...partida.duelo, prog: { ...partida.duelo.prog } };
      const est = estadoDuelo(mio, yo, { rivalAbandono: abandono });
      if (est.fase !== 'terminado') return;
      fase = 'fin'; clearTimeout(esperaFin);
      if (partida.duelo.de === yo) D.cerrarDuelo(duelo.classId, duelo.id).catch(() => {});
      mostrarResultado(est, resultadoMio);
    }
  }

  function mostrarResultado(est, res) {
    modo = 'fin'; publicar('libre');
    const { rival, rivalApodo } = partida;
    const sospechoso = res.banderas?.pegado || res.banderas?.imposible;
    const resumen = sospechoso ? Promise.resolve(null) : registrarActividad({ user: state.user, tipo: 'juego', refId: 'duelo', resultado: res, puntos: puntosDuelo(est.resultado, res.ppm) })
      .then(async (g) => { try { const { evaluarInsignias } = await import('../../game/insignias.js'); g.insignias = await evaluarInsignias({ user: g.usuario, evento: 'juego', juego: 'duelo', resultado: res, resumen: g, refId: 'duelo' }); } catch { /* sin medallas */ } return g; })
      .catch(() => null);
    const titulo = est.resultado === 'gano' ? t('duelo.gano') : est.resultado === 'empate' ? t('duelo.empate') : t('duelo.pierde');
    const sub = est.suyo.fin && Number.isFinite(est.suyo.ms) && est.suyo.completo ? t('duelo.tiempos', { a: (est.mio.ms / 1000).toFixed(1), n: rivalApodo, b: (est.suyo.ms / 1000).toFixed(1) }) : t('duelo.contraN', { n: rivalApodo });
    const rivalSigue = [...enLinea.values()].find((p) => p.uid === rival);
    montar(panelResultado({ titulo, subtitulo: sub, estrellas: null, resultado: res, resumen,
      acciones: [
        rivalSigue ? { texto: t('duelo.revancha'), clase: 'btn--primary btn--lg', principal: true, icono: 'refresh', onclick: () => { modo = 'sala'; retar(rivalSigue); } } : null,
        { texto: t('duelo.volverSala'), onclick: () => { modo = 'sala'; partida = null; pintarSala(); } },
      ].filter(Boolean) }));
  }

  pintarSala();
  aLimpiar(() => { destruido = true; });
  return raiz;
}

export function destroy() { limpiarTodo(); }
/** Hay un duelo en curso: cambiar de idioma no debe reiniciar la vista. */
export const conservarAlCambiarIdioma = true;
