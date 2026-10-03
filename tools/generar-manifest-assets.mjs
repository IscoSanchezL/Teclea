#!/usr/bin/env node
/**
 * Genera assets/assets.json escaneando assets/img (y subcarpetas).
 * Clave = nombre del archivo sin extensión. Valor = ruta relativa.
 *
 *   node tools/generar-manifest-assets.mjs
 *
 * Se ejecuta solo en GitHub Actions al publicar (ver .github/workflows/pages.yml),
 * así basta con subir tus imágenes a assets/img/... y hacer commit.
 * Si hay varias extensiones del mismo nombre, gana la primera de PRIORIDAD.
 */
import { readdir, writeFile } from 'node:fs/promises';
import { join, extname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CARPETA = join(RAIZ, 'assets', 'img');
const PRIORIDAD = ['.webp', '.png', '.svg', '.jpg', '.jpeg'];

async function* recorrer(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) yield* recorrer(ruta);
    else yield ruta;
  }
}

const mapa = {};
for await (const archivo of recorrer(CARPETA)) {
  const ext = extname(archivo).toLowerCase();
  if (!PRIORIDAD.includes(ext)) continue;
  const clave = basename(archivo, extname(archivo));
  if (clave === 'favicon') continue;
  const ruta = relative(RAIZ, archivo).split('\\').join('/');
  const actual = mapa[clave];
  if (!actual || PRIORIDAD.indexOf(ext) < PRIORIDAD.indexOf(extname(actual))) mapa[clave] = ruta;
}

const ordenado = Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(join(RAIZ, 'assets', 'assets.json'), JSON.stringify(ordenado, null, 2) + '\n');
console.log(`assets.json: ${Object.keys(ordenado).length} ilustraciones registradas`);
