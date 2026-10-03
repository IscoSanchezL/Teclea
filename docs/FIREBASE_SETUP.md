# Guía paso a paso: Firebase + GitHub Pages

Tiempo estimado: 20–30 minutos. Todo funciona en el plan **gratuito (Spark)**.

> Sin hacer nada de esto la app ya corre en **modo demo local** (botones "Estudiante / Docente / Admin" en la pantalla Entrar).

## 1. Crear el proyecto
1. Entra a <https://console.firebase.google.com> con la cuenta Google del colegio o la tuya.
2. **Agregar proyecto** → nombre `teclea-colegio` → desactiva Google Analytics (privacidad de menores: sin rastreadores).
3. En **Compilación → Firestore Database → Crear base de datos**:
   - Modo **producción**.
   - Ubicación: `southamerica-east1` (São Paulo), la más cercana a Colombia.

## 2. Registrar la app web
1. Página principal del proyecto → icono `</>` (Web) → apodo `teclea-web`. **No** marques "Firebase Hosting" (usaremos GitHub Pages).
2. Copia el objeto `firebaseConfig` y pégalo en `js/core/config.js` (sección `firebase`). Estos valores no son secretos.

## 3. Activar autenticación
**Compilación → Authentication → Comenzar → Método de acceso**
1. **Google** → Habilitar → correo de asistencia → Guardar.
2. **Correo electrónico/contraseña** → Habilitar (solo el primer interruptor; **no** "vínculo por correo"). Lo usan los estudiantes con **código de clase + usuario + PIN**.
3. **Configuración → Dominios autorizados** → **Agregar dominio**: `TU-USUARIO.github.io` (y `localhost` ya viene).
4. *(Opcional, recomendado)* En **Configuración → Acciones del usuario** desactiva "Permitir que los usuarios se registren" **después** de crear las cuentas iniciales si quieres cerrar el registro por correo; las cuentas PIN las crea el docente desde la app (Fase 5).

## 4. Reglas e índices
Opción A — consola (más fácil):
1. Edita `firestore.rules` y cambia `admin@tu-colegio.edu.co` por **tu correo de Google** (función `bootstrapAdmin`). Haz lo mismo en `js/core/config.js` → `adminEmail`.
2. Firestore → pestaña **Reglas** → pega todo el contenido de `firestore.rules` → **Publicar**.
3. Los **índices** se pueden crear al vuelo: cuando una consulta lo necesite, la consola del navegador muestra un enlace; púlsalo y confirma. O bien usa la opción B.

Opción B — Firebase CLI:
```bash
npm i -g firebase-tools
firebase login
firebase use --add            # elige tu proyecto
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Primer administrador
1. Publica la app (paso 6) y entra con **Google** usando el correo configurado como `adminEmail`.
2. La regla `bootstrapAdmin` te permite crear tu perfil con `rol: admin`.
3. Desde el panel admin (Fase 6) agregarás los correos de docentes a la **lista blanca**. Mientras tanto puedes crear a mano el documento `teacher_whitelist/correo@dominio.com` en la consola (campo `correo`: texto).

## 6. Publicar en GitHub Pages
1. Sube el código a GitHub (rama `main`).
2. Repositorio → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El flujo `.github/workflows/pages.yml` publica en cada `push` a `main` en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.
4. Vuelve al paso 3.3 y autoriza ese dominio. Si usas un dominio propio, autorízalo también.

> Probar en local: `python3 -m http.server 8000` y abre <http://localhost:8000>. Los módulos ES **no** funcionan abriendo `index.html` con doble clic (`file://`).

## 6b. (Recomendado) Segunda copia en Firebase Hosting
```bash
npm i -g firebase-tools && firebase login
firebase use --add            # elige tu proyecto
node tools/generar-manifest-assets.mjs && node tools/generar-precache.mjs
firebase deploy --only hosting
```
Hosting agrega cabeceras de seguridad (HSTS, CSP…), CDN global y reversión de versiones. Autoriza también `TU-PROYECTO.web.app` en Authentication.

## 7. Seguridad y garantía de servicio
Sigue **[`CONFIABILIDAD.md`](CONFIABILIDAD.md)**: App Check, MFA, restricción de la clave, respaldos automáticos cifrados, monitoreo y plan de contingencia.

## 7b. Antes de usarlo con estudiantes (Ley 1581 de 2012)
- [ ] Revisar `#/privacidad` con el área jurídica del colegio y completar responsable/contacto en `config.js`.
- [ ] Obtener la **autorización de acudientes** (circular o formulario del colegio). La plataforma guarda la versión del aviso aceptado en `users.consentimiento`.
- [ ] Confirmar que Analytics está **desactivado** y que no se añadieron scripts de terceros.
- [ ] Definir quién atiende solicitudes de acceso/eliminación (el panel admin las listará en la Fase 6).
- [ ] Activar **alertas de presupuesto** en Google Cloud (aunque el uso esperado es gratuito).

## 8. Cuotas del plan gratuito (referencia)
Firestore Spark: 50 000 lecturas, 20 000 escrituras y 20 000 borrados **por día**. Un colegio de ~300 estudiantes con 20 sesiones diarias cada uno
(≈ 6 000 escrituras + resúmenes) cabe holgadamente gracias a: sesiones escritas al terminar, resúmenes desnormalizados y caché local.

## Solución de problemas
| Síntoma | Causa probable |
|---|---|
| `auth/unauthorized-domain` | Falta autorizar el dominio (paso 3.3) |
| `permission-denied` al primer ingreso | El correo de `bootstrapAdmin` no coincide, o las reglas no se publicaron |
| La ventana de Google no abre en tablet | El navegador bloqueó la ventana: la app reintenta con redirección automáticamente |
| Pantalla en blanco en local | Abriste `file://`; usa un servidor local |
| Consola pide "crear índice" | Pulsa el enlace o despliega `firestore.indexes.json` |
