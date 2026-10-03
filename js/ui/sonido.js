/**
 * Sonidos sintetizados con WebAudio (sin archivos de audio → 0 KB de descarga) + vibración háptica.
 * Respeta las preferencias: sonido activado, volumen y vibración. El audio se crea tras el primer gesto del usuario.
 */
import { state } from '../core/state.js';

let ctx = null;

function contexto() {
  if (!state.prefs.sonido) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tono({ f = 440, dur = 0.08, tipo = 'sine', vol = 0.15, f2 = null, retraso = 0 }) {
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + retraso;
  const o = c.createOscillator(), g = c.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const v = Math.max(0.0001, vol * (state.prefs.volumen ?? 0.6));
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

const vibrar = (ms) => { if (state.prefs.vibracion && navigator.vibrate) navigator.vibrate(ms); };

export const sonido = {
  tecla: () => tono({ f: 520 + Math.random() * 60, dur: 0.04, tipo: 'triangle', vol: 0.07 }),
  error: () => { tono({ f: 180, f2: 120, dur: 0.14, tipo: 'sawtooth', vol: 0.1 }); vibrar(35); },
  acierto: () => { tono({ f: 660, dur: 0.1, vol: 0.12 }); tono({ f: 880, dur: 0.14, vol: 0.12, retraso: 0.09 }); },
  estrella: (i = 0) => tono({ f: 520 * 1.26 ** i, dur: 0.18, tipo: 'triangle', vol: 0.14, retraso: 0.05 }),
  medalla: () => { [523, 659, 784, 1047].forEach((f, i) => tono({ f, dur: 0.22, tipo: 'triangle', vol: 0.14, retraso: i * 0.11 })); },
  nivel: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tono({ f, dur: 0.2, vol: 0.14, retraso: i * 0.09 })); },
  fin: () => { tono({ f: 440, dur: 0.12, vol: 0.12 }); tono({ f: 660, dur: 0.2, vol: 0.12, retraso: 0.12 }); },
  clic: () => tono({ f: 700, dur: 0.03, tipo: 'square', vol: 0.04 }),
  perder: () => { tono({ f: 300, f2: 150, dur: 0.35, tipo: 'sawtooth', vol: 0.1 }); vibrar(80); },
};
