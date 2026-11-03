/* <gota-interruptor>: sí o no */
class GotaInterruptor extends GotaControl {
	static etiqueta = "gota-interruptor";
	static descripcion = "Interruptor para valores de sí o no. La gota cruza el canal y se estira al hacerlo. Se usa igual que una casilla: propiedad checked y evento change.";
	static ejemplo = '<gota-interruptor name="activo" checked></gota-interruptor>';
	static partes = { canal: "El canal por el que corre la gota." };

	static propiedades = {
		checked: { tipo: Boolean, atributo: "checked", defecto: false, descripcion: "Activado. El atributo es el estado inicial, al que vuelve con reset(); la propiedad es el estado actual." },
		value: { tipo: String, defecto: "on", descripcion: "Valor que se envía cuando está activado." }
	};

	static eventos = {
		"gota-cambio": { detalle: "{ valor, anterior, origen }", tipoDetalle: '{ valor: boolean; anterior: boolean; origen: "teclado" | "puntero" | "codigo" }', descripcion: "Cambio con datos. valor es true o false; origen es teclado, puntero o codigo." }
	};

	static metodos = { "alternar()": "Cambia de estado sin lanzar eventos." };

	get type() { return "checkbox"; }

	get checked() { return Boolean(this.marcado); }

	set checked(valor) {
		this.marcado = Boolean(valor);
		this.valorEditado = true;
		if (this.construido) { this.actualizar("checked"); }
		this.volcarAlFormulario();
	}

	get value() { return this.getAttribute("value") ?? "on"; }
	set value(valor) { this.setAttribute("value", valor); }

	connectedCallback() {
		if (!this.construido && !this.valorEditado) {
			this.marcado = this.hasAttribute("checked");
			this.recuperar();
		}
		super.connectedCallback();
	}

	attributeChangedCallback(nombre, anterior, actual) {
		if (nombre === "checked" && !this.valorEditado) { this.marcado = actual !== null; }
		super.attributeChangedCallback(nombre, anterior, actual);
	}

	/** El valor de un interruptor no cambia al usarlo: lo que se recuerda es checked */
	recuperar() {
		if (!this.persistir) { return; }
		try {
			const guardado = localStorage.getItem(`gota:${this.persistir}`);
			if (guardado !== null) {
				this.marcado = guardado === "true";
				this.valorEditado = true;
			}
		} catch (error) { /* almacenamiento bloqueado */ }
	}

	textoAGuardar() { return String(this.checked); }

	construir() {
		this.raiz.innerHTML = `
			<button class="canal" part="canal" type="button" role="switch" aria-checked="false">
				<span class="hueco inicio"></span>
				<span class="hueco final"></span>
				<span class="gota"></span>
			</button>`;
		this.canal = this.raiz.querySelector("button");
		this.gota = this.raiz.querySelector(".gota");
		this.inicio = this.raiz.querySelector(".inicio");
		this.final = this.raiz.querySelector(".final");

		this.canal.addEventListener("click", (evento) => {
			this.alternarUsuario(evento.detail === 0 ? "teclado" : "puntero");
		});
		// El clic que reenvía el <label> llega al propio componente
		this.addEventListener("click", (evento) => {
			if (evento.composedPath()[0] === this) { this.canal.click(); }
		});
		vigilarTamano(this.canal, () => this.colocar(false));
	}

	controlEtiquetado() { return this.canal; }

	alternarUsuario(origen) {
		if (this.bloqueado || this.readonly) { return; }
		const anterior = this.checked;
		this.checked = !anterior;
		this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		this.dispatchEvent(new Event("change", { bubbles: true }));
		this.emitir("gota-cambio", { valor: this.checked, anterior, origen });
	}

	alternar() { this.checked = !this.checked; }

	limpiar() { this.checked = false; }

	formResetCallback() {
		this.valorEditado = false;
		this.marcado = this.hasAttribute("checked");
		this.actualizar("checked");
		this.volcarAlFormulario();
	}

	formStateRestoreCallback(estado) {
		this.checked = estado !== null;
	}

	actualizar() {
		this.canal.setAttribute("aria-checked", String(this.checked));
		this.canal.disabled = this.bloqueado;
		this.canal.setAttribute("aria-readonly", String(this.readonly));
		this.colocar(true);
	}

	colocar(animar) {
		moverGota(this.gota, this.checked ? this.final : this.inicio, { animar });
	}

	valorDeFormulario() { return this.checked ? this.value : null; }

	validar() {
		return this.required && !this.checked ? { valueMissing: true, mensaje: "Hay que activar esta opción." } : null;
	}

	static estilos = `
		:host{display:inline-block;vertical-align:middle;line-height:0;}
		.canal{
			position:relative;display:block;
			width:46px;height:26px;padding:0;
			border:0;border-radius:999px;
			background:var(--_campo);
			box-shadow:var(--_sombra-campo),inset 0 0 0 1px var(--_linea);
			transition:background .25s;
		}
		.canal[aria-checked="true"]{background:var(--_acento-suave);}
		.canal:focus-visible{outline:2px solid var(--_acento);outline-offset:3px;}
		.canal:disabled{opacity:.45;cursor:not-allowed;}
		:host([readonly]) .canal{cursor:default;opacity:.7;}
		.hueco{position:absolute;top:3px;width:20px;height:20px;}
		.inicio{left:3px;}
		.final{right:3px;}
		.canal[aria-checked="false"] .gota{
			background:radial-gradient(70% 55% at 50% 108%,color-mix(in oklab,white 34%,transparent),transparent 72%),var(--_tinta-suave);
			box-shadow:inset 0 1px 1px color-mix(in oklab,white 40%,transparent);
		}
	`;
}
