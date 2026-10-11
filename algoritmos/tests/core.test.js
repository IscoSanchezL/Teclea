// Ejecutar: node algoritmos/tests/core.test.js
const assert = require('assert');
const core = require('../js/core.js');

let n = 0;
for (const nivel of core.TABLERO) {
  const r = core.simular(nivel, nivel.sol);
  assert.ok(r.ok, `La solución de ${nivel.id} debe ganar (choco=${r.choco}, llego=${r.llego}, faltan=${r.faltan})`);
  assert.strictEqual(core.estrellasGanadas(nivel, nivel.sol), 3, `${nivel.id}: la solución de referencia da 3 estrellas`);
  if (nivel.maxBlocks) assert.ok(nivel.sol.length <= nivel.maxBlocks, `${nivel.id}: respeta maxBlocks`);
  assert.ok(nivel.sol.every((b) => nivel.allowed.includes(b.c)), `${nivel.id}: solo usa bloques permitidos`);
  assert.ok(nivel.rep || nivel.sol.every((b) => b.n === 1), `${nivel.id}: sin repetir cuando no se permite`);
  n++;
}

// Choque contra la pared y contra el borde
const t7 = core.TABLERO.find((t) => t.id === 't7');
assert.ok(core.simular(t7, [{ c: 'F', n: 1 }]).choco, 'chocar con la roca');
assert.ok(core.simular(core.TABLERO[0], [{ c: 'L', n: 1 }, { c: 'F', n: 1 }]).choco, 'chocar con el borde');
// Llegar sin recoger todas las estrellas no gana
const t10 = core.TABLERO.find((t) => t.id === 't10');
const r = core.simular(t10, [{ c: 'R', n: 1 }, { c: 'F', n: 4 }, { c: 'L', n: 1 }, { c: 'F', n: 4 }]);
assert.ok(r.llego && r.faltan > 0 && !r.ok, 'sin todas las estrellas no es victoria');

// Todos los ids únicos
const ids = core.NIVELES.map((x) => x.id);
assert.strictEqual(new Set(ids).size, ids.length, 'ids únicos');

console.log(`OK: ${n} niveles de tablero verificados, ${ids.length} niveles en total.`);
