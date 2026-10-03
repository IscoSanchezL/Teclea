/**
 * Niveles temáticos según XP. (La lógica de ganar XP llega en la Fase 4.)
 */
export const NIVELES = [
  { nivel: 1, nombre: 'Aprendiz del Teclado', xp: 0 },
  { nivel: 2, nombre: 'Explorador de Teclas', xp: 100 },
  { nivel: 3, nombre: 'Dedos Veloces', xp: 300 },
  { nivel: 4, nombre: 'Ninja del Teclado', xp: 700 },
  { nivel: 5, nombre: 'Piloto de Letras', xp: 1300 },
  { nivel: 6, nombre: 'Mago de las Palabras', xp: 2200 },
  { nivel: 7, nombre: 'Capitán Teclista', xp: 3500 },
  { nivel: 8, nombre: 'Campeón Teclista', xp: 5200 },
  { nivel: 9, nombre: 'Gran Maestro', xp: 7500 },
  { nivel: 10, nombre: 'Maestro Teclista', xp: 10000 },
];

/** Devuelve nivel actual, nombre y progreso (0–1) hacia el siguiente. */
export function nivelPorXP(xp = 0) {
  let actual = NIVELES[0];
  for (const n of NIVELES) if (xp >= n.xp) actual = n;
  const siguiente = NIVELES[actual.nivel] || null;
  const progreso = siguiente ? (xp - actual.xp) / (siguiente.xp - actual.xp) : 1;
  return { ...actual, siguiente, progreso: Math.min(1, Math.max(0, progreso)) };
}
