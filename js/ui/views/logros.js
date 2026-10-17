/**
 * Mis logros: nivel, racha, monedas, retos del día, vitrina de medallas por categoría y calendario.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { nivelPorXP } from '../../core/levels.js';
import { cargarInsignias, resumenHoy, cargarProgreso } from '../../db/progreso.js';
import { cargarCatalogo } from '../../game/insignias.js';
import { anillo } from '../componentes.js';
import { medallaSVG } from '../medallas.js';
import { icono } from '../icons.js';
import { tarjetaRetos } from '../retos-ui.js';
import { abrirCapa } from '../overlay.js';
import { cargarIndice } from '../../lessons/curriculo.js';
import { marca } from '../../core/marca.js';
import { imprimir } from '../../core/utils.js';
import { t, loc, locale } from '../../i18n/index.js';
import { colegioMarca } from '../../core/marca.js';

const nombreMundo = (n) => t(`logros.mundo.${n}`);
function certificado(u, mundo) {
  const fecha = new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  return h('div', { class: 'hoja certificado' }, marca.logo ? h('img', { src: marca.logo, alt: '', width: 64, height: 64, style: { alignSelf: 'center' } }) : null,
    h('h2', {}, marca.nombre), h('h1', {}, t('logros.cert.titulo')), h('p', {}, t('logros.cert.otorga')), h('div', { class: 'certificado__nombre' }, u.nombre),
    h('p', {}, t('logros.cert.por', { n: mundo, nombre: nombreMundo(mundo) })), h('p', {}, `${colegioMarca() ? `${colegioMarca()} · ` : ''}${fecha}`));
}

const CATEGORIAS = ['todas', 'constancia', 'velocidad', 'precision', 'exploracion', 'juegos', 'primera', 'clase', 'secretas'];
const nombreCategoria = (c) => t(`logros.cat.${c}`);

export async function render() {
  const u = state.user;
  const [cat, ganadas, hoy, progreso] = await Promise.all([cargarCatalogo(), cargarInsignias(u.uid), resumenHoy(u.uid).catch(() => ({})), cargarProgreso(u.uid)]);
  const nivel = nivelPorXP(u.xp || 0);
  const estrellas = Object.values(progreso).reduce((a, p) => a + (p.estrellas || 0), 0);

  const hero = h('section', { class: 'card card--hero logros__hero' },
    anillo({ valor: nivel.progreso, tam: 132, grosor: 12, color: 'var(--sol-400)', etiqueta: t('logros.nivel', { n: nivel.nivel }) }, h('strong', { class: 'logros__nivel' }, nivel.nivel)),
    h('div', { class: 'logros__datos' },
      h('span', { class: 'etiqueta' }, t('logros.nivel', { n: nivel.nivel })), h('h1', {}, nivel.nombre),
      h('p', { class: 'suave' }, nivel.siguiente ? t('inicio.xpPara', { n: nivel.siguiente.xp - (u.xp || 0), nombre: nivel.siguiente.nombre }) : t('inicio.nivelMax')),
      h('ul', { class: 'logros__chips' },
        h('li', {}, icono('flame', { tam: 18 }), h('b', {}, u.racha || 0), ` ${t('logros.dias')}`),
        h('li', {}, icono('shield', { tam: 18 }), h('b', {}, u.protectores || 0), ` ${t('logros.protectores')}`),
        h('li', {}, icono('coin', { tam: 18 }), h('b', {}, u.monedas || 0), ` ${t('logros.monedas')}`),
        h('li', {}, icono('star', { tam: 18 }), h('b', {}, estrellas), ` ${t('logros.estrellas')}`),
        h('li', {}, icono('medal', { tam: 18 }), h('b', {}, ganadas.size), ` ${t('logros.deMedallas', { n: cat.length })}`)),
      h('a', { class: 'btn btn--sun btn--sm', href: '#/tienda' }, icono('bag', { tam: 18 }), t('logros.tienda'))));

  const retos = await tarjetaRetos({ hoy });
  const indice = await cargarIndice();
  const completos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((n) => { const ls = indice.filter((l) => l.mundo === n); return ls.length && ls.every((l) => (progreso[l.id]?.estrellas || 0) >= 1); });
  const certs = h('section', { class: 'card' }, h('h2', { class: 'seccion__titulo' }, t('logros.certificados')),
    completos.length ? h('ul', { class: 'tareas' }, completos.map((n) => h('li', { class: 'tarea' }, h('div', { class: 'tarea__txt' }, h('strong', {}, t('logros.mundo', { n })), h('small', { class: 'suave' }, nombreMundo(n))),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => imprimir(certificado(u, n)) }, icono('printer', { tam: 16 }), t('logros.imprimir'))))) : h('p', { class: 'suave' }, t('logros.certVacio')));

  const vitrina = h('div', { class: 'vitrina' });
  const filtros = h('div', { class: 'filtros', role: 'group', 'aria-label': t('logros.categorias') });
  const usadas = ['todas', ...CATEGORIAS.filter((c) => c !== 'todas' && cat.some((m) => m.categoria === c))];
  let sel = 'todas';
  const detalle = (m, ok) => abrirCapa({ titulo: ok || m.categoria !== 'secretas' ? loc(m, 'nombre') : t('logros.secreta'), tipo: 'dialogo',
    contenido: h('div', { class: 'medalla-detalle' }, medallaSVG({ nivel: m.nivel, icono: m.icono, tam: 140, bloqueada: !ok }),
      h('p', {}, ok || m.categoria !== 'secretas' ? loc(m, 'descripcion') : t('logros.secretaDesc')), h('small', { class: 'suave' }, ok ? t('logros.yaEsTuya') : t('logros.aunNo')) ) });
  const pintar = () => {
    filtros.replaceChildren(...usadas.map((c) => h('button', { class: 'filtro', type: 'button', 'aria-pressed': String(c === sel), onclick: () => { sel = c; pintar(); } }, nombreCategoria(c))));
    const lista = cat.filter((m) => sel === 'todas' || m.categoria === sel).sort((a, b) => Number(ganadas.has(b.id)) - Number(ganadas.has(a.id)));
    vitrina.replaceChildren(...lista.map((m) => { const ok = ganadas.has(m.id), oculta = !ok && m.categoria === 'secretas';
      return h('button', { class: `vit ${ok ? 'vit--ok' : ''}`, type: 'button', onclick: () => detalle(m, ok), 'aria-label': `${oculta ? t('logros.secreta') : loc(m, 'nombre')}, ${ok ? t('logros.conseguida') : t('logros.bloqueada')}` },
        medallaSVG({ nivel: m.nivel, icono: oculta ? 'lock' : m.icono, tam: 76, bloqueada: !ok }), h('strong', {}, oculta ? '???' : loc(m, 'nombre'))); }));
  };
  pintar();

  return h('div', { class: 'logros' }, hero,
    h('div', { class: 'logros__cuerpo' },
      h('section', { class: 'card' }, h('div', { class: 'fila fila--entre' }, h('h2', { class: 'seccion__titulo' }, t('logros.vitrina')), h('span', { class: 'suave' }, `${ganadas.size} / ${cat.length}`)), filtros, vitrina),
      h('aside', { class: 'logros__lateral pila' }, retos, certs)));
}
