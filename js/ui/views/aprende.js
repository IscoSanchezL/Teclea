/**
 * Curso completo: mundos y lecciones con estrellas, bloqueos, continuar y refuerzo inteligente.
 */
import { opcionesRapidas } from '../../db/clases.js';
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { cargarIndice, estadoLecciones, resumenMundo, mundoActual, MUNDOS_RECOMENDADOS } from '../../lessons/curriculo.js';
import { cargarProgreso, teclasDebiles } from '../../db/progreso.js';
import { cargarMundos } from '../mundos.js';
import { anillo } from '../componentes.js';
import { icono } from '../icons.js';
import { mascota } from '../art.js';
import { toast } from '../overlay.js';

const ICONO_TIPO = { nueva: 'sparkle', repaso: 'refresh', palabras: 'book', ritmo: 'bolt', tema: 'book', precision: 'target', velocidad: 'bolt', jefe: 'crown', reto: 'flag' };
const ETIQUETA_TIPO = { nueva: 'Teclas nuevas', repaso: 'Repaso', palabras: 'Palabras', ritmo: 'Ritmo', tema: 'Textos', precision: 'Precisión', velocidad: 'Velocidad', jefe: 'Jefe', reto: 'Reto' };

export async function render({ query }) {
  const u = state.user;
  const [indice, progreso, mundos, debiles, opciones] = await Promise.all([cargarIndice(), cargarProgreso(u.uid), cargarMundos(), teclasDebiles(u.uid, 5), opcionesRapidas(state.user)]);
  const estados = estadoLecciones(indice, progreso, opciones);
  const actualId = indice.find((l) => estados[l.id] === 'actual')?.id;
  let sel = Number(query.mundo) || mundoActual(indice, estados);
  const recomendados = MUNDOS_RECOMENDADOS[u.grado || 4] || [];

  const totalHechas = indice.filter((l) => (progreso[l.id]?.estrellas || 0) >= 1).length;
  const estrellas = indice.reduce((s, l) => s + (progreso[l.id]?.estrellas || 0), 0);

  const lista = h('div', { class: 'lecciones', role: 'list', 'aria-label': 'Lecciones del mundo' });
  const titulo = h('h2', { class: 'curso__mundo-tit' });
  const botonesMundo = [];

  function pintarMundo(n) {
    sel = n;
    botonesMundo.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === n)));
    const m = mundos.find((x) => x.id === n);
    const r = resumenMundo(indice, progreso, n);
    titulo.replaceChildren(h('span', { class: 'etiqueta' }, `Mundo ${n}`), ` ${m.nombre} `, h('small', { class: 'suave' }, `${r.hechas}/${r.total} lecciones · ${r.estrellas}/${r.maxEstrellas} ★`));
    lista.replaceChildren(...indice.filter((l) => l.mundo === n).map((l) => {
      const est = estados[l.id], p = progreso[l.id], bloq = est === 'bloqueada';
      return h('button', {
        class: `leccion-nodo leccion-nodo--${est} leccion-nodo--${l.tipo}`, type: 'button', role: 'listitem',
        style: { '--g1': m.color[0], '--g2': m.color[1] },
        'aria-label': `Lección ${l.n}: ${l.titulo}. ${bloq ? 'Bloqueada' : est === 'completada' ? `Completada con ${p.estrellas} estrellas` : est === 'actual' ? 'Tu siguiente lección' : 'Disponible'}`,
        onclick: () => (bloq ? toast('Completa la lección anterior para abrirla. 🔒', { tipo: 'info' }) : navegar(`/leccion?id=${l.id}`)),
      },
        h('span', { class: 'leccion-nodo__num' }, bloq ? icono('lock', { tam: 18 }) : String(l.n)),
        h('span', { class: 'leccion-nodo__txt' }, h('strong', {}, l.titulo), h('small', {}, h('span', { class: 'leccion-nodo__tipo' }, icono(ICONO_TIPO[l.tipo] || 'star', { tam: 13 }), ETIQUETA_TIPO[l.tipo]), p?.mejorWpm ? ` · ${p.mejorWpm} PPM` : '')),
        h('span', { class: 'leccion-nodo__est', 'aria-hidden': 'true' }, [1, 2, 3].map((i) => h('i', { class: i <= (p?.estrellas || 0) ? 'on' : '' }, icono('star', { tam: 16 })))));
    }));
  }

  const selector = h('div', { class: 'mundos-sel', role: 'group', 'aria-label': 'Mundos' }, mundos.map((m) => {
    const r = resumenMundo(indice, progreso, m.id);
    const b = h('button', { class: 'mundo-btn', type: 'button', style: { '--g1': m.color[0], '--g2': m.color[1] }, onclick: () => pintarMundo(m.id) },
      h('span', { class: 'mundo-btn__n' }, String(m.id).padStart(2, '0')),
      h('span', { class: 'mundo-btn__t' }, h('strong', {}, m.nombre), h('small', {}, `${r.hechas}/${r.total}`)),
      h('i', { class: 'mundo-btn__barra' }, h('b', { style: { width: `${(r.hechas / r.total) * 100}%` } })),
      recomendados.includes(m.id) ? null : h('em', { class: 'mundo-btn__opc' }, 'Extra'));
    botonesMundo.push(b); return b;
  }));

  const actual = indice.find((l) => l.id === actualId);
  const continuar = h('section', { class: 'card card--hero curso__hero' },
    h('div', { class: 'curso__hero-texto' },
      h('span', { class: 'etiqueta' }, 'Tu curso de mecanografía'),
      h('h1', {}, totalHechas === 0 ? '¡Empecemos a teclear!' : actual ? 'Continúa donde te quedaste' : '¡Completaste el curso!'),
      h('p', { class: 'suave' }, actual ? `Siguiente: Mundo ${actual.mundo} · ${actual.titulo}` : 'Sigue practicando con los juegos y la práctica libre.'),
      h('div', { class: 'fila fila--envuelve' },
        actual ? h('a', { class: 'btn btn--sun btn--lg', href: `#/leccion?id=${actual.id}` }, icono('play', { tam: 20 }), totalHechas ? 'Continuar' : 'Primera lección') : null,
        h('a', { class: 'btn btn--suave', href: '#/introduccion' }, icono('book', { tam: 18 }), 'Postura y manos'))),
    anillo({ valor: totalHechas / indice.length, tam: 130, grosor: 12, color: 'var(--sol-400)', etiqueta: `${totalHechas} de ${indice.length} lecciones` },
      h('strong', { class: 'curso__pct' }, `${Math.round((totalHechas / indice.length) * 100)}%`), h('small', {}, `${totalHechas}/${indice.length}`)));

  const refuerzo = h('section', { class: 'card refuerzo' },
    h('div', { class: 'fila' }, h('span', { class: 'coach__ic' }, icono('target', { tam: 22 })), h('div', {}, h('h2', { class: 'seccion__titulo', style: { margin: 0 } }, 'Refuerzo inteligente'), h('small', { class: 'suave' }, 'Basado en tus errores reales'))),
    debiles.length
      ? h('div', { class: 'pila' }, h('p', {}, 'Tus teclas más difíciles:'), h('ul', { class: 'debiles' }, debiles.map((d) => h('li', {}, h('kbd', {}, d.c.toUpperCase()), h('small', {}, `${Math.round(d.tasa * 100)} % de fallos`)))),
          h('a', { class: 'btn btn--primary btn--sm', href: '#/practica?modo=refuerzo' }, 'Practicar mis teclas débiles', icono('arrow', { tam: 16 })))
      : h('p', { class: 'suave' }, 'Cuando completes algunas lecciones, aquí verás las teclas que más te cuestan y armaré ejercicios solo para ellas.'));

  const bienvenida = state.prefs.introHecha || totalHechas > 0 ? null : h('section', { class: 'card tutorial' },
    mascota('saludo', { tam: 'sm' }),
    h('div', {}, h('h2', { style: { margin: 0 } }, 'Tutorial de 60 segundos'), h('p', { class: 'suave', style: { margin: 0 } }, 'Aprende cómo sentarte y dónde poner los dedos antes de tu primera lección.')),
    h('a', { class: 'btn btn--primary', href: '#/introduccion' }, 'Empezar el tutorial', icono('arrow', { tam: 16 })));
  pintarMundo(sel);
  return h('div', { class: 'curso' }, continuar, bienvenida,
    h('div', { class: 'curso__cuerpo' }, h('aside', { class: 'curso__lado' }, selector, refuerzo),
      h('section', { 'aria-labelledby': 'titulo-lecciones' }, titulo, lista,
        h('p', { class: 'suave pequeno' }, `★ ${estrellas} estrellas ganadas · Cada lección se abre al conseguir al menos 1 estrella en la anterior.`))));
}
