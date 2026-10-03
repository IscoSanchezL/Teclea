# Confiabilidad, seguridad y respaldos

Esta guía responde a tres preguntas: **¿aguanta 30 usuarios a la vez?**, **¿se pierden datos?** y **¿puede quedar fuera de servicio?**
Primero lo que se midió o probó, luego lo que debes configurar tú, y al final un plan de contingencia.

> **Honestidad por delante:** ninguna plataforma garantiza 100 % de disponibilidad. Lo que sí se puede hacer es que (1) una caída
> de internet o de un proveedor **no detenga las clases**, (2) **ningún dato se pierda** y (3) si algo falla, **se recupere en minutos**.
> Eso es lo que está construido aquí, y cada afirmación indica cómo se verificó.

## 1. Resumen: qué está probado y qué falta configurar

| Garantía | Cómo se logra | Estado |
|---|---|---|
| No se cae con 30 usuarios | App estática en CDN (sin servidor propio que saturar) + Firestore/Auth de Google (escalan solos). Con 30 estudiantes se usa ≈ 12 % de la cuota gratuita diaria | ✅ Prueba: 30 navegadores simultáneos, 30/30 sin errores (`tests/carga.mjs`) |
| Sigue funcionando sin internet | Service worker guarda la app completa; Firestore con caché local persistente | ✅ Prueba: recarga y navegación sin red (`tests/offline.mjs`) |
| No se pierden datos al desconectarse | Las escrituras de Firestore se encolan en el dispositivo y se sincronizan al volver la red | ✅ Mecanismo del SDK; la cola propia de sesiones llega con la Fase 2 |
| Nadie puede falsear/robar datos | Reglas de Firestore | ✅ 74 pruebas de reglas + 105 de integración (progreso, medallas, clases, administración) en el emulador (`cd tests && npm run test:todo`) |
| Respaldo automático | Exportación diaria cifrada (GitHub Actions) + respaldos nativos de Google | ✅ Script probado ida y vuelta en el emulador · ⚙️ **tú activas** los secretos |
| Autenticación protegida | Google + MFA del titular, App Check, dominios autorizados | ⚙️ **tú configuras** (sección 5) |

## 2. Capacidad: ¿30 usuarios a la vez?

**La app no tiene servidor propio.** Los archivos salen de un CDN (GitHub Pages o Firebase Hosting) y los datos de Firestore, que escala
automáticamente. Por eso "30 usuarios" no se parece a "30 conexiones a un computador del colegio": es una carga muy pequeña.

Cuentas de la cuota gratuita (plan **Spark**, límites diarios de Firestore: 50 000 lecturas, 20 000 escrituras, 20 000 borrados):

| Concepto | Cálculo | Resultado |
|---|---|---|
| Escrituras por ejercicio | sesión + perfil + inscripción + progreso | 4 |
| 30 estudiantes × 20 ejercicios/día | 30 × 20 × 4 | **2 400** (12 % del límite) |
| Lecturas (inicio de sesión, progreso con caché) | ≈ 100 por estudiante | **3 000** (6 %) |
| Panel docente (30 inscripciones, 10 cargas) | 1 lectura por estudiante | 300 |
| Colegio de 300 estudiantes | 10× lo anterior | 24 000 escrituras → **supera Spark** |

- **Hasta ~250 estudiantes activos** cabe en Spark. Para más, pasa a **Blaze** (pago por uso) con tope de presupuesto: el costo
  esperado es de centavos al día (las primeras 20 000 escrituras/día siguen siendo gratis también en Blaze).
- **Sin cuellos de botella por documento:** cada estudiante escribe solo sus propios documentos (el límite sostenido de ~1 escritura por
  segundo por documento no se acerca). Las sesiones son documentos nuevos (sin contención).
- **Prueba realizada:** 30 navegadores reales abren la app a la vez, entran, navegan y cambian de tema: **30/30 completan, 0 errores**.
  Los tiempos medidos en el entorno de desarrollo (4 CPU, 30 navegadores compartidos) no representan a un usuario real: con un solo
  navegador la entrada tarda ≈ 2 s sin caché y el tiempo crece linealmente con el número de navegadores que se ejecutan en la misma
  máquina, no con la app. Para medir Firestore bajo carga usa el panel **Uso** de la consola Firebase tras una clase real.
- **Antes de una evaluación con todo el grado:** haz una clase piloto con 5–10 estudiantes y revisa Firebase → Firestore → Uso.

## 3. "Nunca offline": capas de protección

1. **App completa en el dispositivo (service worker).** Tras la primera visita, `sw.js` guarda todos los archivos (`precache.json`).
   Si no hay internet (o la red va lenta > 2,5 s), se usa la copia local. Se actualiza sola en cada despliegue (hash de versión).
2. **Datos en el dispositivo (Firestore persistente).** Lecturas repetidas salen de la caché local; las escrituras se **encolan** y se
   envían al reconectar, aunque cierres la pestaña.
3. **Banner de estado.** El estudiante ve "Sin internet: sigue practicando, guardamos todo en este dispositivo" y "¡Conectado!
   Sincronizando…" al volver.
4. **Sesión recordada.** Firebase Auth guarda la sesión en el dispositivo; un estudiante que ya entró puede abrir la app sin red.
5. **Dos copias de la app (opcional, recomendado en producción):** publica en **GitHub Pages y en Firebase Hosting**. Si un proveedor tuviera
   una caída, comparte el otro enlace. El flujo `.github/workflows/pages.yml` ya publica en Pages; Hosting: `firebase deploy --only hosting`.

**Limitaciones reales (para que no haya sorpresas):**
- El **primer inicio de sesión** de un dispositivo requiere internet (Google/Firebase Auth lo exige).
- Si un dispositivo **nunca** abrió la app con internet, no tiene la copia local.
- El panel docente/admin necesita internet para ver datos en vivo de otros (mostrará la última copia guardada si la hay).
- Borrar "datos del sitio" del navegador elimina la copia local y la cola pendiente: enseña a no hacerlo con la tablet sin conexión.

## 4. Que no se pierdan datos

| Riesgo | Protección |
|---|---|
| Se cierra la pestaña/batería | Guardado al terminar cada ejercicio; cola offline; (Fase 2) borrador del ejercicio en curso en `localStorage` |
| Se va el internet a mitad de clase | Cola de escrituras de Firestore + banner |
| Dos pestañas abiertas | `persistentMultipleTabManager`: comparten caché sin conflictos |
| Doble envío por reintento | IDs de documento determinísticos (`uid_lessonId`, `classId_uid`) → reintentar no duplica |
| Alguien intenta borrar/alterar historial | Sesiones **inmutables** por regla; solo el admin puede borrar |
| Borrado o error humano | Respaldos (sección 6) con restauración probada |
| Cuenta comprometida de docente | Reglas limitan a sus clases; auditoría; MFA |

## 5. Pasos de seguridad (haz esto antes de usar con estudiantes)

### 5.1 Reglas
1. Cambia `franksanlo@gmail.com` en `firestore.rules` (función `bootstrapAdmin`) y en `js/core/config.js`.
2. Publica: consola Firebase → Firestore → Reglas → pegar → **Publicar** (o `firebase deploy --only firestore:rules,firestore:indexes`).
3. *(Opcional)* Ejecuta las pruebas: `cd tests && npm install && npm test` (requiere Java 11+ y descarga el emulador). Deben pasar todas (`npm run test:todo`).

### 5.2 Cuentas
- **Verificación en 2 pasos (MFA) obligatoria** en las cuentas Google del **administrador y de los docentes** (Google Workspace Admin →
  Seguridad → Verificación en 2 pasos → Exigir). Es la defensa más efectiva contra robo de cuentas.
- Mantén la **lista blanca de docentes** corta y revísala cada período.
- PIN de estudiantes: 4 dígitos + código de clase. Firebase limita intentos; si un estudiante lo olvida, el docente lo ve en el detalle del estudiante (clic en su nombre).
  Para mayor seguridad cambia a 6 dígitos (una constante en `entrar.js`/alta de estudiantes).
- Consola Firebase → Authentication → Configuración → **Protección contra enumeración de correos**: activar.

### 5.3 Proteger tu proyecto contra abuso (App Check)
1. Consola de **reCAPTCHA** (<https://www.google.com/recaptcha/admin>) → crear sitio **v3** → dominios: `tu-usuario.github.io` y `localhost`.
2. Firebase → **App Check** → tu app web → **reCAPTCHA v3** → pegar la **clave secreta**.
3. Pega la **clave del sitio** (pública) en `js/core/config.js` → `appCheckSiteKey`. Publica y navega la app unos minutos.
4. En App Check → Firestore → mira que las "solicitudes verificadas" sean casi 100 % y entonces pulsa **Aplicar (Enforce)**.
   *No apliques antes de verificar, o bloquearías a tus propios estudiantes.*

### 5.4 Restringir la clave de API
Google Cloud Console → APIs y servicios → Credenciales → tu "Browser key" → **Restricciones de aplicación: Sitios web** →
agrega `https://tu-usuario.github.io/*` y `http://localhost:*`. (La clave web no es un secreto, pero así solo funciona desde tus sitios.)

### 5.5 Dominios y cabeceras
- Authentication → Dominios autorizados: **solo** tu dominio y `localhost`.
- GitHub Pages no permite cabeceras personalizadas; **Firebase Hosting sí** (`firebase.json` ya incluye HSTS, `nosniff`, `X-Frame-Options`,
  `Referrer-Policy` y una **Content-Security-Policy en modo "solo reportar"**). Tras desplegar, navega por la app y el inicio con Google; si la
  consola del navegador no muestra avisos de CSP, cambia la clave `Content-Security-Policy-Report-Only` por `Content-Security-Policy`.

### 5.6 Secretos y repositorio
- **Nunca** subas la cuenta de servicio ni contraseñas al repositorio. Solo van en **Settings → Secrets and variables → Actions**.
- Activa en GitHub: **Dependabot alerts**, **Secret scanning** y **protección de la rama `main`** (exigir PR).
- Rota la clave de la cuenta de servicio de respaldos cada 6–12 meses.

### 5.7 Costos y alertas
- Google Cloud → Facturación → **Presupuestos y alertas**: crea uno de, por ejemplo, 5 USD con avisos al 50 / 90 / 100 %.
- Firebase → Firestore → **Uso**: revisa tras la primera clase real.

### 5.8 Monitoreo de disponibilidad
Crea un monitor gratuito (UptimeRobot, Better Stack o similar) que consulte tu URL cada 5 min y avise por correo. Así te enteras antes que los estudiantes.

## 6. Respaldos automáticos (3 niveles)

| Nivel | Qué es | Costo | Recupera de |
|---|---|---|---|
| **A. Exportación cifrada diaria** (GitHub Actions) | `tools/backup-firestore.mjs` → archivo cifrado AES-256-GCM | Gratis | Cualquier pérdida, con hasta 24 h de antigüedad |
| **B. Respaldos programados de Firestore** (Google) | Copias diarias/semanales gestionadas por Google | Requiere Blaze (centavos) | Borrados masivos, errores humanos |
| **C. Recuperación a un punto en el tiempo (PITR)** | Restaura a cualquier minuto de los últimos 7 días | Requiere Blaze | Un error de hace una hora |

### 6.1 Activar el nivel A (gratis)
1. Firebase → ⚙️ Configuración del proyecto → **Cuentas de servicio** → **Generar nueva clave privada** (descarga un JSON). *No lo subas al repo.*
2. En ese JSON la cuenta necesita el rol **Cloud Datastore Viewer** (lectura). Lo normal es crear una cuenta dedicada con solo ese rol en IAM.
3. GitHub → repositorio → **Settings → Secrets and variables → Actions → New repository secret**:
   - `FIREBASE_SERVICE_ACCOUNT` = el contenido completo del JSON.
   - `BACKUP_PASSPHRASE` = una frase larga y única (**guárdala también en tu gestor de contraseñas: sin ella el respaldo no se puede abrir**).
4. **Dónde se guarda el respaldo (elige uno):**
   - **Recomendado:** crea un repositorio **privado** vacío (`teclea-respaldos`), un token con permiso de escritura solo a ese repo, y define
     el secreto `BACKUP_REPO_TOKEN` y la variable `BACKUP_REPO` (`usuario/teclea-respaldos`). Cada día se agrega un archivo cifrado.
   - Si **este** repositorio es privado, el flujo lo guarda como artefacto (90 días). Si es público, **no** se guarda como artefacto (evita exponerlo).
5. Pestaña **Actions → Respaldo diario de Firestore → Run workflow**. Debe terminar en verde y producir un `.json.gz.enc`.
6. GitHub te avisa por correo si un respaldo falla.

### 6.2 Activar los niveles B y C (recomendado; requiere Blaze con presupuesto topado)
```bash
# Respaldo diario con retención de 14 semanas
gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=14w
# Recuperación a un punto en el tiempo (7 días)
gcloud firestore databases update --database='(default)' --enable-pitr
```
(Comprueba la sintaxis vigente con `gcloud firestore backups schedules create --help`.)

### 6.3 Restaurar
```bash
cd tools && npm install
export FIREBASE_SERVICE_ACCOUNT="$(cat cuenta.json)" BACKUP_PASSPHRASE='tu frase'
node restaurar-firestore.mjs respaldos/teclea-backup-AAAAMMDDTHHMM.json.gz.enc               # simulacro (no escribe)
node restaurar-firestore.mjs respaldos/teclea-backup-AAAAMMDDTHHMM.json.gz.enc --confirmar   # restaura
node restaurar-firestore.mjs ARCHIVO --confirmar --solo=users,classes                        # solo algunas colecciones
```
Restauración probada: se sembraron datos (con fechas y subcolecciones), se hizo el respaldo cifrado, se borraron, se restauraron y se
verificó que los tipos (`Timestamp`) y los valores volvieron iguales; con frase incorrecta el archivo se rechaza.

### 6.4 Disciplina
- **Cada trimestre**: restaura un respaldo en un proyecto de pruebas y comprueba que abre. *Un respaldo no probado no es un respaldo.*
- Guarda **una copia mensual** fuera de GitHub (disco externo o Drive institucional) con la misma frase.
- Conserva la frase en **dos** lugares (tú y la coordinación).

## 7. Plan de contingencia

| Situación | Qué ve el estudiante | Qué haces |
|---|---|---|
| Se cae el internet del colegio | Banner "Sin internet"; sigue practicando; todo se sincroniza luego | Nada. Verifica la sincronización al volver |
| Google/Firebase con incidencia | Igual que arriba (cola local) | Revisa <https://status.firebase.google.com>; espera. Los datos no se pierden |
| GitHub Pages caído | La app ya instalada sigue abierta; nuevos dispositivos no cargan | Comparte el enlace de Firebase Hosting (segunda copia) |
| Despliegue defectuoso | Algo falla tras una actualización | `git revert` del commit y push: Pages republica en ~1 min. Los dispositivos recuperan la versión anterior solos |
| Borrado accidental de datos | Datos faltan | Restaurar (6.3) o PITR (6.2) |
| Cuenta de docente comprometida | — | Quítala de la lista blanca, cambia credenciales, revisa `audit_logs`, restaura si hizo daños |
| Cuota diaria agotada (Spark) | Escrituras rechazadas → se encolan | Pasa a Blaze con presupuesto; las colas se envían al volver la cuota |
| Piden eliminar datos de un menor | — | Panel admin (Fase 6) o borrar `users/{uid}` + sus documentos; registra en `audit_logs` |

## 8. Lista de verificación previa a clase real
- [ ] Reglas publicadas y 53/53 pruebas verdes
- [ ] MFA activa en admin y docentes
- [ ] App Check en "Aplicar" tras verificar
- [ ] Clave de API restringida; dominios autorizados mínimos
- [ ] Respaldo diario ejecutado al menos una vez en verde **y restaurado en prueba**
- [ ] Presupuesto y alertas creados; monitor de disponibilidad activo
- [ ] Autorizaciones de acudientes y aviso de privacidad revisados por el colegio
- [ ] Clase piloto de 5–10 estudiantes revisando el panel **Uso** de Firestore
