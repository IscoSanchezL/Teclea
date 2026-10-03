/**
 * Clases, inscripción por código, tareas y ranking contra las REGLAS de Firestore (emulador).
 *   cd tests && npx firebase emulators:exec --only firestore --project demo-teclea "node clases.test.mjs"
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as P from '../js/db/progreso.js';
import * as C from '../js/db/clases.js';
import { estadoDe, resumenClase, sesionesDocente } from '../js/db/analitica.js';
import { MotorEscritura } from '../js/lessons/motor.js';

let ok = 0, mal = 0;
const t = (n, c, extra = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : '  ' + extra}`); };
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } });
const base = (uid, extra = {}) => ({ uid, nombre: `Nombre ${uid}`, apodo: uid, email: null, rol: 'estudiante', grado: 4, avatar: { emoji: '🦊' }, xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, ultimoDia: null, protectores: 0, prefs: {}, authTipo: 'pin', activo: true, creadoPor: null, creadoEn: fs.Timestamp.now(), ...extra });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await fs.setDoc(fs.doc(db, 'users/prof1'), base('prof1', { rol: 'docente' }));
  await fs.setDoc(fs.doc(db, 'users/prof2'), base('prof2', { rol: 'docente' }));
  await fs.setDoc(fs.doc(db, 'users/est1'), base('est1'));
  await fs.setDoc(fs.doc(db, 'users/est2'), base('est2'));
});
const usar = (uid) => { store._inyectarFirebase({ fs, db: env.authenticatedContext(uid).firestore() }); P._reiniciarCache(); };
state.modo = 'firebase';

console.log('Docente: crea y administra su clase');
usar('prof1');
const prof = { uid: 'prof1', rol: 'docente' };
const clase = await C.crearClase(prof, { nombre: '4.º A', grado: 4, grupo: 'Mañana' });
t(`crear clase con código válido (${clase.codigo})`, C.codigoValido(clase.codigo));
t('el código se puede consultar', !!(await store.leer(`class_codes/${clase.codigo}`)));
t('listar mis clases', (await C.listarClases(prof)).length === 1);
await C.actualizarClase(clase, { config: { rankingVisible: true, metaClase: 5000, mundosBloqueados: [3], mundosAbiertos: [] } });
t('editar configuración', (await store.leer(`classes/${clase.id}`)).config.metaClase === 5000);
const antes = clase.codigo; const nuevo = await C.regenerarCodigo(clase); clase.codigo = nuevo;
t('regenerar código (el viejo desaparece)', nuevo !== antes && !(await store.leer(`class_codes/${antes}`)) && !!(await store.leer(`class_codes/${nuevo}`)));

console.log('\nDocente: da de alta un estudiante con PIN (perfil + inscripción)');
const perfilPin = { ...base('pin1', { creadoPor: 'prof1', creadoEn: store.ahora(), nombre: 'Niño Pin', apodo: 'Niño' }) };
delete perfilPin.ultimaConexion;
try {
  await store.lote([{ tipo: 'set', ruta: 'users/pin1', datos: perfilPin },
    { tipo: 'set', ruta: `enrollments/${clase.id}_pin1`, datos: { uid: 'pin1', classId: clase.id, docenteId: 'prof1', codigo: clase.codigo, alias: 'Niño', avatar: { emoji: '🦊', fondo: 'violeta' }, grado: 4, estado: 'activo', pin: '4821', stats: { xp: 0, sesiones: 0 }, unidoEn: store.ahora(), ultimaConexion: store.ahora() } }]);
  t('perfil + inscripción con PIN pasan las reglas', true);
} catch (e) { t('perfil + inscripción con PIN pasan las reglas', false, e.message); }
t('el docente lista sus inscripciones', (await C.inscripcionesDocente(prof)).length === 1);

console.log('\nEstudiante: se une con el código');
usar('est1');
const est = { uid: 'est1', apodo: 'est1', grado: 4, avatar: { emoji: '🐼', fondo: 'menta' } };
try { await C.unirse(est, 'ZZZZZZ'); t('código inexistente se rechaza', false); } catch (e) { t('código inexistente se rechaza con mensaje', /No encontré/.test(e.message)); }
try { await C.unirse(est, 'ABC'); t('código mal formado se rechaza', false); } catch (e) { t('código mal formado se rechaza', /6 letras/.test(e.message)); }
try { await C.unirse(est, clase.codigo.toLowerCase()); t('unirse con el código (en minúsculas) pasa las reglas', true); } catch (e) { t('unirse con el código pasa las reglas', false, e.message); }
try { await C.unirse(est, clase.codigo); t('no se une dos veces', false); } catch (e) { t('no se une dos veces', /Ya estás/.test(e.message)); }
t('el estudiante ve su clase', (await C.misClases(est)).some((x) => x.clase?.nombre === '4.º A'));
await assertFails(fs.setDoc(fs.doc(env.authenticatedContext('est2').firestore(), `enrollments/${clase.id}_est2`), { uid: 'est2', classId: clase.id, docenteId: 'prof1', codigo: clase.codigo, alias: 'x', stats: { xp: 0 }, pin: '1234', unidoEn: fs.serverTimestamp() }));
t('un estudiante NO puede ponerse un PIN al unirse', true);
const opc = await C.opcionesDeClases(est);
t('opciones de la clase (mundo 3 cerrado)', opc.mundosBloqueados.includes(3));

console.log('\nTareas');
usar('prof1');
const tarea = await C.crearTarea(prof, clase, { titulo: 'Fila base', tipo: 'leccion', refId: 'm1-l01', instrucciones: 'Con calma', vence: Date.now() + 86400000 });
const ej = await C.crearEjercicioPropio(prof, clase, { titulo: 'Mi texto', texto: 'El sol sale por el este.' });
const tarea2 = await C.crearTarea(prof, clase, { titulo: 'Texto propio', tipo: 'ejercicio', refId: ej.id });
t('el docente crea tareas y ejercicio propio', (await C.tareasDeClase(prof, clase)).length === 2);
usar('est1');
const lista = await C.tareasEstudiante(est);
t('el estudiante ve 2 tareas pendientes', lista.length === 2 && lista.every((x) => !x.entrega));
t('el estudiante lee el ejercicio del docente', (await C.leerEjercicio(ej.id))?.texto.startsWith('El sol'));

console.log('\nActividad: sesión, progreso, ranking y aportes');
let ms = 0; const m = new MotorEscritura({ texto: 'fjf jfj fff jjj fjfj jfjf fj jf', reloj: () => ms }); for (const c of m.chars) { m.escribir(c); ms += 350; }
const res = m.resultado();
const perfilEst = (await store.leer('users/est1'));
const r = await P.registrarActividad({ user: { ...perfilEst, ...est, uid: 'est1', xp: 0, monedas: 0, racha: 0, protectores: 0, nivel: 1 }, tipo: 'leccion', refId: 'm1-l01', resultado: res, leccion: { id: 'm1-l01', mundo: 1 }, estrellas: 2, porTecla: m.porTecla });
t('registrar actividad (con ranking y aporte) pasa las reglas', !!r.sesionId);
const hechas = await C.entregarTareas({ ...est, uid: 'est1' }, { tipo: 'leccion', refId: 'm1-l01', resultado: res, sesionId: r.sesionId });
t('se entrega automáticamente la tarea de lección', hechas.length === 1);
t('no se entrega la tarea de ejercicio (otro tipo)', (await C.tareasEstudiante(est)).filter((x) => x.entrega).length === 1);
const rank = await C.rankingDeClase(clase.id), aportes = await C.aportesDeClase(clase.id);
t('ranking guarda solo apodo/avatar/puntos/mejora', rank.length === 1 && rank[0].apodo === 'est1' && !('nombre' in rank[0]) && !('foto' in rank[0]));
t('aporte de la clase acumula letras', aportes[0]?.caracteres > 0);
const ses = await store.consultar('sessions', { donde: [['uid', '==', 'est1']] });
t('la sesión guarda el día para consultas sin índice', /^\d{4}-\d{2}-\d{2}$/.test(ses[0].dia));
t('resumenHoy usa el día', (await P.resumenHoy('est1')).sesiones === 1);

console.log('\nDocente: ve el progreso y no el de otros');
usar('prof1');
const inscs = await C.inscripcionesDocente(prof);
const e1 = inscs.find((i) => i.uid === 'est1');
t('estadísticas visibles al docente', e1.stats.sesiones === 1 && e1.stats.mejorWpm === res.ppm && e1.stats.caracteres > 0 && e1.stats.ppmInicial === res.ppm);
const sesDoc = await sesionesDocente({ uid: 'prof1' });
t('el docente lee las sesiones de su clase', sesDoc.length >= 1);
const resumen = resumenClase(inscs, sesDoc);
t('resumen de clase', resumen.total === 2 && resumen.activos === 1 && resumen.minutosSemana.length === 7);
t('estado: con actividad hoy = ok/atrasado/destacado; sin actividad = nuevo', ['ok', 'atrasado', 'destacado'].includes(estadoDe(e1)) && estadoDe(inscs.find((i) => i.uid === 'pin1')) === 'nuevo');
const subs = await C.entregasDeTarea(prof, tarea);
t('el docente ve las entregas', subs.length === 1);
try { await store.actualizar(`submissions/${subs[0].id}`, { nota: 4.5 }); t('el docente pone nota', true); } catch (e) { t('el docente pone nota', false, e.message); }
usar('prof2');
t('otro docente NO ve estudiantes ni sesiones ajenas', (await C.inscripcionesDocente({ uid: 'prof2' })).length === 0 && (await sesionesDocente({ uid: 'prof2' })).length === 0);
await assertFails(fs.getDoc(fs.doc(env.authenticatedContext('prof2').firestore(), `enrollments/${clase.id}_est1`)));
t('otro docente NO puede leer una inscripción ajena', true);
await assertFails(fs.updateDoc(fs.doc(env.authenticatedContext('prof2').firestore(), `classes/${clase.id}`), { nombre: 'robada', grado: 4, grupo: '', color: '#000000', codigo: clase.codigo, config: {}, activa: true, docenteId: 'prof2' }));
t('otro docente NO puede editar la clase', true);

console.log('\nSalir de la clase');
usar('est1');
await C.salirDeClase((await P.cargarInscripciones('est1'))[0]);
t('el estudiante sale de la clase', (await P.cargarInscripciones('est1')).length === 0);

console.log(`\n${ok} correctas, ${mal} con fallo`);
await env.cleanup();
process.exit(mal ? 1 : 0);
