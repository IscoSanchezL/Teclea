/**
 * Portada pública moderna: hero con escena 3D (o foto del colegio), demostración de tecleo en vivo,
 * bento de funciones, recorrido de los 10 mundos y "tres looks" por grado.
 */
import { PERFILES_GRADO } from '../../core/grados.js';
import { marca, colegioMarca } from '../../core/marca.js';
import { t, loc } from '../../i18n/index.js';
import { CONFIG } from '../../core/config.js';
import { h, movimientoReducido } from '../../core/utils.js';
import { icono } from '../icons.js';
import { cargarMundos } from '../mundos.js';
import { tecladoDeco } from '../teclado-deco.js';
import { hero3d } from '../hero3d.js';
import { medallaSVG } from '../medallas.js';
import { tecladoCalor } from '../graficas.js';

const frases = () => [t('portada.frase1'), t('portada.frase2'), t('portada.frase3'), t('portada.frase4')];

const estilosGrado = () => [
  { clave: 'ludico', titulo: t('portada.grado23.titulo'), lema: t('portada.grado23.lema'), texto: t('portada.grado23.texto'), grados: [2, 3] },
  { clave: 'medio', titulo: t('portada.grado4.titulo'), lema: t('portada.grado4.lema'), texto: t('portada.grado4.texto'), grados: [4] },
  { clave: 'pro', titulo: t('portada.grado56.titulo'), lema: t('portada.grado56.lema'), texto: t('portada.grado56.texto'), grados: [5, 6] },
];
let FRASES = frases();

const tile = (cls, ic, c1, c2, titulo, texto, visual) => h('article', { class: `bento__t bento__${cls} reveal`, style: { '--c1': c1, '--c2': c2 } },
  h('span', { class: 'bento__ic' }, icono(ic, { tam: 24 })), h('h3', {}, titulo), h('p', {}, texto), visual ? h('div', { class: 'bento__vis' }, visual) : null);

export async function render() {
  FRASES = frases();
  const mundos = await cargarMundos();
  const kb = tecladoDeco();
  const texto = h('span', { class: 'demo-pantalla__texto' });
  estado.kb = kb; estado.texto = texto;

  const hero = h('section', { class: `l-hero ${marca.hero ? 'l-hero--foto' : ''}`, style: marca.hero ? { backgroundImage: `url(${marca.hero})` } : {}, 'aria-labelledby': 'titulo-hero' },
    h('div', { class: 'l-hero__texto' },
      h('span', { class: 'l-pill reveal', style: { '--i': 0 } }, h('i'), t('portada.pill', { nombre: marca.nombre })),
      h('h1', { id: 'titulo-hero', class: 'reveal', style: { '--i': 1 } }, t('portada.h1a'), ' ', h('span', {}, t('portada.h1b')), ' ', t('portada.h1c')),
      h('p', { class: 'reveal', style: { '--i': 2 } }, t('portada.intro')),
      h('div', { class: 'hero__acciones reveal', style: { '--i': 3 } },
        h('a', { class: 'btn btn--sun btn--lg', href: '#/entrar' }, t('portada.empezar'), icono('arrow', { tam: 20 })),
        h('a', { class: 'btn btn--suave btn--lg', href: '#/entrar?modo=codigo' }, t('portada.codigo'))),
      h('div', { class: 'l-cifras reveal', style: { '--i': 4 } },
        h('div', {}, h('strong', {}, '10'), h('span', {}, t('portada.cifra.mundos'))),
        h('div', {}, h('strong', {}, '150+'), h('span', {}, t('portada.cifra.lecciones'))),
        h('div', {}, h('strong', {}, '40+'), h('span', {}, t('portada.cifra.medallas'))),
        h('div', {}, h('strong', {}, '0'), h('span', {}, t('portada.cifra.anuncios'))))),
    h('div', { class: 'l-hero__visual' }, hero3d()));

  const demo = h('section', { class: 'demo-teclas', 'aria-labelledby': 'titulo-demo' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-demo' }, t('portada.demo.titulo')), h('p', {}, t('portada.demo.texto'))),
    h('div', { class: 'demo-pantalla card', 'data-tilt': '' },
      h('div', { class: 'demo-pantalla__barra', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('span', {}, t('portada.demo.archivo'))),
      h('p', { class: 'demo-pantalla__linea', 'aria-label': FRASES[0] }, texto, h('span', { class: 'demo-pantalla__cursor', 'aria-hidden': 'true' })),
      kb.el,
      h('ul', { class: 'leyenda-dedos', 'aria-label': t('portada.demo.colores') },
        ['menique', 'anular', 'medio', 'indice', 'pulgar'].map((d) => h('li', {}, h('i', { class: `dedo-${d}` }), t(`dedo.${d}`))))));

  const bento = h('section', { 'aria-labelledby': 'titulo-bento' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-bento' }, t('portada.bento.titulo')), h('p', {}, t('portada.bento.texto'))),
    h('div', { class: 'bento' },
      tile('a', 'keyboard', '#8A70FA', '#4527B8', t('portada.bento.a.titulo'), t('portada.bento.a.texto'),
        h('div', { class: 'puntos' }, Array.from({ length: 28 }, (_, i) => h('i', { class: i < 11 ? 'on' : '' })))),
      tile('b', 'target', '#22D3EE', '#0E7490', t('portada.bento.b.titulo'), t('portada.bento.b.texto'), tecladoCalor({ 'ñ': 1, p: 0.6, q: 0.5, z: 0.4, x: 0.3, b: 0.25 })),
      tile('c', 'gamepad', '#FF8A7A', '#E84F3F', t('portada.bento.c.titulo'), t('portada.bento.c.texto'), null),
      tile('d', 'trophy', '#FFD04A', '#E39A00', t('portada.bento.d.titulo'), t('portada.bento.d.texto'),
        h('div', { class: 'fila' }, medallaSVG({ nivel: 'bronce', icono: 'flame', tam: 44 }), medallaSVG({ nivel: 'oro', icono: 'target', tam: 44 }), medallaSVG({ nivel: 'diamante', icono: 'bolt', tam: 44 }))),
      tile('e', 'chart', '#6C8DFF', '#3B50E6', t('portada.bento.e.titulo'), t('portada.bento.e.texto'), null),
      h('article', { class: 'bento__t bento__f reveal' },
        h('div', {}, h('h3', {}, t('portada.bento.f.titulo')), h('p', {}, t('portada.bento.f.texto'))),
        h('a', { class: 'btn btn--primary', href: '#/entrar' }, t('portada.bento.f.boton'), icono('arrow', { tam: 18 })))));

  const lineaMundos = h('section', { 'aria-labelledby': 'titulo-mundos' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-mundos' }, t('portada.mundos.titulo')), h('p', {}, t('portada.mundos.texto'))),
    h('ol', { class: 'linea' }, mundos.map((m) => h('li', { class: 'm-tile', style: { '--g1': m.color[0], '--g2': m.color[1] } },
      h('span', { class: 'm-tile__n' }, String(m.id).padStart(2, '0')), h('strong', {}, loc(m, 'nombre')), h('span', {}, loc(m, 'descripcion')),
      h('div', { class: 'm-tile__teclas' }, m.teclas.split(' ').slice(0, 11).map((t) => h('kbd', {}, t)))))));

  const grados = h('section', { class: 'grados', 'aria-labelledby': 'titulo-grados' },
    h('div', { class: 'l-sec__cab' }, h('h2', { id: 'titulo-grados' }, t('portada.grados.titulo')), h('p', {}, t('portada.grados.texto'))),
    h('div', { class: 'grados__rejilla' }, estilosGrado().map((e) => {
      const p = PERFILES_GRADO[e.grados[0]], q = PERFILES_GRADO[e.grados.at(-1)];
      return h('article', { class: `grado-card grado-card--${e.clave}` },
        h('div', { class: 'grado-card__vista', 'aria-hidden': 'true' },
          h('span', { class: 'grado-card__tecla' }, e.clave === 'pro' ? '</>' : e.clave === 'ludico' ? 'Aa' : 'Ñ'), h('span', { class: 'grado-card__barra' }), h('span', { class: 'grado-card__barra grado-card__barra--corta' })),
        h('span', { class: 'etiqueta' }, e.titulo), h('h3', {}, e.lema), h('p', {}, e.texto),
        h('p', { class: 'grado-card__meta' }, t('portada.meta', { a: p.ppmMin, b: q.ppmMax, c: p.precision, d: q.precision })));
    })));

  const pie = h('footer', { class: 'portada__pie' },
    h('p', {}, t('portada.pie', { anio: new Date().getFullYear(), colegio: colegioMarca(), nombre: marca.nombre, version: CONFIG.version })),
    h('p', {}, h('a', { href: '#/privacidad' }, t('portada.privacidad'))));

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
