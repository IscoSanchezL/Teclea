/**
 * Punto de entrada. Orden de arranque:
 *  1) tema/preferencias  2) manifiesto de ilustraciones  3) sesión (Firebase o demo)
 *  4) navegación  5) enrutador
 */
import { CONFIG } from './core/config.js';
import { state } from './core/state.js';
import { iniciarRouter } from './core/router.js';
import { iniciarTema, aplicarEstiloUsuario } from './ui/theme.js';
import { cargarManifiestoAssets } from './ui/art.js';
import { iniciarNav, marcarRutaActiva } from './ui/nav.js';
import { iniciarAuth } from './auth/auth.js';
import { iniciarConexion, registrarServiceWorker } from './ui/conexion.js';
import { iniciarEfectos } from './ui/efectos.js';
import { iniciarPaleta } from './ui/paleta.js';

async function arrancar() {
  document.title = `${CONFIG.appName} · ${CONFIG.lema}`;
  iniciarTema();

  try {
    await Promise.all([cargarManifiestoAssets(), iniciarAuth()]);
  } catch (e) {
    console.error('[main] arranque con errores', e);
  }

  aplicarEstiloUsuario(state.user);
  iniciarNav();
  iniciarRouter({ onRuta: (ruta) => marcarRutaActiva(ruta.path) });

  document.getElementById('app').hidden = false;
  const splash = document.getElementById('splash');
  splash.classList.add('splash--fuera');
  setTimeout(() => splash.remove(), 500);
  iniciarConexion();
  iniciarEfectos();
  iniciarPaleta();
  registrarServiceWorker();
}

arrancar();
