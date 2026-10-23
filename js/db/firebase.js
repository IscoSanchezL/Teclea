/**
 * Inicialización perezosa de Firebase (SDK modular v10 por CDN).
 * Solo se descarga si config.js tiene credenciales reales; si no, la app
 * corre en modo demo local y NO hace ninguna petición a Google.
 *
 * Uso:  const fb = await obtenerFirebase();  fb.auth, fb.db, fb.fs (funciones de Firestore), fb.au (Auth)
 */
import { CONFIG, firebaseConfigurado } from '../core/config.js';

let promesa = null;
let appCheckInst = null, appCheckMod = null;

export function obtenerFirebase() {
  if (!firebaseConfigurado()) return Promise.resolve(null);
  if (!promesa) promesa = iniciar();
  return promesa;
}

async function iniciar() {
  const base = `https://www.gstatic.com/firebasejs/${CONFIG.firebaseSdk}`;
  // App Check se descarga EN PARALELO con el resto (antes se pedía después, y sumaba una espera al arranque)
  const [app, au, fs, ac] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
    CONFIG.appCheckSiteKey ? import(`${base}/firebase-app-check.js`).catch((e) => { console.warn('[firebase] App Check no se descargó', e); return null; }) : null,
  ]);

  const miApp = app.initializeApp(CONFIG.firebase);

  // App Check: solo peticiones que vengan de TU app (reCAPTCHA Enterprise, invisible y sin rastreo publicitario).
  // Sin exigirse en Firebase no bloquea a nadie; solo envía la credencial para poder medir antes de exigirla.
  if (CONFIG.appCheckSiteKey && ac) {
    try {
      // 'enterprise' = Fraud Defense (reCAPTCHA Enterprise, el vigente); 'v3' = reCAPTCHA clásico (obsoleto)
      const proveedor = CONFIG.appCheckProveedor === 'v3' ? new ac.ReCaptchaV3Provider(CONFIG.appCheckSiteKey) : new ac.ReCaptchaEnterpriseProvider(CONFIG.appCheckSiteKey);
      appCheckInst = ac.initializeAppCheck(miApp, { provider: proveedor, isTokenAutoRefreshEnabled: true });
      appCheckMod = ac;
    } catch (e) { console.warn('[firebase] App Check no se pudo iniciar', e); }
  }
  const auth = au.getAuth(miApp);
  auth.languageCode = 'es';

  // Firestore con caché local persistente (offline) y varias pestañas.
  let db;
  try {
    db = fs.initializeFirestore(miApp, {
      // Redes escolares con firewall/proxy bloquean el canal en tiempo real: sin esto las escrituras quedan colgadas sin error.
      experimentalAutoDetectLongPolling: true,
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
  } catch (e) {
    console.warn('[firebase] caché persistente no disponible, uso memoria', e);
    db = fs.getFirestore(miApp);
  }

  return { app: miApp, auth, db, au, fs, appMod: app };
}

/** Prueba real de App Check desde ESTE dominio: pide una credencial y dice si funcionó. Para el panel de administración. */
export async function probarAppCheck() {
  if (!CONFIG.appCheckSiteKey || !firebaseConfigurado()) return { estado: 'apagado' };
  await obtenerFirebase();
  if (!appCheckInst || !appCheckMod) return { estado: 'error', codigo: 'no-iniciado' };
  const t0 = Date.now();
  try {
    const r = await Promise.race([appCheckMod.getToken(appCheckInst, true), new Promise((_, no) => setTimeout(() => no(new Error('tiempo-agotado')), 12000))]);
    return r?.token ? { estado: 'ok', ms: Date.now() - t0 } : { estado: 'error', codigo: 'sin-token' };
  } catch (e) { return { estado: 'error', codigo: e?.code || e?.message || String(e), ms: Date.now() - t0 }; }
}
