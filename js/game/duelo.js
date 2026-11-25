/**
 * Duelos de teclas entre compañeros: lógica pura (sin DOM ni Firebase), probada en Node.
 * Un duelo es una carrera: los dos escriben el MISMO texto; gana quien lo termina primero (menor tiempo propio).
 * Si el tiempo se acaba, gana quien lleve más letras correctas.
 */

export const NIVELES = ['corto', 'medio', 'largo'];
export const SEG_NIVEL = { corto: 90, medio: 120, largo: 150 };   // tiempo máximo según el largo del texto (las reglas aceptan 20–180 s)
export const SEG_DUELO = SEG_NIVEL.medio;
/** Nivel de un duelo ya creado, a partir de su tiempo. */
export const nivelDeSeg = (seg) => NIVELES.find((n) => SEG_NIVEL[n] === seg) || 'medio';
export const CUENTA_REGRESIVA = 3;           // 3-2-1
export const LATIDO_MS = 30 * 1000;          // cada cuánto avisa "sigo aquí" mientras está en la sala
export const VIGENCIA_LINEA_MS = 90 * 1000;  // sin latido en este tiempo = ya no está en línea
export const VIGENCIA_INVITACION_MS = 60 * 1000;
export const ESPERA_JUEGO_MS = 150 * 1000;   // en un reto de juego, cuánto se espera al rival que aún juega
export const GRACIA_MS = 15 * 1000;          // tiempo extra para quien aún no termina cuando el otro ya terminó
export const MAX_LETRAS = 300;

// Palabras por grado y nivel (largo ≈ 130–290 letras: las reglas aceptan hasta 300)
const PALABRAS = {
  corto: { 2: 6, 3: 8, 4: 10, 5: 12, 6: 14 },
  medio: { 2: 12, 3: 16, 4: 20, 5: 24, 6: 28 },
  largo: { 2: 20, 3: 26, 4: 32, 5: 38, 6: 44 },
};

/** Texto del duelo según el grado: palabras del vocabulario (con tildes desde 4.º). `azar` solo se cambia en las pruebas. */
export function textoDuelo(grado, vocab, azar = Math.random, nivel = 'corto') {
  const n = (PALABRAS[nivel] || PALABRAS.corto)[grado] || 10;
  const base = [...(vocab?.sinTilde || [])];
  const conTilde = grado >= 4 ? [...(vocab?.conTilde || [])] : [];
  const piscina = [...base, ...conTilde].filter((p) => typeof p === 'string' && p.length >= 2 && p.length <= 8 && !/[üÜ]/.test(p));
  if (!piscina.length) return 'el sol sale por la manana y la luna por la noche';
  const salida = [];
  for (let i = 0; i < n; i++) salida.push(piscina[Math.floor(azar() * piscina.length)]);
  let texto = salida.join(' ');
  if (texto.length > MAX_LETRAS) texto = texto.slice(0, MAX_LETRAS).replace(/\s+\S*$/, '');   // sin cortar una palabra a medias
  return texto;
}

/** ¿Sigue en línea? `desfaseMs` corrige que el reloj del equipo no sea el del servidor. */
export const estaEnLinea = (presencia, ahoraMs, desfaseMs = 0) => Boolean(presencia?.visto) && (ahoraMs + desfaseMs - presencia.visto) <= VIGENCIA_LINEA_MS;
export const invitacionVigente = (duelo, ahoraMs, desfaseMs = 0) => duelo?.estado === 'invitado' && Boolean(duelo.creadoEn) && (ahoraMs + desfaseMs - duelo.creadoEn) <= VIGENCIA_INVITACION_MS;

/** Datos comparables de un jugador a partir de su avance guardado. */
export function puntaje(prog = {}) {
  return { completo: Boolean(prog.fin && prog.completo), ms: Number.isFinite(prog.ms) ? prog.ms : Infinity, pos: prog.pos || 0, err: prog.err || 0, fin: Boolean(prog.fin), pts: Number.isFinite(prog.pts) ? prog.pts : 0 };
}

/** 1 si gana `a`, -1 si gana `b`, 0 si empatan. */
export function comparar(a, b) {
  if (a.completo !== b.completo) return a.completo ? 1 : -1;
  if (a.completo) return a.ms === b.ms ? 0 : (a.ms < b.ms ? 1 : -1);
  if (a.pos !== b.pos) return a.pos > b.pos ? 1 : -1;
  if (a.err !== b.err) return a.err < b.err ? 1 : -1;
  return 0;
}

/**
 * Estado del duelo desde el punto de vista de `yo`.
 *  - 'esperando-rival': yo ya terminé y el otro todavía no
 *  - 'terminado': los dos terminaron (o el otro se rindió por tiempo): `resultado` = 'gano' | 'pierde' | 'empate'
 */
export function estadoDuelo(duelo, yo, { rivalAbandono = false } = {}) {
  const rival = duelo.de === yo ? duelo.a : duelo.de;
  const mio = puntaje(duelo.prog?.[yo]), suyo = puntaje(duelo.prog?.[rival]);
  if (!mio.fin) return { fase: 'jugando', rival, mio, suyo, rivalCompleto: suyo.completo };
  if (!suyo.fin && !rivalAbandono) return { fase: 'esperando-rival', rival, mio, suyo };
  const c = duelo.juego ? Math.sign(mio.pts - suyo.pts) : comparar(mio, suyo);   // reto en un juego: gana quien hizo más puntos
  return { fase: 'terminado', rival, mio, suyo, resultado: c > 0 ? 'gano' : c < 0 ? 'pierde' : 'empate' };
}

/**
 * Puntos del duelo para XP/monedas (luego se aplica la precisión en xpJuego). Sin letras correctas no hay puntos:
 * quien no escribe nada bien (por ejemplo, deja una tecla apretada) no gana ni por participar.
 */
export const puntosDuelo = (resultado, ppm) => {
  if (!(ppm > 0)) return 0;
  return Math.round(Math.min(900, Math.max(100, ppm * 12)) + (resultado === 'gano' ? 150 : resultado === 'empate' ? 60 : 0));
};
