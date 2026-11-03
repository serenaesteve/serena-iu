/* Lo que todo control de formulario debe hacer igual que un <input> nativo */
(() => {
	const { afirmar, grupo, prueba, montar, escuchar, tecla, escribir } = arnes;

	const controles = [
		{ etiqueta: "gota-campo", valor: "Hola", vacio: "" },
		{ etiqueta: "gota-cantidad", valor: "12", vacio: "" },
		{ etiqueta: "gota-selector", valor: "Uno", vacio: "", opciones: true },
		{ etiqueta: "gota-fecha", valor: "2026-03-15", vacio: "" }
	];

	const interior = (elemento) => elemento.shadowRoot.querySelector("input");

	controles.forEach(({ etiqueta, valor, opciones }) => {
		const html = (extra = "") => `<${etiqueta} name="dato" ${extra}>${opciones ? "<option>Uno</option><option>Dos</option>" : ""}</${etiqueta}>`;

		grupo(`<${etiqueta}> · en un formulario`, () => {
			prueba("aparece en form.elements y se envía con su name", () => {
				const formulario = montar(`<form>${html()}</form>`);
				const control = formulario.elements.dato;
				afirmar.igual(control.tagName.toLowerCase(), etiqueta);
				control.value = valor;
				afirmar.igual(new FormData(formulario).get("dato"), valor);
			});

			prueba("el atributo value es el valor inicial", () => {
				afirmar.igual(montar(html(`value="${valor}"`)).value, valor);
			});

			prueba("cambiar value por código no lanza eventos", () => {
				const control = montar(html());
				const eventos = escuchar(control, "input", "change", "gota-cambio");
				control.value = valor;
				afirmar.igual(eventos.length, 0);
			});

			prueba("reset() vuelve al valor del atributo", () => {
				const formulario = montar(`<form>${html(`value="${valor}"`)}</form>`);
				const control = formulario.elements.dato;
				control.value = "";
				afirmar.igual(control.value, "");
				formulario.reset();
				afirmar.igual(control.value, valor);
			});

			prueba("required vacío es valueMissing y deja de serlo al rellenarlo", () => {
				const control = montar(html("required"));
				afirmar.falso(control.checkValidity());
				afirmar.cierto(control.validity.valueMissing, "Debería marcar valueMissing.");
				control.value = valor;
				afirmar.cierto(control.checkValidity(), "Con valor debería ser válido.");
			});

			prueba("readonly no se valida aunque sea required y esté vacío", () => {
				afirmar.cierto(montar(html("required readonly")).checkValidity());
			});

			prueba("disabled no se envía y desactiva lo de dentro", () => {
				const formulario = montar(`<form>${html(`disabled value="${valor}"`)}</form>`);
				afirmar.igual(new FormData(formulario).get("dato"), null);
				afirmar.cierto(interior(formulario.elements.dato).disabled, "El input interno sigue activo.");
			});

			prueba("dentro de un fieldset disabled queda desactivado", () => {
				const formulario = montar(`<form><fieldset disabled>${html(`value="${valor}"`)}</fieldset></form>`);
				afirmar.igual(new FormData(formulario).get("dato"), null);
				afirmar.cierto(interior(formulario.elements.dato).disabled, "El input interno sigue activo.");
			});

			prueba("setCustomValidity pone y quita un error propio", () => {
				const control = montar(html());
				control.setCustomValidity("Ya existe");
				afirmar.cierto(control.validity.customError, "Debería ser customError.");
				afirmar.igual(control.validationMessage, "Ya existe");
				control.setCustomValidity("");
				afirmar.cierto(control.checkValidity());
			});

			prueba("focus() pone el foco dentro", () => {
				const control = montar(html());
				control.focus();
				afirmar.igual(document.activeElement, control);
				afirmar.igual(control.shadowRoot.activeElement, interior(control));
			});

			prueba("un <label> externo le da nombre al control interno", () => {
				const etiquetaHtml = montar(`<label>Mi dato <span>*</span> ${html()}</label>`);
				const control = etiquetaHtml.querySelector(etiqueta);
				afirmar.igual(interior(control).getAttribute("aria-label"), "Mi dato");
			});

			prueba("pulsar el <label> pone el foco en el control", () => {
				const etiquetaHtml = montar(`<label><span>Dato</span> ${html()}</label>`);
				const control = etiquetaHtml.querySelector(etiqueta);
				etiquetaHtml.querySelector("span").click();
				afirmar.igual(control.shadowRoot.activeElement, interior(control));
			});

			prueba("aria-invalid del exterior llega al control interno", () => {
				const control = montar(html());
				control.setAttribute("aria-invalid", "true");
				afirmar.igual(interior(control).getAttribute("aria-invalid"), "true");
			});

			prueba("persistir recuerda el valor entre visitas", () => {
				localStorage.removeItem("gota:prueba");
				const control = montar(html('persistir="prueba"'));
				control.value = valor;
				afirmar.igual(localStorage.getItem("gota:prueba"), valor);
				afirmar.igual(montar(html('persistir="prueba"')).value, valor, "La segunda visita:");
				localStorage.removeItem("gota:prueba");
			});
		});
	});

	grupo("<gota-campo> · comportamiento", () => {
		prueba("al escribir lanza input y gota-cambio con los datos, y change al confirmar", () => {
			const control = montar('<gota-campo value="a"></gota-campo>');
			const eventos = escuchar(control, "input", "gota-cambio", "change");
			escribir(interior(control), "ab");
			afirmar.parecido(eventos.nombres(), ["input", "gota-cambio"]);
			afirmar.parecido(eventos[1].detalle, { valor: "ab", anterior: "a", origen: "teclado" });
			interior(control).dispatchEvent(new Event("change", { bubbles: true }));
			afirmar.parecido(eventos.nombres(), ["input", "gota-cambio", "change"]);
		});

		prueba("el input interno no filtra su propio evento: solo se ve uno", () => {
			const contenedor = montar("<div><gota-campo></gota-campo></div>");
			const eventos = escuchar(contenedor, "input");
			escribir(interior(contenedor.firstElementChild), "x");
			afirmar.igual(eventos.length, 1);
		});

		prueba("type=email marca typeMismatch y acepta un correo correcto", () => {
			const control = montar('<gota-campo type="email"></gota-campo>');
			control.value = "no-es-correo";
			afirmar.cierto(control.validity.typeMismatch);
			control.value = "ana@ejemplo.com";
			afirmar.cierto(control.checkValidity());
		});

		prueba("type=url marca typeMismatch sin protocolo", () => {
			const control = montar('<gota-campo type="url"></gota-campo>');
			control.value = "ejemplo";
			afirmar.cierto(control.validity.typeMismatch);
		});

		prueba("pattern marca patternMismatch", () => {
			const control = montar('<gota-campo pattern="[0-9]{9}"></gota-campo>');
			control.value = "abc";
			afirmar.cierto(control.validity.patternMismatch);
			control.value = "612345678";
			afirmar.cierto(control.checkValidity());
		});

		prueba("un type desconocido se comporta como text", () => {
			const control = montar('<gota-campo type="raro"></gota-campo>');
			afirmar.igual(interior(control).type, "text");
		});

		prueba("Enter envía el formulario", () => {
			const formulario = montar("<form><gota-campo name=a></gota-campo></form>");
			let enviado = 0;
			formulario.addEventListener("submit", (evento) => { evento.preventDefault(); enviado++; });
			tecla(interior(formulario.elements.a), "Enter");
			afirmar.igual(enviado, 1);
		});
	});

	grupo("<gota-cantidad> · comportamiento", () => {
		const cantidad = (atributos = "") => montar(`<gota-cantidad ${atributos}></gota-cantidad>`);

		prueba("incrementar y decrementar suman el paso", () => {
			const c = cantidad('value="10" step="5"');
			c.incrementar();
			afirmar.igual(c.value, "15");
			c.decrementar(2);
			afirmar.igual(c.value, "5");
		});

		prueba("stepUp y stepDown también existen, como en el input nativo", () => {
			const c = cantidad('value="1"');
			c.stepUp();
			c.stepDown(2);
			afirmar.igual(c.value, "0");
		});

		prueba("no se sale de min y max", () => {
			const c = cantidad('value="9" min="0" max="10"');
			c.incrementar(5);
			afirmar.igual(c.value, "10");
			c.decrementar(50);
			afirmar.igual(c.value, "0");
		});

		prueba("no acumula errores de coma flotante: 0.1 + 0.2 da 0.3", () => {
			const c = cantidad('value="0.1" step="0.1"');
			c.incrementar(2);
			afirmar.igual(c.value, "0.3");
		});

		prueba("desde vacío, el primer paso da el mínimo", () => {
			const c = cantidad('min="5"');
			c.incrementar();
			afirmar.igual(c.value, "5");
		});

		prueba("entiende coma decimal y separador de miles al escribir", () => {
			const c = cantidad('step="any"');
			escribir(interior(c), "1.234,5");
			afirmar.igual(c.value, "1234.5");
			escribir(interior(c), "12,75");
			afirmar.igual(c.value, "12.75");
		});

		prueba("texto que no es un número marca badInput y lo deja a la vista", () => {
			const c = cantidad();
			escribir(interior(c), "abc");
			afirmar.cierto(c.validity.badInput);
			afirmar.igual(c.value, "");
			interior(c).blur();
			afirmar.igual(interior(c).value, "abc");
		});

		prueba("rangeUnderflow y rangeOverflow", () => {
			const c = cantidad('min="1" max="5"');
			c.value = 0;
			afirmar.cierto(c.validity.rangeUnderflow);
			c.value = 9;
			afirmar.cierto(c.validity.rangeOverflow);
		});

		prueba("stepMismatch respeta el paso y any lo desactiva", () => {
			const c = cantidad('step="0.01"');
			c.value = "1.005";
			afirmar.cierto(c.validity.stepMismatch);
			c.value = "1.25";
			afirmar.cierto(c.checkValidity(), "1.25 sí es múltiplo de 0.01.");
			c.step = "any";
			c.value = "1.005";
			afirmar.cierto(c.checkValidity());
		});

		prueba("formato moneda: enseña 12.345,50 y el símbolo, pero el valor sigue siendo 12345.5", () => {
			const c = cantidad('formato="moneda" value="12345.5" step="0.01"');
			afirmar.igual(interior(c).value, "12.345,50");
			afirmar.igual(c.shadowRoot.querySelector(".unidad").textContent, "€");
			afirmar.igual(c.value, "12345.5");
		});

		prueba("con el foco enseña el número sin formato para editarlo", () => {
			const c = cantidad('formato="moneda" value="12345.5"');
			interior(c).focus();
			afirmar.igual(interior(c).value, "12345.5");
			interior(c).blur();
			afirmar.igual(interior(c).value, "12.345,50");
		});

		prueba("flechas, Inicio y Fin desde el teclado, con su evento", () => {
			const c = cantidad('value="5" min="0" max="10"');
			const eventos = escuchar(c, "gota-cambio");
			tecla(interior(c), "ArrowUp");
			afirmar.igual(c.value, "6");
			tecla(interior(c), "ArrowDown");
			tecla(interior(c), "Home");
			afirmar.igual(c.value, "0");
			tecla(interior(c), "End");
			afirmar.igual(c.value, "10");
			afirmar.igual(eventos[0].detalle.origen, "teclado");
		});

		prueba("readonly no cambia con el teclado y oculta los botones", () => {
			const c = cantidad('value="5" readonly');
			tecla(interior(c), "ArrowUp");
			afirmar.igual(c.value, "5");
			afirmar.cierto(c.shadowRoot.querySelector("[part=mas]").hidden);
		});

		prueba("el botón + usado con click() (gestos, lectores de pantalla) también suma", () => {
			const c = cantidad('value="1"');
			c.shadowRoot.querySelector("[part=mas]").click();
			afirmar.igual(c.value, "2");
		});

		prueba("el botón se desactiva al llegar al límite", () => {
			const c = cantidad('value="10" max="10"');
			afirmar.cierto(c.shadowRoot.querySelector("[part=mas]").disabled);
		});

		prueba("valorNumerico devuelve número o NaN", () => {
			const c = cantidad('value="2.5"');
			afirmar.igual(c.valorNumerico, 2.5);
			c.value = "";
			afirmar.cierto(Number.isNaN(c.valorNumerico));
		});

		prueba("informa a los lectores de pantalla con role spinbutton", () => {
			const e = interior(cantidad('value="3" min="1" max="9"'));
			afirmar.igual(e.getAttribute("role"), "spinbutton");
			afirmar.igual(e.getAttribute("aria-valuenow"), "3");
			afirmar.igual(e.getAttribute("aria-valuemax"), "9");
		});
	});
})();
