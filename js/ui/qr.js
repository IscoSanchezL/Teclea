/** Código QR en SVG (librería local, se descarga solo al pedirlo). Devuelve un nodo SVG o null si falla. */
import { t } from '../i18n/index.js';
export async function qrSVG(texto, { tam = 192 } = {}) {
  try {
    const { default: qrcode } = await import('../vendor/qrcode.js');
    const q = qrcode(0, 'M'); q.addData(texto); q.make();
    const n = q.getModuleCount(), caja = document.createElement('span');
    caja.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    const svg = caja.firstChild; svg.setAttribute('width', tam); svg.setAttribute('height', tam); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t('qr.aria'));
    return n ? svg : null;
  } catch (e) { console.warn('[qr]', e); return null; }
}
