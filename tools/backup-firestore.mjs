#!/usr/bin/env node
/**
 * Respaldo COMPLETO de Firestore a un archivo JSON comprimido (y cifrado si defines BACKUP_PASSPHRASE).
 *
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' \
 *   BACKUP_PASSPHRASE='frase-larga-secreta' \
 *   node tools/backup-firestore.mjs [carpeta-salida]
 *
 * - Recorre TODAS las colecciones y subcolecciones (users, sessions, classes, …).
 * - Conserva tipos especiales: Timestamp → {"__ts": ISO}, referencias → {"__ref": ruta}.
 * - Cifrado AES-256-GCM (clave derivada con scrypt). Sin frase, se guarda sin cifrar (¡no lo subas a un sitio público!).
 * - En pruebas locales usa el emulador si existe FIRESTORE_EMULATOR_HOST.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { gzipSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, scryptSync, createCipheriv } from 'node:crypto';
import { join } from 'node:path';

const salida = process.argv[2] || 'respaldos';
const proyecto = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

if (process.env.FIRESTORE_EMULATOR_HOST) {
  initializeApp({ projectId: proyecto || 'demo-teclea' });
} else {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error('Falta FIREBASE_SERVICE_ACCOUNT (JSON de la cuenta de servicio).'); process.exit(1); }
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

/** Convierte valores de Firestore a JSON sin perder tipos. */
function aJSON(v) {
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Timestamp) return { __ts: v.toDate().toISOString() };
  if (v instanceof DocumentReference) return { __ref: v.path };
  if (v instanceof GeoPoint) return { __geo: [v.latitude, v.longitude] };
  if (Array.isArray(v)) return v.map(aJSON);
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aJSON(x)]));
}

const documentos = [];
async function recorrer(refColecciones) {
  for (const col of refColecciones) {
    const snap = await col.get();
    for (const d of snap.docs) {
      documentos.push({ ruta: d.ref.path, datos: aJSON(d.data()) });
      await recorrer(await d.ref.listCollections());
    }
  }
}
await recorrer(await db.listCollections());

const cuerpo = JSON.stringify({ formato: 'teclea-backup-1', creadoEn: new Date().toISOString(), total: documentos.length, documentos });
let datos = gzipSync(Buffer.from(cuerpo));
let ext = 'json.gz';

if (process.env.BACKUP_PASSPHRASE) {
  const sal = randomBytes(16), iv = randomBytes(12);
  const clave = scryptSync(process.env.BACKUP_PASSPHRASE, sal, 32);
  const cif = createCipheriv('aes-256-gcm', clave, iv);
  const cifrado = Buffer.concat([cif.update(datos), cif.final()]);
  datos = Buffer.concat([Buffer.from('TKB1'), sal, iv, cif.getAuthTag(), cifrado]);
  ext = 'json.gz.enc';
} else {
  console.warn('⚠️  Sin BACKUP_PASSPHRASE: el respaldo NO está cifrado.');
}

const sello = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
await mkdir(salida, { recursive: true });
const archivo = join(salida, `teclea-backup-${sello}.${ext}`);
await writeFile(archivo, datos);
console.log(`✔ Respaldo: ${archivo} · ${documentos.length} documentos · ${(datos.length / 1024).toFixed(1)} KB`);
