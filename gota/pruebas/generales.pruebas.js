/* Pruebas que recorren los metadatos: se aplican a todos los componentes sin repetir código */
(() => {
	const { afirmar, grupo, prueba, montar } = arnes;
	const componentes = gota.manifiesto();

	const crear = (etiqueta) => {
		const elemento = document.createElement(etiqueta);
		document.getElementById("zona").append(elemento);
		return elemento;
	};

	componentes.forEach((componente) => {
		grupo(`<${componente.etiqueta}> · contrato general`, () => {
			prueba("está registrado como elemento personalizado", () => {
				afirmar.cierto(customElements.get(componente.etiqueta), "No está registrado.");
			});

			prueba("tiene descripción, ejemplo y todas las propiedades documentadas", () => {
				afirmar.cierto(componente.descripcion.length > 20, "Sin descripción.");
				afirmar.cierto(componente.ejemplo.includes(`<${componente.etiqueta}`), "El ejemplo no usa el componente.");
				componente.propiedades.forEach((p) => afirmar.cierto(p.descripcion, `Falta la descripción de ${p.nombre}.`));
				componente.eventos.forEach((e) => afirmar.cierto(e.descripcion, `Falta la descripción de ${e.nombre}.`));
			});

			prueba("el ejemplo de la documentación funciona", () => {
				const elemento = montar(componente.ejemplo);
				afirmar.igual(elemento.tagName.toLowerCase(), componente.etiqueta);
				afirmar.cierto(elemento.shadowRoot, "Sin Shadow DOM.");
			});

			componente.propiedades.forEach((propiedad) => {
				prueba(`la propiedad ${propiedad.nombre} empieza en su valor por defecto`, () => {
					const elemento = crear(componente.etiqueta);
					afirmar.parecido(elemento[propiedad.nombre], propiedad.defecto, `${propiedad.nombre}:`);
				});

				if (!propiedad.atributo || propiedad.nombre === "value" || propiedad.nombre === "checked") { return; }

				prueba(`el atributo ${propiedad.atributo} y la propiedad ${propiedad.nombre} están enlazados`, () => {
					const elemento = crear(componente.etiqueta);
					const ejemplo = propiedad.tipo === "Boolean" ? true : (propiedad.tipo === "Number" ? 7 : (propiedad.opciones?.[1] ?? "1"));

					elemento[propiedad.nombre] = ejemplo;
					if (propiedad.tipo === "Boolean") {
						afirmar.cierto(elemento.hasAttribute(propiedad.atributo), "La propiedad no pasa al atributo.");
					} else {
						afirmar.igual(elemento.getAttribute(propiedad.atributo), String(ejemplo));
					}

					const otro = crear(componente.etiqueta);
					otro.setAttribute(propiedad.atributo, propiedad.tipo === "Boolean" ? "" : String(ejemplo));
					afirmar.igual(otro[propiedad.nombre], ejemplo, "El atributo no pasa a la propiedad.");
				});
			});

			componente.metodos.forEach(({ firma }) => {
				const nombre = firma.split("(")[0];
				prueba(`el método documentado ${nombre}() existe`, () => {
					afirmar.igual(typeof crear(componente.etiqueta)[nombre], "function");
				});
			});

			prueba("se puede quitar y volver a poner en la página sin romperse", () => {
				const elemento = crear(componente.etiqueta);
				const padre = elemento.parentElement;
				elemento.remove();
				padre.append(elemento);
				afirmar.cierto(elemento.shadowRoot.childElementCount > 0, "El Shadow DOM se ha vaciado.");
				afirmar.igual(elemento.shadowRoot.querySelectorAll(".gota").length <= 1, true, "Se ha duplicado el contenido.");
			});

			prueba("los estilos no salen del componente ni entran los de la página", () => {
				const estilo = document.createElement("style");
				estilo.textContent = "input,button{display:none!important}";
				document.head.append(estilo);
				const elemento = crear(componente.etiqueta);
				const interno = elemento.shadowRoot.querySelector("input,button");
				if (interno) { afirmar.falso(getComputedStyle(interno).display === "none", "El CSS de fuera ha entrado."); }
				estilo.remove();
			});
		});
	});

	grupo("Librería", () => {
		prueba("expone la versión", () => afirmar.cierto(/^\d+\.\d+\.\d+$/.test(gota.VERSION), `Versión: ${gota.VERSION}`));
		prueba("definir() dos veces no lanza error", () => gota.GotaCampo.definir());
		prueba("registra los nueve componentes", () => afirmar.igual(componentes.length, 9));
		prueba("el ejemplo del LEEME para crear un componente nuevo funciona", () => {
			class MiEstrella extends gota.GotaElemento {
				static etiqueta = "mi-estrella";
				static descripcion = "Una puntuación de 1 a 5.";
				static propiedades = { puntos: { tipo: Number, defecto: 3, descripcion: "Puntos de 1 a 5." } };
				construir() { this.raiz.innerHTML = "<output></output>"; }
				actualizar() { this.raiz.querySelector("output").textContent = "★".repeat(this.puntos); }
			}
			MiEstrella.definir();
			const estrella = montar("<mi-estrella></mi-estrella>");
			afirmar.igual(estrella.shadowRoot.querySelector("output").textContent, "★★★");
			estrella.puntos = 5;
			afirmar.igual(estrella.shadowRoot.querySelector("output").textContent, "★★★★★");
		});
	});
})();
