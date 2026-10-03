/**
 * Tema, accesibilidad y estilo por grado.
 * Todo se aplica con atributos data-* en <html>; el CSS reacciona a ellos.
 *
 *  data-theme    light | dark          (auto se resuelve con prefers-color-scheme)
 *  data-textsize normal | grande | enorme
 *  data-font     normal | dislexia
 *  data-colorblind  on | off
 *  data-motion   completo | reducido   (auto se resuelve con prefers-reduced-motion)
 *  data-estilo   ludico | medio | pro  (según el grado: 2°–3° / 4° / 5°–6°)
 */
import { state, setState, PREFS_POR_DEFECTO } from '../core/state.js';
import { almacen } from '../core/utils.js';

const CLAVE = 'teclea:prefs';
const mqOscuro = window.matchMedia('(prefers-color-scheme: dark)');
const mqMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Estilo visual recomendado por grado. */
export function estiloPorGrado(grado) {
  if (grado <= 3) return 'ludico';
  if (grado === 4) return 'medio';
  return 'pro';
}

export function aplicarPrefs(prefs = state.prefs) {
  const r = document.documentElement;
  // En 5.º–6.º ("pro") el modo automático arranca oscuro; el estudiante puede elegir claro en Ajustes.
  const pro = r.dataset.estilo === 'pro';
  const oscuro = prefs.tema === 'oscuro' || (prefs.tema === 'auto' && (pro || mqOscuro.matches));
  r.dataset.theme = oscuro ? 'dark' : 'light';
  r.dataset.textsize = prefs.texto;
  r.dataset.font = prefs.fuente;
  r.dataset.colorblind = prefs.daltonico ? 'on' : 'off';
  r.dataset.motion = prefs.movimiento === 'reducido' || mqMovimiento.matches ? 'reducido' : 'completo';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#13112A' : '#6C4CF5');
}

/** Estilo según quién entra: personal docente/administrativo → "staff" (sobrio); estudiantes → por grado. */
export function aplicarEstiloUsuario(u) {
  const staff = u && (u.rol === 'docente' || u.rol === 'admin');
  document.documentElement.dataset.estilo = staff ? 'staff' : u?.grado ? estiloPorGrado(u.grado) : 'medio';
  aplicarPrefs();
}

/** Vista previa del estilo de un grado (pantalla de bienvenida). */
export function aplicarEstiloGrado(grado) {
  document.documentElement.dataset.estilo = grado ? estiloPorGrado(grado) : 'medio';
  aplicarPrefs(); // el tema "automático" depende del estilo
}

/** Carga preferencias guardadas en este dispositivo. */
export function iniciarTema() {
  const guardadas = almacen.leer(CLAVE, {});
  setState({ prefs: { ...PREFS_POR_DEFECTO, ...guardadas } });
  aplicarPrefs();
  mqOscuro.addEventListener('change', () => aplicarPrefs());
  mqMovimiento.addEventListener('change', () => aplicarPrefs());
}

/** Cambia una o varias preferencias, las aplica y las guarda (local; la nube la sincroniza db/users.js). */
export function cambiarPrefs(parche, { alGuardar } = {}) {
  const prefs = { ...state.prefs, ...parche };
  setState({ prefs });
  aplicarPrefs(prefs);
  almacen.guardar(CLAVE, prefs);
  alGuardar?.(prefs);
}

/** Alterna claro/oscuro rápido (botón de la barra superior). */
export function alternarTema(alGuardar) {
  const oscuroAhora = document.documentElement.dataset.theme === 'dark';
  cambiarPrefs({ tema: oscuroAhora ? 'claro' : 'oscuro' }, { alGuardar });
}
