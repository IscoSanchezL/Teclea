/**
 * Perfiles creados con versiones antiguas (sin protectores / rachaMax / racha) deben poder ganar monedas y comprar.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let ok = 0, mal = 0;
const t = (n, c) => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}`); };
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(join(RAIZ, 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  // Perfil "viejo": sin protectores, rachaMax, racha, ultimoDia ni prefs
  await fs.setDoc(fs.doc(db, 'users/viejo'), { uid: 'viejo', nombre: 'Est Viejo', apodo: 'Viejo', rol: 'estudiante', grado: 3, avatar: { emoji: '🦊', fondo: 'violeta' }, xp: 10, nivel: 1, monedas: 100, activo: true });
  await fs.setDoc(fs.doc(db, 'shop_items/acc-1'), { nombre: 'Gorra', precio: 40, categoria: 'accesorio' });
});
const db = env.authenticatedContext('viejo').firestore();

console.log('Perfil antiguo');
t('ganar XP y monedas (con racha y protectores nuevos)', await assertSucceeds(fs.updateDoc(fs.doc(db, 'users/viejo'), { xp: 60, monedas: 112, nivel: 1, racha: 1, rachaMax: 1, protectores: 0, ultimoDia: '2026-03-11' })).then(() => true, () => false));
await env.withSecurityRulesDisabled((ctx) => fs.setDoc(fs.doc(ctx.firestore(), 'users/viejo2'), { uid: 'viejo2', nombre: 'Otro', apodo: 'Otro', rol: 'estudiante', grado: 3, avatar: { emoji: '🦊', fondo: 'violeta' }, xp: 10, nivel: 1, monedas: 100 }));
const db2 = env.authenticatedContext('viejo2').firestore();
t('ganar monedas sin tocar racha/protectores', await assertSucceeds(fs.updateDoc(fs.doc(db2, 'users/viejo2'), { xp: 50, monedas: 110 })).then(() => true, () => false));
const b = fs.writeBatch(db2);
b.update(fs.doc(db2, 'users/viejo2'), { monedas: 70 });
b.set(fs.doc(db2, 'inventory/viejo2_acc-1'), { uid: 'viejo2', itemId: 'acc-1', compradoEn: fs.serverTimestamp(), equipado: false });
t('comprar en la tienda', await b.commit().then(() => true, () => false));
t('protectores gratis siguen prohibidos', await assertFails(fs.updateDoc(fs.doc(db2, 'users/viejo2'), { protectores: 2 })).then(() => true, () => false));
t('monedas +301 siguen prohibidas', await assertFails(fs.updateDoc(fs.doc(db2, 'users/viejo2'), { monedas: 500 })).then(() => true, () => false));
console.log(`\n${ok} ok, ${mal} mal`);
await env.cleanup(); process.exit(mal ? 1 : 0);
