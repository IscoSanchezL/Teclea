/**
 * Inicialización perezosa de Firebase (SDK modular v10 por CDN).
 * Solo se descarga si config.js tiene credenciales reales; si no, la app
 * corre en modo demo local y NO hace ninguna petición a Google.
 *
 * Uso:  const fb = await obtenerFirebase();  fb.auth, fb.db, fb.fs (funciones de Firestore), fb.au (Auth)
 */
import { CONFIG, firebaseConfigurado } from '../core/config.js';

let promesa = null;

export function obtenerFirebase() {
  if (!firebaseConfigurado()) return Promise.resolve(null);
  if (!promesa) promesa = iniciar();
  return promesa;
}

async function iniciar() {
  const base = `https://www.gstatic.com/firebasejs/${CONFIG.firebaseSdk}`;
  const [app, au, fs] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]);

  const miApp = app.initializeApp(CONFIG.firebase);
  const auth = au.getAuth(miApp);
  auth.languageCode = 'es';

  // Firestore con caché local persistente (offline) y varias pestañas.
  let db;
  try {
    db = fs.initializeFirestore(miApp, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
  } catch (e) {
    console.warn('[firebase] caché persistente no disponible, uso memoria', e);
    db = fs.getFirestore(miApp);
  }

  return { app: miApp, auth, db, au, fs, appMod: app };
}
