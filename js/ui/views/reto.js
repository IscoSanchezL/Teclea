/**
 * Reto en vivo (estudiante): se prepara, espera al docente, juega y ve el podio.
 *   #/reto            → el reto activo de mi clase
 *   #/reto?id=…       → ese reto (también cuando ya terminó, para ver el podio)
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import * as R from '../../db/reto-clase.js';
import { validarMensaje, rankingParejas, rankingIndividual, MENSAJE_MAX } from '../../game/reto-clase.js';
import { crearEjercicio } from '../../lessons/ejercicio-ui.js';
import { registrarActividad } from '../../db/progreso.js';
import { icono } from '../icons.js';
import { mascota } from '../art.js';
import { podio } from '../reto-podio.js';
import { confirmar, toast } from '../overlay.js';
import { t, num } from '../../i18n/index.js';

let timer = null, ejercicio = null;
const SONDEO_MS = 3000;

export async function render({ query }) {
  const u = state.user;
  const raiz = h('div', { class: 'rv rv--est' });
  let reto = query.id ? await R.leerReto(query.id).catch(() => null) : await R.retoActivoDeAlumno(u).catch(() => null);
  if (!reto) return h('div', { class: 'rv rv--est' }, h('section', { class: 'card rv-centro' }, mascota('piensa', { tam: 'lg' }), h('h1', {}, t('rv.e.noHay')), h('a', { class: 'btn btn--primary', href: '#/' }, t('rv.e.volver'))));

  let entradas = [], mia = null, enJuego = false, ultima = '';
  const cargar = async () => {
    reto = (await R.leerReto(reto.id).catch(() => null)) || reto;
    entradas = await R.entradas(reto).catch(() => entradas);
    mia = entradas.find((e) => e.uid === u.uid) || null;
  };
  const firma = () => `${reto.estado}|${mia?.terminado ? 1 : 0}|${mia?.mensaje || ''}|${reto.estado === 'preparacion' ? '' : entradas.map((e) => `${e.uid}${e.puntos}${e.terminado}`).join()}`;
  const montar = (...n) => raiz.replaceChildren(...n.filter(Boolean));
  const titulo = () => h('header', { class: 'rv-cab' }, h('span', { class: 'etiqueta' }, t(`rv.e.titulo.${reto.tipo}`)), h('small', { class: 'suave' }, reto.claseNombre || ''));

  /* ── Preparación ── */
  function vistaEspera() {
    const pareja = reto.parejas?.find((p) => p.uids.includes(u.uid));
    const otros = pareja ? pareja.alias.filter((_, i) => pareja.uids[i] !== u.uid) : [];
    return h('section', { class: 'card rv-centro' }, mascota('anima', { tam: 'lg' }),
      pareja ? h('div', { class: 'rv-pareja' }, h('small', { class: 'suave' }, pareja.uids.length > 2 ? t('rv.e.tuTrio') : t('rv.e.tuPareja')), h('strong', {}, otros.join(' + ') || '—')) : null,
      h('p', { class: 'rv-espera', 'aria-live': 'polite' }, t('rv.e.esperaInicio')));
  }
  function vistaMensaje() {
    const campo = h('input', { class: 'input input--lg', type: 'text', maxlength: MENSAJE_MAX + 20, value: mia?.mensaje || '', placeholder: t('rv.e.msg.ph'), 'aria-label': t('rv.e.msg.titulo'), autocomplete: 'off' });
    const error = h('p', { class: 'rv-error', role: 'alert' });
    const contador = h('small', { class: 'suave' }, `${campo.value.length}/${MENSAJE_MAX}`);
    campo.addEventListener('input', () => { contador.textContent = `${campo.value.length}/${MENSAJE_MAX}`; error.textContent = ''; });
    const enviar = async () => {
      const v = validarMensaje(campo.value);
      if (!v.ok) { error.textContent = t(`rv.e.msg.${v.error}`); return; }
      try { await R.guardarMensaje(u, reto, v.texto); await cargar(); ultima = ''; pintar(true); toast(t('rv.e.msg.enviado')); } catch (e) { console.warn(e); error.textContent = t('rv.e.msg.err'); }
    };
    campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') enviar(); });
    return h('section', { class: 'card rv-mensaje' }, h('h1', {}, t('rv.e.msg.titulo')), h('p', { class: 'suave' }, t('rv.e.msg.ayuda')),
      campo, h('div', { class: 'fila fila--entre' }, contador, h('button', { class: 'btn btn--primary', type: 'button', onclick: enviar }, icono('check', { tam: 18 }), mia?.mensaje ? t('rv.e.msg.cambiar') : t('rv.e.msg.enviar'))), error,
      mia?.mensaje ? h('p', { class: 'rv-enviado' }, icono('circlecheck', { tam: 18 }), h('span', {}, t('rv.e.msg.enviado'))) : null,
      h('p', { class: 'rv-espera' }, t('rv.e.esperaInicio')));
  }

  /* ── Juego ── */
  function textoAsignado() {
    if (reto.tipo === 'parejas') return { texto: reto.texto, seg: reto.seg };
    const autor = reto.asignacion?.[u.uid];
    const m = entradas.find((e) => e.uid === autor)?.mensaje;
    return m ? { texto: m, seg: 0, autor: entradas.find((e) => e.uid === autor)?.alias } : null;
  }
  function vistaListo() {
    const dato = textoAsignado();
    if (!dato) return h('section', { class: 'card rv-centro' }, mascota('piensa', { tam: 'lg' }), h('p', {}, t('rv.e.sinMensaje')));
    return h('section', { class: 'card rv-centro' }, mascota('anima', { tam: 'lg' }),
      reto.tipo === 'final' ? h('h1', {}, t('rv.e.escribe')) : h('h1', {}, t('rv.e.titulo.parejas')),
      h('button', { class: 'btn btn--sun btn--lg', type: 'button', onclick: () => cuentaAtras(dato) }, icono('play', { tam: 22 }), t('rv.e.listo')));
  }
  function cuentaAtras(dato) {
    enJuego = true;
    const num = h('div', { class: 'rv-cuenta', 'aria-live': 'assertive' }, '3');
    montar(h('section', { class: 'card rv-centro' }, num));
    let n = 3;
    const paso = setInterval(() => {
      n--;
      if (n > 0) num.textContent = String(n);
      else { clearInterval(paso); num.textContent = t('rv.e.ya'); setTimeout(() => correr(dato), 450); }
    }, 800);
  }
  function correr({ texto, seg, autor }) {
    const ej = crearEjercicio({
      texto, modo: 'libre', seg, grande: (u.grado || 4) <= 3, titulo: t(`rv.e.titulo.${reto.tipo}`),
      alSalir: async () => { if (await confirmar({ titulo: t('rv.e.salirTitulo'), mensaje: t('rv.e.salirTexto'), si: t('practica.salir'), no: t('practica.seguir') })) { enJuego = false; ejercicio?.destruir(); ejercicio = null; ultima = ''; pintar(true); } },
      alFin: async ({ resultado, motor }) => {
        ejercicio = null;
        try {
          await R.guardarResultado(u, reto, { ppm: resultado.ppm, precision: resultado.precision });
          if (resultado.duracionSeg >= 3) registrarActividad({ user: state.user, tipo: 'practica', refId: `reto:${reto.id}`.slice(0, 80), resultado, porTecla: motor.porTecla }).catch((e) => console.warn('[reto] xp', e));
        } catch (e) { console.warn(e); toast(t('rv.e.errGuardar'), { tipo: 'error', ms: 6000 }); }
        enJuego = false; datoAutor = autor; await cargar(); ultima = ''; pintar(true);
      },
    });
    ejercicio = ej;
    montar(h('div', { class: 'ej-cab' }, h('h1', {}, reto.tipo === 'final' ? t('rv.e.escribe') : t('rv.e.titulo.parejas'))), ej.el);
    window.scrollTo({ top: 0 }); ej.enfocar();
  }
  let datoAutor = null;

  /* ── Resultado y podio ── */
  const filas = () => (reto.tipo === 'parejas' ? rankingParejas(reto.parejas || [], entradas) : rankingIndividual(entradas));
  function vistaResultado() {
    const cerrado = reto.estado === 'cerrado';
    return h('div', { class: 'pila' },
      h('section', { class: 'card rv-centro' }, mascota('celebra', { tam: 'lg' }),
        h('h1', {}, cerrado ? t('rv.e.cerrado') : t('rv.e.terminaste')),
        mia?.terminado ? h('p', { class: 'rv-puntaje' }, t('rv.e.tuPuntaje', { n: num(mia.puntos) })) : null,
        mia?.terminado ? h('p', { class: 'suave' }, `${Math.round(mia.wpm)} ${t('rv.p.ppm')} · ${Math.round(mia.precision)} %`) : null,
        reto.tipo === 'final' && datoAutor ? h('p', { class: 'suave' }, t('rv.e.eraDe', { n: datoAutor })) : null,
        !cerrado ? h('p', { class: 'rv-espera' }, t('rv.e.mientras')) : null,
        h('a', { class: 'btn btn--suave', href: '#/' }, t('rv.e.volver'))),
      h('section', { class: 'card' }, h('h2', { class: 'seccion__titulo' }, t('rv.p.titulo')), podio({ filas: filas(), tipo: reto.tipo })));
  }

  function pintar(forzar = false) {
    if (enJuego) return;
    const f = firma();
    if (!forzar && f === ultima) return;
    ultima = f;
    const cuerpo = reto.estado === 'cerrado' || mia?.terminado ? vistaResultado()
      : reto.estado === 'jugando' ? vistaListo()
      : reto.tipo === 'final' ? vistaMensaje() : vistaEspera();
    montar(titulo(), cuerpo);
  }

  await cargar(); pintar(true);
  clearInterval(timer);
  timer = setInterval(async () => { if (enJuego) return; await cargar(); pintar(); }, SONDEO_MS);
  return raiz;
}

export function destroy() { clearInterval(timer); timer = null; ejercicio?.destruir(); ejercicio = null; }
export const conservarAlCambiarIdioma = true;
