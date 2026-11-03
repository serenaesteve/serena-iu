/* <gota-cantidad>: números y dinero con pasos */
class GotaCantidad extends GotaControl {
	static etiqueta = "gota-cantidad";
	static descripcion = "Número con botones de paso, teclado (flechas, Inicio, Fin, Re Pág, Av Pág), límites y formato de moneda. Acepta coma decimal.";
	static ejemplo = '<gota-cantidad name="precio" formato="moneda" min="0" step="0.01" value="749.99"></gota-cantidad>';
	static partes = { caja: "Marco del campo.", entrada: "El input interno.", menos: "Botón de restar.", mas: "Botón de sumar.", unidad: "Símbolo de la moneda o la unidad." };

	static propiedades = {
		min: { tipo: Number, defecto: null, descripcion: "Valor mínimo. Sin él no hay límite." },
		max: { tipo: Number, defecto: null, descripcion: "Valor máximo. Sin él no hay límite." },
		step: { tipo: String, defecto: "1", descripcion: "Tamaño del paso. Con «any» no comprueba múltiplos." },
		formato: { tipo: String, defecto: "numero", opciones: ["numero", "moneda"], descripcion: "Cómo se muestra el valor al salir del campo." },
		moneda: { tipo: String, defecto: "EUR", descripcion: "Código ISO de la moneda." },
		unidad: { tipo: String, defecto: "", descripcion: "Unidad junto al número, como «uds.»." },
		placeholder: { tipo: String, defecto: "", descripcion: "Texto de ayuda con el campo vacío." },
		locale: { tipo: String, defecto: "es-ES", descripcion: "Idioma del formato." }
	};

	static metodos = {
		"incrementar(veces = 1)": "Suma pasos sin salir de los límites.",
		"decrementar(veces = 1)": "Resta pasos sin salir de los límites.",
		"stepUp(veces = 1)": "Igual que incrementar: mismo nombre que el input nativo.",
		"stepDown(veces = 1)": "Igual que decrementar: mismo nombre que el input nativo.",
		"select()": "Selecciona el texto."
	};

	get type() { return "number"; }

	/** Valor como número, o NaN si está vacío (igual que valueAsNumber) */
	get valorNumerico() { return this.value === "" ? NaN : Number(this.value); }

	/** Convierte lo que se escribe: «1.234,5», «1234,5» y «1234.5» son lo mismo */
	static interpretar(texto) {
		let limpio = String(texto).trim().replace(/\s|€/g, "");
		if (limpio === "") { return ""; }
		if (limpio.includes(",")) { limpio = limpio.replace(/\./g, "").replace(",", "."); }
		return /^-?\d*\.?\d+$|^-?\d+\.$/.test(limpio) ? String(Number(limpio)) : null;
	}

	normalizar(valor) {
		this.textoInvalido = false;
		if (valor === null || valor === undefined || valor === "") { return ""; }
		return GotaCantidad.interpretar(valor) ?? "";
	}

	construir() {
		this.raiz.innerHTML = `
			<div class="caja" part="caja">
				<input class="entrada" part="entrada" inputmode="decimal" role="spinbutton" autocomplete="off">
				<button class="mando" part="menos" type="button" tabindex="-1" aria-hidden="true">${icono("menos")}</button>
				<span class="unidad" part="unidad"></span>
				<button class="mando" part="mas" type="button" tabindex="-1" aria-hidden="true">${icono("mas")}</button>
			</div>`;
		this.entrada = this.raiz.querySelector("input");
		this.unidadVisible = this.raiz.querySelector(".unidad");
		this.botonMenos = this.raiz.querySelector("[part=menos]");
		this.botonMas = this.raiz.querySelector("[part=mas]");
		this.editando = false;

		this.aislarEventos(this.entrada);
		this.enviarConEnter(this.entrada);
		this.entrada.addEventListener("focus", () => {
			this.editando = true;
			if (!this.textoInvalido) { this.entrada.value = this.value; }
		});
		this.entrada.addEventListener("blur", () => {
			this.editando = false;
			this.mostrarValor();
			this.dispatchEvent(new Event("change", { bubbles: true }));
		});
		this.entrada.addEventListener("input", () => this.escribir());
		this.entrada.addEventListener("keydown", (evento) => this.teclado(evento));
		this.activarPulsacion(this.botonMenos, -1);
		this.activarPulsacion(this.botonMas, 1);
	}

	controlEtiquetado() { return this.entrada; }

	escribir() {
		const numero = GotaCantidad.interpretar(this.entrada.value);
		const anterior = this.valorActual;
		this.textoInvalido = numero === null;
		this.valorEditado = true;
		this.valorActual = numero ?? "";
		this.actualizarAria();
		this.volcarAlFormulario();
		this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		if (anterior !== this.valorActual) { this.emitir("gota-cambio", { valor: this.valorActual, anterior, origen: "teclado" }); }
	}

	teclado(evento) {
		const acciones = {
			ArrowUp: () => this.pasoUsuario(1, "teclado"),
			ArrowDown: () => this.pasoUsuario(-1, "teclado"),
			PageUp: () => this.pasoUsuario(10, "teclado"),
			PageDown: () => this.pasoUsuario(-10, "teclado"),
			Home: () => { if (this.min !== null) { this.cambiarPorUsuario(this.min, "teclado", false); } },
			End: () => { if (this.max !== null) { this.cambiarPorUsuario(this.max, "teclado", false); } }
		};
		if (acciones[evento.key] && !this.readonly && !this.bloqueado) {
			evento.preventDefault();
			acciones[evento.key]();
		}
	}

	/** Mantener pulsado repite el paso, cada vez más seguido */
	activarPulsacion(boton, sentido) {
		let espera;
		const parar = () => {
			if (espera === undefined) { return; }
			clearTimeout(espera);
			espera = undefined;
			this.dispatchEvent(new Event("change", { bubbles: true }));
		};
		boton.addEventListener("pointerdown", (evento) => {
			evento.preventDefault();
			if (this.bloqueado || this.readonly) { return; }
			this.pasoUsuario(sentido, "puntero");
			const repetir = (ritmo) => {
				espera = setTimeout(() => {
					this.pasoUsuario(sentido, "puntero");
					repetir(Math.max(50, ritmo * .82));
				}, ritmo);
			};
			repetir(420);
			// En window: al llegar al límite el botón se desactiva y ya no recibiría el pointerup
			window.addEventListener("pointerup", parar, { once: true });
			window.addEventListener("pointercancel", parar, { once: true });
		});
		// click() sin puntero: lo que hacen los gestos con la mano y los lectores de pantalla
		boton.addEventListener("click", (evento) => {
			if (evento.detail === 0 && !this.bloqueado && !this.readonly) { this.pasoUsuario(sentido, "puntero", true); }
		});
	}

	get pasoNumerico() {
		const paso = Number(this.step);
		return this.step === "any" || !(paso > 0) ? 1 : paso;
	}

	/** Suma pasos respetando los límites y sin los errores de redondeo de la coma flotante */
	calcularPaso(veces) {
		const paso = this.pasoNumerico;
		const decimales = (String(paso).split(".")[1] || "").length;
		const base = this.value === "" ? (this.min ?? 0) - (veces > 0 ? paso : -paso) : Number(this.value);
		let nuevo = Number((base + paso * veces).toFixed(Math.max(decimales, 2)));
		if (this.min !== null) { nuevo = Math.max(this.min, nuevo); }
		if (this.max !== null) { nuevo = Math.min(this.max, nuevo); }
		return nuevo;
	}

	pasoUsuario(veces, origen, confirmar = false) {
		this.cambiarPorUsuario(this.calcularPaso(veces), origen, confirmar);
	}

	incrementar(veces = 1) { this.value = this.calcularPaso(veces); }
	decrementar(veces = 1) { this.value = this.calcularPaso(-veces); }
	stepUp(veces = 1) { this.incrementar(veces); }
	stepDown(veces = 1) { this.decrementar(veces); }
	select() { this.entrada?.select(); }

	textoFormateado() {
		if (this.value === "") { return ""; }
		const moneda = this.formato === "moneda";
		return Number(this.value).toLocaleString(this.locale, {
			minimumFractionDigits: moneda ? 2 : 0,
			maximumFractionDigits: moneda ? 2 : 6
		});
	}

	simboloMoneda() {
		try {
			const partes = new Intl.NumberFormat(this.locale, { style: "currency", currency: this.moneda }).formatToParts(0);
			return partes.find((parte) => parte.type === "currency")?.value || this.moneda;
		} catch (error) {
			return this.moneda;
		}
	}

	mostrarValor() {
		if (this.textoInvalido) { return; }
		const texto = this.editando ? this.value : this.textoFormateado();
		if (this.entrada.value !== texto && !(this.editando && GotaCantidad.interpretar(this.entrada.value) === this.value)) {
			this.entrada.value = texto;
		}
	}

	actualizar() {
		this.entrada.disabled = this.bloqueado;
		this.entrada.readOnly = this.readonly;
		this.entrada.placeholder = this.placeholder;
		this.botonMenos.hidden = this.readonly;
		this.botonMas.hidden = this.readonly;
		this.unidadVisible.textContent = this.formato === "moneda" ? this.simboloMoneda() : this.unidad;
		this.unidadVisible.hidden = !this.unidadVisible.textContent;
		this.mostrarValor();
		this.actualizarAria();
	}

	actualizarAria() {
		const e = this.entrada;
		const fijar = (nombre, valor) => (valor === null || valor === "" ? e.removeAttribute(nombre) : e.setAttribute(nombre, valor));
		fijar("aria-valuemin", this.min);
		fijar("aria-valuemax", this.max);
		fijar("aria-valuenow", this.value);
		fijar("aria-valuetext", this.value === "" ? "" : `${this.textoFormateado()} ${this.unidadVisible.textContent}`.trim());
		this.botonMenos.disabled = this.bloqueado || this.readonly || (this.min !== null && this.value !== "" && Number(this.value) <= this.min);
		this.botonMas.disabled = this.bloqueado || this.readonly || (this.max !== null && this.value !== "" && Number(this.value) >= this.max);
	}

	validar() {
		if (this.textoInvalido) { return { badInput: true, mensaje: "Escribe un número." }; }
		if (this.value === "") { return super.validar(); }

		const numero = Number(this.value);
		if (this.min !== null && numero < this.min) { return { rangeUnderflow: true, mensaje: `El valor mínimo es ${this.min}.` }; }
		if (this.max !== null && numero > this.max) { return { rangeOverflow: true, mensaje: `El valor máximo es ${this.max}.` }; }
		if (this.step !== "any") {
			const cociente = (numero - (this.min ?? 0)) / this.pasoNumerico;
			if (Math.abs(cociente - Math.round(cociente)) > 1e-7) { return { stepMismatch: true, mensaje: `Usa múltiplos de ${this.step}.` }; }
		}
		return null;
	}

	static estilos = `
		:host{display:block;}
		/* El input va primero en el HTML para que reciba el foco; visualmente, entre los botones */
		.entrada{order:1;text-align:center;font-variant-numeric:tabular-nums;padding:0 4px;}
		.unidad{order:2;}
		[part=mas]{order:3;}
		:host([readonly]) .entrada{text-align:left;padding-left:14px;}
		.unidad{display:flex;align-items:center;padding-right:2px;color:var(--_tinta-suave);font-size:.9em;}
		.unidad[hidden],.mando[hidden]{display:none;}
		.mando:disabled{opacity:.3;cursor:default;}
	`;
}
