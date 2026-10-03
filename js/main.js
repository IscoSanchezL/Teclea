/**
 * Punto de entrada. Orden de arranque:
 *  1) tema/preferencias  2) manifiesto de ilustraciones  3) sesión (Firebase o demo)
 *  4) navegación  5) enrutador
 */
import { CONFIG } from './core/config.js';
import { state } from './core/state.js';
import { iniciarRouter } from './core/router.js';
import { iniciarTema, aplicarEstiloGrado } from './ui/theme.js';
import { cargarManifiestoAssets } from './ui/art.js';
import { iniciarNav, marcarRutaActiva } from './ui/nav.js';
import { iniciarAuth } from './auth/auth.js';

async function arrancar() {
  document.title = `${CONFIG.appName} · ${CONFIG.lema}`;
  iniciarTema();

  try {
    await Promise.all([cargarManifiestoAssets(), iniciarAuth()]);
  } catch (e) {
    console.error('[main] arranque con errores', e);
  }

  aplicarEstiloGrado(state.user?.grado);
  iniciarNav();
  iniciarRouter({ onRuta: (ruta) => marcarRutaActiva(ruta.path) });

  document.getElementById('app').hidden = false;
  const splash = document.getElementById('splash');
  splash.classList.add('splash--fuera');
  setTimeout(() => splash.remove(), 500);
  // El service worker (PWA offline) se registra en la Fase 6.
}

arrancar();
