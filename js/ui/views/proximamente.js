/**
 * Marcador de posición elegante para secciones que se construyen en fases posteriores.
 */
import { h } from '../../core/utils.js';
import { mascota } from '../art.js';

const SECCIONES = {
  aprende:  { fase: 2, titulo: 'Aprende a teclear', pose: 'piensa', texto: 'Aquí vivirá tu curso: postura, posición de manos y los 10 mundos con el motor de escritura.', incluye: ['Introducción interactiva', 'Teclado virtual con manos', 'Lecciones guiadas y estrellas'] },
  practica: { fase: 2, titulo: 'Práctica libre', pose: 'anima', texto: 'Elige un tema, la dificultad y cuánto tiempo quieres practicar: 1, 2, 3 o 5 minutos.', incluye: ['Textos por tema', 'Duración a tu medida', 'Refuerzo de tus teclas débiles'] },
  juegos:   { fase: 4, titulo: 'Juegos', pose: 'celebra', texto: 'Carreras, lluvia de palabras, rescates y duelos contra el tiempo. ¡Todo con tu teclado!', incluye: ['Carrera de cohetes', 'Lluvia de palabras', 'Tiro al blanco de letras'] },
  logros:   { fase: 4, titulo: 'Mis logros', pose: 'celebra', texto: 'Tu vitrina de medallas, tu racha, estadísticas y certificados.', incluye: ['40+ medallas ilustradas', 'Racha con llama', 'Certificados en PDF'] },
  clases:   { fase: 5, titulo: 'Mis clases', pose: 'senala', texto: 'Únete con el código de tu clase y mira las tareas que tu profe te asignó.', incluye: ['Unirse con código', 'Tareas con fecha límite', 'Reto colectivo de la clase'] },
  docente:  { fase: 5, titulo: 'Panel docente', pose: 'senala', texto: 'Crea clases, asigna ejercicios y mira el progreso de tu grupo.', incluye: ['Clases y códigos QR', 'Mapa de calor de errores', 'Reportes CSV y PDF'] },
  admin:    { fase: 6, titulo: 'Panel de administración', pose: 'piensa', texto: 'Gestiona docentes, contenido, medallas, tienda y copias de respaldo.', incluye: ['Lista blanca de docentes', 'CRUD de lecciones', 'Registro de actividad'] },
};

export async function render({ clave }) {
  const s = SECCIONES[clave] || SECCIONES.aprende;
  return h('section', { class: 'proximamente card card--vidrio' },
    mascota(s.pose, { tam: 'xl' }),
    h('div', { class: 'proximamente__texto' },
      h('span', { class: 'etiqueta etiqueta--sol' }, `Llega en la Fase ${s.fase}`),
      h('h1', {}, s.titulo),
      h('p', {}, s.texto),
      h('ul', { class: 'lista-check' }, s.incluye.map((t) => h('li', {}, t))),
      h('a', { class: 'btn btn--suave', href: '#/' }, 'Volver al inicio')));
}
