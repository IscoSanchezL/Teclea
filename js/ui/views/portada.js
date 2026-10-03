/**
 * Portada pública: hero, demostración de tecleo en vivo con teclado por dedos,
 * pasos, "hecho para cada grado" y vista previa de los 10 mundos.
 */
import { CONFIG } from '../../core/config.js';
import { PERFILES_GRADO } from '../../core/grados.js';
import { h, movimientoReducido } from '../../core/utils.js';
import { icono } from '../icons.js';
import { mascota, ilustracion } from '../art.js';
import { cargarMundos } from '../mundos.js';
import { tecladoDeco } from '../teclado-deco.js';

const TECLAS = [
  { t: 'A', dedo: 'menique', x: 4,  y: 56, prof: 18, r: -8 },
  { t: 'S', dedo: 'anular',  x: 18, y: 80, prof: 28, r: 6 },
  { t: 'D', dedo: 'medio',   x: 38, y: 91, prof: 12, r: -4 },
  { t: 'F', dedo: 'indice',  x: 58, y: 85, prof: 34, r: 8 },
  { t: 'J', dedo: 'indice',  x: 76, y: 70, prof: 22, r: -6 },
  { t: 'Ñ', dedo: 'menique', x: 88, y: 46, prof: 30, r: 7 },
  { t: 'ñ', dedo: 'medio',   x: 90, y: 12, prof: 16, r: -10 },
  { t: '¿', dedo: 'anular',  x: 3,  y: 18, prof: 26, r: 9 },
];

const FRASES = ['¡Hola, soy Tecli!', 'Aprende a teclear jugando', 'El ñandú canta una canción', '¿Listo para ganar medallas?'];

const PASOS = [
  { n: 1, emoji: '🎒', titulo: 'Elige tu grado', texto: 'La plataforma cambia de look y de dificultad para que sea justo para ti.' },
  { n: 2, emoji: '⌨️', titulo: 'Aprende y juega', texto: 'Lecciones cortas con Tecli, ejercicios guiados y minijuegos.' },
  { n: 3, emoji: '🏅', titulo: 'Gana medallas', texto: 'Sube de nivel, cuida tu racha y consigue certificados.' },
];

const ESTILOS_GRADO = [
  { clave: 'ludico', grados: [2, 3], titulo: '2.º y 3.º', lema: 'Cielo, nubes y pegatinas', texto: 'Letras grandes, colores a todo volumen y mucha ayuda de Tecli.' },
  { clave: 'medio', grados: [4], titulo: '4.º', lema: 'Aventura suave', texto: 'Mundos con paisajes, retos nuevos y párrafos cortos con tildes.' },
  { clave: 'pro', grados: [5, 6], titulo: '5.º y 6.º', lema: 'Modo pro', texto: 'Panel de control con estadísticas, retos de velocidad y textos reales.' },
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

  // ── Demostración en vivo ──
  const kb = tecladoDeco();
  const texto = h('span', { class: 'demo-pantalla__texto' });
  const demo = h('section', { class: 'demo-teclas', 'aria-labelledby': 'titulo-demo' },
    h('div', { class: 'encabezado-seccion encabezado-seccion--centro' },
      h('h2', { id: 'titulo-demo' }, 'Cada dedo tiene su color'),
      h('p', { class: 'suave' }, 'Mira cómo se teclea: cada tecla se escribe con el dedo de su mismo color.')),
    h('div', { class: 'demo-pantalla card', 'data-tilt': '' },
      h('div', { class: 'demo-pantalla__barra', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('span', {}, 'mi-primera-leccion')),
      h('p', { class: 'demo-pantalla__linea', 'aria-label': FRASES[1] }, texto, h('span', { class: 'demo-pantalla__cursor', 'aria-hidden': 'true' })),
      kb.el,
      h('ul', { class: 'leyenda-dedos', 'aria-label': 'Colores por dedo' },
        [['menique', 'Meñique'], ['anular', 'Anular'], ['medio', 'Medio'], ['indice', 'Índice'], ['pulgar', 'Pulgar']].map(([d, n]) =>
          h('li', {}, h('i', { class: `dedo-${d}` }), n)))));
  estado.kb = kb; estado.texto = texto;

  // ── Cómo funciona ──
  const pasos = h('section', { class: 'pasos', 'aria-labelledby': 'titulo-pasos' },
    h('div', { class: 'encabezado-seccion encabezado-seccion--centro' }, h('h2', { id: 'titulo-pasos' }, 'Así de fácil')),
    h('ol', { class: 'pasos__lista' }, PASOS.map((p, i) => h('li', { class: 'paso card card--flota reveal', style: { '--i': i } },
      h('span', { class: 'paso__num' }, p.n),
      h('span', { class: 'paso__emoji', 'aria-hidden': 'true' }, p.emoji),
      h('h3', {}, p.titulo), h('p', { class: 'suave' }, p.texto)))));

  // ── Hecho para cada grado ──
  const grados = h('section', { class: 'grados', 'aria-labelledby': 'titulo-grados' },
    h('div', { class: 'encabezado-seccion encabezado-seccion--centro' },
      h('h2', { id: 'titulo-grados' }, 'Una plataforma, tres looks'),
      h('p', { class: 'suave' }, 'La apariencia y la dificultad se adaptan al grado de cada estudiante.')),
    h('div', { class: 'grados__rejilla' }, ESTILOS_GRADO.map((e) => {
      const p = PERFILES_GRADO[e.grados[0]], q = PERFILES_GRADO[e.grados[e.grados.length - 1]];
      return h('article', { class: `grado-card grado-card--${e.clave}` },
        h('div', { class: 'grado-card__vista', 'aria-hidden': 'true' },
          h('span', { class: 'grado-card__tecla' }, e.clave === 'pro' ? '</>' : e.clave === 'ludico' ? 'Aa' : 'Ñ'),
          h('span', { class: 'grado-card__barra' }), h('span', { class: 'grado-card__barra grado-card__barra--corta' })),
        h('span', { class: 'etiqueta' }, e.titulo),
        h('h3', {}, e.lema), h('p', {}, e.texto),
        h('p', { class: 'grado-card__meta' }, `Meta: ${p.ppmMin}–${q.ppmMax} PPM · ${p.precision}–${q.precision} % precisión`));
    })));

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

  return h('div', { class: 'portada' }, hero, demo, pasos, grados, tira, cierre, pie);
}

// ─────────── Comportamiento (después de montar) ───────────
const estado = { kb: null, texto: null };
let limpiar = [];

export function despues(raiz) {
  // Parallax suave con el puntero
  const escena = raiz.querySelector('.escena');
  if (escena && !movimientoReducido()) {
    const capas = [...escena.querySelectorAll('[data-prof]')];
    const mover = (e) => {
      const r = escena.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      // `translate` es independiente de `transform` y no choca con las animaciones CSS.
      capas.forEach((el) => { const p = Number(el.dataset.prof); el.style.translate = `${-nx * p}px ${-ny * p}px`; });
    };
    window.addEventListener('pointermove', mover, { passive: true });
    limpiar.push(() => window.removeEventListener('pointermove', mover));
  }

  // Tecleo en vivo
  const { kb, texto } = estado;
  if (!kb || !texto) return;
  if (movimientoReducido()) { texto.textContent = FRASES[1]; return; }
  let vivo = true, frase = 0, timer;
  const espera = (ms) => new Promise((r) => { timer = setTimeout(r, ms); });
  (async () => {
    while (vivo) {
      const f = FRASES[frase++ % FRASES.length];
      for (let i = 1; i <= f.length && vivo; i++) {
        texto.textContent = f.slice(0, i);
        kb.pulsar(f[i - 1]);
        await espera(70 + Math.random() * 70);
      }
      await espera(1500);
      while (texto.textContent.length && vivo) { texto.textContent = texto.textContent.slice(0, -1); await espera(22); }
      await espera(300);
    }
  })();
  limpiar.push(() => { vivo = false; clearTimeout(timer); });
}

export function destroy() { limpiar.forEach((f) => f()); limpiar = []; }
