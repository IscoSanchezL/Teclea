/**
 * Aviso de privacidad (plantilla) — Ley 1581 de 2012 (habeas data) y Decreto 1377 de 2013.
 * IMPORTANTE: revísalo con el área jurídica del colegio antes de usarlo con estudiantes.
 */
import { marca } from '../../core/marca.js';
import { CONFIG } from '../../core/config.js';
import { h } from '../../core/utils.js';

export async function render() {
  const li = (...x) => h('li', {}, ...x);
  return h('article', { class: 'card card--vidrio texto-legal' },
    h('h1', {}, 'Aviso de privacidad'),
    h('p', { class: 'suave' }, `Versión ${CONFIG.versionAvisoPrivacidad} · Plantilla pendiente de revisión por el colegio`),

    h('h2', {}, '¿Quién es el responsable?'),
    h('p', {}, `${marca.colegio} es el responsable del tratamiento de los datos que se recogen en ${marca.nombre}. Contacto: `, h('a', { href: `mailto:${CONFIG.contacto}` }, CONFIG.contacto), '.'),

    h('h2', {}, '¿Para qué usamos los datos?'),
    h('p', {}, 'Únicamente para fines pedagógicos: enseñar mecanografía, guardar tu progreso, permitir que tu docente acompañe tu aprendizaje y mostrarte tus logros.'),

    h('h2', {}, '¿Qué datos guardamos?'),
    h('ul', {},
      li('Nombre o apodo, grado y avatar.'),
      li('Correo electrónico (solo si ingresas con Google). Con código de clase no se guarda ningún correo real.'),
      li('Resultados de práctica: velocidad, precisión, errores por tecla y tiempo practicado.'),
      li('Medallas, puntos, monedas y preferencias de accesibilidad.')),
    h('p', {}, 'No guardamos fotografías, dirección, teléfono ni ubicación.'),

    h('h2', {}, '¿Qué NO hacemos?'),
    h('ul', {},
      li('No mostramos publicidad.'),
      li('No usamos rastreadores ni analítica de terceros.'),
      li('No vendemos ni compartimos datos con terceros.'),
      li('No mostramos nombres completos de menores en rankings: solo apodos.')),

    h('h2', {}, 'Datos de niños, niñas y adolescentes'),
    h('p', {}, 'El tratamiento se hace respetando el interés superior y los derechos prevalentes de los menores, con autorización del colegio y de sus representantes legales (acudientes), y limitado a lo estrictamente necesario.'),

    h('h2', {}, 'Tus derechos'),
    h('p', {}, 'Tú, o tus acudientes, pueden conocer, actualizar, rectificar y suprimir los datos, y revocar la autorización. En “Perfil y ajustes” puedes descargar tus datos y pedir su eliminación; también puedes escribirnos al correo de contacto.'),

    h('h2', {}, 'Dónde se almacenan'),
    h('p', {}, 'En Google Firebase (Authentication y Cloud Firestore), con reglas de seguridad que limitan el acceso: cada estudiante ve lo suyo, cada docente ve sus clases.'),

    h('a', { class: 'btn btn--suave', href: '#/' }, 'Volver'));
}
