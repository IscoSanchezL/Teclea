/**
 * Mascotas en 3D de verdad (WebGL con three.js) para 2.º grado.
 *   const e = await crear3D({ tipo: 'hero' | 'companero' | 'resultado', usuario, ancho, alto });
 *   contenedor.append(e.el);  e.reaccionar('salta' | 'ay' | 'baila' | 'saluda' | 'gira');  e.confeti(40);
 * - three.js se descarga SOLO cuando se necesita (≈165 KB comprimido) y se guarda en el dispositivo.
 * - Si el equipo no soporta WebGL o es muy modesto, devuelve null y se queda la mascota 2D de siempre.
 * - Estilo "dibujo animado": materiales toon con contorno, ojos que parpadean, cabeza que sigue el puntero,
 *   squash & stretch al saltar, confeti 3D y objetos que flotan. Se pausa fuera de pantalla.
 */
import { ESPECIES, especieDe } from './personaje.js';

let T = null, fallo = false;

export function soporta3D() {
  if (fallo) return false;
  if ((navigator.deviceMemory && navigator.deviceMemory < 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) return false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
async function three() {
  if (T) return T;
  try { T = await import('../vendor/three.module.min.js'); } catch (e) { console.warn('[3d] no se pudo cargar three.js', e); fallo = true; }
  return T;
}

/* ───────── Construcción del personaje ───────── */
const OUT = 0x2a1a5e;

function fabrica(t) {
  const grad = new t.DataTexture(new Uint8Array([70, 140, 210, 255]), 4, 1, t.RedFormat);
  grad.minFilter = grad.magFilter = t.NearestFilter; grad.needsUpdate = true;
  const mats = new Map();
  const mat = (c) => { const k = typeof c === 'string' ? c : `#${c}`; if (!mats.has(k)) mats.set(k, new t.MeshToonMaterial({ color: c, gradientMap: grad })); return mats.get(k); };
  const matOut = new t.MeshBasicMaterial({ color: OUT, side: t.BackSide });
  const esfera = new t.SphereGeometry(1, 28, 20), geos = [esfera];
  const G = (g) => { geos.push(g); return g; };
  /** Malla con contorno de dibujo animado (casco invertido). */
  function m(geo, color, { p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], o = 1.07, padre, doble = false } = {}) {
    const mat1 = doble ? Object.assign(mat(color).clone(), { side: t.DoubleSide }) : mat(color);
    const x = new t.Mesh(geo, mat1);
    x.position.set(...p); x.scale.set(...s); x.rotation.set(...r);
    if (o) { const c = new t.Mesh(geo, matOut); c.scale.setScalar(o); x.add(c); }
    padre?.add(x); return x;
  }
  const S = (color, opts) => m(esfera, color, opts);
  return { t, mat, m, S, G, esfera, geos, grad, matOut, mats };
}

/** Arma al personaje. Devuelve { raiz, partes } para animarlo. */
function construir(f, especie, accesorios) {
  const { t, m, S, G } = f;
  const P = ESPECIES[especie] || ESPECIES.zorro;
  const A = new t.Color(P.a), B = new t.Color(P.b), V = new t.Color(P.v);
  const raiz = new t.Group(), cuerpo = new t.Group(), cabeza = new t.Group();
  raiz.add(cuerpo); raiz.add(cabeza);
  cabeza.position.set(0, 2.35, 0); cuerpo.position.set(0, 0, 0);
  const partes = { raiz, cuerpo, cabeza, orejas: [], ojos: [], brazos: [], cola: null, alas: [] };

  const oscuroP = especie === 'panda', pingu = especie === 'pinguino';
  const colBrazo = oscuroP ? 0x2b2b3a : A;
  // cuerpo, barriga y pies
  S(A, { p: [0, 1.0, 0], s: [0.98, 1.08, 0.92], padre: cuerpo });
  S(V, { p: [0, 0.95, 0.52], s: [0.62, 0.8, 0.5], o: 0, padre: cuerpo });
  for (const x of [-1, 1]) S(pingu ? 0xff9f1c : (oscuroP ? 0x2b2b3a : B), { p: [x * 0.42, 0.16, 0.5], s: [0.44, 0.22, 0.58], padre: cuerpo });
  // brazos (pivote en el hombro para poder saludar)
  for (const x of [-1, 1]) {
    const pivote = new t.Group(); pivote.position.set(x * 0.98, 1.55, 0.05); pivote.rotation.z = x * 0.28; cuerpo.add(pivote);
    S(colBrazo, { p: [0, -0.42, 0], s: [0.27, 0.5, 0.27], padre: pivote });
    partes.brazos.push(pivote);
  }
  // cabeza
  if (especie === 'robot') {
    m(G(new t.BoxGeometry(2.15, 1.85, 1.95)), A, { padre: cabeza, o: 1.05 });
    m(G(new t.BoxGeometry(1.78, 1.38, 0.1)), 0x1f2a5c, { p: [0, 0, 0.98], padre: cabeza, o: 0 });
  } else S(A, { s: [1.18, 1.02, 1.1], padre: cabeza });
  const z = especie === 'robot' ? 1.05 : 0.96;
  const ojoColor = especie === 'robot' ? 0x4fe3ff : 0x1b1340;

  // ojos (grupo para parpadear)
  const ojos = new t.Group(); cabeza.add(ojos); partes.ojos = ojos;
  for (const x of [-1, 1]) {
    const g = new t.Group(); g.position.set(x * 0.42, 0.1, z); ojos.add(g);
    if (oscuroP) S(0xffffff, { p: [0, 0, 0.02], s: [0.17, 0.2, 0.08], o: 0, padre: g });
    if (especie === 'buho') { S(0xfff3dd, { p: [0, 0, -0.05], s: [0.4, 0.4, 0.08], o: 0, padre: g }); S(0xffb02e, { s: [0.26, 0.26, 0.09], o: 0, padre: g }); }
    if (especie === 'robot') m(G(new t.BoxGeometry(0.34, 0.34, 0.06)), ojoColor, { padre: g, o: 0 });
    else S(ojoColor, { p: [0, 0, 0.05], s: oscuroP ? [0.1, 0.12, 0.06] : especie === 'buho' ? [0.14, 0.14, 0.07] : [0.15, 0.2, 0.1], o: 0, padre: g });
    S(0xffffff, { p: [x * -0.04 + 0.04, 0.08, 0.13], s: [0.05, 0.055, 0.04], o: 0, padre: g });
  }
  if (oscuroP) for (const x of [-1, 1]) S(0x2b2b3a, { p: [x * 0.43, 0.1, z - 0.06], s: [0.29, 0.36, 0.12], r: [0, 0, x * -0.4], padre: cabeza, o: 0 });
  // mejillas y boca
  if (especie !== 'robot') for (const x of [-1, 1]) S(0xff8fa8, { p: [x * 0.72, -0.3, 0.78], s: [0.2, 0.12, 0.08], o: 0, padre: cabeza });
  if (!['pinguino', 'buho'].includes(especie)) m(G(new t.TorusGeometry(0.13, 0.026, 8, 18, Math.PI)), 0x2b1a3a, { p: [0, -0.34, 1.0], r: [0, 0, Math.PI], o: 0, padre: cabeza });

  const cola = (pts, color, radio = 0.14) => {
    const curva = new t.CatmullRomCurve3(pts.map((q) => new t.Vector3(...q)));
    const g = new t.Group(); cuerpo.add(g); partes.cola = g;
    m(G(new t.TubeGeometry(curva, 18, radio, 8, false)), color, { padre: g, o: 1.12 });
    return g;
  };

  // detalles por especie
  if (especie === 'zorro') {
    for (const x of [-1, 1]) {
      const g = new t.Group(); g.position.set(x * 0.72, 0.85, 0); g.rotation.z = -x * 0.32; cabeza.add(g); partes.orejas.push(g);
      m(G(new t.ConeGeometry(0.4, 0.95, 4)), A, { p: [0, 0.3, 0], r: [0, Math.PI / 4, 0], padre: g });
      m(G(new t.ConeGeometry(0.22, 0.6, 4)), 0x3b2314, { p: [0, 0.18, 0.1], r: [0, Math.PI / 4, 0], o: 0, padre: g });
    }
    S(0xffffff, { p: [0, -0.28, 0.82], s: [0.62, 0.42, 0.5], o: 1.05, padre: cabeza });
    S(0x2b1a3a, { p: [0, -0.02, 1.28], s: [0.14, 0.1, 0.1], o: 0, padre: cabeza });
    const g = new t.Group(); g.position.set(0, 0.8, -0.85); cuerpo.add(g); partes.cola = g;
    m(G(new t.ConeGeometry(0.55, 1.5, 14)), A, { p: [0, 0.55, -0.4], r: [-0.9, 0, 0], padre: g, o: 1.07 });
    S(0xffffff, { p: [0, 1.0, -1.05], s: [0.3, 0.3, 0.3], padre: g });
  } else if (especie === 'panda') {
    for (const x of [-1, 1]) { const o = S(0x2b2b3a, { p: [x * 0.82, 0.88, -0.05], s: [0.4, 0.4, 0.3], padre: cabeza }); partes.orejas.push(o); }
    S(0x2b2b3a, { p: [0, -0.04, 1.2], s: [0.15, 0.1, 0.1], o: 0, padre: cabeza });
  } else if (especie === 'gato') {
    for (const x of [-1, 1]) {
      const g = new t.Group(); g.position.set(x * 0.7, 0.8, 0); g.rotation.z = -x * 0.3; cabeza.add(g); partes.orejas.push(g);
      m(G(new t.ConeGeometry(0.42, 0.85, 3)), A, { p: [0, 0.3, 0], padre: g });
      m(G(new t.ConeGeometry(0.24, 0.55, 3)), 0xff9fb5, { p: [0, 0.2, 0.1], o: 0, padre: g });
    }
    S(0xe86a8a, { p: [0, -0.03, 1.07], s: [0.1, 0.07, 0.06], o: 0, padre: cabeza });
    for (const x of [-1, 1]) for (const dy of [-0.05, 0.06]) m(G(new t.CylinderGeometry(0.012, 0.012, 0.75)), 0xffffff, { p: [x * 0.78, -0.18 + dy, 0.85], r: [0, 0, Math.PI / 2 + x * 0.12 * (dy > 0 ? -1 : 1)], o: 0, padre: cabeza });
    for (const dx of [-0.2, 0, 0.2]) m(G(new t.BoxGeometry(0.07, 0.3, 0.06)), B, { p: [dx, 0.82, 0.62], o: 0, padre: cabeza });
    cola([[0, 0.6, -0.8], [0, 0.4, -1.5], [0.25, 1.1, -1.8], [0.4, 1.9, -1.5]], B);
  } else if (especie === 'conejo') {
    for (const x of [-1, 1]) {
      const g = new t.Group(); g.position.set(x * 0.46, 1.1, 0); g.rotation.z = -x * 0.14; cabeza.add(g); partes.orejas.push(g);
      m(G(new t.CapsuleGeometry(0.27, 1.0, 6, 14)), A, { p: [0, 0.6, 0], padre: g });
      m(G(new t.CapsuleGeometry(0.15, 0.85, 6, 12)), 0xffb3cf, { p: [0, 0.6, 0.12], o: 0, padre: g });
    }
    S(0xe86a8a, { p: [0, -0.03, 1.06], s: [0.1, 0.07, 0.06], o: 0, padre: cabeza });
    for (const x of [-1, 1]) m(G(new t.BoxGeometry(0.12, 0.17, 0.04)), 0xffffff, { p: [x * 0.07, -0.5, 1.0], o: 0, padre: cabeza });
    const g = new t.Group(); g.position.set(0, 0.7, -0.88); cuerpo.add(g); partes.cola = g; S(0xffffff, { s: [0.36, 0.36, 0.36], padre: g });
  } else if (especie === 'dragon') {
    for (const x of [-1, 1]) {
      m(G(new t.ConeGeometry(0.17, 0.6, 10)), V, { p: [x * 0.55, 1.0, 0.1], r: [0, 0, -x * 0.25], padre: cabeza });
      const ala = new t.Group(); ala.position.set(x * 0.95, 1.55, -0.5); ala.rotation.z = -x * 0.5; cuerpo.add(ala); partes.alas.push(ala);
      m(G(new t.SphereGeometry(1, 16, 12)), 0x1fa67a, { p: [x * 0.45, 0.25, 0], s: [0.65, 0.12, 0.45], padre: ala, doble: false });
    }
    for (const q of [[1.9, -0.7], [1.45, -0.9], [1.0, -0.95]]) m(G(new t.ConeGeometry(0.16, 0.38, 8)), 0xffd04a, { p: [0, q[0], q[1]], r: [-0.5, 0, 0], padre: cuerpo });
    S(V, { p: [0, -0.3, 0.86], s: [0.5, 0.3, 0.4], o: 1.05, padre: cabeza });
    for (const x of [-1, 1]) S(0x0f6b4d, { p: [x * 0.12, -0.2, 1.22], s: [0.05, 0.05, 0.05], o: 0, padre: cabeza });
    cola([[0, 0.6, -0.8], [0, 0.35, -1.5], [0.5, 0.3, -2.0], [1.0, 0.55, -2.1]], B);
  } else if (especie === 'robot') {
    m(G(new t.CylinderGeometry(0.05, 0.05, 0.55)), B, { p: [0, 1.25, 0], padre: cabeza, o: 0 });
    S(0xff6b8b, { p: [0, 1.6, 0], s: [0.17, 0.17, 0.17], padre: cabeza });
    for (const x of [-1, 1]) m(G(new t.CylinderGeometry(0.22, 0.22, 0.2, 14)), B, { p: [x * 1.12, 0, 0], r: [0, 0, Math.PI / 2], padre: cabeza });
    m(G(new t.BoxGeometry(0.9, 0.05, 0.05)), 0x4fe3ff, { p: [0, -0.4, 1.0], padre: cabeza, o: 0 });
  } else if (especie === 'buho') {
    for (const x of [-1, 1]) { const g = new t.Group(); g.position.set(x * 0.72, 0.85, 0); g.rotation.z = -x * 0.35; cabeza.add(g); partes.orejas.push(g); m(G(new t.ConeGeometry(0.36, 0.8, 4)), B, { p: [0, 0.3, 0], r: [0, Math.PI / 4, 0], padre: g }); }
    m(G(new t.ConeGeometry(0.17, 0.4, 4)), 0xff9f1c, { p: [0, -0.2, 1.1], r: [Math.PI / 2, Math.PI / 4, 0], padre: cabeza });
  } else if (especie === 'pinguino') {
    S(0xffffff, { p: [0, -0.18, 0.62], s: [0.92, 0.8, 0.55], o: 1.04, padre: cabeza });
    m(G(new t.ConeGeometry(0.2, 0.42, 10)), 0xff9f1c, { p: [0, -0.1, 1.12], r: [Math.PI / 2, 0, 0], padre: cabeza });
  } else if (especie === 'leon') {
    S(P.o, { p: [0, -0.05, -0.25], s: [1.6, 1.5, 1.0], padre: cabeza });
    for (const x of [-1, 1]) { const o = S(A, { p: [x * 0.72, 0.8, 0.1], s: [0.3, 0.3, 0.2], padre: cabeza }); partes.orejas.push(o); }
    S(V, { p: [0, -0.3, 0.8], s: [0.5, 0.36, 0.42], o: 1.05, padre: cabeza });
    S(0x7a3e12, { p: [0, -0.1, 1.2], s: [0.12, 0.08, 0.08], o: 0, padre: cabeza });
    const g = cola([[0, 0.6, -0.8], [0, 0.4, -1.5], [0.2, 0.9, -1.9]], B); S(P.o, { p: [0.2, 1.0, -1.95], s: [0.28, 0.28, 0.28], padre: g });
  } else if (especie === 'unicornio') {
    m(G(new t.ConeGeometry(0.2, 1.1, 12)), 0xffd04a, { p: [0, 1.4, 0.25], r: [0.15, 0, 0], padre: cabeza });
    for (const y of [0.9, 1.15, 1.4]) m(G(new t.TorusGeometry(0.14 - (y - 0.9) * 0.1, 0.03, 6, 14)), 0xe0a800, { p: [0, y, 0.27], r: [Math.PI / 2 + 0.15, 0, 0], o: 0, padre: cabeza });
    for (const x of [-1, 1]) { const g = new t.Group(); g.position.set(x * 0.7, 0.85, 0); g.rotation.z = -x * 0.3; cabeza.add(g); partes.orejas.push(g); m(G(new t.ConeGeometry(0.32, 0.65, 8)), A, { p: [0, 0.2, 0], padre: g }); }
    for (const [x, y, c] of [[-0.9, 0.5, 0xff8fd0], [-1.0, 0.0, 0xb58cff], [-0.9, -0.5, 0xff8fd0], [0, 1.0, 0xff8fd0]]) S(c, { p: [x, y, 0.1], s: [0.32, 0.32, 0.3], padre: cabeza });
    S(0xe86a8a, { p: [0, -0.03, 1.07], s: [0.1, 0.07, 0.06], o: 0, padre: cabeza });
    cola([[0, 0.6, -0.8], [0, 0.4, -1.5], [0.3, 1.0, -1.9], [0.2, 1.8, -1.6]], 0xff8fd0, 0.2);
  }

  accesorios3D(f, accesorios, cabeza, cuerpo, raiz, partes);
  return { raiz, partes };
}

function accesorios3D(f, lista, cabeza, cuerpo, raiz, partes) {
  const { t, m, S, G } = f;
  for (const em of lista || []) {
    if (em === '🧢') {
      m(G(new t.SphereGeometry(1.2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2)), 0x2f6bff, { p: [0, 0.2, 0], s: [1.0, 0.95, 1.0], padre: cabeza, o: 1.03 });
      m(G(new t.CylinderGeometry(0.85, 0.85, 0.08, 24)), 0x1e4fb8, { p: [0, 0.3, 1.0], s: [1, 1, 0.75], r: [0.18, 0, 0], padre: cabeza });
      S(0x1e4fb8, { p: [0, 1.15, 0], s: [0.1, 0.1, 0.1], padre: cabeza });
    } else if (em === '🎩') {
      m(G(new t.CylinderGeometry(1.3, 1.3, 0.1, 28)), 0x1b1b2e, { p: [0, 0.95, 0], padre: cabeza });
      m(G(new t.CylinderGeometry(0.78, 0.82, 1.15, 24)), 0x2a2a44, { p: [0, 1.55, 0], padre: cabeza });
      m(G(new t.CylinderGeometry(0.83, 0.83, 0.2, 24)), 0xc0392b, { p: [0, 1.1, 0], padre: cabeza, o: 0 });
    } else if (em === '👑') {
      m(G(new t.CylinderGeometry(0.85, 0.78, 0.4, 5)), 0xffc933, { p: [0, 1.08, 0], padre: cabeza });
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; m(G(new t.ConeGeometry(0.17, 0.45, 8)), 0xffc933, { p: [Math.sin(a) * 0.8, 1.45, Math.cos(a) * 0.8], padre: cabeza }); S([0xff6b8b, 0x4fc3f0, 0xff6b8b, 0x3ddbb0, 0x4fc3f0][i], { p: [Math.sin(a) * 0.8, 1.72, Math.cos(a) * 0.8], s: [0.08, 0.08, 0.08], o: 0, padre: cabeza }); }
    } else if (em === '🎓') {
      m(G(new t.CylinderGeometry(0.85, 0.9, 0.4, 20)), 0x26264a, { p: [0, 1.0, 0], padre: cabeza });
      m(G(new t.BoxGeometry(2.3, 0.1, 2.3)), 0x34346a, { p: [0, 1.28, 0], r: [0, Math.PI / 4, 0], padre: cabeza });
      m(G(new t.CylinderGeometry(0.02, 0.02, 0.9)), 0xffd04a, { p: [1.0, 0.8, 1.0], padre: cabeza, o: 0 });
      S(0xffd04a, { p: [1.0, 0.35, 1.0], s: [0.1, 0.14, 0.1], padre: cabeza });
    } else if (em === '🎧') {
      m(G(new t.TorusGeometry(1.25, 0.09, 10, 36, Math.PI)), 0x2b2b44, { p: [0, 0.1, 0], padre: cabeza, o: 0 });
      for (const x of [-1, 1]) m(G(new t.CylinderGeometry(0.4, 0.4, 0.32, 18)), 0xff6b8b, { p: [x * 1.2, 0, 0], r: [0, 0, Math.PI / 2], padre: cabeza });
    } else if (em === '🕶️') {
      for (const x of [-1, 1]) S(0x14142a, { p: [x * 0.42, 0.1, 1.0], s: [0.46, 0.34, 0.13], padre: cabeza });
      m(G(new t.BoxGeometry(0.3, 0.05, 0.05)), 0x14142a, { p: [0, 0.14, 1.06], padre: cabeza, o: 0 });
      for (const x of [-1, 1]) m(G(new t.BoxGeometry(0.05, 0.05, 0.9)), 0x14142a, { p: [x * 1.0, 0.14, 0.55], padre: cabeza, o: 0 });
    } else if (em === '👓') {
      for (const x of [-1, 1]) m(G(new t.TorusGeometry(0.36, 0.05, 8, 24)), 0xd9a400, { p: [x * 0.42, 0.1, 1.02], padre: cabeza, o: 0 });
      m(G(new t.TorusGeometry(0.1, 0.035, 6, 12, Math.PI)), 0xd9a400, { p: [0, 0.14, 1.04], padre: cabeza, o: 0 });
    } else if (em === '🏴‍☠️') {
      S(0x14142a, { p: [-0.42, 0.1, 1.0], s: [0.4, 0.34, 0.13], padre: cabeza });
      m(G(new t.TorusGeometry(1.13, 0.035, 6, 48)), 0x14142a, { p: [0, 0.5, 0], s: [1, 0.95, 1], r: [Math.PI / 2 - 0.2, 0.15, 0], padre: cabeza, o: 0 });
    } else if (em === '🎀') {
      for (const x of [-1, 1]) m(G(new t.ConeGeometry(0.3, 0.62, 12)), 0xff5c9a, { p: [0.8 + x * 0.32, 0.85, 0.4], r: [0, 0, x * Math.PI / 2], padre: cabeza });
      S(0xe91e7a, { p: [0.8, 0.85, 0.4], s: [0.15, 0.15, 0.15], padre: cabeza });
    } else if (em === '🧙') {
      m(G(new t.CylinderGeometry(1.5, 1.5, 0.08, 28)), 0x4b2fa3, { p: [0, 0.95, 0], padre: cabeza });
      m(G(new t.ConeGeometry(0.95, 2.0, 24)), 0x6c4cf5, { p: [0.05, 2.0, 0], r: [0, 0, -0.1], padre: cabeza });
      m(G(new t.CylinderGeometry(0.92, 0.95, 0.2, 24)), 0xffd04a, { p: [0, 1.1, 0], padre: cabeza, o: 0 });
    } else if (em === '🥸') {
      m(G(new t.SphereGeometry(1, 28, 10, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.2)), 0xc2294a, { s: [1.21, 1.05, 1.12], padre: cabeza, o: 0 });
      for (const x of [-1, 1]) { S(0xffffff, { p: [x * 0.42, 0.1, 1.05], s: [0.2, 0.22, 0.08], o: 0, padre: cabeza }); S(0x1b1340, { p: [x * 0.42, 0.1, 1.1], s: [0.12, 0.15, 0.06], o: 0, padre: cabeza }); }
    } else if (em === '🧣') {
      m(G(new t.TorusGeometry(0.95, 0.27, 12, 28)), 0xe8463d, { p: [0, 1.5, 0.05], r: [Math.PI / 2, 0, 0], padre: cuerpo });
      m(G(new t.BoxGeometry(0.36, 1.0, 0.14)), 0xc2294a, { p: [0.45, 0.85, 0.92], r: [0, 0, 0.1], padre: cuerpo });
    } else if (em === '🪽') {
      for (const x of [-1, 1]) m(G(new t.SphereGeometry(1, 16, 12)), 0xffffff, { p: [x * 1.15, 1.5, -0.55], s: [0.2, 0.85, 0.5], r: [0, 0, -x * 0.5], padre: cuerpo });
    } else if (em === '🦸') {
      const mm = m(G(new t.CylinderGeometry(0.9, 1.45, 1.9, 22, 1, true, Math.PI / 2, Math.PI)), 0xe5456b, { p: [0, 1.0, -0.12], padre: cuerpo, doble: true, o: 0 });
      S(0xffd04a, { p: [0, 1.65, 0.85], s: [0.11, 0.11, 0.08], padre: cuerpo });
    } else if (em === '🌈') {
      [0xff5c7a, 0xffa24d, 0xffd04a, 0x3ddbb0, 0x4fc3f0, 0x8a70fa].forEach((c, i) => m(G(new t.TorusGeometry(2.2 - i * 0.14, 0.08, 8, 40, Math.PI)), c, { p: [0, 0.3, -1.1], padre: raiz, o: 0 }));
    }
  }
}

/* ───────── Escena ───────── */
const CONFIGS = {
  hero: { cam: [0, 2.8, 9.4], mira: [0, 2.2, 0], fov: 42, decor: true },
  companero: { cam: [0, 2.7, 9.6], mira: [0, 1.9, 0], fov: 34, decor: false },
  resultado: { cam: [0, 2.8, 9.4], mira: [0, 2.2, 0], fov: 42, decor: true },
};
const COLORES = [0xff6b8b, 0xffd04a, 0x3ddbb0, 0x4fc3f0, 0x8a70fa, 0xff9a4d];
const asegura = (n) => Math.max(0.0001, n);

export async function crear3D({ tipo = 'hero', usuario = null, ancho = 280, alto = 280, clase = '' } = {}) {
  if (!soporta3D()) return null;
  const t = await three(); if (!t) return null;
  let renderer;
  const canvas = document.createElement('canvas');
  canvas.className = `escena3d escena3d--${tipo} ${clase}`; canvas.width = ancho; canvas.height = alto;
  canvas.style.width = `${ancho}px`; canvas.style.height = `${alto}px`; canvas.setAttribute('aria-hidden', 'true');
  try { renderer = new t.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { fallo = true; return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(ancho, alto, false); renderer.setClearColor(0x000000, 0);

  const cfg = CONFIGS[tipo] || CONFIGS.hero;
  const escena = new t.Scene();
  const cam = new t.PerspectiveCamera(cfg.fov, ancho / alto, 0.1, 60);
  cam.position.set(...cfg.cam); cam.lookAt(...cfg.mira);
  escena.add(new t.HemisphereLight(0xffffff, 0xb9a6ff, 1.05));
  const sol = new t.DirectionalLight(0xffffff, 1.4); sol.position.set(3, 6, 5); escena.add(sol);

  const av = usuario?.avatar || {};
  const f = fabrica(t);
  const { raiz, partes } = construir(f, especieDe(av), av.accesorios || []);
  escena.add(raiz);
  // sombra suave en el piso
  const sombra = new t.Mesh(new t.CircleGeometry(1.5, 28), new t.MeshBasicMaterial({ color: 0x1b0e5c, transparent: true, opacity: 0.22 })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.02; sombra.scale.set(1, 0.7, 1); escena.add(sombra);

  /* objetos que flotan: estrellas, globos y caramelos */
  const flotantes = [];
  if (cfg.decor) {
    const estrella = (() => { const s = new t.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.3 : 0.7, a = (i / 10) * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return new t.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }); })();
    f.geos.push(estrella);
    const add = (obj, x, y, z, vel) => { obj.position.set(x, y, z); escena.add(obj); flotantes.push({ obj, y0: y, x0: x, fase: Math.random() * 6, vel }); };
    [[-2.3, 4.5, -0.5], [2.3, 4.9, -0.8], [-2.5, 1.5, 0.3]].forEach(([x, y, z], i) => { const e = new t.Mesh(estrella, f.mat([0xffd04a, 0xff9ad8, 0x7be8cc][i])); e.scale.setScalar(0.6 + i * 0.08); e.add(new t.Mesh(estrella, f.matOut)); e.children[0].scale.setScalar(1.12); add(e, x, y, z, 0.8 + i * 0.2); });
    [[2.4, 2.4, 0.2, 0xff6b8b], [-2.0, 3.2, -1.0, 0x4fc3f0]].forEach(([x, y, z, c]) => { const g = new t.Group(); const b = f.S(c, { s: [0.45, 0.55, 0.45], padre: g }); f.m(f.G(new t.ConeGeometry(0.1, 0.16, 8)), c, { p: [0, -0.62, 0], r: [Math.PI, 0, 0], padre: g, o: 0 }); f.m(f.G(new t.CylinderGeometry(0.012, 0.012, 1.0)), 0xffffff, { p: [0, -1.15, 0], padre: g, o: 0 }); void b; add(g, x, y, z, 0.7); });
  }

  /* confeti 3D */
  const confetis = [];
  const geoConfeti = new t.OctahedronGeometry(0.1, 0); f.geos.push(geoConfeti);
  function confeti(n = 40) {
    for (let i = 0; i < n; i++) {
      const c = new t.Mesh(geoConfeti, f.mat(COLORES[i % COLORES.length])); c.scale.set(1 + Math.random(), 0.4 + Math.random() * 0.4, 0.6);
      c.position.set((Math.random() - 0.5) * 1.2, 3.2 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2);
      confetis.push({ c, v: new t.Vector3((Math.random() - 0.5) * 5, 5 + Math.random() * 4, (Math.random() - 0.5) * 3), w: new t.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8), vida: 0 }); escena.add(c);
    }
  }

  /* estado y animación */
  let estado = 'idle', tEstado = 0, tNext = 2 + Math.random() * 3, parpadeo = 0;
  const mira = { x: 0, y: 0 }, objetivo = { x: 0, y: 0 }, cabezaRot = { x: 0, y: 0 };
  const onMove = (e) => { const r = canvas.getBoundingClientRect(); objetivo.x = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / innerWidth) * 2.4)); objetivo.y = Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height / 2)) / innerHeight) * 2.4)); };
  addEventListener('pointermove', onMove, { passive: true });

  function reaccionar(nuevo) { estado = nuevo; tEstado = 0; if (nuevo === 'baila' || nuevo === 'gira' || nuevo === 'salta') confeti(nuevo === 'salta' ? 14 : 36); }
  const dur = { salta: 0.85, ay: 0.55, saluda: 2.2, gira: 1.1, baila: 99 };

  let vivo = true, ultimo = performance.now(), invisible = 0, visible = true;
  // Calidad adaptable: en equipos lentos baja la resolución, luego los cuadros por segundo y, si aun así no rinde, se retira el 3D
  let medio = 16, cuadros = 0, nivelCalidad = 0, par = false; const api = { alLento: null };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; }) : null; io?.observe(canvas);

  function animar(ahora) {
    if (!vivo) return;
    requestAnimationFrame(animar);
    if (document.hidden || !visible) { ultimo = ahora; return; }
    if (!canvas.isConnected) { if (++invisible > 90) destruir(); return; } invisible = 0;
    const crudo = ahora - ultimo; medio += (Math.min(crudo, 250) - medio) * 0.08; cuadros++;
    if (cuadros === 90 || cuadros === 240 || cuadros === 420) {
      if (medio > 45 && nivelCalidad === 0) { nivelCalidad = 1; renderer.setPixelRatio(1); renderer.setSize(ancho, alto, false); }
      else if (medio > 55 && nivelCalidad === 1) { nivelCalidad = 2; }
      else if (medio > 70 && nivelCalidad === 2) { destruir(); canvas.remove(); api.alLento?.(); return; }
    }
    if (nivelCalidad === 2 && (par = !par)) { ultimo = ahora; return; } // 2.º nivel: mitad de cuadros
    const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora; const s = ahora / 1000;
    tEstado += dt;
    if (estado !== 'idle' && estado !== 'baila' && tEstado > (dur[estado] || 1)) { estado = 'idle'; tEstado = 0; }
    // espontáneo: saluda de vez en cuando
    if (estado === 'idle' && (tNext -= dt) <= 0) { estado = tipo === 'companero' ? 'idle' : 'saluda'; tEstado = 0; tNext = 6 + Math.random() * 6; }

    const { cuerpo, cabeza, brazos, ojos, orejas, cola, alas } = partes;
    // respiración + balanceo
    const resp = Math.sin(s * 2.2); cuerpo.scale.set(1 - resp * 0.012, 1 + resp * 0.02, 1 - resp * 0.012);
    cabeza.position.y = 2.35 + resp * 0.03;
    let saltoY = 0, giro = 0, sx = 1, sy = 1, lado = 0;
    if (estado === 'salta') { const u = Math.min(1, tEstado / 0.85); saltoY = Math.sin(u * Math.PI) * 1.5; sy = 1 + (u < 0.15 || u > 0.85 ? -0.12 : 0.1); sx = 2 - sy; }
    if (estado === 'gira') { const u = Math.min(1, tEstado / 1.1); saltoY = Math.sin(u * Math.PI) * 1.1; giro = u * Math.PI * 2; }
    if (estado === 'baila') { saltoY = Math.abs(Math.sin(s * 5)) * 0.6; lado = Math.sin(s * 2.5) * 0.35; giro = Math.sin(s * 2.5) * 0.5; sy = 1 + Math.sin(s * 10) * 0.04; sx = 2 - sy; }
    raiz.position.set(lado, saltoY, 0); raiz.rotation.y = giro; raiz.scale.set(sx, sy, sx);
    sombra.scale.set(1 - saltoY * 0.12, 0.7 - saltoY * 0.08, 1); sombra.material.opacity = asegura(0.22 - saltoY * 0.05);
    // brazos
    const [bi, bd] = brazos;
    bi.rotation.z = -0.28; bd.rotation.z = 0.28; bi.rotation.x = bd.rotation.x = 0;
    if (estado === 'saluda') { bd.rotation.z = 2.4; bd.rotation.x = 0; bd.rotation.z += Math.sin(tEstado * 12) * 0.35; }
    if (estado === 'salta' || estado === 'gira') { bi.rotation.z = -2.6; bd.rotation.z = 2.6; }
    if (estado === 'baila') { bi.rotation.z = -1.4 + Math.sin(s * 10) * 0.9; bd.rotation.z = 1.4 - Math.sin(s * 10) * 0.9; }
    if (estado === 'idle') { bi.rotation.z += resp * 0.03; bd.rotation.z -= resp * 0.03; }
    // cabeza sigue el puntero
    mira.x += (objetivo.x - mira.x) * 0.08; mira.y += (objetivo.y - mira.y) * 0.08;
    cabezaRot.y = mira.x * 0.55; cabezaRot.x = mira.y * 0.35;
    cabeza.rotation.set(cabezaRot.x + (estado === 'ay' ? Math.sin(tEstado * 30) * 0.05 : 0), cabezaRot.y + (estado === 'ay' ? Math.sin(tEstado * 28) * 0.28 : 0), Math.sin(s * 1.3) * 0.05 + (estado === 'baila' ? Math.sin(s * 5) * 0.12 : 0));
    // parpadeo
    parpadeo -= dt; if (parpadeo <= 0) parpadeo = 2.2 + Math.random() * 3; ojos.scale.y = parpadeo < 0.12 ? 0.1 : 1;
    // orejas, cola, alas
    orejas.forEach((o, i) => { o.rotation.x = Math.sin(s * 1.7 + i) * 0.05 + (estado === 'salta' ? -0.3 : 0); });
    if (cola) { cola.rotation.y = Math.sin(s * (estado === 'baila' || estado === 'salta' ? 9 : 3)) * 0.3; }
    alas.forEach((a, i) => { a.rotation.z = (i ? 0.5 : -0.5) + Math.sin(s * (estado === 'idle' ? 2 : 9) + i) * 0.18 * (i ? 1 : -1); });
    // objetos flotantes
    flotantes.forEach((q) => { q.obj.position.y = q.y0 + Math.sin(s * q.vel + q.fase) * 0.28; q.obj.rotation.y = s * q.vel * 0.8; q.obj.rotation.z = Math.sin(s * 0.9 + q.fase) * 0.15; });
    // confeti 3D
    for (let i = confetis.length - 1; i >= 0; i--) {
      const q = confetis[i]; q.vida += dt; q.v.y -= 9 * dt; q.c.position.addScaledVector(q.v, dt); q.c.rotation.x += q.w.x * dt; q.c.rotation.y += q.w.y * dt; q.c.rotation.z += q.w.z * dt;
      if (q.vida > 2.8 || q.c.position.y < -1.5) { escena.remove(q.c); confetis.splice(i, 1); }
    }
    // paralaje suave de la cámara
    cam.position.x = mira.x * 0.7; cam.position.y = cfg.cam[1] - mira.y * 0.3; cam.lookAt(...cfg.mira);
    renderer.render(escena, cam);
  }
  requestAnimationFrame(animar);

  function destruir() {
    if (!vivo) return; vivo = false; removeEventListener('pointermove', onMove); io?.disconnect();
    f.geos.forEach((g) => g.dispose()); f.mats.forEach((x) => x.dispose()); f.matOut.dispose(); f.grad.dispose();
    renderer.dispose(); renderer.forceContextLoss?.();
  }
  if (tipo !== 'companero') setTimeout(() => reaccionar('saluda'), 600);
  return Object.assign(api, { el: canvas, reaccionar, confeti, destruir });
}
