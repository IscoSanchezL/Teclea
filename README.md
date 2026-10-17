# TECLEA · Aprende a teclear jugando

Plataforma web de mecanografía en español (Latinoamérica) para primaria (2.º–6.º): lecciones por mundos, juegos, medallas,
clases y paneles para docentes. HTML + CSS + JavaScript ES Modules + Firebase, **sin paso de compilación**.

> "TECLEA" es un nombre provisional: cámbialo en `js/core/config.js`.

## Probar ya (modo demo, sin Firebase)
```bash
python3 -m http.server 8000
```
Luego abre http://localhost:8000 → **Entrar** → botones de "Modo demostración" (Estudiante 2.º–6.º, Docente, Admin).
Detén el servidor con `Ctrl+C`. Alternativa: `npx serve .`

## Bilingüe (ES | EN)
La plataforma funciona en español e inglés (selector **ES | EN** en la barra superior y en la pantalla de entrada; se guarda en `localStorage['labs-lang']`).
- Textos de la interfaz: `js/i18n/es.js` y `js/i18n/en.js` (mismas claves; `node tests/i18n.test.mjs` lo comprueba). Uso: `t('clave', { x })`.
- Datos: campos paralelos `nombre_en` / `descripcion_en` / `teclas_en` en `data/worlds.json`, `badges.json`, `shop.json`.
- Lecciones y textos para teclear **no se traducen**: hay variantes en inglés en `data/en/` (lecciones, `texts.json`, `palabras.json`), generadas con `node tools/generar-lecciones.mjs en` a partir de `tools/fuentes/en.mjs`. Las lecciones que enseñan teclas propias del español (ñ, tildes, ¿ ¡) conservan su texto en español.

## Estado del proyecto
Todas las fases están construidas y probadas (237 comprobaciones automáticas, 0 errores de accesibilidad automática en las vistas principales):

| Área | Contenido |
|---|---|
| Estudiante | 144 lecciones en 10 mundos, motor de escritura con teclado virtual y manos, refuerzo adaptativo, práctica libre, 5 minijuegos, XP, monedas, racha, 49 medallas, tienda, retos diarios, avatar o foto |
| Docente | Clases con código y QR, alumnos con usuario + PIN (tarjetas imprimibles), tareas con entrega automática, resumen real, mapa de calor, CSV, boletín, certificados |
| Administración | Aprobación de docentes, lista blanca, marca (logo y portada), ajustes, catálogos, respaldo JSON, datos personales, auditoría |
| Confiabilidad | Sin conexión (service worker + caché Firestore), reglas de seguridad probadas, respaldo diario cifrado |

**Para ponerla en marcha:** [`docs/GUIA_RAPIDA.md`](docs/GUIA_RAPIDA.md) y el asistente `configurar.html`.

## Documentación
- [`docs/GUIA_RAPIDA.md`](docs/GUIA_RAPIDA.md) — **empieza aquí**: dejarla funcionando en 30–40 minutos
- [`docs/PEDAGOGIA.md`](docs/PEDAGOGIA.md) — por qué 144 lecciones desarrollan la memoria muscular
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — estructura, decisiones, seguridad
- [`docs/FIRESTORE_SCHEMA.md`](docs/FIRESTORE_SCHEMA.md) — colecciones, campos, consultas
- [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) — crear Firebase y publicar en GitHub Pages
- [`docs/CONFIABILIDAD.md`](docs/CONFIABILIDAD.md) — capacidad, modo sin conexión, seguridad, respaldos y plan de contingencia
- [`firestore.rules`](firestore.rules) · [`firestore.indexes.json`](firestore.indexes.json)
- [`ASSETS_PROMPTS.md`](ASSETS_PROMPTS.md) — prompts para generar toda la ilustración

## Privacidad
Sin analítica, sin anuncios, sin rastreadores. Datos mínimos y aviso de privacidad conforme a la Ley 1581 de 2012
(plantilla en `#/privacidad`; **debe revisarla el área jurídica del colegio**).
