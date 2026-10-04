/** Un estudiante simulado: hace N actividades reales (registrarActividad) contra el emulador con reglas. Lo lanza carga-firestore.mjs. */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as P from '../js/db/progreso.js';
import { MotorEscritura } from '../js/lessons/motor.js';

const i = Number(process.argv[2]), N = Number(process.argv[3] || 8), uid = `est${i}`;
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } });
const perfil = { uid, nombre: `Estudiante ${i}`, apodo: `E${i}`, email: null, rol: 'estudiante', grado: 2 + (i % 5), avatar: { emoji: '🦊' }, xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, ultimoDia: null, protectores: 0, prefs: {}, authTipo: 'pin', activo: true, creadoPor: 'prof1', creadoEn: fs.Timestamp.now(), ultimaConexion: fs.Timestamp.now(), consentimiento: { porDocente: true, en: Date.now() } };
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await fs.setDoc(fs.doc(db, `users/${uid}`), perfil);
  await fs.setDoc(fs.doc(db, `enrollments/c1_${uid}`), { uid, classId: 'c1', docenteId: 'prof1', codigo: 'ABC234', alias: `E${i}`, stats: { xp: 0 }, unidoEn: fs.Timestamp.now() });
});
const dbEst = env.authenticatedContext(uid).firestore();
state.modo = 'firebase'; state.user = { ...perfil, creadoEn: undefined };
store._inyectarFirebase({ fs, db: dbEst }); P._reiniciarCache();
const texto = 'fjf jfj fff jjj fjfj jfjf fj jf';
const tiempos = []; let fallos = 0, ultimoError = '';
await new Promise((r) => setTimeout(r, 800)); // todos arrancan juntos
for (let k = 0; k < N; k++) {
  let ms = 0; const m = new MotorEscritura({ texto, reloj: () => ms }); [...texto].forEach((c) => { m.escribir(c); ms += 380; });
  const leccion = { id: `m1-l0${(k % 9) + 1}`, mundo: 1, ejercicios: [{}, {}, {}], meta: { precision: 0.85, ppm: 0.3 } };
  const t0 = Date.now();
  try { await P.registrarActividad({ user: state.user, tipo: 'leccion', refId: leccion.id, resultado: m.resultado(), leccion, estrellas: 3, porTecla: m.porTecla }); tiempos.push(Date.now() - t0); }
  catch (e) { fallos++; ultimoError = e.message || String(e); }
}
const u = await store.leer(`users/${uid}`).catch(() => null);
console.log(JSON.stringify({ i, tiempos, fallos, ultimoError, xp: u?.xp ?? null }));
process.exit(0);
