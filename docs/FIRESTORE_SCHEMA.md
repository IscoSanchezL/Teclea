# Esquema de Firestore

Convenciones: nombres en español, fechas como `Timestamp` (siempre `serverTimestamp()`), IDs compuestos `a_b` para poder
hacer `get` directo sin consultas (barato y compatible con las reglas).

Leyenda de acceso: **E** estudiante dueño · **D** docente dueño de la clase · **A** admin · **S** cualquier sesión iniciada.

## Colecciones de usuarios y clases

### `users/{uid}`
| Campo | Tipo | Notas |
|---|---|---|
| uid, nombre, apodo | string | `apodo` es lo único visible a compañeros |
| email | string \| null | null en cuentas PIN |
| rol | `estudiante`\|`docente`\|`admin` | las reglas validan quién puede crearse cada rol |
| grado | int 2–6 \| null | el estudiante lo fija una sola vez; luego solo docente/admin |
| avatar | map `{emoji, fondo, marco, accesorios[]}` | |
| xp, nivel, monedas | int | topes por escritura en reglas |
| racha, rachaMax, ultimoDia (`YYYY-MM-DD`), protectores | int/string | |
| prefs | map | tema, texto, fuente, daltónico, sonido… |
| authTipo | `google`\|`pin` | |
| creadoPor | uid \| null | docente que creó la cuenta PIN |
| consentimiento | map `{version, aceptadoEn}` | evidencia habeas data |
| creadoEn, ultimaConexion | Timestamp | |
| activo | bool | |
| solicitudEliminacion | Timestamp? | el estudiante pide borrar sus datos |

Acceso: lee **E**, **A**, **D** (solo si `creadoPor == D`). Escribe **E** (campos permitidos), **A**.

### `teacher_whitelist/{correoEnMinúsculas}` — solo **A** (cada persona lee solo su correo)
`{ correo, agregadoPor, agregadoEn }`

### `classes/{classId}`
`docenteId, nombre, grado, grupo, color, imagen, codigo(6), activa, creadoEn,`
`config: { metas:{ppmMin,ppmMax,precision}, mundosBloqueados:[int], modoExamen:{activo,duracionSeg}, rankingVisible:bool, tamanoLetra }`

Subcolecciones: `aportes/{uid}` (reto colectivo: `{caracteres, sesiones, actualizadoEn}`) y `ranking/{uid}` (`{apodo, avatar, puntos, mejora}`).

### `class_codes/{CODIGO}`
`{ classId, docenteId }`. Alfabeto sin `0 O 1 I`. Solo `get` (no se puede listar). Regenerar = borrar + crear en un lote.

### `enrollments/{classId_uid}`
`uid, classId, docenteId, codigo, alias, avatar, grado, estado, unidoEn, ultimaConexion,`
`stats: { xp, mejorWpm, precisionProm, minutos, sesiones, lecciones, medallas, caracteres, ppmInicial, ultimaPractica }, pin?, metaOverride?, notaDocente?`
`pin` (4 dígitos) solo lo escribe el docente al crear una cuenta con usuario + PIN; lo ven el docente, el administrador y el propio estudiante.

> **Decisión clave:** `stats` es un resumen desnormalizado que actualiza el propio estudiante. La tabla del docente es **1 lectura por
> estudiante** y el docente nunca necesita leer `users` ni todas las `sessions`.

## Progreso y práctica

### `lessons_progress/{uid_lessonId}`
`uid, lessonId, mundo(1–10), estrellas(0–3), mejorWpm, mejorPrecision, intentos, completada, docenteIds[], actualizadoEn`
No puede bajar `mejorWpm` ni `estrellas`.

### `sessions/{autoId}` (inmutable)
`uid, classId?, docenteId?, tipo(leccion|practica|juego|examen|asignacion), refId, wpm, precision, errores, duracionSeg, caracteres,`
`erroresPorTecla: {"a":3,"ñ":5}, flags:{pegado,rafaga,sospechoso}, dia ("AAAA-MM-DD", para consultar sin índices), creadoEn`

Reglas anti-trampa: `wpm ≤ 200`, `caracteres ≤ duracion×12`, y `wpm × duración ≤ caracteres/5 × 60 + 30`.

### `badges_earned/{uid_badgeId}` · `inventory/{uid_itemId}` · `challenge_progress/{uid_retoId}`
Se crean una sola vez. `inventory` solo se crea en un lote que descuenta las monedas exactas del precio (`getAfter`).

## Tareas

### `assignments/{id}`
`docenteId, classId, tipo(leccion|ejercicio|juego|examen), refId, titulo, instrucciones, fechaLimite, metas?, modoExamen?{activo,duracionSeg}, creadoEn`
Lee **D**, **A** y estudiantes inscritos.

### `submissions/{assignmentId_uid}`
`uid, assignmentId, classId, docenteId, sessionId, wpm, precision, estado, enviadaEn, nota?, comentario?` — el docente solo puede poner `nota`/`comentario`.

### `custom_exercises/{id}`
`docenteId, classId|null, titulo, texto, tema, creadoEn` — el texto propio del docente.

## Catálogos (leen **S**, escribe **A**)
`lessons/{id}` · `texts/{id}` · `badges/{id}` · `shop_items/{id}` · `daily_challenges/{yyyyMMdd}` · `config/{app|grade_profiles}`

`config/grade_profiles` sobrescribe los valores de `js/core/grados.js` cuando existe.

## Auditoría
`contadores/{uid}`: `{ c:{ sesiones, juegos, perfectas, juego_<id>, … }, actualizadoEn }` (alimentan las medallas). `key_stats/{uid}`: `{ teclas:{k<hex>:{ok,err}} }` (refuerzo adaptativo).
`config/app`: `{ permitirFotos, dominiosAlumnos[] }` · `config/branding`: `{ nombre, lema, colegio, logo, hero }` (lectura pública).
`audit_logs/{autoId}`: `{ actorUid, rol, accion, objetivo, detalle, creadoEn }` — solo se agrega; lee **A**.

## Consultas típicas (todas con igualdad: **no requieren índices compuestos**)
| Pantalla | Consulta | Lecturas |
|---|---|---|
| Inicio estudiante | `get users/{uid}` + `lessons_progress where uid==me` | 1 + ≤ 150 (caché local después) |
| Retos de hoy | `sessions where uid==me and dia==hoy` | las de hoy |
| Tabla docente | `enrollments where docenteId==yo` | 1 por estudiante |
| Mapa de calor / minutos | `sessions where docenteId==yo and dia in [últimos 14 días]` | acotado |
| Ranking de la clase | `classes/X/ranking` (≤ 40 documentos) | 1 por estudiante |
| Tareas del estudiante | `assignments where classId==X` + `submissions where uid==me and classId==X` | pocas |

## Estrategia de lecturas y caché
- Firestore con `persistentLocalCache` (offline + varias pestañas): lecturas repetidas salen de caché.
- Catálogos (`lessons`, `texts`, `badges`) se descargan una vez y se guardan versionados en el service worker.
- Las sesiones se escriben **al terminar** cada ejercicio (no por tecla). Si no hay red, Firestore las encola y las sincroniza al reconectar.
- Los resúmenes (`enrollments.stats`, `users.xp`) se actualizan con la misma escritura en lote que la sesión.
