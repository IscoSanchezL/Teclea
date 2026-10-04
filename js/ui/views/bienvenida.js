/**
 * Primera vez: elegir grado, apodo y avatar (el estilo visual se adapta al grado).
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { GRADOS, perfilDeGrado } from '../../core/grados.js';
import { guardarPerfil, mensajeError } from '../../auth/auth.js';
import { aplicarEstiloGrado } from '../theme.js';
import { campo } from '../componentes.js';
import { mascota } from '../art.js';
import { icono } from '../icons.js';
import { toast } from '../overlay.js';
import { personajeSVG, ESPECIES, especieDe } from '../personaje.js';

const INICIALES = Object.keys(ESPECIES).filter((k) => ESPECIES[k].gratis);
const EMOJI_DE = { zorro: '🦊', panda: '🐼' };

export async function render() {
  const u = state.user;
  let grado = u.grado || null;
  let especie = INICIALES.includes(especieDe(u.avatar)) ? especieDe(u.avatar) : 'zorro';

  const apodo = campo({ etiqueta: '¿Cómo quieres que te llamemos?', value: u.apodo || '', maxlength: 30, autocomplete: 'off',
    ayuda: 'Usa solo tu nombre o un apodo. No escribas apellidos ni datos personales.' });

  const info = h('p', { class: 'suave info-grado', 'aria-live': 'polite' });
  const botonesGrado = GRADOS.map((g) => h('button', {
    type: 'button', class: 'opcion-grado', 'aria-pressed': String(g === grado), disabled: Boolean(u.grado) || null,
    onclick: () => elegirGrado(g),
  }, h('strong', {}, `${g}.º`), h('span', {}, 'grado')));

  function elegirGrado(g) {
    grado = g;
    botonesGrado.forEach((b, i) => b.setAttribute('aria-pressed', String(GRADOS[i] === g)));
    const p = perfilDeGrado(g);
    info.textContent = `Tu meta: ${p.ppmMin}–${p.ppmMax} palabras por minuto con ${p.precision}% de precisión.`;
    aplicarEstiloGrado(g); // vista previa del estilo
    actualizar();
  }

  const botonesAvatar = INICIALES.map((k) => h('button', {
    type: 'button', class: 'opcion-avatar opcion-mascota', 'aria-pressed': String(k === especie), 'aria-label': `Mascota ${ESPECIES[k].nombre}`,
    onclick: () => { especie = k; botonesAvatar.forEach((b, i) => b.setAttribute('aria-pressed', String(INICIALES[i] === k))); },
  }, personajeSVG(k, { cabeza: true, tam: 76 }), h('span', {}, ESPECIES[k].nombre)));

  const btn = h('button', { class: 'btn btn--primary btn--lg btn--bloque', type: 'button', onclick: guardar }, '¡Listo, vamos!', icono('arrow', { tam: 22 }));
  function actualizar() { btn.disabled = !grado || !apodo.input.value.trim(); }
  apodo.input.addEventListener('input', actualizar);

  async function guardar() {
    btn.classList.add('btn--cargando'); btn.disabled = true;
    try {
      await guardarPerfil({ grado, apodo: apodo.input.value.trim().slice(0, 30), avatar: { ...(u.avatar || {}), emoji: EMOJI_DE[especie] || '🦊', mascota: especie } });
      toast('¡Perfil listo! Vamos a tu aventura.', { tipo: 'ok' });
      navegar('/', { reemplazar: true });
    } catch (e) {
      console.error(e);
      toast(mensajeError(e), { tipo: 'error' });
      btn.classList.remove('btn--cargando'); actualizar();
    }
  }

  if (grado) elegirGrado(grado); else actualizar();

  return h('section', { class: 'bienvenida card card--vidrio' },
    h('div', { class: 'bienvenida__cab' },
      mascota('anima', { tam: 'lg' }),
      h('div', {}, h('h1', {}, '¡Cuéntame de ti!'), h('p', { class: 'suave' }, 'Así preparo los ejercicios justo para tu nivel.'))),
    h('fieldset', { class: 'pila' },
      h('legend', { class: 'campo__etiqueta' }, '¿En qué grado estás?'),
      h('div', { class: 'rejilla-grados' }, botonesGrado), info),
    apodo.nodo,
    h('fieldset', { class: 'pila' },
      h('legend', { class: 'campo__etiqueta' }, 'Elige tu mascota (en la tienda podrás vestirla y conseguir más)'),
      h('div', { class: 'rejilla-avatares' }, botonesAvatar)),
    btn);
}
