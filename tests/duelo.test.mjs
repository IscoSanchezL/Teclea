import { textoDuelo, estaEnLinea, invitacionVigente, puntaje, comparar, estadoDuelo, puntosDuelo, VIGENCIA_LINEA_MS, VIGENCIA_INVITACION_MS } from '../js/game/duelo.js';
let ok = 0, mal = 0;
const t = (n, c) => { c ? ok++ : mal++; console.log(`  ${c ? '✓' : '✗'} ${n}`); };
const vocab = { sinTilde: ['sol', 'luna', 'mesa', 'casa', 'perro'], conTilde: ['canción', 'árbol'] };
let k = 0; const azar = () => (k++ % 7) / 7;

console.log('Texto del duelo');
t('2.º largo: 20 palabras, solo sin tilde', textoDuelo(2, vocab, azar, 'largo').split(' ').length === 20 && !/[áéíóú]/.test(textoDuelo(2, vocab, azar)));
t('6.º: texto largo y dentro del límite de las reglas', textoDuelo(6, vocab, azar, 'largo').length <= 300 && textoDuelo(6, vocab, azar, 'largo').split(' ').length >= 30);
t('niveles: corto < medio < largo', (() => { const l = (n) => textoDuelo(5, vocab, azar, n).split(' ').length; return l('corto') < l('medio') && l('medio') < l('largo'); })());
t('con vocabulario vacío no se rompe', textoDuelo(4, {}).length > 10);
t('mismo azar → mismo texto (los dos jugadores reciben el mismo)', (() => { k = 0; const a = textoDuelo(3, vocab, azar); k = 0; return a === textoDuelo(3, vocab, azar); })());

console.log('\nEn línea e invitaciones');
t('reciente = en línea', estaEnLinea({ visto: 1000 }, 1000 + VIGENCIA_LINEA_MS));
t('viejo = no en línea', !estaEnLinea({ visto: 1000 }, 1001 + VIGENCIA_LINEA_MS));
t('sin dato = no en línea', !estaEnLinea({}, 5000));
t('el desfase del reloj se corrige', estaEnLinea({ visto: 100000 }, 10000, 100000));
t('invitación vigente y vencida', invitacionVigente({ estado: 'invitado', creadoEn: 1000 }, 1000 + VIGENCIA_INVITACION_MS) && !invitacionVigente({ estado: 'invitado', creadoEn: 1000 }, 1001 + VIGENCIA_INVITACION_MS));
t('una invitación aceptada ya no es invitación', !invitacionVigente({ estado: 'aceptado', creadoEn: 1000 }, 1500));

console.log('\nQuién gana');
const P = (o) => puntaje({ fin: true, completo: true, ms: 30000, pos: 40, err: 0, ...o });
t('completar le gana a no completar', comparar(P({}), P({ completo: false, pos: 38 })) === 1);
t('los dos completan: gana el menor tiempo', comparar(P({ ms: 20000 }), P({ ms: 25000 })) === 1 && comparar(P({ ms: 25000 }), P({ ms: 20000 })) === -1);
t('mismo tiempo = empate', comparar(P({}), P({})) === 0);
t('nadie completa: más letras correctas', comparar(P({ completo: false, pos: 30 }), P({ completo: false, pos: 20 })) === 1);
t('mismas letras: menos errores', comparar(P({ completo: false, pos: 20, err: 1 }), P({ completo: false, pos: 20, err: 4 })) === 1);

console.log('\nEstado del duelo');
const duelo = { de: 'ana', a: 'beto', prog: { ana: { fin: true, completo: true, ms: 21000, pos: 40, err: 1 }, beto: { pos: 25, err: 0 } } };
t('si yo terminé y el otro no: esperando', estadoDuelo(duelo, 'ana').fase === 'esperando-rival');
t('si yo no terminé: jugando (y sé que el rival ya completó)', estadoDuelo({ ...duelo, prog: { ana: { pos: 5 }, beto: { fin: true, completo: true, ms: 9000 } } }, 'ana').rivalCompleto === true);
t('si el rival abandonó, gano por haber completado', estadoDuelo(duelo, 'ana', { rivalAbandono: true }).resultado === 'gano');
t('cuando los dos terminan: resultado para cada uno', (() => {
  const d = { ...duelo, prog: { ...duelo.prog, beto: { fin: true, completo: true, ms: 19000, pos: 40, err: 3 } } };
  return estadoDuelo(d, 'ana').resultado === 'pierde' && estadoDuelo(d, 'beto').resultado === 'gano';
})());
t('puntos: ganar da más que perder y están acotados', puntosDuelo('gano', 40) > puntosDuelo('pierde', 40) && puntosDuelo('gano', 500) <= 1050);
console.log(`\n${ok} correctas, ${mal} con fallo`); process.exit(mal ? 1 : 0);
