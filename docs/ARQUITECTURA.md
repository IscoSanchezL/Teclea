# Arquitectura de TECLEA

## Principios
1. **Sin build.** HTML + CSS + ES Modules. Se publica tal cual en GitHub Pages o Firebase Hosting.
2. **Firebase solo cuando está configurado.** El SDK se importa de forma perezosa; sin credenciales todo corre en modo demo local.
3. **Seguridad en las reglas, no en el cliente.** El cliente es no confiable; Firestore valida tipos, rangos y propiedad.
4. **Vistas bajo demanda.** Cada pantalla es un módulo con `render()` (y opcional `despues()`/`destroy()`); el enrutador las importa al visitarlas.
5. **Accesibilidad y niños primero.** Atributos `data-*` en `<html>` gobiernan tema, tamaño, fuente, daltonismo, movimiento y estilo por grado.

## Árbol de carpetas
```
/
├─ index.html                  Documento único (PWA shell)
├─ manifest.webmanifest        Instalación en tablet/PC
├─ firebase.json               Reglas, índices y (opcional) Hosting
├─ firestore.rules             Reglas de seguridad completas
├─ firestore.indexes.json      Índices compuestos
├─ ASSETS_PROMPTS.md           Prompts para generar TODA la ilustración
├─ css/
│  ├─ tokens.css               Variables: paleta, radios, sombras, tipografías, temas
│  ├─ base.css                 Reset, tipografía, foco AA, utilidades
│  ├─ fondo.css                Malla animada, blobs y pantalla de carga
│  ├─ componentes.css          Botones-tecla, tarjetas, formularios, toasts, capas, mascota
│  ├─ layout.css               Barra lateral flotante / inferior / superior
│  ├─ vistas.css               Estilos por pantalla
│  └─ animaciones.css          Keyframes y View Transitions
├─ js/
│  ├─ main.js                  Arranque
│  ├─ core/                    config, state, router, routes, utils, levels, grados
│  ├─ auth/                    Google, código+PIN, demo
│  ├─ db/                      Firebase perezoso y capa de usuarios
│  ├─ ui/                      theme, nav, icons, art, overlay, componentes + views/
│  ├─ lessons/                 (Fase 2–3) motor de escritura, teclado virtual, currículo
│  ├─ game/                    (Fase 4) gamificación y minijuegos
│  ├─ teacher/                 (Fase 5) clases, asignaciones, reportes
│  └─ admin/                   (Fase 6) CRUD, respaldo, auditoría
├─ assets/
│  ├─ assets.json              Manifiesto de ilustraciones (lo genera tools/)
│  ├─ img/{tecli,worlds,badges,shop,ui}/   Ilustraciones finales
│  ├─ lottie/  sounds/
├─ data/                       worlds.json (+ lessons/texts/badges en fases siguientes)
├─ tools/generar-manifest-assets.mjs
├─ docs/                       Esta documentación
└─ .github/workflows/pages.yml Despliegue automático
```

## Flujo de arranque
`main.js` → `iniciarTema()` (prefs locales) → en paralelo `cargarManifiestoAssets()` + `iniciarAuth()` →
`iniciarNav()` → `iniciarRouter()` → quita la pantalla de carga.

## Enrutamiento
Hash (`#/aprende`) para que funcione en GitHub Pages sin reescrituras. `routes.js` declara ruta, acceso (`publica` | `sesion` | roles),
carga perezosa y si aparece en la navegación. El enrutador aplica guardas (sesión, rol, grado pendiente), usa
`document.startViewTransition` cuando existe y mueve el foco al `<h1>` para lectores de pantalla.

## Ilustraciones: placeholder → imagen real
`ilustracion(clave)` y `mascota(pose)` consultan `assets/assets.json`. Si la clave existe se carga la imagen; si no, se pinta un
gradiente con emoji. El manifiesto lo genera `tools/generar-manifest-assets.mjs` (se ejecuta en el flujo de Pages), así subir
`tecli-saludo.webp` a `assets/img/tecli/` basta. Nunca hay errores 404 en consola.

## Autenticación
| Ruta | Mecanismo | Quién crea la cuenta |
|---|---|---|
| Google / Workspace | `signInWithPopup` (+ redirección de respaldo) | El propio usuario |
| Código de clase + usuario + PIN | Correo/contraseña Firebase: `usuario.codigo@alumnos.teclea.local` / `PIN+CODIGO` | El docente (Fase 5, instancia secundaria de la app) |
| Demo local | `localStorage` | — |

**Riesgo conocido del PIN:** 4 dígitos son pocos. Mitigaciones: Firebase limita intentos por IP/cuenta (`auth/too-many-requests`), la
contraseña real incluye el código de clase (10 caracteres), las cuentas PIN no tienen correo real ni acceso a datos de otros, y el docente
puede restablecer el PIN. Para mayor seguridad se podrá pasar a PIN de 6 dígitos cambiando una constante.

**Roles:** el cliente *solicita* un rol; las reglas deciden. `admin` solo si el correo verificado coincide con `bootstrapAdmin()`;
`docente` solo si el correo está en `teacher_whitelist`; todo lo demás es `estudiante`.

## Anti-trampa (capas)
1. **Cliente (Fase 2):** detecta `paste`, `beforeinput` con `insertFromPaste`, intervalos entre teclas < 20 ms sostenidos, PPM imposible; marca `flags`.
2. **Reglas:** topes de PPM/caracteres/tiempo y coherencia matemática; sesiones inmutables; XP/monedas con tope por escritura.
3. **Docente:** ve las sesiones con `flags` y puede invalidarlas.
4. **Opcional (Blaze):** Cloud Function que otorgue XP al crear la sesión.

## Rendimiento (objetivo Lighthouse 90+)
Sin framework, CSS por capas, vistas perezosas, fuentes con `preconnect` y `display=swap`, GSAP/Lottie/Chart.js/jsPDF **solo se cargan
en la pantalla que los usa** (Fases 4–6), imágenes `loading="lazy"` y `decoding="async"`.

## Decisiones y supuestos (decididos por criterio profesional)
- Nombre provisional **TECLEA**, configurable en `config.js`. Mascota **Tecli** (zorro).
- Paleta violeta eléctrico + coral + menta + sol; botones de texto oscuro sobre colores claros para contraste AA.
- Fuente accesible: **Lexend** (OpenDyslexic no está en Google Fonts; puede añadirse localmente si se prefiere).
- Los dedos usan 5 colores fijos (meñique rosa, anular amarillo, medio menta, índice azul, pulgar lila).
- Para no depender de Cloud Functions, los resúmenes se desnormalizan (ver `FIRESTORE_SCHEMA.md`).
