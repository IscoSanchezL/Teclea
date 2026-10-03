/**
 * Operaciones del administrador contra las REGLAS (emulador): catálogos, docentes, ajustes, respaldo y borrado.
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { state } from '../js/core/state.js';
import * as store from '../js/db/store.js';
import * as A from '../js/db/admin.js';

const fetchReal = globalThis.fetch;
globalThis.fetch = async (ruta, o) => String(ruta).startsWith('http') ? fetchReal(ruta, o) : ({ ok: true, json: async () => JSON.parse(readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8')) });
let ok = 0, mal = 0;
const t = (n, c, extra = '') => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}${c ? '' : '  ' + extra}`); };
const env = await initializeTestEnvironment({ projectId: 'demo-teclea', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } });
const base = (uid, extra = {}) => ({ uid, nombre: `Nombre ${uid}`, apodo: uid, email: `${uid}@x.co`, rol: 'estudiante', grado: 4, avatar: {}, xp: 0, nivel: 1, monedas: 0, racha: 0, rachaMax: 0, protectores: 0, prefs: {}, authTipo: 'google', activo: true, creadoPor: null, creadoEn: fs.Timestamp.now(), ...extra });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await fs.setDoc(fs.doc(db, 'users/adm'), base('adm', { rol: 'admin', email: 'franksanlo@gmail.com' }));
  await fs.setDoc(fs.doc(db, 'users/pend1'), base('pend1', { rol: 'pendiente', email: 'profe@colegio.edu.co' }));
  await fs.setDoc(fs.doc(db, 'users/est1'), base('est1', { solicitudEliminacion: Date.now() }));
  await fs.setDoc(fs.doc(db, 'sessions/s1'), { uid: 'est1', tipo: 'leccion', wpm: 10, precision: 90, errores: 1, duracionSeg: 60, caracteres: 50, creadoEn: fs.Timestamp.now() });
  await fs.setDoc(fs.doc(db, 'enrollments/c1_est1'), { uid: 'est1', classId: 'c1', docenteId: 'p', alias: 'x', stats: { xp: 0 } });
  await fs.setDoc(fs.doc(db, 'classes/c1/ranking/est1'), { apodo: 'x', puntos: 1, mejora: 1 });
});
const usar = (uid, token) => { store._inyectarFirebase({ fs, db: env.authenticatedContext(uid, token).firestore() }); };
state.modo = 'firebase'; state.user = { uid: 'adm', rol: 'admin' };

console.log('Administrador (correo verificado)');
usar('adm', { email: 'franksanlo@gmail.com', email_verified: true });
let c = await A.estadoCatalogos(); t('catálogos vacíos al inicio', !c.completo && c.badges === 0);
try { const n = await A.sembrarCatalogos(); t(`publica catálogos (${n} documentos)`, n >= 70); } catch (e) { t('publica catálogos', false, e.message); }
c = await A.estadoCatalogos(); t('catálogos completos', c.completo);
t('lista solicitudes pendientes', (await A.usuariosPorRol('pendiente')).length === 1);
await A.cambiarRol({ uid: 'pend1', email: 'profe@colegio.edu.co' }, 'docente');
t('aprueba un docente', (await store.leer('users/pend1')).rol === 'docente');
await A.agregarWhitelist('Profe.Nuevo@Colegio.edu.co', 'Tecnología');
t('lista blanca (correo en minúsculas)', (await A.listaBlanca()).some((w) => w.id === 'profe.nuevo@colegio.edu.co'));
try { await A.agregarWhitelist('no-es-correo'); t('rechaza correo inválido', false); } catch { t('rechaza correo inválido', true); }
await A.guardarAjustes({ permitirFotos: false, dominiosAlumnos: ['@MiColegio.edu.co', ' '] });
const aj = await A.leerAjustes(); t('guarda ajustes (dominios normalizados)', aj.permitirFotos === false && aj.dominiosAlumnos.length === 1 && aj.dominiosAlumnos[0] === 'micolegio.edu.co');
await new Promise((r) => setTimeout(r, 400));
t('registro de auditoría legible', (await A.listarAuditoria(20)).length >= 4);
const todo = await A.exportarTodo(); t('exporta respaldo con usuarios y sesiones', todo.colecciones.users.length >= 3 && todo.colecciones.sessions.length === 1);
const u = await A.exportarUsuario('est1'); t('exporta los datos de un usuario', u.usuario.uid === 'est1' && u.sessions.length === 1);
const sol = await store.consultar('users', { donde: [['solicitudEliminacion', '>', 0]] }); t('lista solicitudes de eliminación', sol.length === 1);
const n = await A.borrarDatosUsuario('est1'); t(`elimina datos del usuario (${n} docs)`, n >= 4 && !(await store.leer('users/est1')) && !(await store.leer('classes/c1/ranking/est1')));

console.log('\nCualquier otra persona NO puede');
usar('pend1', { email: 'profe@colegio.edu.co', email_verified: true });
state.user = { uid: 'pend1', rol: 'docente' };
try { await A.sembrarCatalogos(); t('docente publica catálogos', false); } catch { t('un docente NO puede publicar catálogos', true); }
try { await A.agregarWhitelist('otro@x.co'); t('docente edita lista blanca', false); } catch { t('un docente NO puede editar la lista blanca', true); }
try { await A.guardarAjustes({ permitirFotos: true }); t('docente cambia ajustes', false); } catch { t('un docente NO puede cambiar ajustes', true); }
try { await A.cambiarRol({ uid: 'pend1' }, 'admin'); t('autopromoción a admin', false); } catch { t('nadie puede autopromoverse a admin', true); }
usar('falso', { email: 'franksanlo@gmail.com', email_verified: false });
try { await A.guardarAjustes({ permitirFotos: true }); t('correo del admin SIN verificar', false); } catch { t('el correo del admin sin verificar NO sirve', true); }

console.log(`\n${ok} correctas, ${mal} con fallo`);
await env.cleanup(); process.exit(mal ? 1 : 0);
