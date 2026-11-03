/* Comportamiento propio de cada componente */
(() => {
	const { afirmar, grupo, prueba, montar, escuchar, tecla, escribir, esperar } = arnes;
	const interior = (elemento) => elemento.shadowRoot.querySelector("input");

	grupo("<gota-selector> · comportamiento", () => {
		const selector = (atributos = "") => montar(`<gota-selector ${atributos}><option value="a">Informática</option><option value="b">Telefonía</option><option value="c" disabled>Oficina</option></gota-selector>`);
		const filas = (s) => [...s.shadowRoot.querySelectorAll("[role=option]")];
		const textos = (s) => filas(s).map((f) => f.textContent);

		prueba("lee las opciones de las etiquetas <option>", () => {
			afirmar.parecido(selector().options.map((o) => o.value), ["a", "b", "c"]);
		});

		prueba("también acepta textos y objetos por la propiedad opciones", () => {
			const s = montar("<gota-selector></gota-selector>");
			s.opciones = ["Uno", { valor: "2", texto: "Dos", tono: 200 }];
			afirmar.parecido(s.options.map((o) => o.text), ["Uno", "Dos"]);
		});

		prueba("enseña el texto de la opción, no su valor", () => {
			afirmar.igual(interior(selector('value="a"')).value, "Informática");
		});

		prueba("si el valor no está en la lista lo conserva", () => {
			const s = selector();
			s.value = "Antigua";
			afirmar.igual(s.value, "Antigua");
			afirmar.igual(interior(s).value, "Antigua");
		});

		prueba("abrir y cerrar lanzan sus eventos y actualizan aria-expanded", () => {
			const s = selector();
			const eventos = escuchar(s, "gota-abrir", "gota-cerrar");
			s.abrir();
			afirmar.cierto(s.estaAbierto);
			afirmar.igual(interior(s).getAttribute("aria-expanded"), "true");
			s.cerrar();
			afirmar.parecido(eventos.nombres(), ["gota-abrir", "gota-cerrar"]);
		});

		prueba("el panel se abre en la capa superior", () => {
			const s = selector();
			s.abrir();
			afirmar.cierto(s.shadowRoot.querySelector(".panel").matches(":popover-open"));
			s.cerrar();
		});

		prueba("filtra sin distinguir acentos ni mayúsculas", () => {
			const s = selector('required');
			escribir(interior(s), "TELEFONIA");
			afirmar.parecido(textos(s), ["Telefonía"]);
			s.cerrar();
		});

		prueba("sin coincidencias avisa con el texto configurable", () => {
			const s = selector('sin-resultados="Nada"');
			escribir(interior(s), "zzz");
			afirmar.igual(s.shadowRoot.querySelector(".nada").textContent, "Nada");
			s.cerrar();
		});

		prueba("flechas y Enter eligen, con todos los eventos", () => {
			const s = selector("required");
			const eventos = escuchar(s, "input", "gota-cambio", "change");
			s.focus();
			tecla(interior(s), "ArrowDown");
			afirmar.cierto(s.estaAbierto, "La primera flecha abre.");
			tecla(interior(s), "ArrowDown");
			tecla(interior(s), "Enter");
			afirmar.igual(s.value, "b");
			afirmar.falso(s.estaAbierto, "Elegir cierra.");
			afirmar.parecido(eventos.nombres(), ["input", "gota-cambio", "change"]);
			afirmar.parecido(eventos[1].detalle, { valor: "b", anterior: "", origen: "teclado" });
		});

		prueba("una opción desactivada no se puede elegir", () => {
			const s = selector("required");
			s.abrir();
			filas(s)[2].click();
			afirmar.igual(s.value, "");
			afirmar.cierto(s.estaAbierto);
			s.cerrar();
		});

		prueba("Escape cierra, restaura el texto y no se propaga a la aplicación", () => {
			const contenedor = montar('<div><gota-selector value="a"><option value="a">Informática</option></gota-selector></div>');
			const s = contenedor.firstElementChild;
			let salio = false;
			contenedor.addEventListener("keydown", () => { salio = true; });
			escribir(interior(s), "xx");
			tecla(interior(s), "Escape");
			afirmar.falso(s.estaAbierto);
			afirmar.igual(interior(s).value, "Informática");
			afirmar.falso(salio, "Escape ha salido del componente.");
		});

		prueba("Escape con la lista cerrada sí llega a la aplicación", () => {
			const contenedor = montar("<div><gota-selector></gota-selector></div>");
			let llego = false;
			contenedor.addEventListener("keydown", () => { llego = true; });
			tecla(interior(contenedor.firstElementChild), "Escape");
			afirmar.cierto(llego);
		});

		prueba("sin required ofrece una fila vacía para quitar la elección", () => {
			const s = selector('value="a"');
			s.abrir();
			filas(s)[0].click();
			afirmar.igual(s.value, "");
		});

		prueba("required no ofrece esa fila", () => {
			const s = selector("required");
			s.abrir();
			afirmar.igual(filas(s).length, 3);
			s.cerrar();
		});

		prueba("elegir() por código lanza los eventos con origen codigo", () => {
			const s = selector();
			const eventos = escuchar(s, "gota-cambio");
			s.elegir("b");
			afirmar.igual(eventos[0].detalle.origen, "codigo");
		});

		prueba("pulsar la opción dentro de un <label> la elige una sola vez", () => {
			const etiqueta = montar('<label>Tipo <gota-selector required><option>Uno</option><option>Dos</option></gota-selector></label>');
			const s = etiqueta.querySelector("gota-selector");
			const eventos = escuchar(s, "change");
			s.abrir();
			filas(s)[1].click();
			afirmar.igual(s.value, "Dos");
			afirmar.igual(eventos.length, 1);
		});

		prueba("al salir del DOM cierra el panel y sus escuchas", () => {
			const s = selector();
			s.abrir();
			s.remove();
			afirmar.falso(s.estaAbierto);
		});

		prueba("la gota ocupa la fila entera aunque el campo sea ancho", () => {
			const s = montar('<gota-selector required style="width:500px"><option>Uno</option></gota-selector>');
			s.abrir();
			const gota = s.shadowRoot.querySelector(".gota").getBoundingClientRect();
			const fila = filas(s)[0].getBoundingClientRect();
			afirmar.igual(Math.round(gota.width), Math.round(fila.width));
			s.cerrar();
		});

		prueba("la gota se coloca sobre la opción activa", () => {
			const s = selector('required value="b"');
			s.abrir();
			const gota = s.shadowRoot.querySelector(".gota");
			const fila = filas(s)[1];
			afirmar.falso(gota.hidden);
			afirmar.igual(Math.round(gota.posicion.y), Math.round(fila.offsetTop + s.shadowRoot.querySelector(".filas").offsetTop));
			s.cerrar();
		});
	});

	grupo("<gota-fecha> · comportamiento", () => {
		const fecha = (atributos = "") => montar(`<gota-fecha ${atributos}></gota-fecha>`);
		const dia = (f, iso) => f.shadowRoot.querySelector(`[data-dia="${iso}"]`);

		prueba("el calendario es una rejilla ARIA de seis semanas con el día elegido marcado", () => {
			const f = fecha('value="2026-11-09"');
			f.abrir();
			const semanas = f.shadowRoot.querySelectorAll("[role=grid] > [role=row]");
			afirmar.igual(semanas.length, 6);
			afirmar.cierto([...semanas].every((s) => s.querySelectorAll("[role=gridcell]").length === 7), "Cada semana tiene 7 días.");
			afirmar.igual(dia(f, "2026-11-09").getAttribute("aria-selected"), "true");
			afirmar.igual(f.shadowRoot.querySelectorAll('[aria-selected="true"]').length, 1);
			f.cerrar();
		});

		prueba("interpreta los formatos que se escriben", () => {
			const { interpretar } = customElements.get("gota-fecha");
			afirmar.igual(interpretar("15/3/1990"), "1990-03-15");
			afirmar.igual(interpretar("15-03-90"), "1990-03-15");
			afirmar.igual(interpretar("1.2.26"), "2026-02-01");
			afirmar.igual(interpretar("2026-10-30"), "2026-10-30");
			afirmar.igual(interpretar(""), "");
		});

		prueba("rechaza fechas que no existen", () => {
			const { interpretar } = customElements.get("gota-fecha");
			afirmar.igual(interpretar("31/02/2026"), null);
			afirmar.igual(interpretar("29/02/2025"), null);
			afirmar.igual(interpretar("ayer"), null);
			afirmar.igual(interpretar("29/02/2024"), "2024-02-29");
		});

		prueba("enseña dd/mm/aaaa y guarda AAAA-MM-DD", () => {
			const f = fecha('value="2026-03-05"');
			afirmar.igual(interior(f).value, "05/03/2026");
			afirmar.igual(f.value, "2026-03-05");
		});

		prueba("valorFecha no se desplaza de día por la zona horaria", () => {
			const d = fecha('value="2026-03-01"').valorFecha;
			afirmar.igual(d.getDate(), 1);
			afirmar.igual(d.getMonth(), 2);
		});

		prueba("al escribir una fecha inválida marca badInput y la deja a la vista", () => {
			const f = fecha();
			escribir(interior(f), "31/02/2026");
			afirmar.cierto(f.validity.badInput);
			interior(f).blur();
			afirmar.igual(interior(f).value, "31/02/2026");
		});

		prueba("min y max se validan", () => {
			const f = fecha('min="2026-01-01" max="2026-12-31"');
			f.value = "2025-12-31";
			afirmar.cierto(f.validity.rangeUnderflow);
			f.value = "2027-01-01";
			afirmar.cierto(f.validity.rangeOverflow);
			f.value = "2026-06-01";
			afirmar.cierto(f.checkValidity());
		});

		prueba("el calendario abre en el mes del valor, con la semana empezando en lunes", () => {
			const f = fecha('value="2026-03-15"');
			f.abrir();
			afirmar.cierto(f.shadowRoot.querySelector(".titulo").textContent.includes("marzo"));
			// El 1 de marzo de 2026 es domingo: la primera casilla es el lunes 23 de febrero
			afirmar.igual(f.shadowRoot.querySelector("[data-dia]").dataset.dia, "2026-02-23");
			f.cerrar();
		});

		prueba("pulsar un día lo elige, con eventos, y cierra el calendario", async () => {
			const f = fecha('value="2026-03-15"');
			const eventos = escuchar(f, "gota-cambio", "gota-cerrar", "change");
			f.abrir();
			dia(f, "2026-03-20").click();
			afirmar.igual(f.value, "2026-03-20");
			afirmar.igual(interior(f).value, "20/03/2026");
			afirmar.igual(eventos[0].detalle.anterior, "2026-03-15");
			await esperar(340);
			afirmar.falso(f.estaAbierto);
			afirmar.cierto(eventos.nombres().includes("gota-cerrar"));
			afirmar.cierto(eventos.nombres().includes("change"));
		});

		prueba("la gota queda justo encima del día elegido", () => {
			const f = fecha('value="2026-03-15"');
			f.abrir();
			const gota = f.shadowRoot.querySelector(".gota").getBoundingClientRect();
			const elegido = dia(f, "2026-03-15").getBoundingClientRect();
			afirmar.igual(Math.round(gota.left), Math.round(elegido.left));
			afirmar.igual(Math.round(gota.top), Math.round(elegido.top));
			afirmar.igual(Math.round(gota.width), Math.round(elegido.width));
			f.cerrar();
		});

		prueba("el calendario no se estira con el ancho del campo", () => {
			const f = montar('<gota-fecha style="width:500px"></gota-fecha>');
			f.abrir();
			afirmar.igual(f.shadowRoot.querySelector(".panel").offsetWidth, 296);
			f.cerrar();
		});

		prueba("el título del mes cabe en una línea", () => {
			const f = fecha('value="2026-09-15"');
			f.abrir();
			const titulo = f.shadowRoot.querySelector(".titulo");
			afirmar.cierto(titulo.scrollWidth <= titulo.clientWidth, "El título se sale.");
			f.cerrar();
		});

		prueba("los días fuera de rango están desactivados", () => {
			const f = fecha('value="2026-03-15" min="2026-03-10"');
			f.abrir();
			afirmar.cierto(dia(f, "2026-03-09").disabled);
			afirmar.falso(dia(f, "2026-03-10").disabled);
			f.cerrar();
		});

		prueba("irAMes cambia de mes y lanza gota-mes, sin cambiar el valor", () => {
			const f = fecha('value="2026-03-15"');
			const eventos = escuchar(f, "gota-mes");
			f.abrir();
			f.irAMes(2027, 1);
			afirmar.parecido(eventos[0].detalle, { anio: 2027, mes: 1 });
			afirmar.igual(f.value, "2026-03-15");
			f.cerrar();
		});

		prueba("los botones de mes y año cruzan el cambio de año", () => {
			const f = fecha('value="2026-01-15"');
			f.abrir();
			f.shadowRoot.querySelector('[data-meses="-1"]').click();
			afirmar.cierto(f.shadowRoot.querySelector(".titulo").textContent.includes("2025"));
			afirmar.cierto(f.shadowRoot.querySelector(".titulo").textContent.includes("diciembre"));
			f.cerrar();
		});

		prueba("teclado en el calendario: flechas mueven, Escape cierra sin propagarse", () => {
			const contenedor = montar('<div><gota-fecha value="2026-03-31"></gota-fecha></div>');
			const f = contenedor.firstElementChild;
			let salio = false;
			f.abrir(true);
			tecla(f.shadowRoot.activeElement, "ArrowRight");
			afirmar.igual(f.shadowRoot.activeElement.dataset.dia, "2026-04-01", "Cruza de mes.");
			contenedor.addEventListener("keydown", () => { salio = true; });
			tecla(f.shadowRoot.activeElement, "Escape");
			afirmar.falso(f.estaAbierto);
			afirmar.falso(salio);
		});

		prueba("flecha abajo en el campo abre el calendario y lleva el foco al día", () => {
			const f = fecha('value="2026-03-15"');
			interior(f).focus();
			tecla(interior(f), "ArrowDown");
			afirmar.cierto(f.estaAbierto);
			afirmar.igual(f.shadowRoot.activeElement.dataset.dia, "2026-03-15");
			f.cerrar();
		});

		prueba("readonly no abre el calendario", () => {
			const f = fecha("readonly");
			f.abrir();
			afirmar.falso(f.estaAbierto);
		});

		prueba("hoy() elige la fecha de hoy", () => {
			const f = fecha();
			f.hoy();
			const d = new Date();
			afirmar.igual(f.valorFecha.getDate(), d.getDate());
		});
	});

	grupo("<gota-interruptor> · comportamiento", () => {
		const canal = (i) => i.shadowRoot.querySelector("button");

		prueba("checked refleja el atributo inicial y role switch", () => {
			const i = montar("<gota-interruptor checked></gota-interruptor>");
			afirmar.cierto(i.checked);
			afirmar.igual(canal(i).getAttribute("role"), "switch");
			afirmar.igual(canal(i).getAttribute("aria-checked"), "true");
		});

		prueba("type es checkbox, como espera el código que recorre formularios", () => {
			afirmar.igual(montar("<gota-interruptor></gota-interruptor>").type, "checkbox");
		});

		prueba("pulsar alterna y lanza input, change y gota-cambio", () => {
			const i = montar("<gota-interruptor></gota-interruptor>");
			const eventos = escuchar(i, "input", "change", "gota-cambio");
			canal(i).click();
			afirmar.cierto(i.checked);
			afirmar.parecido(eventos.nombres(), ["input", "change", "gota-cambio"]);
			afirmar.parecido([eventos[2].detalle.valor, eventos[2].detalle.anterior], [true, false]);
		});

		prueba("cambiar checked por código no lanza eventos", () => {
			const i = montar("<gota-interruptor></gota-interruptor>");
			const eventos = escuchar(i, "change");
			i.checked = true;
			afirmar.igual(eventos.length, 0);
			afirmar.igual(canal(i).getAttribute("aria-checked"), "true");
		});

		prueba("activado envía su value; apagado no envía nada, como una casilla", () => {
			const formulario = montar('<form><gota-interruptor name="activo" value="si"></gota-interruptor></form>');
			afirmar.igual(new FormData(formulario).get("activo"), null);
			formulario.elements.activo.checked = true;
			afirmar.igual(new FormData(formulario).get("activo"), "si");
		});

		prueba("value por defecto es on", () => {
			const formulario = montar('<form><gota-interruptor name="a" checked></gota-interruptor></form>');
			afirmar.igual(new FormData(formulario).get("a"), "on");
		});

		prueba("dentro de un <label>: pulsar el texto alterna una sola vez", () => {
			const etiqueta = montar("<label><gota-interruptor></gota-interruptor><span>Activo</span></label>");
			const i = etiqueta.querySelector("gota-interruptor");
			const eventos = escuchar(i, "change");
			etiqueta.querySelector("span").click();
			afirmar.cierto(i.checked);
			afirmar.igual(eventos.length, 1);
		});

		prueba("dentro de un <label>: pulsar el interruptor alterna una sola vez", () => {
			const etiqueta = montar("<label><gota-interruptor></gota-interruptor><span>Activo</span></label>");
			const i = etiqueta.querySelector("gota-interruptor");
			canal(i).click();
			afirmar.cierto(i.checked);
		});

		prueba("disabled y readonly no alternan", () => {
			const d = montar("<gota-interruptor disabled></gota-interruptor>");
			canal(d).click();
			afirmar.falso(d.checked);
			const r = montar("<gota-interruptor readonly></gota-interruptor>");
			canal(r).click();
			afirmar.falso(r.checked);
		});

		prueba("reset vuelve al estado del atributo", () => {
			const formulario = montar('<form><gota-interruptor name="a" checked></gota-interruptor></form>');
			formulario.elements.a.checked = false;
			formulario.reset();
			afirmar.cierto(formulario.elements.a.checked);
		});

		prueba("required sin activar es valueMissing", () => {
			const i = montar("<gota-interruptor required></gota-interruptor>");
			afirmar.cierto(i.validity.valueMissing);
			i.checked = true;
			afirmar.cierto(i.checkValidity());
		});

		prueba("persistir recuerda checked", () => {
			localStorage.removeItem("gota:prueba-i");
			montar('<gota-interruptor persistir="prueba-i"></gota-interruptor>').checked = true;
			afirmar.cierto(montar('<gota-interruptor persistir="prueba-i"></gota-interruptor>').checked);
			localStorage.removeItem("gota:prueba-i");
		});

		prueba("la gota cambia de lado", () => {
			const i = montar("<gota-interruptor></gota-interruptor>");
			const gota = i.shadowRoot.querySelector(".gota");
			const antes = gota.posicion.x;
			i.checked = true;
			afirmar.cierto(gota.posicion.x > antes, "La gota no se ha movido.");
		});

		prueba("el <label> le da nombre al botón interno", () => {
			const etiqueta = montar("<label><gota-interruptor></gota-interruptor><span>Cliente activo</span></label>");
			afirmar.igual(canal(etiqueta.querySelector("gota-interruptor")).getAttribute("aria-label"), "Cliente activo");
		});
	});

	grupo("<gota-clave> · comportamiento", () => {
		const clave = (atributos = "") => montar(`<gota-clave ${atributos}><input name="c" type="password"></gota-clave>`);
		const boton = (c) => c.shadowRoot.querySelector("button");

		prueba("el input sigue en el HTML de la página, al alcance de los gestores de contraseñas", () => {
			const formulario = montar('<form><gota-clave><input name="c" type="password" value="x"></gota-clave></form>');
			afirmar.igual(formulario.elements.c.tagName, "INPUT");
			afirmar.igual(new FormData(formulario).get("c"), "x");
		});

		prueba("mostrar y ocultar cambian el tipo del input y lanzan el evento", () => {
			const c = clave();
			const eventos = escuchar(c, "gota-visibilidad");
			c.mostrar();
			afirmar.igual(c.entrada.type, "text");
			afirmar.parecido(eventos[0].detalle, { visible: true });
			c.ocultar();
			afirmar.igual(c.entrada.type, "password");
		});

		prueba("el botón alterna y dice qué va a hacer", () => {
			const c = clave();
			afirmar.igual(boton(c).getAttribute("aria-label"), "Mostrar la contraseña");
			boton(c).click();
			afirmar.cierto(c.visible);
			afirmar.igual(boton(c).getAttribute("aria-label"), "Ocultar la contraseña");
			afirmar.igual(boton(c).getAttribute("aria-pressed"), "true");
		});

		prueba("puntúa la fuerza de 0 a 5", () => {
			const { puntuar } = customElements.get("gota-clave");
			afirmar.igual(puntuar(""), 0);
			afirmar.igual(puntuar("abcdefgh"), 1);
			afirmar.igual(puntuar("abcdefghijkl"), 2);
			afirmar.igual(puntuar("Abcdefghijk1!"), 5);
		});

		prueba("el medidor solo se ve si se pide", () => {
			afirmar.cierto(clave().shadowRoot.querySelector(".medidor").hidden);
			afirmar.falso(clave("medidor").shadowRoot.querySelector(".medidor").hidden);
		});

		prueba("al escribir actualiza el medidor y lanza gota-fuerza", () => {
			const c = clave("medidor");
			const eventos = escuchar(c, "gota-fuerza");
			escribir(c.entrada, "Abcdefghijk1!");
			afirmar.igual(c.fuerza, 5);
			afirmar.igual(eventos[0].detalle.puntos, 5);
			afirmar.igual(c.shadowRoot.querySelector(".texto").textContent, "Muy buena");
		});

		prueba("avisa de la longitud mínima configurable", () => {
			const c = clave('medidor minimo="12"');
			escribir(c.entrada, "Abc1!");
			afirmar.igual(c.shadowRoot.querySelector(".texto").textContent, "Mínimo 12 caracteres.");
		});
	});

	grupo("<gota-filtros> · comportamiento", () => {
		const filtros = (valor = "") => {
			const f = montar(`<gota-filtros value="${valor}"></gota-filtros>`);
			f.opciones = [{ valor: "", texto: "Todos", cantidad: 10 }, { valor: "a", texto: "Particular", cantidad: 2, tono: 265 }, { valor: "b", texto: "Empresa", cantidad: 4 }];
			return f;
		};
		const botones = (f) => [...f.shadowRoot.querySelectorAll("button")];

		prueba("pinta un botón por opción, con texto y cantidad", () => {
			const f = filtros();
			afirmar.igual(botones(f).length, 3);
			afirmar.igual(botones(f)[1].querySelector(".texto").textContent, "Particular");
			afirmar.igual(botones(f)[1].querySelector(".cantidad").textContent, "2");
		});

		prueba("marca solo el elegido con aria-pressed", () => {
			const f = filtros("a");
			afirmar.parecido(botones(f).map((b) => b.getAttribute("aria-pressed")), ["false", "true", "false"]);
		});

		prueba("pulsar otro lanza change y gota-cambio", () => {
			const f = filtros();
			const eventos = escuchar(f, "change", "gota-cambio");
			botones(f)[2].click();
			afirmar.igual(f.value, "b");
			afirmar.parecido(eventos.nombres(), ["change", "gota-cambio"]);
			afirmar.igual(eventos[1].detalle.anterior, "");
		});

		prueba("pulsar el que ya está elegido no lanza nada", () => {
			const f = filtros("a");
			const eventos = escuchar(f, "change");
			botones(f)[1].click();
			afirmar.igual(eventos.length, 0);
		});

		prueba("cambiar value por código mueve la gota sin lanzar eventos", () => {
			const f = filtros();
			const eventos = escuchar(f, "change");
			const gota = f.shadowRoot.querySelector(".gota");
			const antes = gota.posicion.x;
			f.value = "b";
			afirmar.igual(eventos.length, 0);
			afirmar.cierto(gota.posicion.x > antes, "La gota no se ha movido.");
		});

		prueba("un valor que no existe esconde la gota", () => {
			const f = filtros();
			f.value = "zzz";
			afirmar.cierto(f.shadowRoot.querySelector(".gota").hidden);
		});

		prueba("actualizarCantidades cambia los números sin repintar", () => {
			const f = filtros();
			const boton = botones(f)[1];
			f.actualizarCantidades({ a: 9 });
			afirmar.igual(boton.querySelector(".cantidad").textContent, "9");
			afirmar.cierto(boton.isConnected, "Ha repintado los botones.");
		});

		prueba("la etiqueta llega a los lectores de pantalla", () => {
			const f = filtros();
			f.etiqueta = "Tipo";
			afirmar.igual(f.shadowRoot.querySelector("[role=group]").getAttribute("aria-label"), "Tipo");
		});
	});

	grupo("<gota-paginador> · comportamiento", () => {
		const paginador = (pagina, paginas) => montar(`<gota-paginador pagina="${pagina}" paginas="${paginas}"></gota-paginador>`);
		const numeros = (p) => [...p.shadowRoot.querySelectorAll(".numero")].map((b) => Number(b.textContent));

		prueba("calcula el tramo con puntos suspensivos", () => {
			const { tramo } = customElements.get("gota-paginador");
			afirmar.parecido(tramo(1, 1, 1), [1]);
			afirmar.parecido(tramo(1, 3, 1), [1, 2, 3]);
			afirmar.parecido(tramo(5, 20, 1), [1, "…", 4, 5, 6, "…", 20]);
			afirmar.parecido(tramo(20, 20, 1), [1, "…", 19, 20]);
		});

		prueba("no pone puntos para saltarse una sola página", () => {
			const { tramo } = customElements.get("gota-paginador");
			afirmar.parecido(tramo(3, 5, 0), [1, 2, 3, 4, 5]);
		});

		prueba("pinta las páginas y marca la actual con aria-current", () => {
			const p = paginador(2, 3);
			afirmar.parecido(numeros(p), [1, 2, 3]);
			afirmar.igual(p.shadowRoot.querySelector("[aria-current]").textContent, "2");
		});

		prueba("siguiente y anterior lanzan gota-pagina", () => {
			const p = paginador(2, 3);
			const eventos = escuchar(p, "gota-pagina");
			p.siguiente();
			afirmar.parecido(eventos[0].detalle, { pagina: 3, anterior: 2 });
			p.anterior();
			afirmar.igual(p.pagina, 2);
		});

		prueba("no se sale del rango ni lanza evento en los extremos", () => {
			const p = paginador(1, 3);
			const eventos = escuchar(p, "gota-pagina");
			p.anterior();
			afirmar.igual(eventos.length, 0);
			p.ir(99);
			afirmar.igual(p.pagina, 3);
		});

		prueba("las flechas se desactivan en los extremos", () => {
			const p = paginador(1, 1);
			p.shadowRoot.querySelectorAll(".flecha").forEach((f) => afirmar.cierto(f.disabled));
		});

		prueba("pulsar un número va a esa página", () => {
			const p = paginador(1, 3);
			p.shadowRoot.querySelector('[data-pagina="3"]').click();
			afirmar.igual(p.pagina, 3);
		});

		prueba("una página fuera de rango se muestra corregida", () => {
			const p = paginador(9, 3);
			afirmar.igual(p.actual, 3);
			afirmar.igual(p.shadowRoot.querySelector("[aria-current]").textContent, "3");
		});

		prueba("la gota viaja a la nueva página", () => {
			const p = paginador(1, 5);
			const gota = p.shadowRoot.querySelector(".gota");
			const antes = gota.posicion.x;
			p.pagina = 2;
			afirmar.cierto(gota.posicion.x > antes);
		});

		prueba("conserva la posición al sacarlo y volverlo a poner, como al repintar una tabla", () => {
			const p = paginador(1, 3);
			const padre = p.parentElement;
			p.remove();
			p.pagina = 2;
			padre.append(p);
			afirmar.igual(p.shadowRoot.querySelector("[aria-current]").textContent, "2");
			afirmar.falso(p.shadowRoot.querySelector(".gota").hidden);
		});
	});

	grupo("<gota-nivel> · comportamiento", () => {
		const nivel = (atributos) => montar(`<gota-nivel ${atributos}></gota-nivel>`);

		prueba("calcula el estado según la cantidad", () => {
			afirmar.igual(nivel('value="0" max="50" minimo="5"').estado, "agotado");
			afirmar.igual(nivel('value="3" max="50" minimo="5"').estado, "bajo");
			afirmar.igual(nivel('value="5" max="50" minimo="5"').estado, "normal");
			afirmar.igual(nivel('value="50" max="50" minimo="5"').estado, "lleno");
		});

		prueba("más cantidad que el máximo no desborda el tubo", () => {
			afirmar.igual(nivel('value="80" max="50"').proporcion, 1);
		});

		prueba("max 0 no divide entre cero", () => {
			afirmar.igual(nivel('value="5" max="0"').proporcion, 0);
		});

		prueba("el líquido refleja la proporción", () => {
			const n = nivel('value="25" max="100"');
			afirmar.igual(n.shadowRoot.querySelector(".liquido").style.transform, "scaleX(0.25)");
		});

		prueba("vertical cambia el eje", () => {
			const n = nivel('value="25" max="100" vertical');
			afirmar.igual(n.shadowRoot.querySelector(".liquido").style.transform, "scaleY(0.25)");
		});

		prueba("gota-umbral solo se lanza al cruzar de estado", () => {
			const n = nivel('value="10" max="50" minimo="5"');
			const eventos = escuchar(n, "gota-umbral");
			n.value = 8;
			afirmar.igual(eventos.length, 0, "Sigue siendo normal.");
			n.value = 2;
			afirmar.parecido(eventos[0].detalle, { estado: "bajo", anterior: "normal", valor: 2 });
		});

		prueba("ajustar suma y resta sin bajar de cero", () => {
			const n = nivel('value="3"');
			n.ajustar(2);
			afirmar.igual(n.value, 5);
			n.ajustar(-9);
			afirmar.igual(n.value, 0);
		});

		prueba("la marca de mínimo está donde toca y desaparece con minimo 0", () => {
			const n = nivel('value="5" max="50" minimo="5"');
			const marca = n.shadowRoot.querySelector("[part=marca]");
			afirmar.igual(marca.style.left, "10%");
			afirmar.igual(marca.offsetWidth, 2, "La marca debe ser una línea fina.");
			afirmar.cierto(nivel('value="5"').shadowRoot.querySelector("[part=marca]").hidden);
		});

		prueba("sin-cifra oculta el número", () => {
			afirmar.cierto(nivel("sin-cifra").shadowRoot.querySelector(".cifra").hidden);
		});

		prueba("se describe a los lectores de pantalla con role meter y el estado", () => {
			const caja = nivel('value="2" max="50" minimo="5" unidad="uds."').shadowRoot.querySelector("[role=meter]");
			afirmar.igual(caja.getAttribute("aria-valuenow"), "2");
			afirmar.igual(caja.getAttribute("aria-valuetext"), "2 uds., bajo");
		});
	});

	grupo("Movimiento", () => {
		prueba("moverGota coloca la gota y guarda su posición", () => {
			const c = montar('<div style="position:relative;width:200px;height:50px"><span class="g" style="position:absolute;left:0;top:0"></span><i style="position:absolute;left:60px;top:10px;width:20px;height:20px"></i></div>');
			const g = c.querySelector(".g");
			gota.moverGota(g, c.querySelector("i"), { animar: false });
			afirmar.parecido(g.posicion, { x: 60, y: 10, ancho: 20, alto: 20 });
		});

		prueba("sin destino no falla", () => {
			gota.moverGota(montar("<span></span>"), null);
		});
	});
})();
