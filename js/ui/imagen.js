/**
 * Utilidades de imagen en el navegador (sin librerías): recortar/redimensionar y comprimir.
 * Todo se guarda como "data URL" dentro del documento de Firestore (no se usa Storage, que ya
 * requiere plan de pago), por eso se comprime a pocos KB.
 */

async function cargar(archivo) {
  if (!archivo || !archivo.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  if (archivo.size > 12 * 1024 * 1024) throw new Error('La imagen es demasiado grande (máximo 12 MB).');
  return createImageBitmap(archivo);
}

function aDataURL(canvas, tipo, calidad) {
  return canvas.toDataURL(tipo, calidad);
}

/** Foto de perfil: recorte cuadrado centrado, `lado` px, JPEG. Reduce la calidad hasta pesar ≤ maxChars. */
export async function fotoPerfil(archivo, { lado = 256, maxChars = 60000 } = {}) {
  const img = await cargar(archivo);
  const lim = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = lado;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, lado, lado);
  ctx.drawImage(img, (img.width - lim) / 2, (img.height - lim) / 2, lim, lim, 0, 0, lado, lado);
  img.close?.();
  for (let q = 0.85; q >= 0.4; q -= 0.1) {
    const url = aDataURL(canvas, 'image/jpeg', q);
    if (url.length <= maxChars) return url;
  }
  return aDataURL(canvas, 'image/jpeg', 0.35);
}

/** Logo o imagen de portada: conserva proporción y transparencia (WebP/PNG). */
export async function imagenLibre(archivo, { maxLado = 256, tipo = 'image/webp', calidad = 0.85, maxChars = 120000 } = {}) {
  const img = await cargar(archivo);
  const k = Math.min(1, maxLado / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * k); canvas.height = Math.round(img.height * k);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close?.();
  let q = calidad, url = aDataURL(canvas, tipo, q);
  if (!url.startsWith(`data:${tipo}`)) { tipo = 'image/png'; url = aDataURL(canvas, tipo); } // navegador sin WebP
  while (url.length > maxChars && q > 0.4 && tipo !== 'image/png') { q -= 0.1; url = aDataURL(canvas, tipo, q); }
  return url;
}
