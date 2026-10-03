/**
 * Pantalla de acceso: Google, código de clase + usuario + PIN, y modo demo.
 */
import { CONFIG, firebaseConfigurado } from '../../core/config.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { entrarConGoogle, entrarConCodigo, entrarDemo, mensajeError } from '../../auth/auth.js';
import { campo } from '../componentes.js';
import { icono } from '../icons.js';
import { mascota } from '../art.js';
import { toast } from '../overlay.js';

const ALFABETO_CODIGO = /[^A-HJ-NP-Z2-9]/g; // sin 0, O, 1, I (se confunden)

export async function render({ query }) {
  const volver = query.volver || '/';
  const ocupado = { v: false };
  let modo = query.modo === 'codigo' ? 'codigo' : 'google';

  // ── Consentimiento (Ley 1581) ──
  const idConsent = 'consentimiento';
  const consent = h('input', { type: 'checkbox', id: idConsent, onchange: actualizarEstado });
  const bloqueConsent = h('div', { class: 'consentimiento' },
    consent,
    h('label', { for: idConsent },
      'Mi colegio y mis acudientes me dieron permiso para usar esta plataforma. Leí el ',
      h('a', { href: '#/privacidad', target: '_blank', rel: 'noopener' }, 'aviso de privacidad'), '.'));

  const mensaje = h('p', { class: 'mensaje-error', role: 'alert', hidden: true });
  const mostrarError = (txt) => { mensaje.textContent = txt; mensaje.hidden = !txt; };

  // ── Panel Google ──
  const btnGoogle = h('button', { class: 'btn btn--google btn--lg btn--bloque', type: 'button', onclick: alGoogle },
    icono('google', { tam: 22 }), 'Entrar con Google');
  const panelGoogle = h('div', { class: 'pila', id: 'panel-google', role: 'tabpanel', 'aria-labelledby': 'tab-google' },
    h('p', { class: 'suave' }, 'Usa tu cuenta de Google o la de tu colegio. Si no tienes una, pídele a tu profe tu código de clase.'),
    btnGoogle);

  // ── Panel código de clase ──
  const fCodigo = campo({ etiqueta: 'Código de clase', ayuda: '6 letras o números, como ABC234', maxlength: 6, autocomplete: 'off', autocapitalize: 'characters', inputmode: 'text', spellcheck: 'false' });
  fCodigo.input.addEventListener('input', () => { fCodigo.input.value = fCodigo.input.value.toUpperCase().replace(ALFABETO_CODIGO, ''); actualizarEstado(); });
  const fUsuario = campo({ etiqueta: 'Mi usuario', ayuda: 'El que te dio tu profe, por ejemplo sofia.m', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false' });
  fUsuario.input.addEventListener('input', actualizarEstado);

  const casillas = Array.from({ length: 4 }, (_, i) => h('input', {
    class: 'pin__casilla', type: 'password', inputmode: 'numeric', pattern: '[0-9]', maxlength: 1,
    autocomplete: 'off', 'aria-label': `PIN, dígito ${i + 1} de 4`,
    oninput: (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(-1);
      if (e.target.value && casillas[i + 1]) casillas[i + 1].focus();
      actualizarEstado();
    },
    onkeydown: (e) => { if (e.key === 'Backspace' && !e.target.value && casillas[i - 1]) casillas[i - 1].focus(); },
    onpaste: (e) => {
      const nums = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
      if (!nums) return;
      e.preventDefault();
      [...nums].forEach((n, j) => { casillas[j].value = n; });
      casillas[Math.min(nums.length, 3)].focus();
      actualizarEstado();
    },
  }));
  const pin = () => casillas.map((c) => c.value).join('');

  const btnCodigo = h('button', { class: 'btn btn--primary btn--lg btn--bloque', type: 'submit' }, 'Entrar', icono('arrow', { tam: 22 }));
  const panelCodigo = h('form', { class: 'pila', id: 'panel-codigo', role: 'tabpanel', 'aria-labelledby': 'tab-codigo', novalidate: true, onsubmit: alCodigo },
    fCodigo.nodo, fUsuario.nodo,
    h('fieldset', { class: 'pin' }, h('legend', { class: 'campo__etiqueta' }, 'Mi PIN (4 números)'), h('div', { class: 'pin__fila' }, casillas)),
    btnCodigo);

  // ── Panel demo ──
  const demo = firebaseConfigurado() ? null : h('div', { class: 'demo card card--plano' },
    h('div', { class: 'demo__titulo' }, icono('info', { tam: 20 }), h('strong', {}, 'Modo demostración')),
    h('p', { class: 'suave' }, 'Firebase aún no está configurado (edita js/core/config.js). Mientras tanto puedes explorar con datos de prueba guardados solo en este navegador.'),
    h('div', { class: 'fila fila--envuelve' },
      [2, 3, 4, 5, 6].map((g) => h('button', { class: 'btn btn--mint btn--sm', type: 'button', onclick: () => alDemo('estudiante', g) }, `Estudiante ${g}.º`)),
      h('button', { class: 'btn btn--sun btn--sm', type: 'button', onclick: () => alDemo('docente') }, 'Docente'),
      h('button', { class: 'btn btn--coral btn--sm', type: 'button', onclick: () => alDemo('admin') }, 'Admin')));

  // ── Pestañas ──
  const tabGoogle = h('button', { class: 'tab', role: 'tab', id: 'tab-google', 'aria-controls': 'panel-google', type: 'button', onclick: () => cambiarModo('google') }, 'Con Google');
  const tabCodigo = h('button', { class: 'tab', role: 'tab', id: 'tab-codigo', 'aria-controls': 'panel-codigo', type: 'button', onclick: () => cambiarModo('codigo') }, 'Con mi código de clase');
  const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Forma de entrar', onkeydown: (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') cambiarModo(modo === 'google' ? 'codigo' : 'google', true);
  } }, tabGoogle, tabCodigo);

  function cambiarModo(m, enfocar = false) {
    modo = m;
    const g = m === 'google';
    tabGoogle.setAttribute('aria-selected', String(g));
    tabCodigo.setAttribute('aria-selected', String(!g));
    tabGoogle.tabIndex = g ? 0 : -1; tabCodigo.tabIndex = g ? -1 : 0;
    panelGoogle.hidden = !g; panelCodigo.hidden = g;
    mostrarError('');
    if (enfocar) (g ? tabGoogle : tabCodigo).focus();
  }

  function codigoValido() {
    return fCodigo.input.value.length === 6 && fUsuario.input.value.trim().length >= 2 && pin().length === 4;
  }
  function actualizarEstado() {
    btnGoogle.disabled = !consent.checked || ocupado.v;
    btnCodigo.disabled = !consent.checked || !codigoValido() || ocupado.v;
  }
  function enCarga(v, btn, texto) {
    ocupado.v = v;
    btn.classList.toggle('btn--cargando', v);
    btn.setAttribute('aria-busy', String(v));
    if (texto) btn.dataset.texto = texto;
    actualizarEstado();
  }

  async function alGoogle() {
    mostrarError(''); enCarga(true, btnGoogle);
    try { await entrarConGoogle(); navegar(volver, { reemplazar: true }); }
    catch (e) { console.error(e); mostrarError(mensajeError(e)); }
    finally { enCarga(false, btnGoogle); }
  }
  async function alCodigo(e) {
    e.preventDefault();
    if (btnCodigo.disabled) return;
    mostrarError(''); enCarga(true, btnCodigo);
    try {
      await entrarConCodigo({ codigo: fCodigo.input.value, usuario: fUsuario.input.value, pin: pin() });
      navegar(volver, { reemplazar: true });
    } catch (err) {
      console.error(err);
      mostrarError(mensajeError(err));
      casillas.forEach((c) => { c.value = ''; }); casillas[0].focus();
    } finally { enCarga(false, btnCodigo); }
  }
  function alDemo(rol, grado) {
    entrarDemo(rol, grado);
    toast(`Entraste en modo demo como ${rol}.`, { tipo: 'info' });
    navegar(volver, { reemplazar: true });
  }

  cambiarModo(modo);
  actualizarEstado();

  return h('section', { class: 'entrar' },
    h('div', { class: 'entrar__lado' },
      mascota('saludo', { tam: 'xl' }),
      h('p', { class: 'burbuja' }, '¡Hola! Soy Tecli. ¿Entramos a teclear juntos?')),
    h('div', { class: 'card card--vidrio entrar__tarjeta' },
      h('h1', { class: 'entrar__titulo' }, `¡Bienvenido a ${CONFIG.appName}!`),
      tabs, panelGoogle, panelCodigo, bloqueConsent, mensaje, demo,
      h('p', { class: 'suave entrar__nota' }, 'Solo guardamos lo necesario para tu progreso. Sin anuncios, sin rastreadores.')));
}
