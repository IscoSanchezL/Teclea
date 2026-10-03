/**
 * Refuerzo adaptativo: arma un ejercicio con las teclas que más falla el estudiante.
 * Lógica pura (se prueba en Node). Usa data/palabras.json.
 */
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (rng, a) => a[Math.floor(rng() * a.length)];

/**
 * @param {string[]} debiles  caracteres a reforzar (p. ej. ['ñ','p','q'])
 * @param {{sinTilde:string[], conTilde:string[]}} vocab
 * @param {{largo?:number, semilla?:number, conTilde?:boolean}} o
 */
export function generarRefuerzo(debiles, vocab, { largo = 140, semilla = Date.now(), conTilde = false } = {}) {
  const rng = mulberry(semilla);
  const letras = debiles.filter((c) => c.trim());
  const base = conTilde ? [...vocab.sinTilde, ...vocab.conTilde] : vocab.sinTilde;
  const conLetra = base.filter((w) => letras.some((c) => w.toLowerCase().includes(c.toLowerCase())));
  const pool = conLetra.length >= 6 ? conLetra : base;
  const out = []; let len = 0, ult = '';
  while (len < largo) {
    let w = pick(rng, pool);
    if (w === ult && pool.length > 3) continue;
    ult = w;
    // a veces se repite la tecla débil sola, como calentamiento
    if (rng() < 0.12 && letras.length) w = `${letras[0]}${letras[0]} ${w}`;
    out.push(w); len += w.length + 1;
  }
  const t = out.join(' ');
  if (t.length <= largo) return t;
  const c = t.slice(0, largo + 1); const i = c.lastIndexOf(' ');
  return (i > largo * 0.6 ? c.slice(0, i) : t.slice(0, largo)).trim();
}

/** Calentamiento: pares y tríos de las teclas débiles. */
export function calentamiento(debiles, { largo = 60, semilla = 7 } = {}) {
  const rng = mulberry(semilla);
  const k = debiles.filter((c) => c.trim());
  if (!k.length) return '';
  const g = []; let len = 0;
  while (len < largo) { const a = pick(rng, k), b = pick(rng, k); const x = pick(rng, [`${a}${a}${a}`, `${a}${b}${a}`, `${a}${a}${b}`]); g.push(x); len += x.length + 1; }
  return g.join(' ').slice(0, largo).trim();
}
