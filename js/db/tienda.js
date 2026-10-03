/**
 * Tienda: catálogo (data/shop.json, sembrado también en Firestore para que las reglas validen el precio),
 * inventario, compra atómica y equipamiento. Sin DOM.
 */
import { state, setState } from '../core/state.js';
import * as store from './store.js';

let cargador = async (r) => { const x = await fetch(r); if (!x.ok) throw new Error(`HTTP ${x.status}`); return x.json(); };
export const _inyectarCargador = (f) => { cargador = f; };
let catalogo = null;
let inv = { uid: null, lista: null };

export async function cargarTienda() { return (catalogo ||= (await cargador('data/shop.json')).items); }

export async function cargarInventario(uid) {
  if (inv.uid !== uid || !inv.lista) inv = { uid, lista: await store.consultar('inventory', { donde: [['uid', '==', uid]] }) };
  return inv.lista;
}
export const _reiniciar = () => { inv = { uid: null, lista: null }; };

export const PROTECTORES_MAX = 3;

/** Compra un artículo. Lanza Error con mensaje amable si no se puede. */
export async function comprar(user, item) {
  const lista = await cargarInventario(user.uid);
  if ((user.monedas || 0) < item.precio) throw new Error('Te faltan monedas para este artículo.');

  if (item.categoria === 'consumible') {
    if ((user.protectores || 0) >= PROTECTORES_MAX) throw new Error(`Ya tienes el máximo de ${PROTECTORES_MAX} protectores.`);
    await store.esperarMax(store.actualizar(`users/${user.uid}`, { monedas: store.sumar(-item.precio), protectores: store.sumar(1) }));
    const u = { ...user, monedas: user.monedas - item.precio, protectores: (user.protectores || 0) + 1 };
    if (state.user?.uid === user.uid) setState({ user: u });
    return u;
  }
  if (lista.some((x) => x.itemId === item.id)) throw new Error('Ya tienes este artículo.');
  await store.esperarMax(store.lote([
    { tipo: 'set', ruta: `inventory/${user.uid}_${item.id}`, datos: { uid: user.uid, itemId: item.id, compradoEn: store.ahora(), equipado: false } },
    { tipo: 'update', ruta: `users/${user.uid}`, datos: { monedas: store.sumar(-item.precio) } },
  ]));
  lista.push({ id: `${user.uid}_${item.id}`, uid: user.uid, itemId: item.id, equipado: false, compradoEn: Date.now() });
  const u = { ...user, monedas: user.monedas - item.precio };
  if (state.user?.uid === user.uid) setState({ user: u });
  return u;
}

/** Equipa o desequipa. Fondo, marco y tema son únicos; los accesorios admiten hasta 2. */
export async function equipar(user, item, activar = true) {
  const lista = await cargarInventario(user.uid);
  const registro = lista.find((x) => x.itemId === item.id);
  if (!registro) throw new Error('Primero compra este artículo.');
  const catalogoItems = await cargarTienda();
  const avatar = { ...(user.avatar || {}) };
  const prefs = { ...(user.prefs || {}) };
  const ops = [];
  const desequipar = (cat) => lista.filter((x) => x.equipado && catalogoItems.find((c) => c.id === x.itemId)?.categoria === cat && x.itemId !== item.id);

  if (item.categoria === 'fondo') avatar.fondo = activar ? item.fondo : 'violeta';
  if (item.categoria === 'marco') avatar.marco = activar ? item.marco : null;
  if (item.categoria === 'tema') { if (activar) prefs.temaColor = item.tema; else delete prefs.temaColor; }
  if (item.categoria === 'accesorio') {
    const acc = new Set(avatar.accesorios || []);
    if (activar) { acc.add(item.emoji); while (acc.size > 2) acc.delete([...acc][0]); } else acc.delete(item.emoji);
    avatar.accesorios = [...acc];
  }
  if (activar && ['fondo', 'marco', 'tema'].includes(item.categoria)) for (const x of desequipar(item.categoria)) { ops.push({ tipo: 'update', ruta: `inventory/${x.id}`, datos: { equipado: false } }); x.equipado = false; }
  ops.push({ tipo: 'update', ruta: `inventory/${registro.id}`, datos: { equipado: activar } });
  ops.push({ tipo: 'update', ruta: `users/${user.uid}`, datos: { avatar, prefs } });
  await store.esperarMax(store.lote(ops));
  registro.equipado = activar;
  const u = { ...user, avatar, prefs };
  if (state.user?.uid === user.uid) setState({ user: u });
  return u;
}
