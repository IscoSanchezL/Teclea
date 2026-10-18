/**
 * Retos en vivo (parejas y final) contra las REGLAS de Firestore (emulador).
 *   cd tests && npx firebase emulators:exec --only firestore --project demo-teclea "node retos.test.mjs"
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as P from '../js/db/progreso.js';
import * as C from '../js/db/clases.js';
import * as R from '../js/db/reto-clase.js';
import { armarParejas, rankingParejas, rankingIndividual } from '../js/game/reto-clase.js';

let ok = 0, mal = 0;
const t = (n, c, extra = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : '  ' + extra}`); };
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
const perfil = (uid, extra = {}) => ({ uid, nombre: uid, apodo: uid, email: null, rol: 'estudiante', grado: 4, avatar: { emoji: '🦊' }, xp: 0, nivel: 1, monedas: 0, racha: 0, ...extra });
const ESTS = ['e1', 'e2', 'e3', 'e4', 'e5'];
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  for (const p of ['prof1', 'prof2']) await fs.setDoc(fs.doc(db, `users/${p}`), perfil(p, { rol: 'docente' }));
  for (const e of [...ESTS, 'fuera']) await fs.setDoc(fs.doc(db, `users/${e}`), perfil(e));
});
const usar = (uid) => { store._inyectarFirebase({ fs, db: env.authenticatedContext(uid).firestore() }); P._reiniciarCache(); };
state.modo = 'firebase';
const alumno = (uid) => ({ uid, apodo: uid, grado: 4 });

usar('prof1');
const prof = { uid: 'prof1', rol: 'docente' };
const clase = await C.crearClase(prof, { nombre: '4.º A', grado: 4 });
for (const e of ESTS) await env.withSecurityRulesDisabled((ctx) => fs.setDoc(fs.doc(ctx.firestore(), `enrollments/${clase.id}_${e}`), { uid: e, classId: clase.id, docenteId: 'prof1', codigo: clase.codigo, alias: e, avatar: { emoji: '🦊' }, stats: {}, estado: 'activo' }));

console.log('Reto por parejas');
const parejas = armarParejas(ESTS.map((e) => ({ uid: e, alias: e })));
const rp = await R.crearReto(prof, clase, { tipo: 'parejas', seg: 60, texto: 'Hola mundo, escribe con calma y buena precisión.', parejas });
t('el docente crea el reto', !!(await R.leerReto(rp.id)));
usar('prof2');
await assertFails(fs.updateDoc(fs.doc(env.authenticatedContext('prof2').firestore(), `challenges/${rp.id}`), { estado: 'jugando' }));
t('otro docente NO puede controlar el reto', true);
await assertFails(R.crearReto({ uid: 'prof2', rol: 'docente' }, clase, { tipo: 'parejas', seg: 60 }));
t('otro docente NO puede crear retos en mi clase', true);
usar('fuera');
await assertFails(fs.getDoc(fs.doc(env.authenticatedContext('fuera').firestore(), `challenges/${rp.id}`)));
t('alguien de otra clase NO ve el reto', true);
usar('e1');
t('un estudiante de la clase lo encuentra como activo', (await R.retoActivoDeAlumno(alumno('e1')))?.id === rp.id);
usar('prof1');
await R.iniciarReto(rp, ESTS);
t('el docente inicia el reto', (await R.leerReto(rp.id)).estado === 'jugando');
usar('e1');
const r1 = await R.guardarResultado(alumno('e1'), rp, { ppm: 30, precision: 95 });
t('el estudiante guarda su resultado', r1.terminado && r1.puntos === Math.round(30 * 0.95 * 0.95 * 10));
await assertFails(fs.updateDoc(fs.doc(env.authenticatedContext('e1').firestore(), `challenge_entries/${rp.id}_e1`), { puntos: 2000, wpm: 200, precision: 100, terminado: true }));
t('terminado queda bloqueado (no puede subirse el puntaje)', true);
await assertFails(fs.setDoc(fs.doc(env.authenticatedContext('e2').firestore(), `challenge_entries/${rp.id}_e1`), { challengeId: rp.id, classId: clase.id, docenteId: 'prof1', uid: 'e1', alias: 'e1', terminado: true, wpm: 1, precision: 1, puntos: 1, creadoEn: fs.serverTimestamp() }));
t('nadie escribe resultados a nombre de otro', true);
await assertFails(fs.setDoc(fs.doc(env.authenticatedContext('e2').firestore(), `challenge_entries/${rp.id}_e2`), { challengeId: rp.id, classId: clase.id, docenteId: 'prof1', uid: 'e2', alias: 'e2', terminado: true, wpm: 999, precision: 100, puntos: 1, creadoEn: fs.serverTimestamp() }));
t('rechaza PPM imposibles', true);
usar('e2'); await R.guardarResultado(alumno('e2'), rp, { ppm: 22, precision: 90 });
usar('e3'); await R.guardarResultado(alumno('e3'), rp, { ppm: 40, precision: 100 });
usar('prof1');
const ents = await R.entradas(rp);
const rank = rankingParejas(rp.parejas, ents);
t('el docente ve el ranking por parejas', ents.length === 3 && rank.length >= 1 && rank[0].puesto === 1);
await R.cerrarReto(rp);
usar('e4');
await assertFails(R.guardarResultado(alumno('e4'), rp, { ppm: 20, precision: 90 }));
t('con el reto cerrado ya no se puede entregar', true);
t('el reto cerrado deja de aparecer como activo', (await R.retoActivoDeAlumno(alumno('e4'))) === null);

console.log('\nReto final (mensajes entre compañeros)');
usar('prof1');
const rf = await R.crearReto(prof, clase, { tipo: 'final', seg: 0 });
usar('e1'); await R.guardarMensaje(alumno('e1'), rf, 'El teclado es mi amigo');
usar('e2'); await R.guardarMensaje(alumno('e2'), rf, 'Practicar cada día ayuda mucho');
usar('e3'); await R.guardarMensaje(alumno('e3'), rf, 'Escribe sin mirar las teclas');
await assertFails(R.guardarMensaje(alumno('e3'), rf, 'corto'));
t('mensajes de menos de 8 letras se rechazan', true);
await R.guardarMensaje(alumno('e3'), rf, 'Escribe sin mirar el teclado');
t('el estudiante puede cambiar su mensaje antes de empezar', (await R.miEntrada(alumno('e3'), rf)).mensaje.endsWith('teclado'));
usar('e4');
t('los compañeros pueden leer los mensajes', (await R.entradas(rf)).length === 3);
usar('prof1');
const msgs = await R.entradas(rf);
await R.quitarMensaje(msgs.find((m) => m.uid === 'e3'));
t('el docente puede quitar un mensaje', (await R.entradas(rf)).length === 2);
usar('e3'); await R.guardarMensaje(alumno('e3'), rf, 'Escribe sin mirar el teclado');
usar('prof1');
await R.iniciarReto(rf, ESTS);
const rfi = await R.leerReto(rf.id);
t('cada quien recibe el mensaje de otro compañero', ESTS.every((e) => rfi.asignacion[e] && rfi.asignacion[e] !== e));
usar('e4'); await R.guardarResultado(alumno('e4'), rfi, { ppm: 28, precision: 100 });
usar('e5'); await R.guardarResultado(alumno('e5'), rfi, { ppm: 35, precision: 96 });
usar('e1'); await R.guardarResultado(alumno('e1'), rfi, { ppm: 20, precision: 100 });
const ri = rankingIndividual(await R.entradas(rf));
t('podio individual: el primero es quien más puntos hizo', ri.length === 3 && ri[0].uid === 'e5' || ri[0].uid === 'e4');
await assertFails(fs.updateDoc(fs.doc(env.authenticatedContext('e1').firestore(), `challenge_entries/${rf.id}_e1`), { mensaje: 'Cambio el mensaje tarde' }));
t('no se cambia el mensaje después de terminar', true);
usar('prof1'); await R.eliminarReto(rf);
t('el docente elimina el reto con sus entradas', !(await R.leerReto(rf.id)) && (await R.entradas(rf)).length === 0);

console.log(`\n${ok} correctas, ${mal} con fallo`);
await env.cleanup();
process.exit(mal ? 1 : 0);
