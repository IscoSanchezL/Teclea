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
import { t as tr, idioma } from '../i18n/index.js';

// Azar de los juegos. Con semilla (retos entre compañeros) los dos jugadores reciben las mismas palabras.
let azar = Math.random;
export function usarSemilla(semilla) {
  if (semilla == null) { azar = Math.random; return; }
  let a = Number(semilla) >>> 0;
  azar = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = (a) => a[Math.floor(azar() * a.length)];
const LARGO_MAX = { 2: 5, 3: 6, 4: 7, 5: 8, 6: 9 };

/** Palabras adecuadas al grado. */
export function palabrasDeGrado(vocab, grado) {
  const max = LARGO_MAX[grado] || 7;
  const base = grado >= 5 ? [...vocab.sinTilde, ...vocab.conTilde.filter((w) => !/^[A-Z]/.test(w))] : vocab.sinTilde;
  const pool = base.filter((w) => w.length >= 3 && w.length <= max && /^[a-záéíóúüñ]+$/.test(w));
  // (en inglés, vocab viene de data/en/palabras.json: palabras sin tildes ni ñ)
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
  const dV = dato(tr('juego.vidas'), '❤️'.repeat(vidas)), dP = dato(tr('juego.puntos')), dC = dato(tr('juego.combo'), '×1');
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
        el.style.left = `${6 + azar() * 78}%`; campo.append(el);
        activos.push({ texto, el, y: -30, v: vel + seg * 0.7 + azar() * 14 });
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
  const pista = h('div', { class: 'carrera' }, [...rivales.map((r) => ({ ...r })), { n: tr('juego.tu'), jugador: true, c: '#8A70FA' }].map((c, i) => h('div', { class: 'carrera__carril', dataset: { i } },
    h('span', { class: 'carrera__nombre' }, c.n), h('span', { class: 'carrera__cohete', style: { '--c': c.c } }, icono('rocket', { tam: 26 })), h('i', { class: 'carrera__meta' }))));
  const cohetes = [...pista.querySelectorAll('.carrera__cohete')];
  const dT = dato(tr('juego.tiempo'), '0:00'), dPos = dato(tr('juego.puesto'), '—');
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
    dPos.b.textContent = tr('juego.puestoN', { n: puesto }); dT.b.textContent = `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`;
    if (prog[3] >= 1 || prog.slice(0, 3).some((p) => p >= 1) || seg > 180) {
      terminado = true; motor.terminar();
      const r = motor.resultado(); const pos = prog[3] >= 1 ? orden.filter((o) => o.p >= 1).findIndex((o) => o.i === 3) + 1 || 1 : puesto;
      // Los puntos del puesto solo cuentan según lo que escribió bien: si no avanzó (p. ej. dejó una tecla apretada), 0
      const avance = Math.max(0, Math.min(1, (motor.pos - motor.sinCorregir) / objetivoChars));
      const puntos = Math.round(([0, 1000, 700, 450, 250][pos] + Math.round(r.precision * 2)) * avance);
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
  const pal$ = h('div', { class: 'rescate__palabra' }), dP = dato(tr('juego.rescate'), `0/${objetivo}`);
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
  const en = idioma() === 'en';
  const letras = (grado <= 3 ? (en ? 'asdfjklgh' : 'asdfjklñgh') : (en ? 'abcdefghijklmnopqrstuvwxyz' : 'abcdefghijklmnñopqrstuvwxyz')).split('');
  const DUR = 45; let puntos = 0, aciertos = 0, fallos = 0, combo = 0, fin = false, raf = 0, ultimo = 0; const t0 = performance.now(); const dianas = [];
  const campo = h('div', { class: 'jg__campo jg__campo--blanco' });
  const dP = dato(tr('juego.puntos')), dT = dato(tr('juego.tiempo'), `${DUR}`), dC = dato(tr('juego.combo'), '×1');
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
      const el = h('span', { class: 'jg__diana' }, letra.toUpperCase()); el.style.left = `${6 + azar() * 84}%`; el.style.top = `${8 + azar() * 74}%`; campo.append(el);
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
  const dT = dato(tr('juego.tiempo'), `${DUR}`), dP = dato(tr('juego.puntos')), dM = dato(tr('juego.aSuperar'), String(objetivo));
  const barraTu = h('i', { class: 'duelo__barra duelo__barra--tu' }), barraFan = h('i', { class: 'duelo__barra duelo__barra--fan' });
  const grande = h('div', { class: 'duelo__palabra' });
  zona.append(hud(dT.nodo, dP.nodo, dM.nodo), h('div', { class: 'duelo__barras' }, h('div', {}, h('small', {}, tr('juego.tu')), h('span', {}, barraTu)), h('div', {}, h('small', {}, tr('juego.tuMarca')), h('span', {}, barraFan))), grande);
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

/* ═════════════ 6. Jefe final ═════════════ */
export function jefe({ zona, grado, vocab, alFin }) {
  const pal = palabrasDeGrado(vocab, grado);
  const VIDA = 70 + grado * 14, ESPERA = grado <= 3 ? 10 : 7.5;   // vida del jefe (letras) y segundos antes de que ataque
  const bicho = rnd(['👾', '🐉', '🦖', '🤖', '👹', '🦑']);
  let vida = VIDA, corazones = 3, palabra = rnd(pal), buffer = '', carga = 0, combo = 0, chars = 0, errores = 0, fin = false, raf = 0, prev = 0;
  const t0 = performance.now();
  const dV = dato(tr('juego.vidas'), '❤️❤️❤️'), dK = dato(tr('juego.combo'), '×1');
  const monstruo = h('div', { class: 'jefe__bicho', 'aria-hidden': 'true' }, bicho);
  const vidaFill = h('i'), cargaFill = h('i');
  const campo = h('div', { class: 'jg__campo jefe' }, monstruo,
    h('div', { class: 'jefe__barras' }, h('div', { class: 'jefe__barra jefe__barra--vida', title: 'HP' }, vidaFill), h('div', { class: 'jefe__barra jefe__barra--ataque', title: tr('juego.jefe.ataque') }, cargaFill)));
  const grande = h('div', { class: 'duelo__palabra' });
  zona.append(hud(dV.nodo, dK.nodo), campo, grande);
  const pintar = () => grande.replaceChildren(...[...palabra].map((c, i) => h('span', { class: i < buffer.length ? 't--ok' : i === buffer.length ? 't--act' : 't--pend' }, c)));
  const anim = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const mult = () => 1 + Math.min(3, Math.floor(combo / 3)) * 0.5;
  const cap = capturar(zona, {
    alChar: (ch) => {
      if (fin) return;
      if (ch.toLowerCase() === palabra[buffer.length]) {
        buffer += palabra[buffer.length]; sonido.tecla();
        if (buffer === palabra) {
          vida -= Math.round(palabra.length * mult()); chars += palabra.length; combo++; carga = 0; buffer = ''; palabra = rnd(pal); sonido.acierto();
          anim(monstruo, 'jefe__bicho--golpe'); dK.b.textContent = `×${mult()}`;
          if (vida <= 0) { vidaFill.style.width = '0%'; return terminar(true); }
        }
      } else { errores++; combo = 0; carga += 1; dK.b.textContent = '×1'; sonido.error(); anim(grande, 'jg__linea--mal'); }
      pintar();
    },
  });
  function terminar(gana) {
    if (fin) return; fin = true; cancelAnimationFrame(raf);
    const dur = Math.max(3, Math.round((performance.now() - t0) / 1000));
    gana ? sonido.fin() : sonido.perder();
    const puntos = gana ? Math.max(400, 1000 + corazones * 100 - dur * 4 - errores * 10) : Math.round((1 - Math.max(0, vida) / VIDA) * 600);
    alFin({ puntos, chars, errores, duracionSeg: dur, gano: gana });
  }
  function cuadro(t) {
    if (fin) return;
    const dt = Math.min(0.05, (t - (prev || t)) / 1000); prev = t; carga += dt;
    vidaFill.style.width = `${Math.max(0, (vida / VIDA) * 100)}%`; cargaFill.style.width = `${Math.min(100, (carga / ESPERA) * 100)}%`;
    if (carga >= ESPERA) {
      corazones--; carga = 0; buffer = ''; combo = 0; dK.b.textContent = '×1'; sonido.error(); anim(campo, 'jefe--ataca');
      dV.b.textContent = '❤️'.repeat(Math.max(0, corazones)) || '💔'; pintar();
      if (corazones <= 0) return terminar(false);
    }
    raf = requestAnimationFrame(cuadro);
  }
  pintar(); raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { fin = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

/* ═════════════ 7. Frenesí de oro ═════════════ */
export function frenesi({ zona, grado, vocab, alFin }) {
  const pal = palabrasDeGrado(vocab, grado);
  const DUR = 40;
  let resto = DUR, puntos = 0, chars = 0, errores = 0, combo = 0, buffer = '', fin = false, raf = 0, t0 = null, prev = 0;
  const nueva = () => { const r = azar(); return { texto: rnd(pal), tipo: r < 0.14 ? 'oro' : r < 0.27 ? 'reloj' : 'normal' }; };
  let actual = nueva();
  const dT = dato(tr('juego.tiempo'), String(DUR)), dP = dato(tr('juego.puntos')), dC = dato(tr('juego.combo'), '×1');
  const insignia = h('div', { class: 'frenesi__insignia' }), grande = h('div', { class: 'duelo__palabra' });
  const aviso = h('div', { class: 'frenesi__aviso', 'aria-hidden': 'true' });
  zona.append(hud(dT.nodo, dP.nodo, dC.nodo), h('div', { class: 'jg__campo frenesi' }, insignia, grande, aviso));
  const mult = () => Math.min(5, 1 + Math.floor(combo / 3));
  const pintar = () => {
    grande.replaceChildren(...[...actual.texto].map((c, i) => h('span', { class: i < buffer.length ? 't--ok' : i === buffer.length ? 't--act' : 't--pend' }, c)));
    insignia.textContent = actual.tipo === 'oro' ? '⭐ ×3' : actual.tipo === 'reloj' ? '⏱ +4 s' : '';
    insignia.className = `frenesi__insignia frenesi__insignia--${actual.tipo}`;
  };
  const flash = (txt) => { aviso.textContent = txt; aviso.classList.remove('frenesi__aviso--ya'); void aviso.offsetWidth; aviso.classList.add('frenesi__aviso--ya'); };
  const cap = capturar(zona, {
    alChar: (ch) => {
      if (fin) return; t0 ??= performance.now();
      if (ch.toLowerCase() === actual.texto[buffer.length]) {
        buffer += actual.texto[buffer.length]; sonido.tecla();
        if (buffer === actual.texto) {
          const ganado = actual.texto.length * 10 * mult() * (actual.tipo === 'oro' ? 3 : 1);
          puntos += ganado; chars += actual.texto.length; combo++; sonido.acierto(); flash(`+${ganado}`);
          if (actual.tipo === 'reloj') resto += 4;
          dP.b.textContent = String(puntos); dC.b.textContent = `×${mult()}`;
          buffer = ''; actual = nueva();
        }
      } else { errores++; combo = 0; resto -= 1; dC.b.textContent = '×1'; sonido.error(); grande.classList.remove('jg__linea--mal'); void grande.offsetWidth; grande.classList.add('jg__linea--mal'); flash('−1 s'); }
      pintar();
    },
  });
  function cuadro(t) {
    if (fin) return;
    const dt = Math.min(0.05, (t - (prev || t)) / 1000); prev = t;
    if (t0) resto -= dt;
    dT.b.textContent = String(Math.max(0, Math.ceil(resto)));
    if (resto <= 0) { fin = true; sonido.fin(); return alFin({ puntos, chars, errores, duracionSeg: Math.max(3, Math.round((performance.now() - t0) / 1000)) }); }
    raf = requestAnimationFrame(cuadro);
  }
  pintar(); raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { fin = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

/* ═════════════ 8. Ninja de frutas (¡no escribas las bombas!) ═════════════ */
export function ninja({ zona, grado, vocab, alFin }) {
  const cortas = palabrasDeGrado(vocab, grado).filter((w) => w.length <= (grado <= 3 ? 4 : 6));
  const pal = cortas.length > 12 ? cortas : palabrasDeGrado(vocab, grado);
  const FRUTAS = ['🍉', '🍎', '🍌', '🍇', '🍓', '🍍', '🥝', '🍊'];
  const DUR = 60;
  let vidas = 3, puntos = 0, chars = 0, errores = 0, combo = 0, buffer = '', fin = false, raf = 0, ultimo = 0, prev = 0;
  const t0 = performance.now(), activos = [];
  const campo = h('div', { class: 'jg__campo jg__campo--ninja' });
  const linea = h('div', { class: 'jg__linea', 'aria-live': 'off' }, h('span', { class: 'jg__buffer' }), h('i', { class: 'jg__cursor' }));
  const buf = linea.querySelector('.jg__buffer');
  const dV = dato(tr('juego.vidas'), '❤️❤️❤️'), dP = dato(tr('juego.puntos')), dT = dato(tr('juego.tiempo'), String(DUR)), dC = dato(tr('juego.combo'), '×1');
  zona.append(hud(dV.nodo, dT.nodo, dP.nodo, dC.nodo), campo, linea);
  const mult = () => Math.min(5, 1 + Math.floor(combo / 4));
  const perder = () => { vidas--; combo = 0; dC.b.textContent = '×1'; dV.b.textContent = '❤️'.repeat(Math.max(0, vidas)) || '💔'; sonido.error(); };
  const quitar = (it, cls) => { it.el.classList.add(cls); setTimeout(() => it.el.remove(), 260); activos.splice(activos.indexOf(it), 1); };
  const cap = capturar(zona, {
    alChar: (ch) => {
      if (fin) return;
      const nuevo = buffer + ch.toLowerCase();
      const cand = activos.filter((w) => w.texto.startsWith(nuevo));
      if (!cand.length) { errores++; combo = 0; dC.b.textContent = '×1'; sonido.error(); linea.classList.remove('jg__linea--mal'); void linea.offsetWidth; linea.classList.add('jg__linea--mal'); return; }
      buffer = nuevo; sonido.tecla(); buf.textContent = buffer;
      activos.forEach((w) => w.el.classList.toggle('ninja__item--sel', w.texto.startsWith(buffer)));
      const exacta = activos.find((w) => w.texto === buffer);
      if (!exacta) return;
      buffer = ''; buf.textContent = ''; activos.forEach((w) => w.el.classList.remove('ninja__item--sel'));
      if (exacta.bomba) { quitar(exacta, 'ninja__item--boom'); perder(); if (vidas <= 0) terminar(); return; }   // ¡era una bomba!
      chars += exacta.texto.length; combo++; puntos += exacta.texto.length * 10 * mult(); sonido.acierto();
      quitar(exacta, 'ninja__item--corte'); dP.b.textContent = String(puntos); dC.b.textContent = `×${mult()}`;
    },
    alBorrar: () => { buffer = buffer.slice(0, -1); buf.textContent = buffer; activos.forEach((w) => w.el.classList.toggle('ninja__item--sel', Boolean(buffer) && w.texto.startsWith(buffer))); },
  });
  function terminar() {
    if (fin) return; fin = true; cancelAnimationFrame(raf);
    const sobrevive = vidas > 0; sobrevive ? sonido.fin() : sonido.perder();
    alFin({ puntos: puntos + (sobrevive && chars > 0 ? vidas * 50 : 0), chars, errores, duracionSeg: Math.max(3, Math.round((performance.now() - t0) / 1000)) });
  }
  function cuadro(t) {
    if (fin) return;
    prev = t; const seg = (t - t0) / 1000; dT.b.textContent = String(Math.max(0, Math.ceil(DUR - seg)));
    if (t - ultimo > Math.max(750, 1700 - seg * 14) && activos.length < 6) {
      ultimo = t;
      const bomba = seg > 5 && azar() < 0.22;
      let texto = rnd(pal), intentos = 0; while (activos.some((w) => w.texto[0] === texto[0]) && intentos++ < 8) texto = rnd(pal);   // primeras letras distintas: no se confunden
      const el = h('div', { class: `ninja__item ${bomba ? 'ninja__item--bomba' : ''}` }, h('span', { class: 'ninja__emoji' }, bomba ? '💣' : rnd(FRUTAS)), h('b', { class: 'ninja__palabra' }, texto));
      campo.append(el);
      activos.push({ texto, bomba, el, x: 8 + azar() * 70, dx: (azar() - 0.5) * 30, nace: t, dura: Math.max(2300, 3600 - seg * 25) });
    }
    for (const w of [...activos]) {
      const f = (t - w.nace) / w.dura;
      if (f >= 1) { quitar(w, 'ninja__item--cae'); if (!w.bomba) { perder(); buffer = ''; buf.textContent = ''; if (vidas <= 0) return terminar(); } continue; }
      w.el.style.left = `${w.x + (f - 0.5) * w.dx}%`; w.el.style.bottom = `${4 * f * (1 - f) * 62 + 2}%`;
    }
    if (seg >= DUR) return terminar();
    raf = requestAnimationFrame(cuadro);
  }
  raf = requestAnimationFrame(cuadro); cap.enfocar();
  return { destruir() { fin = true; cancelAnimationFrame(raf); cap.destruir(); } };
}

export const JUEGOS = [
  { id: 'carrera', get nombre() { return tr('juego.carrera.nombre'); }, icono: 'rocket', color: ['#8A70FA', '#4F6BFF'], get texto() { return tr('juego.carrera.texto'); }, crear: carrera },
  { id: 'lluvia', get nombre() { return tr('juego.lluvia.nombre'); }, icono: 'sparkle', color: ['#4FB6FF', '#1E78C8'], get texto() { return tr('juego.lluvia.texto'); }, crear: lluvia },
  { id: 'rescate', get nombre() { return tr('juego.rescate.nombre'); }, icono: 'heart', color: ['#FF8A7A', '#E84F3F'], get texto() { return tr('juego.rescate.texto'); }, crear: rescate },
  { id: 'blanco', get nombre() { return tr('juego.blanco.nombre'); }, icono: 'target', color: ['#3DDBB0', '#0B8F6D'], get texto() { return tr('juego.blanco.texto'); }, crear: blanco },
  { id: 'duelo', get nombre() { return tr('juego.duelo.nombre'); }, icono: 'clock', color: ['#FFD04A', '#E39A00'], get texto() { return tr('juego.duelo.texto'); }, crear: duelo },
  { id: 'jefe', get nombre() { return tr('juego.jefe.nombre'); }, icono: 'shield', color: ['#C026D3', '#7C3AED'], get texto() { return tr('juego.jefe.texto'); }, crear: jefe },
  { id: 'frenesi', get nombre() { return tr('juego.frenesi.nombre'); }, icono: 'flame', color: ['#FF9F1C', '#F15A24'], get texto() { return tr('juego.frenesi.texto'); }, crear: frenesi },
  { id: 'ninja', get nombre() { return tr('juego.ninja.nombre'); }, icono: 'star', color: ['#22C55E', '#15803D'], get texto() { return tr('juego.ninja.texto'); }, crear: ninja },
];
