/**
 * Sincroniza las preferencias con la nube (con retraso para no escribir en cada clic).
 * En local ya se guardan siempre (theme.js).
 */
import { state } from '../core/state.js';
import { guardarPerfil } from '../auth/auth.js';

let temporizador;

export function sincronizarPrefs(prefs) {
  if (!state.user) return;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => guardarPerfil({ prefs }).catch((e) => console.warn('[prefs] no se sincronizaron', e)), 700);
}
