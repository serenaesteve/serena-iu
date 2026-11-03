/* =========================================================
   NÚCLEO: clases base de todos los componentes
   ========================================================= */

/** Pasa el valor de un atributo HTML al tipo que declara la propiedad */
function convertirAtributo(texto, tipo) {
	if (tipo === Boolean) { return texto !== null; }
	if (texto === null) { return null; }
	if (tipo === Number) {
		const numero = Number(texto);
		return texto.trim() === "" || Number.isNaN(numero) ? null : numero;
	}
	return texto;
}

/** Guiones del atributo HTML a partir del nombre JavaScript: porPagina → por-pagina */
function nombreAtributo(propiedad) {
	return propiedad.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
}

function hojaDeEstilos(css) {
	const hoja = new CSSStyleSheet();
	hoja.replaceSync(css);
	return hoja;
}

const hojaComun = hojaDeEstilos(ESTILOS_COMUNES);
const registro = new Map();

/**
 * GotaElemento: base de todos los componentes.
 *
 * Cada componente declara en `static propiedades` su API con los valores por
 * defecto. A partir de esa tabla se generan los atributos observados, los
 * getters y setters, la documentación y el banco de pruebas: hay una sola fuente.
 *
 *   static propiedades = { max: { tipo: Number, defecto: 100, descripcion: "…" } };
 */
class GotaElemento extends HTMLElement {
	static etiqueta = "";
	static descripcion = "";
	static estilos = "";
	static propiedades = {};
	static eventos = {};
	static metodos = {};
	static partes = {};
	static ejemplo = "";

	/** Propiedades heredadas y propias (las de la subclase mandan) */
	static todasLasPropiedades() {
		const padre = Object.getPrototypeOf(this);
		const heredadas = padre.todasLasPropiedades ? padre.todasLasPropiedades() : {};
		return { ...heredadas, ...(Object.hasOwn(this, "propiedades") ? this.propiedades : {}) };
	}

	static todosLosMetodos() {
		const padre = Object.getPrototypeOf(this);
		return { ...(padre.todosLosMetodos ? padre.todosLosMetodos() : {}), ...(Object.hasOwn(this, "metodos") ? this.metodos : {}) };
	}

	static todosLosEventos() {
		const padre = Object.getPrototypeOf(this);
		return { ...(padre.todosLosEventos ? padre.todosLosEventos() : {}), ...(Object.hasOwn(this, "eventos") ? this.eventos : {}) };
	}

	static get observedAttributes() {
		return Object.entries(this.todasLasPropiedades())
			.filter(([, propiedad]) => propiedad.atributo !== false)
			.map(([nombre, propiedad]) => propiedad.atributo || nombreAtributo(nombre))
			.concat("aria-invalid", "aria-label");
	}

	/** Crea los accesores y registra la etiqueta. Se puede llamar más de una vez sin error. */
	static definir() {
		if (customElements.get(this.etiqueta)) { return this; }

		Object.entries(this.todasLasPropiedades()).forEach(([nombre, propiedad]) => {
			if (propiedad.atributo === false || nombre in this.prototype) { return; }

			const atributo = propiedad.atributo || nombreAtributo(nombre);
			Object.defineProperty(this.prototype, nombre, {
				configurable: true,
				enumerable: true,
				get() {
					const valor = convertirAtributo(this.getAttribute(atributo), propiedad.tipo);
					if (propiedad.tipo === Boolean) { return valor; }
					return valor ?? propiedad.defecto ?? null;
				},
				set(valor) {
					if (propiedad.tipo === Boolean) {
						this.toggleAttribute(atributo, Boolean(valor));
					} else if (valor === null || valor === undefined) {
						this.removeAttribute(atributo);
					} else {
						this.setAttribute(atributo, String(valor));
					}
				}
			});
		});

		customElements.define(this.etiqueta, this);
		registro.set(this.etiqueta, this);
		return this;
	}

	constructor() {
		super();
		const clase = this.constructor;
		clase.hoja ??= hojaDeEstilos(clase.estilos);
		this.raiz = this.attachShadow({ mode: "open", delegatesFocus: clase.delegarFoco ?? true });
		this.raiz.adoptedStyleSheets = [hojaComun, clase.hoja];
		this.construido = false;
	}

	connectedCallback() {
		if (!this.construido) {
			this.construido = true;
			this.construir();
		}
		this.actualizar();
		this.alConectar?.();
	}

	disconnectedCallback() {
		this.alDesconectar?.();
	}

	attributeChangedCallback(nombre, anterior, actual) {
		if (this.construido && anterior !== actual) { this.actualizar(nombre); }
	}

	/** Crea el DOM interno. Solo se llama una vez. */
	construir() {}

	/** Vuelca las propiedades en el DOM interno. Se llama cada vez que cambia algo. */
	actualizar() {}

	/** Lanza un evento propio de la librería: atraviesa el Shadow DOM y lleva datos en `detail` */
	emitir(nombre, detalle = {}) {
		return this.dispatchEvent(new CustomEvent(nombre, { bubbles: true, composed: true, detail: detalle }));
	}
}

/**
 * GotaControl: base de los controles de formulario.
 *
 * Tiene el mismo contrato que un <input> nativo (name, value, disabled, required,
 * readOnly, validity, checkValidity…) gracias a ElementInternals: aparece en
 * form.elements, se envía con el formulario, se valida, se reinicia con reset()
 * y se desactiva dentro de un <fieldset disabled>.
 */
class GotaControl extends GotaElemento {
	static formAssociated = true;

	static propiedades = {
		name: { tipo: String, defecto: "", descripcion: "Nombre con el que se envía en el formulario." },
		value: { tipo: String, defecto: "", descripcion: "Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual." },
		disabled: { tipo: Boolean, defecto: false, descripcion: "Desactivado: no se puede usar ni se envía." },
		required: { tipo: Boolean, defecto: false, descripcion: "Obligatorio: vacío marca valueMissing." },
		readonly: { tipo: Boolean, defecto: false, descripcion: "Solo lectura: se envía, pero no se edita ni se valida." },
		persistir: { tipo: String, defecto: "", descripcion: "Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda." }
	};

	static eventos = {
		input: { detalle: "—", descripcion: "El valor está cambiando (igual que en un input nativo)." },
		change: { detalle: "—", descripcion: "El usuario ha confirmado el cambio." },
		"gota-cambio": { detalle: "{ valor, anterior, origen }", tipoDetalle: '{ valor: string; anterior: string; origen: "teclado" | "puntero" | "codigo" }', descripcion: "Cambio con datos. origen es teclado, puntero o codigo." }
	};

	static metodos = {
		"focus()": "Pone el foco en el control.",
		"limpiar()": "Vacía el valor sin lanzar eventos.",
		"checkValidity()": "Devuelve si es válido.",
		"reportValidity()": "Devuelve si es válido y muestra el mensaje del navegador.",
		"setCustomValidity(texto)": "Fija un error propio. Con texto vacío lo quita."
	};

	constructor() {
		super();
		this.internos = this.attachInternals();
		this.valorActual = "";
		this.errorPropio = "";
		this.desactivadoPorFormulario = false;
		this.valorEditado = false;
	}

	connectedCallback() {
		if (!this.construido && !this.valorEditado) {
			this.valorActual = this.normalizar(this.getAttribute("value") ?? this.valorInicial());
			this.recuperar();
		}
		super.connectedCallback();
		this.sincronizarEtiqueta();
		this.volcarAlFormulario();
	}

	attributeChangedCallback(nombre, anterior, actual) {
		// Cambiar el atributo value antes de editar cambia el valor, como en un input
		if (nombre === "value" && !this.valorEditado && anterior !== actual) {
			this.valorActual = this.normalizar(actual ?? this.valorInicial());
		}
		super.attributeChangedCallback(nombre, anterior, actual);
		if (!this.construido) { return; }
		if (nombre === "aria-invalid" && this.controlEtiquetado) { this.controlEtiquetado().setAttribute("aria-invalid", actual ?? "false"); }
		if (nombre === "aria-label") { this.sincronizarEtiqueta(); }
		this.volcarAlFormulario();
	}

	valorInicial() { return ""; }

	/** Cada control convierte aquí lo que recibe en su forma canónica de texto */
	normalizar(valor) {
		return valor === null || valor === undefined ? "" : String(valor);
	}

	get value() { return this.valorActual; }

	set value(valor) {
		this.valorEditado = true;
		this.valorActual = this.normalizar(valor);
		if (this.construido) { this.actualizar("value"); }
		this.volcarAlFormulario();
	}

	get readOnly() { return this.readonly; }
	set readOnly(valor) { this.readonly = valor; }

	get form() { return this.internos.form; }
	get labels() { return this.internos.labels; }
	get validity() { return this.internos.validity; }
	get validationMessage() { return this.internos.validationMessage; }
	get willValidate() { return this.internos.willValidate; }
	get bloqueado() { return this.disabled || this.desactivadoPorFormulario; }

	checkValidity() { return this.internos.checkValidity(); }
	reportValidity() { return this.internos.reportValidity(); }

	setCustomValidity(texto) {
		this.errorPropio = texto || "";
		this.volcarAlFormulario();
	}

	limpiar() { this.value = ""; }

	/** Comprueba el valor. Devuelve { valueMissing: true, …, mensaje } o null si es válido */
	validar() {
		return this.required && !this.value ? { valueMissing: true, mensaje: "Este campo es obligatorio." } : null;
	}

	/** Elemento interno junto al que el navegador muestra el mensaje de error */
	anclaValidacion() { return this.raiz.querySelector("input,button"); }

	/** Valor que recibe el servidor al enviar el formulario */
	valorDeFormulario() { return this.value; }

	volcarAlFormulario() {
		this.internos.setFormValue(this.bloqueado ? null : this.valorDeFormulario());

		const fallo = this.readonly ? null : this.validar();
		const ancla = this.construido ? this.anclaValidacion() : null;
		if (this.errorPropio) {
			this.internos.setValidity({ customError: true }, this.errorPropio, ancla || undefined);
		} else if (fallo) {
			const { mensaje, ...banderas } = fallo;
			this.internos.setValidity(banderas, mensaje, ancla || undefined);
		} else {
			this.internos.setValidity({});
		}
		this.guardar();
	}

	/** Cambio hecho por el usuario: actualiza y avisa con los mismos eventos que un input */
	cambiarPorUsuario(valor, origen = "teclado", confirmar = true) {
		const anterior = this.valorActual;
		this.valorEditado = true;
		this.valorActual = this.normalizar(valor);
		this.actualizar("value");
		this.volcarAlFormulario();

		if (anterior !== this.valorActual) {
			this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
			this.emitir("gota-cambio", { valor: this.valorActual, anterior, origen });
		}
		if (confirmar) { this.dispatchEvent(new Event("change", { bubbles: true })); }
	}

	/** Los eventos de los <input> internos se quedan dentro: fuera se ven solo los del componente */
	aislarEventos(entrada) {
		entrada.addEventListener("input", (evento) => evento.stopPropagation());
		entrada.addEventListener("change", (evento) => evento.stopPropagation());
	}

	/** Enter en un campo envía el formulario, igual que en un input nativo */
	enviarConEnter(entrada) {
		entrada.addEventListener("keydown", (evento) => {
			if (evento.key === "Enter" && !evento.defaultPrevented) { this.form?.requestSubmit(); }
		});
	}

	/** El <label> exterior no puede nombrar lo que hay dentro del Shadow DOM: se copia su texto */
	sincronizarEtiqueta() {
		const interno = this.controlEtiquetado?.();
		if (!interno) { return; }
		const propia = this.getAttribute("aria-label");
		const textoDe = (etiqueta) => [...etiqueta.childNodes].filter((nodo) => !nodo.contains(this)).map((nodo) => nodo.textContent).join(" ");
		const texto = propia || [...(this.labels || [])].map(textoDe).join(" ");
		if (texto.trim()) { interno.setAttribute("aria-label", texto.replace(/\*/g, "").replace(/\s+/g, " ").trim()); }
	}

	formResetCallback() {
		this.valorEditado = false;
		this.valorActual = this.normalizar(this.getAttribute("value") ?? this.valorInicial());
		this.actualizar("value");
		this.volcarAlFormulario();
	}

	formDisabledCallback(desactivado) {
		this.desactivadoPorFormulario = desactivado;
		if (this.construido) { this.actualizar("disabled"); }
		this.volcarAlFormulario();
	}

	formStateRestoreCallback(estado) {
		this.value = estado ?? "";
	}

	recuperar() {
		if (!this.persistir) { return; }
		try {
			const guardado = localStorage.getItem(`gota:${this.persistir}`);
			if (guardado !== null) {
				this.valorActual = this.normalizar(guardado);
				this.valorEditado = true;
			}
		} catch (error) { /* almacenamiento bloqueado: el componente funciona sin recordar */ }
	}

	guardar() {
		if (!this.persistir || !this.valorEditado) { return; }
		try {
			localStorage.setItem(`gota:${this.persistir}`, this.textoAGuardar());
		} catch (error) { /* almacenamiento lleno o bloqueado */ }
	}

	textoAGuardar() { return this.value; }
}
