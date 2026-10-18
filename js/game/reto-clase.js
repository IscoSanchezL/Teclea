/**
 * Retos en vivo que activa el docente (lógica pura, sin DOM ni Firebase).
 *
 *   'parejas' → reto de fluidez: todos escriben el MISMO texto de palabras y frases; el puntaje de la pareja es la suma.
 *   'final'   → reto de cierre: cada estudiante escribe un mensaje corto y el docente reparte los mensajes
 *               (nadie recibe el suyo); el podio es individual.
 */

export const TIPOS = ['parejas', 'final'];
export const DURACIONES = [60, 120, 180];
export const MENSAJE_MIN = 8;
export const MENSAJE_MAX = 90;

/** Puntaje de una ronda: velocidad × precisión² (premia escribir bien, no solo rápido). */
export const puntos = (ppm, precision) => {
  const p = Math.max(0, Math.min(100, Number(precision) || 0)) / 100;
  return Math.round(Math.max(0, Number(ppm) || 0) * p * p * 10);
};

export function mezclar(lista, azar = Math.random) {
  const b = [...lista];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

/** Forma parejas al azar. Si sobra uno, se une a la última pareja (trío). @param {{uid:string, alias:string}[]} alumnos */
export function armarParejas(alumnos, azar = Math.random) {
  const m = mezclar(alumnos, azar);
  const grupos = [];
  for (let i = 0; i < m.length; i += 2) grupos.push(m.slice(i, i + 2));
  if (grupos.length > 1 && grupos.at(-1).length === 1) grupos.at(-2).push(grupos.pop()[0]);
  return grupos.map((g, i) => ({ n: i + 1, uids: g.map((a) => a.uid), alias: g.map((a) => a.alias) }));
}

/** Limpia y valida el mensaje que un estudiante propone a un compañero. */
export function validarMensaje(txt) {
  const texto = String(txt ?? '').replace(/\s+/g, ' ').trim();
  if (texto.length < MENSAJE_MIN) return { ok: false, error: 'corto', texto };
  if (texto.length > MENSAJE_MAX) return { ok: false, error: 'largo', texto };
  if (!/^[\p{L}\p{N} .,;:!?¡¿'"()-]+$/u.test(texto)) return { ok: false, error: 'raro', texto };
  return { ok: true, texto };
}

/**
 * Reparte los mensajes: cada jugador recibe el de OTRO compañero y todos los mensajes se usan por igual (±1).
 * @param {string[]} jugadores uids que van a escribir
 * @param {string[]} autores   uids que enviaron mensaje (se necesitan al menos 2)
 * @returns {Record<string,string>} jugador → autor del mensaje que le toca
 */
export function repartirMensajes(jugadores, autores, azar = Math.random) {
  if (new Set(autores).size < 2) throw new Error('Se necesitan al menos 2 mensajes');
  const A = mezclar(autores, azar), J = mezclar(jugadores, azar);
  const asig = {};
  J.forEach((j, i) => { asig[j] = A[i % A.length]; });
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    let hubo = false;
    J.forEach((j, i) => {
      if (asig[j] !== j) return;
      hubo = true;
      const otro = J.find((x, k) => k !== i && asig[x] !== j && asig[j] !== x);
      if (otro) [asig[j], asig[otro]] = [asig[otro], asig[j]];
    });
    if (!hubo) break;
  }
  for (const j of J) if (asig[j] === j) asig[j] = A.find((a) => a !== j);
  return asig;
}

/** Quita lo que no se puede teclear bien con teclado y arma un texto de palabras y frases cortas para el tiempo dado. */
export function armarTextoReto(textos, { niveles = [2, 3], seg = 120 } = {}, azar = Math.random) {
  let pool = textos.filter((x) => niveles.includes(x.nivel) && x.texto.length <= 140);
  if (pool.length < 3) pool = textos.filter((x) => x.texto.length <= 140);
  const objetivo = Math.max(200, Math.round(seg * 9));
  const sal = []; let len = 0;
  for (const x of mezclar(pool, azar)) { sal.push(x.texto); len += x.texto.length + 1; if (len >= objetivo) break; }
  return sal.join(' ');
}

const mejor = (a, b) => (b.puntos - a.puntos) || (b.precision - a.precision) || (a.alias || '').localeCompare(b.alias || '');

/** Marca el puesto (1, 2, 3…) con empates: mismo puntaje y precisión → mismo puesto. */
export function numerar(lista) {
  return lista.map((x, i) => ({ ...x, puesto: i && lista[i - 1].puntos === x.puntos && lista[i - 1].precision === x.precision ? 0 : i + 1 }))
    .map((x, i, a) => ({ ...x, puesto: x.puesto || a[i - 1].puesto }));
}

/** Ranking individual (reto final): solo quienes terminaron. */
export function rankingIndividual(entradas) {
  return numerar(entradas.filter((e) => e.terminado).map((e) => ({ uid: e.uid, alias: e.alias, puntos: e.puntos || 0, ppm: e.wpm || 0, precision: e.precision || 0 })).sort(mejor));
}

/** Ranking por parejas: suma de puntos de sus integrantes; la precisión es el promedio de quienes terminaron. */
export function rankingParejas(parejas, entradas) {
  const por = new Map(entradas.map((e) => [e.uid, e]));
  const filas = parejas.map((p) => {
    const hechos = p.uids.map((u) => por.get(u)).filter((e) => e?.terminado);
    const prom = (k) => (hechos.length ? Math.round((hechos.reduce((s, e) => s + (e[k] || 0), 0) / hechos.length) * 10) / 10 : 0);
    return { n: p.n, uids: p.uids, alias: p.alias, nombre: p.alias.join(' + '), puntos: hechos.reduce((s, e) => s + (e.puntos || 0), 0), ppm: prom('wpm'), precision: prom('precision'), terminaron: hechos.length, total: p.uids.length };
  }).filter((f) => f.terminaron > 0).sort(mejor);
  return numerar(filas);
}
