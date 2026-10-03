/**
 * Inicio del estudiante. Tres presentaciones según el grado:
 *   ludico (2.º–3.º) y medio (4.º): mapa de aventura en zigzag con camino punteado.
 *   pro (5.º–6.º): panel de control con módulos en cuadrícula y estadísticas.
 * (El progreso real llega en la Fase 3: por ahora el mundo 1 está abierto y el resto bloqueado.)
 */
import { state } from '../../core/state.js';
import { h, movimientoReducido } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { nivelPorXP } from '../../core/levels.js';
import { perfilDeGrado } from '../../core/grados.js';
import { icono } from '../icons.js';
import { mascota, ilustracion } from '../art.js';
import { cargarMundos } from '../mundos.js';
import { anillo } from '../componentes.js';
import { toast } from '../overlay.js';

const SALUDOS = {
  ludico: (n) => `¡Hola, ${n}! 🎉 ¿Jugamos con las teclas?`,
  medio: (n) => `¡Qué bueno verte, ${n}!`,
  pro: (n) => `Buen día, ${n}. Tu entrenamiento está listo.`,
};
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MUNDO_ACTUAL = 1; // Fase 3: se calculará con el progreso real

function semanaRacha(racha) {
  const hoy = (new Date().getDay() + 6) % 7; // lunes = 0
  return DIAS.map((d, i) => h('li', {
    class: `semana__dia ${i <= hoy && i > hoy - racha ? 'semana__dia--on' : ''} ${i === hoy ? 'semana__dia--hoy' : ''}`,
    'aria-label': `${d}${i <= hoy && i > hoy - racha ? ': practicaste' : ''}`,
  }, h('span', {}, i <= hoy && i > hoy - racha ? icono('flame', { tam: 18 }) : ''), d));
}

function estadisticas(u, meta) {
  const tile = (clase, ...hijos) => h('article', { class: `tile ${clase}` }, ...hijos);
  return h('section', { class: 'tiles', 'aria-label': 'Tus estadísticas' },
    tile('tile--racha',
      h('span', { class: 'tile__tit' }, icono('flame', { tam: 20 }), 'Racha'),
      h('strong', { class: 'tile__num' }, u.racha || 0, h('small', {}, ' días')),
      h('ul', { class: 'semana' }, semanaRacha(u.racha || 0))),
    tile('tile--ppm',
      h('span', { class: 'tile__tit' }, 'Velocidad'),
      anillo({ valor: 0, tam: 92, grosor: 10, color: 'var(--menta-400)', etiqueta: 'Velocidad: sin datos todavía' },
        h('strong', { class: 'tile__medio' }, '—'), h('small', {}, 'PPM')),
      h('span', { class: 'suave tile__pie' }, `Meta ${meta.ppmMin}–${meta.ppmMax}`)),
    tile('tile--pre',
      h('span', { class: 'tile__tit' }, 'Precisión'),
      anillo({ valor: 0, tam: 92, grosor: 10, color: 'var(--sol-400)', etiqueta: 'Precisión: sin datos todavía' },
        h('strong', { class: 'tile__medio' }, '—'), h('small', {}, '%')),
      h('span', { class: 'suave tile__pie' }, `Meta ${meta.precision} %`)),
    tile('tile--min',
      h('span', { class: 'tile__tit' }, 'Hoy'),
      h('strong', { class: 'tile__num' }, '0', h('small', {}, ' min')),
      h('div', { class: 'mini-barra', role: 'img', 'aria-label': 'Progreso de la meta diaria: 0 de 5 minutos' }, h('i', { style: { '--p': 0 } })),
      h('span', { class: 'suave tile__pie' }, 'Meta: 5 min')));
}

function mapaZigzag(mundos) {
  return h('ol', { class: 'mapa', 'aria-label': 'Mapa de mundos' }, mundos.map((m, i) => {
    const estadoNodo = m.id === MUNDO_ACTUAL ? 'actual' : m.id < MUNDO_ACTUAL ? 'completado' : 'bloqueado';
    const nodo = h('button', {
      class: `nodo nodo--${estadoNodo}`, type: 'button',
      style: { '--g1': m.color[0], '--g2': m.color[1] },
      'aria-disabled': estadoNodo === 'bloqueado' ? 'true' : null,
      'aria-label': `Mundo ${m.id}: ${m.nombre}. ${estadoNodo === 'bloqueado' ? 'Bloqueado' : estadoNodo === 'actual' ? 'Tu mundo actual' : 'Completado'}`,
      onclick: () => (estadoNodo === 'bloqueado'
        ? toast('¡Aún no! Completa el mundo anterior para abrirlo. 🔒', { tipo: 'info' })
        : navegar('/aprende')),
    }, ilustracion(`mundo-${m.id}-${m.clave}`, { emoji: m.emoji, gradiente: m.color, clase: 'nodo__ilus' }),
       estadoNodo === 'bloqueado' ? h('span', { class: 'nodo__candado' }, icono('lock', { tam: 18 })) : null,
       estadoNodo === 'completado' ? h('span', { class: 'nodo__check' }, icono('check', { tam: 18 })) : null);
    return h('li', { class: 'mapa__paso', style: { '--s': Math.sin(i * 1.05).toFixed(2) } },
      estadoNodo === 'actual' ? h('div', { class: 'mapa__guia' }, mascota('senala', { tam: 'sm' }), h('span', { class: 'burbuja burbuja--corta' }, '¡Aquí estás!')) : null,
      nodo,
      h('div', { class: 'mapa__texto' }, h('span', { class: 'mapa__num suave' }, `Mundo ${m.id}`), h('strong', {}, m.nombre), h('span', { class: 'suave' }, m.descripcion)));
  }));
}

function modulosPro(mundos) {
  return h('ol', { class: 'modulos', 'aria-label': 'Módulos de entrenamiento' }, mundos.map((m) => {
    const actual = m.id === MUNDO_ACTUAL, bloqueado = m.id > MUNDO_ACTUAL;
    return h('li', {},
      h('button', {
        class: `modulo ${actual ? 'modulo--actual' : ''} ${bloqueado ? 'modulo--bloqueado' : ''}`, type: 'button',
        style: { '--g1': m.color[0], '--g2': m.color[1] },
        'aria-disabled': bloqueado ? 'true' : null,
        onclick: () => (bloqueado ? toast('Módulo bloqueado: completa el anterior.', { tipo: 'info' }) : navegar('/aprende')),
      },
        h('span', { class: 'modulo__cab' },
          h('span', { class: 'modulo__num' }, String(m.id).padStart(2, '0')),
          h('span', { class: 'modulo__ilus' }, ilustracion(`mundo-${m.id}-${m.clave}`, { emoji: m.emoji, gradiente: m.color })),
          bloqueado ? icono('lock', { tam: 18 }) : null),
        h('strong', { class: 'modulo__nombre' }, m.nombre),
        h('span', { class: 'modulo__desc suave' }, m.descripcion),
        h('span', { class: 'modulo__pie' },
          h('span', { class: 'mini-barra' }, h('i', { style: { '--p': 0 } })),
          h('span', { class: 'modulo__estado' }, actual ? 'EN CURSO' : bloqueado ? 'BLOQUEADO' : 'LISTO'))));
  }));
}

export async function render() {
  const u = state.user;
  const mundos = await cargarMundos();
  const estilo = document.documentElement.dataset.estilo || 'medio';
  const nivel = nivelPorXP(u.xp);
  const meta = perfilDeGrado(u.grado || 3);

  const anilloNivel = anillo({ valor: nivel.progreso, tam: 168, grosor: 14, color: 'var(--sol-400)', etiqueta: `Nivel ${nivel.nivel}, ${Math.round(nivel.progreso * 100)} % hacia el siguiente` },
    mascota('anima', { tam: 'md', animada: true }));

  const hero = h('section', { class: 'card card--hero inicio__hero', 'data-tilt': '' },
    h('div', { class: 'inicio__hero-texto' },
      h('span', { class: 'etiqueta' }, `Nivel ${nivel.nivel} · ${nivel.nombre}`),
      h('h1', {}, (SALUDOS[estilo] || SALUDOS.medio)(u.apodo)),
      h('p', {}, 'Tu siguiente aventura: ', h('strong', {}, `Mundo ${MUNDO_ACTUAL} · ${mundos[0].nombre}`)),
      h('p', { class: 'suave' }, nivel.siguiente ? `${nivel.siguiente.xp - u.xp} XP para “${nivel.siguiente.nombre}”` : '¡Nivel máximo!'),
      h('a', { class: 'btn btn--sun btn--lg', href: '#/aprende' }, icono('play', { tam: 20 }), 'Continuar aventura')),
    h('div', { class: 'inicio__hero-anillo' }, anilloNivel));

  const coach = h('section', { class: 'card coach', 'aria-label': 'Entrenador de Tecli' },
    h('header', { class: 'coach__cab' }, h('span', { class: 'coach__ic' }, icono('sparkle', { tam: 22 })),
      h('div', {}, h('strong', {}, 'Entrenador de Tecli'), h('small', {}, 'Tu plan de hoy'))),
    h('p', { class: 'coach__texto', 'aria-live': 'polite' }),
    h('ol', { class: 'coach__plan' }, ['Calentamiento: fila base (2 min)', 'Práctica guiada del mundo actual (5 min)', 'Reto relámpago de precisión (1 min)'].map((t) => h('li', {}, t))),
    h('a', { class: 'btn btn--primary btn--sm', href: '#/aprende' }, 'Empezar mi plan'));
  coach.dataset.mensaje = `Cuando termines tus primeras prácticas, aquí te diré qué teclas reforzar. Hoy empezamos por la fila base, ${u.apodo}.`;

  const retos = h('section', { class: 'card' },
    h('h2', { class: 'seccion__titulo' }, 'Retos de hoy'),
    h('ul', { class: 'retos' },
      [['Practica 5 minutos', '🎯'], ['Consigue 90 % de precisión', '✅'], ['Mantén tu racha', '🔥']].map(([t, e]) =>
        h('li', { class: 'reto' }, h('span', { class: 'reto__emoji', 'aria-hidden': 'true' }, e), h('span', {}, t), h('span', { class: 'reto__estado suave' }, '0 / 1')))),
    h('p', { class: 'suave pequeno' }, 'Los retos se activan en la Fase 4.'));

  const comparar = h('section', { class: 'card' },
    h('h2', { class: 'seccion__titulo' }, 'Hoy vs. mi mejor marca'),
    h('div', { class: 'comparacion' },
      h('div', {}, h('span', { class: 'suave' }, 'Hoy'), h('strong', { class: 'comparacion__num' }, '— PPM')),
      h('div', {}, h('span', { class: 'suave' }, 'Mi mejor'), h('strong', { class: 'comparacion__num' }, '— PPM'))),
    h('p', { class: 'suave pequeno' }, `Meta de ${u.grado || 3}.º: ${meta.ppmMin}–${meta.ppmMax} PPM · ${meta.precision} % de precisión.`));

  const principal = estilo === 'pro'
    ? h('section', { 'aria-labelledby': 'titulo-mapa' },
        h('h2', { id: 'titulo-mapa', class: 'titulo-mapa' }, 'Módulos de entrenamiento'), modulosPro(mundos))
    : h('section', { 'aria-labelledby': 'titulo-mapa' },
        h('h2', { id: 'titulo-mapa', class: 'titulo-mapa' }, 'Mapa de aventura'), mapaZigzag(mundos));

  return h('div', { class: `inicio inicio--${estilo}` },
    hero,
    estadisticas(u, meta),
    h('div', { class: 'inicio__cuerpo' },
      principal,
      h('aside', { class: 'inicio__lateral', 'aria-label': 'Resumen' }, coach, retos, comparar)));
}

/* ── Camino punteado que une los nodos (solo en el mapa en zigzag) ── */
let observador = null;
const SVG = 'http://www.w3.org/2000/svg';

let tecleo = null;
function escribirCoach(raiz) {
  const caja = raiz.querySelector('.coach'), p = raiz.querySelector('.coach__texto');
  if (!caja || !p) return;
  const msg = caja.dataset.mensaje;
  if (movimientoReducido()) { p.textContent = msg; return; }
  let i = 0;
  tecleo = setInterval(() => { p.textContent = msg.slice(0, ++i); if (i >= msg.length) clearInterval(tecleo); }, 28);
}

export function despues(raiz) {
  escribirCoach(raiz);
  const mapa = raiz.querySelector('.mapa');
  if (!mapa) return;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'mapa__camino');
  svg.setAttribute('aria-hidden', 'true');
  const base = document.createElementNS(SVG, 'path'); base.setAttribute('class', 'camino-base');
  const hecho = document.createElementNS(SVG, 'path'); hecho.setAttribute('class', 'camino-hecho');
  svg.append(base, hecho);
  mapa.prepend(svg);

  const trazo = (puntos) => puntos.map((p, i) => {
    if (!i) return `M ${p.x} ${p.y}`;
    const q = puntos[i - 1], m = (q.y + p.y) / 2;
    return `C ${q.x} ${m}, ${p.x} ${m}, ${p.x} ${p.y}`;
  }).join(' ');

  const dibujar = () => {
    const caja = mapa.getBoundingClientRect();
    const nodos = [...mapa.querySelectorAll('.nodo')];
    const pts = nodos.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.left - caja.left + r.width / 2, y: r.top - caja.top + r.height / 2 };
    });
    const idxActual = nodos.findIndex((n) => n.classList.contains('nodo--actual'));
    base.setAttribute('d', trazo(pts));
    hecho.setAttribute('d', idxActual > 0 ? trazo(pts.slice(0, idxActual + 1)) : '');
  };
  dibujar();
  observador = new ResizeObserver(dibujar);
  observador.observe(mapa);
}

export function destroy() { observador?.disconnect(); observador = null; clearInterval(tecleo); }
