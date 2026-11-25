/**
 * Duelos entre compañeros contra las REGLAS de Firestore (emulador): sala en línea, retos y avance de cada jugador.
 *   cd tests && npx firebase emulators:exec --only firestore --project demo-teclea "node duelos.test.mjs"
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as P from '../js/db/progreso.js';
import * as D from '../js/db/duelos.js';

let ok = 0, mal = 0;
const t = (n, c, extra = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : '  ' + extra}`); };
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
const perfil = (uid, extra = {}) => ({ uid, nombre: `Nombre ${uid}`, apodo: uid, rol: 'estudiante', grado: 4, avatar: { emoji: '🦊', fondo: 'violeta' }, xp: 0, nivel: 1, monedas: 0, racha: 0, ...extra });
const insc = (uid, classId, docenteId = 'prof1') => ({ uid, classId, docenteId, codigo: 'ABC234', alias: uid, estado: 'activo', stats: { xp: 0 } });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await fs.setDoc(fs.doc(db, 'users/prof1'), perfil('prof1', { rol: 'docente' }));
  await fs.setDoc(fs.doc(db, 'classes/c1'), { docenteId: 'prof1', nombre: '4.º B', grado: 4, grupo: 'B', color: '#6C4CF5', codigo: 'ABC234', activa: true, config: {} });
  await fs.setDoc(fs.doc(db, 'classes/c2'), { docenteId: 'prof2', nombre: '5.º A', grado: 5, grupo: 'A', color: '#6C4CF5', codigo: 'XYZ234', activa: true, config: {} });
  for (const u of ['ana', 'beto', 'caro']) { await fs.setDoc(fs.doc(db, `users/${u}`), perfil(u)); await fs.setDoc(fs.doc(db, `enrollments/c1_${u}`), insc(u, 'c1')); }
  await fs.setDoc(fs.doc(db, 'users/dan'), perfil('dan', { grado: 5 })); await fs.setDoc(fs.doc(db, 'enrollments/c2_dan'), insc('dan', 'c2', 'prof2'));
});
const bd = (uid) => env.authenticatedContext(uid).firestore();
const sala = (c, u) => fs.doc(bd(u), `classes/${c}/en_linea/${u}`);
const presencia = (extra = {}) => ({ apodo: 'x', avatar: { emoji: '🦊', fondo: 'violeta' }, estado: 'libre', visto: fs.serverTimestamp(), ...extra });
const falla = (p) => assertFails(p).then(() => true, () => false);
const pasa = (p) => assertSucceeds(p).then(() => true, () => false);

console.log('Sala en línea');
t('un compañero se pone en línea', await pasa(fs.setDoc(sala('c1', 'ana'), presencia({ apodo: 'Ana' }))));
t('y su compañero también', await pasa(fs.setDoc(sala('c1', 'beto'), presencia({ apodo: 'Beto' }))));
t('NO puede ponerse en línea a nombre de otro', await falla(fs.setDoc(fs.doc(bd('ana'), 'classes/c1/en_linea/caro'), presencia())));
t('alguien de OTRA clase no entra a la sala', await falla(fs.setDoc(fs.doc(bd('dan'), 'classes/c1/en_linea/dan'), presencia())));
t('NO acepta una hora inventada (visto debe ser la del servidor)', await falla(fs.setDoc(sala('c1', 'caro'), presencia({ visto: fs.Timestamp.now() }))));
t('NO acepta campos de más (nombre completo, foto)', await falla(fs.setDoc(sala('c1', 'caro'), presencia({ nombre: 'Nombre completo', foto: 'data:image/png;base64,xx' }))));
t('NO acepta un apodo enorme', await falla(fs.setDoc(sala('c1', 'caro'), presencia({ apodo: 'x'.repeat(80) }))));
t('NO acepta un estado inventado', await falla(fs.setDoc(sala('c1', 'caro'), presencia({ estado: 'admin' }))));
t('un compañero ve quién está en línea', await pasa(fs.getDocs(fs.collection(bd('caro'), 'classes/c1/en_linea'))));
t('alguien de otra clase NO ve la sala', await falla(fs.getDocs(fs.collection(bd('dan'), 'classes/c1/en_linea'))));
t('el docente de la clase sí ve la sala', await pasa(fs.getDocs(fs.collection(bd('prof1'), 'classes/c1/en_linea'))));
t('otro docente NO la ve', await falla(fs.getDocs(fs.collection(bd('prof2'), 'classes/c1/en_linea'))));

console.log('\nRetar');
const nuevoDuelo = (de, a, extra = {}) => ({ de, a, deApodo: de, aApodo: a, deAv: { emoji: '🦊' }, aAv: { emoji: '🐼' }, estado: 'invitado', texto: 'sol luna mesa casa perro', seg: 90, creadoEn: fs.serverTimestamp(), prog: {}, ...extra });
const duelo = (u, id) => fs.doc(bd(u), `classes/c1/duelos/${id}`);
t('retar a un compañero que está en línea', await pasa(fs.setDoc(duelo('ana', 'd1'), nuevoDuelo('ana', 'beto'))));
t('NO se puede retar a quien NO está en línea', await falla(fs.setDoc(duelo('ana', 'd2'), nuevoDuelo('ana', 'caro'))));
t('NO se puede retar a alguien de otra clase', await falla(fs.setDoc(duelo('ana', 'd3'), nuevoDuelo('ana', 'dan'))));
t('NO se puede retar a nombre de otro', await falla(fs.setDoc(duelo('caro', 'd4'), nuevoDuelo('ana', 'beto'))));
t('NO se puede retarse a uno mismo', await falla(fs.setDoc(duelo('ana', 'd5'), nuevoDuelo('ana', 'ana'))));
t('NO nace ya aceptado ni con avance', await falla(fs.setDoc(duelo('ana', 'd6'), nuevoDuelo('ana', 'beto', { estado: 'aceptado' }))) && await falla(fs.setDoc(duelo('ana', 'd7'), nuevoDuelo('ana', 'beto', { prog: { ana: { pos: 40, fin: true, completo: true, ms: 1 } } }))));
t('NO acepta un texto enorme', await falla(fs.setDoc(duelo('ana', 'd8'), nuevoDuelo('ana', 'beto', { texto: 'a'.repeat(500) }))));

console.log('\nReto en un minijuego');
t('se crea con juego y semilla', await pasa(fs.setDoc(duelo('ana', 'g0'), nuevoDuelo('ana', 'beto', { texto: 'juego:jefe', juego: 'jefe', semilla: 123456 }))));
t('NO acepta semilla fuera de rango, juego sin semilla ni nombre larguísimo', await falla(fs.setDoc(duelo('ana', 'g1'), nuevoDuelo('ana', 'beto', { texto: 'juego:jefe', juego: 'jefe', semilla: -1 }))) && await falla(fs.setDoc(duelo('ana', 'g2'), nuevoDuelo('ana', 'beto', { texto: 'juego:jefe', juego: 'jefe' }))) && await falla(fs.setDoc(duelo('ana', 'g3'), nuevoDuelo('ana', 'beto', { texto: 'juego:jefe', juego: 'x'.repeat(30), semilla: 5 }))));
t('NO acepta campos inventados', await falla(fs.setDoc(duelo('ana', 'g4'), nuevoDuelo('ana', 'beto', { juego: 'jefe', semilla: 5, trampa: 1 }))));
t('el retado acepta el reto de juego', await pasa(fs.updateDoc(duelo('beto', 'g0'), { estado: 'aceptado', aceptadoEn: fs.serverTimestamp() })));
t('cada uno guarda SUS puntos', await pasa(fs.updateDoc(duelo('ana', 'g0'), { 'prog.ana': { pts: 950, err: 1, fin: true, completo: true, ms: 60000 } })) && await pasa(fs.updateDoc(duelo('beto', 'g0'), { 'prog.beto': { pts: 700, err: 0, fin: true, completo: true, ms: 55000 } })));
t('NO acepta puntos absurdos ni de otro tipo', await falla(fs.updateDoc(duelo('ana', 'g0'), { 'prog.ana': { pts: 9999999, fin: true } })) && await falla(fs.updateDoc(duelo('ana', 'g0'), { 'prog.ana': { pts: 'mil', fin: true } })));
t('NO se escriben los puntos del rival', await falla(fs.updateDoc(duelo('ana', 'g0'), { 'prog.beto': { pts: 1, fin: true } })));

console.log('\nPrivacidad del duelo');
t('el retado lo ve', await pasa(fs.getDoc(duelo('beto', 'd1'))));
t('un tercero de la misma clase NO lo ve', await falla(fs.getDoc(duelo('caro', 'd1'))));
t('alguien de otra clase NO lo ve', await falla(fs.getDoc(duelo('dan', 'd1'))));
t('el retado ve SUS invitaciones (consulta)', await pasa(fs.getDocs(fs.query(fs.collection(bd('beto'), 'classes/c1/duelos'), fs.where('a', '==', 'beto'), fs.where('estado', '==', 'invitado')))));
t('NO se puede listar los duelos de otros', await falla(fs.getDocs(fs.query(fs.collection(bd('caro'), 'classes/c1/duelos'), fs.where('a', '==', 'beto')))));

console.log('\nResponder');
t('quien reta NO puede aceptar su propia invitación', await falla(fs.updateDoc(duelo('ana', 'd1'), { estado: 'aceptado', aceptadoEn: fs.serverTimestamp() })));
t('NO se escribe avance antes de aceptar', await falla(fs.updateDoc(duelo('ana', 'd1'), { 'prog.ana': { pos: 5, err: 0 } })));
t('un tercero NO puede aceptar', await falla(fs.updateDoc(duelo('caro', 'd1'), { estado: 'aceptado', aceptadoEn: fs.serverTimestamp() })));
t('el retado NO puede aceptar sin la hora del servidor', await falla(fs.updateDoc(duelo('beto', 'd1'), { estado: 'aceptado' })));
t('el retado acepta', await pasa(fs.updateDoc(duelo('beto', 'd1'), { estado: 'aceptado', aceptadoEn: fs.serverTimestamp() })));

console.log('\nJugar');
t('cada uno escribe SU avance', await pasa(fs.updateDoc(duelo('ana', 'd1'), { 'prog.ana': { pos: 12, err: 1 } })) && await pasa(fs.updateDoc(duelo('beto', 'd1'), { 'prog.beto': { pos: 9, err: 0 } })));
t('NO se puede escribir el avance del rival', await falla(fs.updateDoc(duelo('ana', 'd1'), { 'prog.beto': { pos: 300, fin: true, completo: true, ms: 1 } })));
t('NO se puede cambiar el texto, ni los jugadores', await falla(fs.updateDoc(duelo('ana', 'd1'), { texto: 'otro texto distinto' })) && await falla(fs.updateDoc(duelo('ana', 'd1'), { a: 'caro' })));
t('NO acepta un avance imposible (pos 9999) ni campos de más', await falla(fs.updateDoc(duelo('ana', 'd1'), { 'prog.ana': { pos: 9999 } })) && await falla(fs.updateDoc(duelo('ana', 'd1'), { 'prog.ana': { pos: 5, xp: 999 } })));
t('NO puede entrar un tercero al avance', await falla(fs.updateDoc(duelo('caro', 'd1'), { 'prog.caro': { pos: 5 } })));
t('terminar: avance final', await pasa(fs.updateDoc(duelo('ana', 'd1'), { 'prog.ana': { pos: 25, err: 1, fin: true, completo: true, ms: 21000 } })));
t('cerrar el duelo', await pasa(fs.updateDoc(duelo('ana', 'd1'), { estado: 'fin' })));
t('un duelo cerrado NO se reabre', await falla(fs.updateDoc(duelo('ana', 'd1'), { estado: 'aceptado' })));
t('un duelo cerrado NO admite más avance', await falla(fs.updateDoc(duelo('beto', 'd1'), { 'prog.beto': { pos: 20, err: 0 } })));

console.log('\nCancelar y rechazar');
await fs.setDoc(duelo('ana', 'd9'), nuevoDuelo('ana', 'beto'));
t('quien reta puede cancelar', await pasa(fs.updateDoc(duelo('ana', 'd9'), { estado: 'cancelado' })));
await fs.setDoc(duelo('ana', 'd10'), nuevoDuelo('ana', 'beto'));
t('el retado puede rechazar', await pasa(fs.updateDoc(duelo('beto', 'd10'), { estado: 'rechazado' })));
t('quien reta NO puede "rechazar" por el otro', await (async () => { await fs.setDoc(duelo('ana', 'd11'), nuevoDuelo('ana', 'beto')); return falla(fs.updateDoc(duelo('ana', 'd11'), { estado: 'rechazado' })); })());
t('un participante puede borrar su duelo; un tercero no', await pasa(fs.deleteDoc(duelo('ana', 'd11'))) && await (async () => { await fs.setDoc(duelo('ana', 'd12'), nuevoDuelo('ana', 'beto')); return falla(fs.deleteDoc(duelo('caro', 'd12'))); })());

console.log('\nEl docente apaga los duelos');
await env.withSecurityRulesDisabled((ctx) => fs.updateDoc(fs.doc(ctx.firestore(), 'classes/c1'), { config: { duelos: false } }));
t('con duelos apagados NO se puede ponerse en línea', await falla(fs.setDoc(sala('c1', 'ana'), presencia())));
t('con duelos apagados NO se puede retar', await falla(fs.setDoc(duelo('ana', 'd13'), nuevoDuelo('ana', 'beto'))));
await env.withSecurityRulesDisabled((ctx) => fs.updateDoc(fs.doc(ctx.firestore(), 'classes/c1'), { config: { duelos: true } }));
t('al volver a activarlos, funciona de nuevo', await pasa(fs.setDoc(sala('c1', 'ana'), presencia())));

console.log('\nCapa de datos (js/db/duelos.js) con las mismas reglas');
state.modo = 'firebase';
const usar = (uid) => { store._inyectarFirebase({ fs, db: bd(uid) }); P._reiniciarCache(); };
const yo = (uid) => ({ uid, apodo: uid, nombre: uid, avatar: { emoji: '🦊', fondo: 'violeta', mascota: 'zorro' } });
usar('ana');
let cl; try { cl = await D.clasesConDuelos(yo('ana')); t('lista mis clases con duelos', cl.activas.length === 1 && cl.activas[0].id === 'c1'); } catch (e) { t('lista mis clases con duelos', false, e.message); }
try { await D.publicarPresencia(yo('ana'), 'c1'); t('publicarPresencia pasa las reglas', true); } catch (e) { t('publicarPresencia pasa las reglas', false, e.message); }
usar('beto');
try { await D.publicarPresencia(yo('beto'), 'c1'); t('beto también', true); } catch (e) { t('beto también', false, e.message); }
usar('ana');
let d; try { d = await D.retar(yo('ana'), { uid: 'beto', apodo: 'beto', avatar: { emoji: '🐼' } }, 'c1', 'sol luna mesa'); t('retar() pasa las reglas', Boolean(d.id)); } catch (e) { t('retar() pasa las reglas', false, e.message); }
usar('beto');
try { await D.responder('c1', d.id, true); t('responder(aceptar) pasa las reglas', true); } catch (e) { t('responder(aceptar) pasa las reglas', false, e.message); }
try { await D.guardarAvance('c1', d.id, 'beto', { pos: 8, err: 0, fin: false }); t('guardarAvance pasa las reglas', true); } catch (e) { t('guardarAvance pasa las reglas', false, e.message); }
const leido = await store.leer(`classes/c1/duelos/${d.id}`);
t('el avance quedó en el duelo y no se pisó el del otro', leido.prog.beto.pos === 8 && leido.estado === 'aceptado' && leido.aceptadoEn > 0);
try { await D.salirDeSala(yo('beto'), 'c1'); t('salirDeSala borra mi presencia', (await store.leer('classes/c1/en_linea/beto')) === null); } catch (e) { t('salirDeSala', false, e.message); }

console.log(`\n${ok} correctas, ${mal} con fallo`);
await env.cleanup(); process.exit(mal ? 1 : 0);
