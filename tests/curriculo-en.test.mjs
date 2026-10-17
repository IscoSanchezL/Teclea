// Currículo en inglés: cada lección tiene título/objetivo en inglés, los textos de práctica en inglés se pueden teclear
// y los datos *_en de mundos, medallas y tienda están completos. Uso: node curriculo-en.test.mjs
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { poner } from '../js/i18n/index.js';
import * as C from '../js/lessons/curriculo.js';
import { existeCaracter } from '../js/lessons/teclado-datos.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = async (r) => JSON.parse(await readFile(join(RAIZ, r), 'utf8'));
let ok = 0, mal = 0;
const t = (n, c) => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}`); };
C._inyectarCargador(leer);

poner('es');
const idxEs = await C.cargarIndice();
poner('en');
const idxEn = await C.cargarIndice();
t('144 lecciones en ambos idiomas', idxEs.length === 144 && idxEn.length === 144);
t('todos los títulos tienen versión en inglés distinta o igual de forma explícita', idxEn.every((l, i) => l.id === idxEs[i].id && l.titulo && !/[¿¡áéíóú ]{0}\b(Repaso de|Jefe:|Precisión con)\b/.test(l.titulo)));
const SOLO_ES = /[áéíóúüñ¿¡]/;
let sinObj = 0, sinEs = 0, raros = 0, textos = 0;
for (let m = 1; m <= 10; m++) {
  poner('es'); const es = await C.cargarMundo(m);
  poner('en'); const en = await C.cargarMundo(m);
  en.lecciones.forEach((l, i) => {
    if (l.objetivo === es.lecciones[i].objetivo && l.tipo !== 'nueva') sinObj++;
    if (/\b(Aprende|Escribe|Repasa|Demuestra|Mantén)\b/.test(l.objetivo)) sinObj++;
    if (l.tip && /\b(Las|Los|Para|Tus|Sube|La|En)\b /.test(l.tip) && l.tip === es.lecciones[i].tip) sinEs++;
    for (const e of l.ejercicios) {
      textos++;
      const cambia = e.texto !== es.lecciones[i].ejercicios[e.t === 'guiado' ? 0 : e.t === 'libre' ? 1 : 2]?.texto;
      if (cambia && SOLO_ES.test(e.texto.replace(/ñ/g, ''))) raros++;          // texto en inglés con caracteres del español
      if ([...e.texto].some((c) => !existeCaracter(c, 'es-LA'))) raros++;       // imposible de teclear
    }
  });
}
t('objetivos y tips traducidos', sinObj === 0 && sinEs === 0);
t(`ejercicios en inglés tecleables (${textos} revisados)`, raros === 0);
const tx = await leer('data/en/texts.json');
t('textos de práctica en inglés (>= 200) con nivel y tema', tx.textos.length >= 200 && tx.textos.every((x) => x.tema && x.nivel && x.texto && [...x.texto].every((c) => existeCaracter(c, 'es-LA'))));
t('hay textos de niveles 2 a 4', [2, 3, 4].every((n) => tx.textos.some((x) => x.nivel === n)));
const pal = await leer('data/en/palabras.json');
t('vocabulario en inglés para juegos (>= 500 palabras)', pal.sinTilde.length >= 500 && pal.sinTilde.every((w) => /^[a-z]+$/.test(w)));
for (const [f, k] of [['worlds', 'mundos'], ['badges', 'insignias'], ['shop', 'items']]) {
  const d = await leer(`data/${f}.json`);
  t(`${f}.json: nombre_en en todos los elementos`, d[k].every((x) => x.nombre_en) && d[k].every((x) => !x.descripcion || x.descripcion_en));
}
console.log(`\n${ok} correctas, ${mal} con fallo`);
process.exit(mal ? 1 : 0);
