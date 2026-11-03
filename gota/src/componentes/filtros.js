/* <gota-filtros>: elegir un filtro entre varios */
class GotaFiltros extends GotaElemento {
	static etiqueta = "gota-filtros";
	static descripcion = "Barra de filtros con una sola gota: al elegir otro, la gota viaja hasta él. Cada filtro puede llevar un punto de color y una cantidad.";
	static ejemplo = '<gota-filtros etiqueta="Tipo de cliente"></gota-filtros>';
	static partes = { barra: "Contenedor.", filtro: "Cada botón.", cantidad: "Número de cada filtro." };

	static propiedades = {
		value: { tipo: String, defecto: "", descripcion: "Valor del filtro elegido." },
		etiqueta: { tipo: String, defecto: "Filtros", descripcion: "Nombre del grupo para los lectores de pantalla." },
		opciones: { tipo: Array, atributo: false, defecto: [], descripcion: "Lista de { valor, texto, cantidad, tono }." }
	};

	static eventos = {
		change: { detalle: "—", descripcion: "El usuario ha elegido otro filtro." },
		"gota-cambio": { detalle: "{ valor, anterior, origen }", tipoDetalle: '{ valor: string; anterior: string; origen: "teclado" | "puntero" }', descripcion: "Cambio con datos. origen es teclado o puntero." }
	};

	static metodos = { "actualizarCantidades(cantidades)": "Cambia los números sin repintar. Recibe { valor: cantidad }." };

	get opciones() { return this.lista || []; }

	set opciones(lista) {
		this.lista = (lista || []).map((o) => (typeof o === "object" ? o : { valor: String(o), texto: String(o) }));
		this.reconstruir = true;
		if (this.construido) { this.actualizar(); }
	}

	static delegarFoco = false;

	construir() {
		this.raiz.innerHTML = `<div class="barra" part="barra" role="group"><span class="gota" hidden></span></div>`;
		this.barra = this.raiz.querySelector(".barra");
		this.gota = this.raiz.querySelector(".gota");
		this.reconstruir = true;

		this.barra.addEventListener("click", (evento) => {
			const boton = evento.target.closest("button");
			if (!boton) { return; }
			const anterior = this.value;
			if (boton.dataset.valor === anterior) { return; }
			this.value = boton.dataset.valor;
			this.dispatchEvent(new Event("change", { bubbles: true }));
			this.emitir("gota-cambio", { valor: this.value, anterior, origen: evento.detail === 0 ? "teclado" : "puntero" });
		});
		vigilarTamano(this.barra, () => this.colocar(false));
	}

	alConectar() { this.colocar(false); }

	pintarBotones() {
		this.barra.querySelectorAll("button").forEach((boton) => boton.remove());
		this.opciones.forEach((opcion) => {
			const boton = crear("button", "filtro", { type: "button", part: "filtro" });
			boton.dataset.valor = opcion.valor ?? "";
			if (opcion.tono !== null && opcion.tono !== undefined) {
				const punto = crear("span", "punto");
				punto.style.setProperty("--h", opcion.tono);
				boton.append(punto);
			}
			boton.append(Object.assign(crear("span", "texto"), { textContent: opcion.texto ?? opcion.valor }));
			if (opcion.cantidad !== null && opcion.cantidad !== undefined) {
				boton.append(Object.assign(crear("span", "cantidad", { part: "cantidad" }), { textContent: opcion.cantidad }));
			}
			this.barra.append(boton);
		});
		this.reconstruir = false;
	}

	actualizar() {
		this.barra.setAttribute("aria-label", this.etiqueta);
		if (this.reconstruir) { this.pintarBotones(); }
		this.barra.querySelectorAll("button").forEach((boton) => {
			boton.setAttribute("aria-pressed", String(boton.dataset.valor === this.value));
		});
		this.colocar(true);
	}

	colocar(animar) {
		const elegido = this.barra.querySelector('[aria-pressed="true"]');
		if (elegido) {
			moverGota(this.gota, elegido, { animar });
		} else {
			this.gota.hidden = true;
			this.gota.posicion = null;
		}
	}

	actualizarCantidades(cantidades) {
		this.barra.querySelectorAll("button").forEach((boton) => {
			const numero = boton.querySelector(".cantidad");
			if (numero && cantidades[boton.dataset.valor] !== undefined) { numero.textContent = cantidades[boton.dataset.valor]; }
		});
	}

	static estilos = `
		:host{display:block;}
		.barra{position:relative;display:flex;flex-wrap:wrap;gap:6px;}
		.filtro{
			position:relative;z-index:1;
			display:inline-flex;align-items:center;gap:7px;
			min-height:32px;padding:4px 7px 4px 13px;
			border:1px solid var(--_linea);border-radius:999px;
			background:var(--_boton);color:var(--_tinta-suave);
			transition:color .2s,background .2s,border-color .2s;
		}
		.filtro:not(:has(.cantidad)){padding-right:13px;}
		.filtro[aria-pressed="true"]{color:var(--_sobre-acento);background:none;border-color:transparent;font-weight:700;}
		.filtro:focus-visible{outline:2px solid var(--_acento);outline-offset:2px;}
		@media (hover:hover){.filtro:hover:not([aria-pressed="true"]){background:var(--_boton-hover);color:var(--_tinta);}}
		.filtro:active{transform:scale(.97);}
		.punto{width:7px;height:7px;border-radius:50%;background:hsl(var(--h),85%,62%);flex:none;}
		.cantidad{
			min-width:22px;padding:1px 6px;border-radius:999px;
			background:color-mix(in oklab,var(--_campo) 80%,transparent);color:var(--_tinta-suave);
			font-size:.85em;font-weight:400;text-align:center;font-variant-numeric:tabular-nums;
		}
		[aria-pressed="true"] .cantidad{background:color-mix(in oklab,white 26%,transparent);color:inherit;}
	`;
}
