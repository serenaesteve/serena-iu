/* <gota-selector>: lista desplegable en la que se puede escribir para filtrar */
class GotaSelector extends GotaControl {
	static etiqueta = "gota-selector";
	static descripcion = "Lista desplegable que se filtra escribiendo, sin distinguir acentos ni mayúsculas. Las opciones se dan con <option> o con la propiedad opciones.";
	static ejemplo = '<gota-selector name="categoria"><option>Informática</option><option>Telefonía</option></gota-selector>';
	static partes = { caja: "Marco del campo.", entrada: "El input interno.", flecha: "Botón de abrir.", lista: "Panel con las opciones.", opcion: "Cada opción." };

	static propiedades = {
		placeholder: { tipo: String, defecto: "Selecciona…", descripcion: "Texto cuando no hay nada elegido." },
		sinResultados: { tipo: String, defecto: "No hay coincidencias", descripcion: "Texto cuando el filtro no encuentra nada." },
		opciones: { tipo: Array, atributo: false, defecto: [], descripcion: "Lista de textos u objetos { valor, texto, tono, desactivada }." }
	};

	static eventos = {
		"gota-abrir": { detalle: "—", descripcion: "Se ha abierto la lista." },
		"gota-cerrar": { detalle: "—", descripcion: "Se ha cerrado la lista." }
	};

	static metodos = {
		"abrir()": "Abre la lista.",
		"cerrar()": "Cierra la lista.",
		"elegir(valor)": "Elige una opción como si la hubiera pulsado el usuario y lanza los eventos."
	};

	get type() { return "select-one"; }

	get opciones() { return this.listaOpciones || []; }

	set opciones(lista) {
		this.listaOpciones = (lista || []).map((o) => (typeof o === "object"
			? { valor: String(o.valor ?? o.value ?? ""), texto: o.texto ?? o.text ?? String(o.valor ?? o.value ?? ""), tono: o.tono ?? null, desactivada: Boolean(o.desactivada) }
			: { valor: String(o), texto: String(o), tono: null, desactivada: false }));
		if (this.construido) { this.actualizar("opciones"); }
		this.volcarAlFormulario();
	}

	/** Mismo nombre que select.options, para quien recorra las opciones igual que en un <select> */
	get options() { return this.opciones.map((o) => ({ value: o.valor, text: o.texto, disabled: o.desactivada })); }

	get estaAbierto() { return Boolean(this.flotante?.abierto); }

	connectedCallback() {
		if (!this.listaOpciones) {
			this.opciones = [...this.querySelectorAll("option")].map((o) => ({ valor: o.value, texto: o.textContent.trim(), desactivada: o.disabled }));
			const elegida = this.querySelector("option[selected]");
			if (elegida && !this.hasAttribute("value")) { this.setAttribute("value", elegida.value); }
		}
		super.connectedCallback();
	}

	alDesconectar() { this.flotante?.cerrar(); }

	construir() {
		this.raiz.innerHTML = `
			<div class="caja" part="caja">
				<input class="entrada" part="entrada" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="lista" autocomplete="off" spellcheck="false">
				<button class="mando" part="flecha" type="button" tabindex="-1" aria-label="Abrir la lista">${icono("abajo")}</button>
			</div>
			<div class="panel" part="lista" id="lista" role="listbox">
				<span class="gota" hidden></span>
				<div class="filas"></div>
			</div>`;
		this.caja = this.raiz.querySelector(".caja");
		this.entrada = this.raiz.querySelector("input");
		this.flecha = this.raiz.querySelector("[part=flecha]");
		this.panel = this.raiz.querySelector("#lista");
		this.gota = this.raiz.querySelector(".gota");
		this.filas = this.raiz.querySelector(".filas");
		this.indiceActivo = -1;
		this.visibles = [];
		this.flotante = new PanelFlotante(this, this.panel, this.caja, () => this.alCerrarPanel());

		this.aislarEventos(this.entrada);
		this.entrada.addEventListener("input", () => {
			this.abrir();
			this.pintarLista(this.entrada.value);
		});
		this.entrada.addEventListener("click", () => this.abrir());
		this.entrada.addEventListener("keydown", (evento) => this.teclado(evento));
		this.entrada.addEventListener("blur", () => {
			// Al pulsar una opción el foco no se mueve; si sale, se cierra y vuelve el texto elegido
			this.flotante.cerrar();
			this.mostrarElegida();
		});
		this.flecha.addEventListener("mousedown", (evento) => evento.preventDefault());
		this.flecha.addEventListener("click", () => {
			if (this.estaAbierto) { this.cerrar(); } else { this.abrir(); this.entrada.focus(); }
		});
		this.panel.addEventListener("mousedown", (evento) => evento.preventDefault());
		this.filas.addEventListener("click", (evento) => {
			const fila = evento.target.closest("[role=option]");
			if (fila && fila.getAttribute("aria-disabled") !== "true") {
				this.elegirUsuario(fila.dataset.valor, "puntero");
				this.entrada.focus();
			}
		});
		this.filas.addEventListener("pointermove", (evento) => {
			const fila = evento.target.closest("[role=option]");
			if (fila) { this.activar(this.visibles.indexOf(fila)); }
		});
		// Un clic en el <label> del campo enfoca, no abre: igual que un <select> nativo
		this.addEventListener("click", (evento) => {
			if (evento.composedPath()[0] === this) { this.entrada.focus(); }
		});
	}

	controlEtiquetado() { return this.entrada; }

	opcionElegida() { return this.opciones.find((o) => o.valor === this.value) || null; }

	mostrarElegida() {
		const elegida = this.opcionElegida();
		this.entrada.value = elegida ? elegida.texto : this.value;
	}

	actualizar() {
		this.entrada.disabled = this.bloqueado;
		this.entrada.readOnly = this.readonly;
		this.entrada.placeholder = this.placeholder;
		this.flecha.disabled = this.bloqueado || this.readonly;
		this.flecha.hidden = this.readonly;
		if (this.shadowRoot.activeElement !== this.entrada || !this.estaAbierto) { this.mostrarElegida(); }
		if (this.estaAbierto) { this.pintarLista(""); }
	}

	pintarLista(filtro) {
		const buscado = sinAcentos(filtro.trim());
		const elegida = this.opcionElegida();
		// Si el texto es el de la opción elegida aún no se está buscando: se ve la lista entera
		const sinFiltro = !buscado || buscado === sinAcentos(elegida?.texto);
		const candidatas = this.opciones.filter((o) => sinFiltro || sinAcentos(o.texto).includes(buscado));
		const conVacia = !this.required && !buscado;

		this.filas.textContent = "";
		this.visibles = [];

		if (conVacia) { candidatas.unshift({ valor: "", texto: this.placeholder, vacia: true }); }

		candidatas.forEach((opcion, indice) => {
			const fila = crear("div", `fila${opcion.vacia ? " vacia" : ""}`, { role: "option", part: "opcion", id: `op-${indice}` });
			fila.dataset.valor = opcion.valor;
			fila.setAttribute("aria-selected", String(opcion.valor === this.value));
			if (opcion.desactivada) { fila.setAttribute("aria-disabled", "true"); }
			if (opcion.tono !== null && opcion.tono !== undefined) {
				const punto = crear("span", "punto");
				punto.style.setProperty("--h", opcion.tono);
				fila.append(punto);
			}
			fila.append(opcion.texto);
			this.filas.append(fila);
			this.visibles.push(fila);
		});

		if (!candidatas.length) {
			const nada = crear("div", "nada");
			nada.textContent = this.sinResultados;
			this.filas.append(nada);
		}

		const posicion = candidatas.findIndex((o) => o.valor === this.value);
		this.gota.posicion = null;
		this.activar(sinFiltro && posicion > -1 ? posicion : (candidatas.length ? 0 : -1), false);
		if (this.estaAbierto) { this.flotante.colocar(); }
	}

	activar(indice, animar = true) {
		if (indice === this.indiceActivo && animar) { return; }
		this.visibles[this.indiceActivo]?.classList.remove("activa");
		this.indiceActivo = indice;
		const fila = this.visibles[indice];

		if (!fila) {
			this.gota.hidden = true;
			this.entrada.removeAttribute("aria-activedescendant");
			return;
		}
		fila.classList.add("activa");
		this.entrada.setAttribute("aria-activedescendant", fila.id);
		if (fila.offsetTop < this.panel.scrollTop) { this.panel.scrollTop = fila.offsetTop; }
		if (fila.offsetTop + fila.offsetHeight > this.panel.scrollTop + this.panel.clientHeight) {
			this.panel.scrollTop = fila.offsetTop + fila.offsetHeight - this.panel.clientHeight;
		}
		moverGota(this.gota, fila, { animar });
	}

	teclado(evento) {
		if (this.readonly) { return; }

		if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
			evento.preventDefault();
			if (!this.estaAbierto) { this.abrir(); return; }
			const total = this.visibles.length;
			if (total) { this.activar((this.indiceActivo + (evento.key === "ArrowDown" ? 1 : -1) + total) % total); }
		} else if (evento.key === "Enter") {
			if (this.estaAbierto) {
				evento.preventDefault();
				const fila = this.visibles[this.indiceActivo];
				if (fila && fila.getAttribute("aria-disabled") !== "true") { this.elegirUsuario(fila.dataset.valor, "teclado"); }
			} else {
				this.form?.requestSubmit();
			}
		} else if (evento.key === "Escape" && this.estaAbierto) {
			// Si no se detiene aquí, la aplicación también lo recibiría y saldría del formulario
			evento.preventDefault();
			evento.stopPropagation();
			this.cerrar();
			this.mostrarElegida();
		}
	}

	abrir() {
		if (this.estaAbierto || this.bloqueado || this.readonly) { return; }
		this.flotante.abrir(() => this.pintarLista(""));
		this.entrada.setAttribute("aria-expanded", "true");
		this.emitir("gota-abrir");
	}

	cerrar() { this.flotante?.cerrar(); }

	alCerrarPanel() {
		this.entrada.setAttribute("aria-expanded", "false");
		this.gota.posicion = null;
		this.emitir("gota-cerrar");
	}

	elegirUsuario(valor, origen) {
		this.cambiarPorUsuario(valor, origen);
		this.mostrarElegida();
		this.cerrar();
	}

	elegir(valor) { this.elegirUsuario(valor, "codigo"); }

	static estilos = `
		:host{display:block;}
		.entrada{text-overflow:ellipsis;cursor:pointer;}
		.entrada:focus{cursor:text;}
		.mando[hidden]{display:none;}
		.panel{max-height:264px;overflow-y:auto;overscroll-behavior:contain;}
		.panel:not(:popover-open){display:none;}
		.filas{position:relative;z-index:1;}
		.gota{border-radius:calc(var(--_radio-panel) - 6px);}
		.fila{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:calc(var(--_radio-panel) - 6px);cursor:pointer;transition:color .15s;}
		.fila.activa{color:var(--_sobre-acento);}
		.fila.vacia{color:var(--_tinta-suave);}
		.fila.vacia.activa{color:var(--_sobre-acento);}
		.fila[aria-selected="true"]{font-weight:700;}
		.fila[aria-disabled="true"]{opacity:.45;cursor:not-allowed;}
		.punto{width:8px;height:8px;border-radius:50%;background:hsl(var(--h),80%,58%);flex:none;}
		.nada{padding:10px;color:var(--_tinta-suave);}
	`;
}
