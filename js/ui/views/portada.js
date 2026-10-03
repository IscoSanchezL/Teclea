/**
 * Portada pública moderna: hero con escena 3D (o foto del colegio), demostración de tecleo en vivo,
 * bento de funciones, recorrido de los 10 mundos y "tres looks" por grado.
 */
import { PERFILES_GRADO } from '../../core/grados.js';
import { marca } from '../../core/marca.js';
import { CONFIG } from '../../core/config.js';
import { h, movimientoReducido } from '../../core/utils.js';
import { icono } from '../icons.js';
import { cargarMundos } from '../mundos.js';
import { tecladoDeco } from '../teclado-deco.js';
import { hero3d } from '../hero3d.js';
import { medallaSVG } from '../medallas.js';
import { tecladoCalor } from '../graficas.js';

const FRASES = ['Aprende a teclear sin mirar', 'El ñandú canta una canción', '¿Listo para ganar medallas?', 'Práctica corta, resultados reales'];

const ESTILOS_GRADO = [
  { clave: 'ludico', titulo: '2.º y 3.º', lema: 'Cielo, nubes y pegatinas', texto: 'Letras grandes, colores vivos y mucha ayuda paso a paso.', grados: [2, 3] },
  { clave: 'medio', titulo: '4.º', lema: 'Aventura suave', texto: 'Mundos con paisajes, retos nuevos y frases con tildes.', grados: [4] },
  { clave: 'pro', titulo: '5.º y 6.º', lema: 'Modo pro', texto: 'Panel de control con estadísticas, retos de velocidad y textos reales.', grados: [5, 6] },
];

const tile = (cls, ic, c1, c2, titulo, texto, visual) => h('article', { class: `bento__t bento__${cls} reveal`, style: { '--c1': c1, '--c2': c2 } },
  h('span', { class: 'bento__ic' }, icono(ic, { tam: 24 })), h('h3', {}, titulo), h('p', {}, texto), visual ? h('div', { class: 'bento__vis' }, visual) : null);

export async function render() {
  const mundos = await cargarMundos();
  const kb = tecladoDeco();
  const texto = h('span', { class: 'demo-pantalla__texto' });
  estado.kb = kb; estado.texto = texto;

  const hero = h('section', { class: `l-hero ${marca.hero ? 'l-hero--foto' : ''}`, style: marca.hero ? { backgroundImage: `url(${marca.hero})` } : {}, 'aria-labelledby': 'titulo-hero' },
    h('div', { class: 'l-hero__texto' },
      h('span', { class: 'l-pill reveal', style: { '--i': 0 } }, h('i'), `${marca.nombre} · mecanografía en español para 2.º a 6.º`),
      h('h1', { id: 'titulo-hero', class: 'reveal', style: { '--i': 1 } }, 'Aprende a teclear ', h('span', {}, 'sin mirar'), ' el teclado'),
      h('p', { class: 'reveal', style: { '--i': 2 } }, 'Más de 150 lecciones guiadas, práctica adaptativa y juegos que construyen memoria muscular. Con teclado en español: ñ, tildes, ¿ y ¡.'),
      h('div', { class: 'hero__acciones reveal', style: { '--i': 3 } },
        h('a', { class: 'btn btn--sun btn--lg', href: '#/entrar' }, 'Empezar ahora', icono('arrow', { tam: 20 })),
        h('a', { class: 'btn btn--suave btn--lg', href: '#/entrar?modo=codigo' }, 'Tengo código de clase')),
      h('div', { class: 'l-cifras reveal', style: { '--i': 4 } },
        h('div', {}, h('strong', {}, '10'), h('span', {}, 'mundos')),
        h('div', {}, h('strong', {}, '150+'), h('span', {}, 'lecciones')),
        h('div', {}, h('strong', {}, '40+'), h('span', {}, 'medallas')),
        h('div', {}, h('strong', {}, '0'), h('span', {}, 'anuncios')))),
    h('div', { class: 'l-hero__visual' }, hero3d()));

  const demo = h('section', { class: 'demo-teclas', 'aria-labelledby': 'titulo-demo' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-demo' }, 'Cada dedo, su color'), h('p', {}, 'Mira cómo se teclea: cada tecla se escribe con el dedo de su mismo color.')),
    h('div', { class: 'demo-pantalla card', 'data-tilt': '' },
      h('div', { class: 'demo-pantalla__barra', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('span', {}, 'mi-primera-leccion')),
      h('p', { class: 'demo-pantalla__linea', 'aria-label': FRASES[0] }, texto, h('span', { class: 'demo-pantalla__cursor', 'aria-hidden': 'true' })),
      kb.el,
      h('ul', { class: 'leyenda-dedos', 'aria-label': 'Colores por dedo' },
        [['menique', 'Meñique'], ['anular', 'Anular'], ['medio', 'Medio'], ['indice', 'Índice'], ['pulgar', 'Pulgar']].map(([d, n]) => h('li', {}, h('i', { class: `dedo-${d}` }), n)))));

  const bento = h('section', { 'aria-labelledby': 'titulo-bento' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-bento' }, 'Todo lo necesario para teclear bien'), h('p', {}, 'Diseñado con docentes de primaria: poco tiempo por sesión, mucha repetición con sentido.')),
    h('div', { class: 'bento' },
      tile('a', 'keyboard', '#8A70FA', '#4527B8', 'Memoria muscular, paso a paso', 'Cada lección introduce pocas teclas nuevas, las mezcla con las anteriores y las repasa a intervalos. Se avanza con precisión, no con prisa.',
        h('div', { class: 'puntos' }, Array.from({ length: 28 }, (_, i) => h('i', { class: i < 11 ? 'on' : '' })))),
      tile('b', 'target', '#22D3EE', '#0E7490', 'Refuerzo inteligente', 'La plataforma detecta tus teclas más falladas y arma lecciones de refuerzo solo para ti.', tecladoCalor({ 'ñ': 1, p: 0.6, q: 0.5, z: 0.4, x: 0.3, b: 0.25 })),
      tile('c', 'gamepad', '#FF8A7A', '#E84F3F', 'Juegos con teclado', 'Carreras, lluvia de palabras y duelos contra el tiempo.', null),
      tile('d', 'trophy', '#FFD04A', '#E39A00', 'Medallas y rachas', 'Logros que dan ganas de volver cada día.',
        h('div', { class: 'fila' }, medallaSVG({ nivel: 'bronce', icono: 'flame', tam: 44 }), medallaSVG({ nivel: 'oro', icono: 'target', tam: 44 }), medallaSVG({ nivel: 'diamante', icono: 'bolt', tam: 44 }))),
      tile('e', 'chart', '#6C8DFF', '#3B50E6', 'Panel para docentes', 'Progreso por clase, mapa de calor de errores y reportes.', null),
      h('article', { class: 'bento__t bento__f reveal' },
        h('div', {}, h('h3', {}, 'Funciona sin internet y cuida los datos de los menores'), h('p', {}, 'Se instala en tablet o PC, guarda tu avance al desconectarse y no usa anuncios ni rastreadores (Ley 1581 de 2012).')),
        h('a', { class: 'btn btn--primary', href: '#/entrar' }, 'Crear mi cuenta', icono('arrow', { tam: 18 })))));

  const lineaMundos = h('section', { 'aria-labelledby': 'titulo-mundos' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-mundos' }, 'Un camino de 10 mundos'), h('p', {}, 'De la fila base a los textos reales, con repasos y un reto final en cada mundo.')),
    h('ol', { class: 'linea' }, mundos.map((m) => h('li', { class: 'm-tile', style: { '--g1': m.color[0], '--g2': m.color[1] } },
      h('span', { class: 'm-tile__n' }, String(m.id).padStart(2, '0')), h('strong', {}, m.nombre), h('span', {}, m.descripcion),
      h('div', { class: 'm-tile__teclas' }, m.teclas.split(' ').slice(0, 11).map((t) => h('kbd', {}, t)))))));

  const grados = h('section', { class: 'grados', 'aria-labelledby': 'titulo-grados' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-grados' }, 'Una plataforma, tres looks'), h('p', {}, 'La apariencia y la dificultad se adaptan al grado de cada estudiante.')),
    h('div', { class: 'grados__rejilla' }, ESTILOS_GRADO.map((e) => {
      const p = PERFILES_GRADO[e.grados[0]], q = PERFILES_GRADO[e.grados.at(-1)];
      return h('article', { class: `grado-card grado-card--${e.clave}` },
        h('div', { class: 'grado-card__vista', 'aria-hidden': 'true' },
          h('span', { class: 'grado-card__tecla' }, e.clave === 'pro' ? '</>' : e.clave === 'ludico' ? 'Aa' : 'Ñ'), h('span', { class: 'grado-card__barra' }), h('span', { class: 'grado-card__barra grado-card__barra--corta' })),
        h('span', { class: 'etiqueta' }, e.titulo), h('h3', {}, e.lema), h('p', {}, e.texto),
        h('p', { class: 'grado-card__meta' }, `Meta: ${p.ppmMin}–${q.ppmMax} PPM · ${p.precision}–${q.precision} % precisión`));
    })));

  const pie = h('footer', { class: 'portada__pie' },
    h('p', {}, `© ${new Date().getFullYear()} ${marca.colegio} · ${marca.nombre} v${CONFIG.version}`),
    h('p', {}, h('a', { href: '#/privacidad' }, 'Aviso de privacidad (Ley 1581 de 2012)')));

  return h('div', { class: 'landing' }, hero, demo, bento, lineaMundos, grados, pie);
}

// ─────────── Comportamiento (después de montar) ───────────
const estado = { kb: null, texto: null };
let limpiar = [];

export function despues() {
  const { kb, texto } = estado;
  if (!kb || !texto) return;
  if (movimientoReducido()) { texto.textContent = FRASES[0]; return; }
  let vivo = true, frase = 0, timer;
  const espera = (ms) => new Promise((r) => { timer = setTimeout(r, ms); });
  (async () => {
    while (vivo) {
      const f = FRASES[frase++ % FRASES.length];
      for (let i = 1; i <= f.length && vivo; i++) { texto.textContent = f.slice(0, i); kb.pulsar(f[i - 1]); await espera(70 + Math.random() * 70); }
      await espera(1500);
      while (texto.textContent.length && vivo) { texto.textContent = texto.textContent.slice(0, -1); await espera(22); }
      await espera(300);
    }
  })();
  limpiar.push(() => { vivo = false; clearTimeout(timer); });
}
export function destroy() { limpiar.forEach((f) => f()); limpiar = []; }
