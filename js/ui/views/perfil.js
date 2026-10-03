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
import { icono } from '../icons.js';
import { nivelPorXP } from '../../core/levels.js';

const AVATARES = ['🦊', '🐼', '🐯', '🦄', '🐙', '🦖', '🤖', '🐸'];
const ROLES = { estudiante: 'Estudiante', docente: 'Docente', admin: 'Administración' };

const cambiar = (parche) => cambiarPrefs(parche, { alGuardar: sincronizarPrefs });

export async function render() {
  const u = state.user;
  const p = state.prefs;
  const nivel = nivelPorXP(u.xp);

  // ── Cabecera de perfil ──
  const apodo = campo({ etiqueta: 'Mi nombre en la plataforma', value: u.apodo, maxlength: 30, autocomplete: 'off' });
  apodo.input.addEventListener('change', async () => {
    const v = apodo.input.value.trim().slice(0, 30);
    if (!v) { apodo.input.value = u.apodo; return; }
    try { await guardarPerfil({ apodo: v }); toast('Nombre actualizado'); } catch { toast('No se pudo guardar', { tipo: 'error' }); }
  });

  const botonesAvatar = AVATARES.map((e) => h('button', {
    type: 'button', class: 'opcion-avatar', 'aria-pressed': String(e === (u.avatar?.emoji || '🦊')), 'aria-label': `Avatar ${e}`,
    onclick: async () => {
      botonesAvatar.forEach((b, i) => b.setAttribute('aria-pressed', String(AVATARES[i] === e)));
      try { await guardarPerfil({ avatar: { ...(u.avatar || {}), emoji: e } }); } catch { toast('No se pudo guardar', { tipo: 'error' }); }
    },
  }, e));

  const cabecera = h('section', { class: 'card card--hero perfil__cab' },
    h('div', { class: 'perfil__avatar', 'aria-hidden': 'true' }, u.avatar?.emoji || '🦊'),
    h('div', { class: 'perfil__datos' },
      h('h1', {}, u.nombre),
      h('p', {}, h('span', { class: 'etiqueta' }, ROLES[u.rol] || u.rol), u.grado ? h('span', { class: 'etiqueta etiqueta--sol' }, `${u.grado}.º grado`) : null),
      h('p', { class: 'suave' }, `Nivel ${nivel.nivel} · ${nivel.nombre} · ${u.xp.toLocaleString('es-CO')} XP`)),
    mascota('celebra', { tam: 'md' }));

  const seccionAvatar = seccion('Mi avatar', apodo.nodo,
    h('div', { class: 'rejilla-avatares', role: 'group', 'aria-label': 'Elegir avatar' }, botonesAvatar),
    h('p', { class: 'suave pequeno' }, 'Pronto podrás vestir a tu avatar con accesorios de la tienda.'));

  // ── Apariencia ──
  const apariencia = seccion('Apariencia',
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, 'Tema'),
      segmentado({ nombre: 'tema', etiqueta: 'Tema', valor: p.tema, alCambiar: (v) => cambiar({ tema: v }),
        opciones: [{ valor: 'auto', etiqueta: 'Automático' }, { valor: 'claro', etiqueta: 'Claro' }, { valor: 'oscuro', etiqueta: 'Oscuro' }] })),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, 'Tamaño del texto'),
      segmentado({ nombre: 'texto', etiqueta: 'Tamaño del texto', valor: p.texto, alCambiar: (v) => cambiar({ texto: v }),
        opciones: [{ valor: 'normal', etiqueta: 'Normal' }, { valor: 'grande', etiqueta: 'Grande' }, { valor: 'enorme', etiqueta: 'Muy grande' }] })));

  // ── Accesibilidad ──
  const accesibilidad = seccion('Accesibilidad',
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, 'Letra'),
      segmentado({ nombre: 'fuente', etiqueta: 'Tipo de letra', valor: p.fuente, alCambiar: (v) => cambiar({ fuente: v }),
        opciones: [{ valor: 'normal', etiqueta: 'Estándar' }, { valor: 'dislexia', etiqueta: 'Fácil de leer (Lexend)' }] })),
    interruptor({ etiqueta: 'Modo daltónico', descripcion: 'Usa azul y naranja en lugar de verde y rojo, y agrega símbolos.', activo: p.daltonico, alCambiar: (v) => cambiar({ daltonico: v }) }),
    interruptor({ etiqueta: 'Menos movimiento', descripcion: 'Reduce animaciones y efectos.', activo: p.movimiento === 'reducido', alCambiar: (v) => cambiar({ movimiento: v ? 'reducido' : 'auto' }) }));

  // ── Sonido ──
  const volumen = h('input', {
    type: 'range', min: 0, max: 100, value: Math.round(p.volumen * 100), class: 'rango', 'aria-label': 'Volumen',
    oninput: (e) => cambiar({ volumen: Number(e.target.value) / 100 }),
  });
  const sonido = seccion('Sonido y vibración',
    interruptor({ etiqueta: 'Sonidos suaves', descripcion: 'Efectos al escribir y ganar medallas.', activo: p.sonido, alCambiar: (v) => cambiar({ sonido: v }) }),
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, 'Volumen'), volumen),
    interruptor({ etiqueta: 'Vibración en tablet o celular', descripcion: 'Una pequeña vibración cuando te equivocas.', activo: p.vibracion, alCambiar: (v) => cambiar({ vibracion: v }) }));

  // ── Escritura ──
  const escritura = seccion('Escritura',
    h('div', { class: 'fila-ajuste fila-ajuste--columna' }, h('strong', {}, 'Distribución del teclado'),
      segmentado({ nombre: 'teclado', etiqueta: 'Distribución del teclado', valor: p.tecladoIdioma, alCambiar: (v) => cambiar({ tecladoIdioma: v }),
        opciones: [{ valor: 'es-LA', etiqueta: 'Español Latinoamérica' }, { valor: 'es-ES', etiqueta: 'Español España' }] })),
    interruptor({ etiqueta: 'Modo estricto', descripcion: 'No avanza hasta que escribas la letra correcta.', activo: p.modoEstricto, alCambiar: (v) => cambiar({ modoEstricto: v }) }),
    interruptor({ etiqueta: 'Permitir borrar (retroceso)', descripcion: 'Puedes corregir tus errores con la tecla de borrar.', activo: p.permitirRetroceso, alCambiar: (v) => cambiar({ permitirRetroceso: v }) }));

  // ── Privacidad ──
  const privacidad = seccion('Mis datos y privacidad',
    h('p', { class: 'suave' }, 'Tus datos son tuyos. Puedes descargarlos o pedir que se eliminen.'),
    h('div', { class: 'fila fila--envuelve' },
      h('button', { class: 'btn btn--suave', type: 'button', onclick: () => {
        descargarJSON(`mis-datos-${u.apodo}.json`, { perfil: state.user, preferencias: state.prefs, exportadoEn: new Date().toISOString() });
        toast('Descargué tus datos en un archivo.');
      } }, icono('download', { tam: 20 }), 'Descargar mis datos'),
      h('button', { class: 'btn btn--suave btn--peligro-suave', type: 'button', onclick: async () => {
        const ok = await confirmar({ titulo: '¿Pedir que borren mis datos?', mensaje: 'Se enviará una solicitud a tu docente o administración para eliminar tu cuenta y tu progreso. Esto no se puede deshacer.', si: 'Sí, enviar solicitud', peligro: true });
        if (!ok) return;
        try { await guardarPerfil({ solicitudEliminacion: true }); toast('Solicitud enviada. Tu docente la revisará.', { tipo: 'info' }); }
        catch { toast('No se pudo enviar la solicitud', { tipo: 'error' }); }
      } }, icono('trash', { tam: 20 }), 'Pedir eliminar mis datos')),
    h('p', { class: 'pequeno' }, h('a', { href: '#/privacidad' }, 'Leer el aviso de privacidad')));

  const salir = h('button', { class: 'btn btn--suave btn--bloque', type: 'button', onclick: async () => {
    await cerrarSesion();
    navegar('/', { reemplazar: true });
  } }, icono('logout', { tam: 20 }), 'Cerrar sesión');

  return h('div', { class: 'perfil' }, cabecera,
    h('div', { class: 'perfil__rejilla' }, seccionAvatar, apariencia, accesibilidad, sonido, escritura, privacidad),
    salir);
}
