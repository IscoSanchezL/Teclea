/**
 * TECLEA · Service Worker (modo sin conexión)
 *
 * Estrategias:
 *  - Instalación: descarga todo lo listado en precache.json (la app completa).
 *  - Código propio (html/js/css/json): "red primero" con límite de 2,5 s → siempre la última versión
 *    cuando hay internet, y la copia guardada cuando no (o si la red está lenta).
 *  - Imágenes/sonidos: "caché primero" y se refrescan en segundo plano.
 *  - SDK de Firebase y fuentes (otros dominios): "caché primero" y se refrescan.
 *  - Firestore / Auth NO se interceptan: el propio SDK maneja el modo sin conexión (caché local
 *    persistente y cola de escrituras que se sincroniza al reconectar).
 */
const PREFIJO = 'teclea-';
const EXTERNOS_PERMITIDOS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];
const MEDIOS = /\.(webp|png|jpe?g|svg|mp3|ogg|woff2?)$/i;
let cachePrincipal = `${PREFIJO}nucleo`;

self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    try {
      const r = await fetch('precache.json', { cache: 'no-store' });
      const { version, archivos } = await r.json();
      cachePrincipal = `${PREFIJO}${version}`;
      const cache = await caches.open(cachePrincipal);
      // allSettled: si un archivo falla, el resto igual queda guardado.
      await Promise.allSettled(archivos.map((a) => cache.add(new Request(a, { cache: 'reload' }))));
      await cache.put('./', await fetch('index.html'));
    } catch (e) { /* sin red durante la instalación: se intentará de nuevo en la siguiente visita */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    // Conserva el caché de la versión actual y el de ejecución; borra los demás.
    const r = await fetch('precache.json', { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
    if (r) cachePrincipal = `${PREFIJO}${r.version}`;
    const vigentes = new Set([cachePrincipal, `${PREFIJO}ejecucion`]);
    for (const k of await caches.keys()) if (k.startsWith(PREFIJO) && !vigentes.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function redPrimero(req, limiteMs = 2500) {
  const cache = await caches.open(cachePrincipal);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('lenta')), limiteMs)),
    ]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const guardado = await cache.match(req, { ignoreSearch: true });
    if (guardado) return guardado;
    // Red lenta pero sin copia: espera la respuesta real sin límite.
    return fetch(req);
  }
}

async function cachePrimero(req, nombre) {
  const cache = await caches.open(nombre);
  const guardado = await cache.match(req);
  const refrescar = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
  return guardado || (await refrescar) || Response.error();
}

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      evento.respondWith(redPrimero(new Request('index.html')).catch(async () => (await caches.match('./')) || Response.error()));
    } else if (MEDIOS.test(url.pathname)) {
      evento.respondWith(cachePrimero(req, cachePrincipal));
    } else {
      evento.respondWith(redPrimero(req));
    }
    return;
  }
  if (EXTERNOS_PERMITIDOS.includes(url.hostname)) {
    evento.respondWith(cachePrimero(req, `${PREFIJO}ejecucion`));
  }
  // Cualquier otro dominio (Firestore, Auth…) pasa directo.
});

self.addEventListener('message', (e) => { if (e.data === 'saltar-espera') self.skipWaiting(); });
