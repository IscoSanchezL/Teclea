/** Pruebas del motor de escritura (sin navegador): node tests/motor.test.mjs */
import { MotorEscritura } from '../js/lessons/motor.js';
let ok = 0, mal = 0;
const igual = (nombre, a, b) => { const bien = JSON.stringify(a) === JSON.stringify(b); bien ? ok++ : mal++; console.log(`  ${bien ? '✓' : '✗'} ${nombre}${bien ? '' : `  → obtuvo ${JSON.stringify(a)}, esperaba ${JSON.stringify(b)}`}`); };
const casi = (nombre, a, b, tol = 0.05) => igual(nombre, Math.abs(a - b) <= tol, true);

function reloj() { let t = 0; const f = () => t; f.avanza = (ms) => { t += ms; }; return f; }

console.log('Texto simple, sin errores');
{ const r = reloj(); const m = new MotorEscritura({ texto: 'hola mundo', reloj: r });
  for (const c of 'hola mundo') { m.escribir(c); r.avanza(200); }
  igual('termina', m.terminado, true); igual('precisión 100 %', m.precision(), 1); igual('0 errores', m.errores, 0);
  const res = m.resultado(); igual('duración mínima 3 s', res.duracionSeg, 3);
  casi('PPM neto = (10/5)/(2 s→3 s) = 40', res.ppm, 40, 0.5); }

console.log('PPM con 1 minuto exacto (palabra = 5 caracteres)');
{ const r = reloj(); const m = new MotorEscritura({ texto: 'a'.repeat(100), reloj: r });
  for (let i = 0; i < 100; i++) { m.escribir('a'); r.avanza(600); }
  const res = m.resultado(); casi('100 caracteres en 60 s = 20 PPM', res.ppm, 20, 0.5); casi('bruto = neto sin errores', m.ppmBruto(), m.ppmNeto(), 0.01); }

console.log('Modo normal: el error avanza y queda marcado');
{ const r = reloj(); const m = new MotorEscritura({ texto: 'casa', reloj: r });
  igual('c ok', m.escribir('c'), 'ok'); igual('x error', m.escribir('x'), 'error'); igual('posición avanzó', m.pos, 2);
  igual('estado marca error', Array.from(m.estado), [1, 2, 0, 0]); igual('sin corregir = 1', m.sinCorregir, 1);
  igual('backspace permitido', m.borrar(), true); igual('vuelve a 1', m.pos, 1); igual('sin corregir = 0', m.sinCorregir, 0);
  m.escribir('a'); m.escribir('s'); m.escribir('a');
  igual('precisión = 4/5', m.precision(), 0.8); igual('errores históricos = 1', m.errores, 1); igual('error contado en la tecla esperada', m.porTecla.a.err, 1); }

console.log('Modo estricto: no avanza con error y no permite borrar');
{ const r = reloj(); const m = new MotorEscritura({ texto: 'ala', estricto: true, retroceso: true, reloj: r });
  m.escribir('a'); igual('error', m.escribir('z'), 'error'); igual('no avanza', m.pos, 1); igual('sin errores pendientes', m.sinCorregir, 0);
  igual('retroceso desactivado', m.borrar(), false); m.escribir('l'); m.escribir('a'); igual('termina', m.terminado, true); igual('precisión 3/4', m.precision(), 0.75); }

console.log('Tildes, ñ, ü, mayúsculas y signos');
{ const t = 'Pingüino ¿qué? ¡Sí! Ñandú, 5%'; const r = reloj(); const m = new MotorEscritura({ texto: t, reloj: r });
  for (const c of t) { m.escribir(c); r.avanza(300); }
  igual('texto con caracteres especiales completo sin errores', [m.terminado, m.errores], [true, 0]); }
{ const m = new MotorEscritura({ texto: 'más', reloj: reloj() }); m.escribir('m'); igual('"a" sin tilde es error', m.escribir('a'), 'error'); }

console.log('Pausa y reloj');
{ const r = reloj(); const m = new MotorEscritura({ texto: 'abcdef', reloj: r });
  m.escribir('a'); r.avanza(1000); m.pausar(); r.avanza(60000); igual('la pausa no cuenta', Math.round(m.segundos()), 1);
  m.reanudar(); r.avanza(1000); igual('tras reanudar suma', Math.round(m.segundos()), 2);
  igual('no escribe en pausa', (m.pausar(), m.escribir('b')), 'ignorado'); }

console.log('Contrarreloj');
{ const r = reloj(); const m = new MotorEscritura({ texto: 'palabra '.repeat(50), seg: 10, reloj: r });
  m.escribir('p'); r.avanza(9000); m.tick(); igual('aún no termina a los 9 s', m.terminado, false);
  r.avanza(1500); m.tick(); igual('termina a los 10 s', m.terminado, true); igual('restantes = 0', m.segundosRestantes(), 0); }

console.log('Anti-trampa');
{ const r = reloj(); const m = new MotorEscritura({ texto: 'a'.repeat(40), reloj: r });
  for (let i = 0; i < 12; i++) { m.escribir('a'); r.avanza(5); } igual('ráfaga detectada (< 25 ms seguidos)', m.banderas.rafaga, true);
  m.marcarPegado(); igual('pegado marcado', m.banderas.pegado, true); }
{ const r = reloj(); const m = new MotorEscritura({ texto: 'a'.repeat(300), reloj: r });
  for (let i = 0; i < 300; i++) { m.escribir('a'); r.avanza(10); } const res = m.resultado(); igual('PPM imposible queda acotado y marcado', [res.ppm <= 200, res.banderas.imposible], [true, true]); }

console.log('Coherencia con las reglas de Firestore (wpm × duración ≤ caracteres/5 × 60 + 30)');
{ for (const [n, ms] of [[100, 600], [170, 1234], [80, 2500], [300, 200], [60, 3333]]) {
    const r = reloj(); const m = new MotorEscritura({ texto: 'a'.repeat(n), reloj: r }); for (let i = 0; i < n; i++) { m.escribir(i % 7 === 3 ? 'x' : 'a'); r.avanza(ms); }
    const res = m.resultado(); const regla = res.ppm * res.duracionSeg <= (res.caracteres / 5) * 60 + 30 && res.caracteres <= res.duracionSeg * 12;
    igual(`n=${n}, ${ms} ms/tecla cumple la regla`, regla, true); } }

console.log(`\n${ok} correctas, ${mal} con fallo`);
process.exit(mal ? 1 : 0);
