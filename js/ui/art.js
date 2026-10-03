/**
 * Sistema de ilustraciones con "placeholder" automático.
 *
 * Cada ilustración se identifica con una CLAVE (el nombre del archivo sin extensión),
 * por ejemplo "tecli-saludo" o "mundo-1-fila-base". El archivo real vive en
 * /assets/img/... y se registra en assets/assets.json, que genera solo
 * `tools/generar-manifest-assets.mjs` (corre automáticamente al publicar en GitHub Pages).
 *
 *  - Si la clave existe en el manifiesto → se muestra la imagen real.
 *  - Si no → se muestra un placeholder bonito (gradiente + emoji grande).
 *
 * Así NUNCA hay errores 404 en consola y, al subir tus imágenes, se reemplazan solas.
 */
import { h } from '../core/utils.js';

let manifiesto = {};

export async function cargarManifiestoAssets() {
  try {
    const r = await fetch('assets/assets.json', { cache: 'no-cache' });
    if (r.ok) manifiesto = await r.json();
  } catch { /* sin manifiesto: todo con placeholders */ }
}

export const tieneAsset = (clave) => Boolean(manifiesto[clave]);
export const urlAsset = (clave) => manifiesto[clave] || null;

/** Poses de la mascota "Tecli" (8 expresiones). Emoji = placeholder mientras no hay arte. */
export const POSES = {
  saludo:     { emoji: '🦊', nombre: 'Tecli saluda' },
  celebra:    { emoji: '🥳', nombre: 'Tecli celebra' },
  piensa:     { emoji: '🤔', nombre: 'Tecli piensa' },
  anima:      { emoji: '💪', nombre: 'Tecli te anima' },
  dormido:    { emoji: '😴', nombre: 'Tecli duerme' },
  triste:     { emoji: '🥺', nombre: 'Tecli te acompaña' },
  senala:     { emoji: '👉', nombre: 'Tecli señala' },
  sorprendido:{ emoji: '😮', nombre: 'Tecli se sorprende' },
};

/**
 * Imagen o placeholder.
 * ilustracion('mundo-3', { emoji:'🌉', gradiente:['#8A70FA','#3DDBB0'], alt:'...', clase:'' })
 */
export function ilustracion(clave, { emoji = '✨', gradiente = ['#8A70FA', '#4FB6FF'], alt = '', clase = '', eager = false } = {}) {
  const url = urlAsset(clave);
  if (url) {
    return h('img', {
      class: `ilus ${clase}`, src: url, alt, decoding: 'async',
      loading: eager ? 'eager' : 'lazy', draggable: 'false',
    });
  }
  return h('span', {
    class: `ilus ilus--placeholder ${clase}`,
    style: { '--g1': gradiente[0], '--g2': gradiente[1] },
    role: alt ? 'img' : null, 'aria-label': alt || null, 'aria-hidden': alt ? null : 'true',
  }, h('span', { class: 'ilus__emoji', 'aria-hidden': 'true' }, emoji));
}

/** Mascota Tecli en la pose indicada. tam: 'sm' | 'md' | 'lg' | 'xl' */
export function mascota(pose = 'saludo', { tam = 'md', animada = true, clase = '' } = {}) {
  const p = POSES[pose] || POSES.saludo;
  return h('span', { class: `mascota mascota--${tam} ${animada ? 'mascota--flota' : ''} ${clase}`, dataset: { pose } },
    ilustracion(`tecli-${pose}`, { emoji: p.emoji, alt: p.nombre, gradiente: ['#FFB86B', '#FF6B5B'], clase: 'mascota__img', eager: true }));
}
