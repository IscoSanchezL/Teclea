# Progreso del proyecto (bitácora técnica)

Decisiones fijas:
- Único administrador: `franksanlo@gmail.com` (reglas: `bootstrapAdmin()`; `config.js`: `adminEmail`).
- Docentes: lista blanca manual (admin) o registro con Google → rol `pendiente` hasta aprobación del admin.
- Capa de datos única `js/db/store.js` (local demo / Firestore). Fechas siempre en milisegundos.
- Marca editable: `config/branding` (lectura pública). Fotos de perfil: data URL ≤ 60 KB en `users.foto`.

Hecho: Fases 0–1, modo sin conexión, reglas (74 pruebas), respaldo cifrado, interfaz sobria staff, login/portada modernos,
roles + aprobación, marca editable (lectura), avatar + foto, medallas SVG, hero 3D.
En curso: currículo ampliado → motor → gamificación → clases/docente → admin real → configuración guiada.
