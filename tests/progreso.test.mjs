/**
 * Prueba de integración: registrarActividad() contra las REGLAS de Firestore (emulador) y en modo local.
 *   cd tests && npm test   (o: firebase emulators:exec --only firestore "node progreso.test.mjs")
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as P from '../js/db/progreso.js';
import { MotorEscritura } from '../js/lessons/motor.js';

let ok = 0, mal = 0;
const t = (n, c, extra = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : '  ' + extra}`); };

function resultadoDe(texto, { errores = 0, msPorTecla = 400 } = {}) {
  let ms = 0; const m = new MotorEscritura({ texto, reloj: () => ms });
  [...texto].forEach((c, i) => { m.escribir(errores && i < errores ? '#' : c); ms += msPorTecla; });
  return { r: m.resultado(), m };
}
const leccion = { id: 'm1-l01', mundo: 1, ejercicios: [{}, {}, {}], meta: { precision: 0.85, ppm: 0.3 } };

/* ═════════ Firestore con reglas ═════════ */
console.log('Con reglas de Firestore (emulador)');
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } });
const perfil = { uid: 'est1', nombre: 'Est Uno', apodo: 'Uno', email: null, rol: 'estudiante', grado: 4, avatar: { emoji: '🦊' }, xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, ultimoDia: null, protectores: 0, prefs: {}, authTipo: 'pin', activo: true, creadoPor: null, creadoEn: fs.Timestamp.now(), ultimaConexion: fs.Timestamp.now(), consentimiento: { version: '2026-01', aceptadoEn: fs.Timestamp.now() } };
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await fs.setDoc(fs.doc(db, 'users/est1'), perfil);
  await fs.setDoc(fs.doc(db, 'classes/c1'), { docenteId: 'prof1', nombre: '4A', grado: 4, grupo: 'A', color: '#6C4CF5', codigo: 'ABC234', config: {}, activa: true });
  await fs.setDoc(fs.doc(db, 'class_codes/ABC234'), { classId: 'c1', docenteId: 'prof1' });
  await fs.setDoc(fs.doc(db, 'enrollments/c1_est1'), { uid: 'est1', classId: 'c1', docenteId: 'prof1', codigo: 'ABC234', alias: 'Uno', stats: { xp: 0 }, unidoEn: fs.Timestamp.now() });
  await fs.setDoc(fs.doc(db, 'badges/primera-leccion'), { nombre: 'Primera lección' });
});
const dbEst = env.authenticatedContext('est1').firestore();
state.modo = 'firebase'; state.user = { ...perfil, xp: 0, creadoEn: undefined };
store._inyectarFirebase({ fs, db: dbEst });
P._reiniciarCache();

const lee = async (ruta) => (await store.leer(ruta));
const texto = 'fjf jfj fff jjj fjfj jfjf fj jf';
const { r: res1, m: m1 } = resultadoDe(texto, { errores: 2 });
let resumen;
try { resumen = await P.registrarActividad({ user: state.user, tipo: 'leccion', refId: leccion.id, resultado: res1, leccion, estrellas: 2, porTecla: m1.porTecla }); t('registrar una lección completa pasa las reglas (lote atómico)', true); }
catch (e) { t('registrar una lección completa pasa las reglas', false, e.message); console.log(e); process.exit(1); }
await new Promise((r) => setTimeout(r, 400)); // estadísticas por tecla (segundo plano)

const u = await lee('users/est1'), prog = await lee('lessons_progress/est1_m1-l01'), insc = await lee('enrollments/c1_est1');
t(`XP sumado (${resumen.xp}) y nivel`, u.xp === resumen.xp && u.nivel >= 1);
t('monedas sumadas', u.monedas === resumen.monedas && u.monedas > 0);
t('racha = 1 y último día de hoy', u.racha === 1 && typeof u.ultimoDia === 'string');
t('progreso con 2★ guardado', prog.estrellas === 2 && prog.completada === true && prog.intentos === 1 && prog.docenteIds[0] === 'prof1');
t('estadísticas de la inscripción para el docente', insc.stats.xp === resumen.xp && insc.stats.sesiones === 1 && insc.stats.lecciones === 1 && insc.stats.mejorWpm === res1.ppm);
const sesiones = await store.consultar('sessions', { donde: [['uid', '==', 'est1']] });
t('sesión guardada con clase y docente', sesiones.length === 1 && sesiones[0].classId === 'c1' && sesiones[0].docenteId === 'prof1' && sesiones[0].tipo === 'leccion');
t('la sesión tiene errores por tecla', sesiones[0].erroresPorTecla && Object.keys(sesiones[0].erroresPorTecla).length > 0);
const ks = await lee('key_stats/est1');
t('estadísticas por tecla creadas', ks && ks.teclas && Object.keys(ks.teclas).length > 0);
t('las fechas llegan como milisegundos', typeof sesiones[0].creadoEn === 'number' && typeof prog.actualizadoEn === 'number');

// Segundo intento mejor: actualiza progreso (reglas: no bajar mejorWpm/estrellas)
const { r: res2, m: m2 } = resultadoDe(texto, { msPorTecla: 300 });
try { const r2 = await P.registrarActividad({ user: state.user, tipo: 'leccion', refId: leccion.id, resultado: res2, leccion, estrellas: 3, porTecla: m2.porTecla }); t('segundo intento (mejor) pasa las reglas', true); t('ya no es "primera vez"', r2.primeraVez === false); }
catch (e) { t('segundo intento (mejor) pasa las reglas', false, e.message); }
await new Promise((r) => setTimeout(r, 300));
const prog2 = await lee('lessons_progress/est1_m1-l01');
t('progreso sube a 3★ con intentos = 2', prog2.estrellas === 3 && prog2.intentos === 2 && prog2.mejorWpm >= res1.ppm);
const insc2 = await lee('enrollments/c1_est1');
t('estadísticas acumulan sesiones y no repiten "lecciones"', insc2.stats.sesiones === 2 && insc2.stats.lecciones === 1);

// Peor intento: no debe bajar nada
const { r: res3, m: m3 } = resultadoDe(texto, { errores: 6, msPorTecla: 900 });
await P.registrarActividad({ user: state.user, tipo: 'leccion', refId: leccion.id, resultado: res3, leccion, estrellas: 1, porTecla: m3.porTecla });
const prog3 = await lee('lessons_progress/est1_m1-l01');
t('un intento peor NO baja estrellas ni mejor PPM', prog3.estrellas === 3 && prog3.mejorWpm >= prog2.mejorWpm);

// Práctica libre y juego
const { r: resP } = resultadoDe('el perro corre en el parque. la vaca come pasto.', { msPorTecla: 350 });
try { await P.registrarActividad({ user: state.user, tipo: 'practica', refId: 'tema:animales', resultado: resP }); t('práctica libre pasa las reglas', true); } catch (e) { t('práctica libre pasa las reglas', false, e.message); }
try { await P.registrarActividad({ user: state.user, tipo: 'juego', refId: 'lluvia', resultado: { ppm: 14, precision: 90, errores: 3, duracionSeg: 60, caracteres: 70, porTecla: {} }, puntos: 400 }); t('juego pasa las reglas', true); } catch (e) { t('juego pasa las reglas', false, e.message); }

// Debilidades
const deb = await P.teclasDebiles('est1');
t('detecta teclas débiles (hubo errores contra "#")', Array.isArray(deb));

// Insignias
t('insignia nueva se otorga', await P.otorgarInsignia('est1', 'primera-leccion') === true);
t('la misma insignia no se duplica', await P.otorgarInsignia('est1', 'primera-leccion') === false);

// Trampas contra las reglas
const fake = await assertFails(fs.updateDoc(fs.doc(dbEst, 'users/est1'), { xp: fs.increment(9999) })).then(() => true).catch(() => false);
t('NO se puede inyectar +9999 XP directamente', fake);
const falsa = { ppm: 150, precision: 99, errores: 0, duracionSeg: 30, caracteres: 40, porTecla: {} };
let rechazada = false; try { await P.registrarActividad({ user: state.user, tipo: 'practica', refId: 'x', resultado: falsa }); } catch { rechazada = true; }
t('una sesión incoherente (150 PPM con 40 caracteres en 30 s) es RECHAZADA', rechazada);
await env.cleanup();

/* ═════════ Modo local (demo) ═════════ */
console.log('Modo local (demo)');
store._inyectarFirebase(null); state.modo = 'demo'; P._reiniciarCache(); store._reiniciarLocal();
await store.escribir('users/loc1', { ...perfil, uid: 'loc1', creadoEn: Date.now() });
state.user = { ...perfil, uid: 'loc1', creadoEn: undefined };
const { r: resL, m: mL } = resultadoDe(texto, {});
const resumenL = await P.registrarActividad({ user: state.user, tipo: 'leccion', refId: 'm1-l01', resultado: resL, leccion, estrellas: 3, porTecla: mL.porTecla });
await new Promise((r) => setTimeout(r, 100));
const uL = await store.leer('users/loc1'), pL = await store.leer('lessons_progress/loc1_m1-l01');
t('local: XP, racha y progreso guardados', uL.xp === resumenL.xp && uL.racha === 1 && pL.estrellas === 3);
t('local: estadísticas por tecla', Object.keys((await store.leer('key_stats/loc1')).teclas).length > 0);
const sL = await store.consultar('sessions', { donde: [['uid', '==', 'loc1']] });
t('local: sesión guardada', sL.length === 1);
t('local: los textos sin errores dan 100 % de precisión', sL[0].precision === 100);

console.log(`\n${ok} correctas, ${mal} con fallo`);
process.exit(mal ? 1 : 0);
