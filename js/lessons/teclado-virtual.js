/**
 * Teclado virtual con manos. Muestra la tecla siguiente (y el modificador y el dedo si hacen falta),
 * se hunde al pulsar y marca los errores. Modos: 'guiado' | 'libre' | 'oculto'.
 */
import { h } from '../core/utils.js';
import { LAYOUTS, DEDOS, pasosPara, dedoDeCodigo, shiftPara } from './teclado-datos.js';
import { crearManos } from './manos.js';

const ESPECIALES = {
  fila0: [['Backspace', '⌫', 2]],
  fila1: { ini: [['Tab', 'Tab', 1.5]], fin: [['EnterAlto', '', 1.5, true]] },
  fila2: { ini: [['CapsLock', 'Bloq', 1.75]], fin: [['Enter', 'Enter', 1.25]] },
  fila3: { ini: [['ShiftLeft', '⇧', 1.25]], fin: [['ShiftRight', '⇧', 2.75]] },
  fila4: [['ControlLeft', 'Ctrl', 1.5], ['MetaLeft', '', 1.25], ['AltLeft', 'Alt', 1.25], ['Space', '', 6.5], ['AltRight', 'AltGr', 1.25], ['MetaRight', '', 1.25], ['ControlRight', 'Ctrl', 1.5]],
};

function tecla(code, etiqueta, ancho, { dedo, sup = '', relleno = false, muerta = false } = {}) {
  const k = h('div', { class: `kv__k ${relleno ? 'kv__k--relleno' : ''} ${muerta ? 'kv__k--muerta' : ''}`, style: { '--w': ancho }, dataset: { code } },
    sup ? h('span', { class: 'kv__sup' }, sup) : null, h('span', { class: 'kv__etq' }, etiqueta));
  if (dedo) { k.dataset.dedo = dedo; k.classList.add(`dedo-${DEDOS[dedo].color}`); }
  return k;
}

export function crearTeclado({ idioma = 'es-LA', manos = true } = {}) {
  const layout = LAYOUTS[idioma] || LAYOUTS['es-LA'];
  const mapa = new Map();
  const reg = (k) => { mapa.set(k.dataset.code, k); return k; };
  const esp = (code, etq, w, relleno = false) => reg(tecla(code, etq, w, { dedo: relleno ? null : dedoDeCodigo(code), relleno }));

  const filas = layout.filas.map((fila, i) => {
    const teclas = fila.map((k) => {
      const esLetra = /^[a-zñç]$/.test(k.base);
      const etq = esLetra ? k.base.toUpperCase() : k.base;
      return reg(tecla(k.code, etq, 1, { dedo: k.dedo, sup: !esLetra && k.shift ? k.shift : '', muerta: k.base === '´' || k.base === '`' }));
    });
    const e = i === 0 ? { ini: [], fin: ESPECIALES.fila0 } : ESPECIALES[`fila${i}`];
    return h('div', { class: `kv__fila kv__fila--${i}` },
      (e.ini || []).map(([c, t, w, r]) => esp(c, t, w, r)), teclas, (e.fin || []).map(([c, t, w, r]) => esp(c, t, w, r)));
  });
  const filaEsp = h('div', { class: 'kv__fila kv__fila--4' }, ESPECIALES.fila4.map(([c, t, w]) => (c === 'Space' ? reg(tecla(c, '', w, { dedo: 'pulgar-izq' })) : esp(c, t, w, c.startsWith('Meta'))))); 
  const teclado = h('div', { class: 'kv__teclado', 'aria-hidden': 'true' }, ...filas, filaEsp);
  const m = manos ? crearManos() : null;
  const ayuda = h('p', { class: 'kv__ayuda', 'aria-live': 'off' });
  const raiz = h('div', { class: 'kv', dataset: { modo: 'guiado' } }, teclado, m?.el, ayuda);

  let pasos = [], paso = 0, modo = 'guiado';
  const limpiarResalte = () => mapa.forEach((k) => k.classList.remove('kv__k--sig', 'kv__k--mod', 'kv__k--paso2'));

  const api = {
    el: raiz,
    get modo() { return modo; },
    setModo(nuevo) { modo = nuevo; raiz.dataset.modo = nuevo; if (nuevo !== 'guiado') { limpiarResalte(); m?.limpiar(); ayuda.textContent = ''; } },

    /** Indica cuál es el siguiente carácter a escribir (null = ninguno). */
    siguiente(ch) {
      limpiarResalte(); paso = 0;
      pasos = ch == null ? [] : pasosPara(ch, idioma);
      if (modo !== 'guiado') return;
      this._pintarPaso();
    },
    _pintarPaso() {
      limpiarResalte();
      const p = pasos[paso];
      if (!p) { m?.limpiar(); ayuda.textContent = ''; return; }
      mapa.get(p.code)?.classList.add('kv__k--sig', ...(paso === 1 ? ['kv__k--paso2'] : []));
      let secundario = null;
      if (p.modificador) {
        mapa.get(p.modificador)?.classList.add('kv__k--mod');
        secundario = p.modificador === 'AltRight' ? 'pulgar-der' : dedoDeCodigo(p.modificador);
      }
      m?.resaltar(p.dedo, secundario);
      const dedo = DEDOS[p.dedo]?.nombre || '';
      const mod = p.modificador ? (p.modificador === 'AltRight' ? ' + AltGr' : ' + Shift') : '';
      ayuda.textContent = pasos.length === 2 ? `Paso ${paso + 1} de 2 · ${dedo}${mod}` : `${dedo}${mod}`;
    },
    /** Tras pulsar una tecla muerta (´ ¨) se pasa al segundo paso (la vocal). */
    avanzarPaso() { if (paso < pasos.length - 1) { paso++; this._pintarPaso(); } },

    presionar(code, abajo) { mapa.get(code)?.classList.toggle('kv__k--presionada', abajo); },
    error(code) {
      const k = mapa.get(code); if (!k) return;
      k.classList.remove('kv__k--mal'); void k.offsetWidth; k.classList.add('kv__k--mal');
      setTimeout(() => k.classList.remove('kv__k--mal'), 360);
    },
    /** Demostración: recorre un conjunto de caracteres iluminándolos uno tras otro. */
    demo(chars, ms = 1300) {
      let i = 0;
      const paso = () => { api.siguiente(chars[i++ % chars.length]); if (pasos.length === 2) setTimeout(() => api.avanzarPaso(), ms / 2); };
      const id = setInterval(() => { if (!raiz.isConnected) return clearInterval(id); paso(); }, ms);
      paso();
      return () => clearInterval(id);
    },
    pasosActuales: () => pasos,
    /** Código físico de la tecla iluminada ahora (y, si hay dos pasos, la del paso actual). */
    codigoIluminado: () => pasos[paso]?.code ?? null,
    /** Todas las teclas que cuentan como "la tecla que brilla" (incluye el modificador iluminado). */
    codigosIluminados: () => [pasos[paso]?.code, pasos[paso]?.modificador].filter(Boolean),
  };
  return api;
}

export { shiftPara };
