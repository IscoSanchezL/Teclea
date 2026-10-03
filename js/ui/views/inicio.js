/**
 * Inicio del estudiante. Tres presentaciones según el grado:
 *   ludico (2.º–3.º) y medio (4.º): mapa de aventura en zigzag con camino punteado.
 *   pro (5.º–6.º): panel de control con módulos en cuadrícula y estadísticas.
 * (El progreso real llega en la Fase 3: por ahora el mundo 1 está abierto y el resto bloqueado.)
 */
import { opcionesRapidas } from '../../db/clases.js';
import { tarjetaRetos } from '../retos-ui.js';
import { state } from '../../core/state.js';
import { h, movimientoReducido } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { nivelPorXP } from '../../core/levels.js';
import { perfilDeGrado } from '../../core/grados.js';
import { icono } from '../icons.js';
import { mascota, ilustracion } from '../art.js';
import { cargarMundos } from '../mundos.js';
import { cargarIndice, estadoLecciones, resumenMundo } from '../../lessons/curriculo.js';
import { cargarProgreso, resumenHoy } from '../../db/progreso.js';
import { anillo } from '../componentes.js';
import { toast } from '../overlay.js';

const SALUDOS = {
  ludico: (n) => `¡Hola, ${n}! 🎉 ¿Jugamos con las teclas?`,
  medio: (n) => `¡Qué bueno verte, ${n}!`,
  pro: (n) => `Buen día, ${n}. Tu entrenamiento está listo.`,
};
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function semanaRacha(racha) {
  const hoy = (new Date().getDay() + 6) % 7; // lunes = 0
  return DIAS.map((d, i) => h('li', {
    class: `semana__dia ${i <= hoy && i > hoy - racha ? 'semana__dia--on' : ''} ${i === hoy ? 'semana__dia--hoy' : ''}`,
    'aria-label': `${d}${i <= hoy && i > hoy - racha ? ': practicaste' : ''}`,
  }, h('span', {}, i <= hoy && i > hoy - racha ? icono('flame', { tam: 18 }) : ''), d));
}

function estadisticas(u, meta, d) {
  const tile = (clase, ...hijos) => h('article', { class: `tile ${clase}` }, ...hijos);
  return h('section', { class: 'tiles', 'aria-label': 'Tus estadísticas' },
    tile('tile--racha',
      h('span', { class: 'tile__tit' }, icono('flame', { tam: 20 }), 'Racha'),
      h('strong', { class: 'tile__num' }, u.racha || 0, h('small', {}, ' días')),
      h('ul', { class: 'semana' }, semanaRacha(u.racha || 0))),
    tile('tile--ppm',
      h('span', { class: 'tile__tit' }, 'Velocidad'),
      anillo({ valor: Math.min(1, (d.mejorPpm || 0) / meta.ppmMax), tam: 92, grosor: 10, color: 'var(--menta-400)', etiqueta: d.mejorPpm ? `Mejor velocidad de hoy: ${d.mejorPpm} PPM` : 'Velocidad: sin práctica hoy' },
        h('strong', { class: 'tile__medio' }, d.mejorPpm ? String(Math.round(d.mejorPpm)) : '—'), h('small', {}, 'PPM')),
      h('span', { class: 'suave tile__pie' }, `Meta ${meta.ppmMin}–${meta.ppmMax}`)),
    tile('tile--pre',
      h('span', { class: 'tile__tit' }, 'Precisión'),
      anillo({ valor: Math.min(1, (d.precision || 0) / 100), tam: 92, grosor: 10, color: 'var(--sol-400)', etiqueta: d.precision ? `Precisión de hoy: ${d.precision} %` : 'Precisión: sin práctica hoy' },
        h('strong', { class: 'tile__medio' }, d.precision ? String(d.precision) : '—'), h('small', {}, '%')),
      h('span', { class: 'suave tile__pie' }, `Meta ${meta.precision} %`)),
    tile('tile--min',
      h('span', { class: 'tile__tit' }, 'Hoy'),
      h('strong', { class: 'tile__num' }, String(Math.round(d.minutos || 0)), h('small', {}, ' min')),
      h('div', { class: 'mini-barra', role: 'img', 'aria-label': `Meta diaria: ${Math.round(d.minutos || 0)} de 5 minutos` }, h('i', { style: { '--p': Math.min(1, (d.minutos || 0) / 5) } })),
      h('span', { class: 'suave tile__pie' }, 'Meta: 5 min')));
}

function estadoMundo(indice, estados, progreso, id) {
  const r = resumenMundo(indice, progreso, id);
  const primera = indice.find((l) => l.mundo === id);
  if (r.completo) return { estado: 'completado', r };
  if (estados[primera.id] === 'bloqueada') return { estado: 'bloqueado', r };
  return { estado: indice.some((l) => l.mundo === id && estados[l.id] === 'actual') ? 'actual' : 'completado', r };
}

function mapaZigzag(mundos, indice, estados, progreso) {
  return h('ol', { class: 'mapa', 'aria-label': 'Mapa de mundos' }, mundos.map((m, i) => {
    const { estado: estadoNodo, r } = estadoMundo(indice, estados, progreso, m.id);
    const nodo = h('button', {
      class: `nodo nodo--${estadoNodo}`, type: 'button',
      style: { '--g1': m.color[0], '--g2': m.color[1] },
      'aria-disabled': estadoNodo === 'bloqueado' ? 'true' : null,
      'aria-label': `Mundo ${m.id}: ${m.nombre}. ${estadoNodo === 'bloqueado' ? 'Bloqueado' : estadoNodo === 'actual' ? 'Tu mundo actual' : 'Completado'}. ${r.hechas} de ${r.total} lecciones`,
      onclick: () => (estadoNodo === 'bloqueado'
        ? toast('¡Aún no! Completa el mundo anterior para abrirlo. 🔒', { tipo: 'info' })
        : navegar(`/aprende?mundo=${m.id}`)),
    }, ilustracion(`mundo-${m.id}-${m.clave}`, { emoji: m.emoji, gradiente: m.color, clase: 'nodo__ilus' }),
       estadoNodo === 'bloqueado' ? h('span', { class: 'nodo__candado' }, icono('lock', { tam: 18 })) : null,
       estadoNodo === 'completado' ? h('span', { class: 'nodo__check' }, icono('check', { tam: 18 })) : null);
    return h('li', { class: 'mapa__paso', style: { '--s': Math.sin(i * 1.05).toFixed(2) } },
      estadoNodo === 'actual' ? h('div', { class: 'mapa__guia' }, mascota('senala', { tam: 'sm' }), h('span', { class: 'burbuja burbuja--corta' }, '¡Aquí estás!')) : null,
      nodo,
      h('div', { class: 'mapa__texto' }, h('span', { class: 'mapa__num suave' }, `Mundo ${m.id} · ${r.hechas}/${r.total}`), h('strong', {}, m.nombre), h('span', { class: 'suave' }, m.descripcion)));
  }));
}

function modulosPro(mundos, indice, estados, progreso) {
  return h('ol', { class: 'modulos', 'aria-label': 'Módulos de entrenamiento' }, mundos.map((m) => {
    const { estado, r } = estadoMundo(indice, estados, progreso, m.id);
    const actual = estado === 'actual', bloqueado = estado === 'bloqueado';
    return h('li', {},
      h('button', {
        class: `modulo ${actual ? 'modulo--actual' : ''} ${bloqueado ? 'modulo--bloqueado' : ''}`, type: 'button',
        style: { '--g1': m.color[0], '--g2': m.color[1] },
        'aria-disabled': bloqueado ? 'true' : null,
        onclick: () => (bloqueado ? toast('Módulo bloqueado: completa el anterior.', { tipo: 'info' }) : navegar(`/aprende?mundo=${m.id}`)),
      },
        h('span', { class: 'modulo__cab' },
          h('span', { class: 'modulo__num' }, String(m.id).padStart(2, '0')),
          h('span', { class: 'modulo__ilus' }, ilustracion(`mundo-${m.id}-${m.clave}`, { emoji: m.emoji, gradiente: m.color })),
          bloqueado ? icono('lock', { tam: 18 }) : null),
        h('strong', { class: 'modulo__nombre' }, m.nombre),
        h('span', { class: 'modulo__desc suave' }, m.descripcion),
        h('span', { class: 'modulo__pie' },
          h('span', { class: 'mini-barra' }, h('i', { style: { '--p': r.hechas / r.total } })),
          h('span', { class: 'modulo__estado' }, `${r.hechas}/${r.total} · ${actual ? 'EN CURSO' : bloqueado ? 'BLOQUEADO' : 'COMPLETO'}`))));
  }));
}

export async function render() {
  const u = state.user;
  const [mundos, indice, progreso, hoy, opciones] = await Promise.all([cargarMundos(), cargarIndice(), cargarProgreso(u.uid), resumenHoy(u.uid).catch(() => ({})), opcionesRapidas(state.user)]);
  const estados = estadoLecciones(indice, progreso, opciones);
  const siguiente = indice.find((l) => estados[l.id] === 'actual');
  const mejorGlobal = Object.values(progreso).reduce((m, x) => Math.max(m, x.mejorWpm || 0), 0);
  const hechas = indice.filter((l) => (progreso[l.id]?.estrellas || 0) >= 1).length;
  const estilo = document.documentElement.dataset.estilo || 'medio';
  const nivel = nivelPorXP(u.xp);
  const meta = perfilDeGrado(u.grado || 3);

  const anilloNivel = anillo({ valor: nivel.progreso, tam: 168, grosor: 14, color: 'var(--sol-400)', etiqueta: `Nivel ${nivel.nivel}, ${Math.round(nivel.progreso * 100)} % hacia el siguiente` },
    mascota('anima', { tam: 'md', animada: true }));

  const hero = h('section', { class: 'card card--hero inicio__hero', 'data-tilt': '' },
    h('div', { class: 'inicio__hero-texto' },
      h('span', { class: 'etiqueta' }, `Nivel ${nivel.nivel} · ${nivel.nombre}`),
      h('h1', {}, (SALUDOS[estilo] || SALUDOS.medio)(u.apodo)),
      h('p', {}, siguiente ? 'Tu siguiente lección: ' : '¡Completaste el curso! ', siguiente ? h('strong', {}, `Mundo ${siguiente.mundo} · ${siguiente.titulo}`) : null),
      h('p', { class: 'suave' }, nivel.siguiente ? `${nivel.siguiente.xp - u.xp} XP para “${nivel.siguiente.nombre}”` : '¡Nivel máximo!'),
      h('a', { class: 'btn btn--sun btn--lg', href: siguiente ? `#/leccion?id=${siguiente.id}` : '#/practica' }, icono('play', { tam: 20 }), hechas ? 'Continuar aventura' : 'Empezar mi primera lección')),
    h('div', { class: 'inicio__hero-anillo' }, anilloNivel));

  const coach = h('section', { class: 'card coach', 'aria-label': 'Entrenador de Tecli' },
    h('header', { class: 'coach__cab' }, h('span', { class: 'coach__ic' }, icono('sparkle', { tam: 22 })),
      h('div', {}, h('strong', {}, 'Entrenador de Tecli'), h('small', {}, 'Tu plan de hoy'))),
    h('p', { class: 'coach__texto', 'aria-live': 'polite' }),
    h('ol', { class: 'coach__plan' }, ['Calentamiento: fila base (2 min)', 'Práctica guiada del mundo actual (5 min)', 'Reto relámpago de precisión (1 min)'].map((t) => h('li', {}, t))),
    h('a', { class: 'btn btn--primary btn--sm', href: '#/aprende' }, 'Empezar mi plan'));
  coach.dataset.mensaje = `Cuando termines tus primeras prácticas, aquí te diré qué teclas reforzar. Hoy empezamos por la fila base, ${u.apodo}.`;

  const retos = await tarjetaRetos({ hoy });

  const comparar = h('section', { class: 'card' },
    h('h2', { class: 'seccion__titulo' }, 'Hoy vs. mi mejor marca'),
    h('div', { class: 'comparacion' },
      h('div', {}, h('span', { class: 'suave' }, 'Hoy'), h('strong', { class: 'comparacion__num' }, hoy.mejorPpm ? `${Math.round(hoy.mejorPpm)} PPM` : '— PPM')),
      h('div', {}, h('span', { class: 'suave' }, 'Mi mejor'), h('strong', { class: 'comparacion__num' }, mejorGlobal ? `${Math.round(mejorGlobal)} PPM` : '— PPM'))),
    h('p', { class: 'suave pequeno' }, `Meta de ${u.grado || 3}.º: ${meta.ppmMin}–${meta.ppmMax} PPM · ${meta.precision} % de precisión.`));

  const principal = estilo === 'pro'
    ? h('section', { 'aria-labelledby': 'titulo-mapa' },
        h('h2', { id: 'titulo-mapa', class: 'titulo-mapa' }, 'Módulos de entrenamiento'), modulosPro(mundos, indice, estados, progreso))
    : h('section', { 'aria-labelledby': 'titulo-mapa' },
        h('h2', { id: 'titulo-mapa', class: 'titulo-mapa' }, 'Mapa de aventura'), mapaZigzag(mundos, indice, estados, progreso));

  return h('div', { class: `inicio inicio--${estilo}` },
    hero,
    estadisticas(u, meta, hoy),
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
