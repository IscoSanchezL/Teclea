/**
 * Administración (vista sobria): resumen y salud, docentes, marca, ajustes y datos/respaldo.
 * Solo franksanlo@gmail.com (correo verificado) puede escribir aquí: lo garantizan las reglas de Firestore.
 */
import { CONFIG, firebaseConfigurado } from '../../core/config.js';
import { state } from '../../core/state.js';
import { marca, guardarMarca } from '../../core/marca.js';
import { PRESETS, PALETA_ORIGINAL, aplicarPaleta, hexValido, aHSL, deHSL, armonias, contraste } from '../../core/paleta.js';
import { h, descargarJSON } from '../../core/utils.js';
import * as A from '../../db/admin.js';
import { imagenLibre } from '../imagen.js';
import { icono } from '../icons.js';
import { toast, confirmar, abrirCapa } from '../overlay.js';
import { campo, interruptor } from '../componentes.js';
import { textoUltima } from '../../db/analitica.js';
import { t, locale } from '../../i18n/index.js';

const TABS = [['resumen', () => t('adm.tab.resumen')], ['docentes', () => t('adm.tab.docentes')], ['marca', () => t('adm.tab.marca')], ['colores', () => t('adm.tab.colores')], ['ajustes', () => t('adm.tab.ajustes')], ['datos', () => t('adm.tab.datos')]];
const fila = (clave, valor, estado) => h('li', { class: 'estado-fila' }, h('span', {}, clave), h('strong', { class: estado ? `estado--${estado}` : '' }, valor));
const fechaHora = (ms) => (ms ? new Date(ms).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

async function diagnostico() {
  const sw = 'serviceWorker' in navigator ? ((await navigator.serviceWorker.getRegistration())?.active ? 'activo' : 'noInstalado') : 'noCompatible';
  let cache = '—';
  try { cache = (await (await fetch('precache.json', { cache: 'no-store' })).json()).version; } catch { /* sin red */ }
  let archivos = 0;
  try { for (const k of await caches.keys()) archivos += (await (await caches.open(k)).keys()).length; } catch { /* sin caché */ }
  const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
  return { sw, swTxt: t(`adm.sw.${sw}`), cache, archivos, usoMB: est ? (est.usage / 1048576).toFixed(1) : '—' };
}

export async function render({ query }) {
  let tab = TABS.some(([id]) => id === query.tab) ? query.tab : 'resumen';
  const raiz = h('div', { class: 'pagina' });
  const nube = state.modo === 'firebase';
  const cargando = h('p', { class: 'suave' }, t('adm.cargando'));

  /* ═════ Resumen ═════ */
  async function resumen() {
    let [d, cat, pend, wl, ajustes, audit] = await Promise.all([diagnostico(), A.estadoCatalogos().catch(() => null), A.usuariosPorRol('pendiente').catch(() => []), A.listaBlanca().catch(() => []), A.leerAjustes(), A.listarAuditoria(12).catch(() => [])]);
    // Primer ingreso del administrador: se publican solos los catálogos que las reglas necesitan (medallas y precios)
    if (nube && cat && !cat.completo && !sessionStorage.getItem('teclea:auto-catalogos')) {
      try { sessionStorage.setItem('teclea:auto-catalogos', '1'); await A.sembrarCatalogos(); cat = await A.estadoCatalogos(); toast(t('adm.catPublicados')); } catch (e) { console.warn('[admin] catálogos', e?.code || e); }
    }
    const lista = h('ul', { class: 'estado' },
      fila(t('adm.conexion'), navigator.onLine ? t('adm.enLinea') : t('adm.sinConexion'), navigator.onLine ? 'ok' : 'alerta'),
      fila(t('adm.bd'), nube ? 'Firebase (Firestore)' : t('adm.modoDemoLocal'), nube ? 'ok' : 'alerta'),
      fila(t('adm.fbConf'), firebaseConfigurado() ? t('adm.si') : t('adm.noConfigurar'), firebaseConfigurado() ? 'ok' : 'alerta'),
      fila(t('adm.catalogos'), cat ? (cat.completo ? t('adm.catPub', { a: cat.badges, b: cat.shop }) : t('adm.catFaltan', { a: cat.badges, b: cat.badgesEsperadas, c: cat.shop, d: cat.shopEsperados })) : '—', cat?.completo ? 'ok' : 'alerta'),
      fila(t('adm.appCheck'), CONFIG.appCheckSiteKey ? t('adm.activada') : t('adm.sinActivar'), CONFIG.appCheckSiteKey ? 'ok' : 'alerta'),
      fila(t('adm.swFila'), d.swTxt, d.sw === 'activo' ? 'ok' : 'alerta'),
      fila(t('adm.archivos'), `${d.archivos} · ${d.usoMB} MB`),
      fila(t('adm.version'), `v${CONFIG.version} · ${t('adm.cache')} ${d.cache}`),
      fila(t('adm.pendAprobar'), String(pend.length), pend.length ? 'alerta' : 'ok'));
    const botonCat = cat ? h('button', { class: `btn ${cat.completo ? 'btn--suave' : 'btn--primary'} btn--sm`, type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; try { const n = await A.sembrarCatalogos(); toast(t('adm.catPublicadosN', { n })); await pintar(); } catch (er) { toast(er.message || t('adm.noPublicar'), { tipo: 'error' }); e.currentTarget.disabled = false; } } }, cat.completo ? t('adm.republicar') : t('adm.publicarAhora')) : null;
    return [
      pend.length ? h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, pend.length === 1 ? t('adm.hayPend1') : t('adm.hayPendN', { n: pend.length })), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { tab = 'docentes'; pintar(); } }, t('adm.revisar'))) : null,
      h('div', { class: 'rejilla-2' },
        h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.estadoSistema')), botonCat), lista),
        h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.registro')), h('span', { class: 'suave' }, t('adm.ultimasAcciones'))),
          audit.length ? h('ul', { class: 'actividad' }, audit.map((a) => h('li', { class: 'actividad__item' }, h('span', { class: 'actividad__ic' }, icono('clock', { tam: 16 })), h('span', {}, h('strong', {}, a.rol || ''), ` ${a.accion}`, a.objetivo ? h('small', { class: 'suave' }, ` · ${a.objetivo}`) : null), h('time', { class: 'suave' }, fechaHora(a.creadoEn)))))
            : h('p', { class: 'suave' }, t('adm.sinAcciones')))),
      panelRevision(),
      h('p', { class: 'suave pequeno' }, t('adm.resumenPie', { n: wl.length, f: ajustes.permitirFotos ? t('adm.fotosPerm') : t('adm.fotosOff') }))];
  }

  /* ═════ Revisión de cuentas de estudiantes ═════ */
  function panelRevision() {
    const cuerpo = h('div', {}, h('p', { class: 'suave' }, t('adm.rev.texto')));
    const pintarFilas = (filas) => {
      const malos = filas.filter((f) => f.faltan.length), sin = filas.filter((f) => f.estado === 'sin-avance');
      const chip = (f) => f.estado === 'incompleto' ? h('span', { class: 'pill pill--inactivo' }, t('adm.rev.incompleto', { f: f.faltan.join(', ') })) : f.estado === 'sin-avance' ? h('span', { class: 'pill' }, t('adm.rev.sinAvance')) : h('span', { class: 'pill pill--ok' }, t('adm.rev.bien'));
      cuerpo.replaceChildren(...[
        h('p', {}, h('strong', {}, t('adm.rev.resumen', { a: filas.length, b: malos.length, c: sin.length }))),
        malos.length ? h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; try { const n = await A.repararPerfiles(filas); toast(t('adm.rev.reparados', { n })); pintarFilas(await A.revisarEstudiantes()); } catch (er) { toast(er.message || t('adm.rev.noReparar'), { tipo: 'error' }); e.currentTarget.disabled = false; } } }, t('adm.rev.reparar', { n: malos.length })) : null,
        filas.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, [t('adm.rev.th.est'), t('adm.rev.th.grado'), t('adm.rev.th.entra'), t('adm.rev.th.xp'), t('adm.rev.th.monedas'), t('adm.rev.th.lecciones'), t('adm.rev.th.estrellas'), t('adm.rev.th.estado')].map((txt) => h('th', {}, txt)))),
          h('tbody', {}, filas.map((f) => h('tr', {}, h('td', {}, f.nombre), h('td', {}, f.grado ? t('grado.etq', { g: f.grado }) : '—'), h('td', {}, f.entra === 'Google' ? t('adm.rev.entraGoogle') : t('adm.rev.entraCodigo')), h('td', {}, String(f.xp)), h('td', {}, String(f.monedas)), h('td', {}, String(f.lecciones)), h('td', {}, String(f.estrellas)), h('td', {}, chip(f))))))) : h('p', { class: 'suave' }, t('adm.rev.noHay'))].filter(Boolean));
    };
    const boton = h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; cuerpo.replaceChildren(h('p', { class: 'suave' }, t('adm.rev.revisando'))); try { pintarFilas(await A.revisarEstudiantes()); } catch (er) { cuerpo.replaceChildren(h('p', { class: 'mensaje-error' }, er.message || t('adm.rev.noRevisar'))); } e.currentTarget.disabled = false; } }, t('adm.rev.btn'));
    return h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.rev.titulo')), boton), cuerpo);
  }

  /* ═════ Docentes ═════ */
  async function docentes() {
    const [pend, activos, rech, wl] = await Promise.all([A.usuariosPorRol('pendiente').catch(() => []), A.usuariosPorRol('docente').catch(() => []), A.usuariosPorRol('rechazado').catch(() => []), A.listaBlanca().catch(() => [])]);
    const accion = async (u, rol) => { try { await A.cambiarRol(u, rol); toast(rol === 'docente' ? t('adm.doc.yaEs', { n: u.nombre }) : t('adm.doc.rechazada')); await pintar(); } catch (e) { toast(e.message || t('adm.doc.noRol'), { tipo: 'error' }); } };
    const tabla = (lista, acciones, vacio) => lista.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, [t('adm.doc.th.nombre'), t('adm.doc.th.correo'), t('adm.doc.th.ultimo'), ''].map((txt) => h('th', { scope: 'col' }, txt)))),
      h('tbody', {}, lista.map((u) => h('tr', {}, h('th', { scope: 'row' }, u.nombre), h('td', {}, u.email || '—'), h('td', {}, textoUltima(u.ultimaConexion)), h('td', { class: 'fila' }, acciones(u))))))) : h('p', { class: 'suave' }, vacio);
    const correo = campo({ etiqueta: t('adm.doc.correoEtq'), type: 'email', placeholder: t('adm.doc.correoPh') });
    const area = campo({ etiqueta: t('adm.doc.areaEtq'), maxlength: 60, placeholder: t('adm.doc.areaPh') });
    const form = h('form', { class: 'fila fila--envuelve fila--fin', onsubmit: async (e) => { e.preventDefault(); try { await A.agregarWhitelist(correo.input.value, area.input.value); toast(t('adm.doc.autorizado')); await pintar(); } catch (er) { toast(er.message, { tipo: 'error' }); } } },
      correo.nodo, area.nodo, h('button', { class: 'btn btn--primary btn--sm', type: 'submit' }, icono('plus', { tam: 16 }), t('adm.doc.autorizar')));
    return [
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.doc.pendientes', { n: pend.length })), h('span', { class: 'suave' }, t('adm.doc.entraronGoogle'))),
        tabla(pend, (u) => [h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => accion(u, 'docente') }, t('adm.doc.aprobar')), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => accion(u, 'rechazado') }, t('adm.doc.rechazar'))], t('adm.doc.noPend'))),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.doc.activos', { n: activos.length }))),
        tabla(activos, (u) => [h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => { if (await confirmar({ titulo: t('adm.doc.quitarQ', { n: u.nombre }), mensaje: t('adm.doc.quitarMsg'), si: t('adm.doc.quitarSi'), peligro: true })) accion(u, 'rechazado'); } }, t('adm.doc.quitarSi'))], t('adm.doc.sinDocentes'))),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.doc.preAut')), h('span', { class: 'suave' }, t('adm.doc.entranDirecto'))),
        h('p', { class: 'suave' }, t('adm.doc.preTexto')), form,
        wl.length ? h('ul', { class: 'actividad' }, wl.map((w) => h('li', { class: 'actividad__item' }, h('span', { class: 'actividad__ic' }, icono('users', { tam: 16 })), h('span', {}, h('strong', {}, w.correo || w.id), w.area ? h('small', { class: 'suave' }, ` · ${w.area}`) : null),
          h('button', { class: 'btn btn--suave btn--sm', type: 'button', 'aria-label': t('adm.doc.quitarAria', { c: w.correo }), onclick: async () => { await A.quitarWhitelist(w.id); await pintar(); } }, icono('trash', { tam: 14 }))))) : null),
      rech.length ? h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.doc.rechazados', { n: rech.length }))), tabla(rech, (u) => [h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => accion(u, 'docente') }, t('adm.doc.aprobarAhora'))], '')) : null,
      h('p', { class: 'suave pequeno' }, t('adm.doc.adminEs', { e: CONFIG.adminEmail }))];
  }

  /* ═════ Marca ═════ */
  function marcaTab() {
    const nombre = campo({ etiqueta: t('adm.marca.nombre'), value: marca.nombre, maxlength: 30 });
    const lema = campo({ etiqueta: t('adm.marca.lema'), value: marca.lema || '', maxlength: 80 });
    const colegio = campo({ etiqueta: t('adm.marca.colegio'), value: marca.colegio || '', maxlength: 80 });
    let logo = marca.logo || null, hero = marca.hero || null;
    const vistaLogo = h('div', { class: 'marca__vista' }), vistaHero = h('div', { class: 'marca__vista marca__vista--hero' });
    const pintarImgs = () => {
      vistaLogo.replaceChildren(logo ? h('img', { src: logo, alt: t('adm.marca.logoAlt'), width: 80, height: 80 }) : h('span', { class: 'suave' }, t('adm.marca.logoDef')));
      vistaHero.replaceChildren(hero ? h('img', { src: hero, alt: t('adm.marca.portadaAlt') }) : h('span', { class: 'suave' }, t('adm.marca.portadaDef')));
    };
    pintarImgs();
    const subir = (tipo) => h('input', { type: 'file', accept: 'image/*', 'aria-label': tipo === 'logo' ? t('adm.marca.subirLogo') : t('adm.marca.subirPortada'), onchange: async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const url = tipo === 'logo' ? await imagenLibre(f, { maxLado: 256, maxChars: 60000 }) : await imagenLibre(f, { maxLado: 1400, calidad: 0.8, maxChars: 380000 }); if (tipo === 'logo') logo = url; else hero = url; pintarImgs(); } catch (er) { toast(er.message, { tipo: 'error' }); }
    } });
    return h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.marca.titulo')), h('span', { class: 'suave' }, t('adm.marca.sub'))),
      h('form', { class: 'pila', onsubmit: async (e) => {
        e.preventDefault();
        try { await guardarMarca({ nombre: nombre.input.value.trim() || 'TECLEA', lema: lema.input.value.trim(), colegio: colegio.input.value.trim(), logo, hero }); A.auditar('Cambió la marca', nombre.input.value); toast(t('adm.marca.ok')); } catch (er) { toast(er.message || t('perfil.noGuardar'), { tipo: 'error' }); }
      } },
      h('div', { class: 'rejilla-campos' }, nombre.nodo, lema.nodo, colegio.nodo),
      h('div', { class: 'rejilla-2' },
        h('div', { class: 'pila' }, h('strong', {}, t('adm.marca.logo')), vistaLogo, h('div', { class: 'fila fila--envuelve' }, subir('logo'), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { logo = null; pintarImgs(); } }, t('adm.marca.quitar'))), h('small', { class: 'suave' }, t('adm.marca.logoAyuda'))),
        h('div', { class: 'pila' }, h('strong', {}, t('adm.marca.portada')), vistaHero, h('div', { class: 'fila fila--envuelve' }, subir('hero'), h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => { hero = null; pintarImgs(); } }, t('adm.marca.quitar'))), h('small', { class: 'suave' }, t('adm.marca.portadaAyuda')))),
      h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary', type: 'submit' }, t('adm.marca.guardar')))));
  }

  /* ═════ Colores de la interfaz (paleta avanzada) ═════ */
  function coloresTab() {
    const guardada = marca.colores && hexValido(marca.colores.primario) && hexValido(marca.colores.acento) ? { ...marca.colores } : null;
    let c = { ...(guardada || PALETA_ORIGINAL) };
    const salida = h('div', { class: 'pila' });
    const vivo = () => aplicarPaleta(c.primario.toUpperCase() === PALETA_ORIGINAL.primario && c.acento.toUpperCase() === PALETA_ORIGINAL.acento ? null : c); // vista previa en toda la plataforma
    const sync = (origen) => { vivo(); if (origen !== 'pintar') pintar(); };
    const cambiar = (clave, valor) => { if (!hexValido(valor)) return; c[clave] = valor.toUpperCase(); sync(); };

    const entradaColor = (clave, etiqueta, ayuda) => {
      const sel = h('input', { type: 'color', value: c[clave], 'aria-label': t('adm.col.selector', { e: etiqueta }), class: 'paleta__selector', oninput: (e) => { c[clave] = e.target.value.toUpperCase(); vivo(); hex.value = c[clave]; refrescar(); } });
      const hex = h('input', { type: 'text', class: 'input paleta__hex', value: c[clave], maxlength: 7, spellcheck: false, 'aria-label': t('adm.col.hex', { e: etiqueta }), onchange: (e) => { let v = e.target.value.trim(); if (!v.startsWith('#')) v = `#${v}`; if (hexValido(v)) cambiar(clave, v); else { toast(t('adm.col.hexErr'), { tipo: 'error' }); e.target.value = c[clave]; } } });
      return h('div', { class: 'pila paleta__color' }, h('strong', {}, etiqueta), h('div', { class: 'fila' }, sel, hex), h('small', { class: 'suave' }, ayuda));
    };

    const deslizador = (nombre, clave, max, valor, fondo) => h('label', { class: 'paleta__desliz' }, h('span', {}, nombre),
      h('input', { type: 'range', min: 0, max, value: valor, style: { background: fondo }, 'aria-label': t('adm.col.delColor', { n: nombre }), oninput: (e) => { const hsl = aHSL(c.primario); hsl[clave] = Number(e.target.value); c.primario = deHSL(hsl.h, hsl.s, hsl.l); vivo(); refrescar(false); } }),
      h('output', {}, String(valor)));

    const contenedorControles = h('div', { class: 'pila' }), contenedorSugerencias = h('div', { class: 'pila' }), indicador = h('div', { class: 'paleta__contraste', 'aria-live': 'polite' });
    const refrescar = (rehacerControles = true) => {
      const hsl = aHSL(c.primario);
      if (rehacerControles) contenedorControles.replaceChildren(
        deslizador(t('adm.col.matiz'), 'h', 360, hsl.h, 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)'),
        deslizador(t('adm.col.intensidad'), 's', 100, hsl.s, `linear-gradient(90deg, ${deHSL(hsl.h, 0, hsl.l)}, ${deHSL(hsl.h, 100, hsl.l)})`),
        deslizador(t('adm.col.luminosidad'), 'l', 100, hsl.l, `linear-gradient(90deg,#000, ${deHSL(hsl.h, hsl.s, 50)}, #fff)`));
      const arm = armonias(c.primario);
      contenedorSugerencias.replaceChildren(...Object.entries(arm).map(([nombre, lista]) => h('div', { class: 'fila fila--envuelve' }, h('small', { class: 'paleta__arm' }, nombre),
        ...lista.map((col) => h('button', { type: 'button', class: 'paleta__muestra', style: { background: col }, title: t('adm.col.usarTitle', { c: col }), 'aria-label': t('adm.col.usarAria', { c: col, n: nombre }), onclick: () => cambiar('acento', col) })))));
      const r = contraste(c.primario, '#FFFFFF'), ok = r >= 4.5;
      indicador.className = `paleta__contraste ${ok ? 'paleta__contraste--ok' : 'paleta__contraste--alerta'}`;
      indicador.textContent = ok ? t('adm.col.ok', { r: r.toFixed(1) }) : t('adm.col.alerta', { r: r.toFixed(1) });
    };

    const presets = h('div', { class: 'paleta__presets', role: 'group', 'aria-label': t('adm.col.listas') }, PRESETS.map((p) => h('button', { type: 'button', class: 'paleta__preset', 'aria-label': t('adm.col.paletaAria', { n: p.nombre }), onclick: () => { c = { primario: p.primario, acento: p.acento }; sync(); } },
      h('span', { class: 'paleta__duo' }, h('i', { style: { background: p.primario } }), h('i', { style: { background: p.acento } })), h('span', {}, p.nombre))));

    const principal = entradaColor('primario', t('adm.col.principal'), t('adm.col.principalAyuda'));
    const acento = entradaColor('acento', t('adm.col.acento'), t('adm.col.acentoAyuda'));
    const muestra = h('div', { class: 'paleta__vista card' }, h('strong', {}, t('adm.col.asiSeVe')), h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--primary btn--sm', type: 'button' }, t('adm.col.btnPrincipal')), h('button', { class: 'btn btn--coral btn--sm', type: 'button' }, t('adm.col.acentoBtn')), h('span', { class: 'chip' }, '★ 1.250'), h('span', { class: 'etiqueta' }, t('adm.col.nivel4'))),
      h('div', { class: 'paleta__barra' }, h('span', {})));

    function pintar() { principal.querySelector('.paleta__selector').value = c.primario; principal.querySelector('.paleta__hex').value = c.primario; acento.querySelector('.paleta__selector').value = c.acento; acento.querySelector('.paleta__hex').value = c.acento; refrescar(); }
    refrescar();

    return h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.col.titulo')), h('span', { class: 'suave' }, t('adm.col.sub'))),
      h('p', { class: 'suave' }, t('adm.col.texto')),
      h('strong', {}, t('adm.col.listas')), presets,
      h('div', { class: 'rejilla-2' }, h('div', { class: 'pila' }, principal, h('strong', {}, t('adm.col.ajuste')), contenedorControles, indicador), h('div', { class: 'pila' }, acento, h('strong', {}, t('adm.col.sugerencias')), contenedorSugerencias, muestra)),
      h('div', { class: 'fila fila--fin fila--envuelve' },
        h('button', { class: 'btn btn--suave', type: 'button', onclick: () => { c = { ...PALETA_ORIGINAL }; sync(); } }, t('adm.col.originales')),
        h('button', { class: 'btn btn--suave', type: 'button', onclick: () => { c = { ...(guardada || PALETA_ORIGINAL) }; sync(); } }, t('adm.col.deshacer')),
        h('button', { class: 'btn btn--primary', type: 'button', onclick: async (e) => {
          e.currentTarget.disabled = true;
          const original = c.primario.toUpperCase() === PALETA_ORIGINAL.primario && c.acento.toUpperCase() === PALETA_ORIGINAL.acento;
          try { await guardarMarca({ colores: original ? null : c }); A.auditar('Cambió los colores', original ? 'originales' : `${c.primario} / ${c.acento}`); toast(t('adm.col.guardados')); } catch (er) { toast(er.message || t('perfil.noGuardar'), { tipo: 'error' }); }
          e.currentTarget.disabled = false;
        } }, t('adm.col.guardar'))), salida);
  }

  /* ═════ Ajustes ═════ */
  async function ajustesTab() {
    const aj = await A.leerAjustes();
    const dominios = campo({ etiqueta: t('adm.aj.dominios'), value: (aj.dominiosAlumnos || []).join(', '), placeholder: t('adm.aj.dominiosPh'), ayuda: t('adm.aj.dominiosAyuda') });
    return h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.aj.titulo'))),
      interruptor({ etiqueta: t('adm.aj.fotos'), descripcion: t('adm.aj.fotosDesc'), activo: aj.permitirFotos, alCambiar: async (v) => { try { await A.guardarAjustes({ permitirFotos: v }); toast(v ? t('adm.aj.fotosOk') : t('adm.aj.fotosNo')); } catch (e) { toast(e.message || t('perfil.noGuardar'), { tipo: 'error' }); } } }),
      h('form', { class: 'pila', onsubmit: async (e) => { e.preventDefault(); try { await A.guardarAjustes({ dominiosAlumnos: dominios.input.value.split(',') }); toast(t('adm.aj.dominiosOk')); } catch (er) { toast(er.message || t('perfil.noGuardar'), { tipo: 'error' }); } } },
        dominios.nodo, h('div', { class: 'fila fila--fin' }, h('button', { class: 'btn btn--primary btn--sm', type: 'submit' }, t('adm.aj.guardarDominios')))));
  }

  /* ═════ Datos y respaldo ═════ */
  async function datosTab() {
    const solicitudes = await store_users_eliminacion();
    const estado = h('p', { class: 'suave', 'aria-live': 'polite' });
    const uid = campo({ etiqueta: t('adm.dat.uid'), placeholder: t('adm.dat.uidPh') });
    return [
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.dat.respaldo'))),
        h('p', { class: 'suave' }, t('adm.dat.respaldoTexto')),
        h('div', { class: 'fila fila--envuelve' }, h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; try { const d = await A.exportarTodo((c) => { estado.textContent = t('adm.dat.leyendo', { c }); }); descargarJSON(`teclea-respaldo-${new Date().toISOString().slice(0, 10)}.json`, d); estado.textContent = d.omitidas.length ? t('adm.dat.omitidas', { l: d.omitidas.join(', ') }) : t('adm.dat.descargado'); } catch (er) { estado.textContent = er.message; } e.currentTarget.disabled = false; } }, icono('download', { tam: 16 }), t('adm.dat.descargar'))), estado),
      h('section', { class: 'panel' }, h('header', { class: 'panel__cab' }, h('h2', {}, t('adm.dat.personales')), h('span', { class: 'suave' }, t('adm.dat.personalesSub'))),
        solicitudes.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla' }, h('thead', {}, h('tr', {}, [t('adm.dat.th.solicitante'), t('adm.dat.th.fecha'), ''].map((txt) => h('th', { scope: 'col' }, txt)))), h('tbody', {}, solicitudes.map((u) => h('tr', {}, h('th', { scope: 'row' }, `${u.apodo} (${u.nombre})`), h('td', {}, fechaHora(u.solicitudEliminacion)), h('td', { class: 'fila' }, accionesUsuario(u.uid))))))) : h('p', { class: 'suave' }, t('adm.dat.noSolic')),
        h('div', { class: 'fila fila--envuelve fila--fin' }, uid.nodo, h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => uid.input.value.trim() && exportarUno(uid.input.value.trim()) }, t('adm.dat.exportar')), h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: () => uid.input.value.trim() && borrarUno(uid.input.value.trim()) }, t('adm.dat.eliminarDatos')))),
      h('p', { class: 'suave pequeno' }, t('adm.dat.nota'))];
  }
  const store_users_eliminacion = () => import('../../db/store.js').then((s) => s.consultar('users', { donde: [['solicitudEliminacion', '>', 0]] })).catch(() => []);
  const exportarUno = async (uid) => { try { const d = await A.exportarUsuario(uid); if (!d.usuario) return toast(t('adm.dat.noUsuario'), { tipo: 'error' }); descargarJSON(`datos-${uid}.json`, d); } catch (e) { toast(e.message, { tipo: 'error' }); } };
  const borrarUno = async (uid) => { if (!(await confirmar({ titulo: t('adm.dat.borrarQ'), mensaje: t('adm.dat.borrarMsg'), si: t('adm.dat.eliminarDatos'), peligro: true }))) return; try { const n = await A.borrarDatosUsuario(uid); toast(t('adm.dat.eliminados', { n })); await pintar(); } catch (e) { toast(e.message || t('adm.dat.noEliminar'), { tipo: 'error' }); } };
  const accionesUsuario = (uid) => [h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => exportarUno(uid) }, t('adm.dat.exportar')), h('button', { class: 'btn btn--peligro btn--sm', type: 'button', onclick: () => borrarUno(uid) }, t('adm.dat.eliminar'))];

  /* ═════ Marco ═════ */
  async function pintar() {
    raiz.replaceChildren(...[
      h('header', { class: 'pagina__cab' }, h('div', {}, h('h1', {}, t('adm.titulo')), h('p', { class: 'suave' }, t('adm.sub'))),
        h('a', { class: 'btn btn--suave btn--sm', href: 'configurar.html' }, icono('settings', { tam: 16 }), t('adm.asistente'))),
      !nube ? h('div', { class: 'aviso', role: 'note' }, icono('info', { tam: 18 }), h('span', {}, t('adm.demoAviso'))) : null,
      h('div', { class: 'tabs tabs--5 tabs--staff', role: 'tablist' }, TABS.map(([id, etq]) => h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(id === tab), onclick: () => { tab = id; pintar(); } }, etq()))),
      cargando].filter(Boolean));
    const cont = tab === 'resumen' ? await resumen() : tab === 'docentes' ? await docentes() : tab === 'marca' ? marcaTab() : tab === 'colores' ? coloresTab() : tab === 'ajustes' ? await ajustesTab() : await datosTab();
    cargando.replaceWith(...[].concat(cont).filter(Boolean));
  }
  await pintar();
  return raiz;
}
