/**
 * Captura de caracteres para los minijuegos (misma técnica robusta que los ejercicios: textarea oculto,
 * composición para las tildes, bloqueo de pegado). No usa el motor de escritura: cada juego decide qué hacer.
 */
const CENTINELA = '​';

export function capturar(zona, { alChar = () => {}, alBorrar = () => {}, alEnter = () => {}, alEscape = () => {} } = {}) {
  const ta = document.createElement('textarea');
  ta.className = 'entrada-oculta'; ta.rows = 1; ta.value = CENTINELA;
  ta.setAttribute('aria-label', 'Escribe para jugar'); ta.setAttribute('autocomplete', 'off'); ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocorrect', 'off'); ta.setAttribute('spellcheck', 'false');
  zona.append(ta);
  let comp = false;
  const reponer = () => { ta.value = CENTINELA; try { ta.setSelectionRange(1, 1); } catch { /* sin selección */ } };
  const proc = (t) => { for (const ch of [...t.replace(/​/g, '')]) if (ch !== '\n' && ch !== '\r' && ch !== '\t') alChar(ch); };
  const L = [
    ['keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); alEscape(); return; }
      if (e.ctrlKey || e.metaKey) { if (['v', 'x', 'c'].includes(e.key.toLowerCase())) e.preventDefault(); return; }
      if (e.key === 'Backspace' && !comp) { e.preventDefault(); alBorrar(); }
      if (e.key === 'Enter') { e.preventDefault(); alEnter(); }
    }],
    ['beforeinput', (e) => { const t = e.inputType || ''; if (/^insertFrom|insertReplacement/.test(t)) e.preventDefault(); else if (t === 'deleteContentBackward' && !comp) { e.preventDefault(); alBorrar(); } }],
    ['input', () => { if (comp) return; const v = ta.value; reponer(); if (v.replace(/​/g, '')) proc(v); }],
    ['compositionstart', () => { comp = true; }],
    ['compositionend', (e) => { comp = false; const d = e.data; reponer(); if (d) proc(d); }],
    ['paste', (e) => e.preventDefault()], ['drop', (e) => e.preventDefault()],
  ];
  L.forEach(([ev, fn]) => ta.addEventListener(ev, fn));
  const foco = () => setTimeout(() => ta.focus({ preventScroll: true }), 0);
  zona.addEventListener('pointerdown', foco);
  return { enfocar: foco, destruir() { zona.removeEventListener('pointerdown', foco); L.forEach(([ev, fn]) => ta.removeEventListener(ev, fn)); ta.remove(); }, campo: ta };
}
