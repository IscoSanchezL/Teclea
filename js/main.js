/**
 * Punto de entrada. Orden de arranque:
 *  1) tema/preferencias  2) manifiesto de ilustraciones  3) sesión (Firebase o demo)
 *  4) navegación  5) enrutador
 */
import { aplicarMarca, cargarMarca } from './core/marca.js';
import { CONFIG } from './core/config.js';
import { state } from './core/state.js';
import { iniciarRouter } from './core/router.js';
import { iniciarTema, aplicarEstiloUsuario } from './ui/theme.js';
import { cargarManifiestoAssets } from './ui/art.js';
import { iniciarNav, marcarRutaActiva, redibujarNav } from './ui/nav.js';
import { iniciarAuth } from './auth/auth.js';
import { iniciarConexion, registrarServiceWorker } from './ui/conexion.js';
import { iniciarEfectos } from './ui/efectos.js';
import { iniciarPaleta } from './ui/paleta.js';
import { iniciarInactividad } from './core/inactividad.js';

async function arrancar() {
  aplicarMarca();
  iniciarTema();

  try {
    await Promise.all([cargarManifiestoAssets(), iniciarAuth()]);
  } catch (e) {
    console.error('[main] arranque con errores', e);
  }

  aplicarEstiloUsuario(state.user);
  iniciarNav();
  document.addEventListener('teclea:marca', redibujarNav);
  cargarMarca(); // en segundo plano: se pinta con la caché local y se actualiza si cambió
  iniciarRouter({ onRuta: (ruta) => marcarRutaActiva(ruta.path) });

  document.getElementById('app').hidden = false;
  const splash = document.getElementById('splash');
  splash.classList.add('splash--fuera');
  setTimeout(() => splash.remove(), 500);
  iniciarConexion();
  iniciarEfectos();
  iniciarPaleta();
  iniciarInactividad();
  registrarServiceWorker();
}

arrancar();
