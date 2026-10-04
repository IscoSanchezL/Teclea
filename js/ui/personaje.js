/**
 * Mascotas de TECLEA dibujadas en SVG. Todas comparten el mismo "esqueleto" (cabeza, ojos, cuerpo),
 * así los accesorios —también dibujados a medida— encajan igual de bien en cualquiera.
 *
 *   personajeSVG('zorro', { acc: ['🧢', '🕶️'], tam: 220 })        → personaje completo
 *   personajeSVG('panda', { acc: ['👑'], cabeza: true, tam: 48 })   → solo la cabeza (para avatares)
 *
 * Lienzo 200 × 240. Anclas: cabeza centro (100, 96) · coronilla y = 46 · ojos (76, 98) y (124, 98) · cuerpo y = 120–222.
 */
import { h } from '../core/utils.js';

export const ESPECIES = {
  zorro: { nombre: 'Zorro', gratis: true, a: '#FFA24D', b: '#E8641B', v: '#FFF1DE', o: '#3B2314', n: '#2B1A3A' },
  panda: { nombre: 'Panda', gratis: true, a: '#FFFFFF', b: '#DADCE8', v: '#FFFFFF', o: '#2B2B3A', n: '#2B2B3A' },
  gato: { nombre: 'Gato', a: '#B7C3E0', b: '#7B89B5', v: '#EEF1FA', o: '#FF9FB5', n: '#E86A8A' },
  conejo: { nombre: 'Conejo', a: '#F6E9FF', b: '#CDB4F0', v: '#FFFFFF', o: '#FFB3CF', n: '#E86A8A' },
  dragon: { nombre: 'Dragón', a: '#6FE3B5', b: '#1FA67A', v: '#E8FFD9', o: '#FFE9A8', n: '#0F6B4D' },
  robot: { nombre: 'Robot', a: '#E8EEFF', b: '#8FA0D6', v: '#C9D4F5', o: '#4FC3F0', n: '#2B3A7A' },
};
export const ESPECIE_POR_EMOJI = { '🦊': 'zorro', '🐼': 'panda', '🐯': 'gato', '🦁': 'gato', '🦄': 'conejo', '🐲': 'dragon', '🦖': 'dragon', '🤖': 'robot' };
export const especieDe = (av = {}) => (ESPECIES[av.mascota] ? av.mascota : ESPECIE_POR_EMOJI[av.emoji] || 'zorro');

let n = 0;
const OJO = '#1B1340';

/* ── Piezas comunes ── */
const cuerpo = (id, p) => `
  <ellipse cx="76" cy="219" rx="19" ry="9" fill="url(#${id}b)"/><ellipse cx="124" cy="219" rx="19" ry="9" fill="url(#${id}b)"/>
  <path d="M54 172C54 134 76 122 100 122s46 12 46 50c0 34-19 52-46 52s-46-18-46-52z" fill="url(#${id}a)"/>
  <ellipse cx="100" cy="184" rx="27" ry="33" fill="${p.v}" opacity=".95"/>
  <ellipse cx="55" cy="168" rx="11" ry="21" transform="rotate(16 55 168)" fill="url(#${id}a)"/><ellipse cx="145" cy="168" rx="11" ry="21" transform="rotate(-16 145 168)" fill="url(#${id}a)"/>`;
const cabeza = (id) => `<ellipse cx="100" cy="96" rx="58" ry="50" fill="url(#${id}a)"/><ellipse cx="76" cy="66" rx="24" ry="9" fill="#fff" opacity=".28" transform="rotate(-22 76 66)"/>`;
const ojos = (extra = '') => `
  <ellipse cx="76" cy="98" rx="10" ry="12.5" fill="${OJO}"/><ellipse cx="124" cy="98" rx="10" ry="12.5" fill="${OJO}"/>
  <circle cx="72.5" cy="93" r="4.2" fill="#fff"/><circle cx="120.5" cy="93" r="4.2" fill="#fff"/><circle cx="80" cy="103" r="2" fill="#fff" opacity=".8"/><circle cx="128" cy="103" r="2" fill="#fff" opacity=".8"/>${extra}`;
const mejillas = `<ellipse cx="58" cy="118" rx="9" ry="6" fill="#FF8FA8" opacity=".55"/><ellipse cx="142" cy="118" rx="9" ry="6" fill="#FF8FA8" opacity=".55"/>`;
const sonrisa = (c = OJO) => `<path d="M91 121Q100 130 109 121" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;

/* ── Cada especie: lo que va detrás, las orejas y la cara ── */
const ESP = {
  zorro: (id, p) => ({
    atras: `<path d="M138 190C186 190 196 142 176 120C176 150 158 160 138 164z" fill="url(#${id}a)"/><path d="M176 120C190 134 186 152 176 160C170 146 172 132 176 120z" fill="#fff"/>`,
    orejas: `<path d="M48 64L44 16L86 46z" fill="url(#${id}a)"/><path d="M152 64L156 16L114 46z" fill="url(#${id}a)"/><path d="M54 54L52 28L74 46z" fill="${p.o}"/><path d="M146 54L148 28L126 46z" fill="${p.o}"/>`,
    cara: `<path d="M44 108C62 100 82 122 100 126C118 122 138 100 156 108C150 134 128 146 100 146C72 146 50 134 44 108z" fill="#fff"/>${ojos()}<path d="M94 112Q100 108 106 112Q104 120 100 120Q96 120 94 112z" fill="${p.n}"/>${sonrisa()}${mejillas}`,
  }),
  panda: (id, p) => ({
    atras: '',
    orejas: `<circle cx="56" cy="58" r="21" fill="${p.o}"/><circle cx="144" cy="58" r="21" fill="${p.o}"/><circle cx="56" cy="58" r="9" fill="#5B5B72"/><circle cx="144" cy="58" r="9" fill="#5B5B72"/>`,
    cara: `<ellipse cx="76" cy="99" rx="16" ry="19" transform="rotate(-18 76 99)" fill="${p.o}"/><ellipse cx="124" cy="99" rx="16" ry="19" transform="rotate(18 124 99)" fill="${p.o}"/>
      <circle cx="76" cy="98" r="8.5" fill="#fff"/><circle cx="124" cy="98" r="8.5" fill="#fff"/><circle cx="77" cy="99" r="5.2" fill="${OJO}"/><circle cx="123" cy="99" r="5.2" fill="${OJO}"/><circle cx="75" cy="96.5" r="2" fill="#fff"/><circle cx="121" cy="96.5" r="2" fill="#fff"/>
      <ellipse cx="100" cy="116" rx="8" ry="5.6" fill="${p.n}"/>${sonrisa('#2B2B3A')}${mejillas}`,
    extraCuerpo: `<ellipse cx="55" cy="170" rx="11" ry="21" transform="rotate(16 55 170)" fill="${p.o}"/><ellipse cx="145" cy="170" rx="11" ry="21" transform="rotate(-16 145 170)" fill="${p.o}"/><ellipse cx="76" cy="219" rx="19" ry="9" fill="${p.o}"/><ellipse cx="124" cy="219" rx="19" ry="9" fill="${p.o}"/>`,
  }),
  gato: (id, p) => ({
    atras: `<path d="M140 206C190 206 200 160 184 128C178 128 182 150 170 170C160 186 148 190 140 190z" fill="url(#${id}b)"/>`,
    orejas: `<path d="M46 70L50 18L92 48z" fill="url(#${id}a)"/><path d="M154 70L150 18L108 48z" fill="url(#${id}a)"/><path d="M54 58L56 32L76 48z" fill="${p.o}"/><path d="M146 58L144 32L124 48z" fill="${p.o}"/>`,
    cara: `${ojos()}<path d="M94 110L106 110L100 118z" fill="${p.n}"/><path d="M100 118Q100 124 92 124M100 118Q100 124 108 124" fill="none" stroke="${OJO}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M40 112L68 116M40 124L68 122M160 112L132 116M160 124L132 122" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
      <path d="M90 56L92 68M100 54L100 68M110 56L108 68" stroke="${p.b}" stroke-width="4" stroke-linecap="round"/>${mejillas}`,
  }),
  conejo: (id, p) => ({
    atras: `<circle cx="150" cy="210" r="15" fill="#fff"/>`,
    orejas: `<ellipse cx="74" cy="22" rx="16" ry="44" transform="rotate(-8 74 22)" fill="url(#${id}a)"/><ellipse cx="126" cy="22" rx="16" ry="44" transform="rotate(8 126 22)" fill="url(#${id}a)"/><ellipse cx="74" cy="26" rx="7" ry="32" transform="rotate(-8 74 26)" fill="${p.o}"/><ellipse cx="126" cy="26" rx="7" ry="32" transform="rotate(8 126 26)" fill="${p.o}"/>`,
    cara: `${ojos()}<path d="M94 111Q100 107 106 111Q104 117 100 117Q96 117 94 111z" fill="${p.n}"/><path d="M100 117L100 122" stroke="${OJO}" stroke-width="2.6" stroke-linecap="round"/>${sonrisa()}<rect x="94.5" y="124" width="5" height="8" rx="1.5" fill="#fff" stroke="#CDB4F0" stroke-width="1"/><rect x="100.5" y="124" width="5" height="8" rx="1.5" fill="#fff" stroke="#CDB4F0" stroke-width="1"/>${mejillas}`,
  }),
  dragon: (id, p) => ({
    atras: `<path d="M56 150C14 126 8 170 22 186C34 168 48 168 60 172z" fill="${p.b}"/><path d="M144 150C186 126 192 170 178 186C166 168 152 168 140 172z" fill="${p.b}"/><path d="M138 206C176 206 190 182 186 160C178 182 160 188 138 190z" fill="url(#${id}b)"/><path d="M184 168L196 156L192 176z" fill="#FFD04A"/>`,
    orejas: `<path d="M64 62C54 40 58 26 66 16C74 28 82 44 84 56z" fill="${p.o}"/><path d="M136 62C146 40 142 26 134 16C126 28 118 44 116 56z" fill="${p.o}"/><path d="M96 48L100 34L104 48z" fill="#FFD04A"/>`,
    cara: `${ojos()}<ellipse cx="100" cy="116" rx="22" ry="14" fill="${p.v}" opacity=".9"/><circle cx="93" cy="113" r="2.4" fill="${p.n}"/><circle cx="107" cy="113" r="2.4" fill="${p.n}"/><path d="M90 122Q100 130 110 122" fill="none" stroke="${p.n}" stroke-width="3" stroke-linecap="round"/><path d="M95 124L97 129L99 124M101 124L103 129L105 124" fill="#fff"/>${mejillas}`,
  }),
  robot: (id, p) => ({
    atras: '',
    orejas: `<rect x="34" y="84" width="16" height="36" rx="7" fill="${p.b}"/><rect x="150" y="84" width="16" height="36" rx="7" fill="${p.b}"/><rect x="96" y="30" width="8" height="22" fill="${p.b}"/><circle cx="100" cy="28" r="9" fill="#FF6B8B"/><circle cx="97" cy="25" r="3" fill="#fff" opacity=".8"/>`,
    cabezaPropia: `<rect x="42" y="50" width="116" height="94" rx="30" fill="url(#${id}a)"/><rect x="52" y="60" width="96" height="74" rx="22" fill="#1F2A5C"/><ellipse cx="76" cy="62" rx="22" ry="6" fill="#fff" opacity=".3" transform="rotate(-18 76 62)"/>`,
    cara: `<rect x="62" y="82" width="26" height="26" rx="9" fill="#4FE3FF"/><rect x="112" y="82" width="26" height="26" rx="9" fill="#4FE3FF"/><circle cx="72" cy="91" r="4" fill="#fff"/><circle cx="122" cy="91" r="4" fill="#fff"/>
      <path d="M82 118H118" stroke="#4FE3FF" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 5"/><circle cx="62" cy="116" r="4.5" fill="#FF8FA8" opacity=".8"/><circle cx="138" cy="116" r="4.5" fill="#FF8FA8" opacity=".8"/>`,
  }),
};

/* ── Accesorios dibujados a medida para el esqueleto común ── */
const ACC = {
  '🧢': { zona: 'cabeza', svg: (id) => `<path d="M50 74C48 36 82 26 100 26s52 10 50 48z" fill="url(#${id}g1)"/><path d="M100 26C84 36 80 56 82 74" stroke="#1E4FB8" stroke-width="2" fill="none" opacity=".5"/><circle cx="100" cy="26" r="5" fill="#1E4FB8"/><path d="M92 72Q150 62 182 78Q152 92 96 82z" fill="#1E4FB8"/><path d="M50 74Q100 84 150 74" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>` },
  '🎩': { zona: 'cabeza', svg: () => `<ellipse cx="100" cy="64" rx="64" ry="12" fill="#1B1B2E"/><path d="M68 62L72 14Q100 6 128 14L132 62Q100 70 68 62z" fill="#2A2A44"/><ellipse cx="100" cy="14" rx="28" ry="7" fill="#3A3A5C"/><path d="M69 50Q100 58 131 50L132 62Q100 70 68 62z" fill="#C0392B"/><rect x="94" y="52" width="12" height="11" rx="2" fill="#FFD04A"/>` },
  '👑': { zona: 'cabeza', svg: (id) => `<path d="M62 66L58 26L82 44L100 18L118 44L142 26L138 66z" fill="url(#${id}g2)" stroke="#B8860B" stroke-width="2.4" stroke-linejoin="round"/><rect x="62" y="60" width="76" height="12" rx="4" fill="#E0A800"/><circle cx="58" cy="26" r="5" fill="#FF6B8B"/><circle cx="100" cy="18" r="6" fill="#4FC3F0"/><circle cx="142" cy="26" r="5" fill="#FF6B8B"/><circle cx="100" cy="66" r="4" fill="#E8463D"/><circle cx="80" cy="66" r="3" fill="#4FC3F0"/><circle cx="120" cy="66" r="3" fill="#4FC3F0"/>` },
  '🎓': { zona: 'cabeza', svg: () => `<path d="M64 62L68 80Q100 92 132 80L136 62z" fill="#26264A"/><polygon points="100,22 176,46 100,70 24,46" fill="#34346A"/><polygon points="100,22 176,46 100,70 24,46" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/><path d="M158 50L160 88" stroke="#FFD04A" stroke-width="3" stroke-linecap="round"/><path d="M156 88h8l2 14h-12z" fill="#FFD04A"/><circle cx="100" cy="46" r="4" fill="#FFD04A"/>` },
  '🎧': { zona: 'cabeza', svg: () => `<path d="M42 100C38 42 70 26 100 26s62 16 58 74" fill="none" stroke="#2B2B44" stroke-width="9" stroke-linecap="round"/><rect x="30" y="80" width="26" height="42" rx="12" fill="#FF6B8B"/><rect x="144" y="80" width="26" height="42" rx="12" fill="#FF6B8B"/><rect x="36" y="86" width="14" height="30" rx="7" fill="#C2294A"/><rect x="150" y="86" width="14" height="30" rx="7" fill="#C2294A"/>` },
  '🕶️': { zona: 'cara', svg: () => `<path d="M52 92Q76 84 98 92L102 92Q124 84 148 92" fill="none" stroke="#14142A" stroke-width="4"/><path d="M56 90H96V108Q96 122 76 122Q56 122 56 106z" fill="#14142A"/><path d="M104 90H144V106Q144 122 124 122Q104 122 104 108z" fill="#14142A"/><path d="M62 96L74 96L66 108z" fill="#fff" opacity=".35"/><path d="M110 96L122 96L114 108z" fill="#fff" opacity=".35"/>` },
  '👓': { zona: 'cara', svg: () => `<circle cx="76" cy="98" r="19" fill="#fff" fill-opacity=".18" stroke="#B8860B" stroke-width="4"/><circle cx="124" cy="98" r="19" fill="#fff" fill-opacity=".18" stroke="#B8860B" stroke-width="4"/><path d="M95 96Q100 92 105 96" stroke="#B8860B" stroke-width="4" fill="none"/><path d="M57 94L44 88M143 94L156 88" stroke="#B8860B" stroke-width="4" stroke-linecap="round"/><path d="M66 90Q72 86 80 88" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>` },
  '🏴‍☠️': { zona: 'cara', svg: () => `<path d="M46 72L154 92" stroke="#14142A" stroke-width="5"/><ellipse cx="76" cy="98" rx="19" ry="16" fill="#14142A"/><path d="M68 94L84 102M84 94L68 102" stroke="#fff" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>` },
  '🦸': { zona: 'espalda', svg: () => `<path d="M62 132C40 170 30 200 24 228C60 236 140 236 176 228C170 200 160 170 138 132z" fill="url(#CAPA)"/><path d="M62 132C70 140 130 140 138 132L136 142C120 150 80 150 64 142z" fill="#8F1B38"/>`, delante: `<circle cx="100" cy="140" r="6" fill="#FFD04A" stroke="#B8860B" stroke-width="1.6"/>` },
  '🌈': { zona: 'espalda', svg: () => ['#FF5C7A', '#FFA24D', '#FFD04A', '#3DDBB0', '#4FC3F0', '#8A70FA'].map((c, i) => `<path d="M${14 + i * 7} 196A${86 - i * 7} ${86 - i * 7} 0 0 1 ${186 - i * 7} 196" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`).join('') },
};

export const zonaDeAccesorio = (emoji) => ACC[emoji]?.zona || null;

export function personajeSVG(especie = 'zorro', { acc = [], tam = 200, cabeza: soloCabeza = false, clase = '' } = {}) {
  const sp = ESPECIES[especie] ? especie : 'zorro', p = ESPECIES[sp], id = `pj${++n}`;
  const e = ESP[sp](id, p);
  const puestos = { cabeza: null, cara: null, espalda: null };
  for (const em of acc) { const z = ACC[em]?.zona; if (z) puestos[z] = em; }
  const dib = (em) => (em ? ACC[em].svg(id) : '');
  const capaDelante = puestos.espalda && ACC[puestos.espalda].delante ? ACC[puestos.espalda].delante : '';
  const defs = `<defs>
    <linearGradient id="${id}a" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.b}"/><stop offset="1" stop-color="${p.b}"/></linearGradient>
    <linearGradient id="${id}g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C8DFF"/><stop offset="1" stop-color="#2358D6"/></linearGradient>
    <linearGradient id="${id}g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#F2A900"/></linearGradient>
    <linearGradient id="CAPA${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5C7A"/><stop offset="1" stop-color="#B3243F"/></linearGradient>
    <filter id="${id}s" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>`;
  const arte = `${puestos.espalda ? dib(puestos.espalda).replace('url(#CAPA)', `url(#CAPA${id})`) : ''}
    ${e.atras}
    ${cuerpo(id, p)}${e.extraCuerpo || ''}${capaDelante}
    ${e.orejas}${e.cabezaPropia || cabeza(id)}${e.cara}
    ${dib(puestos.cara)}${dib(puestos.cabeza)}`;
  const vb = soloCabeza ? '24 6 152 148' : '0 0 200 240';
  const alto = soloCabeza ? tam * (148 / 152) : tam * 1.2;
  const el = h('span', { class: `pj3d pj3d--${sp} ${clase}`, role: 'img', 'aria-label': `Mascota ${p.nombre}` });
  el.innerHTML = `<svg viewBox="${vb}" width="${tam}" height="${alto}" focusable="false" aria-hidden="true">${defs}${soloCabeza ? '' : `<ellipse cx="100" cy="228" rx="56" ry="7" fill="#140B4A" opacity=".3" filter="url(#${id}s)"/>`}${arte}</svg>`;
  return el;
}
