/**
 * Banco de pruebas de gota: enseña cada componente en vivo.
 * Los mandos, la lista de eventos y la referencia se generan con gota.manifiesto(),
 * y los propios mandos son componentes de la librería.
 */
(() => {
	"use strict";

	/** Lo que necesita cada componente para que la demostración tenga contenido real */
	const ESCENAS = {
		"gota-campo": { atributos: { type: "email", placeholder: "nombre@ejemplo.com" } },
		"gota-cantidad": { atributos: { formato: "moneda", min: "0", step: "0.01", value: "749.99" } },
		"gota-selector": {
			preparar: (elemento) => {
				elemento.opciones = [
					{ valor: "Informática", texto: "Informática", tono: 200 },
					{ valor: "Periféricos", texto: "Periféricos", tono: 265 },
					{ valor: "Telefonía", texto: "Telefonía", tono: 335 },
					{ valor: "Oficina", texto: "Oficina", tono: 38 },
					{ valor: "Almacenamiento", texto: "Almacenamiento", tono: 170 }
				];
			}
		},
		"gota-fecha": { atributos: { value: "2026-11-09" } },
		"gota-interruptor": { atributos: { checked: "" } },
		"gota-clave": {
			atributos: { medidor: "" },
			preparar: (elemento) => {
				const entrada = document.createElement("input");
				entrada.type = "password";
				entrada.autocomplete = "new-password";
				entrada.setAttribute("aria-label", "Contraseña");
				elemento.append(entrada);
			}
		},
		"gota-filtros": {
			atributos: { etiqueta: "Tipo de cliente" },
			preparar: (elemento) => {
				elemento.opciones = [
					{ valor: "", texto: "Todos", cantidad: 10 },
					{ valor: "Particular", texto: "Particular", cantidad: 2, tono: 265 },
					{ valor: "Autónomo", texto: "Autónomo", cantidad: 3, tono: 335 },
					{ valor: "Empresa", texto: "Empresa", cantidad: 4, tono: 200 }
				];
			}
		},
		"gota-paginador": { atributos: { pagina: "5", paginas: "12" } },
		"gota-nivel": { atributos: { value: "18", max: "60", minimo: "5", unidad: "uds.", vertical: "" } }
	};

	/** Argumentos de ejemplo para probar los métodos que los necesitan */
	const ARGUMENTOS = {
		elegir: ["Telefonía"],
		ajustar: [-5],
		ir: [3],
		irAMes: [2027, 1],
		setCustomValidity: ["Ya existe"],
		actualizarCantidades: [{ "": 99 }]
	};

	const SIN_MANDO = new Set(["name", "persistir", "locale", "moneda"]);

	const nuevo = (etiqueta, clase = "", texto = "") => {
		const elemento = document.createElement(etiqueta);
		if (clase) { elemento.className = clase; }
		if (texto) { elemento.textContent = texto; }
		return elemento;
	};

	class Banco {
		constructor(contenedor) {
			this.contenedor = contenedor;
			this.componentes = window.gota.manifiesto();
			this.raiz = nuevo("div", "banco");
		}

		montar() {
			const selector = document.createElement("gota-filtros");
			selector.etiqueta = "Componente";
			selector.opciones = this.componentes.map((c) => ({ valor: c.etiqueta, texto: c.etiqueta.replace("gota-", "") }));
			selector.value = this.componentes[0].etiqueta;
			selector.addEventListener("change", () => this.ver(selector.value));

			this.zona = nuevo("div", "banco-zona");
			this.raiz.append(selector, this.zona);
			this.contenedor.append(this.raiz);
			this.ver(selector.value);
		}

		ver(etiqueta) {
			this.datos = this.componentes.find((c) => c.etiqueta === etiqueta);
			this.zona.innerHTML = "";

			const descripcion = nuevo("p", "banco-descripcion", this.datos.descripcion);
			const escena = nuevo("div", "banco-escena");
			const mandos = nuevo("form", "banco-mandos");
			const codigo = nuevo("pre", "banco-codigo");
			const registro = nuevo("ol", "banco-eventos");
			registro.setAttribute("aria-live", "polite");

			this.codigo = codigo;
			this.registro = registro;
			this.pieza = this.crearPieza(etiqueta);
			escena.append(this.pieza);
			mandos.addEventListener("submit", (evento) => evento.preventDefault());
			this.pintarMandos(mandos);

			const columnaIzquierda = nuevo("div", "banco-izquierda");
			columnaIzquierda.append(escena, this.bloque("HTML de este estado", codigo));

			const columnaDerecha = nuevo("div", "banco-derecha");
			columnaDerecha.append(this.bloque("Propiedades", mandos), this.bloque("Métodos", this.pintarMetodos()), this.bloque("Eventos recibidos", registro));

			const mesa = nuevo("div", "banco-mesa");
			mesa.append(columnaIzquierda, columnaDerecha);
			this.zona.append(descripcion, mesa, this.pintarReferencia());
			this.actualizarCodigo();
			this.apuntar("Pruébalo: aquí aparece cada evento que lanza.", null, true);
		}

		bloque(titulo, contenido) {
			const seccion = nuevo("section", "banco-bloque");
			seccion.append(nuevo("h3", "", titulo), contenido);
			return seccion;
		}

		crearPieza(etiqueta) {
			const escena = ESCENAS[etiqueta] || {};
			const pieza = document.createElement(etiqueta);
			Object.entries(escena.atributos || {}).forEach(([nombre, valor]) => pieza.setAttribute(nombre, valor));
			pieza.setAttribute("aria-label", "Componente de prueba");
			escena.preparar?.(pieza);

			this.datos.eventos.forEach(({ nombre }) => {
				pieza.addEventListener(nombre, (evento) => {
					this.apuntar(nombre, evento.detail);
					this.refrescar();
				});
			});
			return pieza;
		}

		apuntar(nombre, detalle, pista = false) {
			const fila = nuevo("li", pista ? "pista" : "");
			if (pista) {
				fila.textContent = nombre;
			} else {
				this.registro.querySelector(".pista")?.remove();
				const hora = new Date().toLocaleTimeString("es-ES");
				fila.append(nuevo("time", "", hora), nuevo("strong", "", nombre));
				if (detalle && Object.keys(detalle).length) { fila.append(nuevo("code", "", JSON.stringify(detalle))); }
			}
			this.registro.prepend(fila);
			[...this.registro.children].slice(30).forEach((sobrante) => sobrante.remove());
		}

		actualizarCodigo() {
			const atributos = [...this.pieza.attributes]
				.filter((a) => a.name !== "aria-label")
				.map((a) => (a.value === "" ? ` ${a.name}` : ` ${a.name}="${a.value}"`))
				.join("");
			const interior = this.datos.etiqueta === "gota-clave" ? '\n  <input type="password">\n' : "";
			this.codigo.textContent = `<${this.datos.etiqueta}${atributos}>${interior}</${this.datos.etiqueta}>`;
		}

		/** Lo que cambia el usuario en el componente también se ve en los mandos y en el HTML */
		refrescar() {
			this.mandos.forEach(({ propiedad, control }) => {
				if (control.matches(":focus-within")) { return; }
				if (propiedad.tipo === "Boolean") { control.checked = this.pieza[propiedad.nombre]; } else { control.value = this.pieza[propiedad.nombre] ?? ""; }
			});
			this.actualizarCodigo();
		}

		pintarMandos(mandos) {
			this.mandos = [];
			this.datos.propiedades
				.filter((propiedad) => propiedad.atributo && !SIN_MANDO.has(propiedad.nombre))
				.forEach((propiedad) => {
					const etiqueta = nuevo("label", "banco-mando");
					const nombre = nuevo("span", "", propiedad.atributo);
					const control = this.crearMando(propiedad);
					nombre.title = propiedad.descripcion;

					etiqueta.classList.toggle("en-linea", propiedad.tipo === "Boolean");
					etiqueta.append(nombre, control);
					control.addEventListener("input", () => this.aplicar(propiedad, control));
					control.addEventListener("change", () => this.aplicar(propiedad, control));
					this.mandos.push({ propiedad, control });
					mandos.append(etiqueta);
				});
		}

		crearMando(propiedad) {
			const actual = this.pieza.getAttribute(propiedad.atributo);
			let control;

			if (propiedad.tipo === "Boolean") {
				control = document.createElement("gota-interruptor");
				control.checked = this.pieza.hasAttribute(propiedad.atributo);
			} else if (propiedad.opciones) {
				control = document.createElement("gota-selector");
				control.opciones = propiedad.opciones;
				control.required = true;
				control.value = actual ?? propiedad.defecto;
			} else if (propiedad.tipo === "Number") {
				control = document.createElement("gota-cantidad");
				control.step = "any";
				control.value = actual ?? propiedad.defecto ?? "";
			} else {
				control = document.createElement("gota-campo");
				control.sinMarca = true;
				control.value = actual ?? propiedad.defecto ?? "";
			}
			return control;
		}

		aplicar(propiedad, control) {
			if (propiedad.tipo === "Boolean") {
				this.pieza.toggleAttribute(propiedad.atributo, control.checked);
			} else if (propiedad.nombre === "value") {
				this.pieza.value = control.value;
				this.pieza.setAttribute("value", control.value);
			} else if (control.value === "") {
				this.pieza.removeAttribute(propiedad.atributo);
			} else {
				this.pieza.setAttribute(propiedad.atributo, control.value);
			}
			this.actualizarCodigo();
		}

		pintarMetodos() {
			const fila = nuevo("div", "banco-metodos");
			this.datos.metodos.forEach(({ firma, descripcion }) => {
				const nombre = firma.split("(")[0];
				const argumentos = ARGUMENTOS[nombre] || [];
				const boton = nuevo("button", "banco-metodo", `${nombre}(${argumentos.map((a) => JSON.stringify(a)).join(", ")})`);
				boton.type = "button";
				boton.title = descripcion;
				boton.addEventListener("click", () => {
					const resultado = this.pieza[nombre](...argumentos);
					if (resultado !== undefined) { this.apuntar(`${nombre}() → ${resultado}`); }
					this.refrescar();
				});
				fila.append(boton);
			});
			return fila;
		}

		pintarReferencia() {
			const detalles = nuevo("details", "banco-referencia");
			const tabla = nuevo("table");
			const cabecera = nuevo("tr");
			["Propiedad", "Atributo", "Tipo", "Por defecto", "Descripción"].forEach((texto) => cabecera.append(nuevo("th", "", texto)));
			tabla.append(cabecera);

			this.datos.propiedades.forEach((p) => {
				const fila = nuevo("tr");
				const defecto = p.defecto === null || p.defecto === "" ? "—" : JSON.stringify(p.defecto);
				[p.nombre, p.atributo || "—", p.tipo, defecto, p.descripcion].forEach((texto) => fila.append(nuevo("td", "", String(texto))));
				tabla.append(fila);
			});

			detalles.append(nuevo("summary", "", `Referencia de <${this.datos.etiqueta}>`), tabla);
			return detalles;
		}
	}

	window.gotaBanco = { montar: (contenedor) => new Banco(contenedor).montar() };
})();
