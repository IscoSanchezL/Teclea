/**
 * Prueba de carga del FRONT-END: N estudiantes abren la app a la vez (por defecto 30) y recorren
 * entrada → inicio → perfil → cambio de tema. Mide tiempos y errores de consola.
 *   node carga.mjs [N] [URL]      (requiere servidor local: python3 -m http.server 8123)
 * No mide Firestore (para eso: consola de Firebase → Uso, o k6 contra el emulador).
 */
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const N = Number(process.argv[2] || 30), URL = process.argv[3] || 'http://localhost:8123/';
const navegador = await chromium.launch();
const errores = [], tiempos = [];

async function estudiante(i) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`#${i} ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errores.push(`#${i} ${m.text()}`); });
  const t0 = Date.now();
  await p.goto(URL + '#/entrar');
  await p.click(`button:has-text("Estudiante ${2 + (i % 5)}.º")`);
  await p.waitForSelector('.tiles, .mapa, .modulos', { timeout: 20000 });
  const tInicio = Date.now() - t0;
  await p.click('a[href="#/perfil"].nav-item, a[href="#/perfil"].avatar-mini');
  await p.waitForSelector('.perfil', { timeout: 20000 });
  await p.click('.topbar .btn--icono');
  tiempos.push(tInicio);
  await ctx.close();
}

const t0 = Date.now();
const res = await Promise.allSettled(Array.from({ length: N }, (_, i) => estudiante(i)));
const fallidos = res.filter((r) => r.status === 'rejected');
tiempos.sort((a, b) => a - b);
const pct = (q) => tiempos[Math.min(tiempos.length - 1, Math.floor(tiempos.length * q))];
console.log(`${N} estudiantes simultáneos · ${((Date.now() - t0) / 1000).toFixed(1)} s en total`);
console.log(`Entrada→inicio: mediana ${pct(0.5)} ms · p95 ${pct(0.95)} ms · máx ${tiempos.at(-1)} ms`);
console.log(`Sesiones completadas: ${N - fallidos.length}/${N} · errores de consola/página: ${errores.length}`);
fallidos.forEach((f) => console.log('  fallo:', String(f.reason).split('\n')[0]));
errores.slice(0, 5).forEach((e) => console.log('  ', e));
await navegador.close();
process.exit(fallidos.length || errores.length ? 1 : 0);
