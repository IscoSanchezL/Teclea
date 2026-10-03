/**
 * Prueba de modo SIN CONEXIÓN: carga la app, espera al service worker, corta la red y recarga.
 *   node offline.mjs [URL]
 */
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const URL = process.argv[2] || 'http://localhost:8123/';
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(URL + '#/entrar');
await p.evaluate(() => navigator.serviceWorker.ready);
await p.waitForFunction(() => navigator.serviceWorker.controller || true);
await p.reload(); await p.waitForSelector('summary:has-text("Modo demostración")');
await p.waitForTimeout(2500); // deja terminar el precaché
const guardados = await p.evaluate(async () => { let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return n; });
console.log(`Archivos en caché: ${guardados}`);

await ctx.setOffline(true);
await p.reload();
await p.waitForSelector('summary:has-text("Modo demostración")', { timeout: 10000 });
console.log('✓ Recarga SIN internet: la pantalla de entrada carga');
await p.click('summary:has-text("Modo demostración")'); await p.click('button:has-text("Estudiante 4.º")');
await p.waitForSelector('.tiles', { timeout: 10000 });
console.log('✓ Navegación y entrada en modo demo SIN internet');
await p.click('a[href="#/perfil"].avatar-mini'); await p.waitForSelector('.perfil');
console.log('✓ Perfil y ajustes SIN internet');
await p.waitForSelector('.red--off.red--visible', { timeout: 3000 });
console.log('✓ Aviso "Sin internet" visible');
await ctx.setOffline(false);
await p.waitForSelector('.red--on.red--visible', { timeout: 3000 });
console.log('✓ Aviso "Conectado" al volver la red');
console.log(errores.length ? `Errores: ${errores.join(' | ')}` : '✓ Sin errores de página');
await b.close();
process.exit(errores.length ? 1 : 0);
