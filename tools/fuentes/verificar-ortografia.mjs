/**
 * Verificador: busca palabras que, SIN tilde o sin ñ, estarían mal escritas.
 * Se usa para el texto "sin tildes" (mundos 1-5) y evita enseñar ortografía incorrecta.
 */
const MALAS = new Set(`mama rapido rapida tecnologia salon leccion tambien balon pais ano anos manana tio tia rio rios dia dias arbol arboles lapiz lapices
facil dificil util musica telefono futbol cafe sofa camion cancion corazon leon leones delfin tiburon limon melon raton pagina paginas despues alla alli aqui asi adios jamas
ademas segun aun numero numeros pajaro pajaros murcielago ultimo ultima unico unica proximo proxima exito quimica fisica medico magico movil angel azucar carcel
sabado miercoles cumpleanos pequeno pequena montana montanas senal senales espanol nino nina ninos ninas ñandu ardilla1 camaron avion corazones cuatrocientos
tambien estacion informacion educacion atencion direccion pasion decision emocion explicacion solucion imaginacion sabias podria queria tenia habia dormia comia
jugo1 raiz raices maiz baul caida ruido1 ingles frances aleman geografia historia1 biologia energia tecnica practica1 carton1 platano lampara pelicula jardin1`.split(/\s+/));

/** Devuelve las palabras sospechosas de un texto. */
export function sospechosas(texto) {
  const salida = [];
  for (const w of texto.toLowerCase().replace(/[^a-zñ\s]/g, ' ').split(/\s+/)) if (MALAS.has(w)) salida.push(w);
  return salida;
}
export const tieneTilde = (t) => /[áéíóúüÁÉÍÓÚÜ]/.test(t);
export const tieneSignos = (t) => /[¿¡?!]/.test(t);
