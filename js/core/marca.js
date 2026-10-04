/**
 * Marca editable (nombre, lema, colegio, logo, imagen de portada).
 * El administrador la cambia desde el panel; se guarda en Firestore (config/branding, lectura pública
 * para que el login ya la muestre) y se cachea en este dispositivo para pintar al instante.
 */
import { CONFIG } from './config.js';
import { almacen } from './utils.js';
import { aplicarPaleta, hexValido } from './paleta.js';

const CLAVE = 'teclea:marca';
const CAMPOS = ['nombre', 'lema', 'colegio', 'logo', 'hero', 'colores'];

export const marca = {
  nombre: CONFIG.appName, lema: CONFIG.lema, colegio: CONFIG.colegio, logo: null, hero: null, colores: null,
  ...almacen.leer(CLAVE, {}),
};
const coloresOk = (c) => (c && hexValido(c.primario) && hexValido(c.acento) ? { primario: c.primario.toUpperCase(), acento: c.acento.toUpperCase() } : null);
aplicarPaleta(coloresOk(marca.colores)); // desde la caché local: los colores se ven desde el primer pintado

/** Aplica nombre y logo al documento (título de pestaña e ícono). */
export function aplicarMarca() {
  document.title = `${marca.nombre} · ${marca.lema}`;
  const icono = document.querySelector('link[rel="icon"]');
  if (icono && marca.logo) { icono.href = marca.logo; icono.type = ''; }
  aplicarPaleta(coloresOk(marca.colores));
  document.dispatchEvent(new CustomEvent('teclea:marca'));
}

/** Lee la marca publicada (si existe) y actualiza la caché local. No bloquea el arranque. */
export async function cargarMarca() {
  try {
    const { leer } = await import('../db/store.js');
    const d = await leer('config/branding');
    if (!d) return;
    for (const c of CAMPOS) if (d[c] !== undefined) marca[c] = d[c];
    almacen.guardar(CLAVE, Object.fromEntries(CAMPOS.map((c) => [c, marca[c]])));
    aplicarMarca();
  } catch (e) { console.warn('[marca] no se pudo leer la marca publicada', e?.code || e); }
}

/** Solo administrador. `parche` puede incluir nombre, lema, colegio, logo (dataURL) y hero. */
export async function guardarMarca(parche) {
  const { escribir } = await import('../db/store.js');
  const limpio = Object.fromEntries(Object.entries(parche).filter(([k]) => CAMPOS.includes(k)));
  if ('colores' in limpio) limpio.colores = coloresOk(limpio.colores);
  await escribir('config/branding', limpio, { fusionar: true });
  Object.assign(marca, limpio);
  almacen.guardar(CLAVE, Object.fromEntries(CAMPOS.map((c) => [c, marca[c]])));
  aplicarMarca();
}
