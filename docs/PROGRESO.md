# Progreso del proyecto (bitácora técnica)

Decisiones fijas:
- Único administrador: `franksanlo@gmail.com` (reglas: `bootstrapAdmin()` con correo verificado; `config.js`: `adminEmail`).
- Docentes: lista blanca manual (admin) o registro con Google → rol `pendiente` hasta aprobación del admin.
- Capa de datos única `js/db/store.js` (local demo / Firestore). Fechas siempre en milisegundos.
- Marca editable: `config/branding` (lectura pública). Fotos de perfil: data URL ≤ 60 KB en `users.foto` (solo el dueño y el admin).
- **Sin índices compuestos**: todas las consultas usan igualdad (y `in` para días recientes); las sesiones guardan `dia` (AAAA-MM-DD).
- Rankings: solo apodo + avatar (emoji/fondo), nunca nombre ni foto.

## Hecho
| Bloque | Contenido |
|---|---|
| Base | Fases 0–1, modo sin conexión (service worker + caché Firestore), reglas, respaldo diario cifrado, login/portada modernos, roles y aprobación, marca editable, avatar + foto |
| Currículo | 144 lecciones en 10 mundos (generador determinista), práctica espaciada, refuerzo adaptativo — `docs/PEDAGOGIA.md` |
| Motor | `MotorEscritura` (PPM neto, precisión, modo estricto, anti-trampa), teclado virtual con manos, teclas muertas/tildes |
| Gamificación | XP, monedas, nivel, racha y protectores, 49 medallas SVG, 22 artículos de tienda (accesorios, fondos, marcos, 4 temas de color), retos diarios, 5 minijuegos |
| Clases | Clases con código de 6 caracteres, enlace y QR, inscripción por código, alumnos con usuario + PIN y tarjetas imprimibles, tareas (lección / texto propio / juego) con entrega automática y notas, ranking positivo, reto de la clase, mundos abiertos/cerrados por clase |
| Docente | Resumen real (KPIs, minutos por día, mapa de calor de errores, quién necesita apoyo), tabla de estudiantes con CSV, detalle con nota privada, boletín imprimible, certificados por mundo |
| Admin | Estado del sistema, docentes (aprobar/rechazar/lista blanca), marca (logo, portada, nombre), ajustes (fotos, dominios), catálogos auto-publicados, respaldo JSON, exportar/eliminar datos personales, auditoría |
| Puesta en marcha | `configurar.html` (asistente), `docs/GUIA_RAPIDA.md` |

## Pruebas (cd tests && npm run test:todo)
motor 40 · currículo 16 · reglas 74 · progreso 26 · gamificación 29 · clases 34 · admin 18 = **237** comprobaciones.
Además: `node carga.mjs` (30 navegadores), `node offline.mjs`.

## Pendiente / ideas futuras
- Modo examen con tiempo y sin retroceso para tareas (la estructura `modoExamen` ya existe en las reglas).
- Restablecer PIN desde la app (requiere función en servidor; hoy se ve el PIN y se puede quitar/recrear).
- Certificados en PDF con jsPDF (hoy se imprimen desde el navegador → “Guardar como PDF”).
