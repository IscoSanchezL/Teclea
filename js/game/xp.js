/**
 * Reglas de puntos (XP), monedas y racha diaria. Lógica pura (se prueba en Node).
 * Topes alineados con firestore.rules: +600 XP y +300 monedas por escritura, racha +1 por escritura.
 */
import { perfilDeGrado } from '../core/grados.js';

const pad = (n) => String(n).padStart(2, '0');
/** Fecha local AAAA-MM-DD */
export const hoyISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const diasEntre = (a, b) => {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

/** XP de una lección. Devuelve {total, desglose:[[motivo, puntos]]}. */
export function xpLeccion({ estrellas, precision, ppm, primeraVez = false, grado = 4 }) {
  const d = [];
  if (estrellas >= 1) d.push(['Lección completada', 20]);
  if (estrellas > 0) d.push([`${estrellas} ${estrellas === 1 ? 'estrella' : 'estrellas'}`, estrellas * 15]);
  if (precision >= 98) d.push(['Precisión casi perfecta', 20]); else if (precision >= 95) d.push(['Gran precisión', 10]);
  const p = perfilDeGrado(grado);
  if (ppm >= p.ppmMax) d.push(['Velocidad de tu grado', 20]); else if (ppm >= p.ppmMin) d.push(['Buen ritmo', 10]);
  if (primeraVez && estrellas >= 1) d.push(['Primera vez', 25]);
  const total = Math.min(150, d.reduce((s, [, x]) => s + x, 0));
  return { total, desglose: d };
}

/** XP de una práctica libre (1–5 min). */
export function xpPractica({ segundos, precision, ppm, grado = 4 }) {
  const min = segundos / 60;
  const d = [[`${Math.max(1, Math.round(min))} min de práctica`, Math.min(40, Math.round(min * 8))]];
  if (precision >= 95) d.push(['Gran precisión', 10]);
  if (ppm >= perfilDeGrado(grado).ppmMin) d.push(['Buen ritmo', 10]);
  return { total: Math.min(70, d.reduce((s, [, x]) => s + x, 0)), desglose: d };
}

/** XP de un minijuego a partir de sus puntos (0–1000). */
export const xpJuego = (puntos) => ({ total: Math.max(5, Math.min(60, Math.round(puntos / 12))), desglose: [['Minijuego', Math.max(5, Math.min(60, Math.round(puntos / 12)))]] });

/** Monedas ganadas: 1 por cada 4 XP (tope 300 por escritura, igual que las reglas). */
export const monedasDeXP = (xp) => Math.min(300, Math.floor(xp / 4));

/**
 * Actualiza la racha. Un protector cubre exactamente UN día perdido.
 * @returns {{racha, rachaMax, ultimoDia, protectores, cambio, usoProtector, perdio}}
 */
export function actualizarRacha({ racha = 0, rachaMax = 0, ultimoDia = null, protectores = 0 }, hoy = hoyISO()) {
  if (ultimoDia === hoy) return { racha, rachaMax, ultimoDia, protectores, cambio: false, usoProtector: false, perdio: false };
  let nueva = 1, usoProtector = false, perdio = false;
  if (ultimoDia) {
    const dif = diasEntre(ultimoDia, hoy);
    if (dif === 1) nueva = racha + 1;
    else if (dif === 2 && protectores > 0) { nueva = racha + 1; usoProtector = true; }
    else if (dif > 1) { nueva = 1; perdio = racha > 1; }
    else if (dif < 0) return { racha, rachaMax, ultimoDia, protectores, cambio: false, usoProtector: false, perdio: false }; // reloj atrasado: no tocar
  }
  return {
    racha: nueva, rachaMax: Math.max(rachaMax, nueva), ultimoDia: hoy,
    protectores: usoProtector ? protectores - 1 : protectores, cambio: true, usoProtector, perdio,
  };
}
