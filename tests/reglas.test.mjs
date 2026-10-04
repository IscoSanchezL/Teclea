/**
 * Pruebas de las reglas de seguridad de Firestore (emulador).
 *   cd tests && npm install && npm test
 * Cada prueba indica si la operación debe PERMITIRSE o DENEGARSE.
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, query, where, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';

const ADMIN_EMAIL = 'franksanlo@gmail.com';
const env = await initializeTestEnvironment({
  projectId: 'demo-teclea',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});

let ok = 0, mal = 0;
const prueba = async (nombre, fn) => {
  try { await fn(); ok++; console.log(`  ✓ ${nombre}`); } catch (e) { mal++; console.log(`  ✗ ${nombre}\n      ${String(e.message).split('\n')[0]}`); }
};

const perfil = (uid, extra = {}) => ({
  uid, nombre: 'Estudiante Prueba', apodo: 'Prue', email: null, rol: 'estudiante', grado: null,
  avatar: { emoji: '🦊' }, xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, ultimoDia: null, protectores: 0,
  prefs: {}, authTipo: 'pin', activo: true, creadoPor: null, creadoEn: serverTimestamp(), ultimaConexion: serverTimestamp(),
  consentimiento: { version: '2026-01', aceptadoEn: serverTimestamp() }, ...extra,
});
const sesion = (uid, extra = {}) => ({ uid, tipo: 'leccion', refId: 'm1-l1', wpm: 15, precision: 92, errores: 3, duracionSeg: 60, caracteres: 80, creadoEn: serverTimestamp(), ...extra });

// Datos base (sin reglas)
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/est1'), { ...perfil('est1'), creadoEn: Timestamp.now(), grado: 4 });
  await setDoc(doc(db, 'users/est2'), { ...perfil('est2'), creadoEn: Timestamp.now(), grado: 4 });
  await setDoc(doc(db, 'users/prof1'), { ...perfil('prof1', { rol: 'docente' }), creadoEn: Timestamp.now() });
  await setDoc(doc(db, 'users/prof2'), { ...perfil('prof2', { rol: 'docente' }), creadoEn: Timestamp.now() });
  await setDoc(doc(db, 'users/adm1'), { ...perfil('adm1', { rol: 'admin' }), creadoEn: Timestamp.now() });
  await setDoc(doc(db, 'classes/c1'), { docenteId: 'prof1', nombre: '4A', grado: 4, grupo: 'A', color: '#6C4CF5', codigo: 'ABC234', config: {}, activa: true });
  await setDoc(doc(db, 'class_codes/ABC234'), { classId: 'c1', docenteId: 'prof1' });
  await setDoc(doc(db, 'enrollments/c1_est1'), { uid: 'est1', classId: 'c1', docenteId: 'prof1', codigo: 'ABC234', alias: 'Prue', stats: { xp: 0 } });
  await setDoc(doc(db, 'sessions/s_est1'), { ...sesion('est1'), classId: 'c1', docenteId: 'prof1', creadoEn: Timestamp.now() });
  await setDoc(doc(db, 'sessions/s_est2'), { ...sesion('est2'), creadoEn: Timestamp.now() });
  await setDoc(doc(db, 'badges/b1'), { nombre: 'Primera vez' });
  await setDoc(doc(db, 'lessons/l1'), { titulo: 'Fila base' });
  await setDoc(doc(db, 'teacher_whitelist/profe.nuevo@colegio.edu.co'), { correo: 'profe.nuevo@colegio.edu.co' });
  await setDoc(doc(db, 'shop_items/gorra'), { nombre: 'Gorra', precio: 30 });
  await setDoc(doc(db, 'users/rico'), { ...perfil('rico'), monedas: 100, creadoEn: Timestamp.now() });
  await setDoc(doc(db, 'assignments/a1'), { docenteId: 'prof1', classId: 'c1', titulo: 'Fila base', tipo: 'leccion', refId: 'm1-l1' });
});

const est1 = env.authenticatedContext('est1').firestore();
const prof1 = env.authenticatedContext('prof1').firestore();
const prof2 = env.authenticatedContext('prof2').firestore();
const adm1 = env.authenticatedContext('adm1', { email: ADMIN_EMAIL, email_verified: true }).firestore();
const anon = env.unauthenticatedContext().firestore();

console.log('\nPerfiles y roles');
await prueba('anónimo no lee nada', () => assertFails(getDoc(doc(anon, 'users/est1'))));
await prueba('usuario nuevo crea su perfil de estudiante', () => assertSucceeds(setDoc(doc(env.authenticatedContext('nuevo').firestore(), 'users/nuevo'), perfil('nuevo'))));
await prueba('NO puede crearse como admin sin el correo configurado', () => assertFails(setDoc(doc(env.authenticatedContext('x1', { email: 'otro@gmail.com', email_verified: true }).firestore(), 'users/x1'), perfil('x1', { rol: 'admin' }))));
await prueba('NO puede crearse como docente sin lista blanca', () => assertFails(setDoc(doc(env.authenticatedContext('x2', { email: 'otro@gmail.com', email_verified: true }).firestore(), 'users/x2'), perfil('x2', { rol: 'docente' }))));
await prueba('correo admin SIN verificar no sirve', () => assertFails(setDoc(doc(env.authenticatedContext('x3', { email: ADMIN_EMAIL, email_verified: false }).firestore(), 'users/x3'), perfil('x3', { rol: 'admin', email: ADMIN_EMAIL }))));
await prueba('correo admin verificado puede crear perfil admin', () => assertSucceeds(setDoc(doc(env.authenticatedContext('x4', { email: ADMIN_EMAIL, email_verified: true }).firestore(), 'users/x4'), perfil('x4', { rol: 'admin', email: ADMIN_EMAIL }))));
await prueba('NO crea perfil con 5000 XP inicial', () => assertFails(setDoc(doc(env.authenticatedContext('x5').firestore(), 'users/x5'), perfil('x5', { xp: 5000 }))));
await prueba('estudiante lee su perfil', () => assertSucceeds(getDoc(doc(est1, 'users/est1'))));
await prueba('estudiante NO lee el de otro', () => assertFails(getDoc(doc(est1, 'users/est2'))));
await prueba('estudiante puede personalizar su avatar (mascota, accesorios, cuarto)', () => assertSucceeds(updateDoc(doc(est1, 'users/est1'), { avatar: { emoji: '🦊', fondo: 'violeta', mascota: 'panda', accesorios: ['🧢', '🕶️'], cuarto: { escena: 'espacio', deco: { izquierda: '🪴' } } } })));
await prueba('NO puede llenar el avatar de basura (demasiados accesorios)', () => assertFails(updateDoc(doc(est1, 'users/est1'), { avatar: { emoji: '🦊', accesorios: Array.from({ length: 50 }, () => '🧢') } })));
await prueba('NO puede guardar un avatar con texto enorme', () => assertFails(updateDoc(doc(est1, 'users/est1'), { avatar: { emoji: 'x'.repeat(5000) } })));
await prueba('NO puede guardar un avatar con decenas de claves', () => assertFails(updateDoc(doc(est1, 'users/est1'), { avatar: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, 1])) })));
await prueba('docente NO lee perfiles ajenos', () => assertFails(getDoc(doc(prof1, 'users/est1'))));
await prueba('admin lee cualquier perfil', () => assertSucceeds(getDoc(doc(adm1, 'users/est1'))));
await prueba('estudiante NO se cambia el rol', () => assertFails(updateDoc(doc(est1, 'users/est1'), { rol: 'admin' })));
await prueba('estudiante suma +50 XP', () => assertSucceeds(updateDoc(doc(est1, 'users/est1'), { xp: 50 })));
await prueba('estudiante NO se inyecta +9999 XP', () => assertFails(updateDoc(doc(est1, 'users/est1'), { xp: 9999 })));
await prueba('estudiante NO baja su XP', () => assertFails(updateDoc(doc(est1, 'users/est1'), { xp: 10 })));
await prueba('estudiante NO cambia su grado una vez fijado', () => assertFails(updateDoc(doc(est1, 'users/est1'), { grado: 6 })));
await prueba('estudiante NO sube racha +30 de golpe', () => assertFails(updateDoc(doc(est1, 'users/est1'), { racha: 30 })));

console.log('\nSesiones (anti-trampa)');
await prueba('sesión válida', () => assertSucceeds(addDoc(collection(est1, 'sessions'), sesion('est1'))));
await prueba('sesión válida con clase propia', () => assertSucceeds(addDoc(collection(est1, 'sessions'), sesion('est1', { classId: 'c1', docenteId: 'prof1' }))));
await prueba('NO sesión de 999 PPM', () => assertFails(addDoc(collection(est1, 'sessions'), sesion('est1', { wpm: 999 }))));
await prueba('NO PPM incoherente (200 PPM con 20 caracteres)', () => assertFails(addDoc(collection(est1, 'sessions'), sesion('est1', { wpm: 150, caracteres: 20, duracionSeg: 60 }))));
await prueba('NO 5000 caracteres en 10 segundos', () => assertFails(addDoc(collection(est1, 'sessions'), sesion('est1', { caracteres: 5000, duracionSeg: 10, wpm: 100 }))));
await prueba('NO sesión a nombre de otro', () => assertFails(addDoc(collection(est1, 'sessions'), sesion('est2'))));
await prueba('NO precisión 150 %', () => assertFails(addDoc(collection(est1, 'sessions'), sesion('est1', { precision: 150 }))));
await prueba('NO inventar docenteId de una clase ajena', () => assertFails(addDoc(collection(est1, 'sessions'), sesion('est1', { classId: 'c1', docenteId: 'prof2' }))));
await prueba('sesiones son inmutables', () => assertFails(updateDoc(doc(est1, 'sessions/s_est1'), { wpm: 100 })));
await prueba('estudiante lee sus sesiones', () => assertSucceeds(getDocs(query(collection(est1, 'sessions'), where('uid', '==', 'est1')))));
await prueba('estudiante NO lee sesiones de otro', () => assertFails(getDoc(doc(est1, 'sessions/s_est2'))));
await prueba('docente lee sesiones de SUS clases', () => assertSucceeds(getDocs(query(collection(prof1, 'sessions'), where('docenteId', '==', 'prof1')))));
await prueba('otro docente NO las lee', () => assertFails(getDoc(doc(prof2, 'sessions/s_est1'))));

console.log('\nClases, códigos y catálogos');
await prueba('docente crea su clase', () => assertSucceeds(setDoc(doc(prof1, 'classes/c9'), { docenteId: 'prof1', nombre: '5B', grado: 5, grupo: 'B', color: '#FF6B5B', codigo: 'ZZZ999', config: {}, activa: true })));
await prueba('docente NO crea clase a nombre de otro', () => assertFails(setDoc(doc(prof1, 'classes/c10'), { docenteId: 'prof2', nombre: 'X', grado: 5, grupo: 'B', color: '#FF6B5B', codigo: 'ZZZ998', config: {}, activa: true })));
await prueba('estudiante NO crea clases', () => assertFails(setDoc(doc(est1, 'classes/c11'), { docenteId: 'est1', nombre: 'X', grado: 5, grupo: 'B', color: '#FF6B5B', codigo: 'ZZZ997', config: {}, activa: true })));
await prueba('otro docente NO edita la clase', () => assertFails(updateDoc(doc(prof2, 'classes/c1'), { nombre: 'Hackeada' })));
await prueba('se puede consultar un código de clase', () => assertSucceeds(getDoc(doc(est1, 'class_codes/ABC234'))));
await prueba('NO se pueden listar los códigos', () => assertFails(getDocs(collection(est1, 'class_codes'))));
await prueba('estudiante se une con un código válido', () => assertSucceeds(setDoc(doc(env.authenticatedContext('est2').firestore(), 'enrollments/c1_est2'), { uid: 'est2', classId: 'c1', docenteId: 'prof1', codigo: 'ABC234', alias: 'Prue2', stats: { xp: 0 }, unidoEn: serverTimestamp() })));
await prueba('NO se une con docenteId falso', () => assertFails(setDoc(doc(env.authenticatedContext('est2').firestore(), 'enrollments/c1_est2b'), { uid: 'est2', classId: 'c1', docenteId: 'prof2', codigo: 'ABC234', alias: 'P', stats: { xp: 0 }, unidoEn: serverTimestamp() })));
await prueba('estudiante NO escribe catálogo de lecciones', () => assertFails(setDoc(doc(est1, 'lessons/hack'), { titulo: 'x' })));
await prueba('estudiante lee lecciones', () => assertSucceeds(getDoc(doc(est1, 'lessons/l1'))));
await prueba('admin escribe lecciones', () => assertSucceeds(setDoc(doc(adm1, 'lessons/l2'), { titulo: 'Fila superior' })));
await prueba('estudiante NO lee la auditoría', () => assertFails(getDocs(collection(est1, 'audit_logs'))));
await prueba('admin lee la auditoría', () => assertSucceeds(getDocs(collection(adm1, 'audit_logs'))));
await prueba('auditoría: no se puede editar', () => assertFails(updateDoc(doc(adm1, 'audit_logs/a1'), { accion: 'x' })));
await prueba('medalla válida', () => assertSucceeds(setDoc(doc(est1, 'badges_earned/est1_b1'), { uid: 'est1', badgeId: 'b1', ganadaEn: serverTimestamp() })));
await prueba('NO medalla inexistente', () => assertFails(setDoc(doc(est1, 'badges_earned/est1_zzz'), { uid: 'est1', badgeId: 'zzz', ganadaEn: serverTimestamp() })));

console.log('\nLista blanca, tareas y tienda');
const profeNuevo = env.authenticatedContext('pn', { email: 'Profe.Nuevo@colegio.edu.co', email_verified: true }).firestore();
await prueba('correo en lista blanca puede crearse como docente', () => assertSucceeds(setDoc(doc(profeNuevo, 'users/pn'), perfil('pn', { rol: 'docente', email: 'profe.nuevo@colegio.edu.co' }))));
await prueba('docente crea tarea para su clase', () => assertSucceeds(setDoc(doc(prof1, 'assignments/a2'), { docenteId: 'prof1', classId: 'c1', titulo: 'Tilde', tipo: 'ejercicio', refId: 'x1' })));
await prueba('docente NO crea tarea en clase ajena', () => assertFails(setDoc(doc(prof2, 'assignments/a3'), { docenteId: 'prof2', classId: 'c1', titulo: 'x', tipo: 'ejercicio', refId: 'x1' })));
await prueba('estudiante inscrito lee la tarea', () => assertSucceeds(getDoc(doc(est1, 'assignments/a1'))));
await prueba('estudiante NO inscrito no lee la tarea', () => assertFails(getDoc(doc(env.authenticatedContext('est9').firestore(), 'assignments/a1'))));
const rico = env.authenticatedContext('rico').firestore();
await prueba('compra correcta (lote: -30 monedas + inventario)', async () => { const b = writeBatch(rico); b.update(doc(rico, 'users/rico'), { monedas: 70 }); b.set(doc(rico, 'inventory/rico_gorra'), { uid: 'rico', itemId: 'gorra', compradoEn: serverTimestamp(), equipado: false }); await assertSucceeds(b.commit()); });
await prueba('NO compra regalada (inventario sin descontar monedas)', () => assertFails(setDoc(doc(est1, 'inventory/est1_gorra'), { uid: 'est1', itemId: 'gorra', compradoEn: serverTimestamp(), equipado: false })));

console.log('\nAdministrador único, aprobación de docentes, marca y fotos');
const goog = (uid, email, v = true) => env.authenticatedContext(uid, { email, email_verified: v }).firestore();
await prueba('docente por Google (sin lista blanca) queda PENDIENTE', () => assertSucceeds(setDoc(doc(goog('p1', 'nuevo.profe@colegio.edu.co'), 'users/p1'), perfil('p1', { rol: 'pendiente', email: 'nuevo.profe@colegio.edu.co', authTipo: 'google' }))));
await prueba('pendiente NO puede autopromoverse a docente', () => assertFails(updateDoc(doc(goog('p1', 'nuevo.profe@colegio.edu.co'), 'users/p1'), { rol: 'docente' })));
await prueba('pendiente NO ve clases ni crea clases', () => assertFails(setDoc(doc(goog('p1', 'nuevo.profe@colegio.edu.co'), 'classes/cp'), { docenteId: 'p1', nombre: 'X', grado: 4, grupo: 'A', color: '#6C4CF5', codigo: 'QQQ222', config: {}, activa: true })));
await prueba('el admin (franksanlo) aprueba al docente', () => assertSucceeds(updateDoc(doc(adm1, 'users/p1'), { rol: 'docente' })));
await prueba('un docente NO puede aprobar a otro', () => assertFails(updateDoc(doc(prof1, 'users/p1'), { rol: 'docente' })));
await prueba('un usuario con rol admin en su perfil pero otro correo NO es admin', () => assertFails(updateDoc(doc(goog('falso', 'otro@gmail.com'), 'users/est1'), { rol: 'admin' })));
await prueba('NO se puede crear perfil admin con otro correo verificado', () => assertFails(setDoc(doc(goog('y1', 'otro@gmail.com'), 'users/y1'), perfil('y1', { rol: 'admin', email: 'otro@gmail.com', authTipo: 'google' }))));
await prueba('admin agrega correo a la lista blanca', () => assertSucceeds(setDoc(doc(adm1, 'teacher_whitelist/nuevo@colegio.edu.co'), { correo: 'nuevo@colegio.edu.co' })));
await prueba('docente NO escribe la lista blanca', () => assertFails(setDoc(doc(prof1, 'teacher_whitelist/otro@x.co'), { correo: 'otro@x.co' })));
await prueba('cualquiera (sin sesión) lee la marca pública', () => assertSucceeds(getDoc(doc(anon, 'config/branding'))));
await prueba('NO se lee otra configuración sin sesión', () => assertFails(getDoc(doc(anon, 'config/app'))));
await prueba('solo el admin edita la marca', () => assertSucceeds(setDoc(doc(adm1, 'config/branding'), { nombre: 'MiTeclea', logo: 'data:image/png;base64,AAAA' })));
await prueba('un docente NO edita la marca', () => assertFails(setDoc(doc(prof1, 'config/branding'), { nombre: 'Hack' })));
const foto = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
await prueba('estudiante sube foto de perfil válida', () => assertSucceeds(updateDoc(doc(est1, 'users/est1'), { foto })));
await prueba('NO foto que no sea imagen', () => assertFails(updateDoc(doc(est1, 'users/est1'), { foto: 'http://malo.com/x.jpg' })));
await prueba('NO foto gigante (> 90 KB)', () => assertFails(updateDoc(doc(est1, 'users/est1'), { foto: 'data:image/jpeg;base64,' + 'A'.repeat(100000) })));
await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'config/app'), { permitirFotos: false, dominiosAlumnos: ['micolegio.edu.co'] }); });
await prueba('si el admin desactiva fotos, se rechazan', () => assertFails(updateDoc(doc(est1, 'users/est1'), { foto })));
await prueba('con dominio configurado: Gmail ajeno NO se registra como estudiante', () => assertFails(setDoc(doc(goog('d1', 'ajeno@gmail.com'), 'users/d1'), perfil('d1', { email: 'ajeno@gmail.com', authTipo: 'google' }))));
await prueba('con dominio configurado: correo del colegio SÍ', () => assertSucceeds(setDoc(doc(goog('d2', 'nino@micolegio.edu.co'), 'users/d2'), perfil('d2', { email: 'nino@micolegio.edu.co', authTipo: 'google' }))));
await prueba('estadísticas de teclas propias', () => assertSucceeds(setDoc(doc(est1, 'key_stats/est1'), { teclas: { a: { ok: 10, err: 1 } }, actualizadoEn: serverTimestamp() })));
await prueba('NO estadísticas de otro', () => assertFails(setDoc(doc(est1, 'key_stats/est2'), { teclas: {}, actualizadoEn: serverTimestamp() })));

console.log(`\n${ok} correctas, ${mal} con fallo`);
await env.cleanup();
process.exit(mal ? 1 : 0);
