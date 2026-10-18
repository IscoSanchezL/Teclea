/**
 * Acceso moderno (pantalla dividida): código de clase + usuario + clave, Google (estudiantes),
 * Google para docentes (con aprobación del administrador) y modo demostración.
 */
import { firebaseConfigurado } from '../../core/config.js';
import { marca } from '../../core/marca.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { entrarConGoogle, entrarPorLista, entrarDemo, mensajeError } from '../../auth/auth.js';
import { listaPorClave } from '../../db/clases.js';
import { campo } from '../componentes.js';
import { icono } from '../icons.js';
import { logo } from '../logo.js';
import { hero3d } from '../hero3d.js';
import { toast } from '../overlay.js';
import { selectorIdioma } from '../idioma.js';
import { lemaMarca } from '../../core/marca.js';
import { t } from '../../i18n/index.js';

const ALFABETO_CODIGO = /[^A-HJ-NP-Z2-9]/g; // sin 0, O, 1, I (se confunden)
const MODOS = [['codigo', () => t('entrar.modo.codigo')], ['google', () => t('entrar.modo.google')], ['docente', () => t('entrar.modo.docente')]];

export async function render({ query }) {
  const volver = query.volver || '/';
  const ocupado = { v: false };
  let modo = MODOS.some(([m]) => m === query.modo) ? query.modo : 'codigo';

  // ── Consentimiento (Ley 1581) ──
  const consent = h('input', { type: 'checkbox', id: 'consentimiento', onchange: actualizar });
  const bloqueConsent = h('div', { class: 'consentimiento' }, consent,
    h('label', { for: 'consentimiento' }, t('entrar.consent'), ' ',
      h('a', { href: '#/privacidad', target: '_blank', rel: 'noopener' }, t('entrar.consent.link')), '.'));

  // Versión de la app en este dispositivo (sirve para saber si hay una copia vieja guardada)
  const versionApp = h('p', { class: 'suave pequeno', style: { opacity: .6 } }, '');
  fetch('precache.json', { cache: 'no-store' }).then((r) => r.json()).then((j) => { versionApp.textContent = t('entrar.version', { v: String(j.version).slice(0, 8) }); }).catch(() => {});
  const mensaje = h('p', { class: 'mensaje-error', role: 'alert', hidden: true });
  const mostrarError = (t) => { mensaje.textContent = t; mensaje.hidden = !t; };

  // ── Panel: código de clase ──
  const fCodigo = campo({ etiqueta: t('entrar.codigo.etiqueta'), ayuda: t('entrar.codigo.ayuda'), maxlength: 12, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
  fCodigo.input.addEventListener('input', () => { fCodigo.input.value = fCodigo.input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); actualizar(); });
  const btnCodigo = h('button', { class: 'btn btn--primary btn--lg btn--bloque', type: 'submit' }, t('entrar.codigo.ver'), icono('arrow', { tam: 20 }));
  const pasoCodigo = h('form', { class: 'login__form', novalidate: true, onsubmit: alCodigo }, fCodigo.nodo, btnCodigo);
  const pasoNombres = h('div', { class: 'login__form', hidden: true });
  const panelCodigo = h('div', { class: 'login__form', id: 'panel-codigo', role: 'tabpanel', 'aria-labelledby': 'tab-codigo' }, pasoCodigo, pasoNombres);
  let botonesNombre = [];

  // ── Paneles de Google ──
  const btnGoogle = h('button', { class: 'btn btn--google btn--lg btn--bloque', type: 'button', onclick: () => alGoogle(false) }, icono('google', { tam: 22 }), t('entrar.google.continuar'));
  const panelGoogle = h('div', { class: 'login__form', id: 'panel-google', role: 'tabpanel', 'aria-labelledby': 'tab-google' },
    h('p', { class: 'login__sub' }, t('entrar.google.sub')), btnGoogle);
  const btnDocente = h('button', { class: 'btn btn--google btn--lg btn--bloque', type: 'button', onclick: () => alGoogle(true) }, icono('google', { tam: 22 }), t('entrar.google.continuar'));
  const panelDocente = h('div', { class: 'login__form', id: 'panel-docente', role: 'tabpanel', 'aria-labelledby': 'tab-docente' },
    h('p', { class: 'login__sub' }, t('entrar.docente.a'), ' ', h('strong', {}, t('entrar.docente.b')), ' ', t('entrar.docente.c')),
    btnDocente);

  // ── Demo ──
  const demo = firebaseConfigurado() ? null : h('details', { class: 'demo-det' },
    h('summary', {}, t('entrar.demo.titulo')),
    h('p', { class: 'suave pequeno' }, t('entrar.demo.texto')),
    h('div', {},
      [2, 3, 4, 5, 6].map((g) => h('button', { class: 'btn btn--mint btn--sm', type: 'button', onclick: () => alDemo('estudiante', g) }, t('entrar.demo.estudiante', { g }))),
      h('button', { class: 'btn btn--sun btn--sm', type: 'button', onclick: () => alDemo('docente') }, t('entrar.demo.docente')),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => alDemo('pendiente') }, t('entrar.demo.pendiente')),
      h('button', { class: 'btn btn--coral btn--sm', type: 'button', onclick: () => alDemo('admin') }, t('entrar.demo.admin'))));

  // ── Pestañas ──
  const tabs = h('div', { class: 'tabs tabs--3', role: 'tablist', 'aria-label': t('entrar.formaDeEntrar'), onkeydown: (e) => {
    const i = MODOS.findIndex(([m]) => m === modo);
    if (e.key === 'ArrowRight') cambiarModo(MODOS[(i + 1) % 3][0], true);
    if (e.key === 'ArrowLeft') cambiarModo(MODOS[(i + 2) % 3][0], true);
  } }, MODOS.map(([m, etiqueta]) => h('button', { class: 'tab', role: 'tab', id: `tab-${m}`, 'aria-controls': `panel-${m}`, type: 'button', onclick: () => cambiarModo(m) }, etiqueta())));
  const paneles = { codigo: panelCodigo, google: panelGoogle, docente: panelDocente };

  function cambiarModo(m, enfocar = false) {
    modo = m;
    MODOS.forEach(([k]) => {
      const t = tabs.querySelector(`#tab-${k}`); const sel = k === m;
      t.setAttribute('aria-selected', String(sel)); t.tabIndex = sel ? 0 : -1; paneles[k].hidden = !sel;
    });
    mostrarError('');
    if (enfocar) tabs.querySelector(`#tab-${m}`).focus();
    actualizar();
  }
  const codigoValido = () => fCodigo.input.value.length >= 6;
  function actualizar() {
    btnGoogle.disabled = btnDocente.disabled = !consent.checked || ocupado.v;
    btnCodigo.disabled = !consent.checked || !codigoValido() || ocupado.v;
    botonesNombre.forEach((b) => { b.disabled = !consent.checked || ocupado.v; });
  }
  const carga = (v, btn) => { ocupado.v = v; btn.classList.toggle('btn--cargando', v); btn.setAttribute('aria-busy', String(v)); actualizar(); };

  async function alGoogle(docente) {
    const btn = docente ? btnDocente : btnGoogle;
    mostrarError(''); carga(true, btn);
    try { await entrarConGoogle({ docente }); navegar(volver, { reemplazar: true }); }
    catch (e) { console.error(e); mostrarError(mensajeError(e)); }
    finally { carga(false, btn); }
  }
  /** Paso 1: el niño escribe el código de su clase y ve la lista de su salón. */
  async function alCodigo(e) {
    e.preventDefault();
    if (btnCodigo.disabled) return;
    mostrarError(''); carga(true, btnCodigo);
    try {
      const clave = fCodigo.input.value;
      const lista = await listaPorClave(clave);
      if (!lista) { mostrarError(t('entrar.err.noLista')); return; }
      if (!lista.estudiantes?.length) { mostrarError(t('entrar.err.sinEstudiantes')); return; }
      mostrarNombres(clave, lista.estudiantes);
    } catch (err) { console.error(err); mostrarError(mensajeError(err)); }
    finally { carga(false, btnCodigo); }
  }

  /** Paso 2: el niño toca su nombre y entra. */
  function mostrarNombres(clave, estudiantes) {
    botonesNombre = estudiantes.map((x, i) => h('button', { type: 'button', class: 'nombre-btn', onclick: () => entrarNombre(clave, x, i) },
      h('span', { class: 'nombre-btn__emoji', 'aria-hidden': 'true' }, x.e || '🦊'), h('span', { class: 'nombre-btn__alias' }, x.a)));
    pasoCodigo.hidden = true; pasoNombres.hidden = false;
    pasoNombres.replaceChildren(
      h('p', { class: 'login__sub' }, h('strong', {}, clave), ' ', t('entrar.quienEres')),
      h('div', { class: 'nombres-rejilla' }, botonesNombre),
      h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { pasoNombres.hidden = true; pasoCodigo.hidden = false; botonesNombre = []; mostrarError(''); fCodigo.input.focus(); } }, t('entrar.cambiarClase')));
    actualizar();
  }
  async function entrarNombre(clave, x, i) {
    mostrarError(''); const btn = botonesNombre[i]; carga(true, btn);
    try { await entrarPorLista({ clave, usuario: x.u }); navegar(volver, { reemplazar: true }); }
    catch (err) { console.error(err); mostrarError(t('entrar.err.noEntrar')); }
    finally { carga(false, btn); }
  }

  async function alDemo(rol, grado) { await entrarDemo(rol, grado); toast(t('entrar.demoOk', { rol }), { tipo: 'info' }); navegar(volver, { reemplazar: true }); }

  cambiarModo(modo);

  return h('section', { class: 'login' },
    h('div', { class: 'login__visual' },
      h('a', { href: '#/', 'aria-label': t('entrar.volverPortada') }, logo()),
      h('div', { class: 'login__escena' }, hero3d({ compacto: true })),
      h('div', {}, h('h2', {}, t('entrar.lema')), h('p', {}, lemaMarca()),
        h('ul', { class: 'login__lista' }, [t('entrar.punto1'), t('entrar.punto2'), t('entrar.punto3')].map((txt) => h('li', {}, icono('check', { tam: 16 }), txt))))),
    h('div', { class: 'login__panel' },
      h('div', { class: 'login__idioma' }, selectorIdioma()),
      h('div', { class: 'login__form' }, h('h1', {}, t('entrar.bienvenido', { nombre: marca.nombre })), h('p', { class: 'login__sub' }, t('entrar.elige')), tabs),
      panelCodigo, panelGoogle, panelDocente,
      h('div', { class: 'login__form' }, bloqueConsent, mensaje, demo, h('p', { class: 'suave pequeno' }, t('entrar.privacidadCorta')), versionApp)));
}
