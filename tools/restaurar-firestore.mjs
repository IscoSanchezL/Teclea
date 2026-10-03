#!/usr/bin/env node
/**
 * Restaura un respaldo creado con backup-firestore.mjs.
 *
 *   node tools/restaurar-firestore.mjs ARCHIVO [--confirmar] [--solo=users,classes]
 *
 * Sin --confirmar solo muestra qué restauraría (simulacro). Sobrescribe documentos con la misma ruta;
 * no borra los que no estén en el respaldo.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { gunzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { scryptSync, createDecipheriv } from 'node:crypto';

const [archivo, ...banderas] = process.argv.slice(2);
if (!archivo) { console.error('Uso: node tools/restaurar-firestore.mjs ARCHIVO [--confirmar] [--solo=col1,col2]'); process.exit(1); }
const confirmar = banderas.includes('--confirmar');
const solo = banderas.find((b) => b.startsWith('--solo='))?.slice(7).split(',');

if (process.env.FIRESTORE_EMULATOR_HOST) initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-teclea' });
else initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();

let datos = await readFile(archivo);
if (datos.subarray(0, 4).toString() === 'TKB1') {
  if (!process.env.BACKUP_PASSPHRASE) { console.error('El archivo está cifrado: define BACKUP_PASSPHRASE.'); process.exit(1); }
  const sal = datos.subarray(4, 20), iv = datos.subarray(20, 32), tag = datos.subarray(32, 48), cif = datos.subarray(48);
  const d = createDecipheriv('aes-256-gcm', scryptSync(process.env.BACKUP_PASSPHRASE, sal, 32), iv);
  d.setAuthTag(tag);
  try { datos = Buffer.concat([d.update(cif), d.final()]); } catch { console.error('Frase incorrecta o archivo dañado.'); process.exit(1); }
}
const { documentos, creadoEn } = JSON.parse(gunzipSync(datos).toString());

const deJSON = (v) => {
  if (v === null || typeof v !== 'object') return v;
  if ('__ts' in v) return Timestamp.fromDate(new Date(v.__ts));
  if ('__ref' in v) return db.doc(v.__ref);
  if ('__geo' in v) return new GeoPoint(...v.__geo);
  if (Array.isArray(v)) return v.map(deJSON);
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deJSON(x)]));
};

const lista = documentos.filter((d) => !solo || solo.includes(d.ruta.split('/')[0]));
console.log(`Respaldo del ${creadoEn}: ${lista.length} documentos a restaurar${solo ? ` (solo ${solo.join(', ')})` : ''}.`);
if (!confirmar) { console.log('Simulacro: no se escribió nada. Agrega --confirmar para restaurar.'); process.exit(0); }

let lote = db.batch(), n = 0;
for (const d of lista) {
  lote.set(db.doc(d.ruta), deJSON(d.datos));
  if (++n % 400 === 0) { await lote.commit(); lote = db.batch(); }
}
await lote.commit();
console.log(`✔ Restaurados ${n} documentos.`);
