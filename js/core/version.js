/** Versión de la app que está corriendo en este dispositivo (los 8 primeros caracteres del precaché). */
export function textoVersion(el, prefijo = 'Versión ') {
  fetch('precache.json', { cache: 'no-store' }).then((r) => r.json()).then((j) => { el.textContent = `${prefijo}${String(j.version).slice(0, 8)}`; }).catch(() => {});
  return el;
}
