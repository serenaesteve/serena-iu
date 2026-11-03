/* <gota-fecha>: fecha escrita o elegida en un calendario */
class GotaFecha extends GotaControl {
	static etiqueta = "gota-fecha";
	static descripcion = "Fecha con calendario desplegable, que también se puede escribir (15/3/1990). El valor siempre es AAAA-MM-DD, como en un input date.";
	static ejemplo = '<gota-fecha name="alta" min="2026-01-01" value="2026-10-30"></gota-fecha>';
	static partes = { caja: "Marco del campo.", entrada: "El input interno.", abrir: "Botón del calendario.", calendario: "Panel del calendario.", dia: "Cada día." };

	static propiedades = {
		min: { tipo: String, defecto: "", descripcion: "Fecha mínima (AAAA-MM-DD)." },
		max: { tipo: String, defecto: "", descripcion: "Fecha máxima (AAAA-MM-DD)." },
		placeholder: { tipo: String, defecto: "dd/mm/aaaa", descripcion: "Texto de ayuda con el campo vacío." },
		locale: { tipo: String, defecto: "es-ES", descripcion: "Idioma del calendario." }
	};

	static eventos = {
		"gota-abrir": { detalle: "—", descripcion: "Se ha abierto el calendario." },
		"gota-cerrar": { detalle: "—", descripcion: "Se ha cerrado el calendario." },
		"gota-mes": { detalle: "{ anio, mes }", tipoDetalle: "{ anio: number; mes: number }", descripcion: "El calendario enseña otro mes. mes va de 1 a 12." }
	};

	static metodos = {
		"abrir()": "Abre el calendario.",
		"cerrar()": "Cierra el calendario.",
		"irAMes(anio, mes)": "Enseña ese mes (de 1 a 12) sin cambiar el valor.",
		"hoy()": "Elige la fecha de hoy y lanza los eventos."
	};

	get type() { return "date"; }

	/** Valor como Date local, o null (equivale a valueAsDate) */
	get valorFecha() { return GotaFecha.aFecha(this.value); }

	get estaAbierto() { return Boolean(this.flotante?.abierto); }

	static iso(fecha) {
		const mes = String(fecha.getMonth() + 1).padStart(2, "0");
		const dia = String(fecha.getDate()).padStart(2, "0");
		return `${String(fecha.getFullYear()).padStart(4, "0")}-${mes}-${dia}`;
	}

	/** De AAAA-MM-DD a Date en hora local. new Date("2026-03-01") sería UTC y podría cambiar de día. */
	static aFecha(iso) {
		const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
		if (!partes) { return null; }
		const [anio, mes, dia] = partes.slice(1).map(Number);
		const fecha = new Date(anio, mes - 1, dia);
		return fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null;
	}

	/** Entiende 15/3/1990, 15-03-90, 15.3.1990 y 1990-03-15. Devuelve el ISO, "" si está vacío o null si no es una fecha. */
	static interpretar(texto) {
		const limpio = String(texto ?? "").trim();
		if (!limpio) { return ""; }
		if (GotaFecha.aFecha(limpio)) { return limpio; }

		const partes = /^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{2}|\d{4})$/.exec(limpio);
		if (!partes) { return null; }
		const anio = partes[3].length === 2 ? 2000 + Number(partes[3]) - (Number(partes[3]) > 50 ? 100 : 0) : Number(partes[3]);
		const iso = `${String(anio).padStart(4, "0")}-${partes[2].padStart(2, "0")}-${partes[1].padStart(2, "0")}`;
		return GotaFecha.aFecha(iso) ? iso : null;
	}

	normalizar(valor) {
		this.textoInvalido = false;
		return GotaFecha.interpretar(valor) || "";
	}

	alDesconectar() { this.flotante?.cerrar(); }

	construir() {
		this.raiz.innerHTML = `
			<div class="caja" part="caja">
				<input class="entrada" part="entrada" inputmode="numeric" autocomplete="off" spellcheck="false">
				<button class="mando" part="abrir" type="button" tabindex="-1" aria-label="Abrir el calendario">${icono("calendario")}</button>
			</div>
			<div class="panel" part="calendario" role="dialog" aria-label="Calendario">
				<div class="cabecera">
					<button class="mando" type="button" data-meses="-12" aria-label="Año anterior">${icono("antes")}</button>
					<button class="mando" type="button" data-meses="-1" aria-label="Mes anterior">${icono("izquierda")}</button>
					<strong class="titulo" id="titulo" aria-live="polite"></strong>
					<button class="mando" type="button" data-meses="1" aria-label="Mes siguiente">${icono("derecha")}</button>
					<button class="mando" type="button" data-meses="12" aria-label="Año siguiente">${icono("despues")}</button>
				</div>
				<div class="dias-semana" aria-hidden="true"></div>
				<div class="rejilla" role="grid" aria-labelledby="titulo">
					<span class="gota" aria-hidden="true" hidden></span>
				</div>
			</div>`;
		this.caja = this.raiz.querySelector(".caja");
		this.entrada = this.raiz.querySelector("input");
		this.botonAbrir = this.raiz.querySelector("[part=abrir]");
		this.panel = this.raiz.querySelector(".panel");
		this.titulo = this.raiz.querySelector(".titulo");
		this.rejilla = this.raiz.querySelector(".rejilla");
		this.gota = this.raiz.querySelector(".gota");
		this.flotante = new PanelFlotante(this, this.panel, this.caja, () => this.alCerrarPanel(), { anchoDelAncla: false });
		this.vista = { anio: 0, mes: 0 };

		const semana = this.raiz.querySelector(".dias-semana");
		for (let dia = 0; dia < 7; dia++) {
			// El 5 de enero de 2026 fue lunes
			const texto = new Date(2026, 0, 5 + dia).toLocaleDateString(this.locale, { weekday: "narrow" });
			semana.append(Object.assign(crear("span"), { textContent: texto }));
		}

		this.aislarEventos(this.entrada);
		this.enviarConEnter(this.entrada);
		this.entrada.addEventListener("input", () => this.escribir());
		this.entrada.addEventListener("blur", () => this.alSalirDelTexto());
		this.entrada.addEventListener("keydown", (evento) => {
			if (evento.key === "ArrowDown" && !this.readonly) {
				evento.preventDefault();
				this.abrir(true);
			}
		});
		this.botonAbrir.addEventListener("mousedown", (evento) => evento.preventDefault());
		this.botonAbrir.addEventListener("click", () => {
			if (this.estaAbierto) { this.cerrar(); } else { this.abrir(); }
		});
		this.panel.addEventListener("mousedown", (evento) => evento.preventDefault());
		this.panel.addEventListener("click", (evento) => this.pulsar(evento));
		this.panel.addEventListener("keydown", (evento) => this.teclado(evento));
		this.addEventListener("click", (evento) => {
			if (evento.composedPath()[0] === this) { this.entrada.focus(); }
		});
	}

	controlEtiquetado() { return this.entrada; }

	textoVisible() {
		const fecha = this.valorFecha;
		return fecha ? fecha.toLocaleDateString(this.locale, { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
	}

	escribir() {
		const iso = GotaFecha.interpretar(this.entrada.value);
		const anterior = this.valorActual;
		this.textoInvalido = iso === null;
		this.valorEditado = true;
		this.valorActual = iso ?? "";
		this.volcarAlFormulario();
		this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		if (anterior !== this.valorActual) { this.emitir("gota-cambio", { valor: this.valorActual, anterior, origen: "teclado" }); }
	}

	alSalirDelTexto() {
		if (!this.textoInvalido) { this.entrada.value = this.textoVisible(); }
		this.dispatchEvent(new Event("change", { bubbles: true }));
	}

	actualizar() {
		this.entrada.disabled = this.bloqueado;
		this.entrada.readOnly = this.readonly;
		this.entrada.placeholder = this.placeholder;
		this.botonAbrir.disabled = this.bloqueado;
		this.botonAbrir.hidden = this.readonly;
		if (!this.textoInvalido && this.shadowRoot.activeElement !== this.entrada) { this.entrada.value = this.textoVisible(); }
		if (this.estaAbierto) { this.pintarMes(); }
	}

	validar() {
		if (this.textoInvalido) { return { badInput: true, mensaje: "Escribe una fecha como 15/03/2026." }; }
		if (!this.value) { return super.validar(); }
		if (this.min && this.value < this.min) { return { rangeUnderflow: true, mensaje: `La fecha no puede ser anterior a ${this.min}.` }; }
		if (this.max && this.value > this.max) { return { rangeOverflow: true, mensaje: `La fecha no puede ser posterior a ${this.max}.` }; }
		return null;
	}

	abrir(llevarFoco = false) {
		if (this.estaAbierto || this.bloqueado || this.readonly) { return; }
		const base = this.valorFecha || new Date();
		this.vista = { anio: base.getFullYear(), mes: base.getMonth() };
		this.enfocado = GotaFecha.iso(base);

		this.flotante.abrir(() => {
			this.gota.posicion = null;
			this.pintarMes();
		});
		if (llevarFoco) { this.diaEnfocado()?.focus(); }
		this.emitir("gota-abrir");
	}

	cerrar() {
		clearTimeout(this.esperaCierre);
		this.flotante?.cerrar();
	}

	alCerrarPanel() {
		this.emitir("gota-cerrar");
	}

	pulsar(evento) {
		const objetivo = evento.target.closest("button");
		if (!objetivo) { return; }
		if (objetivo.dataset.meses) {
			this.cambiarMes(Number(objetivo.dataset.meses));
		} else if (objetivo.dataset.dia && !objetivo.disabled) {
			this.elegirDia(objetivo.dataset.dia, "puntero");
		}
	}

	cambiarMes(meses) {
		const nueva = new Date(this.vista.anio, this.vista.mes + meses, 1);
		this.irAMes(nueva.getFullYear(), nueva.getMonth() + 1);
	}

	irAMes(anio, mes) {
		this.vista = { anio, mes: mes - 1 };
		this.gota.posicion = null;
		if (this.estaAbierto) { this.pintarMes(); }
		this.emitir("gota-mes", { anio, mes });
	}

	elegirDia(iso, origen) {
		this.cambiarPorUsuario(iso, origen);
		this.textoInvalido = false;
		this.entrada.value = this.textoVisible();
		this.volcarAlFormulario();
		// La espera deja ver cómo llega la gota al día elegido antes de cerrar
		clearTimeout(this.esperaCierre);
		this.esperaCierre = setTimeout(() => {
			this.cerrar();
			this.entrada.focus();
		}, sinMovimiento() ? 0 : 300);
	}

	hoy() { this.cambiarPorUsuario(GotaFecha.iso(new Date()), "codigo"); }

	diaEnfocado() {
		return this.rejilla.querySelector(`[data-dia="${this.enfocado}"]`) || this.rejilla.querySelector("[data-dia]:not(.otro)");
	}

	teclado(evento) {
		if (evento.key === "Escape") {
			evento.preventDefault();
			evento.stopPropagation();
			this.cerrar();
			this.entrada.focus();
			return;
		}
		const actual = evento.target.closest?.("[data-dia]");
		if (!actual) { return; }

		const fecha = GotaFecha.aFecha(actual.dataset.dia);
		const movimientos = {
			ArrowLeft: () => fecha.setDate(fecha.getDate() - 1),
			ArrowRight: () => fecha.setDate(fecha.getDate() + 1),
			ArrowUp: () => fecha.setDate(fecha.getDate() - 7),
			ArrowDown: () => fecha.setDate(fecha.getDate() + 7),
			Home: () => fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7)),
			End: () => fecha.setDate(fecha.getDate() + (6 - ((fecha.getDay() + 6) % 7))),
			PageUp: () => fecha.setMonth(fecha.getMonth() - 1),
			PageDown: () => fecha.setMonth(fecha.getMonth() + 1)
		};
		if (!movimientos[evento.key]) { return; }

		evento.preventDefault();
		movimientos[evento.key]();
		this.enfocado = GotaFecha.iso(fecha);
		if (fecha.getFullYear() !== this.vista.anio || fecha.getMonth() !== this.vista.mes) {
			this.irAMes(fecha.getFullYear(), fecha.getMonth() + 1);
		} else {
			this.marcarEnfocado();
		}
		this.diaEnfocado()?.focus();
	}

	marcarEnfocado() {
		this.rejilla.querySelectorAll("[data-dia]").forEach((dia) => {
			dia.tabIndex = dia.dataset.dia === this.enfocado ? 0 : -1;
		});
	}

	pintarMes() {
		const { anio, mes } = this.vista;
		const primero = new Date(anio, mes, 1);
		const hueco = (primero.getDay() + 6) % 7; // semana de lunes a domingo
		const hoy = GotaFecha.iso(new Date());

		this.titulo.textContent = primero.toLocaleDateString(this.locale, { month: "long", year: "numeric" });
		this.rejilla.querySelectorAll("[role=row]").forEach((semana) => semana.remove());

		// Seis semanas: role="grid" > row > gridcell, como pide el patrón de calendario de ARIA.
		// Las filas usan display:contents para que los días sigan en la rejilla de 7 columnas.
		let semana;
		for (let i = 0; i < 42; i++) {
			if (i % 7 === 0) {
				semana = crear("div", "semana", { role: "row" });
				this.rejilla.append(semana);
			}
			const fecha = new Date(anio, mes, 1 - hueco + i);
			const iso = GotaFecha.iso(fecha);
			const boton = crear("button", "dia", { type: "button", part: "dia", tabindex: "-1", role: "gridcell" });
			const fueraDeRango = (this.min && iso < this.min) || (this.max && iso > this.max);

			boton.dataset.dia = iso;
			boton.textContent = fecha.getDate();
			boton.setAttribute("aria-label", fecha.toLocaleDateString(this.locale, { dateStyle: "full" }));
			boton.setAttribute("aria-selected", String(iso === this.value));
			boton.disabled = Boolean(fueraDeRango);
			boton.classList.toggle("otro", fecha.getMonth() !== mes);
			boton.classList.toggle("hoy", iso === hoy);
			boton.classList.toggle("elegido", iso === this.value);
			semana.append(boton);
		}

		this.marcarEnfocado();
		const elegido = this.rejilla.querySelector(".elegido");
		if (elegido) {
			moverGota(this.gota, elegido);
		} else {
			this.gota.hidden = true;
			this.gota.posicion = null;
		}
		if (this.estaAbierto) { this.flotante.colocar(); }
	}

	static estilos = `
		:host{display:block;}
		.entrada{padding-right:2px;}
		.mando[hidden]{display:none;}
		.panel{width:296px;padding:10px;}
		.panel:not(:popover-open){display:none;}
		.cabecera{display:flex;align-items:center;gap:2px;margin-bottom:8px;}
		.cabecera .mando{width:26px;height:30px;border-radius:50%;}
		.titulo{flex:1;text-align:center;font-family:var(--_fuente-titulo);font-style:italic;font-weight:600;font-size:1.05em;white-space:nowrap;}
		.titulo::first-letter{text-transform:uppercase;}
		.dias-semana,.rejilla{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
		.dias-semana span{display:grid;place-items:center;height:26px;font-size:.8em;color:var(--_tinta-suave);}
		.rejilla{position:relative;}
		.semana{display:contents;}
		.gota{border-radius:50%;}
		.dia{
			position:relative;z-index:1;
			aspect-ratio:1;display:grid;place-items:center;padding:0;
			border:0;border-radius:50%;background:none;
			font-variant-numeric:tabular-nums;
			transition:background .15s,color .15s;
		}
		.dia.otro{color:var(--_tinta-suave);font-weight:300;}
		.dia.hoy{box-shadow:inset 0 0 0 1px var(--_tinta-suave);}
		.dia.elegido{color:var(--_sobre-acento);font-weight:700;opacity:1;}
		.dia:disabled{opacity:.25;cursor:not-allowed;}
		.dia:focus-visible{outline:2px solid var(--_acento);outline-offset:1px;}
		@media (hover:hover){.dia:hover:not(:disabled,.elegido){background:var(--_boton-hover);}}
	`;
}
