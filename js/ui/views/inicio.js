/**
 * Inicio del estudiante / Mapa de aventura: camino de mundos con el siguiente nodo latiendo.
 * (El progreso real de lecciones llega en la Fase 3; aquí el mundo 1 está abierto y el resto bloqueado.)
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { nivelPorXP } from '../../core/levels.js';
import { perfilDeGrado } from '../../core/grados.js';
import { icono } from '../icons.js';
import { mascota, ilustracion } from '../art.js';
import { cargarMundos } from '../mundos.js';
import { toast } from '../overlay.js';

const SALUDOS = {
  ludico: (n) => `¡Hola, ${n}! 🎉 ¿Jugamos con las teclas?`,
  medio: (n) => `¡Qué bueno verte, ${n}!`,
  pro: (n) => `Buen día, ${n}. Tu entrenamiento está listo.`,
};

export async function render() {
  const u = state.user;
  const mundos = await cargarMundos();
  const estilo = document.documentElement.dataset.estilo || 'medio';
  const nivel = nivelPorXP(u.xp);
  const meta = perfilDeGrado(u.grado || 3);
  const mundoActual = 1; // Fase 3: se calculará con el progreso real

  // ── Tarjeta principal ──
  const hero = h('section', { class: 'card card--hero inicio__hero' },
    h('div', { class: 'inicio__hero-texto' },
      h('h1', {}, (SALUDOS[estilo] || SALUDOS.medio)(u.apodo)),
      h('p', {}, 'Tu siguiente aventura: ', h('strong', {}, `Mundo ${mundoActual} · ${mundos[0].nombre}`)),
      h('div', { class: 'nivel-barra', role: 'img', 'aria-label': `Progreso hacia el siguiente nivel: ${Math.round(nivel.progreso * 100)}%` },
        h('div', { class: 'nivel-barra__relleno', style: { '--p': nivel.progreso } })),
      h('p', { class: 'suave' }, nivel.siguiente ? `${nivel.siguiente.xp - u.xp} XP para “${nivel.siguiente.nombre}”` : '¡Nivel máximo!'),
      h('a', { class: 'btn btn--sun btn--lg', href: '#/aprende' }, icono('play', { tam: 20 }), 'Continuar aventura')),
    mascota('anima', { tam: 'lg' }));

  // ── Mapa ──
  const mapa = h('ol', { class: 'mapa', 'aria-label': 'Mapa de mundos' },
    mundos.map((m, i) => {
      const estado = m.id === mundoActual ? 'actual' : m.id < mundoActual ? 'completado' : 'bloqueado';
      const lado = i % 2 === 0 ? 'izq' : 'der';
      const nodo = h('button', {
        class: `nodo nodo--${estado}`, type: 'button',
        style: { '--g1': m.color[0], '--g2': m.color[1] },
        'aria-disabled': estado === 'bloqueado' ? 'true' : null,
        'aria-label': `Mundo ${m.id}: ${m.nombre}. ${estado === 'bloqueado' ? 'Bloqueado' : estado === 'actual' ? 'Tu mundo actual' : 'Completado'}`,
        onclick: () => {
          if (estado === 'bloqueado') return toast('¡Aún no! Completa el mundo anterior para abrirlo. 🔒', { tipo: 'info' });
          navegar('/aprende');
        },
      }, ilustracion(`mundo-${m.id}-${m.clave}`, { emoji: m.emoji, gradiente: m.color, clase: 'nodo__ilus' }),
         estado === 'bloqueado' ? h('span', { class: 'nodo__candado' }, icono('lock', { tam: 18 })) : null,
         estado === 'completado' ? h('span', { class: 'nodo__check' }, icono('check', { tam: 18 })) : null);
      return h('li', { class: `mapa__paso mapa__paso--${lado}`, style: { '--s': Math.sin(i * 1.05).toFixed(2) } },
        estado === 'actual' ? h('div', { class: 'mapa__guia' }, mascota('senala', { tam: 'sm' }), h('span', { class: 'burbuja burbuja--corta' }, '¡Aquí estás!')) : null,
        nodo,
        h('div', { class: 'mapa__texto' }, h('span', { class: 'mapa__num suave' }, `Mundo ${m.id}`), h('strong', {}, m.nombre), h('span', { class: 'suave' }, m.descripcion)));
    }));

  // ── Columna lateral ──
  const retos = h('section', { class: 'card' },
    h('h2', { class: 'seccion__titulo' }, 'Retos de hoy'),
    h('ul', { class: 'retos' },
      [['Practica 5 minutos', '🎯'], ['Consigue 90 % de precisión', '✅'], ['Mantén tu racha', '🔥']].map(([t, e]) =>
        h('li', { class: 'reto' }, h('span', { class: 'reto__emoji', 'aria-hidden': 'true' }, e), h('span', {}, t), h('span', { class: 'reto__estado suave' }, '0 / 1')))),
    h('p', { class: 'suave pequeno' }, 'Los retos se activan en la Fase 4.'));

  const marca = h('section', { class: 'card' },
    h('h2', { class: 'seccion__titulo' }, 'Hoy vs. mi mejor marca'),
    h('div', { class: 'comparacion' },
      h('div', {}, h('span', { class: 'suave' }, 'Hoy'), h('strong', { class: 'comparacion__num' }, '— PPM')),
      h('div', {}, h('span', { class: 'suave' }, 'Mi mejor'), h('strong', { class: 'comparacion__num' }, '— PPM'))),
    h('p', { class: 'suave pequeno' }, `Meta de ${u.grado || 3}.º: ${meta.ppmMin}–${meta.ppmMax} PPM · ${meta.precision} % de precisión.`));

  return h('div', { class: 'inicio' },
    hero,
    h('div', { class: 'inicio__cuerpo' },
      h('section', { 'aria-labelledby': 'titulo-mapa' }, h('h2', { id: 'titulo-mapa', class: 'titulo-mapa' }, 'Mapa de aventura'), mapa),
      h('aside', { class: 'inicio__lateral', 'aria-label': 'Resumen' }, retos, marca)));
}

/* ── Camino punteado que une los nodos (se recalcula si cambia el tamaño) ── */
let observador = null;
const SVG = 'http://www.w3.org/2000/svg';

export function despues(raiz) {
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

export function destroy() { observador?.disconnect(); observador = null; }
