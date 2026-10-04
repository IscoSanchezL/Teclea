/**
 * Gamificación contra las reglas reales (emulador): medallas, contadores, tienda, protectores y retos diarios.
 */
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as P from '../js/db/progreso.js';
import * as I from '../js/game/insignias.js';
import * as T from '../js/db/tienda.js';
import * as R from '../js/game/retos.js';
import * as C from '../js/lessons/curriculo.js';
import { actualizarRacha } from '../js/game/xp.js';
import { MotorEscritura } from '../js/lessons/motor.js';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leerJSON = async (r) => JSON.parse(await readFile(join(RAIZ, r), 'utf8'));
C._inyectarCargador(leerJSON); I._inyectarCargador(leerJSON); T._inyectarCargador(leerJSON);
let ok = 0, mal = 0;
const t = (n, c, extra = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : '  ' + extra}`); };

console.log('Reglas de racha (puras)');
t('día consecutivo suma', actualizarRacha({ racha: 3, rachaMax: 3, ultimoDia: '2026-03-10', protectores: 0 }, '2026-03-11').racha === 4);
t('mismo día no cambia', actualizarRacha({ racha: 3, rachaMax: 3, ultimoDia: '2026-03-11' }, '2026-03-11').cambio === false);
t('se pierde con 2 días sin protector → 1', actualizarRacha({ racha: 5, rachaMax: 5, ultimoDia: '2026-03-08' }, '2026-03-11').racha === 1);
const prot = actualizarRacha({ racha: 5, rachaMax: 5, ultimoDia: '2026-03-09', protectores: 1 }, '2026-03-11');
t('un protector cubre UN día perdido', prot.racha === 6 && prot.protectores === 0 && prot.usoProtector);
t('cruce de mes y de año', actualizarRacha({ racha: 1, rachaMax: 1, ultimoDia: '2025-12-31' }, '2026-01-01').racha === 2);

const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(join(RAIZ, 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
const perfil = { uid: 'est1', nombre: 'Est Uno', apodo: 'Uno', email: null, rol: 'estudiante', grado: 4, avatar: { emoji: '🦊', fondo: 'violeta' }, xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, ultimoDia: null, protectores: 0, prefs: {}, authTipo: 'pin', activo: true, creadoPor: null, creadoEn: fs.Timestamp.now(), ultimaConexion: fs.Timestamp.now(), consentimiento: { version: '2026-01', aceptadoEn: fs.Timestamp.now() } };
const badges = (await leerJSON('data/badges.json')).insignias, shop = (await leerJSON('data/shop.json')).items;
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await fs.setDoc(fs.doc(db, 'users/est1'), { ...perfil, monedas: 300 });
  for (const b of badges) await fs.setDoc(fs.doc(db, `badges/${b.id}`), { nombre: b.nombre });
  for (const i of shop) await fs.setDoc(fs.doc(db, `shop_items/${i.id}`), { nombre: i.nombre, precio: i.precio, categoria: i.categoria });
});
const dbEst = env.authenticatedContext('est1').firestore();
state.modo = 'firebase'; state.user = { ...perfil, monedas: 300 };
store._inyectarFirebase({ fs, db: dbEst }); P._reiniciarCache(); I._reiniciar(); T._reiniciar();

console.log('\nMedallas con las reglas (el catálogo debe existir en Firestore)');
const leccion = await C.cargarLeccion('m1-l01');
const texto = 'fjf jfj fff jjj fjfj jfjf fj jf fjf jfj';
let ms = 0; const m = new MotorEscritura({ texto, reloj: () => ms }); for (const c of texto) { m.escribir(c); ms += 200; }
const res = m.resultado();
const resumen = await P.registrarActividad({ user: state.user, tipo: 'leccion', refId: leccion.id, resultado: res, leccion, estrellas: 3, porTecla: m.porTecla });
let nuevas;
try { nuevas = await I.evaluarInsignias({ user: resumen.usuario, evento: 'leccion', leccion, estrellas: 3, resultado: res, resumen }); t('evaluar medallas pasa las reglas', true); }
catch (e) { t('evaluar medallas pasa las reglas', false, e.message); console.log(e); process.exit(1); }
const ids = nuevas.map((x) => x.id);
t(`primera lección + 3 estrellas (${ids.join(', ')})`, ids.includes('primera-leccion') && ids.includes('tres-estrellas'));
t('precisión 100 % con ≥ 60 caracteres no aplica con 39 caracteres', !ids.includes('precision-100'));
t('racha 1 no da medalla de racha', !ids.some((x) => x.startsWith('racha')));
const sin = await I.evaluarInsignias({ user: resumen.usuario, evento: 'leccion', leccion, estrellas: 3, resultado: res, resumen: { racha: { cambio: false } } });
t('las medallas no se repiten', sin.length === 0);
const cont = (await store.leer('contadores/est1')).c;
t('contadores guardados (sesiones, días)', cont.sesiones >= 1 && cont.dias === 1);
const guardadas = await store.consultar('badges_earned', { donde: [['uid', '==', 'est1']] });
t('medallas guardadas en Firestore', guardadas.length === nuevas.length);

console.log('\nTienda');
const u0 = (await store.leer('users/est1'));
const gorra = shop.find((x) => x.nombre === 'Gorra'), fondo = shop.find((x) => x.id === 'fondo-coral'), tema = shop.find((x) => x.id === 'tema-bosque');
let u = u0;
try { u = await T.comprar({ ...state.user, monedas: u0.monedas }, gorra); t('comprar un accesorio pasa las reglas (monedas descontadas atómicamente)', true); } catch (e) { t('comprar un accesorio pasa las reglas', false, e.message); }
const u1 = await store.leer('users/est1');
t(`monedas: ${u0.monedas} → ${u1.monedas} (−${gorra.precio})`, u1.monedas === u0.monedas - gorra.precio);
t('inventario creado', (await store.consultar('inventory', { donde: [['uid', '==', 'est1']] })).length === 1);
let repetida = false; try { await T.comprar(state.user, gorra); } catch (e) { repetida = /Ya tienes/.test(e.message); }
t('no se puede comprar dos veces lo mismo', repetida);
let sinSaldo = false; try { await T.comprar({ ...state.user, monedas: 5 }, shop.find((x) => x.id === 'tema-neon')); } catch (e) { sinSaldo = /faltan monedas/.test(e.message); }
t('sin saldo: se rechaza', sinSaldo);
const regalo = await assertFails(fs.setDoc(fs.doc(dbEst, 'inventory/est1_acc-1'), { uid: 'est1', itemId: 'acc-1', compradoEn: fs.serverTimestamp(), equipado: false })).then(() => true).catch(() => false);
t('NO se puede crear inventario sin pagar (regalo)', regalo);
await T.comprar(state.user, fondo); await T.comprar(state.user, tema);
try { await T.equipar(state.user, gorra, true); await T.equipar(state.user, fondo, true); await T.equipar(state.user, tema, true); t('equipar accesorio, fondo y tema pasa las reglas', true); } catch (e) { t('equipar pasa las reglas', false, e.message); }
const u2 = await store.leer('users/est1');
t('avatar con accesorio y fondo; tema en prefs', u2.avatar.accesorios.includes('🧢') && u2.avatar.fondo === 'coral' && u2.prefs.temaColor === 'bosque');
// Mi cuarto: mascota, decoración por zona, escena y un accesorio por zona
{
  const mascota = shop.find((x) => x.id === 'mas-gato'), sofa = shop.find((x) => x.id === 'deco-sofa'), planta = shop.find((x) => x.id === 'deco-planta'), escena = shop.find((x) => x.id === 'escena-espacio'), corona = shop.find((x) => x.id === 'acc-1');
  await env.withSecurityRulesDisabled((ctx) => fs.updateDoc(fs.doc(ctx.firestore(), 'users/est1'), { monedas: 2000 }));
  let ok = true, msg = '';
  try {
    let uu = await store.leer('users/est1');
    for (const it of [mascota, sofa, planta, escena, corona]) { uu = await T.comprar(uu, it); uu = await T.equipar(uu, it, true); }
  } catch (e) { ok = false; msg = e.message; }
  t('comprar y poner mascota, decoración, escena y accesorio pasa las reglas', ok, msg);
  await env.withSecurityRulesDisabled((ctx) => fs.updateDoc(fs.doc(ctx.firestore(), 'users/est1'), { monedas: 65 })); // deja el estado listo para las pruebas siguientes
  const uc = await store.leer('users/est1');
  t('cuarto: mascota, escena y decoración guardadas', uc.avatar.mascota === 'gato' && uc.avatar.cuarto?.escena === 'espacio' && uc.avatar.cuarto?.deco?.izquierda === '🪴');
  t('un accesorio por zona: la corona reemplaza a la gorra (misma zona: cabeza)', uc.avatar.accesorios.includes('👑') && !uc.avatar.accesorios.includes('🧢'));
  const inv = await store.consultar('inventory', { donde: [['uid', '==', 'est1']] });
  t('solo una decoración puesta en el lado izquierdo', inv.filter((x) => x.equipado && ['deco-sofa', 'deco-planta'].includes(x.itemId)).length === 1);
}
const protector = shop.find((x) => x.id === 'protector-racha');
await T.comprar(state.user, protector);
t('protector de racha comprado (+1, −50)', (await store.leer('users/est1')).protectores === 1);
const gratis = await assertFails(fs.updateDoc(fs.doc(dbEst, 'users/est1'), { protectores: 2 })).then(() => true).catch(() => false);
t('NO se pueden obtener protectores gratis', gratis);

console.log('\nRetos diarios');
const retos = R.retosDelDia('2026-03-11', 4);
t('3 retos deterministas', retos.length === 3 && JSON.stringify(retos) === JSON.stringify(R.retosDelDia('2026-03-11', 4)));
t('distintos días → retos distintos', JSON.stringify(R.retosDelDia('2026-03-12', 4)) !== JSON.stringify(retos));
const hoy = { minutos: 20, lecciones: 3, precision: 99, juegos: 5, practicas: 2, mejorPpm: 99 };
t('todos se cumplen con un día muy activo', retos.every((r) => R.retoCumplido(r, hoy)));
t('ninguno con un día vacío', retos.every((r) => !R.retoCumplido(r, {})));
const antes = await store.leer('users/est1');
let rec; try { rec = await R.reclamarReto({ ...state.user, xp: antes.xp, monedas: antes.monedas }, retos[0]); t('reclamar recompensa pasa las reglas', true); } catch (e) { t('reclamar recompensa pasa las reglas', false, e.message); }
const despues = await store.leer('users/est1');
t('XP y monedas sumados', despues.xp === antes.xp + retos[0].xp && despues.monedas === antes.monedas + retos[0].monedas);
t('reclamado queda registrado', (await R.retosReclamados('est1', '2026-03-11')).has(retos[0].id));
await env.cleanup();

console.log(`\n${ok} correctas, ${mal} con fallo`);
process.exit(mal ? 1 : 0);
