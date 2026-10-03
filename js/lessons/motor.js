/**
 * Motor de escritura (lógica pura, sin DOM → se puede probar en Node).
 *
 * Métricas (palabra = 5 caracteres):
 *   PPM bruto  = (pulsaciones / 5) / minutos
 *   PPM neto   = ((posición − errores sin corregir) / 5) / minutos      ← el que se muestra y se guarda
 *   Precisión  = pulsaciones correctas / pulsaciones totales            ← cada tecla equivocada cuenta, aunque luego se corrija
 *
 * Modo estricto: una tecla incorrecta NO avanza el cursor (hay que acertar para seguir).
 * Modo normal: el cursor avanza y el error queda marcado (se puede borrar si el retroceso está permitido).
 */

const MAX_PPM_CREIBLE = 220;

export class MotorEscritura {
  /**
   * @param {object} o
   * @param {string} o.texto
   * @param {boolean} [o.estricto]    no avanza con errores
   * @param {boolean} [o.retroceso]   permite borrar (ignorado en estricto)
   * @param {number}  [o.seg]         si > 0: modo contrarreloj (termina al acabarse el tiempo)
   * @param {function} [o.alEvento]   (evento) => void   evento: {tipo, pos, esperado?, recibido?}
   * @param {function} [o.reloj]      () => ms (inyectable para pruebas)
   */
  constructor({ texto, estricto = false, retroceso = true, seg = 0, alEvento = () => {}, reloj = () => performance.now() }) {
    this.chars = [...texto];
    this.estricto = estricto;
    this.retroceso = retroceso && !estricto;
    this.seg = seg;
    this.alEvento = alEvento;
    this.reloj = reloj;
    this.reiniciar();
  }

  reiniciar() {
    this.pos = 0;
    this.estado = new Uint8Array(this.chars.length); // 0 pendiente · 1 correcta · 2 incorrecta
    this.pulsaciones = 0;
    this.correctas = 0;
    this.errores = 0;              // errores cometidos (incluye los corregidos)
    this.sinCorregir = 0;          // errores que siguen en el texto
    this.porTecla = {};            // carácter esperado → {ok, err}
    this.inicio = null;
    this.fin = null;
    this.acumulado = 0;            // ms activos antes de la última pausa
    this.marcaActiva = null;
    this.pausado = false;
    this.terminado = false;
    this.intervalos = [];          // ms entre pulsaciones (para detectar trampas)
    this.ultimaPulsacion = null;
    this.banderas = { pegado: false, rafaga: false, imposible: false };
    this._rafagaSeguidas = 0;
  }

  get actual() { return this.chars[this.pos]; }
  get longitud() { return this.chars.length; }

  /** Milisegundos activos (sin contar pausas). */
  msActivos() {
    if (this.inicio == null) return 0;
    const fin = this.terminado ? this.fin : this.pausado ? this.marcaActiva : this.reloj();
    return this.acumulado + (this.pausado || this.terminado ? 0 : fin - this.marcaActiva);
  }

  segundos() { return this.msActivos() / 1000; }
  segundosRestantes() { return this.seg ? Math.max(0, this.seg - this.segundos()) : null; }

  _arranca() {
    if (this.inicio == null) { this.inicio = this.reloj(); this.marcaActiva = this.inicio; this.alEvento({ tipo: 'inicio' }); }
  }

  _tecla(c) { return (this.porTecla[c] ||= { ok: 0, err: 0 }); }

  /** Procesa un carácter escrito. Devuelve 'ok' | 'error' | 'ignorado'. */
  escribir(ch) {
    if (this.terminado || this.pausado || this.pos >= this.chars.length) return 'ignorado';
    this._arranca();
    const t = this.reloj();
    if (this.ultimaPulsacion != null) {
      const d = t - this.ultimaPulsacion;
      this.intervalos.push(d);
      // Ráfaga sospechosa: 8 pulsaciones seguidas con menos de 25 ms entre ellas
      this._rafagaSeguidas = d < 25 ? this._rafagaSeguidas + 1 : 0;
      if (this._rafagaSeguidas >= 8) this.banderas.rafaga = true;
    }
    this.ultimaPulsacion = t;

    const esperado = this.chars[this.pos];
    this.pulsaciones++;
    if (ch === esperado) {
      this.correctas++;
      this._tecla(esperado).ok++;
      this.estado[this.pos] = 1;
      this.pos++;
      this.alEvento({ tipo: 'avance', pos: this.pos });
      if (this.pos >= this.chars.length) this.terminar();
      return 'ok';
    }
    this.errores++;
    this._tecla(esperado).err++;
    if (this.estricto) {
      this.alEvento({ tipo: 'error', pos: this.pos, esperado, recibido: ch, avanzo: false });
    } else {
      this.estado[this.pos] = 2;
      this.sinCorregir++;
      this.pos++;
      this.alEvento({ tipo: 'error', pos: this.pos - 1, esperado, recibido: ch, avanzo: true });
      if (this.pos >= this.chars.length) this.terminar();
    }
    return 'error';
  }

  /** Retroceso (si está permitido). */
  borrar() {
    if (this.terminado || this.pausado || !this.retroceso || this.pos === 0) return false;
    this.pos--;
    if (this.estado[this.pos] === 2) this.sinCorregir--;
    this.estado[this.pos] = 0;
    this.alEvento({ tipo: 'borrar', pos: this.pos });
    return true;
  }

  marcarPegado() { this.banderas.pegado = true; this.alEvento({ tipo: 'pegado' }); }

  pausar() {
    if (this.pausado || this.terminado || this.inicio == null) { this.pausado = this.pausado || false; return; }
    this.acumulado += this.reloj() - this.marcaActiva;
    this.marcaActiva = this.reloj();
    this.pausado = true;
    this.alEvento({ tipo: 'pausa' });
  }

  reanudar() {
    if (!this.pausado) return;
    this.pausado = false;
    this.marcaActiva = this.reloj();
    this.alEvento({ tipo: 'reanuda' });
  }

  /** Para el modo contrarreloj: llamar periódicamente. */
  tick() {
    if (this.seg && !this.terminado && this.inicio != null && !this.pausado && this.segundos() >= this.seg) this.terminar();
  }

  terminar() {
    if (this.terminado) return;
    if (!this.pausado && this.inicio != null) this.acumulado += this.reloj() - this.marcaActiva;
    this.terminado = true;
    this.fin = this.reloj();
    this.marcaActiva = this.fin;
    this.alEvento({ tipo: 'fin' });
  }

  /* ─────────── Métricas ─────────── */
  ppmBruto(seg = this.segundos()) { return seg > 0 ? (this.pulsaciones / 5) / (seg / 60) : 0; }
  ppmNeto(seg = this.segundos()) { return seg > 0 ? Math.max(0, (this.pos - this.sinCorregir) / 5) / (seg / 60) : 0; }
  precision() { return this.pulsaciones ? this.correctas / this.pulsaciones : 1; }

  /** PPM "en vivo" estable: no se muestra hasta tener al menos 4 s de datos. */
  ppmEnVivo() { const s = this.segundos(); return s >= 4 ? Math.round(this.ppmNeto(s)) : 0; }

  /** Resultado final listo para guardar. Usa la duración ENTERA (≥ 3 s) para que PPM y tiempo sean coherentes. */
  resultado() {
    const dur = Math.max(3, Math.ceil(this.segundos()));
    const ppm = Math.max(0, ((this.pos - this.sinCorregir) / 5) / (dur / 60));
    if (ppm > MAX_PPM_CREIBLE) this.banderas.imposible = true;
    return {
      ppm: Math.min(200, Math.round(ppm * 10) / 10),
      precision: Math.round(this.precision() * 1000) / 10,   // 0–100 con un decimal
      errores: this.errores,
      sinCorregir: this.sinCorregir,
      duracionSeg: dur,
      caracteres: this.pos,
      pulsaciones: this.pulsaciones,
      completo: this.pos >= this.chars.length,
      porTecla: this.porTecla,
      banderas: { ...this.banderas },
    };
  }
}
