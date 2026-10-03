#!/usr/bin/env node
/**
 * Generador del currículo de mecanografía (10 mundos, ~150 lecciones).
 *
 *   node tools/generar-lecciones.mjs
 *
 * Genera:
 *   data/lessons/m1.json … m10.json   lecciones completas (se descargan por mundo, bajo demanda)
 *   data/lessons/index.json           resumen liviano (id, título, tipo) para el mapa y el progreso
 *   data/palabras.json                vocabulario para juegos y refuerzo adaptativo
 *   data/texts.json                   textos de práctica libre (frases y párrafos con tema y nivel)
 *
 * Es DETERMINISTA: cada lección usa un generador pseudoaleatorio sembrado con su id, así el contenido
 * es estable entre ejecuciones. Para cambiar el currículo edita las listas de este archivo o los
 * corpus en tools/fuentes/, vuelve a ejecutarlo y haz commit.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALABRAS, PALABRAS_TILDE, NOMBRES, LUGARES } from './fuentes/palabras.mjs';
import { SIN_TILDE, CON_TILDE, PARRAFOS } from './fuentes/frases.mjs';
import { sospechosas } from './fuentes/verificar-ortografia.mjs';
import { DEDOS, dedoDeCaracter, existeCaracter } from '../js/lessons/teclado-datos.js';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/* ═════════════ Azar determinista ═════════════ */
function hashStr(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; }
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (rng, a) => a[Math.floor(rng() * a.length)];
const mezclar = (rng, a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/* ═════════════ Utilidades de texto ═════════════ */
const VOCALES = new Set('aeiouáéíóúü');
const esLetra = (c) => /[a-zñáéíóúü]/i.test(c);
const cortarEnPalabra = (t, n) => { if (t.length <= n) return t; const c = t.slice(0, n + 1); const i = c.lastIndexOf(' '); return (i > n * 0.6 ? c.slice(0, i) : t.slice(0, n)).trim(); };
const SIN_ESPACIOS_DOBLES = (t) => t.replace(/\s+/g, ' ').trim();

/** ¿Todos los caracteres (en minúscula) están en el alcance? Con `mayus`, las mayúsculas se aceptan si su minúscula está. */
function valido(texto, alcance, mayus) {
  for (const c of texto) {
    if (c === ' ') continue;
    if (alcance.has(c)) continue;
    if (mayus && c !== c.toLowerCase() && alcance.has(c.toLowerCase())) continue;
    return false;
  }
  return true;
}

/* ═════════════ Generadores de ejercicios ═════════════ */
function drillTeclas(rng, teclas, n) {
  const pats = [(a) => a + a + a, (a, b) => a + b + a + b, (a, b) => a + a + b + b, (a, b) => a + b + b + a, (a, b) => a + b + a, (a, b) => a + a + b];
  const grupos = []; let len = 0;
  while (len < n) {
    const a = pick(rng, teclas), b = pick(rng, teclas);
    const g = pick(rng, pats)(a, b);
    if (sospechosas(g).length) continue;
    grupos.push(g); len += g.length + 1;
  }
  return cortarEnPalabra(grupos.join(' '), n);
}

function silabas(rng, alcance, preferir, n) {
  const RARAS = 'wkxqz';
  const letras = [...alcance].filter((c) => /[a-zñ]/.test(c) && (!RARAS.includes(c) || preferir.includes(c)));
  const vocales = letras.filter((c) => 'aeiou'.includes(c));
  const cons = letras.filter((c) => !'aeiou'.includes(c));
  const palabras = []; let len = 0;
  while (len < n) {
    const k = 2 + Math.floor(rng() * 3);
    let w = '';
    for (let i = 0; i < k; i++) {
      let c = pick(rng, preferir.length && rng() < 0.6 ? preferir : (cons.length ? cons : letras));
      if (vocales.length && 'aeiou'.includes(c)) { w += c; continue; }
      w += c;
      if (vocales.length) w += pick(rng, vocales);
    }
    if (sospechosas(w).length) continue; // evita sílabas que parezcan una palabra mal escrita (p. ej. “alla”)
    palabras.push(w); len += w.length + 1;
  }
  return cortarEnPalabra(palabras.join(' '), n);
}

function palabrasReales(alcance, mayus, ampliar = false) {
  const fuente = ampliar ? [...PALABRAS, ...PALABRAS_TILDE] : PALABRAS;
  return [...new Set(fuente.filter((w) => w.length >= 2 && valido(w, alcance, mayus)))];
}

/** Parte una palabra en sílabas aproximadas: ca-sa, pa-ta-ti-to. */
function silabear(w) { return (w.match(/[^aeiou]*[aeiou]+(?:[^aeiou](?![aeiou]))?/g) || [w]).join('-'); }

/** Agrega comas, puntos y guiones de sílaba según las teclas aprendidas (más seguido si son las nuevas). */
function puntuar(rng, palabras, alcance, nuevas) {
  const pc = alcance.has(',') ? (nuevas.includes(',') ? 0.4 : 0.12) : 0;
  const pp = alcance.has('.') ? (nuevas.includes('.') ? 0.3 : 0.1) : 0;
  const pg = nuevas.includes('-') ? 0.55 : 0;
  return palabras.map((w, i) => {
    if (pg && w.length >= 4 && rng() < pg) w = silabear(w);
    if (i === palabras.length - 1) return w;
    if (rng() < pp) return `${w}.`;
    if (rng() < pc) return `${w},`;
    return w;
  });
}

function textoPalabras(rng, alcance, preferir, n, { mayus = false, ampliar = false, maxLen = 9, minLen = 2, nuevas = [] } = {}) {
  const todas = palabrasReales(alcance, mayus, ampliar).filter((w) => w.length <= maxLen && w.length >= minLen);
  const A = todas.filter((w) => preferir.some((p) => w.toLowerCase().includes(p)));
  const B = todas.filter((w) => !A.includes(w));
  const out = []; let len = 0, ultimo = '';
  const sinPool = todas.length < 4;
  while (len < n) {
    let w;
    if (sinPool) w = silabas(rng, alcance, preferir, 5);
    else {
      const usarA = A.length && (rng() < 0.65 || !B.length);
      w = pick(rng, usarA ? A : B);
      if (w === ultimo && todas.length > 3) continue;
      // rellena con pseudo-palabras si el vocabulario real es muy corto
      if (todas.length < 10 && rng() < 0.3) w = silabas(rng, alcance, preferir, 5).split(' ')[0];
    }
    ultimo = w; out.push(w); len += w.length + 1;
  }
  return cortarEnPalabra(puntuar(rng, out, alcance, nuevas).join(' '), n);
}

/** Normaliza una frase según lo que el estudiante ya conoce (mayúsculas y puntuación). */
function adaptarFrase(f, alcance, mayus) {
  let t = f;
  if (!mayus) t = t.toLowerCase();
  t = [...t].filter((c) => c === ' ' || alcance.has(c) || (mayus && alcance.has(c.toLowerCase()))).join('');
  return SIN_ESPACIOS_DOBLES(t);
}
function frasesDisponibles(alcance, mayus, { temas = null, conTilde = false } = {}) {
  const fuente = conTilde ? [...SIN_TILDE, ...CON_TILDE] : SIN_TILDE;
  const res = [];
  for (const [tema, f] of fuente) {
    if (temas && !temas.includes(tema)) continue;
    const t = adaptarFrase(f, alcance, mayus);
    // se exige que la frase NO haya perdido caracteres al adaptarla (excepto mayúsculas/puntuación cuando no se conocen)
    const original = mayus ? f : f.toLowerCase();
    const limpio = [...original].filter((c) => c === ' ' || /[a-zñáéíóúü0-9]/i.test(c) || alcance.has(c)).join('');
    if (!valido(f.toLowerCase().replace(/[.,;:¿?¡!"()\-—]/g, (c) => (alcance.has(c) ? c : '')), alcance, mayus)) continue;
    if (t.length < 8 || SIN_ESPACIOS_DOBLES(limpio) !== SIN_ESPACIOS_DOBLES(t)) continue;
    res.push(t);
  }
  return res;
}
function textoFrases(rng, frases, n) {
  if (!frases.length) return '';
  const orden = mezclar(rng, frases); const out = []; let len = 0, i = 0;
  while (len < n) { const f = orden[i++ % orden.length]; out.push(f); len += f.length + 1; if (i > orden.length * 3) break; }
  return cortarEnPalabra(out.join(' '), n);
}

/* ═════════════ Especificación del currículo ═════════════ */
const FACTOR_PPM = [0.3, 0.38, 0.45, 0.55, 0.55, 0.6, 0.55, 0.8, 0.9, 1.0]; // por mundo (relativo a la meta del grado)
const PRECISION = { nueva: 0.85, repaso: 0.88, palabras: 0.88, precision: 0.95, velocidad: 0.85, jefe: 0.9, ritmo: 0.88, tema: 0.9, reto: 0.9 };

const L = (tipo, titulo, nuevas = [], extra = {}) => ({ tipo, titulo, nuevas, ...extra });

const MUNDOS = [
  { id: 1, nombre: 'Fila base', lecciones: [
    L('nueva', 'F y J: los índices', ['f', 'j'], { tip: 'Las teclas F y J tienen un puntito en relieve. Sirven para que tus índices siempre encuentren su “casa” sin mirar.' }),
    L('nueva', 'D y K: los dedos medios', ['d', 'k']),
    L('repaso', 'Repaso: F J D K', []),
    L('nueva', 'S y L: los anulares', ['s', 'l']),
    L('nueva', 'A y Ñ: los meñiques', ['a', 'ñ'], { tip: 'Los meñiques son los más débiles. Ve despacio: la precisión viene primero.' }),
    L('repaso', 'Repaso de la fila base', []),
    L('nueva', 'G y H: los índices se estiran', ['g', 'h'], { tip: 'Tus índices se estiran un poquito hacia el centro y vuelven a su tecla de casa.' }),
    L('repaso', 'La fila base completa', []),
    L('palabras', 'Tus primeras palabras', []),
    L('palabras', 'Más palabras de la fila base', []),
    L('ritmo', 'Espacio y ritmo', [], { tip: 'La barra espaciadora se pulsa con el pulgar. Mantén un ritmo parejo, como un tambor.' }),
    L('precision', 'Precisión de la fila base', []),
    L('velocidad', 'Velocidad de la fila base', []),
    L('jefe', 'Jefe: el guardián de la fila base', []),
  ] },
  { id: 2, nombre: 'Fila superior', lecciones: [
    L('nueva', 'E e I: los dedos medios', ['e', 'i'], { tip: 'Sube desde la fila base y vuelve siempre a tu tecla de casa.' }),
    L('nueva', 'R y U: los índices suben', ['r', 'u']),
    L('repaso', 'Repaso: E I R U', []),
    L('nueva', 'T y Y: los índices alcanzan más lejos', ['t', 'y']),
    L('nueva', 'W y O: los anulares suben', ['w', 'o']),
    L('nueva', 'Q y P: los meñiques suben', ['q', 'p']),
    L('repaso', 'Repaso de la fila superior', []),
    L('palabras', 'Palabras con fila superior', []),
    L('palabras', 'Más palabras: arriba y en medio', []),
    L('palabras', 'Frases cortas', []),
    L('ritmo', 'Combos frecuentes: es, en, el, ue', [], { preferir: ['es', 'en', 'el', 'ue', 'os', 'er'] }),
    L('precision', 'Precisión de la fila superior', []),
    L('velocidad', 'Velocidad de la fila superior', []),
    L('jefe', 'Jefe: la torre de las letras', []),
  ] },
  { id: 3, nombre: 'Fila inferior', lecciones: [
    L('nueva', 'V y M: los índices bajan', ['v', 'm']),
    L('nueva', 'C y la coma: dedos medios', ['c', ',']),
    L('nueva', 'X y el punto: anulares', ['x', '.']),
    L('nueva', 'Z y el guion: meñiques', ['z', '-']),
    L('nueva', 'B y N: índices al centro', ['b', 'n']),
    L('repaso', 'Repaso de la fila inferior', []),
    L('palabras', 'Palabras con fila inferior', []),
    L('palabras', 'Comas y puntos en frases', []),
    L('ritmo', 'Combos frecuentes: ra, ca, co, tr', [], { preferir: ['ra', 'ca', 'co', 'tr', 'ar', 'or'] }),
    L('precision', 'Precisión de la fila inferior', []),
    L('velocidad', 'Velocidad de la fila inferior', []),
    L('jefe', 'Jefe: el navegante', []),
  ] },
  { id: 4, nombre: 'Todas las letras y la Ñ', lecciones: [
    L('repaso', 'El abecedario completo', []),
    L('palabras', 'Palabras con Ñ', [], { preferir: ['ñ'] }),
    L('palabras', 'Animales y naturaleza', [], { temas: ['animales', 'naturaleza'] }),
    L('palabras', 'Escuela y familia', [], { temas: ['escuela', 'familia'] }),
    L('palabras', 'Comida y deportes', [], { temas: ['comida', 'deportes'] }),
    L('palabras', 'Palabras difíciles: Q Z X W K', [], { preferir: ['q', 'z', 'x', 'w', 'k'] }),
    L('repaso', 'Refuerzo de meñiques: Q A Z P Ñ', [], { preferir: ['q', 'a', 'z', 'p', 'ñ'] }),
    L('palabras', 'Frases largas y claras', [], { temas: ['tecnologia', 'ciencia', 'colombia'] }),
    L('palabras', 'Valores y refranes', [], { temas: ['valores', 'refranes'] }),
    L('ritmo', 'Trabalenguas', [], { temas: ['trabalenguas', 'pangramas'] }),
    L('precision', 'Precisión con todo el teclado', []),
    L('velocidad', 'Velocidad con todo el teclado', []),
    L('palabras', 'Mezcla total', []),
    L('jefe', 'Jefe: el mapa del tesoro', []),
  ] },
  { id: 5, nombre: 'Mayúsculas y Shift', lecciones: [
    L('nueva', 'Shift izquierdo: mayúsculas de la mano derecha', ['⇧I'], { objetivo: 'Mantén Shift con el meñique izquierdo y escribe con la mano derecha: Juan, Luis, Hugo…', tip: 'Para una letra de la mano derecha, mantén Shift con el meñique izquierdo y pulsa la letra.' }),
    L('nueva', 'Shift derecho: mayúsculas de la mano izquierda', ['⇧D'], { objetivo: 'Mantén Shift con el meñique derecho y escribe con la mano izquierda: Ana, Sara, Diego…', tip: 'Para una letra de la mano izquierda, mantén Shift con el meñique derecho.' }),
    L('palabras', 'Nombres propios', [], { especial: 'nombres' }),
    L('palabras', 'Ciudades y regiones', [], { especial: 'lugares' }),
    L('palabras', 'Mayúscula al empezar una frase', [], { mayusFrases: true }),
    L('palabras', 'Mayúsculas dentro de frases', [], { mayusFrases: true, especial: 'mixto' }),
    L('ritmo', 'Siglas y letreros', [], { especial: 'siglas' }),
    L('palabras', 'Títulos de cuentos', [], { especial: 'titulos' }),
    L('precision', 'Precisión con mayúsculas', [], { mayusFrases: true }),
    L('velocidad', 'Velocidad con mayúsculas', [], { mayusFrases: true }),
    L('jefe', 'Jefe: la montaña Shift', [], { mayusFrases: true }),
  ] },
  { id: 6, nombre: 'Tildes y signos', lecciones: [
    L('nueva', 'Tilde en la á', ['á'], { tip: 'Primero pulsa la tecla ´ (a la derecha de la P) y, después, la vocal. No necesitas mantener ninguna.' }),
    L('nueva', 'Tilde en la é', ['é']),
    L('nueva', 'Tilde en la í', ['í']),
    L('nueva', 'Tilde en la ó', ['ó']),
    L('nueva', 'Tilde en la ú', ['ú']),
    L('repaso', 'Repaso de todas las tildes', []),
    L('nueva', 'La diéresis: ü', ['ü'], { tip: 'Mantén Shift, pulsa la tecla ´ y luego la u: ü (pingüino).' }),
    L('nueva', 'Preguntas: ¿ y ?', ['¿', '?'], { tip: 'En español la pregunta se abre con ¿ y se cierra con ?' }),
    L('nueva', 'Exclamaciones: ¡ y !', ['¡', '!']),
    L('nueva', 'Punto y coma, y dos puntos', [';', ':']),
    L('palabras', 'Palabras con tilde', []),
    L('palabras', 'Frases con preguntas y exclamaciones', [], { soloSignos: true }),
    L('repaso', 'Repaso de tildes y signos', []),
    L('precision', 'Precisión con tildes', []),
    L('velocidad', 'Velocidad con tildes', []),
    L('jefe', 'Jefe: el mago de las tildes', []),
  ] },
  { id: 7, nombre: 'Números y símbolos', lecciones: [
    L('nueva', 'Los números 4 5 6 7', ['4', '5', '6', '7'], { tip: 'Tus índices suben a la fila de números y vuelven a la fila base.' }),
    L('nueva', 'Los números 3 y 8', ['3', '8']),
    L('nueva', 'Los números 2 y 9', ['2', '9']),
    L('nueva', 'Los números 1 y 0', ['1', '0']),
    L('repaso', 'Repaso de números', []),
    L('nueva', 'Suma, resta, igual', ['+', '=']),
    L('nueva', 'Por y dividido: * y /', ['*', '/']),
    L('nueva', 'Precios y porcentajes: $ y %', ['$', '%']),
    L('nueva', 'Paréntesis y comillas', ['(', ')', '"']),
    L('nueva', 'Arroba, numeral y ampersand', ['@', '#', '&'], { tip: 'La arroba @ se escribe con AltGr + Q (la tecla Alt derecha y la Q).' }),
    L('palabras', 'Correos y claves seguras', []),
    L('palabras', 'Fechas, horas y precios', []),
    L('precision', 'Precisión con números', []),
    L('velocidad', 'Velocidad con números', []),
    L('jefe', 'Jefe: el guardián de los números', []),
  ] },
  { id: 8, nombre: 'Palabras y frases', lecciones: [
    L('tema', 'Frases de animales', [], { temas: ['animales'] }),
    L('tema', 'Frases de la escuela', [], { temas: ['escuela'] }),
    L('tema', 'Frases de la familia', [], { temas: ['familia'] }),
    L('tema', 'Frases de la naturaleza', [], { temas: ['naturaleza'] }),
    L('tema', 'Frases de deportes', [], { temas: ['deportes'] }),
    L('tema', 'Frases de tecnología', [], { temas: ['tecnologia'] }),
    L('tema', 'Frases de ciencia', [], { temas: ['ciencia'] }),
    L('tema', 'Frases de Colombia', [], { temas: ['colombia'] }),
    L('tema', 'Frases de comida', [], { temas: ['comida'] }),
    L('tema', 'Valores', [], { temas: ['valores'] }),
    L('tema', 'Refranes', [], { temas: ['refranes'] }),
    L('tema', 'Trabalenguas y pangramas', [], { temas: ['trabalenguas', 'pangramas'] }),
    L('tema', 'Frases con números', [], { temas: ['numeros'] }),
    L('precision', 'Precisión con frases', [], { temas: null }),
    L('velocidad', 'Velocidad con frases', [], { temas: null }),
    L('jefe', 'Jefe: el maestro de las frases', [], { temas: null }),
  ] },
  { id: 9, nombre: 'Párrafos y textos reales', lecciones: [
    L('tema', 'Párrafo: ciencia (1)', [], { par: ['ciencia', 0] }),
    L('tema', 'Párrafo: ciencia (2)', [], { par: ['ciencia', 1] }),
    L('tema', 'Párrafo: animales (1)', [], { par: ['animales', 0] }),
    L('tema', 'Párrafo: animales (2)', [], { par: ['animales', 1] }),
    L('tema', 'Párrafo: Colombia (1)', [], { par: ['colombia', 0] }),
    L('tema', 'Párrafo: Colombia (2)', [], { par: ['colombia', 1] }),
    L('tema', 'Párrafo: naturaleza', [], { par: ['naturaleza', 0] }),
    L('tema', 'Párrafo: tecnología', [], { par: ['tecnologia', 0] }),
    L('tema', 'Cuento: el zorro curioso', [], { par: ['cuento', 0] }),
    L('tema', 'Cuento: la niña lectora', [], { par: ['cuento', 1] }),
    L('tema', 'Cuento: el robot perdido', [], { par: ['cuento', 2] }),
    L('tema', 'Valores y deporte', [], { par: ['valores', 0] }),
    L('tema', 'Historia y espacio', [], { par: ['historia', 0] }),
    L('precision', 'Precisión con párrafos', [], { par: ['ciencia', 2] }),
    L('velocidad', 'Velocidad con párrafos', [], { par: ['animales', 2] }),
    L('jefe', 'Jefe: el narrador', [], { par: ['cuento', 3] }),
  ] },
  { id: 10, nombre: 'Velocidad y precisión', lecciones: [
    L('reto', 'Sprint 1: palabras cortas', [], { sprint: 'palabras', seg: 60 }),
    L('reto', 'Sprint 2: frases', [], { sprint: 'frases', seg: 60 }),
    L('reto', 'Sprint 3: tildes y signos', [], { sprint: 'tildes', seg: 60 }),
    L('reto', 'Sprint 4: números y símbolos', [], { sprint: 'numeros', seg: 60 }),
    L('reto', 'Sin mirar 1: el teclado se oculta', [], { sprint: 'palabras', oculto: true }),
    L('reto', 'Sin mirar 2: frases a ciegas', [], { sprint: 'frases', oculto: true }),
    L('precision', 'Precisión perfecta: 98 %', [], { sprint: 'frases', exigente: true }),
    L('reto', 'Palabras largas', [], { sprint: 'largas' }),
    L('reto', 'Ritmo constante', [], { sprint: 'frases', seg: 90 }),
    L('reto', 'Mayúsculas y signos mezclados', [], { sprint: 'mezcla', seg: 90 }),
    L('reto', 'Combo: letras y números', [], { sprint: 'numeros', seg: 90 }),
    L('velocidad', 'Maratón de 3 minutos', [], { sprint: 'frases', seg: 180 }),
    L('velocidad', 'Maratón de 5 minutos', [], { sprint: 'mezcla', seg: 300 }),
    L('reto', 'Párrafo a ciegas', [], { par: ['ciencia', 3], oculto: true }),
    L('velocidad', 'Velocidad de campeones', [], { sprint: 'frases', seg: 120 }),
    L('jefe', 'Jefe final: el gran maestro del teclado', [], { sprint: 'mezcla', oculto: true, seg: 120 }),
  ] },
];

/* ═════════════ Contenido por tipo especial ═════════════ */
const DERECHA = new Set('yuiophjklñnm'.split(''));
const IZQUIERDA = new Set('qwertasdfgzxcvb'.split(''));
const SIGLAS = ['ONU', 'OEA', 'TIC', 'USB', 'PC', 'CD', 'DVD', 'LED', 'OMS', 'FIFA', 'TV', 'ADN', 'UNICEF', 'NASA', 'ISBN', 'SOS', 'VIP', 'GPS'];
const TITULOS = ['El Gato con Botas', 'La Isla del Tesoro', 'Mi Perro Max', 'El Bosque Mágico', 'La Gran Carrera', 'Un Dia de Playa', 'El Zorro y la Luna', 'Piratas del Caribe', 'La Casa del Arbol', 'Viaje a la Luna'].filter((t) => !/[áéíóú]/i.test(t) && !/Dia|Arbol/.test(t));
const DOMINIOS = ['colegio.edu.co', 'correo.com', 'mail.co', 'escuela.edu.co', 'tecla.com'];
const USUARIOS = ['sofia', 'juan', 'luis', 'ana', 'mateo', 'valen', 'dani', 'camila', 'tomas', 'isa'];

function digitos(rng, permitidos, k) { let s = ''; for (let i = 0; i < k; i++) s += pick(rng, permitidos); return s; }

function numerosTexto(rng, alcanceCompleto, n, soloDigitos = false) {
  // Solo dígitos y los símbolos de este mundo (no mezcla los signos del mundo 6)
  const alcance = new Set([...alcanceCompleto].filter((c) => /[0-9]/.test(c) || (!soloDigitos && '+=*/$%()"@#&.,-:'.includes(c))));
  const D = [...alcance].filter((c) => /[0-9]/.test(c));
  if (!D.length) return '';
  const tiene = (c) => alcance.has(c);
  const plantillas = [];
  plantillas.push(() => digitos(rng, D, 2 + Math.floor(rng() * 3)));
  plantillas.push(() => `${digitos(rng, D, 1)}${digitos(rng, D, 1)} ${digitos(rng, D, 2)} ${digitos(rng, D, 3)}`);
  if (tiene('+') && tiene('=')) plantillas.push(() => { for (let i = 0; i < 30; i++) { const a = Number(digitos(rng, D, 1 + Math.floor(rng() * 2))), b = Number(digitos(rng, D, 1)); const c = String(a + b); if ([...c].every((x) => D.includes(x))) return `${a} + ${b} = ${c}`; } return `${digitos(rng, D, 2)}`; });
  if (tiene('-') && tiene('=')) plantillas.push(() => { for (let i = 0; i < 30; i++) { const a = Number(digitos(rng, D, 2)), b = Number(digitos(rng, D, 1)); if (a < b) continue; const c = String(a - b); if ([...c].every((x) => D.includes(x))) return `${a} - ${b} = ${c}`; } return `${digitos(rng, D, 2)}`; });
  if (tiene('*') && tiene('=')) plantillas.push(() => { for (let i = 0; i < 30; i++) { const a = Number(digitos(rng, D, 1)), b = Number(digitos(rng, D, 1)); const c = String(a * b); if ([...c].every((x) => D.includes(x))) return `${a} * ${b} = ${c}`; } return `${digitos(rng, D, 2)}`; });
  if (tiene('/')) plantillas.push(() => `${digitos(rng, D, 2)}/${digitos(rng, D, 2)}/${digitos(rng, D, 4)}`);
  if (tiene(':')) plantillas.push(() => `${digitos(rng, D, 1)}:${digitos(rng, D, 2)}`);
  if (tiene('$') && tiene('.')) plantillas.push(() => `$${digitos(rng, D, 1 + Math.floor(rng() * 2))}.${digitos(rng, D, 3)}`);
  if (tiene('%')) plantillas.push(() => `${digitos(rng, D, 2)}%`);
  if (tiene('(') && tiene(')')) plantillas.push(() => `(${digitos(rng, D, 2)})`);
  if (tiene('"')) plantillas.push(() => `"${pick(rng, ['hola', 'ala', 'sal', 'casa'].filter((w) => valido(w, alcance, true)).concat(['a']))}"`);
  if (tiene('#')) plantillas.push(() => `#${digitos(rng, D, 3)}`);
  if (tiene('&')) plantillas.push(() => `${pick(rng, ['a', 'e', 'o'])}&${pick(rng, ['a', 'e', 'o'])}${digitos(rng, D, 1)}`);
  if (tiene('@')) plantillas.push(() => `${pick(rng, USUARIOS.filter((u) => valido(u, alcance, true)).concat(['ana']))}${digitos(rng, D, 2)}@${pick(rng, DOMINIOS)}`);
  const out = []; let len = 0;
  while (len < n) { const t = pick(rng, plantillas)(); if (!valido(t, alcance, true)) continue; out.push(t); len += t.length + 1; }
  return cortarEnPalabra(out.join(' '), n);
}

const CLAVES_EJEMPLO = (rng, alcance, n) => {
  const palabras = ['sol', 'luna', 'gato', 'rio', 'mar', 'pato', 'cielo', 'nube', 'tigre', 'oso', 'lobo', 'casa'];
  const D = [...alcance].filter((c) => /[0-9]/.test(c)), S = [...alcance].filter((c) => '#@$%&*+='.includes(c));
  const out = []; let len = 0;
  while (len < n) {
    const w = pick(rng, palabras); const c = w[0].toUpperCase() + w.slice(1) + digitos(rng, D, 2) + (S.length ? pick(rng, S) : '');
    out.push(c); len += c.length + 1;
  }
  return cortarEnPalabra(out.join(' '), n);
};

/* ═════════════ Construcción de una lección ═════════════ */
const LONG = { guiado: 64, libre: 104, prueba: 170 };      // prueba ≈ 1,4 × base (se acorta por grado al ejecutar)
const BASE_PRUEBA = 120;

function construirLeccion(mundo, spec, n, alcanceMundo, vistas) {
  const id = `m${mundo.id}-l${String(n).padStart(2, '0')}`;
  const rng = mulberry(hashStr(id));
  const nuevas = spec.nuevas.filter((c) => !c.startsWith('⇧'));
  for (const c of nuevas) alcanceMundo.add(c);

  // Shift: se agrega a todas las letras en mayúscula al llegar al mundo 5
  const mayus = mundo.id >= 5;
  if (mundo.id === 5 && (n === 1 || n === 2)) { /* el alcance de letras ya está completo; el foco es Shift */ }

  const alcance = alcanceMundo;
  const preferir = spec.preferir || nuevas.filter((c) => /[a-zñ]/.test(c));
  const conTilde = mundo.id >= 6;
  const base = BASE_PRUEBA;
  let guiado = '', libre = '', prueba = '';
  const flags = {};

  const textoDe = (kind, len) => {
    // ─ mundos 1-4: letras
    if (mundo.id <= 4) {
      if (kind === 'guiado') {
        if (spec.tipo === 'nueva') return drillTeclas(rng, spec.nuevas.length === 1 ? [spec.nuevas[0]] : nuevas.length ? nuevas : [...alcance].slice(-4), len);
        if (spec.tipo === 'palabras' || spec.tipo === 'ritmo') return textoPalabras(rng, alcance, preferir, len, { maxLen: 6, nuevas: spec.nuevas });
        const teclas = [...alcance].filter((c) => /[a-zñ]/.test(c));
        return drillTeclas(rng, teclas.slice(-Math.min(6, teclas.length)), len);
      }
      if (spec.temas && (spec.tipo === 'palabras' || spec.tipo === 'ritmo') && mundo.id >= 4) {
        const fr = frasesDisponibles(alcance, false, { temas: spec.temas });
        if (fr.length >= 3) return textoFrases(rng, fr, len);
      }
      if (mundo.id >= 3 && (spec.tipo === 'palabras' || spec.tipo === 'precision' || spec.tipo === 'velocidad' || spec.tipo === 'jefe') && rng() < 0.7) {
        const fr = frasesDisponibles(alcance, false, {});
        if (fr.length >= 4) return textoFrases(rng, fr, len);
      }
      if (spec.tipo === 'ritmo' && mundo.id <= 3) return textoPalabras(rng, alcance, preferir.length ? preferir : [...alcance].slice(-3), len, { maxLen: 6, nuevas: spec.nuevas });
      if (spec.tipo === 'nueva') {
        // mezcla de sílabas con las teclas nuevas y palabras reales
        const mitad = Math.floor(len / 2);
        return `${silabas(rng, alcance, preferir, mitad)} ${textoPalabras(rng, alcance, preferir, len - mitad - 1, { maxLen: 7, nuevas: spec.nuevas })}`.trim();
      }
      return textoPalabras(rng, alcance, preferir, len, { maxLen: 9, nuevas: spec.nuevas });
    }
    // ─ mundo 5: mayúsculas
    if (mundo.id === 5) {
      const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
      const fuente = (spec.especial === 'nombres') ? NOMBRES
        : spec.especial === 'lugares' ? LUGARES
        : spec.especial === 'siglas' ? SIGLAS
        : spec.especial === 'titulos' ? TITULOS : null;
      if (fuente) {
        const pool = fuente.filter((w) => valido(w, alcance, true));
        const o = []; let l = 0; while (l < len) { const w = pick(rng, pool); o.push(w); l += w.length + 1; }
        return cortarEnPalabra(o.join(' '), len);
      }
      if (spec.tipo === 'nueva') {
        const lado = spec.nuevas[0] === '⇧I' ? DERECHA : IZQUIERDA;
        const pool = palabrasReales(alcance, false).filter((w) => w.length <= 7 && lado.has(w[0]));
        const o = []; let l = 0;
        while (l < len) { const w = cap(pick(rng, pool)); o.push(kind === 'guiado' && rng() < 0.4 ? w.toUpperCase().slice(0, 1) + w.slice(1) : w); l += w.length + 1; }
        return cortarEnPalabra(o.join(' '), len);
      }
      const fr = frasesDisponibles(alcance, true, {});
      return textoFrases(rng, fr, len);
    }
    // ─ mundo 6: tildes y signos
    if (mundo.id === 6) {
      const acentos = nuevas.filter((c) => 'áéíóúü'.includes(c));
      if (kind === 'guiado' && spec.tipo === 'nueva') {
        if (acentos.length) { const o = []; for (let i = 0; i < 12; i++) { const a = pick(rng, acentos); o.push(i % 3 === 0 ? a + a + a : `${a.normalize('NFD')[0]}${a}`); } return cortarEnPalabra(o.join(' '), len); }
        const cortas = ['sí', 'no', 'ya', 'qué', 'cómo', 'hola', 'ven', 'dos', 'sol', 'vamos', 'uno', 'mira'];
        const o = [];
        for (let i = 0; i < 16; i++) {
          const w = pick(rng, cortas);
          if (nuevas.includes('¿')) o.push(`¿${w}?`);
          else if (nuevas.includes('¡')) o.push(`¡${w}!`);
          else o.push(`${w}${i % 2 ? ':' : ';'}`);
        }
        return cortarEnPalabra(o.join(' '), len);
      }
      if (acentos.length && spec.tipo === 'nueva') {
        const pool = palabrasReales(alcance, true, true).filter((w) => acentos.some((a) => w.includes(a)));
        const o = []; let l = 0; const P = pool.length ? pool : ['más']; while (l < len) { const w = pick(rng, P); o.push(w); l += w.length + 1; } return cortarEnPalabra(o.join(' '), len);
      }
      if (spec.tipo === 'nueva') {
        const fr = frasesDisponibles(alcance, true, { conTilde: true }).filter((f) => nuevas.some((c) => f.includes(c)));
        if (fr.length) return textoFrases(rng, fr, len);
      }
      if (spec.soloSignos) { const fr = frasesDisponibles(alcance, true, { conTilde: true }).filter((f) => /[¿¡?!]/.test(f)); if (fr.length) return textoFrases(rng, fr, len); }
      if (spec.titulo === 'Palabras con tilde') { const pool = palabrasReales(alcance, true, true).filter((w) => /[áéíóúü]/.test(w)); const o = []; let l = 0; while (l < len) { const w = pick(rng, pool); o.push(w); l += w.length + 1; } return cortarEnPalabra(o.join(' '), len); }
      const fr = frasesDisponibles(alcance, true, { conTilde: true }); return textoFrases(rng, fr, len);
    }
    // ─ mundo 7: números y símbolos
    if (mundo.id === 7) {
      if (spec.titulo === 'Correos y claves seguras' && kind !== 'guiado') return rng() < 0.5 ? numerosTexto(rng, alcance, len) : CLAVES_EJEMPLO(rng, alcance, len);
      if (spec.tipo === 'nueva' && kind === 'guiado') {
        const D = nuevas.length ? nuevas : [...alcance].filter((c) => /[0-9]/.test(c));
        const base2 = nuevas.every((c) => /[0-9]/.test(c)) ? D : [...D, '1', '2', '3'].filter((c) => alcance.has(c));
        return nuevas.every((c) => /[0-9]/.test(c)) ? drillTeclas(rng, base2, len) : numerosTexto(rng, alcance, len, false);
      }
      const soloDig = n <= 5;
      if (spec.tipo === 'repaso') return numerosTexto(rng, alcance, len, soloDig);
      const mezcla = rng() < 0.5; const fr = frasesDisponibles(alcance, true, { conTilde: true, temas: ['numeros'] });
      if (!soloDig && fr.length && mezcla && kind === 'prueba') return textoFrases(rng, fr, len);
      return numerosTexto(rng, alcance, len, soloDig);
    }
    // ─ mundo 8: frases por tema
    if (mundo.id === 8) {
      const pool = frasesDisponibles(alcance, true, { conTilde: true, temas: spec.temas || null });
      const ordenadas = [...pool].sort((a, b) => a.length - b.length);
      if (kind === 'guiado') return textoFrases(rng, ordenadas.slice(0, Math.max(3, Math.ceil(ordenadas.length / 3))), len);
      return textoFrases(rng, pool.length ? pool : frasesDisponibles(alcance, true, { conTilde: true }), len);
    }
    // ─ mundo 9: párrafos
    if (mundo.id === 9) {
      const [tema, idx] = spec.par;
      const lista = PARRAFOS.filter(([t]) => t === tema);
      const p = (lista[idx % lista.length] || PARRAFOS[0])[1];
      const frases = p.split(/(?<=[.!?])\s+/);
      if (kind === 'guiado') return frases[0];
      if (kind === 'libre') return frases.slice(0, 2).join(' ');
      return p;
    }
    return '';
  };

  // ─ mundo 10 (retos) y reutilización de contenido
  const textoReto = (kind, len) => {
    const Sprint = spec.sprint;
    const alc = new Set([...alcance]);
    if (spec.par) { const [tema, idx] = spec.par; const lista = PARRAFOS.filter(([t]) => t === tema); const p = (lista[idx % lista.length] || PARRAFOS[0])[1]; const f = p.split(/(?<=[.!?])\s+/); return kind === 'guiado' ? f[0] : kind === 'libre' ? f.slice(0, 2).join(' ') : p; }
    if (Sprint === 'palabras' || Sprint === 'largas') {
      const pool = palabrasReales(alc, true, true).filter((w) => (Sprint === 'largas' ? w.length >= 7 : w.length <= 6));
      const o = []; let l = 0; while (l < len) { const w = pick(rng, pool); o.push(w); l += w.length + 1; } return cortarEnPalabra(o.join(' '), len);
    }
    if (Sprint === 'tildes') { const pool = palabrasReales(alc, true, true).filter((w) => /[áéíóúü]/.test(w)); const fr = frasesDisponibles(alc, true, { conTilde: true }).filter((f) => /[áéíóúü¿¡]/.test(f)); return textoFrases(rng, [...fr, ...pool.map((w) => w)].length ? fr : pool, len); }
    if (Sprint === 'numeros') return rng() < 0.5 ? numerosTexto(rng, alc, len) : textoFrases(rng, frasesDisponibles(alc, true, { conTilde: true, temas: ['numeros'] }), len);
    if (Sprint === 'mezcla') { const a = textoFrases(rng, frasesDisponibles(alc, true, { conTilde: true }), Math.floor(len * 0.6)); const b = numerosTexto(rng, alc, Math.floor(len * 0.4)); return cortarEnPalabra(`${a} ${b}`, len); }
    return textoFrases(rng, frasesDisponibles(alc, true, { conTilde: true }), len);
  };

  const gen = mundo.id === 10 ? textoReto : textoDe;
  const largo = (k) => {
    if (mundo.id === 9) return 9999;
    if (spec.seg) return Math.max(LONG[k], Math.round(spec.seg * (k === 'prueba' ? 7 : 3)));
    return LONG[k];
  };

  guiado = gen('guiado', LONG.guiado);
  libre = gen('libre', mundo.id === 8 ? 130 : LONG.libre);
  prueba = gen('prueba', mundo.id === 8 ? 220 : largo('prueba'));

  // Velocidad: texto largo; Precisión/Jefe: más cuidado
  const ejercicios = [{ t: 'guiado', texto: guiado }, { t: 'libre', texto: libre }, { t: 'prueba', texto: prueba }];
  if (spec.tipo === 'precision') ejercicios[2].estricto = true;
  if (spec.tipo === 'jefe' || spec.oculto) ejercicios[2].ocultarTeclado = true;
  if (spec.oculto) ejercicios[1].ocultarTeclado = true;
  if (spec.seg || spec.tipo === 'velocidad') { ejercicios[2].modo = 'tiempo'; ejercicios[2].seg = spec.seg || 60; }
  if (spec.tipo === 'velocidad' && !spec.seg) { ejercicios[2].texto = gen('prueba', 420); }

  const pre = spec.exigente ? 0.98 : PRECISION[spec.tipo] || 0.88;
  const bonus = spec.tipo === 'velocidad' ? 0.1 : spec.tipo === 'jefe' ? 0.1 : 0;
  const dedos = nuevas.map((c) => dedoDeCaracter(c)).filter(Boolean);

  const leccion = {
    id, mundo: mundo.id, n, tipo: spec.tipo, titulo: spec.titulo,
    objetivo: objetivo(spec, nuevas, dedos),
    nuevas, alcance: [...alcance].join(''),
    tip: spec.tip || null,
    base: mundo.id === 9 ? 260 : mundo.id === 8 ? 150 : BASE_PRUEBA,
    meta: { precision: pre, ppm: Math.round((FACTOR_PPM[mundo.id - 1] + bonus) * 100) / 100 },
    ejercicios,
  };
  if (spec.tipo === 'nueva' && nuevas.length) leccion.dedos = [...new Set(dedos)];
  return leccion;
}

function nombreDedo(d) { return DEDOS[d]?.nombre || d; }
function objetivo(spec, nuevas, dedos) {
  if (spec.objetivo) return spec.objetivo;
  if (spec.tipo === 'nueva' && nuevas.some((c) => 'áéíóú'.includes(c))) return `Escribe ${nuevas[0]}: pulsa la tecla ´ (con el meñique derecho) y después la vocal, sin mantener ninguna tecla.`;
  if (nuevas.includes('ü')) return 'Escribe ü (pingüino): mantén Shift, pulsa la tecla ´ y luego la u.';
  if (nuevas.includes('¿')) return 'Aprende ¿ y ?: en español la pregunta se abre y se cierra con signos.';
  if (nuevas.includes('¡')) return 'Aprende ¡ y !: la exclamación también se abre y se cierra.';
  if (nuevas.includes(';')) return 'Aprende el punto y coma (;) y los dos puntos (:), ambos con Shift.';
  if (nuevas.includes('@')) return 'Aprende @ (AltGr + Q), # (Shift + 3) y & (Shift + 6) para correos y claves.';
  const lista = nuevas.map((c) => c.toUpperCase()).join(', ');
  switch (spec.tipo) {
    case 'nueva': return nuevas.length ? `Aprende las teclas ${lista} con el ${[...new Set(dedos.map(nombreDedo))].join(' y el ')}. Sin mirar el teclado.` : 'Practica la técnica de Shift con las dos manos.';
    case 'repaso': return 'Repasa lo aprendido para que tus dedos lo recuerden solos.';
    case 'palabras': return 'Escribe palabras y frases reales con precisión y un ritmo parejo.';
    case 'ritmo': return 'Mantén un ritmo constante, como un metrónomo, entre cada tecla.';
    case 'tema': return 'Escribe textos reales con ritmo y sin errores.';
    case 'precision': return 'Consigue la mayor precisión posible: ¡cada tecla cuenta!';
    case 'velocidad': return 'Sube tu velocidad sin perder la precisión. Tienes un tiempo límite.';
    case 'jefe': return 'Demuestra todo lo aprendido en este mundo. ¡Tú puedes!';
    case 'reto': return 'Un reto para campeones del teclado.';
    default: return '';
  }
}

/* ═════════════ Ejecución ═════════════ */
const resumen = [];
const alcanceGlobal = new Set();
let verificacion = 0;

await mkdir(join(RAIZ, 'data', 'lessons'), { recursive: true });
for (const mundo of MUNDOS) {
  const lecciones = [];
  if (mundo.id === 4) for (const c of 'abcdefghijklmnñopqrstuvwxyz') alcanceGlobal.add(c);
  if (mundo.id === 5) { /* ya conoce todas las letras */ }
  mundo.lecciones.forEach((spec, i) => {
    spec.titulo = spec.titulo;
    const l = construirLeccion(mundo, spec, i + 1, alcanceGlobal, null);
    // Validaciones de calidad
    for (const e of l.ejercicios) {
      if (!e.texto || e.texto.length < 12) throw new Error(`Texto demasiado corto en ${l.id} (${e.t}): "${e.texto}"`);
      if (mundo.id <= 5) { const s = sospechosas(e.texto); if (s.length) throw new Error(`Ortografía dudosa en ${l.id}: ${s.join(', ')}`); }
      if (/\s{2,}/.test(e.texto) || e.texto !== e.texto.trim()) throw new Error(`Espacios sobrantes en ${l.id}`);
      if (mundo.id <= 4 && /[^a-zñ ,.\-]/.test(e.texto)) throw new Error(`Carácter fuera del alcance en ${l.id}: "${e.texto}"`);
      for (const c of e.texto) if (!existeCaracter(c, 'es-LA')) throw new Error(`Carácter imposible de teclear en ${l.id}: “${c}”`);
      verificacion++;
    }
    lecciones.push(l);
    resumen.push({ id: l.id, mundo: l.mundo, n: l.n, tipo: l.tipo, titulo: l.titulo, nuevas: l.nuevas });
  });
  // Al terminar el mundo 2 el alcance ya incluye todas las letras de la fila superior, etc. (alcanceGlobal es acumulativo)
  await writeFile(join(RAIZ, 'data', 'lessons', `m${mundo.id}.json`), JSON.stringify({ mundo: mundo.id, nombre: mundo.nombre, lecciones }));
}
await writeFile(join(RAIZ, 'data', 'lessons', 'index.json'), JSON.stringify({ version: 1, total: resumen.length, lecciones: resumen }));

/* ═════════════ Vocabulario para juegos y refuerzo ═════════════ */
const palabrasJSON = { sinTilde: [...new Set(PALABRAS.filter((w) => w.length >= 3 && w.length <= 10 && !sospechosas(w).length))], conTilde: PALABRAS_TILDE.filter((w) => w.length >= 3) };
await writeFile(join(RAIZ, 'data', 'palabras.json'), JSON.stringify(palabrasJSON));

/* ═════════════ Textos de práctica libre ═════════════ */
const textos = [];
const nivelDe = (t, esPar) => (esPar ? (t.length > 260 ? 5 : 4) : /[áéíóúü¿¡0-9]/.test(t) ? 3 : 2);
SIN_TILDE.forEach(([tema, t], i) => textos.push({ id: `f${i}`, tema, nivel: 2, texto: t }));
CON_TILDE.forEach(([tema, t], i) => textos.push({ id: `c${i}`, tema, nivel: nivelDe(t, false), texto: t }));
PARRAFOS.forEach(([tema, t], i) => textos.push({ id: `p${i}`, tema, nivel: nivelDe(t, true), texto: t }));
await writeFile(join(RAIZ, 'data', 'texts.json'), JSON.stringify({ version: 1, temas: [...new Set(textos.map((t) => t.tema))], textos }));

const porMundo = Object.fromEntries(MUNDOS.map((m) => [m.id, m.lecciones.length]));
console.log(`Lecciones: ${resumen.length} (${JSON.stringify(porMundo)})`);
console.log(`Ejercicios validados: ${verificacion} · textos de práctica: ${textos.length} · palabras: ${palabrasJSON.sinTilde.length + palabrasJSON.conTilde.length}`);
