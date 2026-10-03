/**
 * Perfiles de dificultad por grado (valores iniciales).
 * El docente podrá editarlos por clase (Fase 5): se guardan en Firestore config/grade_profiles
 * y, si existen allí, reemplazan a estos.
 */
export const PERFILES_GRADO = {
  2: { grado: 2, ppmMin: 8,  ppmMax: 12, precision: 85, contenido: 'Letras y palabras cortas', signos: false, textoGrande: true },
  3: { grado: 3, ppmMin: 12, ppmMax: 18, precision: 88, contenido: 'Palabras y frases simples', signos: false, textoGrande: false },
  4: { grado: 4, ppmMin: 18, ppmMax: 25, precision: 90, contenido: 'Frases y párrafos cortos con tildes', signos: true, textoGrande: false },
  5: { grado: 5, ppmMin: 25, ppmMax: 32, precision: 92, contenido: 'Párrafos con signos y números', signos: true, textoGrande: false },
  6: { grado: 6, ppmMin: 30, ppmMax: 40, precision: 93, contenido: 'Textos largos, mayúsculas y símbolos', signos: true, textoGrande: false },
};

export const GRADOS = [2, 3, 4, 5, 6];
export const nombreGrado = (g) => `${g}.º`;
export const perfilDeGrado = (g) => PERFILES_GRADO[g] || PERFILES_GRADO[3];
