/**
 * Unirse a la clase con el código del profe. Los estudiantes con cuenta de Google pasan por aquí la primera vez:
 * al entrar a la clase se fija su grado (el de la clase) y llegan directo al grupo que les corresponde.
 */
import { state } from '../../core/state.js';
import { h } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { unirse } from '../../db/clases.js';
import * as store from '../../db/store.js';
import { guardarPerfil, cerrarSesion, mensajeError } from '../../auth/auth.js';
import { aplicarEstiloGrado } from '../theme.js';
import { campo } from '../componentes.js';
import { mascota } from '../art.js';
import { icono } from '../icons.js';
import { toast } from '../overlay.js';

export async function render({ query }) {
  const u = state.user;
  const codigo = campo({ etiqueta: 'Código de tu clase', maxlength: 6, autocomplete: 'off', autocapitalize: 'characters', placeholder: 'Ej.: K7M2QX', ayuda: 'Te lo da tu profe: son 6 letras o números.' });
  codigo.input.style.textTransform = 'uppercase'; codigo.input.style.fontSize = '1.5rem'; codigo.input.style.letterSpacing = '.2em'; codigo.input.style.textAlign = 'center';
  if (query?.codigo) codigo.input.value = String(query.codigo).toUpperCase().slice(0, 6);
  const error = h('p', { class: 'mensaje-error', role: 'alert', hidden: true });
  const boton = h('button', { class: 'btn btn--primary btn--lg btn--bloque', type: 'submit' }, 'Entrar a mi clase', icono('arrow', { tam: 22 }));

  const enviar = async (e) => {
    e.preventDefault(); error.hidden = true; boton.disabled = true;
    try {
      const teniaGrado = Boolean(state.user.grado);
      const { classId } = await unirse(state.user, codigo.input.value);
      let nuevoGrado = state.user.grado;
      if (!nuevoGrado) {
        const clase = await store.leer(`classes/${classId}`).catch(() => null);
        if (clase?.grado) { await guardarPerfil({ grado: clase.grado }); nuevoGrado = clase.grado; aplicarEstiloGrado(nuevoGrado); }
      }
      toast('¡Listo! Ya estás en tu clase.');
      navegar(teniaGrado ? '/' : '/bienvenida', { reemplazar: true });
    } catch (err) {
      error.textContent = err.message && !err.code ? err.message : mensajeError(err); error.hidden = false; boton.disabled = false;
    }
  };

  return h('section', { class: 'estado-cuenta card card--vidrio' },
    mascota('saludo', { tam: 'lg' }),
    h('h1', {}, `¡Hola, ${u.apodo}!`),
    h('p', {}, 'Para empezar, escribe el código de tu clase. Tu profe te lo dio o lo muestra en el tablero.'),
    h('form', { class: 'pila', onsubmit: enviar }, codigo.nodo, error, boton),
    h('p', { class: 'suave pequeno' }, '¿No tienes el código? Pídeselo a tu profe: sin él no puedes ver tus lecciones.'),
    h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { await cerrarSesion(); navegar('/', { reemplazar: true }); } }, icono('logout', { tam: 16 }), 'Cerrar sesión'));
}
