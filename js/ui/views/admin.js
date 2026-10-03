/**
 * Administración (vista sobria): resumen y salud, docentes, marca, ajustes y datos/respaldo.
 * Solo franksanlo@gmail.com (correo verificado) puede escribir aquí: lo garantizan las reglas de Firestore.
 */
import { CONFIG, firebaseConfigurado } from '../../core/config.js';
import { state } from '../../core/state.js';
import { marca, guardarMarca } from '../../core/marca.js';
import { h, descargarJSON } from '../../core/utils.js';
import * as A from '../../db/admin.js';
import { imagenLibre } from '../imagen.js';
import { icono } from '../icons.js';
import { toast, confirmar, abrirCapa } from '../overlay.js';
import { campo, interruptor } from '../componentes.js';
import { textoUltima } from '../../db/analitica.js';

const TABS = [['resumen', 'Resumen'], ['docentes', 'Docentes'], ['marca', 'Marca'], ['ajustes', 'Ajustes'], ['datos', 'Datos y respaldo']];
const fila = (clave, valor, estado) => h('li', { class: 'estado-fila' }, h('span', {}, clave), h('strong', { class: estado ? `estado--${estado}` : '' }, valor));
const fechaHora = (ms) => (ms ? new Date(ms).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

async function diagnostico() {
  const sw = 'serviceWorker' in navigator ? ((await navigator.serviceWorker.getRegistration())?.active ? 'Activo' : 'No instalado') : 'No compatible';
  let cache = '—';
  try { cache = (await (await fetch('precache.json', { cache: 'no-store' })).json()).version; } catch { /* sin red */ }
  let archivos = 0;
  try { for (const k of await caches.keys()) archivos += (await (await caches.open(k)).keys()).length; } catch { /* sin caché */ }
  const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
  return { sw, cache, archivos, usoMB: est ? (est.usage / 1048576).toFixed(1) : '—' };
}

export async function render({ query }) {
  let tab = TABS.some(([t]) => t === query.tab) ? query.tab : 'resumen';
  const raiz = h('div', { class: 'pagina' });
  const nube = state.modo === 'firebase';
  const cargando = h('p', { class: 'suave' }, 'Cargando…');

  /* ═════ Resumen ═════ */
  async function resumen() {
    let [d, cat, pend, wl, ajustes, audit] = await Promise.all([diagnostico(), A.estadoCatalogos().catch(() => null), A.usuariosPorRol('pendiente').catch(() => []), A.listaBlanca().catch(() => []), A.leerAjustes(), A.listarAuditoria(12).catch(() => [])]);
    // Primer ingreso del administrador: se publican solos los catálogos que las reglas necesitan (medallas y precios)
    if (nube && cat && !cat.completo && !sessionStorage.getItem('teclea:auto-catalogos')) {
      try { sessionStorage.setItem('teclea:auto-catalogos', '1'); await A.sembrarCatalogos(); cat = await A.estadoCatalogos(); toast('Catálogos de medallas y tienda publicados'); } catch (e) { console.warn('[admin] catálogos', e?.code || e); }
    }
    const lista = h('ul', { class: 'estado' },
      fila('Conexión', navigator.onLine ? 'En línea' : 'Sin conexión', navigator.onLine ? 'ok' : 'alerta'),
      fila('Base de datos', nube ? 'Firebase (Firestore)' : 'Modo demo local', nube ? 'ok' : 'alerta'),
      fila('Firebase configurado', firebaseConfigurado() ? 'Sí' : 'No — abre configurar.html', firebaseConfigurado() ? 'ok' : 'alerta'),
      fila('Catálogos de medallas y tienda', cat ? (cat.completo ? `Publicados (${cat.badges} + ${cat.shop})` : `Faltan (${cat.badges}/${cat.badgesEsperadas} · ${cat.shop}/${cat.shopEsperados})`) : '—', cat?.completo ? 'ok' : 'alerta'),
      fila('Protección App Check', CONFIG.appCheckSiteKey ? 'Activada' : 'Sin activar (recomendado)', CONFIG.appCheckSiteKey ? 'ok' : 'alerta'),
      fila('Modo sin conexión (service worker)', d.sw, d.sw === 'Activo' ? 'ok' : 'alerta'),
      fila('Archivos guardados en el dispositivo', `${d.archivos} · ${d.usoMB} MB`),
      fila('Versión de la app', `v${CONFIG.version} · caché ${d.cache}`),
      fila('Docentes pendientes de aprobar', String(pend.length), pend.length ? 'alerta' : 'ok'));
    const botonCat = cat && !cat.completo ? h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; try { const n = await A.sembrarCatalogos(); toast(`Catálogos publicados (${n})`); await pintar(); } catch (er) { toast(er.message || 'No se pudo publicar', { tipo: 'error' }); e.currentTarget.disabled = false; } } }, 'Publicar catálogos ahora') : null;
    return [
      pend.length ? h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, `Hay ${pend.length} solicitud${pend.length === 1 ? '' : 'es'} de docentes por revisar.`), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { tab = 'docentes'; pintar(); } }, 'Revisar')) : null,
      h('div', { class: 'rejilla-2' },
        h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Estado del sistema'), botonCat), lista),
        h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Registro de actividad'), h('span', { class: 'suave' }, 'últimas acciones')),
          audit.length ? h('ul', { class: 'actividad' }, audit.map((a) => h('li', { class: 'actividad__item' }, h('span', { class: 'actividad__ic' }, icono('clock', { tam: 16 })), h('span', {}, h('strong', {}, a.rol || ''), ` ${a.accion}`, a.objetivo ? h('small', { class: 'suave' }, ` · ${a.objetivo}`) : null), h('time', { class: 'suave' }, fechaHora(a.creadoEn)))))
            : h('p', { class: 'suave' }, 'Aún no hay acciones registradas.'))),
      h('p', { class: 'suave pequeno' }, `Docentes autorizados por correo: ${wl.length} · Fotos de perfil: ${ajustes.permitirFotos ? 'permitidas' : 'desactivadas'}.`)];
  }

  /* ═════ Docentes ═════ */
  async function docentes() {
    const [pend, activos, rech, wl] = await Promise.all([A.usuariosPorRol('pendiente').catch(() => []), A.usuariosPorRol('docente').catch(() => []), A.usuariosPorRol('rechazado').catch(() => []), A.listaBlanca().catch(() => [])]);
    const accion = async (u, rol) => { try { await A.cambiarRol(u, rol); toast(rol === 'docente' ? `${u.nombre} ya es docente` : 'Solicitud rechazada'); await pintar(); } catch (e) { toast(e.message || 'No se pudo cambiar el rol', { tipo: 'error' }); } };
    const tabla = (lista, acciones, vacio) => lista.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, ['Nombre', 'Correo', 'Último acceso', ''].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, lista.map((u) => h('tr', {}, h('th', { scope: 'row' }, u.nombre), h('td', {}, u.email || '—'), h('td', {}, textoUltima(u.ultimaConexion)), h('td', { class: 'fila' }, acciones(u))))))) : h('p', { class: 'suave' }, vacio);
    const correo = campo({ etiqueta: 'Correo del docente', type: 'email', placeholder: 'profe@micolegio.edu.co' });
    const area = campo({ etiqueta: 'Área (opcional)', maxlength: 60, placeholder: 'Ej.: Tecnología' });
    const form = h('form', { class: 'fila fila--envuelve fila--fin', onsubmit: async (e) => { e.preventDefault(); try { await A.agregarWhitelist(correo.input.value, area.input.value); toast('Docente autorizado'); await pintar(); } catch (er) { toast(er.message, { tipo: 'error' }); } } },
      correo.nodo, area.nodo, h('button', { class: 'btn btn--primary btn--sm', type: 'submit' }, icono('plus', { tam: 16 }), 'Autorizar'));
    return [
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, `Solicitudes pendientes (${pend.length})`), h('span', { class: 'suave' }, 'docentes que entraron con Google')),
        tabla(pend, (u) => [h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => accion(u, 'docente') }, 'Aprobar'), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => accion(u, 'rechazado') }, 'Rechazar')], 'No hay solicitudes pendientes.')),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, `Docentes activos (${activos.length})`)),
        tabla(activos, (u) => [h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: `¿Quitar acceso a ${u.nombre}?`, mensaje: 'Pasará a “rechazado” y ya no verá sus clases. Sus datos no se borran.', si: 'Quitar acceso', peligro: true })) accion(u, 'rechazado'); } }, 'Quitar acceso')], 'Aún no hay docentes.')),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Autorización previa por correo'), h('span', { class: 'suave' }, 'entran como docentes sin esperar')),
        h('p', { class: 'suave' }, 'Los correos de esta lista entran directo como docentes la primera vez que inician sesión con Google. Cualquier otro docente queda “pendiente” hasta que lo apruebes.'), form,
        wl.length ? h('ul', { class: 'actividad' }, wl.map((w) => h('li', { class: 'actividad__item' }, h('span', { class: 'actividad__ic' }, icono('users', { tam: 16 })), h('span', {}, h('strong', {}, w.correo || w.id), w.area ? h('small', { class: 'suave' }, ` · ${w.area}`) : null),
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', 'aria-label': `Quitar ${w.correo}`, onclick: async () => { await A.quitarWhitelist(w.id); await pintar(); } }, icono('trash', { tam: 14 }))))) : null),
      rech.length ? h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, `Rechazados (${rech.length})`)), tabla(rech, (u) => [h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => accion(u, 'docente') }, 'Aprobar ahora')], '')) : null,
      h('p', { class: 'suave pequeno' }, `El administrador es ${CONFIG.adminEmail} (cuenta de Google verificada); nadie más puede serlo.`)];
  }

  /* ═════ Marca ═════ */
  function marcaTab() {
    const nombre = campo({ etiqueta: 'Nombre de la plataforma', value: marca.nombre, maxlength: 30 });
    const lema = campo({ etiqueta: 'Lema', value: marca.lema || '', maxlength: 80 });
    const colegio = campo({ etiqueta: 'Colegio o institución', value: marca.colegio || '', maxlength: 80 });
    let logo = marca.logo || null, hero = marca.hero || null;
    const vistaLogo = h('div', { class: 'marca__vista' }), vistaHero = h('div', { class: 'marca__vista marca__vista--hero' });
    const pintarImgs = () => {
      vistaLogo.replaceChildren(logo ? h('img', { src: logo, alt: 'Logo actual', width: 80, height: 80 }) : h('span', { class: 'suave' }, 'Logo por defecto'));
      vistaHero.replaceChildren(hero ? h('img', { src: hero, alt: 'Imagen de portada actual' }) : h('span', { class: 'suave' }, 'Portada por defecto'));
    };
    pintarImgs();
    const subir = (tipo) => h('input', { type: 'file', accept: 'image/*', 'aria-label': tipo === 'logo' ? 'Subir logo' : 'Subir imagen de portada', onchange: async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const url = tipo === 'logo' ? await imagenLibre(f, { maxLado: 256, maxChars: 60000 }) : await imagenLibre(f, { maxLado: 1400, calidad: 0.8, maxChars: 380000 }); if (tipo === 'logo') logo = url; else hero = url; pintarImgs(); } catch (er) { toast(er.message, { tipo: 'error' }); }
    } });
    return h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Marca de la plataforma'), h('span', { class: 'suave' }, 'se ve en el inicio de sesión, el menú y los certificados')),
      h('form', { class: 'pila', onsubmit: async (e) => {
        e.preventDefault();
        try { await guardarMarca({ nombre: nombre.input.value.trim() || 'TECLEA', lema: lema.input.value.trim(), colegio: colegio.input.value.trim(), logo, hero }); A.auditar('Cambió la marca', nombre.input.value); toast('Marca actualizada'); } catch (er) { toast(er.message || 'No se pudo guardar', { tipo: 'error' }); }
      } },
      h('div', { class: 'rejilla-campos' }, nombre.nodo, lema.nodo, colegio.nodo),
      h('div', { class: 'rejilla-2' },
        h('div', { class: 'pila' }, h('strong', {}, 'Logo'), vistaLogo, h('div', { class: 'fila fila--envuelve' }, subir('logo'), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { logo = null; pintarImgs(); } }, 'Quitar')), h('small', { class: 'suave' }, 'Cuadrado, fondo transparente si es posible. Se reduce a 256 px.')),
        h('div', { class: 'pila' }, h('strong', {}, 'Imagen de portada'), vistaHero, h('div', { class: 'fila fila--envuelve' }, subir('hero'), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { hero = null; pintarImgs(); } }, 'Quitar')), h('small', { class: 'suave' }, 'Horizontal, hasta 1400 px de ancho. Evita fotos con rostros de menores.'))),
      h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'submit' }, 'Guardar marca'))));
  }

  /* ═════ Ajustes ═════ */
  async function ajustesTab() {
    const aj = await A.leerAjustes();
    const dominios = campo({ etiqueta: 'Dominios permitidos para estudiantes con Google', value: (aj.dominiosAlumnos || []).join(', '), placeholder: 'micolegio.edu.co (vacío = cualquier cuenta)', ayuda: 'Si escribes dominios, solo esos correos podrán registrarse como estudiantes. Separa con comas.' });
    return h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Ajustes globales')),
      interruptor({ etiqueta: 'Permitir fotos de perfil reales', descripcion: 'Las fotos solo las ven el propio estudiante y el administrador; nunca aparecen en rankings.', activo: aj.permitirFotos, alCambiar: async (v) => { try { await A.guardarAjustes({ permitirFotos: v }); toast(v ? 'Fotos permitidas' : 'Fotos desactivadas'); } catch (e) { toast(e.message || 'No se pudo guardar', { tipo: 'error' }); } } }),
      h('form', { class: 'pila', onsubmit: async (e) => { e.preventDefault(); try { await A.guardarAjustes({ dominiosAlumnos: dominios.input.value.split(',') }); toast('Dominios guardados'); } catch (er) { toast(er.message || 'No se pudo guardar', { tipo: 'error' }); } } },
        dominios.nodo, h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary btn--sm', type: 'submit' }, 'Guardar dominios'))));
  }

  /* ═════ Datos y respaldo ═════ */
  async function datosTab() {
    const solicitudes = await store_users_eliminacion();
    const estado = h('p', { class: 'suave', 'aria-live': 'polite' });
    const uid = campo({ etiqueta: 'ID de usuario (uid)', placeholder: 'Se ve en Firebase → Authentication' });
    return [
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Respaldo manual')),
        h('p', { class: 'suave' }, 'Descarga una copia de los datos (JSON). El respaldo diario automático se configura una sola vez con la guía de confiabilidad.'),
        h('div', { class: 'fila fila--envuelve' }, h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; try { const d = await A.exportarTodo((c) => { estado.textContent = `Leyendo ${c}…`; }); descargarJSON(`teclea-respaldo-${new Date().toISOString().slice(0, 10)}.json`, d); estado.textContent = d.omitidas.length ? `Listo. No se pudieron leer: ${d.omitidas.join(', ')}` : 'Respaldo descargado.'; } catch (er) { estado.textContent = er.message; } e.currentTarget.disabled = false; } }, icono('download', { tam: 16 }), 'Descargar respaldo JSON')), estado),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, 'Datos personales (Ley 1581)'), h('span', { class: 'suave' }, 'exportar o eliminar los datos de una persona')),
        solicitudes.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, ['Solicitante', 'Fecha', ''].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', {}, solicitudes.map((u) => h('tr', {}, h('th', { scope: 'row' }, `${u.apodo} (${u.nombre})`), h('td', {}, fechaHora(u.solicitudEliminacion)), h('td', { class: 'fila' }, accionesUsuario(u.uid))))))) : h('p', { class: 'suave' }, 'No hay solicitudes de eliminación pendientes.'),
        h('div', { class: 'fila fila--envuelve fila--fin' }, uid.nodo, h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => uid.input.value.trim() && exportarUno(uid.input.value.trim()) }, 'Exportar'), h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: () => uid.input.value.trim() && borrarUno(uid.input.value.trim()) }, 'Eliminar datos'))),
      h('p', { class: 'suave pequeno' }, 'Al eliminar los datos de una persona también debes borrar su cuenta en Firebase → Authentication (la web no puede hacerlo por seguridad).')];
  }
  const store_users_eliminacion = () => import('../../db/store.js').then((s) => s.consultar('users', { donde: [['solicitudEliminacion', '>', 0]] })).catch(() => []);
  const exportarUno = async (uid) => { try { const d = await A.exportarUsuario(uid); if (!d.usuario) return toast('No encontré ese usuario.', { tipo: 'error' }); descargarJSON(`datos-${uid}.json`, d); } catch (e) { toast(e.message, { tipo: 'error' }); } };
  const borrarUno = async (uid) => { if (!(await confirmar({ titulo: '¿Eliminar todos los datos?', mensaje: 'Se borran su perfil, progreso, sesiones y medallas. No se puede deshacer. Te recomendamos exportarlos antes.', si: 'Eliminar datos', peligro: true }))) return; try { const n = await A.borrarDatosUsuario(uid); toast(`Eliminados ${n} documentos`); await pintar(); } catch (e) { toast(e.message || 'No se pudo eliminar', { tipo: 'error' }); } };
  const accionesUsuario = (uid) => [h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => exportarUno(uid) }, 'Exportar'), h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: () => borrarUno(uid) }, 'Eliminar')];

  /* ═════ Marco ═════ */
  async function pintar() {
    raiz.replaceChildren(...[
      h('header', { class: 'pagina__cab' }, h('div', {}, h('h1', {}, 'Administración'), h('p', { class: 'suave' }, 'Docentes, marca, ajustes y respaldo')),
        h('a', { class: 'btn btn--suave btn--sm', href: 'configurar.html' }, icono('settings', { tam: 16 }), 'Asistente de configuración')),
      !nube ? h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, 'Modo demostración: los cambios se guardan solo en este navegador. Conecta Firebase con el asistente de configuración.')) : null,
      h('div', { class: 'tabs tabs--5 tabs--staff', role: 'tablist' }, TABS.map(([id, t]) => h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(id === tab), onclick: () => { tab = id; pintar(); } }, t))),
      cargando].filter(Boolean));
    const cont = tab === 'resumen' ? await resumen() : tab === 'docentes' ? await docentes() : tab === 'marca' ? marcaTab() : tab === 'ajustes' ? await ajustesTab() : await datosTab();
    cargando.replaceWith(...[].concat(cont).filter(Boolean));
  }
  await pintar();
  return raiz;
}
