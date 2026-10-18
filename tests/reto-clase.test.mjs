import assert from 'node:assert/strict';
import { puntos, armarParejas, validarMensaje, repartirMensajes, rankingParejas, rankingIndividual, armarTextoReto } from '../js/game/reto-clase.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// puntos: precisión pesa al cuadrado
ok(puntos(40, 100) === 400, 'puntos 100%');
ok(puntos(40, 90) === 324, 'puntos 90%');
ok(puntos(40, 100) > puntos(60, 70), 'precisión pesa más que velocidad');
ok(puntos(NaN, 200) === 0, 'entradas raras');

// parejas
for (const total of [2, 3, 4, 5, 8, 11]) {
  const al = Array.from({ length: total }, (_, i) => ({ uid: `u${i}`, alias: `A${i}` }));
  const p = armarParejas(al);
  const uids = p.flatMap((x) => x.uids);
  ok(uids.length === total && new Set(uids).size === total, `todos en una pareja (${total})`);
  ok(p.every((x) => x.uids.length >= 2 || total === 1), `sin solitarios (${total})`);
  ok(p.every((x) => x.uids.length <= 3), 'máximo trío');
}
ok(armarParejas([{ uid: 'a', alias: 'A' }]).length === 1, 'un solo alumno');

// mensajes
ok(validarMensaje('  Hola   amigo  mío  ').texto === 'Hola amigo mío', 'normaliza espacios');
ok(validarMensaje('Hola').error === 'corto', 'corto');
ok(validarMensaje('a'.repeat(91)).error === 'largo', 'largo');
ok(validarMensaje('Visita http://x.co <b>').error === 'raro', 'raro');
ok(validarMensaje('¿Cómo estás, María? ¡Muy bien!').ok, 'tildes y signos');

// reparto: nadie recibe el suyo, y los mensajes se usan parejo
for (let k = 0; k < 300; k++) {
  const jug = Array.from({ length: 2 + (k % 26) }, (_, i) => `u${i}`);
  const aut = jug.filter((_, i) => i % 3 !== 2 || k % 2); // algunos no escribieron
  if (new Set(aut).size < 2) continue;
  const r = repartirMensajes(jug, aut);
  ok(jug.every((j) => r[j] && r[j] !== j && aut.includes(r[j])), `nadie recibe el propio (k=${k})`);
  const usos = Object.values(r).reduce((m, a) => (m[a] = (m[a] || 0) + 1, m), {});
  const v = Object.values(usos);
  ok(Math.max(...v) - Math.min(...v) <= 2, `reparto parejo (k=${k})`);
}
assert.throws(() => repartirMensajes(['a', 'b'], ['a']), /al menos 2/); n++;

// rankings
const parejas = [{ n: 1, uids: ['a', 'b'], alias: ['Ana', 'Beto'] }, { n: 2, uids: ['c', 'd'], alias: ['Cami', 'Dani'] }, { n: 3, uids: ['e', 'f'], alias: ['Eli', 'Fer'] }];
const ent = [
  { uid: 'a', terminado: true, puntos: 300, wpm: 30, precision: 100 }, { uid: 'b', terminado: true, puntos: 200, wpm: 25, precision: 90 },
  { uid: 'c', terminado: true, puntos: 600, wpm: 40, precision: 95 }, { uid: 'd', terminado: false },
  { uid: 'e', terminado: true, puntos: 500, wpm: 35, precision: 95 }, { uid: 'f', terminado: true, puntos: 0, wpm: 0, precision: 0 },
];
const rp = rankingParejas(parejas, ent);
ok(rp[0].puntos >= rp[1].puntos && rp[1].puntos >= rp[2].puntos, 'ordenado por puntos');
ok(rp.find((x) => x.n === 2).terminaron === 1 && rp.find((x) => x.n === 2).total === 2, 'pareja incompleta cuenta lo que hay');
ok(rp[0].puesto === 1 && rp.at(-1).puesto >= 2, 'puestos');
const ri = rankingIndividual([{ uid: 'a', alias: 'A', terminado: true, puntos: 10, wpm: 1, precision: 90 }, { uid: 'b', alias: 'B', terminado: true, puntos: 10, wpm: 1, precision: 90 }, { uid: 'c', alias: 'C', terminado: false }, { uid: 'd', alias: 'D', terminado: true, puntos: 50, wpm: 5, precision: 99 }]);
ok(ri.length === 3 && ri[0].uid === 'd' && ri[1].puesto === 2 && ri[2].puesto === 2, 'empate comparte puesto');

// texto
const bancoTxt = Array.from({ length: 40 }, (_, i) => ({ nivel: 2, tema: 't', texto: `Frase número ${i} para practicar con calma.` }));
ok(armarTextoReto(bancoTxt, { seg: 60 }).length >= 200, 'texto suficiente');
console.log(`reto-clase: ${n} comprobaciones OK`);
