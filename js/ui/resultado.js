/**
 * Panel de resultados: estrellas animadas, métricas, comparación con tu mejor marca, XP, monedas, racha,
 * nuevas medallas y botones de acción. `resumen` llega de forma asíncrona (se guarda mientras se muestra).
 */
import { h, contar } from '../core/utils.js';
import { icono } from './icons.js';
import { mascota } from './art.js';
import { sonido } from './sonido.js';
import { confeti } from './confeti.js';
import { personajeSVG, especieDe } from './personaje.js';
import { state } from '../core/state.js';
import { medallaSVG } from './medallas.js';

const MENSAJES = {
  3: ['¡Increíble! Tus dedos ya conocen el camino.', '¡Perfecto! Eso fue de campeón.', '¡Tres estrellas! Cada vez escribes mejor.'],
  2: ['¡Muy bien! Un poco más de precisión y llegas a las 3 estrellas.', '¡Casi perfecto! Sigue así.'],
  1: ['¡Lo lograste! Repite para mejorar tu marca.', '¡Bien hecho! La práctica te hará más rápido.'],
  0: ['Casi lo logras. Ve más despacio: la precisión viene primero.', 'No pasa nada, equivocarse es aprender. ¡Inténtalo otra vez!'],
};
const POSES = { 3: 'celebra', 2: 'anima', 1: 'saludo', 0: 'piensa' };
const elige = (a, sem) => a[sem % a.length];

function estrella(llena) {
  const s = h('span', { class: `res__estrella ${llena ? 'res__estrella--llena' : ''}`, 'aria-hidden': 'true' }, icono('star', { tam: 64 }));
  return s;
}

export function panelResultado({ titulo, subtitulo = '', estrellas = null, resultado, resumen, acciones = [], sinMensaje = false }) {
  const pose = estrellas == null ? 'celebra' : POSES[estrellas];
  const infantil = document.documentElement.dataset.estilo === 'ludico';
  const msg = estrellas == null ? '¡Buen trabajo! Cada práctica cuenta.' : elige(MENSAJES[estrellas], Math.round(resultado.ppm + resultado.precision));

  const fila = estrellas == null ? null : h('div', { class: 'res__estrellas', role: 'img', 'aria-label': `${estrellas} de 3 estrellas` },
    [1, 2, 3].map((i) => estrella(i <= estrellas)));

  const num = (valor, sufijo = '', dec = 0) => { const b = h('b', { dataset: { valor: 0 } }, '0'); setTimeout(() => contar(b, valor, { duracion: 900 }), 350); if (sufijo) b.dataset.sufijo = sufijo; return b; };
  const metrica = (etq, nodo, extra = '') => h('div', { class: `res__metrica ${extra}` }, nodo, h('small', {}, etq));
  const bPpm = num(resultado.ppm), bPre = num(resultado.precision);
  const mins = Math.floor(resultado.duracionSeg / 60), sg = resultado.duracionSeg % 60;
  const grid = h('div', { class: 'res__grid' },
    metrica('PPM', bPpm), metrica('Precisión %', bPre),
    metrica('Errores', h('b', {}, String(resultado.errores))), metrica('Tiempo', h('b', {}, `${mins}:${String(sg).padStart(2, '0')}`)));

  const cola = h('div', { class: 'res__cola' }, h('p', { class: 'suave pequeno' }, 'Guardando tu progreso…'));
  const zonaMedallas = h('div', { class: 'res__medallas' });

  const raiz = h('section', { class: 'res card card--vidrio', 'aria-live': 'polite' },
    h('div', { class: 'res__cab' },
      infantil ? h('div', { class: `res__amigo res__amigo--${estrellas == null ? 3 : estrellas}`, 'aria-hidden': 'true' }, personajeSVG(especieDe(state.user?.avatar), { acc: state.user?.avatar?.accesorios || [], tam: 150 })) : mascota(pose, { tam: 'md' }),
      h('div', {}, subtitulo ? h('span', { class: 'etiqueta' }, subtitulo) : null, h('h1', {}, titulo), sinMensaje ? null : h('p', { class: 'res__msg' }, msg))),
    fila, grid, cola, zonaMedallas,
    h('div', { class: 'res__acciones fila fila--envuelve' }, acciones.map((a) => h('button', { class: `btn ${a.clase || 'btn--suave'}`, type: 'button', onclick: a.onclick, autofocus: a.principal ? true : null }, a.icono ? icono(a.icono, { tam: 18 }) : null, a.texto))));

  // 2.º grado: la mascota en 3D baila y lanza confeti según las estrellas
  if (infantil && document.documentElement.dataset.grado === '2') {
    import('./escena3d.js').then(async (m) => {
      if (!m.soporta3D()) return;
      const e = await m.crear3D({ tipo: 'resultado', usuario: state.user, ancho: 230, alto: 250 });
      const slot = raiz.querySelector('.res__amigo');
      if (!e || !slot?.isConnected) { e?.destruir(); return; }
      const previos = [...slot.childNodes]; slot.classList.add('res__amigo--3d'); slot.replaceChildren(e.el); e.alLento = () => { slot.classList.remove('res__amigo--3d'); slot.replaceChildren(...previos); };
      setTimeout(() => e.reaccionar(estrellas == null || estrellas >= 3 ? 'baila' : estrellas === 2 ? 'gira' : estrellas === 1 ? 'salta' : 'ay'), 500);
    }).catch((er) => console.warn('[3d]', er));
  }

  // Estrellas una a una (con sonido) y confeti si hubo 3
  if (estrellas != null) {
    const nodos = [...raiz.querySelectorAll('.res__estrella--llena')];
    nodos.forEach((n, i) => { n.classList.add('res__estrella--oculta'); setTimeout(() => { n.classList.remove('res__estrella--oculta'); n.classList.add('res__estrella--pop'); sonido.estrella(i); }, 500 + i * 380); });
    if (estrellas === 3) setTimeout(() => confeti({ cantidad: infantil ? 220 : 130 }), 500 + 3 * 380);
    if (infantil && estrellas >= 1) { [1500, 2200].forEach((t, i) => setTimeout(() => { confeti({ cantidad: 70, duracion: 1800, origen: { x: innerWidth * (i ? 0.8 : 0.2), y: innerHeight * 0.3 } }); sonido.estrella(i + 3); }, t)); }
  } else if (resultado.precision >= 95) confeti({ cantidad: 60 });

  // Resumen asíncrono (XP, monedas, racha, medallas…)
  Promise.resolve(resumen).then((r) => {
    if (!r) { cola.replaceChildren(); return; }
    const lineas = r.desglose.map(([motivo, pts], i) => h('li', { style: { '--i': i } }, h('span', {}, motivo), h('b', {}, `+${pts}`)));
    const mejora = r.mejorAnterior ? resultado.ppm - r.mejorAnterior : null;
    cola.replaceChildren(...[
      h('div', { class: 'res__xp' },
        h('div', { class: 'res__xp-tit' }, icono('star', { tam: 22 }), h('strong', {}, `+${r.xp} XP`), r.monedas ? h('span', { class: 'res__moneda' }, icono('coin', { tam: 18 }), `+${r.monedas}`) : null),
        h('ul', { class: 'res__xp-lista' }, lineas)),
      h('div', { class: 'res__chips' },
        r.racha?.racha ? h('span', { class: 'chip chip--racha' }, icono('flame', { tam: 18 }), `Racha: ${r.racha.racha} ${r.racha.racha === 1 ? 'día' : 'días'}`) : null,
        r.esRecord && r.mejorAnterior ? h('span', { class: 'chip' }, icono('bolt', { tam: 18 }), '¡Nuevo récord personal!') : null,
        mejora != null && !r.esRecord ? h('span', { class: 'chip' }, `Tu mejor: ${r.mejorAnterior} PPM`) : null,
        r.racha?.usoProtector ? h('span', { class: 'chip' }, icono('shield', { tam: 18 }), 'Protector de racha usado') : null,
        r.enCola ? h('span', { class: 'chip' }, icono('info', { tam: 18 }), 'Sin internet: se sincronizará al reconectar') : null),
      r.subioNivel ? h('div', { class: 'res__nivel' }, icono('sparkle', { tam: 22 }), h('strong', {}, `¡Subiste al nivel ${r.nivel.nivel}: ${r.nivel.nombre}!`)) : null].filter(Boolean));
    if (r.subioNivel) { sonido.nivel(); confeti({ cantidad: 160 }); }
    if (r.insignias?.length) {
      zonaMedallas.replaceChildren(h('h2', { class: 'res__tit2' }, r.insignias.length > 1 ? '¡Nuevas medallas!' : '¡Nueva medalla!'),
        h('div', { class: 'res__medallas-fila' }, r.insignias.map((m) => h('figure', { class: 'res__medalla' }, medallaSVG({ nivel: m.nivel, icono: m.icono, tam: 84 }), h('figcaption', {}, h('strong', {}, m.nombre), h('small', {}, m.descripcion))))));
      setTimeout(() => { sonido.medalla(); confeti({ cantidad: 120 }); }, 900);
    }
  }).catch((e) => { console.warn(e); cola.replaceChildren(h('p', { class: 'mensaje-error' }, 'No se pudo guardar tu progreso. Revisa tu conexión: lo intentaremos de nuevo.')); });

  return raiz;
}
