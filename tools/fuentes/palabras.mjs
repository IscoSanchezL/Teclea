/**
 * Vocabulario base (español de Colombia, apto para primaria). Todo en minúsculas.
 * Los generadores filtran por las teclas que el estudiante ya aprendió.
 */
const L = (s) => s.split(/\s+/).filter(Boolean);

// Palabras SIN tilde ni ü (se pueden usar antes del mundo 6)
export const PALABRAS = L(`
la las el los un una de del que y a en es se no te lo le da su por con para como pero sus al si ya o fue son hay ala alas asa asas sala salas salsa falda faldas gala galas gafas jala jalas halla hallas dalas saga sagas alga algas hasta casa casas cosa cosas mesa mesas silla sillas puerta puertas patio patios cama camas mapa mapas libro libros hoja hojas perro perros gato gatos pato patos pollo pollos vaca vacas toro toros oveja ovejas cerdo cerdos burro burros mono monos oso osos lobo lobos zorro zorros tigre tigres jirafa jirafas cebra cebras loro loros pez peces rana ranas sapo sapos tortuga tortugas culebra culebras hormiga hormigas abeja abejas mariposa mariposas mosca moscas mosquito mosquitos grillo grillos conejo conejos ardilla ardillas ballena ballenas pulpo pulpos cangrejo cangrejos caballo caballos agua aguas fuego tierra viento nube nubes lluvia rayo sol soles luna lunas estrella estrellas cielo cielos mar mares lago lagos monte montes playa playas isla islas selva selvas bosque bosques campo campos flor flores rosa rosas hoja rama ramas fruta frutas manzana manzanas pera peras uva uvas fresa fresas mora moras mango mangos papaya piña naranja naranjas banano bananos coco cocos arroz papa papas yuca arepa arepas pan panes leche queso quesos huevo huevos carne sopa sopas jugo jugos dulce dulces torta tortas helado helados galleta galletas papa hijo hija hijos hermano hermana abuelo abuela primo prima amigo amiga amigos amigas cabeza cara ojo ojos nariz boca diente dientes mano manos dedo dedos brazo brazos pierna piernas pie pies pelo oreja orejas cuello espalda panza escuela clase clases patio recreo profe profesor profesora maestro maestra tarea tareas nota notas cuaderno cuadernos borrador regla reglas tijeras pegante pintura pinturas juego juegos pelota pelotas gol goles equipo equipos carrera carreras salto saltos baile bailes canciones ritmo guitarra tambor flauta piano teclado teclados pantalla pantallas computador computadores tablet correo mensaje mensajes video videos foto fotos red redes letra letras tecla teclas rojo roja azul verde amarillo amarilla negro negra blanco blanca morado rosado naranja gris dorado plateado claro oscuro grande grandes largo larga corto corta alto alta bajo baja lento lenta fuerte fuertes suave duro blando nuevo nueva viejo vieja feliz alegre triste bravo bonito bonita lindo linda amable valiente tranquilo tranquila curioso curiosa listo lista correr saltar caminar jugar leer escribir dibujar pintar cantar bailar nadar volar comer beber dormir soñar sonar mirar ver hablar decir pensar querer poder saber ayudar abrir cerrar subir bajar entrar salir llegar buscar encontrar guardar tomar dar poner traer llevar cortar pegar armar crear mover empujar hoy ayer tarde noche semana semanas mes meses hora horas rato siempre nunca pronto luego antes ahora cerca lejos uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince veinte treinta cien mil primero segundo tercero yo tu el ella nosotros ustedes ellos ellas mi mis tu tus nuestro nuestra este esta estos estas ese esa aquel quien cual cuando donde todo todos toda todas mucho mucha muchos muchas poco poca tengo tienes tiene tenemos tienen soy eres somos estoy estas esta estamos voy vas va vamos van hago haces hace hacemos quiero quieres quiere puedo puedes puede niño niña niños niñas años sueño sueños señal señales montaña montañas pequeño pequeña español araña arañas piña piñas baño baños caña cañas leña ñoño quedar quiso queso quien quince aquel parque paquete esquina porque zapato zapatos zapatilla zona zorro luz luces azul azules feliz felices pizza taza tazas cabeza examen taxi boxeo extra exacto wifi web kiwi kilo kilos koala karate kiosco
texto sexto expreso experto explorar explicar extremo exterior excelente pretexto maxilar
zanahoria zumo paz voz vez cruz plaza lazo abrazo abrazar empezar comenzar cazar gozar cerezas azucena
quiero parque paquete esquina tranquilo quince queso rosquilla banquete chiquito
`);

// Palabras CON tilde o ü (mundo 6 en adelante)
export const PALABRAS_TILDE = L(`
más está también qué cómo cuándo dónde quién cuál papá mamá café sofá bebé camión canción corazón avión balón limón melón patrón botón jabón sillón lección razón
árbol árboles lápiz lápices fácil difícil útil azúcar cárcel ángel carácter móvil mármol
música médico química física mágico mágica número números teléfono teléfonos teclado fútbol béisbol básquetbol sábado miércoles
éxito rápido rápida último última único única próximo próxima pájaro pájaros murciélago tímido tímida fantástico fantástica
cuándo cómo dónde adónde día tío tía río ríos país países maíz raíz baúl lío frío fría
pingüino pingüinos cigüeña vergüenza bilingüe lingüista agüita antigüedad desagüe averigüé
jamás además allá allí aquí así acá aún según adiós después qué
Colombia Bogotá Medellín Cúcuta Ibagué Popayán Quibdó Montería Pereira Cartagena Perú Panamá México Japón Egipto
Sofía María Andrés Tomás Nicolás Martín Valentina Mateo Camila Santiago Juan Daniela Sebastián Gabriela
bailarín dibujó cantó escribió corrió saltó comió jugó miró vió
`);

export const NOMBRES = L(`Ana Luis Sara Juan Diego Laura Carla Mario Pedro Elena Hugo Irene Pablo Rosa Lucas Marta Nora Oscar Paula Raul Sonia Teo Vera Iker Alma Dario Eva Fabio Gala Hector Ines Julio Karla Leo Mia Nico Olga Pilar Quique Rita Saul`);
export const LUGARES = L(`Colombia Cali Quito Lima Chile Cuba Brasil Argentina Cartagena Barranquilla Pasto Neiva Armenia Pereira Manizales Leticia Tunja Yopal Mocoa Florencia Arauca Sincelejo Valledupar Riohacha Villavicencio Amazonas Andes Orinoco Magdalena Cauca Caribe Santander Tolima Huila Sucre Guaviare Vichada`);
