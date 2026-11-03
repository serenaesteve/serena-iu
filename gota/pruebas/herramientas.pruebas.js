/* Los formatos para herramientas (custom-elements.json, gota.d.ts y gota.html-data.json) los genera
   construir.py; estas pruebas comprueban que dicen lo mismo que los componentes que se están probando. */
(() => {
	const { afirmar, grupo, prueba } = arnes;
	const componentes = gota.manifiesto();
	const carpeta = window.carpetaDist;

	const leer = async (archivo, comoTexto = false) => {
		const respuesta = await fetch(carpeta + archivo, { cache: "no-store" });
		afirmar.cierto(respuesta.ok, `No se encuentra ${archivo}: ejecuta construir.py.`);
		return comoTexto ? respuesta.text() : respuesta.json();
	};

	grupo("Formatos para herramientas", () => {
		prueba("custom-elements.json declara cada componente con sus atributos, eventos y partes", async () => {
			const datos = await leer("custom-elements.json");
			afirmar.igual(datos.schemaVersion, "2.1.0");
			const declaraciones = datos.modules[0].declarations;
			afirmar.parecido(declaraciones.map((d) => d.tagName), componentes.map((c) => c.etiqueta), "Etiquetas:");
			componentes.forEach((c, i) => {
				const d = declaraciones[i];
				afirmar.parecido(d.attributes.map((a) => a.name), c.propiedades.filter((p) => p.atributo).map((p) => p.atributo), `${c.etiqueta}, atributos:`);
				afirmar.parecido(d.events.map((e) => e.name), c.eventos.map((e) => e.nombre), `${c.etiqueta}, eventos:`);
				afirmar.parecido(d.cssParts.map((p) => p.name), c.partes.map((p) => p.nombre), `${c.etiqueta}, partes:`);
				afirmar.igual(d.members.filter((m) => m.kind === "method").length, c.metodos.length, `${c.etiqueta}, métodos:`);
			});
		});

		prueba("custom-elements.json guarda el valor por defecto de cada propiedad", async () => {
			const declaraciones = (await leer("custom-elements.json")).modules[0].declarations;
			componentes.forEach((c, i) => c.propiedades.forEach((p) => {
				const campo = declaraciones[i].members.find((m) => m.kind === "field" && m.name === p.nombre);
				afirmar.parecido(JSON.parse(campo.default), p.defecto, `${c.etiqueta}.${p.nombre}:`);
			}));
		});

		prueba("gota.d.ts tiene una clase y una entrada en HTMLElementTagNameMap por componente", async () => {
			const tipos = await leer("gota.d.ts", true);
			componentes.forEach((c) => {
				afirmar.cierto(tipos.includes(`export declare class ${c.clase} extends`), `Falta la clase ${c.clase}.`);
				afirmar.cierto(tipos.includes(`"${c.etiqueta}": ${c.clase};`), `Falta ${c.etiqueta} en HTMLElementTagNameMap.`);
				c.propiedades.forEach((p) => afirmar.cierto(new RegExp(`\\n\\t${p.nombre}: `).test(tipos), `Falta ${c.clase}.${p.nombre}.`));
			});
		});

		prueba("gota.d.ts da a cada evento propio el tipo de su detail", async () => {
			const tipos = await leer("gota.d.ts", true);
			componentes.flatMap((c) => c.eventos).filter((e) => e.tipoDetalle).forEach((e) => {
				afirmar.cierto(tipos.includes(`"${e.nombre}": CustomEvent<${e.tipoDetalle}>`), `Falta el tipo de ${e.nombre}.`);
			});
		});

		prueba("gota.html-data.json ofrece en VS Code los atributos y los valores posibles", async () => {
			const datos = await leer("gota.html-data.json");
			afirmar.parecido(datos.tags.map((t) => t.name), componentes.map((c) => c.etiqueta));
			const formato = datos.tags.find((t) => t.name === "gota-cantidad").attributes.find((a) => a.name === "formato");
			afirmar.parecido(formato.values.map((v) => v.name), ["numero", "moneda"]);
			const desactivado = datos.tags.find((t) => t.name === "gota-campo").attributes.find((a) => a.name === "disabled");
			afirmar.igual(desactivado.valueSet, "v", "Un atributo booleano no lleva valor.");
		});
	});
})();
