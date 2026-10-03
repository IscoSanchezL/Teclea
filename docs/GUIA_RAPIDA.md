# Guía rápida: dejar TECLEA funcionando (30–40 minutos)

No necesitas saber programar. Sigue los pasos **en orden** y marca cada uno. Si algo no sale, mira “Si algo falla” al final.

> Mientras no hagas esto, TECLEA funciona en **modo demostración** (los datos se quedan solo en cada computador). Sirve para mostrarla y probarla.

---

## Paso 1 · Publicar la página en GitHub (5 min)

1. En tu repositorio de GitHub entra a **Settings → Pages**.
2. En **Source** elige **GitHub Actions**.
3. Ve a la pestaña **Actions**: verás “Publicar en GitHub Pages” ejecutándose. Cuando termine (círculo verde) tu página estará en
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Guarda ese enlace: lo necesitas en el paso 3.

## Paso 2 · Crear el proyecto de Firebase (10 min)

1. Entra a **console.firebase.google.com** con tu cuenta de Google (`franksanlo@gmail.com`).
2. **Agregar proyecto** → ponle un nombre (ej. `teclea-colegio`) → **desactiva Google Analytics** → Crear.
3. Menú izquierdo **Compilación → Firestore Database → Crear base de datos** → **Modo producción** → ubicación **southamerica-east1** → Habilitar.
4. En la página principal pulsa el ícono **`</>`** (Web) → apodo `teclea-web` → **Registrar app**. **No** marques “Firebase Hosting”.
5. Verás un bloque de texto que empieza con `const firebaseConfig = {`. **Déjalo abierto** o cópialo: lo usas en el paso 4.

## Paso 3 · Activar el ingreso (5 min)

En el menú **Compilación → Authentication → Comenzar**:

1. **Método de acceso → Google** → Habilitar → elige tu correo de asistencia → Guardar.
2. **Método de acceso → Correo electrónico/contraseña** → activa **solo el primer interruptor** → Guardar. *(Es para los niños con usuario + PIN.)*
3. **Configuración → Dominios autorizados → Agregar dominio** → escribe `TU-USUARIO.github.io` (sin `https://` ni nada más).

## Paso 4 · Conectar la página con Firebase (5 min) — con el asistente

1. Abre `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/configurar.html`.
2. **Pega** el bloque `firebaseConfig` del paso 2 y pulsa **Generar archivo config.js**.
3. Pulsa **Descargar config.js**.
4. En GitHub entra a la carpeta **js → core**, pulsa **Add file → Upload files**, arrastra el `config.js` descargado (reemplaza al anterior) y **Commit changes**.
5. Espera 1–2 minutos a que termine el despliegue (pestaña Actions).

## Paso 5 · Publicar las reglas de seguridad (3 min)

1. En la misma página `configurar.html` pulsa **Copiar reglas de seguridad**.
2. En Firebase: **Firestore Database → pestaña Reglas** → borra todo, **pega** y pulsa **Publicar**.
3. Vuelve a `configurar.html` y pulsa **Probar conexión**: deben salir dos ✔ verdes.

## Paso 6 · Tu primer ingreso como administrador (3 min)

1. Abre tu página y pulsa **Entrar → Google** con **franksanlo@gmail.com**. Eres el **único administrador**.
2. Ve a **Administración → Resumen**: los catálogos de medallas y tienda se publican solos (debe decir “Publicados”).
3. **Administración → Marca**: sube tu **logo**, escribe el nombre del colegio y, si quieres, una imagen de portada. Guarda.
4. **Administración → Docentes**: escribe el correo de cada profe y pulsa **Autorizar** (entran directo). Si un profe se registra por su cuenta, aparecerá en “Solicitudes pendientes” para que lo **Aprobes**.

## Paso 7 · Respaldo automático (5 min, una sola vez)

Sigue la sección **6** de [`CONFIABILIDAD.md`](CONFIABILIDAD.md). Es copiar dos “secretos” en GitHub y listo: cada noche se guarda una copia cifrada de todos los datos.

---

## Cómo usan TECLEA los profes y los niños

**Profe:** entra con Google → **Clases y estudiantes → Nueva clase**. Le da un **código de 6 letras** (y un QR para proyectar).
- Niños **con** cuenta de Google: la primera vez que entran, la plataforma les pide el **código de la clase**. Al escribirlo quedan en el grupo correcto y su grado se toma de la clase. Sin código no pueden ver las lecciones.
- Niños **sin** cuenta: en la pestaña **Clases → Agregar estudiantes** escribes los nombres (uno por línea); la plataforma crea **usuario + PIN** y te deja **imprimir las tarjetas de acceso**. El niño entra con **código de clase + usuario + PIN**.
- Pestaña **Tareas**: asigna una lección, un texto tuyo o un juego, con fecha límite. Las entregas llegan solas.

**Niño:** entra → empieza en **Aprende** (mundo 1) → gana estrellas, XP, monedas y medallas → puede cambiar su avatar o subir una foto en **Perfil** (la foto solo la ven él y el administrador).

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| “Este sitio aún no está autorizado” al entrar con Google | Paso 3.3: falta agregar `TU-USUARIO.github.io` en Dominios autorizados |
| “Permiso denegado” | Paso 5: pega y **Publica** las reglas (el botón azul), luego recarga |
| La página sigue en “modo demo” | Paso 4: el `config.js` aún tiene la plantilla; vuelve a subirlo y espera el despliegue |
| No aparecen medallas ni se puede comprar | Entra una vez como administrador (paso 6.2) para publicar los catálogos |
| Un niño olvidó su PIN | Entra al detalle del estudiante (clic en su nombre): ahí está su PIN |
| Un profe no ve su panel | Admin → Docentes → Aprobar su solicitud |
| Quiero cambiar el logo o el nombre | Admin → Marca (no necesitas tocar archivos) |

## Cambiar el nombre del repositorio a `teclea`
GitHub → **Settings → General → Repository name** → `teclea` → Rename. Luego tu enlace será `https://TU-USUARIO.github.io/teclea/` (recuerda
agregarlo igual en Dominios autorizados: es el mismo dominio, no necesitas cambiar nada en Firebase).
