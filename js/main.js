/**
 * Punto de entrada. Orden de arranque:
 *  1) tema/preferencias  2) manifiesto de ilustraciones  3) sesión (Firebase o demo)
 *  4) navegación  5) enrutador
 */
import { aplicarMarca, cargarMarca } from './core/marca.js';
import { CONFIG } from './core/config.js';
import { state } from './core/state.js';
import { iniciarRouter, refrescar } from './core/router.js';
import { montar as montarIdioma, alCambiar } from './i18n/index.js';
import { iniciarTema, aplicarEstiloUsuario } from './ui/theme.js';
import { cargarManifiestoAssets } from './ui/art.js';
import { iniciarNav, marcarRutaActiva, redibujarNav } from './ui/nav.js';
import { iniciarAuth } from './auth/auth.js';
import { iniciarConexion, registrarServiceWorker } from './ui/conexion.js';
import { iniciarEfectos } from './ui/efectos.js';
import { iniciarPaleta } from './ui/paleta.js';
import { iniciarInactividad } from './core/inactividad.js';
import { iniciarRendimiento, vigilarFluidez } from './core/rendimiento.js';
import { registrarVersionEnEjecucion, vigilarVersionNueva } from './core/version.js';

async function arrancar() {
  registrarVersionEnEjecucion();   // antes de que un service worker nuevo cambie las cachés
  iniciarRendimiento();
  montarIdioma(); // <html lang> y textos estáticos de index.html en el idioma guardado
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
  // Cambio de idioma sin recargar: título del documento, menús y vista actual se vuelven a pintar.
  alCambiar(() => { aplicarMarca(); refrescar(); });
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
  vigilarFluidez();
  vigilarVersionNueva();
  // El docente debe ver el historial real del estudiante aunque haya trabajado antes de unirse a la clase
  if (state.user?.rol === 'estudiante') setTimeout(() => import('./db/progreso.js').then((m) => m.reconciliarInscripciones(state.user)).catch((e) => console.warn('[main] reconciliar', e?.code || e)), 5000);
  registrarServiceWorker();
}

arrancar();
