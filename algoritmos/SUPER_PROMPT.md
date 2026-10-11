# Beto y los Algoritmos · Referencias y súper prompt

## Qué se investigó (apps y sitios para 5–7 años)
| Referencia | Qué hace bien | Lo que tomamos |
|---|---|---|
| [ScratchJr](https://teachbesideme.com/coding-apps-kids/) | Bloques con íconos, sin leer | Botones grandes con íconos + voz |
| [Lightbot Jr](https://www.robowunderkind.com/blog/10-best-coding-games-for-kids) | Robot que sigue pasos en un tablero | Beto + tablero, estrella y bandera |
| [Kodable](https://teachbesideme.com/coding-apps-kids/) | Laberintos con instrucciones arrastradas | Niveles progresivos en cuadrícula |
| [CodeSpark](https://imaginationsoup.net/coding-apps-kids/) | Rutas por mundos, recompensas | Mapa por mundos, estrellas, ritmo suave |

Lo que ninguna ofrece (nuestro diferenciador): **avance por nombre sin cuentas ni correos**, tablero y robot en **3D real con CSS**, lección narrada y modo para la profe (voz, copia de seguridad, reiniciar por niño).

## Voz menos robótica
La Web Speech API usa las voces del equipo ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)). La página elige sola la mejor voz en español (prioriza "Natural/Neural/Online", es-MX), baja el ritmo y sube un poco el tono. **Para la clase:** abre ⚙️ → "Voz de Beto" y prueba hasta encontrar la más natural (en Edge, las "Online (Natural)" son las mejores; en Chrome Android, las de Google). Para calidad de estudio, grabar los audios con una voz humana o TTS neuronal y reproducirlos como MP3 es la mejor opción (ver prompt).

## SÚPER PROMPT (para pedir la versión 2.0 a una IA o a un equipo)
```
Actúa como diseñador de juegos educativos infantiles, ingeniero front-end senior y especialista en
pedagogía de pensamiento computacional. Mejora "Beto y los Algoritmos", una web (HTML + CSS + JavaScript
vanilla, sin build, carpeta /algoritmos, offline-first como PWA) para niños de PRIMER GRADO (6–7 años,
lectores iniciales) que enseña qué es un algoritmo y practica secuencias, giros y repeticiones.

OBJETIVO PEDAGÓGICO (alineado a CSTA K-2 / Code.org): secuencia, orden correcto, depuración (encontrar el
paso equivocado), bucles simples y descomposición. Cada nivel introduce UN solo concepto nuevo.
Progresión: ordenar rutinas → mover robot (avanzar) → girar → repetir → depurar un programa con un error →
condicional simple ("si hay estrella, recógela") solo como mundo bonus.

REGLAS PARA PRIMER GRADO
- Casi sin leer: todo texto breve (máx. 8 palabras), con ícono grande y voz. Botones ≥ 64 px, tolerantes a
  toques torpes; sin arrastrar obligatorio (tocar para agregar, tocar para quitar; arrastrar opcional).
- Cero frustración: errores explicados con cariño ("¡Ups, choqué! Intentemos otra vez"), pista en 3 niveles
  (voz → resaltar bloque → mostrar el primer paso), nunca pantallas de "fallaste".
- Sesiones de 15–20 min; el avance se guarda tras CADA nivel.

IDENTIDAD Y AVANCE SIN CUENTAS
- Entrada solo con nombre + avatar (animal). Perfiles en localStorage con clave normalizada (sin tildes,
  minúsculas). Si el nombre existe, continúa donde quedó; si es nuevo, empieza en cero (otro grupo = otros
  nombres). Lista de "¿Quién eres?" con chips grandes. Detectar nombres duplicados y sugerir inicial.
- Panel de profe protegido por operación aritmética: reiniciar niño, abrir niveles, exportar/importar JSON,
  elegir voz y velocidad, silenciar. Opción de sincronizar con Firebase (el repo ya lo usa) solo si el
  docente lo activa, sin datos personales más allá del primer nombre.

3D Y ANIMACIÓN (el factor "wow", fluido a 60 fps en un Chromebook escolar)
- Escena isométrica con CSS 3D (o three.js ligero cargado de CDN con fallback CSS): baldosas con grosor,
  sombras suaves, robot Beto de cubos con ojos que parpadean, antena que se enciende, rueda que gira.
- Animación con intención: anticipación antes de avanzar, rebote al llegar, giro con sobreimpulso, estrella
  que levita y vuela al contador, confeti 3D al ganar, cámara que se inclina suavemente al cambiar de nivel.
- Parallax de fondo con formas 3D flotantes; giroscopio/ratón opcional. Respetar prefers-reduced-motion.
- Mundos con temas visuales distintos (granja, espacio, océano, bosque de dulces) y música ambiental
  suave con control de volumen.

VOZ NATURAL
- Capa de audio: 1) si existe /audio/<id>.mp3 (voz humana o TTS neuronal), reproducirla; 2) si no, Web
  Speech API eligiendo la mejor voz es-MX/es-US "Natural/Neural", ritmo 0.9, tono 1.1; 3) si no hay voz,
  subtítulos grandes sincronizados. Frases cortas, cálidas y variadas (nunca la misma felicitación 2 veces
  seguidas), con el nombre del niño. Resaltar la palabra que se dice. Botón 🔊 en cada pantalla.

CONTENIDO (mínimo 30 niveles en 6 mundos)
- Mundo 1 Orden: rutinas (dientes, plantar, sándwich, vestirse, cruzar la calle) + "¿qué paso falta?".
- Mundo 2 Avanza: recta y estrellas. Mundo 3 Gira: izquierda/derecha. Mundo 4 Repite: ×N visual con bucle
  que se ilumina. Mundo 5 Depura: programa con un error que el niño corrige. Mundo 6 Bonus: crea tu propio
  laberinto y compártelo con un código.
- Mini-lección animada de 90 s por mundo con Beto, y "mundo sin pantalla": ficha imprimible para la clase
  (el niño programa a un compañero-robot en el piso).
- Estrellas por eficiencia (menos bloques = más estrellas), álbum de pegatinas coleccionables, atuendos
  para Beto (sombrero, capa) desbloqueables. Sin tiempo límite, sin vidas, sin anuncios, sin compras.

CALIDAD
- Accesible (WCAG AA, foco visible, lector de pantalla, daltonismo: formas + color), responsive
  (tableta, Chromebook, celular), funciona sin internet, carga < 2 s, sin dependencias salvo CDN opcional.
- Pruebas automáticas del simulador (todas las soluciones de referencia ganan y dan 3 estrellas) y
  pruebas de humo con Playwright en 3 tamaños de pantalla.
- Entregable: código completo, comentado en español, README para la docente y guía de clase de 45 min
  (inicio 10 min lección, 25 min práctica, 10 min cierre con "¿qué es un algoritmo?").
```
