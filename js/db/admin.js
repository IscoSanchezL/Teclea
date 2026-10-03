/**
 * Operaciones del administrador (sin DOM): docentes, lista blanca, ajustes, catálogos, respaldo y datos personales.
 * Las reglas de Firestore solo permiten estas escrituras a franksanlo@gmail.com (correo verificado).
 */
import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';
import * as store from './store.js';

const AJUSTES_BASE = { permitirFotos: true, dominiosAlumnos: [] };

/* ── Auditoría ── */
export function auditar(accion, objetivo = '', detalle = '') {
  const u = state.user; if (!u) return;
  store.enSegundoPlano(store.agregar('audit_logs', { actorUid: u.uid, rol: u.rol, accion: String(accion).slice(0, 60), objetivo: String(objetivo).slice(0, 120), detalle: String(detalle).slice(0, 300), creadoEn: store.ahora() }), 'auditoría');
}
export const listarAuditoria = (limite = 40) => store.consultar('audit_logs', { orden: ['creadoEn', 'desc'], limite });

/* ── Docentes ── */
export const usuariosPorRol = (rol) => store.consultar('users', { donde: [['rol', '==', rol]] });
export async function cambiarRol(usuario, rol) {
  await store.esperarMax(store.actualizar(`users/${usuario.uid || usuario.id}`, { rol }));
  auditar(rol === 'docente' ? 'Aprobó docente' : rol === 'rechazado' ? 'Rechazó docente' : `Cambió rol a ${rol}`, usuario.email || usuario.nombre, '');
}
export const listaBlanca = () => store.consultar('teacher_whitelist', {});
export async function agregarWhitelist(correo, area = '') {
  const c = String(correo).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) throw new Error('Escribe un correo válido.');
  await store.esperarMax(store.escribir(`teacher_whitelist/${c}`, { correo: c, area: String(area).slice(0, 60), creadoEn: store.ahora() }));
  auditar('Agregó docente a la lista blanca', c);
}
export async function quitarWhitelist(correo) { await store.esperarMax(store.borrar(`teacher_whitelist/${correo}`)); auditar('Quitó docente de la lista blanca', correo); }

/* ── Ajustes globales (config/app) ── */
export async function leerAjustes() { return { ...AJUSTES_BASE, ...((await store.leer('config/app').catch(() => null)) || {}) }; }
export async function guardarAjustes(parche) {
  const limpio = { ...parche };
  if (limpio.dominiosAlumnos) limpio.dominiosAlumnos = limpio.dominiosAlumnos.map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean).slice(0, 10);
  await store.esperarMax(store.escribir('config/app', limpio, { fusionar: true }));
  auditar('Cambió ajustes globales', Object.keys(parche).join(', '));
}

/* ── Catálogos (medallas y tienda): las reglas los consultan para validar premios y precios ── */
export async function estadoCatalogos() {
  const [b, s] = await Promise.all([store.consultar('badges', {}).catch(() => []), store.consultar('shop_items', {}).catch(() => [])]);
  const [db, ds] = await Promise.all([fetch('data/badges.json').then((r) => r.json()), fetch('data/shop.json').then((r) => r.json())]);
  return { badges: b.length, shop: s.length, badgesEsperadas: db.insignias.length, shopEsperados: ds.items.length, completo: b.length >= db.insignias.length && s.length >= ds.items.length };
}
export async function sembrarCatalogos() {
  const [db, ds] = await Promise.all([fetch('data/badges.json').then((r) => r.json()), fetch('data/shop.json').then((r) => r.json())]);
  const ops = [...db.insignias.map((m) => ({ tipo: 'set', ruta: `badges/${m.id}`, datos: m })), ...ds.items.map((i) => ({ tipo: 'set', ruta: `shop_items/${i.id}`, datos: i }))];
  await store.esperarMax(store.lote(ops), 15000);
  auditar('Publicó catálogos', `${db.insignias.length} medallas, ${ds.items.length} artículos`);
  return ops.length;
}

/* ── Respaldo manual y datos personales ── */
const COLECCIONES = ['users', 'classes', 'class_codes', 'enrollments', 'lessons_progress', 'sessions', 'badges_earned', 'inventory', 'challenge_progress', 'assignments', 'submissions', 'custom_exercises', 'teacher_whitelist', 'config', 'audit_logs'];
/** Exporta todo lo que el administrador puede listar (key_stats y contadores solo se leen uno a uno y quedan fuera). */
export async function exportarTodo(alProgreso = () => {}) {
  const out = { app: CONFIG.appName, version: CONFIG.version, exportadoEn: new Date().toISOString(), colecciones: {}, omitidas: [] };
  for (const c of COLECCIONES) {
    alProgreso(c);
    try { out.colecciones[c] = await store.consultar(c, {}); } catch (e) { out.omitidas.push(`${c}: ${e?.code || 'error'}`); }
  }
  auditar('Exportó respaldo JSON', '', `${Object.values(out.colecciones).reduce((a, l) => a + l.length, 0)} documentos`);
  return out;
}
const DE_USUARIO = [['lessons_progress', 'uid'], ['sessions', 'uid'], ['badges_earned', 'uid'], ['inventory', 'uid'], ['challenge_progress', 'uid'], ['enrollments', 'uid'], ['submissions', 'uid']];
export async function exportarUsuario(uid) {
  const out = { exportadoEn: new Date().toISOString(), usuario: await store.leer(`users/${uid}`) };
  for (const [c, campo] of DE_USUARIO) out[c] = await store.consultar(c, { donde: [[campo, '==', uid]] }).catch(() => []);
  out.key_stats = await store.leer(`key_stats/${uid}`).catch(() => null); out.contadores = await store.leer(`contadores/${uid}`).catch(() => null);
  auditar('Exportó datos de un usuario', uid);
  return out;
}
/** Borra los datos del usuario en Firestore (la cuenta de acceso se elimina en la consola de Firebase → Authentication). */
export async function borrarDatosUsuario(uid) {
  const ops = [];
  for (const [c, campo] of DE_USUARIO) for (const d of await store.consultar(c, { donde: [[campo, '==', uid]] }).catch(() => [])) ops.push({ tipo: 'delete', ruta: `${c}/${d.id}` });
  for (const e of await store.consultar('enrollments', { donde: [['uid', '==', uid]] }).catch(() => [])) ops.push({ tipo: 'delete', ruta: `classes/${e.classId}/ranking/${uid}` }, { tipo: 'delete', ruta: `classes/${e.classId}/aportes/${uid}` });
  for (const r of ['key_stats', 'contadores']) ops.push({ tipo: 'delete', ruta: `${r}/${uid}` });
  ops.push({ tipo: 'delete', ruta: `users/${uid}` });
  for (let i = 0; i < ops.length; i += 400) await store.esperarMax(store.lote(ops.slice(i, i + 400)), 15000);
  auditar('Eliminó datos de un usuario', uid, `${ops.length} documentos`);
  return ops.length;
}
