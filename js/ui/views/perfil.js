/**
 * Perfil y ajustes: avatar, apariencia, accesibilidad, sonido, teclado y privacidad.
 * Todo se guarda al instante en el dispositivo y se sincroniza con la nube.
 */
import { state } from '../../core/state.js';
import { h, descargarJSON } from '../../core/utils.js';
import { navegar } from '../../core/router.js';
import { cerrarSesion, guardarPerfil } from '../../auth/auth.js';
import { cambiarPrefs } from '../theme.js';
import { sincronizarPrefs } from '../sync-prefs.js';
import { segmentado, interruptor, seccion, campo } from '../componentes.js';
import { confirmar, toast } from '../overlay.js';
import { mascota } from '../art.js';
import { avatar, EMOJIS_AVATAR, FONDOS_AVATAR } from '../avatar.js';
import { ESPECIES, EMOJI_ESPECIE, personajeSVG } from '../personaje.js';
import { textoVersion } from '../../core/version.js';
import { fotoPerfil } from '../imagen.js';
import { leer } from '../../db/store.js';
import * as store from '../../db/store.js';
import { cuarto } from '../cuarto.js';
import { cargarTienda } from '../../db/tienda.js';
import { icono } from '../icons.js';
import { nivelPorXP } from '../../core/levels.js';
import { t, locale } from '../../i18n/index.js';
import { selectorIdioma } from '../idioma.js';

const rolTxt = (r) => (['estudiante', 'docente', 'admin'].includes(r) ? t(`rol.${r}`) : r);

const cambiar = (parche) => cambiarPrefs(parche, { alGuardar: sincronizarPrefs });

export async function render() {
  const u = state.user;
  const p = state.prefs;
  const nivel = nivelPorXP(u.xp);

  // ── Cabecera de perfil ──
  const apodo = campo({ etiqueta: t('perfil.miNombre'), value: u.apodo, maxlength: 30, autocomplete: 'off' });
  apodo.input.addEventListener('change', async () => {
    const v = apodo.input.value.trim().slice(0, 30);
    if (!v) { apodo.input.value = u.apodo; return; }
    try { await guardarPerfil({ apodo: v }); toast(t('perfil.nombreOk')); } catch { toast(t('perfil.noGuardar'), { tipo: 'error' }); }
  });

  // ── Avatar y foto ──
  let fotosOk = true;
  try { fotosOk = (await leer('config/app'))?.permitirFotos !== false; } catch { /* sin permiso: se asume permitido */ }
  const vista = h('div', { class: 'avatar-editor__vista' });
  const pintarVista = () => { vista.replaceChildren(avatar(state.user, { tam: 'xl' })); document.querySelector('.perfil__avatar')?.replaceChildren(avatar(state.user, { tam: 'xl' })); };
  pintarVista();
  const guardarAvatar = async (parche) => {
    try { await guardarPerfil(parche); pintarVista(); } catch (e) { console.warn(e); toast(t('perfil.noGuardarCambio'), { tipo: 'error' }); }
  };
  const refrescarMarcas = () => {
    const av = state.user.avatar || {};
    emojis.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.emoji === (av.emoji || '🦊') && (!av.mascota || EMOJI_ESPECIE[av.mascota] === av.emoji))));
    mascotas.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(av.mascota === b.dataset.especie)));
  };
  // Elegir un animal: quita la mascota dibujada (que tiene prioridad) para que se vea el elegido
  const elegirEmoji = async (e) => {
    // Si hay una mascota dibujada GRATIS de ese animal, se usa dibujada; si no, queda el emoji
    const dibujada = Object.keys(ESPECIES).find((k) => ESPECIES[k].gratis && EMOJI_ESPECIE[k] === e) || null;
    await guardarAvatar({ avatar: { ...(state.user.avatar || {}), emoji: e, mascota: dibujada } }); refrescarMarcas();
  };
  const emojis = h('div', { class: 'rejilla-avatares rejilla-avatares--larga', role: 'group', 'aria-label': t('perfil.animalAria') },
    EMOJIS_AVATAR.map((e) => h('button', { type: 'button', class: 'opcion-avatar', dataset: { emoji: e }, 'aria-pressed': 'false', 'aria-label': t('perfil.avatarAria', { e }), onclick: () => elegirEmoji(e) }, e)));
  const libres = Object.entries(ESPECIES).filter(([, v]) => v.gratis);
  const mascotas = h('div', { class: 'rejilla-avatares', role: 'group', 'aria-label': t('perfil.mascotasAria') },
    libres.map(([k, v]) => h('button', { type: 'button', class: 'opcion-avatar opcion-mascota', dataset: { especie: k }, 'aria-pressed': 'false', 'aria-label': t('perfil.mascotaAria', { n: v.nombre }),
      onclick: async () => { await guardarAvatar({ avatar: { ...(state.user.avatar || {}), emoji: EMOJI_ESPECIE[k] || '🦊', mascota: k } }); refrescarMarcas(); } },
      personajeSVG(k, { cabeza: true, tam: 56 }), h('span', {}, v.nombre))));
  refrescarMarcas();
  const fondos = h('div', { class: 'fondos', role: 'group', 'aria-label': t('perfil.fondoColorAria') },
    FONDOS_AVATAR.map((f) => h('button', { type: 'button', class: 'fondos__op', dataset: { fondo: f }, 'aria-label': t('perfil.fondoAria', { f: t(`fondo.${f}`) }), 'aria-pressed': String(f === (state.user.avatar?.fondo || 'violeta')),
      onclick: (ev) => { fondos.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false')); ev.currentTarget.setAttribute('aria-pressed', 'true'); guardarAvatar({ avatar: { ...(state.user.avatar || {}), fondo: f } }); } },
      h('span', { class: 'avatar avatar--sm', dataset: { fondo: f } }))));
  const archivo = h('input', { type: 'file', accept: 'image/*', class: 'sr-only', id: 'foto-archivo', onchange: async (ev) => {
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    try { await guardarAvatar({ foto: await fotoPerfil(f) }); toast(t('perfil.fotoOk')); } catch (e) { toast(e.message || t('perfil.fotoNo'), { tipo: 'error' }); }
  } });
  const bloqueFoto = fotosOk ? h('div', { class: 'pila' },
    h('div', { class: 'fila fila--envuelve' },
      archivo,
      h('label', { class: 'btn btn--primary btn--sm', for: 'foto-archivo' }, icono('download', { tam: 16 }), t('perfil.subirFoto')),
      state.user.foto ? h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: () => guardarAvatar({ foto: null }) }, t('perfil.quitarFoto')) : null),
    h('p', { class: 'suave pequeno' }, t('perfil.fotoPriv')))
    : h('p', { class: 'suave pequeno' }, t('perfil.fotosOff'));

  // Mi cuarto: ahí se ven las compras de la tienda (siempre con el emoji del personaje, aunque haya foto)
  let catalogo = []; try { catalogo = await cargarTienda(); } catch { /* sin catálogo: se ve el cuarto básico */ }
  const miCuarto = u.rol === 'estudiante' ? seccion(t('perfil.miCuarto'), cuarto(u, catalogo), h('a', { class: 'btn btn--sun btn--sm', href: '#/tienda' }, icono('bag', { tam: 18 }), t('perfil.irTienda'))) : null;
  // ── Diagnóstico de guardado: sirve a docentes/soporte para ver el error real en el equipo del estudiante ──
  const diagSalida = h('p', { class: 'pequeno', role: 'status' }, '');
  const diagBoton = h('button', { class: 'btn btn--suave btn--sm', type: 'button', onclick: async () => {
    diagBoton.disabled = true; diagSalida.textContent = t('perfil.probando');
    const t0 = Date.now();
    try {
      const r = await Promise.race([
        store.actualizar(`users/${state.user.uid}`, { monedas: state.user.monedas || 0 }).then(() => 'ok'),
        new Promise((res) => setTimeout(() => res('pendiente'), 9000)),
      ]);
      diagSalida.textContent = r === 'ok' ? t('perfil.diag.ok', { ms: Date.now() - t0 }) : t('perfil.diag.lento');
    } catch (e) { diagSalida.textContent = t('perfil.diag.rechazo', { e: e?.code || e?.message || e }); }
    let ult = ''; try { const f = JSON.parse(localStorage.getItem('teclea.ultimoFallo') || 'null'); if (f) ult = ' ' + t('perfil.diag.ultimo', { c: f.codigo, f: new Date(f.en).toLocaleString(locale()) }); } catch { /* nada */ }
    diagSalida.textContent += `${ult} ${t('perfil.diag.modo', { m: state.modo, red: navigator.onLine ? t('perfil.diag.conInternet') : t('perfil.diag.sinInternet') })}`;
    diagBoton.disabled = false;
  } }, t('perfil.diag.probar'));
  const diagnostico = h('details', { class: 'pequeno' }, h('summary', {}, t('perfil.diag.titulo')), h('p', { class: 'suave' }, t('perfil.diag.texto')), diagBoton, diagSalida);

  const seccionAvatar = seccion(t('perfil.miAvatar'),
    h('div', { class: 'avatar-editor' }, vista, h('div', { class: 'pila' }, apodo.nodo, bloqueFoto)),
    h('strong', {}, t('perfil.miMascota')), mascotas, h('strong', {}, t('perfil.otroAnimal')), emojis, h('strong', {}, t('perfil.colorFondo')), fondos);

  const cabecera = h('section', { class: 'card card--hero perfil__cab' },
    h('div', { class: 'perfil__avatar', 'aria-hidden': 'true' }, avatar(u, { tam: 'xl' })),
    h('div', { class: 'perfil__datos' },
      h('h1', {}, u.nombre),
      h('p', {}, h('span', { class: 'etiqueta' }, rolTxt(u.rol)), u.grado ? h('span', { class: 'etiqueta etiqueta--sol' }, t('perfil.grado', { g: u.grado })) : null),
      u.rol === 'estudiante' ? h('p', { class: 'suave' }, t('perfil.nivelXp', { n: nivel.nivel, nombre: nivel.nombre, xp: u.xp.toLocaleString(locale()) })) : h('p', { class: 'suave' }, u.email || '')),
    mascota('celebra', { tam: 'md' }));

  // ── Apariencia ──
  const apariencia = seccion(t('perfil.apariencia'),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, t('perfil.idioma')), selectorIdioma()),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, t('perfil.tema')),
      segmentado({ nombre: 'tema', etiqueta: t('perfil.tema'), valor: p.tema, alCambiar: (v) => cambiar({ tema: v }),
        opciones: [{ valor: 'auto', etiqueta: t('perfil.tema.auto') }, { valor: 'claro', etiqueta: t('perfil.tema.claro') }, { valor: 'oscuro', etiqueta: t('perfil.tema.oscuro') }] })),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, t('perfil.textoTam')),
      segmentado({ nombre: 'texto', etiqueta: t('perfil.textoTam'), valor: p.texto, alCambiar: (v) => cambiar({ texto: v }),
        opciones: [{ valor: 'normal', etiqueta: t('perfil.texto.normal') }, { valor: 'grande', etiqueta: t('perfil.texto.grande') }, { valor: 'enorme', etiqueta: t('perfil.texto.enorme') }] })));

  // ── Accesibilidad ──
  const accesibilidad = seccion(t('perfil.accesibilidad'),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, t('perfil.letra')),
      segmentado({ nombre: 'fuente', etiqueta: t('perfil.tipoLetra'), valor: p.fuente, alCambiar: (v) => cambiar({ fuente: v }),
        opciones: [{ valor: 'normal', etiqueta: t('perfil.letra.normal') }, { valor: 'dislexia', etiqueta: t('perfil.letra.dislexia') }] })),
    interruptor({ etiqueta: t('perfil.dalt'), descripcion: t('perfil.daltDesc'), activo: p.daltonico, alCambiar: (v) => cambiar({ daltonico: v }) }),
    interruptor({ etiqueta: t('perfil.mov'), descripcion: t('perfil.movDesc'), activo: p.movimiento === 'reducido', alCambiar: (v) => cambiar({ movimiento: v ? 'reducido' : 'auto' }) }));

  // ── Sonido ──
  const volumen = h('input', {
    type: 'range', min: 0, max: 100, value: Math.round(p.volumen * 100), class: 'rango', 'aria-label': t('perfil.volumen'),
    oninput: (e) => cambiar({ volumen: Number(e.target.value) / 100 }),
  });
  const sonido = seccion(t('perfil.sonidoSec'),
    interruptor({ etiqueta: t('perfil.sonidos'), descripcion: t('perfil.sonidosDesc'), activo: p.sonido, alCambiar: (v) => cambiar({ sonido: v }) }),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, t('perfil.volumen')), volumen),
    interruptor({ etiqueta: t('perfil.vib'), descripcion: t('perfil.vibDesc'), activo: p.vibracion, alCambiar: (v) => cambiar({ vibracion: v }) }));

  // ── Escritura ──
  const escritura = seccion(t('perfil.escritura'),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, t('perfil.distribucion')),
      segmentado({ nombre: 'teclado', etiqueta: t('perfil.distribucion'), valor: p.tecladoIdioma, alCambiar: (v) => cambiar({ tecladoIdioma: v }),
        opciones: [{ valor: 'es-LA', etiqueta: t('perfil.dist.la') }, { valor: 'es-ES', etiqueta: t('perfil.dist.es') }] })),
    interruptor({ etiqueta: t('perfil.estricto'), descripcion: t('perfil.estrictoDesc'), activo: p.modoEstricto, alCambiar: (v) => cambiar({ modoEstricto: v }) }),
    interruptor({ etiqueta: t('perfil.retroceso'), descripcion: t('perfil.retrocesoDesc'), activo: p.permitirRetroceso, alCambiar: (v) => cambiar({ permitirRetroceso: v }) }));

  // ── Privacidad ──
  const privacidad = seccion(t('perfil.datos'),
    h('p', { class: 'suave' }, t('perfil.datosTexto')),
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--suave', type: 'button', onclick: () => {
        descargarJSON(`mis-datos-${u.apodo}.json`, { perfil: state.user, preferencias: state.prefs, exportadoEn: new Date().toISOString() });
        toast(t('perfil.descargado'));
      } }, icono('download', { tam: 20 }), t('perfil.descargar')),
      h('button', { class: 'btn btn--suave btn--peligro-suave', type: 'button', onclick: async () => {
        const ok = await confirmar({ titulo: t('perfil.borrarQ'), mensaje: t('perfil.borrarMsg'), si: t('perfil.borrarSi'), peligro: true });
        if (!ok) return;
        try { await guardarPerfil({ solicitudEliminacion: true }); toast(t('perfil.solicitudOk'), { tipo: 'info' }); }
        catch { toast(t('perfil.solicitudNo'), { tipo: 'error' }); }
      } }, icono('trash', { tam: 20 }), t('perfil.pedirEliminar'))),
    h('p', { class: 'pequeno' }, h('a', { href: '#/privacidad' }, t('perfil.leerAviso'))));

  const salir = h('button', { class: 'btn btn--suave btn--bloque', type: 'button', onclick: async () => {
    await cerrarSesion();
    navegar('/', { reemplazar: true });
  } }, icono('logout', { tam: 20 }), t('nav.cerrarSesion'));

  return h('div', { class: 'perfil' }, cabecera,
    h('div', { class: 'perfil__rejilla' }, seccionAvatar, miCuarto, apariencia, accesibilidad, sonido, escritura, privacidad),
    diagnostico,
    textoVersion(h('p', { class: 'suave pequeno', style: { opacity: .6, textAlign: 'center' } }, '')),
    salir);
}
