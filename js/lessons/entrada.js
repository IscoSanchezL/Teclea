/**
 * Captura del teclado para el motor de escritura. Funciona con teclados físicos (teclas muertas del español
 * incluidas), tabletas y celulares, usando un <textarea> oculto:
 *   - keydown  → Retroceso, Escape, resaltado de teclas (usa event.key / event.code, NUNCA keyCode)
 *   - input / composición → los caracteres (las tildes salen de la composición "tecla muerta + vocal")
 *   - paste / drop → se bloquean y se marcan como sospechosos
 */
import { sonido } from '../ui/sonido.js';

const CENTINELA = '​'; // permite detectar el retroceso en teclados móviles aunque el campo esté "vacío"

export function vincularEntrada({ motor, teclado, zona, alPausar = () => {}, alFoco = () => {} }) {
  const ta = document.createElement('textarea');
  ta.className = 'entrada-oculta';
  ta.setAttribute('aria-label', 'Escribe aquí el texto que ves en pantalla');
  ta.setAttribute('autocomplete', 'off'); ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocorrect', 'off');
  ta.setAttribute('spellcheck', 'false'); ta.rows = 1; ta.value = CENTINELA;
  zona.append(ta);

  let componiendo = false, ultimoCodigo = '';
  const reponer = () => { ta.value = CENTINELA; try { ta.setSelectionRange(1, 1); } catch { /* sin selección */ } };

  const procesar = (texto) => {
    for (const ch of [...texto.replace(/​/g, '')]) {
      if (ch === '\n' || ch === '\r' || ch === '\t') continue;
      const r = motor.escribir(ch);
      if (r === 'ok') sonido.tecla();
      else if (r === 'error') { sonido.error(); teclado?.error(ultimoCodigo); }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); alPausar(); return; }
    if (e.ctrlKey || e.metaKey) { if (['v', 'x', 'c'].includes(e.key.toLowerCase())) { e.preventDefault(); if (e.key.toLowerCase() === 'v') motor.marcarPegado(); } return; }
    ultimoCodigo = e.code;
    teclado?.presionar(e.code, true);
    if (e.key === 'Dead') { teclado?.avanzarPaso(); return; }
    if (e.key === 'Backspace') { if (!componiendo) { e.preventDefault(); motor.borrar(); } return; }
    if (e.key === 'Enter' || e.key === 'Tab') { if (e.key === 'Enter') e.preventDefault(); }
  };
  const onKeyUp = (e) => teclado?.presionar(e.code, false);

  const onBeforeInput = (e) => {
    const t = e.inputType || '';
    if (t === 'insertFromPaste' || t === 'insertFromDrop' || t === 'insertFromYank' || t === 'insertReplacementText') { e.preventDefault(); motor.marcarPegado(); return; }
    if (t === 'deleteContentBackward' && !componiendo) { e.preventDefault(); motor.borrar(); }
  };
  const onInput = () => {
    if (componiendo) return;
    const v = ta.value; reponer();
    if (v.replace(/​/g, '')) procesar(v);
  };
  const onCompStart = () => { componiendo = true; };
  const onCompEnd = (e) => { componiendo = false; const d = e.data; reponer(); if (d) procesar(d); };
  const bloquear = (e) => { e.preventDefault(); motor.marcarPegado(); };
  const onBlur = () => { teclado && [...document.querySelectorAll('.kv__k--presionada')].forEach((k) => k.classList.remove('kv__k--presionada')); alFoco(false); };
  const onFocus = () => { reponer(); alFoco(true); };

  const L = [[ta, 'keydown', onKeyDown], [ta, 'keyup', onKeyUp], [ta, 'beforeinput', onBeforeInput], [ta, 'input', onInput],
    [ta, 'compositionstart', onCompStart], [ta, 'compositionend', onCompEnd], [ta, 'paste', bloquear], [ta, 'drop', bloquear], [ta, 'cut', (e) => e.preventDefault()],
    [ta, 'blur', onBlur], [ta, 'focus', onFocus], [zona, 'pointerdown', () => setTimeout(() => ta.focus(), 0)]];
  L.forEach(([n, ev, fn]) => n.addEventListener(ev, fn));

  // Si el foco se pierde (clic en otro lado, cambio de pantalla…), la primera tecla lo recupera para que no haya que refrescar.
  const recuperarFoco = (e) => {
    const a = document.activeElement;
    if (a === ta || e.ctrlKey || e.metaKey || motor.pausado || motor.terminado || /^(INPUT|TEXTAREA|SELECT)$/.test(a?.tagName || '')) return;
    if (e.key === 'Escape' || e.key === 'Tab') return;
    ta.focus({ preventScroll: true });
  };
  document.addEventListener('keydown', recuperarFoco, true);

  return {
    enfocar: () => ta.focus({ preventScroll: true }),
    destruir() { L.forEach(([n, ev, fn]) => n.removeEventListener(ev, fn)); document.removeEventListener('keydown', recuperarFoco, true); ta.remove(); },
    campo: ta,
  };
}
