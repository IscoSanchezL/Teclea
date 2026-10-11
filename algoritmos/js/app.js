/* Beto y los Algoritmos · interfaz. Sin dependencias: HTML + CSS 3D + JavaScript. */
(function () {
  'use strict';
  const C = window.AlgoCore;
  const $app = document.getElementById('app');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const AVATARES = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦁', '🐰', '🐵', '🐧', '🐶', '🐱'];
  const ALABANZAS = ['¡Lo lograste!', '¡Genial!', '¡Eres un gran programador!', '¡Wow, qué bien!', '¡Excelente trabajo!', '¡Fantástico!'];

  /* ================= Almacenamiento (a prueba de fallos) ================= */
  const LS = {
    get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const K_PERFILES = 'beto_perfiles_v1', K_ACTUAL = 'beto_actual_v1', K_CFG = 'beto_cfg_v1';
  let perfiles = LS.get(K_PERFILES, {});
  let cfg = Object.assign({ silencio: false, vozURI: '', ritmo: 0.92 }, LS.get(K_CFG, {}));
  let actual = null; // clave del perfil activo

  const clave = (n) => n.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
  const guardar = () => LS.set(K_PERFILES, perfiles);
  const perfil = () => perfiles[actual];
  const totalEstrellas = (p) => Object.values(p.done).reduce((a, b) => a + b, 0);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ================= Voz (menos robótica) ================= */
  const Voz = {
    voces: [],
    cargar() { try { this.voces = (speechSynthesis.getVoices() || []).filter((v) => /^es/i.test(v.lang)); } catch (e) { this.voces = []; } },
    puntaje(v) {
      const n = v.name.toLowerCase(); let s = 0;
      if (/natural|neural|online/.test(n)) s += 6;
      if (/google/.test(n)) s += 3;
      if (/paulina|m[oó]nica|sabina|helena|laura|luc[ií]a|marisol|dalia|elvira|paloma|catalina|camila|salome|valentina|female|mujer/.test(n)) s += 3;
      if (/es[-_]mx/i.test(v.lang)) s += 3; else if (/es[-_](us|419|co|ar)/i.test(v.lang)) s += 2; else if (/es[-_]es/i.test(v.lang)) s += 1;
      if (!v.localService) s += 1;
      if (/jorge|diego|pablo|enrique|raul|carlos|male/.test(n)) s -= 4;
      return s;
    },
    mejor() {
      if (cfg.vozURI) { const v = this.voces.find((x) => x.voiceURI === cfg.vozURI); if (v) return v; }
      return [...this.voces].sort((a, b) => this.puntaje(b) - this.puntaje(a))[0] || null;
    },
    token: 0,
    parar() { this.token++; try { speechSynthesis.cancel(); } catch (e) { /* sin voz */ } },
    limpiar(t) { return String(t).replace(/\p{Extended_Pictographic}|️/gu, '').replace(/\s+/g, ' ').trim(); },
    /* Devuelve una promesa que se cumple cuando termina de hablar (o tras un tiempo prudente). */
    decir(texto) {
      const tk = ++this.token;
      const limpio = this.limpiar(texto);
      const espera = Math.max(900, limpio.length * 75);
      if (cfg.silencio || !limpio || !('speechSynthesis' in window)) return sleep(Math.min(espera, 1800));
      return new Promise((resolve) => {
        let fin = false;
        const listo = () => { if (!fin) { fin = true; resolve(); } };
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(limpio);
          const v = this.mejor();
          u.lang = v ? v.lang : 'es-MX'; if (v) u.voice = v;
          u.rate = cfg.ritmo; u.pitch = 1.12; u.volume = 1;
          u.onend = listo; u.onerror = listo;
          setTimeout(() => speechSynthesis.speak(u), 40);
          setTimeout(listo, espera + 4000);
        } catch (e) { setTimeout(listo, espera); }
        const vigila = setInterval(() => { if (fin || tk !== this.token) { clearInterval(vigila); listo(); } }, 200);
      });
    }
  };
  try { Voz.cargar(); if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => Voz.cargar(); } catch (e) { /* sin voz */ }
  const decir = (t) => Voz.decir(t.replace(/\{n\}/g, perfil() ? perfil().name : ''));

  /* ================= Sonidos (WebAudio) ================= */
  let audio;
  function tono(f, dur, tipo, vol, retraso) {
    if (cfg.silencio) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime + (retraso || 0), o = audio.createOscillator(), g = audio.createGain();
      o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* sin audio */ }
  }
  const Sfx = {
    clic() { tono(620, 0.08, 'triangle'); },
    paso() { tono(300, 0.07, 'square', 0.06); },
    giro() { tono(480, 0.1, 'triangle'); tono(620, 0.1, 'triangle', 0.12, 0.08); },
    estrella() { tono(880, 0.12, 'sine'); tono(1320, 0.25, 'sine', 0.15, 0.1); },
    mal() { tono(220, 0.2, 'sawtooth', 0.08); tono(150, 0.3, 'sawtooth', 0.08, 0.15); },
    bien() { tono(660, 0.12, 'triangle'); tono(880, 0.2, 'triangle', 0.15, 0.1); },
    gana() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tono(f, 0.22, 'triangle', 0.16, i * 0.12)); }
  };

  /* ================= Confeti ================= */
  const lienzo = document.getElementById('confeti'); const ctx = lienzo.getContext('2d'); let parts = [], anim = 0;
  function confeti() {
    lienzo.width = innerWidth; lienzo.height = innerHeight;
    const cols = ['#ff5d8f', '#ffd23f', '#2ecc71', '#4cc9f0', '#5b3df5', '#ff9f1c'];
    parts = Array.from({ length: 150 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * 0.45, vx: (Math.random() - .5) * 18, vy: -Math.random() * 18 - 5, w: 8 + Math.random() * 10, h: 5 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[(Math.random() * cols.length) | 0] }));
    cancelAnimationFrame(anim);
    let n = 0;
    (function paso() {
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      parts.forEach((p) => { p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 2)); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
      if (++n < 200) anim = requestAnimationFrame(paso); else ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    })();
  }

  /* ================= Cubos 3D con CSS ================= */
  const BRILLO = { top: 1, fr: .88, bk: .8, dr: .78, iz: .62 };
  function cubo(w, d, h, o) {
    o = o || {};
    const e = document.createElement('div'); e.className = 'cubo ' + (o.cls || '');
    e.style.cssText = `width:${w}px;height:${d}px;left:${o.x || 0}px;top:${o.y || 0}px;transform:translateZ(${o.z || 0}px)`;
    const geo = {
      top: `width:${w}px;height:${d}px;transform:translateZ(${h}px)`,
      fr: `width:${w}px;height:${h}px;top:${d}px`, bk: `width:${w}px;height:${h}px;top:0`,
      dr: `width:${h}px;height:${d}px;left:${w}px`, iz: `width:${h}px;height:${d}px;left:0`
    };
    Object.keys(geo).forEach((k) => {
      const f = document.createElement('div'); f.className = 'f ' + k;
      f.style.cssText = geo[k] + `;background:${(o.caras && o.caras[k]) || o.color || '#ccc'};filter:brightness(${BRILLO[k]})`;
      if (o.html && o.html[k]) f.innerHTML = o.html[k];
      e.appendChild(f);
    });
    return e;
  }

  /* Beto: robot hecho con cubos. T = tamaño de una baldosa. Devuelve el grupo (origen en el centro). */
  function robot(T) {
    const g = document.createElement('div'); g.className = 'gira';
    const s = (v) => v * T;
    const ojos = `<i class="ojo" style="position:absolute;left:52%;top:14%;width:${s(.13)}px;height:${s(.13)}px"></i><i class="ojo" style="position:absolute;left:52%;top:60%;width:${s(.13)}px;height:${s(.13)}px"></i>`;
    const panel = `<i style="width:55%;height:55%;border-radius:20%;background:#ff5d8f;box-shadow:inset 0 0 0 3px #fff"></i>`;
    g.append(
      cubo(s(.34), s(.40), s(.07), { x: s(-.17), y: s(-.20), z: 0, color: '#3d3d5c' }),
      cubo(s(.34), s(.40), s(.30), { x: s(-.17), y: s(-.20), z: s(.07), color: '#4cc9f0', html: { dr: panel } }),
      cubo(s(.09), s(.10), s(.22), { x: s(-.045), y: s(-.31), z: s(.12), color: '#3a86ff' }),
      cubo(s(.09), s(.10), s(.22), { x: s(-.045), y: s(.21), z: s(.12), color: '#3a86ff' }),
      cubo(s(.36), s(.40), s(.26), { x: s(-.18), y: s(-.20), z: s(.37), color: '#f8f9ff', html: { dr: ojos } }),
      cubo(s(.04), s(.04), s(.14), { x: s(-.02), y: s(-.02), z: s(.63), color: '#555' }),
      cubo(s(.10), s(.10), s(.10), { x: s(-.05), y: s(-.05), z: s(.77), color: '#ff5d8f' })
    );
    return g;
  }

  function betoPose(T) {
    const caja = document.createElement('div'); caja.className = 'escena3d';
    caja.style.cssText = `width:${T * 1.7}px;height:${T * 1.9}px;position:relative`;
    const rot = document.createElement('div');
    rot.style.cssText = 'position:absolute;left:50%;top:62%;width:0;height:0;transform-style:preserve-3d;animation:pose 6s ease-in-out infinite';
    rot.appendChild(robot(T)); caja.appendChild(rot);
    return caja;
  }
  const estiloPose = document.createElement('style');
  estiloPose.textContent = '@keyframes pose{0%,100%{transform:rotateX(68deg) rotateZ(62deg)}50%{transform:rotateX(68deg) rotateZ(118deg)}}';
  document.head.appendChild(estiloPose);

  /* ================= Fondo con formas 3D flotantes ================= */
  (function fondo() {
    const cont = document.getElementById('flotantes'); const cols = ['#ff5d8f', '#ffd23f', '#9b5de5', '#2ecc71', '#4cc9f0', '#ff9f1c'];
    for (let i = 0; i < 9; i++) {
      const tam = 26 + Math.random() * 40, w = document.createElement('div');
      w.className = 'flota';
      w.style.cssText = `left:${Math.random() * 96}%;top:${8 + Math.random() * 60}%;width:0;height:0;animation-duration:${14 + Math.random() * 16}s;animation-delay:${-Math.random() * 20}s`;
      w.appendChild(cubo(tam, tam, tam, { x: -tam / 2, y: -tam / 2, z: -tam / 2, color: cols[i % cols.length] }));
      cont.appendChild(w);
    }
  })();

  /* ================= Utilidades de UI ================= */
  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function mostrar(el) { Voz.parar(); sesion++; $app.replaceChildren(el); el.classList.add('pantalla'); window.scrollTo({ top: 0 }); }
  let sesion = 0; // se incrementa al cambiar de pantalla para cancelar animaciones pendientes
  const ICON = {
    F: '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path d="M12 2l9 10h-6v10H9V12H3z" fill="currentColor"/></svg>',
    R: '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path d="M4 21v-7a6 6 0 0 1 6-6h6V3l6 6-6 6v-4h-6a2 2 0 0 0-2 2v8z" fill="currentColor" transform="translate(-2 0)"/></svg>',
    L: '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" style="transform:scaleX(-1)"><path d="M4 21v-7a6 6 0 0 1 6-6h6V3l6 6-6 6v-4h-6a2 2 0 0 0-2 2v8z" fill="currentColor" transform="translate(-2 0)"/></svg>'
  };
  const NOMBRE_C = { F: 'Avanzar', L: 'Izquierda', R: 'Derecha' };
  const CAMINA = { F: 'avanzar', L: 'girar a la izquierda', R: 'girar a la derecha' };

  /* ================= Bienvenida ================= */
  function pantallaBienvenida() {
    let avatar = AVATARES[(Math.random() * AVATARES.length) | 0];
    const el = h(`<section class="bienvenida">
      <h1 class="titulo">Beto y los<br>Algoritmos</h1>
      <p class="sub">¡Aprende a dar instrucciones como un programador!</p>
      <div id="pose"></div>
      <form class="formulario" id="frm" autocomplete="off">
        <label for="nombre" class="sub">¿Cómo te llamas?</label>
        <input id="nombre" class="campo" maxlength="24" placeholder="Escribe tu nombre" autocapitalize="words" spellcheck="false" required>
        <p class="aviso">Tip: nombre + inicial del apellido (ej. “Ana R”) para no confundirnos.</p>
        <div class="avatares" role="group" aria-label="Elige tu amigo"></div>
        <button class="btn verde pulsa" type="submit">¡Empezar! 🚀</button>
      </form>
      <div id="recientes" class="recientes" aria-label="Niños que ya jugaron aquí"></div>
    </section>`);
    el.querySelector('#pose').appendChild(betoPose(110));
    const av = el.querySelector('.avatares');
    function pintaAvatares() {
      av.replaceChildren(...AVATARES.map((a) => { const b = h(`<button type="button" class="avatar" aria-label="Amigo ${a}" aria-pressed="${a === avatar}">${a}</button>`); b.onclick = () => { avatar = a; Sfx.clic(); pintaAvatares(); }; return b; }));
    }
    pintaAvatares();
    const lista = Object.entries(perfiles).sort((a, b) => b[1].last - a[1].last).slice(0, 24);
    const rec = el.querySelector('#recientes');
    if (lista.length) {
      rec.appendChild(h('<p class="sub" style="width:100%">¿Ya jugaste? ¡Toca tu nombre!</p>'));
      lista.forEach(([k, p]) => { const b = h(`<button class="chip" type="button">${esc(p.avatar)} ${esc(p.name)} · ⭐${totalEstrellas(p)}</button>`); b.onclick = () => entrar(p.name, p.avatar); rec.appendChild(b); });
    }
    el.querySelector('#frm').onsubmit = (e) => { e.preventDefault(); const n = el.querySelector('#nombre').value.trim(); if (n) entrar(n, avatar); };
    mostrar(el);
    document.getElementById('barra').hidden = true;
  }

  function entrar(nombre, avatar) {
    const k = clave(nombre); Sfx.clic();
    const existia = !!perfiles[k];
    if (!existia) perfiles[k] = { name: nombre.replace(/\s+/g, ' ').trim(), avatar, done: {}, created: Date.now(), last: Date.now(), libre: false };
    else if (avatar) perfiles[k].avatar = perfiles[k].avatar || avatar;
    perfiles[k].last = Date.now(); actual = k; guardar(); LS.set(K_ACTUAL, k);
    document.getElementById('barra').hidden = false;
    pintaBarra();
    pantallaMapa(existia ? 'vuelta' : 'nuevo');
  }

  function pintaBarra() {
    const p = perfil(); if (!p) return;
    document.getElementById('jugador').innerHTML = `<span class="av">${esc(p.avatar)}</span><span>${esc(p.name)}</span>`;
    document.getElementById('totalEstrellas').textContent = '⭐ ' + totalEstrellas(p);
    document.getElementById('btnSonido').textContent = cfg.silencio ? '🔇' : '🔊';
  }

  /* ================= Mapa ================= */
  const desbloqueado = (i) => i === 0 || perfil().libre || C.NIVELES[i - 1].id in perfil().done;
  const siguienteIdx = () => { const i = C.NIVELES.findIndex((n) => !(n.id in perfil().done)); return i < 0 ? 0 : i; };
  const iconoNivel = (n) => n.tipo === 'leccion' ? '📖' : n.tipo === 'orden' ? n.pasos[0][0] : n.id === 't12' ? '🏆' : n.id === 't3' || n.id === 't6' || n.id === 't10' || n.id === 't11' ? '⭐' : '🤖';

  function pantallaMapa(modo) {
    const p = perfil(); const sig = siguienteIdx();
    const terminado = C.NIVELES.every((n) => n.id in p.done);
    const frase = modo === 'nuevo' ? `¡Hola, ${p.name}! Soy Beto. Toca el camino que brilla para empezar.`
      : modo === 'vuelta' ? `¡Qué bueno verte otra vez, ${p.name}! Seguimos donde te quedaste.`
      : terminado ? `¡${p.name}, completaste todo! Eres un gran programador. Puedes repetir los niveles.` : `${p.name}, elige el camino que brilla.`;
    const el = h(`<section>
      <div class="mapa-cab"><div id="poseMapa"></div><div class="burbuja">${esc(frase)}</div>
        <button class="btn verde pulsa" id="seguir">${terminado ? '¡Jugar de nuevo!' : 'Continuar ▶'}</button></div>
      <div id="mundos"></div></section>`);
    el.querySelector('#poseMapa').appendChild(betoPose(70));
    const cont = el.querySelector('#mundos');
    C.MUNDOS.forEach((m) => {
      const w = h(`<div class="mundo"><h2 style="background:${m.color}">${m.emoji} Mundo ${m.n}: ${esc(m.nombre)}</h2><div class="camino"></div></div>`);
      C.NIVELES.forEach((n, i) => {
        if (n.mundo !== m.n) return;
        const ok = desbloqueado(i), es = p.done[n.id] || 0;
        const b = h(`<button class="nodo ${n.id in p.done ? 'hecho' : ''} ${i === sig && !terminado ? 'actual' : ''}" ${ok ? '' : 'disabled'} aria-label="${esc(n.titulo)}${ok ? '' : ', bloqueado'}">
          ${ok ? '' : '<span class="candado">🔒</span>'}<span class="ic">${iconoNivel(n)}</span><span>${esc(n.titulo)}</span>
          <span class="es">${'⭐'.repeat(es)}${'☆'.repeat(n.tipo === 'leccion' ? 0 : 3 - es)}</span></button>`);
        b.onclick = () => abrirNivel(i);
        w.querySelector('.camino').appendChild(b);
      });
      cont.appendChild(w);
    });
    el.querySelector('#seguir').onclick = () => abrirNivel(terminado ? 0 : sig);
    mostrar(el); pintaBarra();
    decir(frase);
  }

  function abrirNivel(i) {
    Sfx.clic(); const n = C.NIVELES[i];
    if (n.tipo === 'leccion') pantallaLeccion(i);
    else if (n.tipo === 'orden') pantallaOrden(i);
    else pantallaTablero(i);
  }

  /* ================= Premio ================= */
  function guardarResultado(nivel, est) {
    const p = perfil(); p.done[nivel.id] = Math.max(p.done[nivel.id] || 0, est); p.last = Date.now(); guardar(); pintaBarra();
  }
  function premio(i, est, extra) {
    const nivel = C.NIVELES[i]; const hay = i + 1 < C.NIVELES.length; const alabanza = ALABANZAS[(Math.random() * ALABANZAS.length) | 0];
    const caja = h(`<div class="premio-fondo"><div class="premio" role="dialog" aria-label="Nivel completado">
      <h2>${alabanza.replace('!', ', ' + esc(perfil().name) + '!')}</h2>
      <div class="estrellas-gr" aria-label="${est} estrellas"><span>⭐</span><span>⭐</span><span>⭐</span></div>
      <p style="margin:0;font-weight:600">${esc(extra || '')}</p>
      <div class="acciones">${hay ? '<button class="btn verde pulsa" data-a="sig">Siguiente ▶</button>' : ''}
      <button class="btn amarillo" data-a="rep">Otra vez 🔁</button><button class="btn" data-a="mapa">Mapa 🗺️</button></div></div></div>`);
    document.body.appendChild(caja); confeti(); Sfx.gana();
    caja.querySelectorAll('.estrellas-gr span').forEach((s, k) => { if (k < est) setTimeout(() => { s.classList.add('on'); Sfx.estrella(); }, 400 + k * 450); });
    decir(alabanza.replace('!', ', {n}!') + (est === 3 ? ' ¡Tres estrellas!' : ''));
    caja.onclick = (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      caja.remove(); Sfx.clic();
      if (a.dataset.a === 'sig') abrirNivel(i + 1); else if (a.dataset.a === 'rep') abrirNivel(i); else pantallaMapa();
    };
  }

  /* ================= Lección: ¿Qué es un algoritmo? ================= */
  const DIAPOS = [
    { titulo: '¡Hola, {n}!', grande: '👋', partes: [{ t: '¡Hola, {n}! Yo soy Beto, el robot. Hoy te voy a enseñar un secreto de los robots y de las computadoras.' }] },
    { titulo: '¿Qué es un algoritmo?', pasos: [['🥣', 'Mezclar'], ['🔥', 'Hornear'], ['🎂', '¡Pastel!']],
      partes: [{ t: 'Un algoritmo es una lista de pasos, uno después de otro, para hacer algo.' }, { t: 'Es como una receta de cocina. Primero mezclamos.', ver: 0 }, { t: 'Después horneamos.', ver: 1 }, { t: '¡Y al final tenemos un pastel!', ver: 2 }] },
    { titulo: 'Lavarse los dientes', pasos: [['🪥', 'Tomar el cepillo'], ['🧴', 'Poner la pasta'], ['😁', 'Cepillar'], ['💦', 'Enjuagar']],
      partes: [{ t: 'Tú ya usas algoritmos todos los días. Mira, para lavarte los dientes:' }, { t: 'Primero, tomas el cepillo.', ver: 0 }, { t: 'Luego, pones la pasta.', ver: 1 }, { t: 'Después, cepillas los dientes.', ver: 2 }, { t: 'Y al final, enjuagas tu boca.', ver: 3 }] },
    { titulo: '¡El orden importa!', pasos: [['👟', 'Zapatos'], ['🧦', 'Medias']], loco: true, extra: [['🧦', 'Medias'], ['👟', 'Zapatos']],
      partes: [{ t: '¿Y si primero te pones los zapatos y luego las medias?' }, { t: '¡Qué risa! Eso no funciona.', ver: [0, 1] }, { t: 'Primero las medias, y después los zapatos. Los pasos deben ir en el orden correcto.', ver: [2, 3] }] },
    { titulo: 'Los robots obedecen', iconos: ['F', 'R', 'L'],
      partes: [{ t: 'Los robots hacen exactamente lo que les dices, paso por paso.' }, { t: 'Yo puedo avanzar, girar a la derecha y girar a la izquierda.', ver: [0, 1, 2] }, { t: 'Tú serás el programador, y yo te haré caso. ¡Vamos a jugar!' }] }
  ];

  function pantallaLeccion(idx) {
    let k = 0;
    const el = h(`<section class="leccion tarjeta">
      <div class="beto-lado" id="lado"></div>
      <div><div class="diapo" id="diapo"></div>
      <div class="nav"><button class="btn" id="ant">◀</button><div class="puntos" id="puntos"></div>
      <button class="btn amarillo" id="oir" aria-label="Escuchar otra vez">🔊</button><button class="btn verde pulsa" id="sig">▶</button></div></div></section>`);
    el.querySelector('#lado').appendChild(betoPose(140));
    const diapo = el.querySelector('#diapo');
    async function pinta() {
      const ses = sesion; const d = DIAPOS[k]; const yo = ++pinta.n;
      el.querySelector('#puntos').innerHTML = DIAPOS.map((_, j) => `<i class="${j === k ? 'on' : ''}"></i>`).join('');
      el.querySelector('#ant').style.visibility = k ? 'visible' : 'hidden';
      const nombre = perfil().name;
      let esc3d = '';
      if (d.grande) esc3d = `<div class="escenario" style="font-size:6rem">${d.grande}</div>`;
      else if (d.iconos) esc3d = `<div class="escenario">${d.iconos.map((c) => `<div class="paso"><span class="em" style="color:${c === 'F' ? '#2ecc71' : c === 'R' ? '#4cc9f0' : '#ff9f1c'}">${ICON[c]}</span><span>${NOMBRE_C[c]}</span></div>`).join('')}</div>`;
      else {
        const todos = d.pasos.concat(d.extra || []);
        esc3d = `<div class="escenario">${todos.map((s, j) => `<div class="paso ${d.loco && j < 2 ? 'loco' : ''}">${d.loco ? '' : `<span class="num">${j + 1}</span>`}<span class="em">${s[0]}</span><span>${s[1]}</span></div>`).join('')}</div>`;
      }
      diapo.innerHTML = `<h2>${esc(d.titulo.replace('{n}', nombre))}</h2>${esc3d}<p></p>`;
      const pasos = diapo.querySelectorAll('.paso');
      for (const parte of d.partes) {
        if (yo !== pinta.n || ses !== sesion) return;
        diapo.querySelector('p').textContent = parte.t.replace('{n}', nombre);
        [].concat(parte.ver === undefined ? [] : parte.ver).forEach((j) => pasos[j] && pasos[j].classList.add('ver'));
        if (parte.ver !== undefined) Sfx.bien();
        await decir(parte.t);
        await sleep(250);
      }
      if (!d.pasos && !d.iconos) return;
      pasos.forEach((p) => p.classList.add('ver'));
    }
    pinta.n = 0;
    // Mostrar pasos de golpe en las diapositivas sin narración paso a paso se hace dentro de pinta().
    el.querySelector('#sig').onclick = () => {
      Sfx.clic();
      if (k < DIAPOS.length - 1) { k++; pinta(); } else { guardarResultado(C.NIVELES[idx], 3); pantallaMapa(); }
    };
    el.querySelector('#ant').onclick = () => { Sfx.clic(); if (k) { k--; pinta(); } };
    el.querySelector('#oir').onclick = () => { Sfx.clic(); pinta(); };
    mostrar(el); pinta();
  }

  /* ================= Ordenar los pasos ================= */
  function pantallaOrden(idx) {
    const nivel = C.NIVELES[idx]; const pasos = nivel.pasos.map((p, j) => ({ e: p[0], t: p[1], j }));
    let mezcla; do { mezcla = pasos.slice().sort(() => Math.random() - .5); } while (mezcla.every((p, j) => p.j === j));
    let sig = 0, fallos = 0, listo = false;
    const el = h(`<section class="orden tarjeta"><h2>${esc(nivel.titulo)}</h2>
      <div class="acciones"><button class="btn amarillo" id="oir">🔊 Escuchar</button></div>
      <div class="ranuras" id="ranuras"></div><div class="banco" id="banco"></div></section>`);
    const rs = el.querySelector('#ranuras'), bn = el.querySelector('#banco');
    pasos.forEach((_, j) => rs.appendChild(h(`<div class="ranura" aria-label="Paso ${j + 1}">${j + 1}</div>`)));
    mezcla.forEach((p) => {
      const f = h(`<button class="ficha" style="--r:${(Math.random() * 8 - 4).toFixed(1)}deg"><span class="em">${p.e}</span><span>${esc(p.t)}</span></button>`);
      f.onclick = async () => {
        if (listo) return;
        if (p.j === sig) {
          Sfx.bien(); f.classList.add('usada');
          rs.children[sig].replaceChildren(h(`<div class="paso"><span class="num">${sig + 1}</span><span class="em">${p.e}</span><span>${esc(p.t)}</span></div>`));
          sig++;
          if (sig === pasos.length) {
            listo = true; const ses = sesion; const est = fallos === 0 ? 3 : fallos <= 2 ? 2 : 1;
            guardarResultado(nivel, est);
            await decir('¡Muy bien! ' + pasos.map((s, q) => (q === 0 ? 'Primero, ' : q === pasos.length - 1 ? 'Al final, ' : 'Luego, ') + s.t.toLowerCase().replace(/[¡!]/g, '')).join('. '));
            if (ses === sesion) premio(idx, est, 'Ordenaste todos los pasos. ¡Eso es un algoritmo!');
          } else decir(['¡Eso!', '¡Muy bien!', '¡Sí!'][sig % 3]);
        } else {
          fallos++; Sfx.mal(); f.classList.remove('malo'); void f.offsetWidth; f.classList.add('malo');
          decir(sig === 0 ? 'Mmm, ese no va primero. ¿Qué se hace al empezar?' : 'Ese todavía no. ¿Qué sigue después?');
        }
      };
      bn.appendChild(f);
    });
    el.querySelector('#oir').onclick = () => { Sfx.clic(); decir(nivel.voz); };
    mostrar(el); decir(nivel.voz);
  }

  /* ================= Tablero de Beto (3D) ================= */
  function pantallaTablero(idx) {
    const nivel = C.NIVELES[idx];
    let programa = [], pendienteRep = 0, corriendo = false;
    const el = h(`<section class="juego">
      <div class="juego-cab"><h2>${esc(nivel.titulo)}</h2><button class="btn amarillo" id="oir">🔊</button><button class="btn rosa" id="pista">💡 Pista</button><span class="total-estrellas" id="cuenta"></span></div>
      <div class="vista" id="vista"></div>
      <div class="mensaje" id="msg">Toca los botones para dar instrucciones a Beto.</div>
      <div class="programa" id="prog" aria-label="Programa de Beto"></div>
      <div class="paleta" id="pal"></div>
      <div class="acciones"><button class="btn verde pulsa" id="correr">▶ ¡Ir!</button><button class="btn amarillo" id="atras">↩ Quitar</button><button class="btn rosa" id="borrar">🗑 Borrar todo</button></div>
    </section>`);
    const msg = el.querySelector('#msg'), prog = el.querySelector('#prog'), vista = el.querySelector('#vista');
    mostrar(el);

    /* --- escena --- */
    const w = vista.clientWidth || 600, hh = vista.clientHeight || 300;
    const T = Math.max(34, Math.min(92, (w / (nivel.w * .79 + nivel.h * .62)) * .9, (hh / ((nivel.w * .62 + nivel.h * .79) * .83)) * .92));
    const A = T * .2;
    const mundo = document.createElement('div'); mundo.className = 'mundo3d';
    mundo.style.cssText = `width:${nivel.w * T}px;height:${nivel.h * T}px`;
    mundo.appendChild(cubo(nivel.w * T + 18, nivel.h * T + 18, A * .9, { x: -9, y: -9, z: -A * .9, color: '#5a8f3a' }));
    for (let y = 0; y < nivel.h; y++) for (let x = 0; x < nivel.w; x++) {
      const meta = x === nivel.goal.x && y === nivel.goal.y;
      const c = cubo(T - 3, T - 3, A, { x: x * T + 1.5, y: y * T + 1.5, z: 0, cls: 'baldosa' + (meta ? ' meta-tile' : ''), color: (x + y) % 2 ? '#7fd34d' : '#9be564', caras: { fr: '#a06a37', bk: '#a06a37', dr: '#7a4a22', iz: '#7a4a22' } });
      if (meta) c.querySelector('.f.top').style.background = 'repeating-conic-gradient(#fff 0 25%,#333 0 50%) 0 0/50% 50%';
      mundo.appendChild(c);
    }
    const sprite = (x, y, z) => { const s = document.createElement('div'); s.className = 'sprite'; s.style.cssText = `left:${(x + .5) * T}px;top:${(y + .5) * T}px;width:0;height:0;transform:translateZ(${z}px)`; return s; };
    const vertical = (em, tam, cls) => { const v = document.createElement('div'); v.className = 'vertical'; v.innerHTML = `<span class="em ${cls || ''}" style="font-size:${tam}px">${em}</span>`; return v; };
    const bandera = sprite(nivel.goal.x, nivel.goal.y, A); bandera.appendChild(vertical('🚩', T * .9, 'estrella')); mundo.appendChild(bandera);
    const estrellas = {};
    nivel.stars.forEach((s) => { const sp = sprite(s.x, s.y, A + T * .12); sp.appendChild(vertical('⭐', T * .62, 'estrella')); estrellas[s.x + ',' + s.y] = sp; mundo.appendChild(sp); });
    nivel.walls.forEach((p) => { const r = cubo(T * .7, T * .7, T * .5, { x: (p.x + .15) * T, y: (p.y + .15) * T, z: A, color: '#8d99ae' }); mundo.appendChild(r); const m = sprite(p.x, p.y, A + T * .5); m.appendChild(vertical('🪨', T * .5, 'roca')); mundo.appendChild(m); });

    const beto = sprite(nivel.start.x, nivel.start.y, A); beto.classList.add('beto');
    beto.style.transition = 'left .5s ease-in-out, top .5s ease-in-out';
    const reb = document.createElement('div'); reb.className = 'rebote'; reb.style.setProperty('--sx', T * .3 + 'px');
    const gira = robot(T); let ang = (nivel.start.d - 1) * 90; gira.style.transform = `rotateZ(${ang}deg)`;
    reb.appendChild(gira); beto.appendChild(reb); mundo.appendChild(beto); vista.appendChild(mundo);

    /* --- paleta y programa --- */
    const pal = el.querySelector('#pal');
    nivel.allowed.forEach((c) => {
      const b = h(`<button class="pal-btn ${c}" aria-label="${NOMBRE_C[c]}">${ICON[c]}<span>${NOMBRE_C[c]}</span></button>`);
      b.onclick = () => agrega(c); pal.appendChild(b);
    });
    if (nivel.rep) {
      const grupo = h('<div class="paleta" style="gap:8px;padding:6px 10px;background:rgba(255,255,255,.6);border-radius:20px"><b>🔁 Repetir:</b></div>');
      [2, 3, 4, 5, 6].forEach((n) => {
        const b = h(`<button class="pal-btn rep" aria-pressed="false" style="min-width:58px;height:58px;font-size:1.5rem" aria-label="Repetir ${n} veces">${n}</button>`);
        b.onclick = () => { Sfx.clic(); pendienteRep = pendienteRep === n ? 0 : n; grupo.querySelectorAll('.rep').forEach((x) => x.setAttribute('aria-pressed', String(+x.textContent === pendienteRep))); if (pendienteRep) { msg.textContent = `Repetir ${n} veces… ¿qué quieres repetir?`; decir(`Repetir ${n} veces. Ahora elige qué repetir.`); } };
        grupo.appendChild(b);
      });
      pal.appendChild(grupo);
    }
    function cuenta() { const q = nivel.stars.length; const rec = Object.keys(estrellas).filter((k) => estrellas[k].dataset.tomada).length; el.querySelector('#cuenta').textContent = q ? `⭐ ${rec}/${q}` : '🚩 Llega a la bandera'; }
    cuenta();
    function pintaPrograma(nuevo) {
      prog.replaceChildren();
      if (!programa.length) prog.appendChild(h('<span class="vacio">👆 Aquí aparecen los pasos de Beto</span>'));
      programa.forEach((b, i) => {
        const x = h(`<button class="bloque ${b.c} ${nuevo && i === programa.length - 1 ? 'nuevo' : ''}" data-i="${i}" aria-label="${CAMINA[b.c]}${b.n > 1 ? ' ' + b.n + ' veces' : ''}. Toca para quitar">${ICON[b.c]}${b.n > 1 ? `<small>×${b.n}</small>` : ''}</button>`);
        x.onclick = () => { if (corriendo) return; programa.splice(i, 1); Sfx.clic(); pintaPrograma(); };
        prog.appendChild(x);
      });
    }
    function agrega(c) {
      if (corriendo) return;
      const tope = nivel.maxBlocks || 16;
      if (programa.length >= tope) { Sfx.mal(); const t = nivel.maxBlocks ? '¡Usa el botón repetir para hacerlo con menos bloques!' : 'Ya son muchos pasos. Quita alguno.'; msg.textContent = t; decir(t); return; }
      programa.push({ c, n: pendienteRep || 1 }); pendienteRep = 0;
      pal.querySelectorAll('.rep').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      c === 'F' ? Sfx.paso() : Sfx.giro(); pintaPrograma(true);
    }
    pintaPrograma();

    /* --- ejecución animada --- */
    const px = (v) => (v + .5) * T;
    function reinicia() {
      ang = (nivel.start.d - 1) * 90; beto.style.transition = 'none'; beto.style.left = px(nivel.start.x) + 'px'; beto.style.top = px(nivel.start.y) + 'px';
      gira.style.transition = 'none'; gira.style.transform = `rotateZ(${ang}deg)`; void beto.offsetWidth; beto.style.transition = ''; gira.style.transition = '';
      Object.values(estrellas).forEach((s) => { delete s.dataset.tomada; s.querySelector('.em').classList.remove('tomada'); });
      cuenta();
    }
    reinicia();
    async function correr() {
      if (corriendo) return;
      if (!programa.length) { Sfx.mal(); msg.textContent = '¡Primero dale instrucciones a Beto!'; decir('Primero dale instrucciones a Beto. Toca las flechas.'); return; }
      const ses = sesion; corriendo = true; reinicia(); Voz.parar();
      el.querySelectorAll('button').forEach((b) => { if (b.id !== 'oir') b.disabled = true; });
      const res = C.simular(nivel, programa); msg.textContent = '¡Beto está en marcha! 🤖';
      await sleep(400);
      for (const ev of res.eventos) {
        if (ses !== sesion) return;
        prog.querySelectorAll('.bloque').forEach((b) => b.classList.toggle('activo', +b.dataset.i === ev.idx));
        if (ev.t === 'giro') { ang += ev.dir === 'R' ? 90 : -90; gira.style.transform = `rotateZ(${ang}deg)`; Sfx.giro(); await sleep(560); }
        else if (ev.t === 'avanza') {
          reb.classList.remove('salta'); void reb.offsetWidth; reb.classList.add('salta');
          beto.style.left = px(ev.x) + 'px'; beto.style.top = px(ev.y) + 'px'; Sfx.paso(); await sleep(560);
          if (ev.estrella) { const s = estrellas[ev.x + ',' + ev.y]; s.dataset.tomada = '1'; s.querySelector('.em').classList.add('tomada'); Sfx.estrella(); cuenta(); }
        } else {
          const dx = (ev.hx - ev.x) * T * .38, dy = (ev.hy - ev.y) * T * .38;
          beto.style.left = px(ev.x) + dx + 'px'; beto.style.top = px(ev.y) + dy + 'px'; await sleep(300);
          reb.classList.remove('ups'); void reb.offsetWidth; reb.classList.add('ups'); Sfx.mal();
          beto.style.left = px(ev.x) + 'px'; beto.style.top = px(ev.y) + 'px'; await sleep(600);
        }
      }
      prog.querySelectorAll('.bloque').forEach((b) => b.classList.remove('activo'));
      if (ses !== sesion) return;
      if (res.ok) {
        const est = C.estrellasGanadas(nivel, programa); guardarResultado(nivel, est);
        reb.classList.add('baila'); beto.classList.add('baila'); msg.textContent = '¡Llegaste! 🎉';
        const tip = est === 3 ? '¡Usaste muy pocos bloques!' : 'Puedes intentarlo con menos bloques para ganar más estrellas.';
        await sleep(500); if (ses !== sesion) return; premio(idx, est, tip);
      } else {
        let t;
        if (res.choco) t = '¡Ups! Beto chocó. Revisa los pasos e inténtalo otra vez.';
        else if (res.faltan > 0 && res.llego) t = 'Llegaste, pero te faltó recoger una estrella. ¡Inténtalo otra vez!';
        else t = 'Beto todavía no llegó a la bandera. ¡Casi! Agrega más pasos.';
        msg.textContent = t; decir(t); await sleep(1400);
        if (ses !== sesion) return; reinicia();
      }
      corriendo = false; el.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    }
    el.querySelector('#correr').onclick = () => { Sfx.clic(); correr(); };
    el.querySelector('#atras').onclick = () => { if (corriendo) return; Sfx.clic(); programa.pop(); pintaPrograma(); };
    el.querySelector('#borrar').onclick = () => { if (corriendo) return; Sfx.clic(); programa = []; pendienteRep = 0; pintaPrograma(); };
    el.querySelector('#oir').onclick = () => { Sfx.clic(); decir(nivel.voz); };
    el.querySelector('#pista').onclick = () => { Sfx.clic(); msg.textContent = '💡 ' + nivel.pista; decir(nivel.pista); };
    decir(nivel.voz);
  }

  /* ================= Ajustes de la profe ================= */
  function ajustes() {
    const dlg = document.getElementById('dlgAjustes'), form = document.getElementById('formAjustes');
    const a = 3 + ((Math.random() * 6) | 0), b = 4 + ((Math.random() * 5) | 0);
    form.innerHTML = `<h2>🔒 Solo para adultos</h2><p>¿Cuánto es ${a} + ${b}?</p>
      <input type="text" id="resp" inputmode="numeric" autocomplete="off"><div class="acciones"><button type="button" class="btn-peq" id="ok">Entrar</button><button class="btn-peq gris" value="x">Cerrar</button></div>`;
    dlg.showModal();
    form.querySelector('#resp').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); form.querySelector('#ok').click(); } };
    form.querySelector('#ok').onclick = () => { if (+form.querySelector('#resp').value === a + b) panelAjustes(); else form.querySelector('p').textContent = 'Inténtalo de nuevo. ' + `¿Cuánto es ${a} + ${b}?`; };
  }
  function panelAjustes() {
    Voz.cargar();
    const dlg = document.getElementById('dlgAjustes'), form = document.getElementById('formAjustes');
    const mejor = Voz.mejor();
    const opciones = Voz.voces.map((v) => `<option value="${esc(v.voiceURI)}" ${mejor && mejor.voiceURI === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('') || '<option>No hay voces en español en este equipo</option>';
    const filas = Object.entries(perfiles).sort((x, y) => y[1].last - x[1].last).map(([k, p]) => `<div class="perfil-fila"><span>${esc(p.avatar)} <b>${esc(p.name)}</b> · ⭐${totalEstrellas(p)} · ${Object.keys(p.done).length}/${C.NIVELES.length} niveles</span>
      <span><button type="button" class="btn-peq gris" data-act="libre" data-k="${esc(k)}">${p.libre ? 'Bloquear niveles' : 'Abrir todos'}</button> <button type="button" class="btn-peq gris" data-act="reset" data-k="${esc(k)}">Reiniciar</button> <button type="button" class="btn-peq peligro" data-act="del" data-k="${esc(k)}">Borrar</button></span></div>`).join('') || '<p>Aún no hay niños registrados.</p>';
    form.innerHTML = `<h2>⚙️ Ajustes</h2>
      <label>Voz de Beto (prueba hasta encontrar la más natural; en Edge busca las “Online (Natural)”)<select id="selVoz">${opciones}</select></label>
      <label>Velocidad al hablar <input type="range" id="ritmo" min="0.6" max="1.2" step="0.02" value="${cfg.ritmo}"></label>
      <label><input type="checkbox" id="mudo" ${cfg.silencio ? 'checked' : ''}> Silenciar voz y sonidos</label>
      <div class="acciones"><button type="button" class="btn-peq" id="probar">▶ Probar voz</button></div>
      <h3>Niños en este equipo</h3>${filas}
      <h3>Copia de seguridad</h3>
      <div class="acciones"><button type="button" class="btn-peq" id="exportar">⬇ Descargar copia</button><label class="btn-peq gris" style="cursor:pointer">⬆ Cargar copia<input type="file" id="importar" accept="application/json" hidden></label></div>
      <p class="aviso">El avance se guarda en este navegador y equipo. Para usar otro equipo, descarga la copia y cárgala allá.</p>
      <div class="acciones"><button class="btn-peq gris" value="x">Cerrar</button></div>`;
    form.querySelector('#selVoz').onchange = (e) => { cfg.vozURI = e.target.value; LS.set(K_CFG, cfg); };
    form.querySelector('#ritmo').oninput = (e) => { cfg.ritmo = +e.target.value; LS.set(K_CFG, cfg); };
    form.querySelector('#mudo').onchange = (e) => { cfg.silencio = e.target.checked; LS.set(K_CFG, cfg); if (actual) pintaBarra(); };
    form.querySelector('#probar').onclick = () => Voz.decir('¡Hola! Soy Beto, el robot. ¿Listo para aprender algoritmos?');
    form.onclick = (e) => {
      const bt = e.target.closest('[data-act]'); if (!bt) return; const k = bt.dataset.k, p = perfiles[k];
      if (bt.dataset.act === 'libre') p.libre = !p.libre;
      else if (bt.dataset.act === 'reset' && confirm('¿Reiniciar el avance de ' + p.name + '?')) { p.done = {}; }
      else if (bt.dataset.act === 'del' && confirm('¿Borrar a ' + p.name + '?')) { delete perfiles[k]; if (actual === k) { actual = null; guardar(); dlg.close(); pantallaBienvenida(); return; } }
      else return;
      guardar(); panelAjustes(); if (actual) pintaBarra();
    };
    form.querySelector('#exportar').onclick = () => {
      const blob = new Blob([JSON.stringify({ v: 1, perfiles }, null, 1)], { type: 'application/json' }); const u = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = u; a.download = 'beto-avance.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
    };
    form.querySelector('#importar').onchange = async (e) => {
      try { const d = JSON.parse(await e.target.files[0].text()); Object.entries(d.perfiles || {}).forEach(([k, p]) => { if (p && p.name && p.done) perfiles[k] = Object.assign({ avatar: '🦊', last: 0 }, p); }); guardar(); panelAjustes(); }
      catch (err) { alert('No se pudo leer el archivo.'); }
    };
  }

  /* ================= Arranque ================= */
  document.getElementById('btnInicio').onclick = () => { Sfx.clic(); if (actual) pantallaMapa(); };
  document.getElementById('btnAjustes').onclick = () => { Sfx.clic(); ajustes(); };
  document.getElementById('btnSonido').onclick = () => { cfg.silencio = !cfg.silencio; LS.set(K_CFG, cfg); if (cfg.silencio) Voz.parar(); else Sfx.bien(); pintaBarra(); };
  pantallaBienvenida();
})();
