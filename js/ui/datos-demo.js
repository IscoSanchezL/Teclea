/**
 * Datos de EJEMPLO para previsualizar los paneles de docente/administración.
 * Se reemplazan por consultas reales a Firestore en la Fase 5. Solo apodos (nunca nombres completos).
 */
export const CLASES_DEMO = [
  { id: '4A', nombre: '4.º A', grado: 4, codigo: 'K7M3QX', estudiantes: 8 },
  { id: '4B', nombre: '4.º B', grado: 4, codigo: 'H9R2TD', estudiantes: 6 },
  { id: '5A', nombre: '5.º A', grado: 5, codigo: 'W4N8PB', estudiantes: 6 },
];

// estado: ok | destacado | atrasado | inactivo
export const ESTUDIANTES_DEMO = [
  { apodo: 'Sofi M.',   clase: '4A', ppm: 23, pre: 94, min: 128, ult: 'Hoy',        estado: 'destacado', serie: [14, 16, 17, 19, 20, 21, 22, 23] },
  { apodo: 'Juan D.',   clase: '4A', ppm: 19, pre: 91, min: 96,  ult: 'Hoy',        estado: 'ok',        serie: [12, 13, 15, 15, 17, 18, 18, 19] },
  { apodo: 'Valen R.',  clase: '4A', ppm: 17, pre: 88, min: 74,  ult: 'Ayer',       estado: 'ok',        serie: [11, 12, 12, 14, 15, 16, 17, 17] },
  { apodo: 'Tomás P.',  clase: '4A', ppm: 11, pre: 79, min: 31,  ult: 'Hace 4 días', estado: 'atrasado', serie: [9, 10, 9, 11, 10, 11, 10, 11] },
  { apodo: 'Isa G.',    clase: '4A', ppm: 21, pre: 96, min: 110, ult: 'Hoy',        estado: 'destacado', serie: [13, 15, 17, 18, 19, 20, 20, 21] },
  { apodo: 'Mati L.',   clase: '4A', ppm: 16, pre: 90, min: 66,  ult: 'Hoy',        estado: 'ok',        serie: [10, 12, 13, 14, 14, 15, 16, 16] },
  { apodo: 'Camila S.', clase: '4A', ppm: 9,  pre: 74, min: 18,  ult: 'Hace 9 días', estado: 'inactivo', serie: [8, 9, 9, 8, 9, 9, 9, 9] },
  { apodo: 'Dani O.',   clase: '4A', ppm: 18, pre: 92, min: 88,  ult: 'Ayer',       estado: 'ok',        serie: [12, 14, 14, 16, 16, 17, 18, 18] },
  { apodo: 'Lucía F.',  clase: '4B', ppm: 20, pre: 93, min: 102, ult: 'Hoy',        estado: 'ok',        serie: [13, 14, 16, 17, 18, 19, 19, 20] },
  { apodo: 'Samu B.',   clase: '4B', ppm: 14, pre: 85, min: 52,  ult: 'Hace 3 días', estado: 'atrasado', serie: [11, 11, 12, 13, 12, 13, 14, 14] },
  { apodo: 'Ana K.',    clase: '4B', ppm: 24, pre: 95, min: 140, ult: 'Hoy',        estado: 'destacado', serie: [15, 17, 19, 20, 21, 22, 23, 24] },
  { apodo: 'Leo H.',    clase: '4B', ppm: 17, pre: 89, min: 70,  ult: 'Ayer',       estado: 'ok',        serie: [11, 13, 14, 15, 15, 16, 17, 17] },
  { apodo: 'Nico V.',   clase: '4B', ppm: 15, pre: 87, min: 60,  ult: 'Hoy',        estado: 'ok',        serie: [10, 11, 12, 13, 14, 14, 15, 15] },
  { apodo: 'Emi T.',    clase: '4B', ppm: 12, pre: 81, min: 40,  ult: 'Hace 5 días', estado: 'atrasado', serie: [9, 10, 11, 11, 11, 12, 12, 12] },
  { apodo: 'Pau C.',    clase: '5A', ppm: 29, pre: 95, min: 150, ult: 'Hoy',        estado: 'destacado', serie: [22, 23, 25, 26, 27, 28, 28, 29] },
  { apodo: 'Gabo N.',   clase: '5A', ppm: 26, pre: 92, min: 121, ult: 'Hoy',        estado: 'ok',        serie: [20, 21, 22, 23, 24, 25, 25, 26] },
  { apodo: 'Mari Z.',   clase: '5A', ppm: 24, pre: 90, min: 98,  ult: 'Ayer',       estado: 'ok',        serie: [19, 20, 21, 22, 22, 23, 24, 24] },
  { apodo: 'Seba A.',   clase: '5A', ppm: 18, pre: 83, min: 45,  ult: 'Hace 6 días', estado: 'inactivo', serie: [16, 17, 17, 18, 17, 18, 18, 18] },
];

export const MINUTOS_SEMANA = [
  { etiqueta: 'L', valor: 212 }, { etiqueta: 'M', valor: 268 }, { etiqueta: 'X', valor: 190 },
  { etiqueta: 'J', valor: 305 }, { etiqueta: 'V', valor: 240 }, { etiqueta: 'S', valor: 60 }, { etiqueta: 'D', valor: 35 },
];

// Intensidad de error por tecla (0–1) del grupo
export const ERRORES_TECLAS = { ñ: 1, p: .55, q: .5, z: .45, 'x': .35, b: .3, y: .28, v: .25, c: .2, o: .15, l: .12, w: .35, t: .1, g: .1, h: .08 };

export const ACTIVIDAD_DEMO = [
  { quien: 'Ana K.', que: 'completó el Mundo 4 con 3 estrellas', cuando: 'hace 12 min', icono: 'star' },
  { quien: 'Pau C.', que: 'superó su mejor marca: 29 PPM', cuando: 'hace 35 min', icono: 'chart' },
  { quien: 'Tomás P.', que: 'lleva 4 días sin practicar', cuando: 'alerta', icono: 'alert' },
  { quien: 'Lucía F.', que: 'entregó “Frases con tildes”', cuando: 'hace 1 h', icono: 'check' },
  { quien: 'Camila S.', que: 'lleva 9 días sin practicar', cuando: 'alerta', icono: 'alert' },
];
