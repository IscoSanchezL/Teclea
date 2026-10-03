/**
 * Carga la lista de mundos (data/worlds.json) con respaldo mínimo si falla la red.
 */
let cache = null;

const RESPALDO = [{ id: 1, clave: 'fila-base', nombre: 'Fila base', emoji: '🏠', color: ['#8A70FA', '#6C4CF5'], descripcion: 'Tus dedos llegan a casa' }];

export async function cargarMundos() {
  if (cache) return cache;
  try {
    const r = await fetch('data/worlds.json');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    cache = (await r.json()).mundos;
  } catch (e) {
    console.warn('[mundos] usando respaldo', e);
    cache = RESPALDO;
  }
  return cache;
}
