/** Pruebas del currículo en cliente. node tests/curriculo.test.mjs */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import * as C from '../js/lessons/curriculo.js';
import { existeCaracter } from '../js/lessons/teclado-datos.js';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
C._inyectarCargador(async (r) => JSON.parse(await readFile(join(RAIZ, r), 'utf8')));
let ok = 0, mal = 0;
const t = (n, c, extra = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : ' ' + extra}`); };

const idx = await C.cargarIndice();
console.log(`Índice: ${idx.length} lecciones`);
t('al menos 140 lecciones', idx.length >= 140);
t('10 mundos', new Set(idx.map((l) => l.mundo)).size === 10);
t('ids únicos', new Set(idx.map((l) => l.id)).size === idx.length);

// Todas las lecciones: estructura y teclado
let errores = [];
let total = 0, minutosEstimados = 0;
for (let m = 1; m <= 10; m++) {
  const { lecciones } = await C.cargarMundo(m);
  for (const l of lecciones) {
    total++;
    if (l.ejercicios.length !== 3) errores.push(`${l.id}: no tiene 3 ejercicios`);
    for (const e of l.ejercicios) {
      if (!e.texto || e.texto.length < 12) errores.push(`${l.id}/${e.t}: texto corto`);
      for (const c of e.texto) if (!existeCaracter(c, 'es-LA')) errores.push(`${l.id}: "${c}" no se puede teclear`);
      if (e.texto !== e.texto.trim() || /\s\s/.test(e.texto)) errores.push(`${l.id}/${e.t}: espacios`);
    }
    if (!l.objetivo) errores.push(`${l.id}: sin objetivo`);
    // tiempo estimado a 10 PPM (50 caracteres/min) en grado 4
    minutosEstimados += l.ejercicios.reduce((s, e) => s + (e.modo === 'tiempo' ? e.seg / 60 : C.textoParaGrado(e, l, 4).length / 50), 0);
  }
}
t(`estructura y teclado de ${total} lecciones`, errores.length === 0, errores.slice(0, 5).join(' | '));
console.log(`  · Tiempo guiado estimado (10 PPM, 4.º): ${(minutosEstimados / 60).toFixed(1)} horas`);

// Desbloqueo
const est0 = C.estadoLecciones(idx, {});
t('solo la primera lección está disponible al inicio', est0[idx[0].id] === 'actual' && est0[idx[1].id] === 'bloqueada');
const est1 = C.estadoLecciones(idx, { [idx[0].id]: { estrellas: 1 } });
t('con 1★ se abre la siguiente', est1[idx[0].id] === 'completada' && est1[idx[1].id] === 'actual');
const est2 = C.estadoLecciones(idx, { [idx[0].id]: { estrellas: 0 } });
t('con 0★ NO se abre la siguiente', est2[idx[1].id] === 'bloqueada');
const est3 = C.estadoLecciones(idx, {}, { mundosAbiertos: [3] });
t('el docente puede abrir un mundo', est3[idx.find((l) => l.mundo === 3).id] === 'disponible');

// Estrellas
const leccion = (await C.cargarLeccion('m1-l01'));
t('lección m1-l01 carga', leccion && leccion.id === 'm1-l01');
t('3★ en grado 4 con 8 PPM y 95 % en la lección 1', C.calcularEstrellas({ ppm: 8, precision: 95 }, leccion, 4) === 3);
t('2★ con precisión justa', C.calcularEstrellas({ ppm: 6, precision: 87 }, leccion, 4) === 2);
t('1★ con muy baja velocidad pero precisión aceptable', C.calcularEstrellas({ ppm: 1, precision: 80 }, leccion, 4) === 1);
t('0★ con 60 % de precisión', C.calcularEstrellas({ ppm: 20, precision: 60 }, leccion, 4) === 0);
const jefe = await C.cargarLeccion('m10-l16');
t('el jefe final exige más (10 PPM no basta en 6.º)', C.calcularEstrellas({ ppm: 10, precision: 93 }, jefe, 6) < 3);

// Ajuste por grado
const p = (await C.cargarLeccion('m4-l03')).ejercicios[2];
const l4 = await C.cargarLeccion('m4-l03');
const largos = [2, 3, 4, 5, 6].map((g) => C.textoParaGrado(p, l4, g).length);
t(`textos más largos con el grado (${largos.join(' < ')})`, largos.every((x, i) => i === 0 || x >= largos[i - 1]) && largos[0] < largos[4]);
t('el corte nunca deja una palabra a medias', [2, 3, 5].every((g) => { const x = C.textoParaGrado(p, l4, g); return p.texto.startsWith(x) && (p.texto[x.length] === ' ' || p.texto[x.length] === undefined); }));

console.log(`\n${ok} correctas, ${mal} con fallo`);
process.exit(mal ? 1 : 0);
