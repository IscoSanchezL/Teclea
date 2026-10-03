/**
 * Tienda: gasta monedas en fondos, marcos, accesorios, temas de color y protectores de racha.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { cargarTienda, cargarInventario, comprar, equipar } from '../../db/tienda.js';
import { avatar } from '../avatar.js';
import { icono } from '../icons.js';
import { toast, confirmar } from '../overlay.js';
import { sonido } from '../sonido.js';
import { aplicarPrefs } from '../theme.js';

const CATS = { todo: 'Todo', accesorio: 'Accesorios', fondo: 'Fondos', marco: 'Marcos', tema: 'Temas de color', consumible: 'Protectores' };
const MUESTRA_TEMA = { bosque: ['#2E9E6B', '#0F5C3C'], oceano: ['#2D9CDB', '#0B4F8A'], atardecer: ['#FF8A5B', '#B8336A'], neon: ['#C13CFF', '#00E5FF'] };

export async function render() {
  let u = state.user;
  const [items, inv] = await Promise.all([cargarTienda(), cargarInventario(u.uid)]);
  let sel = 'todo';
  const cab = h('header', { class: 'tienda__cab card card--hero' });
  const filtros = h('div', { class: 'filtros' });
  const rejilla = h('div', { class: 'tienda__rejilla' });
  const tengo = (it) => inv.find((x) => x.itemId === it.id);

  const vista = (it) => {
    if (it.categoria === 'fondo') return avatar({ ...u, foto: null, avatar: { ...u.avatar, fondo: it.fondo } }, { tam: 'lg' });
    if (it.categoria === 'marco') return avatar({ ...u, foto: null, avatar: { ...u.avatar, marco: it.marco } }, { tam: 'lg' });
    if (it.categoria === 'tema') { const [a, b] = MUESTRA_TEMA[it.tema] || ['#888', '#444']; return h('span', { class: 'tienda__tema', style: { background: `linear-gradient(135deg, ${a}, ${b})` } }); }
    if (it.categoria === 'consumible') return h('span', { class: 'tienda__emoji' }, icono('shield', { tam: 44 }));
    return h('span', { class: 'tienda__emoji' }, it.emoji);
  };

  async function accion(it) {
    const reg = tengo(it);
    try {
      if (it.categoria === 'consumible' || !reg) {
        if (!(await confirmar({ titulo: `¿Comprar ${it.nombre}?`, mensaje: `Cuesta ${it.precio} monedas.`, si: 'Comprar', no: 'Cancelar' }))) return;
        u = await comprar(u, it); sonido.acierto(); toast(`¡Listo! Compraste ${it.nombre}.`);
      } else { u = await equipar(u, it, !reg.equipado); aplicarPrefs(); sonido.clic(); }
    } catch (e) { toast(e.message || 'No se pudo completar.', { tipo: 'error' }); }
    pintar();
  }

  function pintar() {
    cab.replaceChildren(avatar(u, { tam: 'lg' }), h('div', {}, h('h1', {}, 'Tienda'), h('p', { class: 'suave' }, 'Personaliza tu perfil con las monedas que ganas practicando.')),
      h('span', { class: 'tienda__monedas', 'aria-label': `${u.monedas || 0} monedas` }, icono('coin', { tam: 24 }), h('b', {}, u.monedas || 0)));
    filtros.replaceChildren(...Object.entries(CATS).map(([c, n]) => h('button', { class: 'filtro', type: 'button', 'aria-pressed': String(c === sel), onclick: () => { sel = c; pintar(); } }, n)));
    rejilla.replaceChildren(...items.filter((it) => sel === 'todo' || it.categoria === sel).map((it) => {
      const reg = tengo(it), consumible = it.categoria === 'consumible';
      const sinMax = consumible && (u.protectores || 0) >= 3, faltan = !reg && (u.monedas || 0) < it.precio;
      const texto = consumible ? `Comprar · ${it.precio}` : reg ? (reg.equipado ? 'Quitar' : 'Equipar') : `Comprar · ${it.precio}`;
      return h('article', { class: `tienda__item card ${reg?.equipado ? 'tienda__item--puesto' : ''}` }, vista(it), h('strong', {}, it.nombre),
        it.descripcion ? h('small', { class: 'suave' }, it.descripcion) : null,
        consumible ? h('small', { class: 'suave' }, `Tienes ${u.protectores || 0} de 3`) : null,
        h('button', { class: `btn btn--sm ${reg ? 'btn--suave' : 'btn--primary'}`, type: 'button', disabled: sinMax || faltan, onclick: () => accion(it) }, !reg || consumible ? icono('coin', { tam: 16 }) : null, texto),
        reg?.equipado ? h('span', { class: 'etiqueta tienda__puesto' }, 'Puesto') : null);
    }));
  }
  pintar();
  return h('div', { class: 'tienda' }, cab, filtros, rejilla);
}
