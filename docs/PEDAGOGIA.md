# Pedagogía: ¿cuántas lecciones hacen falta?

**Respuesta corta:** con solo 10 lecciones no se desarrolla la memoria muscular. Por eso el currículo tiene **144 lecciones en 10 mundos**
(≈ 430 ejercicios) que suman unas **14 horas de práctica guiada** a 10 PPM (grado 4.º), más práctica libre, refuerzo adaptativo y juegos
sin límite. Los 10 "mundos" son los grandes bloques; cada uno contiene 11–16 lecciones.

## Principios que guían el diseño
| Principio | Cómo se aplica |
|---|---|
| **Pocas teclas nuevas por vez** | 1–2 teclas por lección (F y J, D y K, S y L…). Nunca más de 4 símbolos nuevos juntos |
| **Repetición espaciada e intercalada** | Cada lección mezcla las teclas nuevas con **todas** las anteriores; hay lecciones de repaso, de "combos" (es, en, ra, tr…) y un **jefe** al final de cada mundo |
| **Precisión antes que velocidad** | Estrellas con meta de precisión por grado (85–93 %); lecciones "Precisión" en modo estricto (no avanzan con errores) |
| **Retroalimentación inmediata** | Verde/rojo por carácter, tecla y dedo iluminados, PPM y precisión en vivo |
| **Aprendizaje por maestría** | La siguiente lección se abre al lograr ≥ 1★; el docente puede abrir o cerrar mundos |
| **Retirar las ayudas poco a poco** | Cada lección: *guiado* (tecla y dedo señalados) → *libre* (teclado visible sin guía) → *prueba* (a veces con el teclado oculto) |
| **Sesiones cortas y frecuentes** | Cada lección dura 3–6 min; mejor 15–20 min, 2–4 veces por semana, que una hora seguida |
| **Textos con sentido** | Palabras y frases reales en español de Colombia; nada de ortografía incorrecta (verificador automático) |
| **Éxito visible** | Estrellas, XP, medallas y comparación contra tu propia mejor marca |

## Estructura del currículo
| Mundo | Contenido | Lecciones |
|---|---|---|
| 1 Fila base | F J · D K · S L · A Ñ · G H, palabras, ritmo, precisión, velocidad, jefe | 14 |
| 2 Fila superior | E I · R U · T Y · W O · Q P, combos, frases | 14 |
| 3 Fila inferior | V M · C , · X . · Z - · B N, comas y puntos, sílabas con guion | 12 |
| 4 Todo el alfabeto | Ñ, letras difíciles, refuerzo de meñiques, frases por tema, trabalenguas | 14 |
| 5 Mayúsculas y Shift | Shift izquierdo/derecho, nombres, lugares, siglas, títulos | 11 |
| 6 Tildes y signos | á é í ó ú · ü · ¿ ? ¡ ! · ; : | 16 |
| 7 Números y símbolos | 4567 · 38 · 29 · 10 · + = · * / · $ % · ( ) " · @ # & · correos y claves | 15 |
| 8 Palabras y frases | 13 temas (animales, escuela, ciencia, Colombia…), refranes, trabalenguas | 16 |
| 9 Párrafos y textos reales | 13 párrafos y cuentos originales | 16 |
| 10 Velocidad y precisión | Sprints, "sin mirar" (teclado oculto), maratones de 3 y 5 min, jefe final | 16 |
| **Total** | | **144** |

## Adaptación por grado
- **Longitud:** los textos de prueba se acortan/alargan (×0,6 · 0,8 · 1 · 1,2 · 1,4 para 2.º…6.º).
- **Metas:** las estrellas usan el PPM y la precisión del grado (2.º 8–12 PPM · 85 %, … 6.º 30–40 PPM · 93 %), escaladas por lección
  (30 % de la meta en el mundo 1 → 100 % en los mundos 9–10).
- **Ruta recomendada:** 2.º mundos 1–4 · 3.º 1–6 · 4.º 1–8 · 5.º y 6.º todos. No bloquea: solo orienta; el docente decide.
- **Tiempo contrarreloj:** +25 % en 2.º y 3.º.

## Más práctica sin límite
- **Práctica libre**: 250+ textos por tema y nivel, de 1, 2, 3 o 5 minutos.
- **Refuerzo adaptativo**: la plataforma guarda errores por tecla y arma lecciones con las teclas que más fallas.
- **Juegos**: carrera, lluvia de palabras, tiro al blanco y duelo: repetición disfrazada de diversión.
- **Retos diarios y rachas**: la constancia (poco cada día) es lo que consolida la memoria muscular.

## Cómo editar el currículo
Las lecciones se generan con `node tools/generar-lecciones.mjs` a partir de las listas de `tools/fuentes/` (vocabulario, frases y párrafos).
Agrega palabras o textos, vuelve a ejecutar y haz commit. El generador **rechaza** ortografía dudosa y caracteres imposibles de teclear.
Pruebas: `node tests/curriculo.test.mjs`.

> Las duraciones son estimaciones de diseño; después de las primeras clases se ajustan con los datos reales de la plataforma
> (el panel docente muestra el tiempo y el avance por estudiante).
