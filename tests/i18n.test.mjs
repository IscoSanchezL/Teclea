// Comprueba que es.js y en.js tienen exactamente las mismas claves y los mismos {marcadores}.
import es from '../js/i18n/es.js';
import en from '../js/i18n/en.js';
let mal = 0;
const ke = Object.keys(es), kn = Object.keys(en);
for (const k of ke) if (!(k in en)) { console.log('  ✗ falta en en.js:', k); mal++; }
for (const k of kn) if (!(k in es)) { console.log('  ✗ falta en es.js:', k); mal++; }
for (const k of ke) if (k in en) {
  const a = (es[k].match(/\{\w+\}/g) || []).sort().join(), b = (en[k].match(/\{\w+\}/g) || []).sort().join();
  if (a !== b) { console.log('  ✗ marcadores distintos:', k); mal++; }
  if (!en[k].trim()) { console.log('  ✗ vacío en en.js:', k); mal++; }
}
console.log(mal ? `${mal} problemas` : `✓ es.js y en.js: ${ke.length} claves idénticas`);
process.exit(mal ? 1 : 0);
