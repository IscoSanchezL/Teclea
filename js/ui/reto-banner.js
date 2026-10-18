/** Aviso del Inicio del estudiante: aparece solo cuando su docente activa un reto en vivo. */
import { h } from '../core/utils.js';
import { state } from '../core/state.js';
import { retoActivoDeAlumno } from '../db/reto-clase.js';
import { icono } from './icons.js';
import { t } from '../i18n/index.js';

const SONDEO_MS = 5000;

export function bannerReto() {
  const el = h('div', { class: 'rv-banner-slot', 'aria-live': 'polite' });
  let vivo = true, firma = '';
  const pintar = async () => {
    const r = await retoActivoDeAlumno(state.user).catch(() => null);
    if (!vivo) return;
    const f = r ? `${r.id}|${r.estado}` : '';
    if (f === firma) return;
    firma = f;
    el.replaceChildren(...(r ? [h('a', { class: 'rv-banner', href: `#/reto?id=${r.id}` },
      h('span', { class: 'rv-banner__ic', 'aria-hidden': 'true' }, icono(r.tipo === 'final' ? 'trophy' : 'users', { tam: 26 })),
      h('span', { class: 'rv-banner__txt' }, h('strong', {}, t('rv.e.banner', { clase: r.claseNombre || '' })), h('small', {}, t(`rv.${r.tipo}.nombre`))),
      h('span', { class: 'btn btn--sun btn--sm' }, t('rv.e.participar'), icono('arrow', { tam: 16 })))] : []));
  };
  pintar();
  const timer = setInterval(pintar, SONDEO_MS);
  return { el, destruir: () => { vivo = false; clearInterval(timer); } };
}
