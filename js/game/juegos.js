/**
 * Los 5 minijuegos de teclado. Cada uno exporta crear({zona, grado, vocab, alFin}) → {destruir}.
 * alFin({ puntos, chars, errores, duracionSeg }) con chars = caracteres correctos escritos.
 * Todo con DOM + requestAnimationFrame (sin canvas ni librerías) para que sean livianos.
 */
import { h } from '../core/utils.js';
import { icono } from '../ui/icons.js';
import { sonido } from '../ui/sonido.js';
import { capturar } from './captura.js';
import { MotorEscritura } from '../lessons/motor.js';
import { vistaTexto } from '../lessons/texto-vista.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const LARGO_MAX = { 2: 5, 3: 6, 4: 7, 5: 8, 6: 9 };

/** Palabras adecuadas al grado. */
export function palabrasDeGrado(vocab, grado) {
  const max = LARGO_MAX[grado] || 7;
  const base = grado >= 5 ? [...vocab.sinTilde, ...vocab.conTilde.filter((w) => !/^[A-Z]/.test(w))] : vocab.sinTilde;
  const pool = base.filter((w) => w.length >= 3 && w.length <= max && /^[a-záéíóúüñ]+$/.test(w));
  return pool.length > 20 ? pool : vocab.sinTilde.slice(0, 80);
}

const hud = (...hijos) => h('div', { class: 'jg__hud' }, hijos);
const dato = (etq, ini = '0') => { const b = h('b', {}, ini); return { b, nodo: h('span', { class: 'ej__dato' }, h('small', {}, etq), b) }; };

/* ═════════════ 1. Lluvia de palabras ═════════════ */
export function lluvia({ zona, grado, vocab, alFin }) {
  const pal = palabrasDeGrado(vocab, grado);
  let vidas = 5, puntos = 0, chars = 0, errores = 0, buffer = '', combo = 0, t0 = performance.now(), ultimoSpawn = 0, fin = false, raf = 0, vel = grado <= 3 ? 38 : 52;
  const activos = [];
  const campo = h('div', { class: 'jg__campo jg__campo--lluvia' });
  const linea = h('div', { class: 'jg__linea', 'aria-live': 'off' }, h('span', { class: 'jg__buffer' }), h('i', { class: 'jg__cursor' }));
  const dV = dato('Vidas', '❤️'.repeat(vidas)), dP = dato('Puntos'), dC = dato('Combo', '×1');
  zona.append(hud(dV.nodo, dP.nodo, dC.nodo), campo, linea);
  const buf = linea.querySelector('.jg__buffer');

  const cap = capturar(zona, {
    alChar: (ch) => {
      if (fin) return;
      const nuevo = buffer + ch.toLowerCase();
      const cand = activos.filter((w) => w.texto.startsWith(nuevo));
      if (!cand.length) { errores++; combo = 0; dC.b.textContent = '×1'; sonido.error(); linea.classList.remove('jg__linea--mal'); void linea.offsetWidth; linea.classList.add('jg__linea--mal'); return; }
      buffer = nuevo; sonido.tecla();
      cand.forEach((w) => w.el.classList.add('jg__palabra--sel'));
      activos.filter((w) => !w.texto.startsWith(buffer)).forEach((w) => w.el.classList.remove('jg__palabra--sel'));
      const exacta = activos.find((w) => w.texto === buffer);
      if (exacta) {
        chars += buffer.length; combo++; puntos += buffer.length * 10 * Math.min(5, 1 + Math.floor(combo / 4));
        exacta.el.classList.add('jg__palabra--boom'); setTimeout(() => exacta.el.remove(), 250);
        activos.splice(activos.indexOf(exacta), 1); buffer = ''; sonido.acierto();
        dP.b.textContent = String(puntos); dC.b.textContent = `×${Math.min(5, 1 + Math.floor(combo / 4))}`;
        activos.forEach((w) => w.el.classList.remove('jg__palabra--sel'));
      }
      buf.textContent = buffer;
    },
    alBorrar: () => { buffer = buffer.slice(0, -1); buf.textContent = buffer; activos.forEach((w) => w.el.classList.toggle('jg__palabra--sel', buffer && w.texto.startsWith(buffer))); },
  });

  function terminar() { if (fin) return; fin = true; cancelAnimationFrame(raf); sonido.perder(); alFin({ puntos, chars, errores, duracionSeg: Math.max(3, Math.round((performance.now() - t0) / 1000)) }); }

  function cuadro(t) {
    if (fin) return;
    const dt = Math.min(0.05, (t - (cuadro.prev || t)) / 1000); cuadro.prev = t;
    const seg = (t - t0) / 1000;
    const alto = campo.clientHeight || 360;
    if (t - ultimoSpawn > Math.max(900, 2400 - seg * 25)) {
      ultimoSpawn = t; const texto = rnd(pal);
      if (!activos.some((w) => w.texto === texto)) {
        const el = h('span', { class: 'jg__palabra' }, texto);
        el.style.left = `${6 + Math.random() * 78}%`; campo.append(el);
        activos.push({ texto, el, y: -30, v: vel + seg * 0.7 + Math.random() * 14 });
      }
    }
    for (const w of [...activos]) {
      w.y += w.v * dt; w.el.style.transform = `translateY(${w.y}px)`;
      if (w.y > alto - 34) {
        w.el.classList.add('jg__palabra--cae'); setTimeout(() => w.el.remove(), 300);
        activos.splice(activos.indexOf(w), 1); vidas--; combo = 0; buffer = ''; buf.textContent = ''; dV.b.textContent = '❤️'.repeat(Math.max(0, vidas)) || '💔'; sonido.error();
        if (vidas <= 0) return terminar();
      }
    }
    if (seg > 120) return terminar();
    raf = requestAnimationFrame(cuadro);
  }
  raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { fin = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

/* ═════════════ 2. Carrera de cohetes (usa el motor de escritura) ═════════════ */
export function carrera({ zona, grado, vocab, alFin }) {
  const pal = palabrasDeGrado(vocab, grado);
  const texto = Array.from({ length: 30 }, () => rnd(pal)).join(' ');
  let terminado = false, t0 = null, raf = 0;
  const motor = new MotorEscritura({ texto, estricto: false, retroceso: true, alEvento: (e) => { vista.alEvento(e); if (e.tipo === 'inicio') t0 = performance.now(); if (e.tipo === 'error') sonido.error(); if (e.tipo === 'avance') sonido.tecla(); } });
  const vista = vistaTexto(motor);
  const objetivoChars = Math.min(texto.length - 1, 150 + grado * 20);
  const vel = [0, 0, 5.5, 7.5, 10, 13, 16][grado] || 9; // PPM de los rivales (a su ritmo)
  const rivales = [{ n: 'Nova', v: vel * 0.8, p: 0, c: '#FF6B5B' }, { n: 'Orbi', v: vel, p: 0, c: '#3DDBB0' }, { n: 'Zeta', v: vel * 1.2, p: 0, c: '#FFD04A' }];
  const pista = h('div', { class: 'carrera' }, [...rivales.map((r) => ({ ...r })), { n: 'Tú', jugador: true, c: '#8A70FA' }].map((c, i) => h('div', { class: 'carrera__carril', dataset: { i } },
    h('span', { class: 'carrera__nombre' }, c.n), h('span', { class: 'carrera__cohete', style: { '--c': c.c } }, icono('rocket', { tam: 26 })), h('i', { class: 'carrera__meta' }))));
  const cohetes = [...pista.querySelectorAll('.carrera__cohete')];
  const dT = dato('Tiempo', '0:00'), dPos = dato('Puesto', '—');
  zona.append(hud(dT.nodo, dPos.nodo), pista, h('div', { class: 'ej__texto card' }, vista.el));
  const cap = capturar(zona, { alChar: (c) => { if (!terminado) motor.escribir(c); }, alBorrar: () => motor.borrar() });
  function cuadro(t) {
    if (terminado) return;
    const seg = t0 ? (t - t0) / 1000 : 0;
    const prog = [...rivales.map((r) => Math.min(1, (r.v / 12 * seg * 60 / 60 * 12 / 5 * 5) / objetivoChars)), Math.min(1, motor.pos / objetivoChars)];
    // rival: caracteres = PPM * 5 * minutos
    rivales.forEach((r, i) => { prog[i] = Math.min(1, (r.v * 5 * (seg / 60)) / objetivoChars); });
    cohetes.forEach((c, i) => { c.style.setProperty('--x', `${prog[i] * 100}%`); });
    const orden = prog.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p); const puesto = orden.findIndex((o) => o.i === 3) + 1;
    dPos.b.textContent = `${puesto}º`; dT.b.textContent = `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`;
    if (prog[3] >= 1 || prog.slice(0, 3).some((p) => p >= 1) || seg > 180) {
      terminado = true; motor.terminar();
      const r = motor.resultado(); const pos = prog[3] >= 1 ? orden.filter((o) => o.p >= 1).findIndex((o) => o.i === 3) + 1 || 1 : puesto;
      const puntos = [0, 1000, 700, 450, 250][pos] + Math.round(r.precision * 2);
      sonido.fin(); alFin({ puntos, chars: Math.max(0, motor.pos - motor.sinCorregir), errores: motor.errores, duracionSeg: r.duracionSeg, puesto: pos });
      return;
    }
    raf = requestAnimationFrame(cuadro);
  }
  raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { terminado = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

/* ═════════════ 3. Rescate de Tecli ═════════════ */
export function rescate({ zona, grado, vocab, alFin }) {
  const pal = palabrasDeGrado(vocab, grado);
  const objetivo = 8 + grado; let hechas = 0, chars = 0, errores = 0, buffer = '', agua = 0, fin = false, raf = 0, palabra = rnd(pal);
  const t0 = performance.now(); const subida = grado <= 3 ? 1.6 : 2.4;  // % de agua por segundo
  const escena = h('div', { class: 'rescate' }, h('div', { class: 'rescate__cielo' }), h('div', { class: 'rescate__tecli' }, '🦊'), h('div', { class: 'rescate__agua' }), h('div', { class: 'rescate__cuerda' }));
  const pal$ = h('div', { class: 'rescate__palabra' }), dP = dato('Rescate', `0/${objetivo}`);
  zona.append(hud(dP.nodo), escena, pal$);
  const pintar = () => { pal$.replaceChildren(...[...palabra].map((c, i) => h('span', { class: i < buffer.length ? 't--ok' : i === buffer.length ? 't--act' : 't--pend' }, c))); };
  const cap = capturar(zona, {
    alChar: (ch) => {
      if (fin) return;
      if (ch.toLowerCase() === palabra[buffer.length]) {
        buffer += palabra[buffer.length]; sonido.tecla();
        if (buffer === palabra) { chars += palabra.length; hechas++; agua = Math.max(0, agua - 12); dP.b.textContent = `${hechas}/${objetivo}`; sonido.acierto(); buffer = ''; palabra = rnd(pal);
          escena.style.setProperty('--sube', `${(hechas / objetivo) * 100}%`); if (hechas >= objetivo) return terminar(true); }
      } else { errores++; agua += 2; sonido.error(); pal$.classList.remove('jg__linea--mal'); void pal$.offsetWidth; pal$.classList.add('jg__linea--mal'); }
      pintar();
    },
    alBorrar: () => {},
  });
  function terminar(gana) { if (fin) return; fin = true; cancelAnimationFrame(raf); const dur = Math.max(3, Math.round((performance.now() - t0) / 1000)); gana ? sonido.fin() : sonido.perder(); alFin({ puntos: gana ? Math.max(300, 1000 - dur * 6 - errores * 20) : hechas * 40, chars, errores, duracionSeg: dur, gano: gana }); }
  let prev = performance.now();
  function cuadro(t) { if (fin) return; const dt = (t - prev) / 1000; prev = t; agua += subida * dt; escena.style.setProperty('--agua', `${Math.min(100, agua)}%`); if (agua >= 100) return terminar(false); raf = requestAnimationFrame(cuadro); }
  pintar(); raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { fin = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

/* ═════════════ 4. Tiro al blanco de letras ═════════════ */
export function blanco({ zona, grado, alFin }) {
  const letras = (grado <= 3 ? 'asdfjklñgh' : 'abcdefghijklmnñopqrstuvwxyz').split('');
  const DUR = 45; let puntos = 0, aciertos = 0, fallos = 0, combo = 0, fin = false, raf = 0, ultimo = 0; const t0 = performance.now(); const dianas = [];
  const campo = h('div', { class: 'jg__campo jg__campo--blanco' });
  const dP = dato('Puntos'), dT = dato('Tiempo', `${DUR}`), dC = dato('Combo', '×1');
  zona.append(hud(dT.nodo, dP.nodo, dC.nodo), campo);
  const cap = capturar(zona, {
    alChar: (ch) => {
      if (fin) return;
      const l = ch.toLowerCase(); const d = dianas.filter((x) => x.letra === l).sort((a, b) => a.nace - b.nace)[0];
      if (!d) { fallos++; combo = 0; dC.b.textContent = '×1'; sonido.error(); return; }
      aciertos++; combo++; puntos += 10 * Math.min(5, 1 + Math.floor(combo / 5)); sonido.acierto();
      d.el.classList.add('jg__diana--ok'); setTimeout(() => d.el.remove(), 200); dianas.splice(dianas.indexOf(d), 1);
      dP.b.textContent = String(puntos); dC.b.textContent = `×${Math.min(5, 1 + Math.floor(combo / 5))}`;
    },
  });
  function cuadro(t) {
    if (fin) return;
    const seg = (t - t0) / 1000; dT.b.textContent = String(Math.max(0, Math.ceil(DUR - seg)));
    if (t - ultimo > Math.max(520, 1100 - seg * 14) && dianas.length < 6) {
      ultimo = t; const letra = rnd(letras);
      const el = h('span', { class: 'jg__diana' }, letra.toUpperCase()); el.style.left = `${6 + Math.random() * 84}%`; el.style.top = `${8 + Math.random() * 74}%`; campo.append(el);
      dianas.push({ letra, el, nace: t, vive: Math.max(1500, 2800 - seg * 25) });
    }
    for (const d of [...dianas]) { if (t - d.nace > d.vive) { d.el.classList.add('jg__diana--fuera'); setTimeout(() => d.el.remove(), 200); dianas.splice(dianas.indexOf(d), 1); combo = 0; fallos++; dC.b.textContent = '×1'; } }
    if (seg >= DUR) { fin = true; sonido.fin(); return alFin({ puntos, chars: aciertos, errores: fallos, duracionSeg: DUR }); }
    raf = requestAnimationFrame(cuadro);
  }
  raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { fin = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

/* ═════════════ 5. Duelo contra el tiempo ═════════════ */
export function duelo({ zona, grado, vocab, alFin, mejorPrevio = 0 }) {
  const pal = palabrasDeGrado(vocab, grado);
  const DUR = 60; let palabra = rnd(pal), buffer = '', puntos = 0, chars = 0, errores = 0, hechas = 0, fin = false, raf = 0, t0 = null;
  const objetivo = Math.max(mejorPrevio, 120);
  const dT = dato('Tiempo', `${DUR}`), dP = dato('Puntos'), dM = dato('A superar', String(objetivo));
  const barraTu = h('i', { class: 'duelo__barra duelo__barra--tu' }), barraFan = h('i', { class: 'duelo__barra duelo__barra--fan' });
  const grande = h('div', { class: 'duelo__palabra' });
  zona.append(hud(dT.nodo, dP.nodo, dM.nodo), h('div', { class: 'duelo__barras' }, h('div', {}, h('small', {}, 'Tú'), h('span', {}, barraTu)), h('div', {}, h('small', {}, 'Tu marca'), h('span', {}, barraFan))), grande);
  const pintar = () => grande.replaceChildren(...[...palabra].map((c, i) => h('span', { class: i < buffer.length ? 't--ok' : i === buffer.length ? 't--act' : 't--pend' }, c)));
  const cap = capturar(zona, {
    alChar: (ch) => {
      if (fin) return; t0 ??= performance.now();
      if (ch.toLowerCase() === palabra[buffer.length]) {
        buffer += palabra[buffer.length]; sonido.tecla();
        if (buffer === palabra) { chars += palabra.length; hechas++; puntos += palabra.length * 10 + 5; dP.b.textContent = String(puntos); sonido.acierto(); buffer = ''; palabra = rnd(pal); }
      } else { errores++; puntos = Math.max(0, puntos - 5); dP.b.textContent = String(puntos); sonido.error(); grande.classList.remove('jg__linea--mal'); void grande.offsetWidth; grande.classList.add('jg__linea--mal'); }
      pintar();
    },
  });
  function cuadro(t) {
    if (fin) return;
    const seg = t0 ? (t - t0) / 1000 : 0; dT.b.textContent = String(Math.max(0, Math.ceil(DUR - seg)));
    barraTu.style.width = `${Math.min(100, (puntos / objetivo) * 100)}%`; barraFan.style.width = `${Math.min(100, (seg / DUR) * 100)}%`;
    if (seg >= DUR) { fin = true; sonido.fin(); return alFin({ puntos, chars, errores, duracionSeg: DUR, hechas }); }
    raf = requestAnimationFrame(cuadro);
  }
  pintar(); raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { fin = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

export const JUEGOS = [
  { id: 'carrera', nombre: 'Carrera de cohetes', icono: 'rocket', color: ['#8A70FA', '#4F6BFF'], texto: 'Escribe rápido y sin errores para ganarle a Nova, Orbi y Zeta.', crear: carrera },
  { id: 'lluvia', nombre: 'Lluvia de palabras', icono: 'sparkle', color: ['#4FB6FF', '#1E78C8'], texto: 'Las palabras caen: escríbelas antes de que toquen el suelo.', crear: lluvia },
  { id: 'rescate', nombre: 'Rescata a Tecli', icono: 'heart', color: ['#FF8A7A', '#E84F3F'], texto: 'El agua sube. Cada palabra correcta la hace bajar y acerca a Tecli a la cima.', crear: rescate },
  { id: 'blanco', nombre: 'Tiro al blanco', icono: 'target', color: ['#3DDBB0', '#0B8F6D'], texto: 'Aparecen letras: pulsa la tecla justa antes de que desaparezcan.', crear: blanco },
  { id: 'duelo', nombre: 'Duelo contra el tiempo', icono: 'clock', color: ['#FFD04A', '#E39A00'], texto: '60 segundos para escribir todas las palabras que puedas. ¡Supera tu marca!', crear: duelo },
];
