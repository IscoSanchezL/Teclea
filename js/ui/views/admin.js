/**
 * Administración (vista sobria). Salud del sistema = datos REALES del dispositivo;
 * lista blanca y auditoría = datos de ejemplo hasta la Fase 6.
 */
import { CONFIG, firebaseConfigurado } from '../../core/config.js';
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { icono } from '../icons.js';
import { toast } from '../overlay.js';
import { avisoDemo } from './_staff.js';

const fila = (clave, valor, estado) => h('li', { class: 'estado-fila' }, h('span', {}, clave), h('strong', { class: estado ? `estado--${estado}` : '' }, valor));

async function diagnostico() {
  const sw = 'serviceWorker' in navigator ? ((await navigator.serviceWorker.getRegistration())?.active ? 'Activo' : 'No instalado') : 'No compatible';
  let cache = '—';
  try { cache = (await (await fetch('precache.json', { cache: 'no-store' })).json()).version; } catch { /* sin red */ }
  let archivos = 0;
  try { for (const k of await caches.keys()) archivos += (await (await caches.open(k)).keys()).length; } catch { /* sin caché */ }
  const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
  return { sw, cache, archivos, usoMB: est ? (est.usage / 1048576).toFixed(1) : '—' };
}

export async function render() {
  const d = await diagnostico();
  const nube = state.modo === 'firebase';
  const lista = h('ul', { class: 'estado' },
    fila('Conexión', navigator.onLine ? 'En línea' : 'Sin conexión', navigator.onLine ? 'ok' : 'alerta'),
    fila('Base de datos', nube ? 'Firebase (Firestore)' : 'Modo demo local', nube ? 'ok' : 'alerta'),
    fila('Modo sin conexión (service worker)', d.sw, d.sw === 'Activo' ? 'ok' : 'alerta'),
    fila('Archivos guardados en el dispositivo', `${d.archivos} · ${d.usoMB} MB`),
    fila('Versión de la app en caché', d.cache),
    fila('Versión', `v${CONFIG.version}`),
    fila('Firebase configurado', firebaseConfigurado() ? 'Sí' : 'No — edita js/core/config.js', firebaseConfigurado() ? 'ok' : 'alerta'));

  const cuota = (nombre, usado, limite) => h('div', { class: 'cuota' },
    h('div', { class: 'cuota__tit' }, h('span', {}, nombre), h('span', { class: 'suave' }, `${usado.toLocaleString('es-CO')} / ${limite.toLocaleString('es-CO')}`)),
    h('div', { class: 'cuota__barra', role: 'img', 'aria-label': `${nombre}: ${Math.round((usado / limite) * 100)} % de la cuota diaria` }, h('i', { style: { width: `${(usado / limite) * 100}%` } })));

  const docentes = [['coordinacion@tu-colegio.edu.co', 'Coordinación', 'Activo'], ['profe.tecnologia@tu-colegio.edu.co', 'Tecnología', 'Activo'], ['profe.ingles@tu-colegio.edu.co', 'Inglés', 'Pendiente']];
  const auditoria = [['Ayer 16:42', 'admin', 'Agregó docente a la lista blanca'], ['Ayer 09:10', 'docente', 'Creó la clase 4.º A'], ['Lun 14:05', 'admin', 'Exportó respaldo JSON'], ['Lun 08:31', 'docente', 'Cambió meta de 4.º a 18–25 PPM']];

  return h('div', { class: 'pagina' },
    h('header', { class: 'pagina__cab' },
      h('div', {}, h('h1', {}, 'Administración'), h('p', { class: 'suave' }, 'Salud del sistema, docentes autorizados y registro de actividad')),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => toast('El respaldo manual llega en la Fase 6. El automático se configura con docs/CONFIABILIDAD.md', { tipo: 'info', ms: 5200 }) }, icono('download', { tam: 16 }), 'Exportar respaldo')),
    avisoDemo('Salud del sistema muestra datos reales de este dispositivo. Docentes, cuotas y auditoría son de ejemplo hasta la Fase 6.'),
    h('div', { class: 'rejilla-2' },
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Salud del sistema'), h('span', { class: 'suave' }, 'este dispositivo')), lista),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Cuota diaria de Firebase'), h('span', { class: 'suave' }, 'plan Spark (ejemplo)')),
        cuota('Lecturas', 4120, 50000), cuota('Escrituras', 2380, 20000), cuota('Borrados', 12, 20000),
        h('p', { class: 'suave pequeno' }, 'Con 30 estudiantes se usa alrededor del 12 % de la cuota. Configura alertas en Google Cloud (ver guía de confiabilidad).'))),
    h('div', { class: 'rejilla-2' },
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Docentes autorizados'), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => toast('Agregar docentes llega en la Fase 6.', { tipo: 'info' }) }, 'Agregar')),
        h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, ['Correo', 'Área', 'Estado'].map((t) => h('th', { scope: 'col' }, t)))),
          h('tbody', {}, docentes.map(([c, a, e]) => h('tr', {}, h('th', { scope: 'row' }, c), h('td', {}, a), h('td', {}, h('span', { class: `pill pill--${e === 'Activo' ? 'ok' : 'atrasado'}` }, h('i'), e)))))))),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Registro de actividad')),
        h('ul', { class: 'actividad' }, auditoria.map(([cuando, quien, que]) => h('li', { class: 'actividad__item' },
          h('span', { class: 'actividad__ic' }, icono('clock', { tam: 16 })), h('span', {}, h('strong', {}, quien), ' ', que), h('time', { class: 'suave' }, cuando)))))));
}
