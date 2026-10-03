/**
 * Datos del teclado (sin DOM, reutilizable en Node): distribuciones "Español – Latinoamérica" y
 * "Español – España", dedo que usa cada tecla y pasos para escribir cada carácter
 * (incluye Shift, AltGr y teclas muertas para á é í ó ú ü).
 */

export const DEDOS = {
  'menique-izq': { nombre: 'meñique izquierdo', color: 'menique' },
  'anular-izq': { nombre: 'anular izquierdo', color: 'anular' },
  'medio-izq': { nombre: 'dedo medio izquierdo', color: 'medio' },
  'indice-izq': { nombre: 'índice izquierdo', color: 'indice' },
  'indice-der': { nombre: 'índice derecho', color: 'indice' },
  'medio-der': { nombre: 'dedo medio derecho', color: 'medio' },
  'anular-der': { nombre: 'anular derecho', color: 'anular' },
  'menique-der': { nombre: 'meñique derecho', color: 'menique' },
  'pulgar-izq': { nombre: 'pulgar izquierdo', color: 'pulgar' },
  'pulgar-der': { nombre: 'pulgar derecho', color: 'pulgar' },
};

/** Dedo asignado a cada tecla física (por event.code). */
const DEDO_POR_CODIGO = {};
const asignar = (dedo, codigos) => codigos.split(' ').forEach((c) => { DEDO_POR_CODIGO[c] = dedo; });
asignar('menique-izq', 'Backquote Digit1 KeyQ KeyA KeyZ IntlBackslash ShiftLeft');
asignar('anular-izq', 'Digit2 KeyW KeyS KeyX');
asignar('medio-izq', 'Digit3 KeyE KeyD KeyC');
asignar('indice-izq', 'Digit4 Digit5 KeyR KeyT KeyF KeyG KeyV KeyB');
asignar('indice-der', 'Digit6 Digit7 KeyY KeyU KeyH KeyJ KeyN KeyM');
asignar('medio-der', 'Digit8 KeyI KeyK Comma');
asignar('anular-der', 'Digit9 KeyO KeyL Period');
asignar('menique-der', 'Digit0 Minus Equal KeyP BracketLeft BracketRight Semicolon Quote Backslash Slash ShiftRight Enter Backspace');
asignar('pulgar-izq', 'Space');
asignar('pulgar-der', 'AltRight');

export const dedoDeCodigo = (codigo) => DEDO_POR_CODIGO[codigo] || 'pulgar-der';
const manoDe = (dedo) => (dedo.endsWith('izq') ? 'izq' : 'der');

// [code, base, shift, altgr]
const fila = (...t) => t.map(([code, base, shift = null, altgr = null]) => ({ code, base, shift, altgr, dedo: dedoDeCodigo(code) }));

const LETRAS_QWERTY = [
  fila(['KeyQ', 'q', 'Q', '@'], ['KeyW', 'w', 'W'], ['KeyE', 'e', 'E'], ['KeyR', 'r', 'R'], ['KeyT', 't', 'T'], ['KeyY', 'y', 'Y'], ['KeyU', 'u', 'U'], ['KeyI', 'i', 'I'], ['KeyO', 'o', 'O'], ['KeyP', 'p', 'P']),
  fila(['KeyA', 'a', 'A'], ['KeyS', 's', 'S'], ['KeyD', 'd', 'D'], ['KeyF', 'f', 'F'], ['KeyG', 'g', 'G'], ['KeyH', 'h', 'H'], ['KeyJ', 'j', 'J'], ['KeyK', 'k', 'K'], ['KeyL', 'l', 'L'], ['Semicolon', 'ñ', 'Ñ']),
  fila(['KeyZ', 'z', 'Z'], ['KeyX', 'x', 'X'], ['KeyC', 'c', 'C'], ['KeyV', 'v', 'V'], ['KeyB', 'b', 'B'], ['KeyN', 'n', 'N'], ['KeyM', 'm', 'M'], ['Comma', ',', ';'], ['Period', '.', ':'], ['Slash', '-', '_']),
];

export const LAYOUTS = {
  'es-LA': {
    nombre: 'Español (Latinoamérica)',
    teclaMuerta: { acento: 'BracketLeft', dieresis: 'BracketLeft' }, // ´ (sin Shift) y ¨ (con Shift)
    filas: [
      fila(['Backquote', '|', '°', '¬'], ['Digit1', '1', '!'], ['Digit2', '2', '"'], ['Digit3', '3', '#'], ['Digit4', '4', '$'], ['Digit5', '5', '%'], ['Digit6', '6', '&'], ['Digit7', '7', '/'],
        ['Digit8', '8', '('], ['Digit9', '9', ')'], ['Digit0', '0', '='], ['Minus', "'", '?', '\\'], ['Equal', '¿', '¡']),
      [...LETRAS_QWERTY[0], ...fila(['BracketLeft', '´', '¨'], ['BracketRight', '+', '*', '~'])],
      [...LETRAS_QWERTY[1], ...fila(['Quote', '{', '[', '^'], ['Backslash', '}', ']', '`'])],
      [...fila(['IntlBackslash', '<', '>']), ...LETRAS_QWERTY[2]],
    ],
  },
  'es-ES': {
    nombre: 'Español (España)',
    teclaMuerta: { acento: 'Quote', dieresis: 'Quote' },
    filas: [
      fila(['Backquote', 'º', 'ª', '\\'], ['Digit1', '1', '!', '|'], ['Digit2', '2', '"', '@'], ['Digit3', '3', '·', '#'], ['Digit4', '4', '$', '~'], ['Digit5', '5', '%', '€'], ['Digit6', '6', '&', '¬'],
        ['Digit7', '7', '/'], ['Digit8', '8', '('], ['Digit9', '9', ')'], ['Digit0', '0', '='], ['Minus', "'", '?'], ['Equal', '¡', '¿']),
      [...LETRAS_QWERTY[0].map((k) => (k.code === 'KeyQ' ? { ...k, altgr: null } : k)), ...fila(['BracketLeft', '`', '^', '['], ['BracketRight', '+', '*', ']'])],
      [...LETRAS_QWERTY[1], ...fila(['Quote', '´', '¨', '{'], ['Backslash', 'ç', 'Ç', '}'])],
      [...fila(['IntlBackslash', '<', '>']), ...LETRAS_QWERTY[2]],
    ],
  },
};

const VOCALES_TILDE = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U' };

/** Índice carácter → {code, shift, altgr, dedo} para una distribución. */
const indices = {};
function indice(idioma) {
  if (indices[idioma]) return indices[idioma];
  const mapa = new Map();
  for (const f of LAYOUTS[idioma].filas) for (const k of f) {
    if (k.base && !mapa.has(k.base) && !(k.code === LAYOUTS[idioma].teclaMuerta.acento && k.base === '´')) mapa.set(k.base, { code: k.code, shift: false, altgr: false, dedo: k.dedo });
    if (k.shift && !mapa.has(k.shift) && k.shift !== '¨') mapa.set(k.shift, { code: k.code, shift: true, altgr: false, dedo: k.dedo });
    if (k.altgr && !mapa.has(k.altgr)) mapa.set(k.altgr, { code: k.code, shift: false, altgr: true, dedo: k.dedo });
  }
  mapa.set(' ', { code: 'Space', shift: false, altgr: false, dedo: 'pulgar-izq' });
  indices[idioma] = mapa;
  return mapa;
}

/** Tecla (objeto) por código. */
export function teclaPorCodigo(codigo, idioma = 'es-LA') {
  for (const f of LAYOUTS[idioma].filas) for (const k of f) if (k.code === codigo) return k;
  return null;
}

/** Shift que corresponde usar: el de la mano contraria al dedo de la tecla. */
export const shiftPara = (dedo) => (manoDe(dedo) === 'izq' ? 'ShiftRight' : 'ShiftLeft');

/**
 * Pasos para escribir un carácter. Cada paso: { code, shift, altgr, dedo, modificador? }.
 * Para á é í ó ú ü hay dos pasos (tecla muerta + vocal). Devuelve [] si el carácter no existe en la distribución.
 */
export function pasosPara(ch, idioma = 'es-LA') {
  const L = LAYOUTS[idioma];
  const dir = indice(idioma);
  const conMods = (p) => ({ ...p, modificador: p.shift ? shiftPara(p.dedo) : p.altgr ? 'AltRight' : null });
  if (VOCALES_TILDE[ch]) {
    const muerta = teclaPorCodigo(L.teclaMuerta.acento, idioma);
    const vocal = dir.get(VOCALES_TILDE[ch]);
    return [conMods({ code: muerta.code, shift: false, altgr: false, dedo: muerta.dedo, muerta: true }), conMods(vocal)];
  }
  if (ch === 'ü' || ch === 'Ü') {
    const muerta = teclaPorCodigo(L.teclaMuerta.dieresis, idioma);
    return [conMods({ code: muerta.code, shift: true, altgr: false, dedo: muerta.dedo, muerta: true }), conMods(dir.get(ch === 'ü' ? 'u' : 'U'))];
  }
  const p = dir.get(ch);
  return p ? [conMods(p)] : [];
}

/** Dedo principal de un carácter (el de la última tecla). */
export const dedoDeCaracter = (ch, idioma = 'es-LA') => pasosPara(ch, idioma).at(-1)?.dedo || null;

/** ¿La distribución puede producir este carácter? */
export const existeCaracter = (ch, idioma = 'es-LA') => pasosPara(ch, idioma).length > 0;
