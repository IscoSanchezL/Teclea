# TECLEA · Aprende a teclear jugando

Plataforma web de mecanografía en español (Latinoamérica) para primaria (2.º–6.º): lecciones por mundos, juegos, medallas,
clases y paneles para docentes. HTML + CSS + JavaScript ES Modules + Firebase, **sin paso de compilación**.

> "TECLEA" es un nombre provisional: cámbialo en `js/core/config.js`.

## Probar ya (modo demo, sin Firebase)
```bash
python3 -m http.server 8000      # o: npx serve .
# abre http://localhost:8000 → Entrar → "Estudiante / Docente / Admin" (modo demostración)
```

## Estado del proyecto
| Fase | Contenido | Estado |
|---|---|---|
| 0 | Arquitectura, esquema Firestore, reglas, guía Firebase | ✅ |
| 1 | Sistema de diseño, layout, navegación, portada, acceso, perfil/ajustes | ✅ |
| 2 | Motor de escritura + teclado virtual con manos + lección demo | ⏳ |
| 3 | Currículo de 10 mundos, mapa real y progreso | ⏳ |
| 4 | Gamificación y minijuegos | ⏳ |
| 5 | Clases, panel docente, tareas y reportes | ⏳ |
| 6 | Panel admin, PWA offline, certificados PDF, pulido | ⏳ |

## Documentación
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — estructura, decisiones, seguridad
- [`docs/FIRESTORE_SCHEMA.md`](docs/FIRESTORE_SCHEMA.md) — colecciones, campos, consultas
- [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) — crear Firebase y publicar en GitHub Pages
- [`firestore.rules`](firestore.rules) · [`firestore.indexes.json`](firestore.indexes.json)
- [`ASSETS_PROMPTS.md`](ASSETS_PROMPTS.md) — prompts para generar toda la ilustración

## Privacidad
Sin analítica, sin anuncios, sin rastreadores. Datos mínimos y aviso de privacidad conforme a la Ley 1581 de 2012
(plantilla en `#/privacidad`; **debe revisarla el área jurídica del colegio**).
