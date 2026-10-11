/* Núcleo puro (sin DOM): niveles y simulador. Funciona en navegador y en Node (pruebas). */
(function (root) {
  'use strict';

  // Direcciones: 0 arriba, 1 derecha, 2 abajo, 3 izquierda.
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];

  /* ---------- Mundo 1: ordenar pasos (sin tablero) ---------- */
  const ORDEN = [
    { id: 'o1', titulo: 'Lavarse los dientes', voz: 'Pon los pasos en orden para lavarte los dientes. ¡Toca el primero!',
      pasos: [['🪥', 'Tomar el cepillo'], ['🧴', 'Poner la pasta'], ['😁', 'Cepillar los dientes'], ['💦', 'Enjuagar la boca']] },
    { id: 'o2', titulo: 'Plantar una semilla', voz: 'Ayuda a la semilla a crecer. ¿Qué se hace primero?',
      pasos: [['🕳️', 'Hacer un hoyito'], ['🌰', 'Poner la semilla'], ['💧', 'Echar agua'], ['🌻', '¡Crece la flor!']] },
    { id: 'o3', titulo: 'Hacer un sándwich', voz: '¡Qué hambre! Ordena los pasos del sándwich.',
      pasos: [['🍞', 'Poner el pan'], ['🧀', 'Poner el queso'], ['🍞', 'Tapar con otro pan'], ['😋', '¡A comer!']] }
  ];

  /* ---------- Mundos 2-4: robot Beto en el tablero ----------
     c: F avanzar, L girar izquierda, R girar derecha. n: repeticiones.
     sol: una solución de referencia (la usan las pruebas y las estrellas). */
  const F = (n) => ({ c: 'F', n: n || 1 });
  const L = () => ({ c: 'L', n: 1 });
  const R = () => ({ c: 'R', n: 1 });

  const TABLERO = [
    { id: 't1', mundo: 2, titulo: 'Primer paso', w: 4, h: 2, start: { x: 0, y: 0, d: 1 }, goal: { x: 2, y: 0 }, stars: [], walls: [], allowed: ['F'], rep: false,
      voz: 'Beto quiere llegar a la bandera. Toca la flecha para que avance. ¡Necesita dos pasos!', pista: 'Toca avanzar dos veces y luego el botón verde.', sol: [F(), F()] },
    { id: 't2', mundo: 2, titulo: 'Camino largo', w: 5, h: 2, start: { x: 0, y: 0, d: 1 }, goal: { x: 4, y: 0 }, stars: [], walls: [], allowed: ['F'], rep: false,
      voz: '¡Ahora la bandera está más lejos! Cuenta los cuadros.', pista: 'Cuenta cuántos cuadros hay hasta la bandera.', sol: [F(), F(), F(), F()] },
    { id: 't3', mundo: 2, titulo: 'Recoge la estrella', w: 5, h: 2, start: { x: 0, y: 0, d: 1 }, goal: { x: 4, y: 0 }, stars: [{ x: 2, y: 0 }], walls: [], allowed: ['F'], rep: false,
      voz: 'Beto pasa por la estrella y la recoge. ¡Luego va a la bandera!', pista: 'Si avanzas hasta la bandera, pasas por la estrella.', sol: [F(), F(), F(), F()] },
    { id: 't4', mundo: 3, titulo: '¡A girar!', w: 3, h: 3, start: { x: 0, y: 0, d: 1 }, goal: { x: 2, y: 2 }, stars: [], walls: [], allowed: ['F', 'L', 'R'], rep: false,
      voz: 'Ahora Beto sabe girar. El botón de la flecha curva a la derecha lo hace girar hacia su derecha.', pista: 'Avanza dos veces, gira a la derecha y avanza otras dos.', sol: [F(), F(), R(), F(), F()] },
    { id: 't5', mundo: 3, titulo: 'Hacia arriba', w: 3, h: 3, start: { x: 0, y: 2, d: 1 }, goal: { x: 2, y: 0 }, stars: [], walls: [], allowed: ['F', 'L', 'R'], rep: false,
      voz: 'Ahora hay que subir. Gira a la izquierda.', pista: 'Avanza dos veces, gira a la izquierda y avanza dos veces.', sol: [F(), F(), L(), F(), F()] },
    { id: 't6', mundo: 3, titulo: 'Estrella en la esquina', w: 4, h: 3, start: { x: 0, y: 0, d: 1 }, goal: { x: 3, y: 2 }, stars: [{ x: 3, y: 0 }], walls: [], allowed: ['F', 'L', 'R'], rep: false,
      voz: 'Recoge la estrella de la esquina y luego baja hasta la bandera.', pista: 'Primero a la derecha hasta el final, luego gira para bajar.', sol: [F(), F(), F(), R(), F(), F()] },
    { id: 't7', mundo: 3, titulo: '¡Cuidado con la roca!', w: 4, h: 3, start: { x: 0, y: 1, d: 1 }, goal: { x: 3, y: 1 }, stars: [], walls: [{ x: 1, y: 1 }], allowed: ['F', 'L', 'R'], rep: false,
      voz: 'Hay una roca en el camino. Beto no puede pasar por encima. ¡Rodéala!', pista: 'Sube, avanza, y baja después de pasar la roca.', sol: [L(), F(), R(), F(), F(), F(), R(), F()] },
    { id: 't8', mundo: 4, titulo: 'El botón repetir', w: 7, h: 2, start: { x: 0, y: 0, d: 1 }, goal: { x: 6, y: 0 }, stars: [], walls: [], allowed: ['F', 'L', 'R'], rep: true, maxBlocks: 2,
      voz: 'Qué camino tan largo. ¡Usa el botón repetir! Toca repetir tres, y luego avanzar.', pista: 'Repetir seis veces y avanzar. ¡Solo un bloque!', sol: [F(6)] },
    { id: 't9', mundo: 4, titulo: 'Repite y gira', w: 7, h: 3, start: { x: 0, y: 0, d: 1 }, goal: { x: 6, y: 2 }, stars: [{ x: 3, y: 0 }], walls: [], allowed: ['F', 'L', 'R'], rep: true,
      voz: 'Usa repetir para avanzar mucho, luego gira y baja.', pista: 'Repite seis, gira a la derecha, repite dos.', sol: [F(6), R(), F(2)] },
    { id: 't10', mundo: 4, titulo: 'El gran cuadrado', w: 5, h: 5, start: { x: 0, y: 0, d: 1 }, goal: { x: 4, y: 4 }, stars: [{ x: 4, y: 0 }, { x: 4, y: 2 }], walls: [{ x: 2, y: 2 }], allowed: ['F', 'L', 'R'], rep: true,
      voz: 'Un tablero grande con dos estrellas. ¡Tú puedes!', pista: 'Repite cuatro, gira a la derecha, repite cuatro.', sol: [F(4), R(), F(4)] },
    { id: 't11', mundo: 4, titulo: 'La escalera', w: 4, h: 4, start: { x: 0, y: 0, d: 1 }, goal: { x: 3, y: 3 }, stars: [{ x: 2, y: 1 }, { x: 3, y: 2 }], walls: [], allowed: ['F', 'L', 'R'], rep: true,
      voz: 'Sube y baja como en una escalera. Avanza, gira, avanza, gira.', pista: 'Avanzar, derecha, avanzar, izquierda… ¡se repite el patrón!', sol: [F(), R(), F(), L(), F(), R(), F(), L(), F(), R(), F()] },
    { id: 't12', mundo: 4, titulo: 'El gran desafío', w: 6, h: 4, start: { x: 0, y: 0, d: 1 }, goal: { x: 5, y: 0 }, stars: [{ x: 2, y: 2 }, { x: 5, y: 2 }], walls: [{ x: 3, y: 0 }, { x: 3, y: 1 }], allowed: ['F', 'L', 'R'], rep: true,
      voz: 'El último desafío. Hay un muro. Busca el camino por abajo. ¡Tú eres un gran programador!', pista: 'Baja, pasa por debajo del muro y vuelve a subir.', sol: [F(2), R(), F(2), L(), F(3), L(), F(2)] }
  ];

  const MUNDOS = [
    { n: 1, nombre: 'Pasos y orden', emoji: '🪥', color: '#ff8fab' },
    { n: 2, nombre: 'Beto camina', emoji: '🤖', color: '#4cc9f0' },
    { n: 3, nombre: 'Beto gira', emoji: '🔄', color: '#ffbe0b' },
    { n: 4, nombre: 'Repite y gana', emoji: '🔁', color: '#80ed99' }
  ];

  // Orden completo del camino: la lección es el nivel 0.
  const NIVELES = [].concat(
    [{ id: 'leccion', tipo: 'leccion', mundo: 1, titulo: '¿Qué es un algoritmo?' }],
    ORDEN.map((o) => Object.assign({ tipo: 'orden', mundo: 1 }, o)),
    TABLERO.map((t) => Object.assign({ tipo: 'tablero' }, t))
  );

  /* ---------- Simulador ----------
     Devuelve la lista de eventos paso a paso para animar, y el resultado final. */
  function simular(nivel, programa) {
    let { x, y, d } = nivel.start;
    const pendientes = new Set(nivel.stars.map((s) => s.x + ',' + s.y));
    const recogidas = [];
    const eventos = [];
    const pared = new Set(nivel.walls.map((p) => p.x + ',' + p.y));
    let choco = false;

    const orden = [];
    programa.forEach((b, idx) => {
      const veces = Math.max(1, b.n || 1);
      for (let i = 0; i < veces; i++) orden.push({ c: b.c, idx });
    });

    for (const paso of orden) {
      if (choco) break;
      if (paso.c === 'L' || paso.c === 'R') {
        d = (d + (paso.c === 'R' ? 1 : 3)) % 4;
        eventos.push({ t: 'giro', idx: paso.idx, x, y, d, dir: paso.c });
      } else {
        const nx = x + DX[d], ny = y + DY[d];
        const fuera = nx < 0 || ny < 0 || nx >= nivel.w || ny >= nivel.h;
        if (fuera || pared.has(nx + ',' + ny)) {
          choco = true;
          eventos.push({ t: 'choque', idx: paso.idx, x, y, d, hx: nx, hy: ny });
        } else {
          x = nx; y = ny;
          const k = x + ',' + y;
          const estrella = pendientes.delete(k);
          if (estrella) recogidas.push(k);
          eventos.push({ t: 'avanza', idx: paso.idx, x, y, d, estrella });
        }
      }
    }

    const llego = x === nivel.goal.x && y === nivel.goal.y;
    const faltan = pendientes.size;
    return { eventos, choco, llego, faltan, ok: !choco && llego && faltan === 0, x, y, d };
  }

  function estrellasGanadas(nivel, programa) {
    const optimo = nivel.sol.length;
    const usados = programa.length;
    if (usados <= optimo) return 3;
    if (usados <= optimo + 2) return 2;
    return 1;
  }

  const api = { DX, DY, ORDEN, TABLERO, MUNDOS, NIVELES, simular, estrellasGanadas };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AlgoCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
