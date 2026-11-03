/* <gota-paginador>: moverse por las páginas de un listado */
class GotaPaginador extends GotaElemento {
	static etiqueta = "gota-paginador";
	static descripcion = "Paginación numerada que resume los saltos largos con puntos suspensivos. La gota marca la página actual.";
	static ejemplo = '<gota-paginador pagina="3" paginas="12"></gota-paginador>';
	static partes = { barra: "Contenedor.", pagina: "Botón de cada página.", flecha: "Botones de anterior y siguiente." };

	static propiedades = {
		pagina: { tipo: Number, defecto: 1, descripcion: "Página actual, desde 1." },
		paginas: { tipo: Number, defecto: 1, descripcion: "Total de páginas." },
		vecinas: { tipo: Number, defecto: 1, descripcion: "Páginas que se ven a cada lado de la actual." },
		etiqueta: { tipo: String, defecto: "Paginación", descripcion: "Nombre para los lectores de pantalla." }
	};

	static eventos = {
		"gota-pagina": { detalle: "{ pagina, anterior }", tipoDetalle: "{ pagina: number; anterior: number }", descripcion: "El usuario ha cambiado de página." }
	};

	static metodos = {
		"siguiente()": "Avanza una página y lanza el evento.",
		"anterior()": "Retrocede una página y lanza el evento.",
		"ir(pagina)": "Va a esa página, sin salir del rango, y lanza el evento."
	};

	static delegarFoco = false;

	/** Las páginas que se enseñan: 1 … 4 5 6 … 20 */
	static tramo(pagina, paginas, vecinas) {
		const salida = [];
		let ultima = 0;
		for (let n = 1; n <= paginas; n++) {
			if (n === 1 || n === paginas || Math.abs(n - pagina) <= vecinas) {
				if (n - ultima === 2) { salida.push(n - 1); } else if (n - ultima > 2) { salida.push("…"); }
				salida.push(n);
				ultima = n;
			}
		}
		return salida;
	}

	get actual() { return Math.min(Math.max(1, this.pagina), Math.max(1, this.paginas)); }

	construir() {
		this.raiz.innerHTML = `
			<nav class="barra" part="barra">
				<button class="flecha" part="flecha" type="button" data-paso="-1" aria-label="Página anterior">${icono("izquierda")}</button>
				<div class="numeros"><span class="gota" hidden></span></div>
				<button class="flecha" part="flecha" type="button" data-paso="1" aria-label="Página siguiente">${icono("derecha")}</button>
			</nav>`;
		this.barra = this.raiz.querySelector("nav");
		this.numeros = this.raiz.querySelector(".numeros");
		this.gota = this.raiz.querySelector(".gota");

		this.barra.addEventListener("click", (evento) => {
			const boton = evento.target.closest("button");
			if (!boton || boton.disabled) { return; }
			this.ir(boton.dataset.paso ? this.actual + Number(boton.dataset.paso) : Number(boton.dataset.pagina));
		});
		this.resize = vigilarTamano(this.numeros, () => this.colocar(false));
	}

	alConectar() { this.colocar(false); }

	actualizar() {
		const actual = this.actual;
		const paginas = Math.max(1, this.paginas);
		const tramo = GotaPaginador.tramo(actual, paginas, this.vecinas);
		const clave = tramo.join(",");

		this.barra.setAttribute("aria-label", this.etiqueta);
		this.barra.querySelector('[data-paso="-1"]').disabled = actual <= 1;
		this.barra.querySelector('[data-paso="1"]').disabled = actual >= paginas;

		if (clave !== this.claveTramo) {
			this.claveTramo = clave;
			this.numeros.querySelectorAll("button,.puntos").forEach((nodo) => nodo.remove());
			tramo.forEach((n) => {
				if (n === "…") {
					this.numeros.append(Object.assign(crear("span", "puntos", { "aria-hidden": "true" }), { textContent: "…" }));
					return;
				}
				const boton = crear("button", "numero", { type: "button", part: "pagina", "aria-label": `Página ${n}` });
				boton.dataset.pagina = n;
				boton.textContent = n;
				this.numeros.append(boton);
			});
		}

		this.numeros.querySelectorAll("button").forEach((boton) => {
			const esActual = Number(boton.dataset.pagina) === actual;
			boton.classList.toggle("actual", esActual);
			if (esActual) { boton.setAttribute("aria-current", "page"); } else { boton.removeAttribute("aria-current"); }
		});
		this.colocar(true);
	}

	colocar(animar) {
		moverGota(this.gota, this.numeros.querySelector(".actual"), { animar });
	}

	ir(pagina) {
		const destino = Math.min(Math.max(1, pagina), Math.max(1, this.paginas));
		const anterior = this.actual;
		if (destino === anterior) { return; }
		this.pagina = destino;
		this.emitir("gota-pagina", { pagina: destino, anterior });
	}

	siguiente() { this.ir(this.actual + 1); }
	anterior() { this.ir(this.actual - 1); }

	static estilos = `
		:host{display:inline-block;}
		.barra{display:flex;align-items:center;gap:2px;}
		.numeros{position:relative;display:flex;align-items:center;gap:2px;}
		.gota{border-radius:50%;}
		.numero,.flecha{
			position:relative;z-index:1;
			display:grid;place-items:center;
			min-width:32px;height:32px;padding:0;
			border:0;border-radius:50%;background:none;color:var(--_tinta-suave);
			font-variant-numeric:tabular-nums;
			transition:color .2s,background .15s;
		}
		.numero.actual{color:var(--_sobre-acento);font-weight:700;}
		.flecha:disabled{opacity:.3;cursor:default;}
		.puntos{min-width:20px;text-align:center;color:var(--_tinta-suave);}
		button:focus-visible{outline:2px solid var(--_acento);outline-offset:1px;}
		@media (hover:hover){
			.numero:hover:not(.actual),.flecha:hover:not(:disabled){background:var(--_boton-hover);color:var(--_tinta);}
		}
		@media (pointer:coarse){.numero,.flecha{min-width:44px;height:44px;}}
	`;
}
