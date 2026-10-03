#!/usr/bin/env node
/**
 * Genera precache.json: lista de archivos que el service worker guarda para funcionar SIN internet
 * y una versión (hash del contenido). Cambia el hash → los dispositivos descargan la versión nueva.
 *
 *   node tools/generar-precache.mjs
 *
 * Se ejecuta automáticamente en el flujo de GitHub Pages. No toca el SDK de Firebase ni las
 * fuentes: esos los guarda el service worker en caché de ejecución la primera vez que se usan.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CARPETAS = ['css', 'js', 'data', 'assets'];
const RAIZ_ARCHIVOS = ['index.html', 'manifest.webmanifest'];
const EXT_OK = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg', '.webp', '.png', '.jpg', '.mp3', '.ogg', '.woff2']);

async function* recorrer(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) yield* recorrer(ruta);
    else yield ruta;
  }
}

const archivos = [...RAIZ_ARCHIVOS];
for (const c of CARPETAS) {
  for await (const f of recorrer(join(RAIZ, c))) {
    if (EXT_OK.has(extname(f).toLowerCase())) archivos.push(relative(RAIZ, f).split('\\').join('/'));
  }
}
archivos.sort();

const hash = createHash('sha256');
for (const a of archivos) { hash.update(a); hash.update(await readFile(join(RAIZ, a))); }
const version = hash.digest('hex').slice(0, 12);

await writeFile(join(RAIZ, 'precache.json'), JSON.stringify({ version, archivos }, null, 2) + '\n');
console.log(`precache.json: ${archivos.length} archivos, versión ${version}`);
