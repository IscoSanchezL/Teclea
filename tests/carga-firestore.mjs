/**
 * Carga de DATOS: 25 estudiantes (procesos independientes, cada uno con su sesión y las reglas reales) hacen
 * actividades al mismo tiempo contra el emulador de Firestore. Mide tiempos, fallos y que cada uno conserve su XP.
 *   cd tests && firebase emulators:exec --only firestore --project demo-teclea "node carga-firestore.mjs 25 8"
 */
import { spawn } from 'node:child_process';
const N = Number(process.argv[2] || 25), ACT = Number(process.argv[3] || 8);
const t0 = Date.now();
const salidas = await Promise.all(Array.from({ length: N }, (_, i) => new Promise((res) => {
  let out = ''; const p = spawn('node', ['carga-estudiante.mjs', String(i + 1), String(ACT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', () => {});
  p.on('close', () => { try { res(JSON.parse(out.trim().split('\n').filter((l) => l.startsWith('{')).pop())); } catch { res({ i: i + 1, tiempos: [], fallos: ACT, ultimoError: 'sin salida' }); } });
})));
const todos = salidas.flatMap((s) => s.tiempos).sort((a, b) => a - b);
const pct = (q) => todos[Math.min(todos.length - 1, Math.floor(todos.length * q))];
const fallos = salidas.reduce((a, s) => a + s.fallos, 0);
const sinXp = salidas.filter((s) => !(s.xp > 0)).length;
console.log(`${N} estudiantes × ${ACT} actividades simultáneas · ${((Date.now() - t0) / 1000).toFixed(1)} s en total`);
console.log(`Guardar una actividad: mediana ${pct(0.5)} ms · p95 ${pct(0.95)} ms · máx ${todos.at(-1)} ms`);
console.log(`Escrituras fallidas: ${fallos} · estudiantes sin XP guardado: ${sinXp}`);
salidas.filter((s) => s.fallos).slice(0, 3).forEach((s) => console.log('  fallo:', s.i, s.ultimoError));
process.exit(fallos || sinXp ? 1 : 0);
