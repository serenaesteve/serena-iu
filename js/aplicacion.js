/**
 * serena | iu · aplicación
 * Evolución de jocarsa | iu: misma arquitectura orientada a objetos,
 * pero todo se genera a partir de los esquemas JSON, cada vista tiene
 * su propia URL y los cambios se conservan en el navegador.
 */
(() => {
	"use strict";

	const { DOM, Utilidades, Almacen, TemaIU, Sesion, ToastIU, DialogoIU } = window.serena.iu;
	const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
	const movimientoReducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* =========================================================
	   ORIGEN DE DATOS
	   ========================================================= */
	class OrigenDatos {
		static async cargarJSON(url) {
			const respuesta = await fetch(url);

			if (!respuesta.ok) {
				throw new Error(`${url} (${respuesta.status})`);
			}

			return respuesta.json();
		}
	}

	/* =========================================================
	   ENTIDAD: un esquema JSON + sus registros + persistencia
	   ========================================================= */
	class Entidad {
		constructor(id, esquema) {
			this.id = id;
			this.esquema = esquema;
			this.original = structuredClone(esquema.datos);
			this.datos = Almacen.leer(`datos:${id}`, null) ?? structuredClone(esquema.datos);
		}

		get titulo() { return this.esquema.titulo; }
		get singular() { return this.esquema.singular || "registro"; }
		get campos() { return this.esquema.campos; }

		camposListado() {
			const marcados = this.campos.filter((campo) => campo.listado);
			return marcados.length ? marcados : this.campos;
		}

		todos() { return this.datos; }

		buscar(id) { return this.datos.find((registro) => registro.id === Number(id)); }

		siguienteId() { return this.datos.reduce((maximo, r) => Math.max(maximo, r.id), 0) + 1; }

		guardar() { Almacen.guardar(`datos:${this.id}`, this.datos); }

		crear(datos) {
			const registro = { ...datos, id: this.siguienteId() };
			this.datos.push(registro);
			this.guardar();
			return registro;
		}

		actualizar(id, datos) {
			const registro = this.buscar(id);
			Object.assign(registro, datos, { id: registro.id });
			this.guardar();
			return registro;
		}

		/** Devuelve lo borrado con su posición, para poder deshacer */
		borrar(ids) {
			const eliminados = [];

			this.datos.forEach((registro, indice) => {
				if (ids.includes(registro.id)) {
					eliminados.push({ registro, indice });
				}
			});

			this.datos = this.datos.filter((registro) => !ids.includes(registro.id));
			this.guardar();
			return eliminados;
		}

		restaurar(eliminados) {
			[...eliminados]
				.sort((a, b) => a.indice - b.indice)
				.forEach(({ registro, indice }) => this.datos.splice(indice, 0, registro));
			this.guardar();
		}

		restablecer() {
			this.datos = structuredClone(this.original);
			Almacen.borrar(`datos:${this.id}`);
		}

		reemplazar(datos) {
			this.datos = datos;
			this.guardar();
		}

		textoRegistro(registro) {
			if (!registro) {
				return "";
			}
			const claves = this.esquema.etiquetaRegistro || ["#id"];
			const partes = claves
				.map((clave) => (clave === "#id" ? `${capitalizar(this.singular)} #${registro.id}` : registro[clave]))
				.filter(Boolean);
			return partes.join(claves.includes("#id") ? " · " : " ");
		}

		/** Cifra destacada del panel: la definida en el esquema o la suma del primer campo moneda */
		metricaPanel() {
			const panel = this.esquema.panel;
			if (panel?.multiplicar) {
				const [a, b] = panel.multiplicar;
				const valor = this.datos.reduce((t, r) => t + (Number(r[a]) || 0) * (Number(r[b]) || 0), 0);
				return { etiqueta: panel.etiqueta, valor, campo: { formato: "moneda" } };
			}
			const moneda = this.campos.find((c) => c.formato === "moneda" && c.agregado !== "media");
			if (!moneda) { return null; }
			const valor = this.datos.reduce((t, r) => t + (Number(r[moneda.nombre]) || 0), 0);
			return { etiqueta: moneda.etiqueta, valor, campo: moneda };
		}
	}

	/* =========================================================
	   FICHA: letra con color calculado, o emoji si el JSON lo trae
	   ========================================================= */
	class FichaIU {
		static completar(elemento, texto, emoji) {
			const ficha = DOM.uno(".ficha", elemento);
			const etiqueta = DOM.uno(".etiqueta", elemento);

			if (emoji) {
				ficha.textContent = emoji;
				ficha.classList.add("emoji");
			} else {
				ficha.textContent = texto.charAt(0).toUpperCase();
				ficha.style.backgroundColor = Utilidades.colorTexto(texto); // backgroundColor, para no borrar el reflejo del CSS
			}

			etiqueta.textContent = texto;
			elemento.title = texto; // visible como tooltip cuando la columna está contraída
		}
	}

	/* =========================================================
	   ENRUTADOR: cada vista tiene su URL (#/modulo/vista/id)
	   ========================================================= */
	class Enrutador {
		static leer() {
			const [modulo = "inicio", vista = "", id = ""] = location.hash.replace(/^#\/?/, "").split("/");
			return { modulo, vista, id };
		}

		static ruta(modulo, vista, id) {
			return "#/" + [modulo, vista, id].filter((parte) => parte !== undefined && parte !== "").join("/");
		}

		static ir(modulo, vista, id) {
			location.hash = Enrutador.ruta(modulo, vista, id);
		}
	}

	/* =========================================================
	   COLUMNAS: minimizar, redimensionar y recordar el estado
	   ========================================================= */
	class GestorColumnas {
		constructor() {
			this.anchoMinimo = 150;
			this.anchoMaximo = 480;
			this.pasoTeclado = 16;
		}

		activar() {
			DOM.todos(".columna").forEach((columna) => this.restaurar(columna));
			this.activarMinimizacion();
			this.activarSeparadores();
		}

		restaurar(columna) {
			const guardado = Almacen.leer(`columna:${columna.id}`);
			const boton = DOM.uno(".minimizar", columna);

			if (!guardado) {
				return;
			}
			if (guardado.ancho) {
				this.fijarAncho(columna, guardado.ancho);
			}
			if (guardado.compacto) {
				columna.classList.add("compacto");
				this.actualizarBoton(boton, true);
			}
		}

		persistir(columna) {
			Almacen.guardar(`columna:${columna.id}`, {
				ancho: Number(columna.dataset.ancho) || null,
				compacto: columna.classList.contains("compacto")
			});
		}

		fijarAncho(columna, ancho) {
			columna.style.width = `${ancho}px`;
			columna.style.flexBasis = `${ancho}px`;
			columna.dataset.ancho = ancho;
		}

		actualizarBoton(boton, compacto) {
			boton.textContent = compacto ? "▶" : "◀";
			boton.title = compacto ? "Expandir columna" : "Minimizar columna";
			boton.setAttribute("aria-expanded", String(!compacto));
		}

		activarMinimizacion() {
			DOM.todos(".minimizar").forEach((boton) => {
				const columna = boton.closest(".columna");
				this.actualizarBoton(boton, columna.classList.contains("compacto"));
				boton.addEventListener("click", () => this.alternarColumna(columna, boton));
			});
		}

		alternarColumna(columna, boton) {
			const compacto = columna.classList.toggle("compacto");
			this.actualizarBoton(boton, compacto);
			this.persistir(columna);
		}

		activarSeparadores() {
			DOM.todos(".separador").forEach((separador) => {
				const columna = separador.previousElementSibling;

				separador.addEventListener("pointerdown", (evento) => this.iniciarRedimension(separador, columna, evento));

				// Accesible con teclado: flechas para cambiar el ancho
				separador.addEventListener("keydown", (evento) => {
					if (!["ArrowLeft", "ArrowRight"].includes(evento.key) || columna.classList.contains("compacto")) {
						return;
					}
					evento.preventDefault();
					const cambio = evento.key === "ArrowRight" ? this.pasoTeclado : -this.pasoTeclado;
					this.redimensionar(columna, columna.getBoundingClientRect().width + cambio);
					this.persistir(columna);
				});

				// Doble clic: vuelve al ancho por defecto
				separador.addEventListener("dblclick", () => {
					columna.style.width = "";
					columna.style.flexBasis = "";
					delete columna.dataset.ancho;
					this.persistir(columna);
				});
			});
		}

		redimensionar(columna, ancho) {
			const limitado = Math.round(Math.min(this.anchoMaximo, Math.max(this.anchoMinimo, ancho)));
			this.fijarAncho(columna, limitado);
			columna.nextElementSibling?.setAttribute("aria-valuenow", limitado);
		}

		iniciarRedimension(separador, columna, evento) {
			if (columna.classList.contains("compacto")) {
				return;
			}
			evento.preventDefault();

			const inicio = evento.clientX;
			const anchoInicial = columna.getBoundingClientRect().width;

			columna.style.transition = "none";
			document.body.classList.add("redimensionando");
			separador.classList.add("activo");
			separador.setPointerCapture(evento.pointerId);

			const mover = (movimiento) => this.redimensionar(columna, anchoInicial + movimiento.clientX - inicio);

			const terminar = () => {
				separador.removeEventListener("pointermove", mover);
				columna.style.transition = "";
				document.body.classList.remove("redimensionando");
				separador.classList.remove("activo");
				this.persistir(columna);
			};

			separador.addEventListener("pointermove", mover);
			separador.addEventListener("pointerup", terminar, { once: true });
			separador.addEventListener("pointercancel", terminar, { once: true });
		}
	}

	/* =========================================================
	   TABLA: ordenar, buscar, paginar, seleccionar, editar, borrar
	   ========================================================= */
	class TablaIU {
		constructor(app) {
			this.app = app;
			this.porPagina = 8;
			this.alCambiarSeleccion = null;
		}

		estadoDe(entidad) {
			this.app.estado.tablas[entidad.id] ??= {
				filtro: "",
				filtroCampo: "",
				orden: { campo: "id", sentido: 1 },
				pagina: 1,
				seleccion: new Set()
			};
			return this.app.estado.tablas[entidad.id];
		}

		static comparar(a, b, campo) {
			const x = a[campo.nombre];
			const y = b[campo.nombre];
			const vacio = (v) => v === undefined || v === null || v === "";

			if (vacio(x) && vacio(y)) { return 0; }
			if (vacio(x)) { return 1; }
			if (vacio(y)) { return -1; }
			if (typeof x === "number" && typeof y === "number") { return x - y; }
			if (typeof x === "boolean") { return Number(y) - Number(x); }
			return String(x).localeCompare(String(y), "es", { numeric: true, sensitivity: "base" });
		}

		filtrarYOrdenar(entidad) {
			const estado = this.estadoDe(entidad);
			const filtro = Utilidades.normalizar(estado.filtro.trim());
			const campoOrden = entidad.campos.find((c) => c.nombre === estado.orden.campo) || entidad.campos[0];

			const rapido = entidad.esquema.filtroRapido;

			return entidad.todos()
				.filter((registro) => !rapido || !estado.filtroCampo || registro[rapido] === estado.filtroCampo)
				.filter((registro) => {
					if (!filtro) { return true; }
					const texto = entidad.campos.map((c) => `${registro[c.nombre] ?? ""} ${Utilidades.formatear(registro[c.nombre], c)}`).join(" ");
					return Utilidades.normalizar(texto).includes(filtro);
				})
				.sort((a, b) => TablaIU.comparar(a, b, campoOrden) * estado.orden.sentido);
		}

		pintar(entidad, contenedor) {
			const estado = this.estadoDe(entidad);
			const campos = entidad.camposListado();
			const registros = this.filtrarYOrdenar(entidad);
			const resaltar = this.app.estado.resaltar;

			// Si venimos de guardar, saltar a la página donde está el registro
			if (resaltar?.entidad === entidad.id) {
				const posicion = registros.findIndex((r) => r.id === resaltar.id);
				if (posicion > -1) { estado.pagina = Math.floor(posicion / this.porPagina) + 1; }
			}

			const paginas = Math.max(1, Math.ceil(registros.length / this.porPagina));
			estado.pagina = Math.min(Math.max(1, estado.pagina), paginas);
			const desde = (estado.pagina - 1) * this.porPagina;
			const visibles = registros.slice(desde, desde + this.porPagina);

			// Limpiar de la selección los que ya no existen
			estado.seleccion.forEach((id) => { if (!entidad.buscar(id)) { estado.seleccion.delete(id); } });

			contenedor.innerHTML = "";

			const envoltorio = document.createElement("div");
			envoltorio.className = "contenedor-tabla";
			const tabla = document.createElement("table");

			tabla.append(
				this.crearCabecera(campos, estado, visibles),
				this.crearCuerpo(entidad, campos, visibles, estado),
				this.crearPie(campos, registros)
			);
			envoltorio.appendChild(tabla);
			contenedor.append(envoltorio, this.crearPaginacion(estado, registros.length, desde, visibles.length, paginas, entidad, contenedor));

			this.activarEventos(tabla, entidad, contenedor);
			this.alCambiarSeleccion?.(estado.seleccion.size);

			if (resaltar?.entidad === entidad.id) {
				const fila = DOM.uno(`tr[data-id="${resaltar.id}"]`, tabla);
				fila?.classList.add("recien");
				fila?.scrollIntoView({ block: "nearest" });
				this.app.estado.resaltar = null;
			}
		}

		crearCabecera(campos, estado, visibles) {
			const cabecera = document.createElement("thead");
			const fila = document.createElement("tr");
			const celdaSeleccion = document.createElement("th");
			const todos = document.createElement("input");

			todos.type = "checkbox";
			todos.dataset.accion = "seleccionar-todos";
			todos.setAttribute("aria-label", "Seleccionar todos los de esta página");
			todos.checked = visibles.length > 0 && visibles.every((r) => estado.seleccion.has(r.id));
			celdaSeleccion.className = "seleccion";
			celdaSeleccion.appendChild(todos);
			fila.appendChild(celdaSeleccion);

			campos.forEach((campo) => {
				const th = document.createElement("th");
				const activo = estado.orden.campo === campo.nombre;

				th.textContent = campo.etiqueta;
				th.dataset.campo = campo.nombre;
				th.className = "ordenable";
				th.tabIndex = 0;
				if (campo.tipo === "number") { th.classList.add("numero"); }
				if (campo.nombre === "id") { th.classList.add("col-id"); }
				if (activo) { th.classList.add(estado.orden.sentido === 1 ? "asc" : "desc"); }
				th.setAttribute("aria-sort", activo ? (estado.orden.sentido === 1 ? "ascending" : "descending") : "none");
				fila.appendChild(th);
			});

			const acciones = document.createElement("th");
			acciones.className = "acciones";
			acciones.innerHTML = '<span class="solo-lector">Acciones</span>';
			fila.appendChild(acciones);
			cabecera.appendChild(fila);
			return cabecera;
		}

		crearCuerpo(entidad, campos, visibles, estado) {
			const cuerpo = document.createElement("tbody");

			if (visibles.length === 0) {
				const fila = document.createElement("tr");
				const celda = document.createElement("td");
				celda.colSpan = campos.length + 2;
				celda.className = "vacio";
				celda.innerHTML = estado.filtro || estado.filtroCampo
					? "<strong>Sin resultados</strong>Prueba con otra búsqueda o pulsa Escape en el buscador para limpiarla."
					: `<strong>Todavía no hay registros</strong>Pulsa «+ Nuevo» o la tecla N para crear el primero.`;
				fila.appendChild(celda);
				cuerpo.appendChild(fila);
				return cuerpo;
			}

			visibles.forEach((registro) => {
				const fila = DOM.plantilla("tpl-fila");
				fila.dataset.id = registro.id;

				const celdaSeleccion = document.createElement("td");
				const casilla = document.createElement("input");
				casilla.type = "checkbox";
				casilla.dataset.accion = "seleccionar";
				casilla.checked = estado.seleccion.has(registro.id);
				casilla.setAttribute("aria-label", `Seleccionar ${entidad.textoRegistro(registro)}`);
				celdaSeleccion.className = "seleccion";
				celdaSeleccion.appendChild(casilla);
				fila.appendChild(celdaSeleccion);

				campos.forEach((campo) => {
					const celda = document.createElement("td");
					celda.appendChild(DecoracionIU.valor(entidad, registro, campo));
					if (campo.tipo === "number") { celda.classList.add("numero"); }
					if (campo.nombre === "id") { celda.classList.add("col-id"); }
					fila.appendChild(celda);
				});

				const acciones = document.createElement("td");
				acciones.className = "acciones";
				acciones.innerHTML = `
					<div class="botones-fila">
						<button class="boton" data-accion="editar" type="button" title="Editar">✎</button>
						<button class="boton" data-accion="borrar" type="button" title="Borrar">×</button>
					</div>`;
				DOM.uno("[data-accion=editar]", acciones).setAttribute("aria-label", `Editar ${entidad.textoRegistro(registro)}`);
				DOM.uno("[data-accion=borrar]", acciones).setAttribute("aria-label", `Borrar ${entidad.textoRegistro(registro)}`);
				fila.appendChild(acciones);
				cuerpo.appendChild(fila);
			});

			return cuerpo;
		}

		crearPie(campos, registros) {
			const pie = document.createElement("tfoot");
			const fila = document.createElement("tr");
			fila.appendChild(document.createElement("td"));

			campos.forEach((campo, indice) => {
				const celda = document.createElement("td");
				if (campo.formato === "moneda" && campo.agregado !== "media") {
					const suma = registros.reduce((total, r) => total + (Number(r[campo.nombre]) || 0), 0);
					celda.textContent = Utilidades.formatear(suma, campo);
					celda.classList.add("numero");
				} else if (indice === 0) {
					celda.textContent = `Total: ${registros.length}`;
				}
				fila.appendChild(celda);
			});

			const ultima = document.createElement("td");
			ultima.className = "acciones";
			fila.appendChild(ultima);
			pie.appendChild(fila);
			return pie;
		}

		crearPaginacion(estado, total, desde, cantidad, paginas, entidad, contenedor) {
			const barra = document.createElement("div");
			const texto = document.createElement("span");
			const botones = document.createElement("div");

			barra.className = "paginacion";
			texto.textContent = total ? `Mostrando ${desde + 1}–${desde + cantidad} de ${total}` : "";
			botones.className = "fila-botones";

			[["‹ Anterior", -1], ["Siguiente ›", 1]].forEach(([etiqueta, paso]) => {
				const boton = document.createElement("button");
				boton.type = "button";
				boton.className = "boton pequeno";
				boton.textContent = etiqueta;
				boton.disabled = (paso < 0 && estado.pagina === 1) || (paso > 0 && estado.pagina === paginas);
				boton.addEventListener("click", () => {
					estado.pagina += paso;
					this.pintar(entidad, contenedor);
				});
				botones.appendChild(boton);
			});

			barra.append(texto, botones);
			return barra;
		}

		activarEventos(tabla, entidad, contenedor) {
			const estado = this.estadoDe(entidad);

			const ordenar = (th) => {
				estado.orden.sentido = estado.orden.campo === th.dataset.campo ? -estado.orden.sentido : 1;
				estado.orden.campo = th.dataset.campo;
				this.pintar(entidad, contenedor);
				DOM.uno(`th[data-campo="${th.dataset.campo}"]`, contenedor)?.focus();
			};

			// Delegación de eventos: un único listener para toda la tabla
			tabla.addEventListener("click", (evento) => {
				const th = evento.target.closest("th.ordenable");
				const boton = evento.target.closest("button[data-accion]");
				const fila = evento.target.closest("tr[data-id]");

				if (th) { ordenar(th); return; }
				if (!fila) { return; }

				const id = Number(fila.dataset.id);

				// Pulsar la fila (fuera de botones y casillas) abre el panel de detalle
				if (!boton) {
					if (!evento.target.closest("input,a")) { this.app.detalle.abrir(entidad, entidad.buscar(id)); }
					return;
				}
				if (boton.dataset.accion === "editar") { Enrutador.ir(entidad.id, "editar", id); }
				if (boton.dataset.accion === "borrar") { this.app.borrarRegistros(entidad, [id]); }
			});

			tabla.addEventListener("keydown", (evento) => {
				const th = evento.target.closest("th.ordenable");
				if (th && (evento.key === "Enter" || evento.key === " ")) {
					evento.preventDefault();
					ordenar(th);
				}
			});

			tabla.addEventListener("dblclick", (evento) => {
				const fila = evento.target.closest("tr[data-id]");
				if (fila && !evento.target.closest("button,input")) {
					Enrutador.ir(entidad.id, "editar", fila.dataset.id);
				}
			});

			tabla.addEventListener("change", (evento) => {
				const casilla = evento.target;

				if (casilla.dataset.accion === "seleccionar") {
					const id = Number(casilla.closest("tr").dataset.id);
					casilla.checked ? estado.seleccion.add(id) : estado.seleccion.delete(id);
				}
				if (casilla.dataset.accion === "seleccionar-todos") {
					DOM.todos("tbody input[data-accion=seleccionar]", tabla).forEach((otra) => {
						otra.checked = casilla.checked;
						const id = Number(otra.closest("tr").dataset.id);
						casilla.checked ? estado.seleccion.add(id) : estado.seleccion.delete(id);
					});
				}
				this.alCambiarSeleccion?.(estado.seleccion.size);
			});
		}
	}

	/* =========================================================
	   FORMULARIO: generado desde el esquema, con validación
	   ========================================================= */
	class FormularioIU {
		constructor(app) {
			this.app = app;
		}

		opcionesDe(campo) {
			if (campo.origen) {
				const origen = this.app.entidades[campo.origen];
				return origen ? origen.todos().map((r) => campo.mostrar.map((m) => r[m]).join(" ")) : [];
			}
			return campo.opciones || [];
		}

		crear(esquema, registro, { alGuardar, alCancelar, textoGuardar = "Guardar", vigilarCambios = true }) {
			const formulario = DOM.plantilla("tpl-formulario");
			const rejilla = DOM.uno(".form-rejilla", formulario);

			esquema.campos.forEach((campo) => {
				if (campo.nombre === "id" && !registro) { return; }
				rejilla.appendChild(this.crearCampo(campo, registro));
			});

			DOM.uno("[data-accion=guardar]", formulario).textContent = textoGuardar;
			this.activarCalculos(esquema, formulario);

			formulario.addEventListener("input", (evento) => {
				if (vigilarCambios) { this.app.estado.sucio = true; }
				const campo = evento.target.closest(".campo");
				if (campo && formulario.dataset.intentado) { this.validarCampo(campo); }
			});

			formulario.addEventListener("focusout", (evento) => {
				const campo = evento.target.closest(".campo");
				if (campo && evento.target.value) { this.validarCampo(campo); }
			});

			formulario.addEventListener("submit", (evento) => {
				evento.preventDefault();
				formulario.dataset.intentado = "si";

				const invalidos = DOM.todos(".campo", formulario).filter((campo) => !this.validarCampo(campo));
				if (invalidos.length) {
					DOM.uno("input,select,textarea", invalidos[0]).focus();
					this.app.toast.aviso("Revisa el formulario", `Hay ${invalidos.length} ${invalidos.length === 1 ? "campo" : "campos"} por corregir.`);
					return;
				}

				alGuardar(this.leer(formulario, esquema.campos));
			});

			DOM.uno("[data-accion=cancelar]", formulario).addEventListener("click", () => alCancelar?.());

			return formulario;
		}

		crearCampo(campo, registro) {
			const etiqueta = document.createElement("label");
			const texto = document.createElement("span");
			const error = document.createElement("span");
			let control;

			etiqueta.className = "campo";
			texto.textContent = campo.etiqueta;
			if (campo.requerido) {
				const marca = document.createElement("span");
				marca.className = "obligatorio";
				marca.textContent = " *";
				marca.setAttribute("aria-hidden", "true");
				texto.appendChild(marca);
			}

			if (campo.tipo === "select") {
				control = document.createElement("select");
				const opciones = this.opcionesDe(campo);
				const actual = registro?.[campo.nombre];

				control.add(new Option("Selecciona…", ""));
				opciones.forEach((opcion) => control.add(new Option(opcion)));
				// Si el valor guardado ya no existe (p. ej. un cliente borrado), se conserva igualmente
				if (actual && !opciones.includes(actual)) { control.add(new Option(`${actual} (no disponible)`, actual)); }
			} else if (campo.tipo === "textarea") {
				control = document.createElement("textarea");
				etiqueta.classList.add("form-completo");
			} else {
				control = document.createElement("input");
				control.type = campo.tipo;
				if (campo.paso !== undefined) { control.step = campo.paso; }
				if (campo.min !== undefined) { control.min = campo.min; }
				if (campo.patron) { control.pattern = campo.patron; }
				if (campo.tipo === "url") { control.placeholder = "https://"; }
				if (campo.tipo === "email") { control.autocomplete = "email"; }
			}

			control.name = campo.nombre;
			control.required = Boolean(campo.requerido);
			control.readOnly = campo.nombre === "id" || Boolean(campo.soloLectura);
			if (campo.soloLectura && campo.calculo) { control.title = "Se calcula automáticamente"; }

			const hoy = new Date().toISOString().slice(0, 10);
			const valor = registro ? registro[campo.nombre] : (campo.defecto === "hoy" ? hoy : campo.defecto);

			if (valor !== undefined) {
				if (campo.tipo === "checkbox") {
					control.checked = Boolean(valor);
				} else {
					control.value = valor ?? "";
				}
			}

			if (campo.tipo === "checkbox") {
				etiqueta.classList.add("campo-check");
				etiqueta.append(control, texto);
				return etiqueta;
			}

			error.className = "error";
			error.id = `error-${campo.nombre}`;
			error.setAttribute("aria-live", "polite");
			control.setAttribute("aria-describedby", error.id);
			etiqueta.append(texto, control, error);
			return etiqueta;
		}

		validarCampo(campo) {
			const control = DOM.uno("input,select,textarea", campo);
			const error = DOM.uno(".error", campo);

			if (!error) { return true; }

			const v = control.validity;
			let mensaje = "";

			if (v.valueMissing) { mensaje = "Este campo es obligatorio."; }
			else if (v.typeMismatch && control.type === "email") { mensaje = "Escribe un email válido, como nombre@dominio.com."; }
			else if (v.typeMismatch && control.type === "url") { mensaje = "Escribe la dirección completa, empezando por https://."; }
			else if (v.typeMismatch) { mensaje = "El formato no es válido."; }
			else if (v.patternMismatch) { mensaje = "Usa solo números, espacios o +, entre 9 y 15 caracteres."; }
			else if (v.badInput) { mensaje = "Escribe un número."; }
			else if (v.rangeUnderflow) { mensaje = `El valor mínimo es ${control.min}.`; }
			else if (v.stepMismatch) { mensaje = "Usa como máximo dos decimales."; }

			error.textContent = mensaje;
			campo.classList.toggle("invalido", Boolean(mensaje));
			control.setAttribute("aria-invalid", String(Boolean(mensaje)));
			return !mensaje;
		}

		leer(formulario, campos) {
			const datos = {};

			campos.forEach((campo) => {
				const control = formulario.elements[campo.nombre];
				if (!control || campo.nombre === "id") { return; }

				if (campo.tipo === "checkbox") { datos[campo.nombre] = control.checked; }
				else if (campo.tipo === "number") { datos[campo.nombre] = control.value === "" ? null : Number(control.value); }
				else { datos[campo.nombre] = control.value.trim(); }
			});

			return datos;
		}

		/** Campos calculados, p. ej. total = unidades × precio del producto elegido */
		activarCalculos(esquema, formulario) {
			esquema.campos.filter((campo) => campo.calculo).forEach((campo) => {
				const calculo = campo.calculo;
				const cantidad = formulario.elements[calculo.cantidad];
				const referencia = formulario.elements[calculo.referencia];
				const resultado = formulario.elements[campo.nombre];
				const campoReferencia = esquema.campos.find((c) => c.nombre === calculo.referencia);
				const origen = this.app.entidades[calculo.origen];

				if (!cantidad || !referencia || !resultado || !origen) { return; }

				const recalcular = () => {
					const elegido = origen.todos().find((r) => campoReferencia.mostrar.map((m) => r[m]).join(" ") === referencia.value);
					const precio = Number(elegido?.[calculo.precio]);
					if (elegido && cantidad.value) {
						resultado.value = (precio * Number(cantidad.value)).toFixed(2);
					}
				};

				cantidad.addEventListener("input", recalcular);
				referencia.addEventListener("change", recalcular);
			});
		}
	}

	/* =========================================================
	   RESUMEN: cifras y gráficos de barras generados del esquema
	   ========================================================= */
	class ResumenIU {
		static animarCifra(elemento, final, formatear = (n) => Math.round(n).toLocaleString("es-ES")) {
			if (movimientoReducido() || !Number.isFinite(final)) {
				elemento.textContent = formatear(final);
				return;
			}
			const inicio = performance.now();
			const duracion = 700;
			const paso = (ahora) => {
				const progreso = Math.min(1, (ahora - inicio) / duracion);
				const suavizado = 1 - Math.pow(1 - progreso, 3);
				elemento.textContent = formatear(final * suavizado);
				if (progreso < 1) { requestAnimationFrame(paso); }
			};
			requestAnimationFrame(paso);
		}

		static tarjetaCifra(titulo, valor, formatear, detalle = "") {
			const tarjeta = document.createElement("article");
			const h3 = document.createElement("h3");
			const cifra = document.createElement("p");
			const texto = document.createElement("p");

			tarjeta.className = "tarjeta";
			h3.textContent = titulo;
			cifra.className = "cifra";
			texto.textContent = detalle;
			tarjeta.append(h3, cifra);
			if (detalle) { tarjeta.appendChild(texto); }
			ResumenIU.animarCifra(cifra, valor, formatear);
			return tarjeta;
		}

		static tarjetaBarras(titulo, conteo, colores = null) {
			const tarjeta = document.createElement("article");
			const h3 = document.createElement("h3");
			const barras = document.createElement("div");
			const maximo = Math.max(1, ...Object.values(conteo));

			tarjeta.className = "tarjeta";
			h3.textContent = titulo;
			barras.className = "barras";

			Object.entries(conteo)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 6)
				.forEach(([etiqueta, valor]) => {
					const barra = document.createElement("div");
					barra.className = "barra";
					barra.innerHTML = '<span class="nombre"></span><div class="pista"><div class="relleno"></div></div><span class="valor"></span>';
					DOM.uno(".nombre", barra).textContent = etiqueta;
					DOM.uno(".valor", barra).textContent = valor;
					barra.title = `${etiqueta}: ${valor}`;
					const relleno = DOM.uno(".relleno", barra);
					if (colores?.[etiqueta] !== undefined) { relleno.style.setProperty("--h", colores[etiqueta]); relleno.classList.add("con-color"); }
					requestAnimationFrame(() => requestAnimationFrame(() => { relleno.style.width = `${(valor / maximo) * 100}%`; }));
					barras.appendChild(barra);
				});

			tarjeta.append(h3, barras);
			return tarjeta;
		}

		pintar(entidad, contenedor) {
			const registros = entidad.todos();
			const cifras = document.createElement("div");
			const graficos = document.createElement("div");

			cifras.className = "rejilla";
			graficos.className = "rejilla";
			graficos.style.marginTop = "var(--relleno)";

			cifras.appendChild(ResumenIU.tarjetaCifra(capitalizar(entidad.titulo.toLowerCase()), registros.length, undefined, "registros en total"));

			if (entidad.esquema.panel) {
				const metrica = entidad.metricaPanel();
				cifras.appendChild(ResumenIU.tarjetaCifra(metrica.etiqueta, metrica.valor, (n) => Utilidades.formatear(n, metrica.campo), "precio × existencias"));
			}

			entidad.campos.forEach((campo) => {
				if (campo.formato === "moneda" && campo.agregado === "media") {
					const valores = registros.map((r) => Number(r[campo.nombre]) || 0);
					const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
					cifras.appendChild(ResumenIU.tarjetaCifra(`${campo.etiqueta} medio`, media, (n) => Utilidades.formatear(n, campo),
						valores.length ? `De ${Utilidades.formatear(Math.min(...valores), campo)} a ${Utilidades.formatear(Math.max(...valores), campo)}` : ""));
				} else if (campo.formato === "moneda") {
					const suma = registros.reduce((t, r) => t + (Number(r[campo.nombre]) || 0), 0);
					const media = registros.length ? suma / registros.length : 0;
					cifras.appendChild(ResumenIU.tarjetaCifra(/total/i.test(campo.etiqueta) ? "Importe total" : `${campo.etiqueta} total`, suma,
						(n) => Utilidades.formatear(n, campo), `Media: ${Utilidades.formatear(media, campo)}`));
				}
				if (campo.tipo === "checkbox") {
					const si = registros.filter((r) => r[campo.nombre]).length;
					const porcentaje = registros.length ? (si / registros.length) * 100 : 0;
					cifras.appendChild(ResumenIU.tarjetaCifra(campo.etiqueta, porcentaje,
						(n) => `${Math.round(n)} %`, `${si} de ${registros.length}`));
				}
				if (campo.tipo === "select") {
					const conteo = {};
					registros.forEach((r) => {
						const valor = r[campo.nombre] || "Sin indicar";
						conteo[valor] = (conteo[valor] || 0) + 1;
					});
					graficos.appendChild(ResumenIU.tarjetaBarras(`Por ${campo.etiqueta.toLowerCase()}`, conteo, campo.colores));
				}
			});

			contenedor.append(cifras, graficos);
		}
	}

	/* =========================================================
	   PALETA DE COMANDOS (Ctrl + K)
	   ========================================================= */
	class PaletaIU {
		constructor(app) {
			this.app = app;
			this.dialogo = null;
			this.indice = 0;
			this.resultados = [];
		}

		comandos() {
			const app = this.app;
			const lista = [];

			app.estado.menu.forEach((modulo) => {
				app.vistasDe(modulo).forEach((vista) => {
					lista.push({
						grupo: "Ir a", emoji: vista.emoji,
						texto: `${modulo.texto} › ${vista.texto}`,
						ejecutar: () => Enrutador.ir(modulo.id, vista.id)
					});
				});
			});

			Object.values(app.entidades).forEach((entidad) => {
				lista.push({
					grupo: "Acción", emoji: "➕",
					texto: `Nuevo ${entidad.singular}`,
					ejecutar: () => Enrutador.ir(entidad.id, "nuevo")
				});
			});

			lista.push(
				{ grupo: "Acción", emoji: "🌓", texto: "Cambiar entre modo claro y oscuro", ejecutar: () => app.alternarModo() },
				{ grupo: "Acción", emoji: "🚪", texto: "Cerrar sesión", ejecutar: () => app.cerrarSesion() }
			);

			Object.values(app.entidades).forEach((entidad) => {
				entidad.todos().forEach((registro) => {
					lista.push({
						grupo: entidad.titulo, emoji: "·",
						texto: entidad.textoRegistro(registro),
						extra: Object.values(registro).join(" "),
						ejecutar: () => Enrutador.ir(entidad.id, "editar", registro.id)
					});
				});
			});

			return lista;
		}

		abrir() {
			if (this.dialogo?.open) { return; }

			this.dialogo = DOM.plantilla("tpl-paleta");
			this.todos = this.comandos();
			const entrada = DOM.uno("input", this.dialogo);

			entrada.addEventListener("input", () => { this.indice = 0; this.filtrar(entrada.value); });
			entrada.addEventListener("keydown", (evento) => this.teclado(evento));
			this.dialogo.addEventListener("close", () => this.dialogo.remove());
			this.dialogo.addEventListener("click", (evento) => {
				if (evento.target === this.dialogo) { this.dialogo.close(); }
				const opcion = evento.target.closest("li[data-indice]");
				if (opcion) { this.ejecutar(Number(opcion.dataset.indice)); }
			});

			document.body.appendChild(this.dialogo);
			this.dialogo.showModal();
			this.filtrar("");
			entrada.focus();
		}

		filtrar(texto) {
			const consulta = Utilidades.normalizar(texto.trim());
			const lista = DOM.uno("ul", this.dialogo);

			this.resultados = this.todos
				.filter((c) => !consulta || Utilidades.normalizar(`${c.texto} ${c.grupo} ${c.extra || ""}`).includes(consulta))
				.slice(0, consulta ? 12 : 9);

			lista.innerHTML = "";

			if (!this.resultados.length) {
				const vacio = document.createElement("li");
				vacio.className = "paleta-vacia";
				vacio.textContent = "Nada coincide con esa búsqueda.";
				lista.appendChild(vacio);
				return;
			}

			this.resultados.forEach((comando, indice) => {
				const opcion = document.createElement("li");
				opcion.dataset.indice = indice;
				opcion.id = `paleta-opcion-${indice}`;
				opcion.setAttribute("role", "option");
				opcion.innerHTML = '<span class="paleta-emoji"></span><span class="paleta-texto"></span><span class="paleta-grupo"></span>';
				DOM.uno(".paleta-emoji", opcion).textContent = comando.emoji;
				DOM.uno(".paleta-texto", opcion).textContent = comando.texto;
				DOM.uno(".paleta-grupo", opcion).textContent = comando.grupo;
				lista.appendChild(opcion);
			});

			this.marcar();
		}

		marcar() {
			DOM.todos("li[data-indice]", this.dialogo).forEach((opcion, i) => {
				opcion.classList.toggle("seleccionado", i === this.indice);
				opcion.setAttribute("aria-selected", String(i === this.indice));
				if (i === this.indice) { opcion.scrollIntoView({ block: "nearest" }); }
			});
			DOM.uno("input", this.dialogo).setAttribute("aria-activedescendant", `paleta-opcion-${this.indice}`);
		}

		teclado(evento) {
			const total = this.resultados.length;
			if (evento.key === "ArrowDown" && total) { evento.preventDefault(); this.indice = (this.indice + 1) % total; this.marcar(); }
			if (evento.key === "ArrowUp" && total) { evento.preventDefault(); this.indice = (this.indice - 1 + total) % total; this.marcar(); }
			if (evento.key === "Enter" && total) { evento.preventDefault(); this.ejecutar(this.indice); }
		}

		ejecutar(indice) {
			const comando = this.resultados[indice];
			this.dialogo.close();
			comando?.ejecutar();
		}
	}


	/* =========================================================
	   DECORACIÓN: pastillas de color y avatares con iniciales
	   ========================================================= */
	class DecoracionIU {
		static pastilla(texto, tono) {
			const pastilla = document.createElement("span");
			pastilla.className = "pastilla";
			pastilla.style.setProperty("--h", tono ?? 220);
			pastilla.textContent = texto;
			return pastilla;
		}

		static avatar(texto, grande = false) {
			const avatar = document.createElement("span");
			const partes = texto.trim().split(/\s+/);
			avatar.className = grande ? "avatar grande" : "avatar";
			avatar.textContent = (partes[0]?.[0] || "") + (partes[1]?.[0] || "");
			avatar.style.backgroundColor = Utilidades.colorTexto(texto);
			avatar.setAttribute("aria-hidden", "true");
			return avatar;
		}

		/** Devuelve el nodo que representa un valor según su campo (tabla y panel de detalle) */
		static valor(entidad, registro, campo, enlaces = false) {
			const valor = registro[campo.nombre];

			if (campo.tipo === "checkbox") {
				const insignia = document.createElement("span");
				insignia.className = `insignia ${valor ? "si" : "no"}`;
				insignia.textContent = Utilidades.formatear(valor, campo);
				return insignia;
			}
			if (campo.colores && valor) {
				return DecoracionIU.pastilla(valor, campo.colores[valor]);
			}
			if (entidad.esquema.avatar?.[0] === campo.nombre) {
				const envoltorio = document.createElement("span");
				const nombre = entidad.textoRegistro(registro);
				envoltorio.className = "con-avatar";
				envoltorio.append(DecoracionIU.avatar(nombre), nombre);
				return envoltorio;
			}
			if (enlaces && valor && (campo.tipo === "email" || campo.tipo === "url")) {
				const enlace = document.createElement("a");
				enlace.href = campo.tipo === "email" ? `mailto:${valor}` : valor;
				enlace.textContent = valor;
				if (campo.tipo === "url") { enlace.target = "_blank"; enlace.rel = "noopener"; }
				return enlace;
			}
			return document.createTextNode(Utilidades.formatear(valor, campo));
		}
	}

	/* =========================================================
	   GRÁFICOS SVG generados a mano (sin librerías)
	   ========================================================= */
	class GraficoIU {
		static contador = 0;

		/** Gráfico de área con curva suave */
		static lineas(datos, formatear) {
			const ancho = 600, alto = 220, margen = { x: 16, arriba: 18, abajo: 30 };
			const maximo = Math.max(1, ...datos.map((d) => d.valor)) * 1.15;
			const paso = (ancho - margen.x * 2) / Math.max(1, datos.length - 1);
			const x = (i) => margen.x + i * paso;
			const y = (v) => margen.arriba + (alto - margen.arriba - margen.abajo) * (1 - v / maximo);
			const puntos = datos.map((d, i) => [x(i), y(d.valor)]);
			const id = `grad-${++GraficoIU.contador}`;

			// Curva de Catmull-Rom convertida a Bézier: pasa por todos los puntos sin picos
			let curva = `M${puntos[0][0]},${puntos[0][1]}`;
			for (let i = 0; i < puntos.length - 1; i++) {
				const p0 = puntos[i - 1] || puntos[i], p1 = puntos[i], p2 = puntos[i + 1], p3 = puntos[i + 2] || p2;
				const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
				const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
				curva += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
			}
			const base = alto - margen.abajo;
			const area = `${curva} L${puntos.at(-1)[0]},${base} L${puntos[0][0]},${base} Z`;
			const rejilla = [0.25, 0.5, 0.75].map((f) => `<line x1="${margen.x}" x2="${ancho - margen.x}" y1="${y(maximo * f)}" y2="${y(maximo * f)}" class="grafico-rejilla"/>`).join("");
			const etiquetas = datos.map((d, i) => `<text x="${x(i)}" y="${alto - 8}" text-anchor="middle" class="grafico-etiqueta"></text>`).join("");
			const circulos = datos.map((d, i) => `<circle cx="${puntos[i][0]}" cy="${puntos[i][1]}" r="4.5" class="grafico-punto"><title></title></circle>`).join("");

			const contenedor = document.createElement("div");
			contenedor.className = "grafico";
			contenedor.innerHTML = `
				<svg viewBox="0 0 ${ancho} ${alto}" role="img" preserveAspectRatio="none">
					<defs>
						<linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0" class="grafico-degradado-alto"/>
							<stop offset="1" class="grafico-degradado-bajo"/>
						</linearGradient>
					</defs>
					${rejilla}
					<path d="${area}" fill="url(#${id})" class="grafico-area"/>
					<path d="${curva}" class="grafico-linea" pathLength="1"/>
					${circulos}
					${etiquetas}
				</svg>`;

			// Los textos se ponen con textContent: nunca se interpolan en el HTML
			DOM.todos(".grafico-etiqueta", contenedor).forEach((t, i) => { t.textContent = datos[i].etiqueta; });
			DOM.todos(".grafico-punto title", contenedor).forEach((t, i) => { t.textContent = `${datos[i].etiqueta}: ${formatear(datos[i].valor)}`; });
			DOM.uno("svg", contenedor).setAttribute("aria-label", datos.map((d) => `${d.etiqueta} ${formatear(d.valor)}`).join(", "));
			return contenedor;
		}

		/** Donut con leyenda */
		static donut(conteo, colores = {}) {
			const entradas = Object.entries(conteo).filter(([, v]) => v > 0);
			const total = entradas.reduce((t, [, v]) => t + v, 0);
			const radio = 54, circunferencia = 2 * Math.PI * radio;
			let acumulado = 0;

			const segmentos = entradas.map(([etiqueta, valor]) => {
				const longitud = (valor / total) * circunferencia;
				const segmento = `<circle r="${radio}" cx="70" cy="70" class="donut-segmento" style="--h:${colores[etiqueta] ?? 220}"
					stroke-dasharray="${Math.max(0, longitud - 3)} ${circunferencia}" stroke-dashoffset="${-acumulado}"><title></title></circle>`;
				acumulado += longitud;
				return segmento;
			}).join("");

			const contenedor = document.createElement("div");
			contenedor.className = "donut";
			contenedor.innerHTML = `
				<svg viewBox="0 0 140 140" role="img">
					<circle r="${radio}" cx="70" cy="70" class="donut-pista"/>
					<g transform="rotate(-90 70 70)">${segmentos}</g>
					<text x="70" y="68" text-anchor="middle" class="donut-total">${total}</text>
					<text x="70" y="86" text-anchor="middle" class="donut-rotulo">en total</text>
				</svg>
				<ul class="leyenda"></ul>`;

			DOM.todos(".donut-segmento title", contenedor).forEach((t, i) => { t.textContent = `${entradas[i][0]}: ${entradas[i][1]}`; });
			entradas.forEach(([etiqueta, valor]) => {
				const li = document.createElement("li");
				li.style.setProperty("--h", colores[etiqueta] ?? 220);
				li.innerHTML = '<span class="leyenda-punto"></span><span class="leyenda-texto"></span><span class="leyenda-valor"></span>';
				DOM.uno(".leyenda-texto", li).textContent = etiqueta;
				DOM.uno(".leyenda-valor", li).textContent = `${valor} · ${Math.round((valor / total) * 100)} %`;
				DOM.uno(".leyenda", contenedor).appendChild(li);
			});
			DOM.uno("svg", contenedor).setAttribute("aria-label", entradas.map(([e, v]) => `${e}: ${v}`).join(", "));
			return contenedor;
		}
	}

	/* =========================================================
	   PANEL DE DETALLE: ficha lateral con registros relacionados
	   ========================================================= */
	class PanelDetalleIU {
		constructor(app) {
			this.app = app;
			this.capa = null;
			this.focoAnterior = null;
		}

		/** Busca en las demás entidades los registros que apuntan a este (campos con "origen") */
		relacionados(entidad, registro) {
			const grupos = [];

			Object.values(this.app.entidades).forEach((otra) => {
				otra.campos.filter((campo) => campo.origen === entidad.id).forEach((campo) => {
					const valor = campo.mostrar.map((m) => registro[m]).join(" ");
					const registros = otra.todos().filter((r) => r[campo.nombre] === valor);
					if (registros.length) { grupos.push({ entidad: otra, registros }); }
				});
			});

			return grupos;
		}

		abrir(entidad, registro) {
			this.cerrar(true);
			this.focoAnterior = document.activeElement;

			const capa = DOM.plantilla("tpl-detalle");
			const panel = DOM.uno(".detalle", capa);
			const identidad = DOM.uno(".detalle-avatar", capa);
			const modulo = this.app.modulo(entidad.id);
			const nombre = entidad.textoRegistro(registro);

			if (entidad.esquema.avatar) {
				identidad.replaceWith(DecoracionIU.avatar(nombre, true));
			} else {
				identidad.textContent = modulo.emoji;
			}
			DOM.uno("h2", capa).textContent = nombre;
			DOM.uno(".detalle-cabecera p", capa).textContent = `${capitalizar(entidad.singular)} · ID ${registro.id}`;

			const lista = DOM.uno(".detalle-campos", capa);
			entidad.campos.filter((c) => c.nombre !== "id").forEach((campo) => {
				const dt = document.createElement("dt");
				const dd = document.createElement("dd");
				dt.textContent = campo.etiqueta;
				const valor = entidad.esquema.avatar?.[0] === campo.nombre
					? document.createTextNode(registro[campo.nombre] ?? "—")
					: DecoracionIU.valor(entidad, registro, campo, true);
				dd.appendChild(valor);
				if (campo.tipo === "textarea") { dt.classList.add("completo"); dd.classList.add("completo"); }
				lista.append(dt, dd);
			});

			this.relacionados(entidad, registro).forEach(({ entidad: otra, registros }) => {
				const seccion = document.createElement("section");
				const titulo = document.createElement("h3");
				const ul = document.createElement("ul");
				const moneda = otra.campos.find((c) => c.formato === "moneda" && c.agregado !== "media");
				const color = otra.campos.find((c) => c.colores);

				titulo.textContent = `${otra.titulo} (${registros.length})`;
				if (moneda) {
					const suma = registros.reduce((t, r) => t + (Number(r[moneda.nombre]) || 0), 0);
					const total = document.createElement("span");
					total.textContent = Utilidades.formatear(suma, moneda);
					titulo.appendChild(total);
				}

				registros.slice(0, 6).forEach((r) => {
					const li = document.createElement("li");
					const enlace = document.createElement("a");
					const texto = document.createElement("span");
					enlace.href = Enrutador.ruta(otra.id, "editar", r.id);
					texto.className = "relacion-texto";
					texto.textContent = otra.textoRegistro(r);
					enlace.appendChild(texto);
					if (color && r[color.nombre]) { enlace.appendChild(DecoracionIU.pastilla(r[color.nombre], color.colores[r[color.nombre]])); }
					if (moneda) {
						const importe = document.createElement("span");
						importe.className = "relacion-importe";
						importe.textContent = Utilidades.formatear(r[moneda.nombre], moneda);
						enlace.appendChild(importe);
					}
					li.appendChild(enlace);
					ul.appendChild(li);
				});

				seccion.append(titulo, ul);
				DOM.uno(".detalle-relaciones", capa).appendChild(seccion);
			});

			DOM.uno("[data-accion=editar]", capa).addEventListener("click", () => Enrutador.ir(entidad.id, "editar", registro.id));
			DOM.uno("[data-accion=borrar]", capa).addEventListener("click", () => {
				this.cerrar();
				this.app.borrarRegistros(entidad, [registro.id]);
			});
			DOM.uno("[data-accion=cerrar]", capa).addEventListener("click", () => this.cerrar());
			capa.addEventListener("click", (evento) => { if (evento.target === capa) { this.cerrar(); } });
			panel.addEventListener("keydown", (evento) => {
				if (evento.key === "Escape") { evento.stopPropagation(); this.cerrar(); }
				// Mantener el foco dentro del panel (patrón de diálogo modal)
				if (evento.key === "Tab") {
					const enfocables = DOM.todos("a[href],button:not([disabled])", panel);
					const primero = enfocables[0], ultimo = enfocables.at(-1);
					if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
					if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
				}
			});

			document.body.appendChild(capa);
			this.capa = capa;
			requestAnimationFrame(() => capa.classList.add("abierta"));
			DOM.uno("[data-accion=cerrar]", capa).focus();
		}

		cerrar(inmediato = false) {
			if (!this.capa) { return; }
			const capa = this.capa;
			this.capa = null;

			if (inmediato) {
				capa.remove();
				return;
			}
			capa.classList.remove("abierta");
			setTimeout(() => capa.remove(), 320);
			this.focoAnterior?.focus?.();
		}
	}

	/* =========================================================
	   APLICACIÓN
	   ========================================================= */
	class AplicacionIU {
		constructor() {
			this.estado = {
				menu: [],
				vistas: {},
				sesion: null,
				tablas: {},
				sucio: false,
				rutaActual: "",
				resaltar: null
			};
			this.entidades = {};
			this.toast = new ToastIU();
			this.columnas = new GestorColumnas();
			this.tabla = new TablaIU(this);
			this.formulario = new FormularioIU(this);
			this.resumen = new ResumenIU();
			this.paleta = new PaletaIU(this);
			this.detalle = new PanelDetalleIU(this);
		}

		async iniciar() {
			this.estado.sesion = Sesion.actual();

			if (!this.estado.sesion) {
				location.replace("login.html");
				return;
			}

			this.pintarUsuario();
			this.actualizarBotonModo();
			this.pintarEsqueleto();

			try {
				[this.estado.menu, this.estado.vistas] = await Promise.all([
					OrigenDatos.cargarJSON("data/menu.json"),
					OrigenDatos.cargarJSON("data/vistas.json")
				]);

				const modulosDatos = this.estado.menu.filter((modulo) => modulo.tipo === "datos");
				const esquemas = await Promise.all(modulosDatos.map((modulo) => OrigenDatos.cargarJSON(modulo.origen)));
				modulosDatos.forEach((modulo, i) => { this.entidades[modulo.id] = new Entidad(modulo.id, esquemas[i]); });
			} catch (error) {
				this.pintarErrorCarga(error);
				return;
			}

			this.pintarMenu();
			this.columnas.activar();
			this.activarEventos();

			if (!location.hash) {
				history.replaceState(null, "", Enrutador.ruta("inicio", "panel"));
			}
			this.navegar();

			// Saludo solo la primera vez en cada sesión del navegador
			try {
				if (!sessionStorage.getItem("serena-iu:saludo")) {
					sessionStorage.setItem("serena-iu:saludo", "si");
					this.toast.info(`Hola, ${this.estado.sesion.nombre.split(" ")[0]}`, "Pulsa Ctrl + K para buscar o ir a cualquier parte.");
				}
			} catch (error) {}
		}

		/** Tarjetas grises con brillo mientras llegan los datos */
		pintarEsqueleto() {
			const bloques = '<div class="esqueleto esq-titulo"></div><div class="esqueleto esq-subtitulo"></div>'
				+ '<div class="rejilla">' + '<div class="esqueleto esq-tarjeta"></div>'.repeat(3) + '</div>'
				+ '<div class="esqueleto esq-bloque"></div>';
			DOM.uno("#escenario").innerHTML = bloques;
		}

		pintarErrorCarga(error) {
			const escenario = DOM.uno("#escenario");
			escenario.innerHTML = `
				<article class="tarjeta">
					<h3>No se pudieron cargar los datos</h3>
					<p>El navegador bloquea <code>fetch</code> cuando abres el archivo con doble clic. Sirve la carpeta por HTTP, por ejemplo con <code>python3 -m http.server 8000</code> o con Live Server de VS Code, y abre <code>http://localhost:8000</code>.</p>
					<p class="detalle"></p>
				</article>`;
			DOM.uno(".detalle", escenario).textContent = `Detalle: ${error.message}`;
		}

		/* ---------- Cabecera ---------- */
		pintarUsuario() {
			const { nombre } = this.estado.sesion;
			DOM.uno("#usuario .imagen").textContent = nombre.charAt(0).toUpperCase();
			DOM.uno("#usuario strong").textContent = nombre;
		}

		actualizarBotonModo() {
			const oscuro = TemaIU.actual().modo === "oscuro";
			const boton = DOM.uno("#modo");
			boton.textContent = oscuro ? "☀" : "☾";
			boton.title = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
		}

		alternarModo() {
			const modo = TemaIU.actual().modo === "oscuro" ? "claro" : "oscuro";
			TemaIU.aplicar({ modo });
			this.actualizarBotonModo();
			const { modulo, vista } = Enrutador.leer();
			if (modulo === "ajustes" && vista === "apariencia") { this.pintarActual(); }
		}

		async cerrarSesion() {
			const salir = await DialogoIU.confirmar({ titulo: "¿Cerrar sesión?", texto: "Tus datos se quedan guardados en este navegador.", aceptar: "Cerrar sesión" });
			if (salir) {
				this.estado.sucio = false;
				Sesion.cerrar();
				location.href = "login.html";
			}
		}

		prepararBuscador(modulo) {
			const buscador = DOM.uno("#buscador");
			const entidad = this.entidades[modulo.id];

			buscador.disabled = !entidad;
			buscador.placeholder = entidad ? `Buscar en ${entidad.titulo.toLowerCase()}…  ( / )` : "Elige un módulo con datos para buscar";
			buscador.value = entidad ? this.tabla.estadoDe(entidad).filtro : "";
		}

		/* ---------- Columnas ---------- */
		modulo(id) { return this.estado.menu.find((m) => m.id === id); }

		vistasDe(modulo) { return this.estado.vistas[modulo.tipo] || []; }

		pintarMenu() {
			const contenedor = DOM.uno("#navegacion .contenido-columna");
			contenedor.innerHTML = "";

			this.estado.menu.forEach((modulo) => {
				const enlace = DOM.plantilla("tpl-nav");
				FichaIU.completar(enlace, modulo.texto, modulo.emoji);
				enlace.href = Enrutador.ruta(modulo.id);
				enlace.dataset.modulo = modulo.id;
				contenedor.appendChild(enlace);
			});
		}

		marcarMenu(moduloId) {
			DOM.todos("#navegacion [data-modulo]").forEach((enlace) => {
				const activo = enlace.dataset.modulo === moduloId;
				enlace.classList.toggle("activo", activo);
				activo ? enlace.setAttribute("aria-current", "page") : enlace.removeAttribute("aria-current");
			});
		}

		pintarVistas(modulo, vistaActiva) {
			const contenedor = DOM.uno("#vistas .contenido-columna");
			DOM.uno("#vistas .titulo-columna").textContent = modulo.texto;
			contenedor.innerHTML = "";

			this.vistasDe(modulo).forEach((vista) => {
				const articulo = DOM.plantilla("tpl-card");
				FichaIU.completar(articulo, vista.texto, vista.emoji);
				articulo.dataset.vista = vista.id;
				articulo.classList.toggle("activo", vista.id === vistaActiva);
				if (vista.id === vistaActiva) { articulo.setAttribute("aria-current", "page"); }

				const ir = () => Enrutador.ir(modulo.id, vista.id);
				articulo.addEventListener("click", ir);
				articulo.addEventListener("keydown", (evento) => { if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); ir(); } });

				articulo.addEventListener("dragstart", (evento) => {
					evento.dataTransfer.setData("text/plain", JSON.stringify({ modulo: modulo.id, vista: vista.id }));
					evento.dataTransfer.effectAllowed = "move";
					articulo.classList.add("arrastrando");
				});
				articulo.addEventListener("dragend", () => articulo.classList.remove("arrastrando"));

				contenedor.appendChild(articulo);
			});
		}

		/* ---------- Navegación ---------- */
		async navegar() {
			if (this.estado.sucio && location.hash !== this.estado.rutaActual) {
				const salir = await DialogoIU.confirmar({
					titulo: "Tienes cambios sin guardar",
					texto: "Si sales ahora, se perderán los cambios de este formulario.",
					aceptar: "Salir sin guardar",
					peligro: true
				});
				if (!salir) {
					history.replaceState(null, "", this.estado.rutaActual);
					return;
				}
				this.estado.sucio = false;
			}
			this.pintarActual();
		}

		pintarActual() {
			const ruta = Enrutador.leer();
			const modulo = this.modulo(ruta.modulo) || this.modulo("inicio");
			const vista = ruta.vista || this.vistasDe(modulo)[0]?.id;
			const escenario = DOM.uno("#escenario");

			this.detalle.cerrar(true);
			this.estado.rutaActual = location.hash;
			this.estado.sucio = false;
			this.marcarMenu(modulo.id);
			this.pintarVistas(modulo, vista === "editar" ? "listado" : vista);
			this.prepararBuscador(modulo);

			escenario.innerHTML = "";
			escenario.scrollTop = 0;
			document.title = `${modulo.texto} · serena | iu`;

			const vistasPorTipo = {
				inicio: () => (vista === "atajos" ? this.vistaAtajos(escenario) : this.vistaPanel(escenario)),
				datos: () => this.vistaDatos(this.entidades[modulo.id], vista, ruta.id, escenario),
				componentes: () => this.vistaComponentes(vista, escenario),
				ajustes: () => (vista === "datos" ? this.vistaCopia(escenario) : this.vistaApariencia(escenario))
			};

			(vistasPorTipo[modulo.tipo] || vistasPorTipo.inicio)();
		}

		cabecera(titulo, descripcion, acciones = []) {
			const cabecera = document.createElement("div");
			const textos = document.createElement("div");
			const h2 = document.createElement("h2");
			const p = document.createElement("p");
			const botones = document.createElement("div");

			cabecera.className = "cabecera-vista";
			h2.textContent = titulo;
			p.textContent = descripcion;
			botones.className = "acciones";
			textos.append(h2, p);

			acciones.forEach((accion) => {
				const boton = document.createElement("button");
				boton.type = "button";
				boton.className = `boton ${accion.clase || ""}`;
				boton.textContent = accion.texto;
				if (accion.id) { boton.id = accion.id; }
				boton.hidden = Boolean(accion.oculto);
				boton.addEventListener("click", accion.alPulsar);
				botones.appendChild(boton);
			});

			cabecera.append(textos, botones);
			return cabecera;
		}

		tarjeta(titulo, html = "") {
			const tarjeta = document.createElement("article");
			tarjeta.className = "tarjeta";
			tarjeta.innerHTML = `<h3></h3>${html}`;
			DOM.uno("h3", tarjeta).textContent = titulo;
			return tarjeta;
		}

		/* ---------- Vistas: datos ---------- */
		vistaDatos(entidad, vista, id, escenario) {
			if (vista === "nuevo") { this.vistaFormulario(entidad, null, escenario); return; }
			if (vista === "resumen") {
				escenario.appendChild(this.cabecera(`Resumen de ${entidad.titulo.toLowerCase()}`, "Cifras y reparto calculados a partir del esquema."));
				this.resumen.pintar(entidad, escenario);
				return;
			}
			if (vista === "editar") {
				const registro = entidad.buscar(id);
				if (!registro) {
					this.toast.aviso("No encontrado", `No existe ningún ${entidad.singular} con el ID ${id}.`);
					history.replaceState(null, "", Enrutador.ruta(entidad.id, "listado"));
					this.pintarActual();
					return;
				}
				this.vistaFormulario(entidad, registro, escenario);
				return;
			}
			this.vistaListado(entidad, escenario);
		}

		/** Filtros rápidos con contador: «Todos (10) · Empresa (4) · …» */
		crearChips(entidad, contenedor) {
			const campo = entidad.campos.find((c) => c.nombre === entidad.esquema.filtroRapido);
			const estado = this.tabla.estadoDe(entidad);
			const barra = document.createElement("div");
			const opciones = [["", "Todos", entidad.todos().length]].concat(
				(campo.opciones || []).map((o) => [o, o, entidad.todos().filter((r) => r[campo.nombre] === o).length])
			);

			barra.className = "chips";
			barra.setAttribute("role", "group");
			barra.setAttribute("aria-label", `Filtrar por ${campo.etiqueta.toLowerCase()}`);

			opciones.forEach(([valor, texto, cantidad]) => {
				const chip = document.createElement("button");
				chip.type = "button";
				chip.className = "chip";
				chip.dataset.valor = valor;
				if (valor && campo.colores) { chip.style.setProperty("--h", campo.colores[valor]); chip.classList.add("con-color"); }
				chip.innerHTML = '<span class="chip-texto"></span><span class="chip-cantidad"></span>';
				DOM.uno(".chip-texto", chip).textContent = texto;
				DOM.uno(".chip-cantidad", chip).textContent = cantidad;
				chip.setAttribute("aria-pressed", String(estado.filtroCampo === valor));
				chip.addEventListener("click", () => {
					estado.filtroCampo = valor;
					estado.pagina = 1;
					DOM.todos(".chip", barra).forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
					this.tabla.pintar(entidad, contenedor);
				});
				barra.appendChild(chip);
			});

			return barra;
		}

		vistaListado(entidad, escenario) {
			const contenedor = document.createElement("div");

			escenario.append(
				this.cabecera(entidad.titulo, entidad.esquema.descripcion, [
					{ id: "borrarSeleccion", texto: "Borrar seleccionados", clase: "peligro", oculto: true, alPulsar: () => this.borrarRegistros(entidad, [...this.tabla.estadoDe(entidad).seleccion]) },
					{ texto: "Exportar CSV", alPulsar: () => this.exportarCSV(entidad) },
					{ texto: `+ Nuevo ${entidad.singular}`, clase: "primario", alPulsar: () => Enrutador.ir(entidad.id, "nuevo") }
				]),
				...(entidad.esquema.filtroRapido ? [this.crearChips(entidad, contenedor)] : []),
				contenedor
			);

			this.tabla.alCambiarSeleccion = (cantidad) => {
				const boton = DOM.uno("#borrarSeleccion");
				if (!boton) { return; }
				boton.hidden = cantidad === 0;
				boton.textContent = `Borrar seleccionados (${cantidad})`;
			};
			this.tabla.pintar(entidad, contenedor);
			this.contenedorTabla = contenedor;
		}

		vistaFormulario(entidad, registro, escenario) {
			const acciones = registro
				? [{ texto: "Borrar", clase: "peligro", alPulsar: () => this.borrarRegistros(entidad, [registro.id], true) }]
				: [];

			const formulario = this.formulario.crear(entidad.esquema, registro, {
				textoGuardar: registro ? "Guardar cambios" : `Crear ${entidad.singular}`,
				alCancelar: () => {
					this.estado.sucio = false; // cancelar es una decisión explícita: no hace falta preguntar
					Enrutador.ir(entidad.id, "listado");
				},
				alGuardar: (datos) => {
					let guardado;
					if (registro) {
						guardado = entidad.actualizar(registro.id, datos);
						this.toast.exito("Cambios guardados", entidad.textoRegistro(guardado));
					} else {
						guardado = entidad.crear(datos);
						this.toast.exito(`${capitalizar(entidad.singular)} creado`, entidad.textoRegistro(guardado));
					}
					this.estado.sucio = false;
					this.estado.resaltar = { entidad: entidad.id, id: guardado.id };
					this.tabla.estadoDe(entidad).filtro = "";
					Enrutador.ir(entidad.id, "listado");
				}
			});

			escenario.append(
				this.cabecera(
					registro ? `Editar ${entidad.singular}` : `Nuevo ${entidad.singular}`,
					registro ? entidad.textoRegistro(registro) : "Los campos con * son obligatorios.",
					acciones
				),
				formulario
			);

			DOM.uno("input:not([readonly]),select,textarea", formulario)?.focus();
		}

		async borrarRegistros(entidad, ids, volverAlListado = false) {
			if (!ids.length) { return; }

			const uno = ids.length === 1;
			const confirmado = await DialogoIU.confirmar({
				titulo: uno ? `¿Borrar este ${entidad.singular}?` : `¿Borrar ${ids.length} registros?`,
				texto: `${uno ? `Vas a borrar «${entidad.textoRegistro(entidad.buscar(ids[0]))}».` : `Vas a borrar ${ids.length} ${entidad.titulo.toLowerCase()}.`} Podrás deshacerlo desde el aviso que aparecerá.`,
				aceptar: "Borrar",
				peligro: true
			});
			if (!confirmado) { return; }

			const eliminados = entidad.borrar(ids);
			this.tabla.estadoDe(entidad).seleccion.clear();
			this.estado.sucio = false;

			if (volverAlListado) { Enrutador.ir(entidad.id, "listado"); } else { this.pintarActual(); }

			this.toast.exito(uno ? "Registro borrado" : `${ids.length} registros borrados`, "", {
				accion: {
					texto: "Deshacer",
					alPulsar: () => {
						entidad.restaurar(eliminados);
						this.pintarActual();
						this.toast.info("Borrado deshecho", "Los registros vuelven a estar en su sitio.");
					}
				}
			});
		}

		exportarCSV(entidad) {
			const escapar = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
			const cabecera = entidad.campos.map((c) => escapar(c.etiqueta)).join(";");
			const filas = entidad.todos().map((r) => entidad.campos.map((c) => escapar(c.tipo === "checkbox" ? (r[c.nombre] ? "Sí" : "No") : r[c.nombre])).join(";"));
			// El BOM (\ufeff) hace que Excel reconozca las tildes
			Utilidades.descargar(`${entidad.id}.csv`, "\ufeff" + [cabecera, ...filas].join("\n"), "text/csv;charset=utf-8");
			this.toast.exito("CSV descargado", `${entidad.todos().length} registros exportados.`);
		}

		/* ---------- Vistas: inicio ---------- */
		vistaPanel(escenario) {
			const hora = new Date().getHours();
			const saludo = hora < 14 ? "Buenos días" : hora < 21 ? "Buenas tardes" : "Buenas noches";
			const fecha = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
			const cifras = document.createElement("div");

			escenario.appendChild(this.cabecera(`${saludo}, ${this.estado.sesion.nombre.split(" ")[0]}`, capitalizar(fecha)));
			cifras.className = "rejilla";

			Object.values(this.entidades).forEach((entidad) => {
				const metrica = entidad.metricaPanel();
				const modulo = this.modulo(entidad.id);
				const tarjeta = ResumenIU.tarjetaCifra(`${modulo.emoji} ${entidad.titulo}`, entidad.todos().length, undefined,
					metrica ? `${metrica.etiqueta}: ${Utilidades.formatear(metrica.valor, metrica.campo)}` : "");
				tarjeta.classList.add("enlace-tarjeta");
				tarjeta.tabIndex = 0;
				tarjeta.addEventListener("click", () => Enrutador.ir(entidad.id, "listado"));
				tarjeta.addEventListener("keydown", (e) => { if (e.key === "Enter") { Enrutador.ir(entidad.id, "listado"); } });
				cifras.appendChild(tarjeta);
			});

			escenario.appendChild(cifras);
			this.pintarGraficosPanel(escenario);

			// Avisos: lo que requiere atención
			const avisos = [];
			const { pedidos, productos, clientes } = this.entidades;
			if (pedidos) {
				const pendientes = pedidos.todos().filter((p) => p.estado === "Pendiente");
				if (pendientes.length) { avisos.push({ texto: `${pendientes.length} pedidos pendientes de envío`, ruta: ["pedidos", "listado"], filtro: ["pedidos", "Pendiente"] }); }
				const sinPagar = pedidos.todos().filter((p) => !p.pagado && p.estado !== "Cancelado");
				if (sinPagar.length) { avisos.push({ texto: `${sinPagar.length} pedidos sin cobrar`, ruta: ["pedidos", "resumen"] }); }
			}
			if (productos) {
				const agotados = productos.todos().filter((p) => Number(p.stock) === 0 && !p.descatalogado);
				agotados.forEach((p) => avisos.push({ texto: `Sin stock: ${p.nombre}`, ruta: ["productos", "editar", p.id] }));
			}
			if (clientes) {
				const inactivos = clientes.todos().filter((c) => !c.activo).length;
				if (inactivos) { avisos.push({ texto: `${inactivos} clientes inactivos`, ruta: ["clientes", "resumen"] }); }
			}

			const bloque = this.tarjeta("Requiere atención", avisos.length ? '<ul class="lista-avisos"></ul>' : "<p>Todo al día. No hay nada pendiente.</p>");
			bloque.style.marginTop = "var(--relleno)";
			avisos.forEach((aviso) => {
				const li = document.createElement("li");
				const enlace = document.createElement("a");
				enlace.href = Enrutador.ruta(...aviso.ruta);
				enlace.textContent = aviso.texto;
				if (aviso.filtro) {
					enlace.addEventListener("click", () => { this.tabla.estadoDe(this.entidades[aviso.filtro[0]]).filtro = aviso.filtro[1]; });
				}
				li.appendChild(enlace);
				DOM.uno(".lista-avisos", bloque).appendChild(li);
			});
			escenario.appendChild(bloque);
		}

		pintarGraficosPanel(escenario) {
			const pedidos = this.entidades.pedidos;
			if (!pedidos) { return; }

			const moneda = pedidos.campos.find((c) => c.formato === "moneda");
			const campoEstado = pedidos.campos.find((c) => c.colores);
			const validos = pedidos.todos().filter((p) => p.fecha && p.estado !== "Cancelado");
			const rejilla = document.createElement("div");
			rejilla.className = "rejilla rejilla-graficos";

			// Ventas por mes: se rellenan los meses sin pedidos para que la línea sea continua
			if (validos.length && moneda) {
				const porMes = {};
				validos.forEach((p) => { const mes = p.fecha.slice(0, 7); porMes[mes] = (porMes[mes] || 0) + (Number(p[moneda.nombre]) || 0); });
				const meses = Object.keys(porMes).sort();
				const [a1, m1] = meses[0].split("-").map(Number);
				const [a2, m2] = meses.at(-1).split("-").map(Number);
				const serie = [];
				for (let a = a1, m = m1; a < a2 || (a === a2 && m <= m2); m === 12 ? (a++, m = 1) : m++) {
					const clave = `${a}-${String(m).padStart(2, "0")}`;
					serie.push({ etiqueta: capitalizar(new Date(a, m - 1, 1).toLocaleDateString("es-ES", { month: "short" }).replace(".", "")), valor: porMes[clave] || 0 });
				}
				const tarjeta = this.tarjeta("Ventas por mes");
				const total = document.createElement("p");
				total.textContent = `${Utilidades.formatear(validos.reduce((t, p) => t + (Number(p[moneda.nombre]) || 0), 0), moneda)} sin contar cancelados`;
				tarjeta.append(total, GraficoIU.lineas(serie.slice(-6), (n) => Utilidades.formatear(n, moneda)));
				tarjeta.classList.add("tarjeta-ancha");
				rejilla.appendChild(tarjeta);
			}

			if (campoEstado) {
				const conteo = {};
				(campoEstado.opciones || []).forEach((o) => { conteo[o] = 0; });
				pedidos.todos().forEach((p) => { if (p[campoEstado.nombre]) { conteo[p[campoEstado.nombre]] = (conteo[p[campoEstado.nombre]] || 0) + 1; } });
				const tarjeta = this.tarjeta(`Pedidos por ${campoEstado.etiqueta.toLowerCase()}`);
				tarjeta.appendChild(GraficoIU.donut(conteo, campoEstado.colores));
				rejilla.appendChild(tarjeta);
			}

			rejilla.style.marginTop = "var(--relleno)";
			escenario.appendChild(rejilla);
		}

		vistaAtajos(escenario) {
			const atajos = [
				["Ctrl + K", "Abrir la paleta de comandos: ir a cualquier vista, acción o registro"],
				["/", "Ir al buscador"],
				["N", "Crear un registro nuevo en el módulo actual"],
				["Escape", "Volver al listado, o limpiar el buscador"],
				["?", "Mostrar esta página"],
				["Clic en una fila", "Abrir la ficha con sus datos y registros relacionados"],
				["Doble clic en una fila", "Editar el registro"],
				["Flechas sobre un separador", "Cambiar el ancho de la columna"],
				["Doble clic en un separador", "Recuperar el ancho por defecto"],
				["Arrastrar una vista al escenario", "Abrir esa vista"]
			];
			const filas = atajos.map(([tecla, accion]) => `<tr><td><kbd></kbd></td><td></td></tr>`).join("");
			const tarjeta = this.tarjeta("Teclado y ratón", `<div class="contenedor-tabla"><table><tbody>${filas}</tbody></table></div>`);

			DOM.todos("tr", tarjeta).forEach((fila, i) => {
				DOM.uno("kbd", fila).textContent = atajos[i][0];
				fila.children[1].textContent = atajos[i][1];
			});

			escenario.append(this.cabecera("Atajos de teclado", "Todo se puede hacer sin ratón."), tarjeta);
		}

		/* ---------- Vistas: componentes ---------- */
		vistaComponentes(vista, escenario) {
			if (vista === "toasts") { this.demoToasts(escenario); return; }
			if (vista === "dialogos") { this.demoDialogos(escenario); return; }
			this.demoFormularios(escenario);
		}

		demoFormularios(escenario) {
			const esquema = {
				campos: [
					{ nombre: "nombre", etiqueta: "Nombre", tipo: "text", requerido: true },
					{ nombre: "email", etiqueta: "Email", tipo: "email", requerido: true },
					{ nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", patron: "[0-9 +]{9,15}" },
					{ nombre: "web", etiqueta: "Web", tipo: "url" },
					{ nombre: "fecha", etiqueta: "Fecha", tipo: "date" },
					{ nombre: "presupuesto", etiqueta: "Presupuesto", tipo: "number", paso: 0.01, min: 0 },
					{ nombre: "tipo", etiqueta: "Tipo", tipo: "select", opciones: ["Cliente", "Proveedor", "Alumno"], requerido: true },
					{ nombre: "prioritario", etiqueta: "Prioritario", tipo: "checkbox" },
					{ nombre: "mensaje", etiqueta: "Mensaje", tipo: "textarea" }
				]
			};
			const salida = this.tarjeta("Resultado", "<p>Envía el formulario para ver aquí los datos que captura el evento <code>submit</code>.</p><pre class='salida'></pre>");

			const formulario = this.formulario.crear(esquema, null, {
				textoGuardar: "Enviar",
				vigilarCambios: false,
				alCancelar: () => formulario.reset(),
				alGuardar: (datos) => {
					DOM.uno(".salida", salida).textContent = JSON.stringify(datos, null, 2);
					this.toast.exito("Formulario enviado", "Todos los campos han pasado la validación.");
				}
			});
			DOM.uno("[data-accion=cancelar]", formulario).textContent = "Limpiar";
			salida.style.marginTop = "var(--relleno)";

			escenario.append(
				this.cabecera("Formularios", "Generados a partir de un esquema JSON, con validación y mensajes en español. Prueba a enviarlo vacío."),
				formulario,
				salida
			);
		}

		demoToasts(escenario) {
			const tarjeta = this.tarjeta("Tipos", `
				<p>Se apilan abajo a la derecha, se cierran solos y se pausan al pasar el ratón por encima.</p>
				<div class="fila-botones">
					<button class="boton primario" data-toast="success" type="button">Éxito</button>
					<button class="boton" data-toast="info" type="button">Información</button>
					<button class="boton" data-toast="warning" type="button">Aviso</button>
					<button class="boton" data-toast="danger" type="button">Error</button>
					<button class="boton" data-toast="accion" type="button">Con acción «Deshacer»</button>
				</div>`);

			const textos = {
				success: ["Guardado", "La operación se ha completado."],
				info: ["Información", "Este es un mensaje informativo."],
				warning: ["Revisa los datos", "Hay campos que conviene comprobar."],
				danger: ["No se ha podido guardar", "Comprueba la conexión e inténtalo otra vez."]
			};

			// Delegación: un listener para todos los botones
			tarjeta.addEventListener("click", (evento) => {
				const tipo = evento.target.closest("[data-toast]")?.dataset.toast;
				if (!tipo) { return; }
				if (tipo === "accion") {
					this.toast.exito("Elemento archivado", "", { accion: { texto: "Deshacer", alPulsar: () => this.toast.info("Deshecho", "El elemento vuelve a su sitio.") } });
					return;
				}
				this.toast.mostrar(tipo, ...textos[tipo]);
			});

			escenario.append(this.cabecera("Toasts", "Mensajes emergentes con una sola implementación para todo el proyecto."), tarjeta);
		}

		demoDialogos(escenario) {
			const tarjeta = this.tarjeta("Confirmación", `
				<p>Sustituyen a <code>confirm()</code>: respetan el estilo, se cierran con Escape y devuelven una promesa.</p>
				<div class="fila-botones">
					<button class="boton" data-dialogo="normal" type="button">Confirmación normal</button>
					<button class="boton peligro" data-dialogo="peligro" type="button">Acción destructiva</button>
				</div>`);

			tarjeta.addEventListener("click", async (evento) => {
				const tipo = evento.target.closest("[data-dialogo]")?.dataset.dialogo;
				if (!tipo) { return; }
				const peligro = tipo === "peligro";
				const respuesta = await DialogoIU.confirmar(peligro
					? { titulo: "¿Vaciar la papelera?", texto: "Esta acción no se puede deshacer.", aceptar: "Vaciar", peligro: true }
					: { titulo: "¿Publicar los cambios?", texto: "Serán visibles para todo el equipo.", aceptar: "Publicar" });
				this.toast.mostrar(respuesta ? "success" : "info", respuesta ? "Has aceptado" : "Has cancelado", `El diálogo ha devuelto ${respuesta}.`);
			});

			escenario.append(this.cabecera("Diálogos", "Ventanas modales accesibles."), tarjeta);
		}

		/* ---------- Vistas: ajustes ---------- */
		vistaApariencia(escenario) {
			const tema = TemaIU.actual();
			const tarjeta = this.tarjeta("Color y modo", `
				<p>Toda la interfaz sale de unas pocas variables CSS. Cambiarlas desde JavaScript recalcula los cinco niveles de profundidad.</p>
				<div class="ajuste">
					<span>Modo</span>
					<div class="selector-modo">
						<button class="boton" data-modo="oscuro" type="button">☾ Oscuro</button>
						<button class="boton" data-modo="claro" type="button">☀ Claro</button>
					</div>
				</div>
				<div class="ajuste">
					<label for="rangoTono">Tono <output id="salidaTono"></output></label>
					<input type="range" id="rangoTono" min="0" max="360">
				</div>
				<div class="ajuste">
					<span>Paletas</span>
					<div class="fila-botones" id="paletas"></div>
				</div>
				<div class="ajuste">
					<span>Niveles de profundidad (color0 → color4) y acento</span>
					<div class="muestras">
						<span style="background:var(--color0)" title="--color0"></span>
						<span style="background:var(--color)" title="--color"></span>
						<span style="background:var(--color2)" title="--color2"></span>
						<span style="background:var(--color3)" title="--color3"></span>
						<span style="background:var(--color4)" title="--color4"></span>
						<span style="background:var(--acento)" title="--acento"></span>
					</div>
				</div>
				<button class="boton" id="restablecerTema" type="button">Restablecer</button>`);

			const paletas = [["Rosa serena", 335], ["Azul jocarsa", 200], ["Violeta", 265], ["Verde", 150], ["Ámbar", 32]];
			const rango = DOM.uno("#rangoTono", tarjeta);
			const salida = DOM.uno("#salidaTono", tarjeta);

			const reflejar = (t) => {
				rango.value = t.tono;
				salida.textContent = `${t.tono}°`;
				DOM.todos("[data-modo]", tarjeta).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === t.modo)));
			};

			paletas.forEach(([nombre, tono]) => {
				const boton = document.createElement("button");
				boton.type = "button";
				boton.className = "boton pequeno";
				boton.innerHTML = `<span class="punto" style="background:hsl(${tono},81%,50%)"></span>`;
				boton.append(nombre);
				boton.addEventListener("click", () => reflejar(TemaIU.aplicar({ tono })));
				DOM.uno("#paletas", tarjeta).appendChild(boton);
			});

			rango.addEventListener("input", () => reflejar(TemaIU.aplicar({ tono: Number(rango.value) })));
			DOM.todos("[data-modo]", tarjeta).forEach((boton) => boton.addEventListener("click", () => {
				reflejar(TemaIU.aplicar({ modo: boton.dataset.modo }));
				this.actualizarBotonModo();
			}));
			DOM.uno("#restablecerTema", tarjeta).addEventListener("click", () => {
				reflejar(TemaIU.restablecer());
				this.actualizarBotonModo();
				this.toast.info("Apariencia restablecida", "Vuelves al rosa serena en modo oscuro.");
			});

			reflejar(tema);
			escenario.append(this.cabecera("Apariencia", "Personaliza la interfaz. Se guarda en este navegador."), tarjeta);
		}

		vistaCopia(escenario) {
			const exportar = this.tarjeta("Exportar", "<p>Descarga todos los datos en un archivo JSON que puedes volver a importar.</p><div class='fila-botones'><button class='boton primario' id='exportarJSON' type='button'>Descargar copia (.json)</button></div>");
			const importar = this.tarjeta("Importar", "<p>Restaura una copia descargada antes. Sustituye los datos actuales.</p><div class='fila-botones'><label class='boton'>Elegir archivo…<input type='file' accept='application/json,.json' id='importarJSON' hidden></label></div>");
			const restablecer = this.tarjeta("Volver al principio", "<p>Recupera los datos de ejemplo de los JSON originales y el tamaño de las columnas.</p><div class='fila-botones'><button class='boton peligro' id='restablecerDatos' type='button'>Restablecer datos</button></div>");
			const rejilla = document.createElement("div");
			rejilla.className = "rejilla";
			rejilla.append(exportar, importar, restablecer);

			DOM.uno("#exportarJSON", exportar).addEventListener("click", () => {
				const copia = { app: "serena-iu", fecha: new Date().toISOString(), datos: {} };
				Object.values(this.entidades).forEach((e) => { copia.datos[e.id] = e.todos(); });
				Utilidades.descargar(`serena-iu-copia-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(copia, null, 2), "application/json");
				this.toast.exito("Copia descargada", "Guárdala en un lugar seguro.");
			});

			DOM.uno("#importarJSON", importar).addEventListener("change", async (evento) => {
				const archivo = evento.target.files[0];
				if (!archivo) { return; }
				try {
					const copia = JSON.parse(await archivo.text());
					if (copia.app !== "serena-iu" || typeof copia.datos !== "object") { throw new Error("formato"); }
					let total = 0;
					Object.entries(copia.datos).forEach(([id, registros]) => {
						if (this.entidades[id] && Array.isArray(registros)) {
							this.entidades[id].reemplazar(registros);
							total += registros.length;
						}
					});
					this.toast.exito("Copia restaurada", `${total} registros importados.`);
				} catch (error) {
					this.toast.error("No se pudo importar", "El archivo no es una copia de serena | iu.");
				}
				evento.target.value = "";
			});

			DOM.uno("#restablecerDatos", restablecer).addEventListener("click", async () => {
				const ok = await DialogoIU.confirmar({ titulo: "¿Restablecer todos los datos?", texto: "Se perderán los registros que hayas creado o modificado.", aceptar: "Restablecer", peligro: true });
				if (!ok) { return; }
				Object.values(this.entidades).forEach((e) => e.restablecer());
				Almacen.borrarPorPrefijo("columna:");
				DOM.todos(".columna").forEach((c) => { c.style.width = ""; c.style.flexBasis = ""; c.classList.remove("compacto"); delete c.dataset.ancho; });
				DOM.todos(".minimizar").forEach((b) => this.columnas.actualizarBoton(b, false));
				this.estado.tablas = {};
				this.toast.exito("Datos restablecidos", "Todo vuelve a su estado inicial.");
			});

			escenario.append(this.cabecera("Copia de seguridad", "Los datos viven en el navegador (localStorage). Aquí puedes llevártelos o recuperarlos."), rejilla);
		}

		/* ---------- Eventos globales ---------- */
		activarEventos() {
			const buscador = DOM.uno("#buscador");
			const escenario = DOM.uno("#escenario");
			let espera;

			window.addEventListener("hashchange", () => this.navegar());

			buscador.addEventListener("input", () => {
				clearTimeout(espera);
				espera = setTimeout(() => {
					const { modulo, vista } = Enrutador.leer();
					const entidad = this.entidades[modulo];
					if (!entidad) { return; }
					const estado = this.tabla.estadoDe(entidad);
					estado.filtro = buscador.value;
					estado.pagina = 1;
					if (vista && vista !== "listado") {
						Enrutador.ir(modulo, "listado");
					} else if (this.contenedorTabla?.isConnected) {
						this.tabla.pintar(entidad, this.contenedorTabla); // solo la tabla: sin repetir la animación de entrada
					} else {
						this.pintarActual();
						buscador.focus();
					}
				}, 150);
			});

			buscador.addEventListener("keydown", (evento) => {
				if (evento.key === "Escape") {
					buscador.value = "";
					buscador.dispatchEvent(new Event("input"));
					buscador.blur();
				}
			});

			DOM.uno("#nuevo").addEventListener("click", () => this.crearNuevo());
			DOM.uno("#modo").addEventListener("click", () => this.alternarModo());
			DOM.uno("#abrirPaleta").addEventListener("click", () => this.paleta.abrir());
			DOM.uno("#cerrarSesion").addEventListener("click", () => this.cerrarSesion());

			document.addEventListener("keydown", (evento) => {
				const escribiendo = evento.target.closest("input,textarea,select,[contenteditable]");
				const hayDialogo = document.querySelector("dialog[open]");

				if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
					evento.preventDefault();
					this.paleta.abrir();
					return;
				}
				if (escribiendo || hayDialogo || evento.ctrlKey || evento.metaKey || evento.altKey) { return; }

				if (evento.key === "/") { evento.preventDefault(); if (!buscador.disabled) { buscador.focus(); } }
				if (evento.key.toLowerCase() === "n") { evento.preventDefault(); this.crearNuevo(); }
				if (evento.key === "?") { Enrutador.ir("inicio", "atajos"); }
				if (evento.key === "Escape") {
					const { modulo, vista } = Enrutador.leer();
					if (this.entidades[modulo] && vista !== "listado") { Enrutador.ir(modulo, "listado"); }
				}
			});

			// Arrastrar una vista al escenario la abre
			escenario.addEventListener("dragover", (evento) => { evento.preventDefault(); escenario.classList.add("drag-over"); });
			escenario.addEventListener("dragleave", (evento) => { if (!escenario.contains(evento.relatedTarget)) { escenario.classList.remove("drag-over"); } });
			escenario.addEventListener("drop", (evento) => {
				evento.preventDefault();
				escenario.classList.remove("drag-over");
				try {
					const { modulo, vista } = JSON.parse(evento.dataTransfer.getData("text/plain"));
					Enrutador.ir(modulo, vista);
				} catch (error) { /* se ha soltado algo que no es una vista */ }
			});

			// Aviso del navegador si se cierra la pestaña con cambios sin guardar
			window.addEventListener("beforeunload", (evento) => {
				if (this.estado.sucio) { evento.preventDefault(); evento.returnValue = ""; }
			});
		}

		crearNuevo() {
			const { modulo } = Enrutador.leer();
			Enrutador.ir(this.entidades[modulo] ? modulo : "clientes", "nuevo");
		}
	}

	Object.assign(window.serena.iu, {
		OrigenDatos, Entidad, FichaIU, Enrutador, GestorColumnas,
		TablaIU, FormularioIU, ResumenIU, PaletaIU, DecoracionIU, GraficoIU, PanelDetalleIU, AplicacionIU
	});

	document.addEventListener("DOMContentLoaded", () => {
		window.serena.iu.aplicacion = new AplicacionIU();
		window.serena.iu.aplicacion.iniciar();
	});
})();
