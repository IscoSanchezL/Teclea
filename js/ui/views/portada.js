/**
 * Portada pública (antes de iniciar sesión): hero con mascota, teclas flotantes con
 * parallax, beneficios y vista previa de los 10 mundos.
 */
import { CONFIG } from '../../core/config.js';
import { h, movimientoReducido } from '../../core/utils.js';
import { icono } from '../icons.js';
import { mascota, ilustracion } from '../art.js';
import { cargarMundos } from '../mundos.js';

const TECLAS = [
  { t: 'A', dedo: 'menique', x: 6,  y: 58, prof: 18, r: -8 },
  { t: 'S', dedo: 'anular',  x: 20, y: 80, prof: 28, r: 6 },
  { t: 'D', dedo: 'medio',   x: 38, y: 90, prof: 12, r: -4 },
  { t: 'F', dedo: 'indice',  x: 56, y: 84, prof: 34, r: 8 },
  { t: 'J', dedo: 'indice',  x: 74, y: 70, prof: 22, r: -6 },
  { t: 'Ñ', dedo: 'menique', x: 88, y: 46, prof: 30, r: 7 },
  { t: 'ñ', dedo: 'medio',   x: 90, y: 14, prof: 16, r: -10 },
  { t: '¿', dedo: 'anular',  x: 4,  y: 20, prof: 26, r: 9 },
];

const BENEFICIOS = [
  { icono: 'keyboard', color: 'violeta', titulo: 'Aprende paso a paso', texto: 'Diez mundos que te enseñan postura, dedos y teclas sin prisa.' },
  { icono: 'trophy',   color: 'sol',     titulo: 'Gana medallas', texto: 'Suma puntos, mantén tu racha y colecciona logros brillantes.' },
  { icono: 'gamepad',  color: 'coral',   titulo: 'Juega mientras practicas', texto: 'Carreras, lluvia de palabras y retos que se mueven con tus dedos.' },
  { icono: 'users',    color: 'menta',   titulo: 'Tu profe te acompaña', texto: 'Tareas, metas por grado y avances que tu docente puede ver.' },
];

export async function render() {
  const mundos = await cargarMundos();

  const escena = h('div', { class: 'escena', 'aria-hidden': 'true' },
    h('div', { class: 'escena__halo' }),
    ...TECLAS.map((k, i) => h('span', {
      class: `tecla-deco dedo-${k.dedo}`, dataset: { prof: k.prof },
      style: { left: `${k.x}%`, top: `${k.y}%`, '--r': `${k.r}deg`, '--i': i },
    }, k.t)),
    h('div', { class: 'escena__mascota', dataset: { prof: 8 } }, mascota('saludo', { tam: 'xl' })));

  const hero = h('section', { class: 'hero', 'aria-labelledby': 'titulo-hero' },
    h('div', { class: 'hero__texto' },
      h('span', { class: 'etiqueta reveal', style: { '--i': 0 } }, icono('sparkle', { tam: 16 }), ' Para estudiantes de 2.º a 6.º'),
      h('h1', { id: 'titulo-hero', class: 'hero__titulo reveal', style: { '--i': 1 } },
        'Aprende a ', h('span', { class: 'texto-degradado' }, 'teclear'), ' jugando'),
      h('p', { class: 'hero__lema reveal', style: { '--i': 2 } },
        `${CONFIG.appName} es tu aventura para escribir rápido, sin mirar el teclado y sin errores. ¡Tecli, tu zorro guía, te espera!`),
      h('div', { class: 'hero__acciones reveal', style: { '--i': 3 } },
        h('a', { class: 'btn btn--primary btn--lg', href: '#/entrar' }, '¡Empezar a teclear!', icono('arrow', { tam: 22 })),
        h('a', { class: 'btn btn--suave btn--lg', href: '#/entrar?modo=codigo' }, 'Tengo un código de clase')),
      h('ul', { class: 'hero__datos reveal', style: { '--i': 4 } },
        h('li', {}, icono('check', { tam: 18 }), 'Teclado en español: ñ, tildes y ¿ ¡'),
        h('li', {}, icono('check', { tam: 18 }), 'Sin anuncios ni rastreadores'),
        h('li', {}, icono('check', { tam: 18 }), 'Se instala y funciona sin internet'))),
    escena);

  const beneficios = h('section', { class: 'beneficios', 'aria-label': 'Por qué te va a encantar' },
    BENEFICIOS.map((b, i) => h('article', { class: `card card--flota beneficio beneficio--${b.color} reveal`, style: { '--i': i } },
      h('span', { class: 'beneficio__icono' }, icono(b.icono, { tam: 28 })),
      h('h2', { class: 'beneficio__titulo' }, b.titulo),
      h('p', {}, b.texto))));

  const tira = h('section', { class: 'mundos-seccion', 'aria-labelledby': 'titulo-mundos' },
    h('div', { class: 'encabezado-seccion' },
      h('h2', { id: 'titulo-mundos' }, 'Un viaje por 10 mundos'),
      h('p', { class: 'suave' }, 'Cada mundo tiene lecciones, un repaso y un jefe final.')),
    h('ol', { class: 'mundos-tira' }, mundos.map((m) => h('li', { class: 'mundo-mini card' },
      h('span', { class: 'mundo-mini__ilus' }, ilustracion(`mundo-${m.id}-${m.clave}`, { emoji: m.emoji, gradiente: m.color, alt: '' })),
      h('span', { class: 'mundo-mini__num' }, `Mundo ${m.id}`),
      h('strong', {}, m.nombre)))));

  const cierre = h('section', { class: 'cta-final card' },
    h('div', {}, h('h2', {}, '¿Listo para tus primeras teclas?'), h('p', {}, 'Entra con tu cuenta de Google o con el código que te dio tu profe.')),
    h('a', { class: 'btn btn--sun btn--lg', href: '#/entrar' }, 'Entrar ahora', icono('arrow', { tam: 22 })));

  const pie = h('footer', { class: 'portada__pie' },
    h('p', {}, `© ${new Date().getFullYear()} ${CONFIG.colegio} · ${CONFIG.appName} v${CONFIG.version}`),
    h('p', {}, 'Hecho con cariño para niños y niñas que aprenden a teclear. ',
      h('a', { href: '#/privacidad' }, 'Aviso de privacidad (Ley 1581 de 2012)')));

  return h('div', { class: 'portada' }, hero, beneficios, tira, cierre, pie);
}

/** Parallax suave con el puntero (la suavidad la da la transición CSS de `translate`). */
let limpiar = null;
export function despues(raiz) {
  const escena = raiz.querySelector('.escena');
  if (!escena || movimientoReducido()) return;
  const capas = [...escena.querySelectorAll('[data-prof]')];
  const mover = (e) => {
    const r = escena.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
    capas.forEach((el) => {
      const p = Number(el.dataset.prof);
      // Se usa la propiedad `translate` (independiente de `transform`) para no chocar con las animaciones CSS.
      el.style.translate = `${-nx * p}px ${-ny * p}px`;
    });
  };
  window.addEventListener('pointermove', mover, { passive: true });
  limpiar = () => window.removeEventListener('pointermove', mover);
}
export function destroy() { limpiar?.(); limpiar = null; }
