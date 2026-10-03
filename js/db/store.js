/**
 * Capa de datos única: misma API para el modo demo (localStorage) y para Firestore.
 * Todo el resto de la app (repositorios) se escribe UNA vez contra estas funciones.
 *
 *   leer(ruta)                       → objeto {id, ...} | null
 *   escribir(ruta, datos, {fusionar})
 *   actualizar(ruta, parche)         (admite claves con punto: 'stats.xp')
 *   agregar(coleccion, datos)        → id
 *   borrar(ruta)
 *   consultar(coleccion, {donde:[[campo,op,valor]], orden:[campo,'asc'|'desc'], limite})
 *   lote([{tipo:'set'|'update'|'delete', ruta, datos, fusionar}])
 *
 * Valores especiales: ahora() (hora del servidor), sumar(n) (incremento atómico), unirLista(...v).
 * Las fechas se devuelven SIEMPRE como milisegundos (número), en ambos modos.
 */
import { state } from '../core/state.js';
import { almacen } from '../core/utils.js';

export const ahora = () => ({ __op: 'ahora' });
export const sumar = (n) => ({ __op: 'sumar', n });
export const unirLista = (...v) => ({ __op: 'union', v });
const esOp = (v) => v && typeof v === 'object' && typeof v.__op === 'string';

let fbInyectado = null;
/** Solo para pruebas (Node + emulador): entrega un objeto {db, fs}. */
export const _inyectarFirebase = (fb) => { fbInyectado = fb; };

async function fb() {
  if (fbInyectado) return fbInyectado;
  const { obtenerFirebase } = await import('./firebase.js');
  return obtenerFirebase();
}
const usaNube = () => state.modo === 'firebase';

/* ═════════════ Utilidades ═════════════ */
const partes = (ruta) => ruta.split('/').filter(Boolean);
const idDe = (ruta) => partes(ruta).at(-1);
const copiar = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

/** Convierte Timestamps de Firestore (y objetos anidados) a milisegundos. */
function normalizar(v) {
  if (v == null || typeof v !== 'object') return v;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (Array.isArray(v)) return v.map(normalizar);
  const o = {};
  for (const [k, x] of Object.entries(v)) o[k] = normalizar(x);
  return o;
}

/* ═════════════ Backend local (demo) ═════════════ */
const CLAVE_LOCAL = 'teclea:local-db';
let mem = null;
let guardarTimer = null;

function db() {
  if (!mem) mem = almacen.leer(CLAVE_LOCAL, {}) || {};
  return mem;
}
function persistir() {
  clearTimeout(guardarTimer);
  guardarTimer = setTimeout(() => almacen.guardar(CLAVE_LOCAL, mem), 150);
}
/** Para pruebas: vacía la base local. */
export function _reiniciarLocal() { mem = {}; almacen.borrar(CLAVE_LOCAL); }

function resolverLocal(previo, nuevo) {
  const salida = { ...previo };
  for (const [k, v] of Object.entries(nuevo)) {
    let actual = salida;
    const camino = k.split('.');
    const ultimo = camino.pop();
    for (const c of camino) { actual[c] = { ...(actual[c] || {}) }; actual = actual[c]; }
    if (esOp(v)) {
      if (v.__op === 'ahora') actual[ultimo] = Date.now();
      else if (v.__op === 'sumar') actual[ultimo] = (Number(actual[ultimo]) || 0) + v.n;
      else if (v.__op === 'union') actual[ultimo] = [...new Set([...(actual[ultimo] || []), ...v.v])];
    } else if (v && typeof v === 'object' && !Array.isArray(v) && !k.includes('.')) {
      actual[ultimo] = resolverLocal({}, v);
    } else {
      actual[ultimo] = copiar(v);
    }
  }
  return salida;
}

const local = {
  leer: (ruta) => { const d = db()[ruta]; return d ? { id: idDe(ruta), ...copiar(d) } : null; },
  escribir(ruta, datos, { fusionar = false } = {}) {
    db()[ruta] = resolverLocal(fusionar ? (db()[ruta] || {}) : {}, datos);
    persistir();
  },
  actualizar(ruta, parche) {
    if (!db()[ruta]) throw Object.assign(new Error(`No existe ${ruta}`), { code: 'not-found' });
    db()[ruta] = resolverLocal(db()[ruta], parche);
    persistir();
  },
  borrar(ruta) { delete db()[ruta]; persistir(); },
  agregar(coleccion, datos) {
    const id = `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    local.escribir(`${coleccion}/${id}`, datos);
    return id;
  },
  consultar(coleccion, { donde = [], orden = null, limite = 0 } = {}) {
    const n = partes(coleccion).length;
    let docs = Object.entries(db())
      .filter(([r]) => r.startsWith(`${coleccion}/`) && partes(r).length === n + 1)
      .map(([r, d]) => ({ id: idDe(r), ...copiar(d) }));
    for (const [campo, op, valor] of donde) {
      docs = docs.filter((d) => {
        const x = campo.split('.').reduce((a, k) => a?.[k], d);
        switch (op) {
          case '==': return x === valor;
          case '!=': return x !== valor;
          case '<': return x < valor;
          case '<=': return x <= valor;
          case '>': return x > valor;
          case '>=': return x >= valor;
          case 'in': return valor.includes(x);
          case 'array-contains': return Array.isArray(x) && x.includes(valor);
          default: return true;
        }
      });
    }
    if (orden) {
      const [campo, dir = 'asc'] = orden;
      const get = (d) => campo.split('.').reduce((a, k) => a?.[k], d);
      docs.sort((a, b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * (dir === 'desc' ? -1 : 1));
    }
    return limite ? docs.slice(0, limite) : docs;
  },
  lote(ops) {
    for (const o of ops) {
      if (o.tipo === 'delete') local.borrar(o.ruta);
      else if (o.tipo === 'update') local.actualizar(o.ruta, o.datos);
      else local.escribir(o.ruta, o.datos, { fusionar: o.fusionar });
    }
  },
};

/* ═════════════ Backend Firestore ═════════════ */
function aFirestore(F, v) {
  if (esOp(v)) {
    if (v.__op === 'ahora') return F.fs.serverTimestamp();
    if (v.__op === 'sumar') return F.fs.increment(v.n);
    if (v.__op === 'union') return F.fs.arrayUnion(...v.v);
  }
  if (Array.isArray(v)) return v.map((x) => aFirestore(F, x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFirestore(F, x)]));
  return v;
}
const refDoc = (F, ruta) => F.fs.doc(F.db, ...partes(ruta));

const nube = {
  async leer(ruta) {
    const F = await fb();
    const s = await F.fs.getDoc(refDoc(F, ruta));
    return s.exists() ? { id: s.id, ...normalizar(s.data()) } : null;
  },
  async escribir(ruta, datos, { fusionar = false } = {}) {
    const F = await fb();
    return F.fs.setDoc(refDoc(F, ruta), aFirestore(F, datos), fusionar ? { merge: true } : {});
  },
  async actualizar(ruta, parche) {
    const F = await fb();
    return F.fs.updateDoc(refDoc(F, ruta), aFirestore(F, parche));
  },
  async borrar(ruta) { const F = await fb(); return F.fs.deleteDoc(refDoc(F, ruta)); },
  async agregar(coleccion, datos) {
    const F = await fb();
    const r = await F.fs.addDoc(F.fs.collection(F.db, ...partes(coleccion)), aFirestore(F, datos));
    return r.id;
  },
  async consultar(coleccion, { donde = [], orden = null, limite = 0 } = {}) {
    const F = await fb();
    const { query, collection, where, orderBy, limit, getDocs } = F.fs;
    const rest = [...donde.map(([c, o, v]) => where(c, o, v))];
    if (orden) rest.push(orderBy(orden[0], orden[1] || 'asc'));
    if (limite) rest.push(limit(limite));
    const s = await getDocs(query(collection(F.db, ...partes(coleccion)), ...rest));
    return s.docs.map((d) => ({ id: d.id, ...normalizar(d.data()) }));
  },
  async lote(ops) {
    const F = await fb();
    const b = F.fs.writeBatch(F.db);
    for (const o of ops) {
      const r = refDoc(F, o.ruta);
      if (o.tipo === 'delete') b.delete(r);
      else if (o.tipo === 'update') b.update(r, aFirestore(F, o.datos));
      else b.set(r, aFirestore(F, o.datos), o.fusionar ? { merge: true } : {});
    }
    return b.commit();
  },
};

/* ═════════════ API pública ═════════════ */
const elegir = () => (usaNube() ? nube : local);
export const leer = async (...a) => elegir().leer(...a);
export const escribir = async (...a) => elegir().escribir(...a);
export const actualizar = async (...a) => elegir().actualizar(...a);
export const borrar = async (...a) => elegir().borrar(...a);
export const agregar = async (...a) => elegir().agregar(...a);
export const consultar = async (...a) => elegir().consultar(...a);
export const lote = async (...a) => elegir().lote(...a);

/**
 * Escritura "sin esperar": en Firestore, una escritura sin red no resuelve hasta reconectar
 * (queda en la cola local). Para no congelar la pantalla, la lanzamos y solo registramos errores.
 */
export function enSegundoPlano(promesa, etiqueta = 'escritura') {
  Promise.resolve(promesa).catch((e) => console.warn(`[datos] ${etiqueta} falló`, e?.code || e));
}
