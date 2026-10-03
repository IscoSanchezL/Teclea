# Prompts de ilustración para TECLEA

Cómo funciona: sube cada archivo con el **nombre exacto** a la carpeta indicada y haz commit. El flujo de GitHub Pages ejecuta
`tools/generar-manifest-assets.mjs`, que registra el archivo en `assets/assets.json`, y la app **reemplaza sola** el placeholder
(gradiente + emoji). En local: `node tools/generar-manifest-assets.mjs`.

Formato por defecto: **WebP con transparencia** (también se acepta PNG/SVG con el mismo nombre; prioridad webp > png > svg).

## 0. Estilo unificado (pégalo al inicio de CADA prompt)

> **STYLE:** soft 3D claymation illustration, rounded chunky shapes, matte clay texture with subtle fingerprints, soft studio lighting,
> gentle rim light, vibrant but friendly colors (electric violet #6C4CF5, coral #FF6B5B, mint #3DDBB0, sun yellow #FFD04A, sky blue #4FB6FF),
> child-friendly, no text, no watermark, no logo, **transparent background**, centered subject with 8% padding, consistent character design.

**Sufijo negativo (si el generador lo permite):** `no text, no letters, no brand logos, no photorealism, no sharp edges, no scary elements, no background`.

## 1. Mascota "Tecli" (zorro) — carpeta `assets/img/tecli/` — 1024×1024 WebP

**Descripción base del personaje (repítela en las 8 poses para mantener consistencia):**
> "Tecli: a cute round baby fox, orange-coral fur (#FF8A5B) with a cream belly and cream cheeks, big shiny dark eyes with a white highlight,
> small black nose, fluffy tail with a cream tip, oversized head, short chubby limbs, wearing a small violet (#6C4CF5) scarf with a tiny
> keyboard-key charm. Stands about 3 heads tall."

| Archivo | Pose / expresión (añadir a la descripción base) |
|---|---|
| `tecli-saludo.webp` | Waving with one paw, big happy smile, eyes bright, slightly leaning forward |
| `tecli-celebra.webp` | Jumping with both paws up, mouth open in joy, confetti in the air, eyes closed happily |
| `tecli-piensa.webp` | One paw on chin, eyes looking up, small thought bubble with a question mark (no text other than "?") |
| `tecli-anima.webp` | Flexing a small arm, determined proud smile, one eyebrow raised, thumbs-up energy |
| `tecli-dormido.webp` | Curled up sleeping, tail wrapped around, tiny "z" bubbles, peaceful smile |
| `tecli-triste.webp` | Ears drooping, big watery eyes, gentle sad smile, one paw offered as comfort (not scary) |
| `tecli-senala.webp` | Pointing with paw to the right, eyes looking at the pointed direction, cheerful |
| `tecli-sorprendido.webp` | Both paws on cheeks, mouth in an "o", eyes wide with sparkles |

**Extras de mascota (opcional)**
| Archivo | Prompt (con STYLE delante) |
|---|---|
| `tecli-tipeando.webp` | Tecli typing on a chunky clay keyboard with both paws, tongue slightly out, focused |
| `tecli-trofeo.webp` | Tecli hugging a golden trophy bigger than its head, proud |
| `tecli-logo.svg` (vectorial) | Flat vector of Tecli's face only, 3 colors, usable at 32px |

## 2. Mundos (10 escenas) — carpeta `assets/img/worlds/` — 800×800 WebP transparente
Cada una sirve de **nodo del mapa** y de tarjeta. Composición: una isla/diorama flotante compacta vista 3/4, sin texto.

| Archivo | Prompt (con STYLE delante) |
|---|---|
| `mundo-1-fila-base.webp` | A cozy clay cottage with a round door and a warm glowing window on a tiny floating grass island, home-sweet-home feeling, eight little stepping stones in a row in front |
| `mundo-2-fila-superior.webp` | A chunky clay rocket launching from a floating island with a launch tower, ten small clouds in a row, starry violet sky accents |
| `mundo-3-fila-inferior.webp` | A small floating island with a turquoise wave, a clay sailboat and a lighthouse, seven bubbles in a row |
| `mundo-4-alfabeto.webp` | A treasure map island with a winding path, a clay compass and a big letter-shaped (no real letters) chest, palm tree |
| `mundo-5-mayusculas.webp` | A snowy clay mountain with a flag on the summit, a big upward arrow made of ice, little climbing steps |
| `mundo-6-tildes-signos.webp` | A magic garden island with sparkling stars, tiny clay wands and floating decorative accents above flowers |
| `mundo-7-numeros.webp` | A candy-colored clay city of stacked number-shaped blocks (abstract, no readable digits), a small robot |
| `mundo-8-frases.webp` | Floating clay speech bubbles on a small island with a tiny café, a bird carrying a ribbon |
| `mundo-9-parrafos.webp` | A giant open clay book as an island, tiny trees growing from its pages, a reading owl |
| `mundo-10-retos.webp` | A golden clay podium island with a trophy, a checkered finish flag and a small stopwatch, fireworks |

**Jefe final de cada mundo (opcional)** — `jefe-1.webp` … `jefe-10.webp`, 800×800: *"a friendly mischievous clay monster guarding the island of world N, big eyes, funny not scary, holds a tiny keyboard key"* (un monstruo distinto por mundo).

## 3. Fondos temáticos por grado — carpeta `assets/img/ui/` — 1920×1080 WebP (con fondo, sin transparencia)
| Archivo | Prompt |
|---|---|
| `fondo-grado-2.webp` | Pastel clay playground sky, big soft clouds, rainbow, balloons, wide empty center for UI, very playful |
| `fondo-grado-3.webp` | Clay meadow with smiling hills, butterflies and kites, bright, empty center |
| `fondo-grado-4.webp` | Clay jungle canopy with friendly toucans and vines, cool mint tones, empty center |
| `fondo-grado-5.webp` | Clay space station window with planets and tiny astronauts, deep violet tones, calmer, empty center |
| `fondo-grado-6.webp` | Minimal clay futuristic city skyline at dusk, violet/coral gradient, subtle, empty center |
| `portada-hero.webp` | Wide scene: Tecli and friends around a giant clay keyboard on a hill, 1600×1000 |

## 4. Medallas (42) — carpeta `assets/img/badges/` — 512×512 WebP transparente
**Prompt base:** `STYLE. A shiny 3D clay medal badge, circular, [DISEÑO]. Glossy metallic rim ([COLOR]), soft glow, ribbon at the top, no text.`
Archivo = `medalla-<clave>.webp`.

| Categoría | Clave → diseño (color del borde) |
|---|---|
| **Constancia** | `racha-3` small flame (bronze) · `racha-7` bigger flame with sparks (silver) · `racha-14` flame with wings (gold) · `racha-30` phoenix flame (diamond blue) · `racha-100` volcano of flame (rainbow) |
| **Precisión** | `precision-100` bullseye with an arrow in the center (gold) · `precision-95` target with arrow near center (silver) · `sin-errores-5` five tiny check marks (mint) · `precision-pro` laser crosshair (violet) · `lluvia-perfecta` rain of green checks (mint) |
| **Velocidad** | `veloz-10` snail with sneakers (bronze) · `veloz-20` rabbit running (silver) · `veloz-30` cheetah (gold) · `veloz-40` rocket with stripes (violet) · `veloz-50` lightning bolt (diamond) · `meta-grado` classroom flag of the grade (coral) |
| **Exploración** | `mundo-1` house key · `mundo-2` rocket · `mundo-3` anchor · `mundo-4` compass · `mundo-5` mountain flag · `mundo-6` magic wand · `mundo-7` abacus-like blocks · `mundo-8` speech bubble · `mundo-9` book · `mundo-10` crown (todas: color del borde = color del mundo) |
| **Juegos** | `juego-carrera` race car with flag · `juego-lluvia` cloud with falling words (abstract) · `juego-rescate` lifebuoy · `juego-blanco` dartboard · `juego-duelo` two crossed stopwatches |
| **Primera vez** | `primera-leccion` baby seedling · `primera-estrella` single star · `primera-tienda` shopping bag · `primer-juego` joystick · `primer-reto` flag |
| **Secretas** | `secreta-noctambulo` smiling moon · `secreta-madrugador` sun peeking · `secreta-ene` a stylized "ñ"-shaped tilde swirl (decorative) · `secreta-tecli` Tecli's face |
| **Clase** | `reto-clase` three hands joining · `top-mejora` upward arrow with sparkles |

*(Total: 42.)* **Versión "bloqueada":** no hace falta generarla; la app aplica escala de grises por CSS.

## 5. Tienda: avatares, accesorios, marcos y fondos — carpeta `assets/img/shop/`
Tecli y los avatares se visten con accesorios **superpuestos** (PNG/WebP transparente 512×512, mismo encuadre que Tecli para alinear).

| Archivos | Prompt |
|---|---|
| `acc-gorra.webp`, `acc-lentes.webp`, `acc-corona.webp`, `acc-auriculares.webp`, `acc-capa.webp`, `acc-sombrero-mago.webp`, `acc-gafas-sol.webp`, `acc-casco-espacial.webp`, `acc-bufanda.webp`, `acc-mono.webp` | `STYLE. A single clay [OBJETO] sized to fit Tecli's head/body, isolated, same lighting, transparent background` |
| `marco-oro.webp`, `marco-arcoiris.webp`, `marco-llamas.webp`, `marco-estrellas.webp`, `marco-hojas.webp` | `STYLE. A circular clay profile-frame ring, [MATERIAL], hollow center, 512×512` |
| `fondo-avatar-1.webp` … `fondo-avatar-6.webp` | `STYLE. Soft pastel clay circular scene background [cielo / selva / espacio / playa / ciudad / nieve], 512×512` |
| `tema-*.webp` (5) | Miniaturas de 320×200 de los temas de color (violeta, coral, menta, sol, noche) — *minimal flat gradient swatch with clay blobs* |
| `moneda.webp` | `STYLE. A shiny golden clay coin with a tiny keyboard-key emblem (no text), 256×256` |
| `xp-estrella.webp` | `STYLE. A glossy clay star, sun yellow, 256×256` |
| `proteccion-racha.webp` | `STYLE. A small clay shield with a flame inside, mint, 256×256` |

## 6. Ilustraciones de la introducción (postura y manos) — `assets/img/ui/` — 1024×768 WebP transparente
Para cada pareja haz **correcto** y **incorrecto** (el incorrecto exagera el error, de forma cómica no alarmante).
| Archivos | Prompt |
|---|---|
| `postura-espalda-ok.webp` / `postura-espalda-mal.webp` | `STYLE. A child sitting at a desk with a straight back / slouching badly, side view, clay` |
| `postura-pies-ok.webp` / `postura-pies-mal.webp` | Feet flat on floor / legs dangling or crossed |
| `postura-codos-ok.webp` / `postura-codos-mal.webp` | Elbows bent at 90° (angle arc as a soft ring, no numbers) / arms stretched too high |
| `postura-pantalla-ok.webp` / `postura-pantalla-mal.webp` | Screen at eye level, arm's-length distance / screen too low, face too close |
| `postura-munecas-ok.webp` / `postura-munecas-mal.webp` | Wrists floating level above keys / wrists resting heavily on the desk edge |
| `manos-fila-base.webp` | Top view of two clay hands resting on a keyboard home row, each finger a different color (pinky pink, ring yellow, middle mint, index blue, thumbs lilac), little bumps glowing on F and J |
| `manos-pulgares.webp` | Both thumbs hovering over the space bar |

## 7. Animaciones Lottie — carpeta `assets/lottie/` — JSON ≤ 150 KB
Fuentes recomendadas: LottieFiles (filtra por licencia *Lottie Simple License*/CC0) o crea con Rive/LottieFiles Creator.
| Archivo | Descripción |
|---|---|
| `confeti.json` | Explosión de confeti multicolor, 1.5 s, sin bucle |
| `llama-racha.json` | Llama que respira, bucle |
| `medalla-brillo.json` | Destello que cruza una medalla, 1 s |
| `tecli-celebra.json` | Tecli saltando (si lo tienes en vector) |
| `cargando.json` | Tecla que late |
| `estrellas-3.json` | Tres estrellas que aparecen con rebote |

## 8. Sonidos (opcional) — `assets/sounds/` — OGG/MP3 corto
`tecla.mp3` (clic suave) · `error.mp3` (tono bajo) · `acierto.mp3` · `medalla.mp3` · `nivel.mp3` · `ganar.mp3`. Fuentes libres: freesound.org (CC0), Pixabay Sounds, Kenney.nl.

## 9. Alternativas gratuitas con licencia libre (mientras generas tu arte)
| Recurso | Qué sirve | Licencia / nota |
|---|---|---|
| **Storyset** (storyset.com) | Escenas ilustradas por tema, editables en color | Gratis con atribución |
| **unDraw** (undraw.co) | Escenas vectoriales cambiando el color primario a `#6C4CF5` | MIT-like, sin atribución |
| **LottieFiles** (lottiefiles.com) | Confeti, llamas, medallas, personajes | Revisa la licencia de cada animación |
| **OpenMoji** (openmoji.org) | Emoji de estilo uniforme para reemplazar los emoji del sistema | CC BY-SA 4.0 (atribución) |
| **Twemoji / Noto Emoji** | Emoji consistentes | CC-BY 4.0 / OFL |
| **Kenney.nl** | Iconos, UI y sonidos de juego | CC0 |
| **Openverse / Pixabay** | Fondos e imágenes | Revisar licencia por imagen |
| **Blush.design** | Personajes de ilustración mezclables | Mira términos gratuitos |

Nota práctica: para la mascota consistente **genera las 8 poses en la misma sesión**, pega la descripción base completa cada vez y
usa la primera imagen como referencia de estilo/personaje si el generador lo permite. Quita el fondo con remove.bg o rembg si no sale transparente,
y comprime con Squoosh (WebP calidad 85) para mantener cada archivo < 150 KB.
