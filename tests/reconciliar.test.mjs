/**
 * Un estudiante que trabajó ANTES de unirse a la clase (p. ej. en casa) debe verse con su avance real en el resumen del docente.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as P from '../js/db/progreso.js';
import { conSesiones } from '../js/db/analitica.js';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let ok = 0, mal = 0;
const t = (n, c, e = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : '  ' + e}`); };
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(join(RAIZ, 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
const perfil = { uid: 'geo', nombre: 'Geronimo Granados', apodo: 'Geronimo', rol: 'estudiante', grado: 3, authTipo: 'google', avatar: { emoji: '🦊', fondo: 'violeta' }, xp: 330, nivel: 3, monedas: 80, racha: 4, rachaMax: 4, protectores: 0, prefs: {}, activo: true };
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await fs.setDoc(fs.doc(db, 'users/geo'), perfil);
  await fs.setDoc(fs.doc(db, 'classes/c1'), { docenteId: 'prof', nombre: '3.º B', grado: 3, config: {} });
  // Trabajó en casa: 5 sesiones y 3 lecciones, SIN docente ni clase
  for (let k = 0; k < 5; k++) await fs.setDoc(fs.doc(db, `sessions/s${k}`), { uid: 'geo', tipo: 'leccion', refId: `m1-l0${k}`, wpm: 10 + k * 2, precision: 90 + k, errores: 2, duracionSeg: 120, caracteres: 150, dia: '2026-10-1' + k, creadoEn: fs.Timestamp.fromMillis(Date.now() - (6 - k) * 86400000) });
  for (let k = 1; k <= 3; k++) await fs.setDoc(fs.doc(db, `lessons_progress/geo_m1-l0${k}`), { uid: 'geo', lessonId: `m1-l0${k}`, mundo: 1, estrellas: 3, mejorWpm: 12, mejorPrecision: 95, intentos: 1, completada: true, docenteIds: [], actualizadoEn: fs.Timestamp.now() });
  // Se une a la clase DESPUÉS: resumen en cero
  await fs.setDoc(fs.doc(db, 'enrollments/c1_geo'), { uid: 'geo', classId: 'c1', docenteId: 'prof', codigo: 'ABC234', alias: 'Geronimo', grado: 3, estado: 'activo', stats: { xp: 0, sesiones: 0, minutos: 0, mejorWpm: 0, precisionProm: 0, medallas: 0, lecciones: 0, caracteres: 0 }, unidoEn: fs.Timestamp.now() });
});
state.modo = 'firebase'; state.user = perfil;
store._inyectarFirebase({ fs, db: env.authenticatedContext('geo').firestore() }); P._reiniciarCache();

console.log('Reconciliar el resumen de la clase');
let n; try { n = await P.reconciliarInscripciones(perfil, { forzar: true }); t(`pasa las reglas (${n} cambios)`, n >= 2); } catch (e) { t('pasa las reglas', false, e.message); }
const e1 = await store.leer('enrollments/c1_geo');
t('sesiones, mejor PPM y lecciones reales', e1.stats.sesiones === 5 && e1.stats.mejorWpm === 18 && e1.stats.lecciones === 3, JSON.stringify(e1.stats));
t('XP y minutos reales; ya no está en 0', e1.stats.xp === 330 && e1.stats.minutos === 10 && e1.stats.ultimaPractica > 0);
t('el docente ya puede ver el detalle por lección (docenteIds)', (await store.leer('lessons_progress/geo_m1-l01')).docenteIds.includes('prof'));
const tabla = conSesiones({ uid: 'geo', stats: e1.stats }, []);
t('"Última práctica" ya no queda vacía', tabla.stats.ultimaPractica > 0);
const otra = await P.reconciliarInscripciones(perfil, { forzar: true }); t('repetirlo no cambia nada', otra === 0, String(otra));
console.log(`\n${ok} ok, ${mal} mal`);
await env.cleanup(); process.exit(mal ? 1 : 0);
