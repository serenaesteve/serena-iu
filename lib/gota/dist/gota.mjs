/*! gota 1.2.0 · componentes visuales · MIT · Serena Sania Esteve */
/* =========================================================
   ESTILOS COMUNES
   Cada token admite una variable --gota-* desde fuera. Si nadie
   la define se usa el tema propio de la librería, el de Serena:
   ciruela sobre rosa empolvado, con modo oscuro invertido.
   (El tema azul «agua clara» está en temas/agua.css.)
   ========================================================= */
const ESTILOS_COMUNES = `
:host{
	--_acento:var(--gota-acento,#2A2026);
	--_acento-suave:var(--gota-acento-suave,rgb(248 196 214 / .55));
	--_sobre-acento:var(--gota-sobre-acento,#FFFFFF);
	--_tinta:var(--gota-tinta,#1B1216);
	--_tinta-suave:var(--gota-tinta-suave,#7A6770);
	--_campo:var(--gota-campo,#FFFFFF);
	--_campo-foco:var(--gota-campo-foco,#FFFFFF);
	--_panel:var(--gota-panel,#FFFBFC);
	--_linea:var(--gota-linea,rgb(42 32 38 / .14));
	--_boton:var(--gota-boton,rgb(42 32 38 / .05));
	--_boton-hover:var(--gota-boton-hover,rgb(42 32 38 / .09));
	--_sombra:var(--gota-sombra,0 18px 40px rgb(120 100 110 / .24));
	--_sombra-campo:var(--gota-sombra-campo,inset 0 0 0 1px rgb(42 32 38 / .1),0 1px 2px rgb(120 100 110 / .12));
	--_peligro:var(--gota-peligro,#C2415B);
	--_aviso:var(--gota-aviso,#C98A2E);
	--_exito:var(--gota-exito,#3F9A72);
	--_radio:var(--gota-radio,18px);
	--_radio-panel:var(--gota-radio-panel,24px);
	--_fuente:var(--gota-fuente,inherit);
	--_fuente-titulo:var(--gota-fuente-titulo,"Playfair Display",Georgia,serif);
	--_alto:var(--gota-alto,40px);
	font-family:var(--_fuente);
	color:var(--_tinta);
	box-sizing:border-box;
}
@media (prefers-color-scheme:dark){
	:host{
		--_acento:var(--gota-acento,#EDE4E8);
		--_acento-suave:var(--gota-acento-suave,rgb(248 196 214 / .22));
		--_sobre-acento:var(--gota-sobre-acento,#1A1216);
		--_tinta:var(--gota-tinta,#F7EEF2);
		--_tinta-suave:var(--gota-tinta-suave,#A7929C);
		--_campo:var(--gota-campo,rgb(247 238 242 / .06));
		--_campo-foco:var(--gota-campo-foco,rgb(247 238 242 / .1));
		--_panel:var(--gota-panel,#21161C);
		--_linea:var(--gota-linea,rgb(237 228 232 / .14));
		--_boton:var(--gota-boton,rgb(237 228 232 / .07));
		--_boton-hover:var(--gota-boton-hover,rgb(237 228 232 / .14));
		--_sombra:var(--gota-sombra,0 18px 40px rgb(0 0 0 / .55));
		--_sombra-campo:var(--gota-sombra-campo,inset 0 0 0 1px rgb(237 228 232 / .1));
		--_peligro:var(--gota-peligro,#EE7A92);
		--_aviso:var(--gota-aviso,#E8B266);
		--_exito:var(--gota-exito,#7CCBA5);
	}
}
:host([hidden]){display:none;}
*,*::before,*::after{box-sizing:border-box;}
button,input{font:inherit;color:inherit;}
button{cursor:pointer;}
.icono{width:1.15em;height:1.15em;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;}

/* La gota: luz por arriba y cáustica por abajo, como una gota sobre un cristal */
.gota{
	position:absolute;left:0;top:0;z-index:0;
	pointer-events:none;
	border-radius:999px;
	background:
		radial-gradient(70% 55% at 50% 108%,color-mix(in oklab,white 42%,transparent),transparent 72%),
		var(--_acento);
	box-shadow:
		inset 0 1px 1px color-mix(in oklab,white 55%,transparent),
		inset 0 -1px 2px color-mix(in oklab,black 18%,transparent),
		0 2px 6px color-mix(in oklab,var(--_acento) 40%,transparent);
}

/* La caja de campo que comparten todos los controles con texto */
.caja{
	display:flex;align-items:stretch;
	min-height:var(--_alto);
	border:1px solid transparent;
	border-radius:var(--_radio);
	background:var(--_campo);
	box-shadow:var(--_sombra-campo);
	transition:border-color .2s,background .2s,box-shadow .2s;
}
.caja:focus-within{
	border-color:var(--_acento);
	background:var(--_campo-foco);
	box-shadow:0 0 0 4px var(--_acento-suave);
}
:host([aria-invalid="true"]) .caja{border-color:var(--_peligro);}
:host([disabled]) .caja,:host(:disabled) .caja{opacity:.5;}
:host([readonly]) .caja{opacity:.65;}
.entrada{
	flex:1;min-width:0;width:100%;
	border:0;background:none;outline:none;
	padding:0 14px;
}
.entrada::placeholder{color:var(--_tinta-suave);opacity:.8;}
.marca{display:flex;align-items:center;padding-left:12px;color:var(--_tinta-suave);}
.marca + .entrada{padding-left:9px;}
.mando{
	flex:none;display:grid;place-items:center;width:38px;
	border:0;background:none;color:var(--_tinta-suave);
	border-radius:var(--_radio);
	transition:color .15s,background .15s;
}
.mando:focus-visible{outline:2px solid var(--_acento);outline-offset:-3px;}
@media (hover:hover){
	.mando:hover:not(:disabled){color:var(--_tinta);background:var(--_boton-hover);}
}
.mando:active:not(:disabled){transform:scale(.92);}
.panel{
	position:fixed;inset:auto;margin:0;
	max-width:min(360px,calc(100vw - 16px));
	padding:6px;
	color:var(--_tinta);
	font-family:var(--_fuente);
	background:var(--_panel);
	border:1px solid var(--_linea);
	border-radius:var(--_radio-panel);
	box-shadow:var(--_sombra);
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;}}
`;

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

/* =========================================================
   MOVIMIENTO: la gota, que es la firma de la librería
   ========================================================= */

const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Lleva la gota hasta la caja de `destino`.
 * La gota viaja estirándose en la dirección del movimiento, llega aplastada contra
 * el destino y recupera la forma: la tensión superficial de una gota de verdad.
 */
function moverGota(gota, destino, { animar = true } = {}) {
	if (!destino) { return; }
	gota.hidden = false;
	const padre = gota.offsetParent;
	if (!padre) { return; }

	const cajaPadre = padre.getBoundingClientRect();
	const caja = destino.getBoundingClientRect();
	if (!caja.width) { return; }

	const final = {
		x: caja.left - cajaPadre.left - padre.clientLeft + padre.scrollLeft,
		y: caja.top - cajaPadre.top - padre.clientTop + padre.scrollTop,
		ancho: caja.width,
		alto: caja.height
	};
	const inicial = gota.posicion;
	gota.posicion = final;

	gota.style.width = `${final.ancho}px`;
	gota.style.height = `${final.alto}px`;
	gota.style.transform = `translate(${final.x}px,${final.y}px)`;

	const dx = inicial ? final.x - inicial.x : 0;
	const dy = inicial ? final.y - inicial.y : 0;
	if (!animar || !inicial || (!dx && !dy) || sinMovimiento()) { return; }

	const horizontal = Math.abs(dx) >= Math.abs(dy);
	const estirado = horizontal ? "scale(1.22,.74)" : "scale(.8,1.2)";
	const aplastado = horizontal ? "scale(.9,1.12)" : "scale(1.1,.92)";
	const posicion = (avance) => `translate(${inicial.x + dx * avance}px,${inicial.y + dy * avance}px)`;

	gota.getAnimations().forEach((animacion) => animacion.cancel());
	gota.animate([
		{ transform: `${posicion(0)} scale(1,1)`, width: `${inicial.ancho}px`, height: `${inicial.alto}px`, easing: "cubic-bezier(.45,0,.75,.4)" },
		{ transform: `${posicion(.55)} ${estirado}`, offset: .46, easing: "cubic-bezier(.2,.6,.3,1)" },
		{ transform: `${posicion(1)} ${aplastado}`, width: `${final.ancho}px`, height: `${final.alto}px`, offset: .76, easing: "ease-in-out" },
		{ transform: `${posicion(1)} scale(1,1)`, width: `${final.ancho}px`, height: `${final.alto}px` }
	], { duration: 420 });
}

/** Coloca la gota sin animar cuando cambia el tamaño del contenedor */
function vigilarTamano(elemento, alCambiar) {
	const vigia = new ResizeObserver(() => alCambiar());
	vigia.observe(elemento);
	return vigia;
}

/**
 * Abre un panel en la capa superior del navegador (Popover API), junto a su ancla.
 * Así no lo recorta ningún overflow ni le afecta el backdrop-filter de un padre.
 */
class PanelFlotante {
	constructor(anfitrion, panel, ancla, alCerrar, { anchoDelAncla = true } = {}) {
		this.anfitrion = anfitrion;
		this.panel = panel;
		this.ancla = ancla;
		this.alCerrar = alCerrar;
		this.anchoDelAncla = anchoDelAncla;
		this.abierto = false;
		panel.setAttribute("popover", "manual");
		this.recolocar = () => this.colocar();
		this.fuera = (evento) => {
			if (!evento.composedPath().includes(this.anfitrion)) { this.cerrar(); }
		};
	}

	/** `preparar` rellena el panel antes de medirlo y de empezar a animarlo */
	abrir(preparar) {
		if (this.abierto) { return; }
		this.abierto = true;
		this.panel.showPopover();
		// Primero el ancho: la gota se mide después, sobre las medidas definitivas
		this.colocar();
		preparar?.();
		this.colocar();
		window.addEventListener("scroll", this.recolocar, true);
		window.addEventListener("resize", this.recolocar);
		document.addEventListener("pointerdown", this.fuera, true);

		if (!sinMovimiento()) {
			this.panel.animate([
				{ opacity: 0, transform: "translateY(-8px) scale(.97,.88)" },
				{ opacity: 1, transform: "translateY(2px) scale(1,1.02)", offset: .65 },
				{ opacity: 1, transform: "none" }
			], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
		}
	}

	cerrar() {
		if (!this.abierto) { return; }
		this.abierto = false;
		window.removeEventListener("scroll", this.recolocar, true);
		window.removeEventListener("resize", this.recolocar);
		document.removeEventListener("pointerdown", this.fuera, true);
		if (this.panel.isConnected) { this.panel.hidePopover(); }
		this.alCerrar?.();
	}

	colocar() {
		const ancla = this.ancla.getBoundingClientRect();
		const margen = 6;
		const borde = 8;
		if (this.anchoDelAncla) { this.panel.style.minWidth = `${Math.min(ancla.width, innerWidth - borde * 2)}px`; }
		const caja = this.panel.getBoundingClientRect();
		const cabeDebajo = ancla.bottom + margen + caja.height <= innerHeight - borde;
		const cabeEncima = ancla.top - margen - caja.height >= borde;
		const arriba = !cabeDebajo && cabeEncima ? ancla.top - margen - caja.height : ancla.bottom + margen;
		const izquierda = Math.max(borde, Math.min(ancla.left, innerWidth - caja.width - borde));
		this.panel.style.top = `${Math.max(borde, arriba)}px`;
		this.panel.style.left = `${izquierda}px`;
	}
}

/** Quita acentos y mayúsculas para comparar textos al filtrar */
function sinAcentos(texto) {
	return String(texto ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function crear(etiqueta, clases = "", atributos = {}) {
	const elemento = document.createElement(etiqueta);
	if (clases) { elemento.className = clases; }
	Object.entries(atributos).forEach(([nombre, valor]) => elemento.setAttribute(nombre, valor));
	return elemento;
}

const ICONOS = {
	texto: '<path d="M4 7V5h12v2M10 5v10M7.5 15h5"/>',
	email: '<circle cx="10" cy="10" r="3.2"/><path d="M13.2 6.8v4.4a2 2 0 0 0 3.8.8A7.5 7.5 0 1 0 14 16"/>',
	tel: '<path d="M5.5 3.5h2.2l1.2 3.4-1.6 1.2a9 9 0 0 0 4.6 4.6l1.2-1.6 3.4 1.2v2.2a1.5 1.5 0 0 1-1.6 1.5A12.5 12.5 0 0 1 4 5.1a1.5 1.5 0 0 1 1.5-1.6Z"/>',
	url: '<circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c2.2 2 3.2 4.4 3.2 7s-1 5-3.2 7c-2.2-2-3.2-4.4-3.2-7s1-5 3.2-7Z"/>',
	mas: '<path d="M10 5v10M5 10h10"/>',
	menos: '<path d="M5 10h10"/>',
	abajo: '<path d="m5.5 8 4.5 4.5L14.5 8"/>',
	izquierda: '<path d="M12 5.5 7.5 10l4.5 4.5"/>',
	derecha: '<path d="m8 5.5 4.5 4.5L8 14.5"/>',
	antes: '<path d="M10 5.5 5.5 10l4.5 4.5M15 5.5 10.5 10l4.5 4.5"/>',
	despues: '<path d="M5 5.5 9.5 10 5 14.5M10 5.5l4.5 4.5-4.5 4.5"/>',
	calendario: '<rect x="3.5" y="4.5" width="13" height="12" rx="2.5"/><path d="M3.5 8.5h13M7 3v3M13 3v3"/>',
	ojo: '<path d="M2.5 10S5.2 4.8 10 4.8 17.5 10 17.5 10 14.8 15.2 10 15.2 2.5 10 2.5 10Z"/><circle cx="10" cy="10" r="2.2"/>',
	ojoCerrado: '<path d="M3 3l14 14M8.3 5A7.6 7.6 0 0 1 10 4.8c4.8 0 7.5 5.2 7.5 5.2a13 13 0 0 1-2.4 3M5.3 6.3A12.7 12.7 0 0 0 2.5 10s2.7 5.2 7.5 5.2a7.4 7.4 0 0 0 3.3-.8"/>'
};

function icono(nombre) {
	return `<svg class="icono" viewBox="0 0 20 20" aria-hidden="true">${ICONOS[nombre]}</svg>`;
}

/* <gota-campo>: texto con el tipo de dato a la vista */
class GotaCampo extends GotaControl {
	static etiqueta = "gota-campo";
	static descripcion = "Campo de texto que indica qué dato espera y hereda la validación nativa de email, teléfono y URL.";
	static ejemplo = '<gota-campo type="email" name="correo" placeholder="nombre@ejemplo.com" required></gota-campo>';
	static partes = { caja: "Marco del campo.", entrada: "El input interno.", marca: "Icono del tipo de dato." };

	static TIPOS = { text: "texto", email: "email", tel: "tel", url: "url" };

	static propiedades = {
		type: { tipo: String, defecto: "text", opciones: ["text", "email", "tel", "url"], descripcion: "Tipo de dato." },
		placeholder: { tipo: String, defecto: "", descripcion: "Texto de ayuda con el campo vacío." },
		pattern: { tipo: String, defecto: "", descripcion: "Expresión regular que debe cumplir." },
		minlength: { tipo: Number, defecto: null, descripcion: "Longitud mínima." },
		maxlength: { tipo: Number, defecto: null, descripcion: "Longitud máxima." },
		autocomplete: { tipo: String, defecto: "off", descripcion: "Pista de autocompletado del navegador." },
		sinMarca: { tipo: Boolean, defecto: false, descripcion: "Oculta el icono del tipo de dato." }
	};

	static metodos = { "select()": "Selecciona todo el texto." };

	construir() {
		this.raiz.innerHTML = `
			<div class="caja" part="caja">
				<span class="marca" part="marca"></span>
				<input class="entrada" part="entrada">
			</div>`;
		this.entrada = this.raiz.querySelector("input");
		this.marca = this.raiz.querySelector(".marca");
		this.aislarEventos(this.entrada);
		this.enviarConEnter(this.entrada);
		this.entrada.addEventListener("input", () => this.cambiarPorUsuario(this.entrada.value, "teclado", false));
		this.entrada.addEventListener("change", () => this.dispatchEvent(new Event("change", { bubbles: true })));
	}

	controlEtiquetado() { return this.entrada; }

	actualizar() {
		const entrada = this.entrada;
		const tipo = GotaCampo.TIPOS[this.type] ? this.type : "text";

		entrada.type = tipo;
		entrada.placeholder = this.placeholder;
		entrada.autocomplete = this.autocomplete;
		entrada.disabled = this.bloqueado;
		entrada.readOnly = this.readonly;
		entrada.required = this.required;
		this.opcional(entrada, "pattern", this.pattern);
		this.opcional(entrada, "minlength", this.minlength);
		this.opcional(entrada, "maxlength", this.maxlength);
		if (entrada.value !== this.value) { entrada.value = this.value; }

		this.marca.hidden = this.sinMarca;
		this.marca.style.display = this.sinMarca ? "none" : "";
		this.marca.innerHTML = icono(GotaCampo.TIPOS[tipo]);
	}

	opcional(elemento, atributo, valor) {
		if (valor === null || valor === "") { elemento.removeAttribute(atributo); } else { elemento.setAttribute(atributo, valor); }
	}

	/** La validación de email, URL y patrón la hace el input nativo interno: no se reinventa */
	validar() {
		if (!this.entrada) { return super.validar(); }
		const v = this.entrada.validity;
		if (v.valid) { return null; }
		const banderas = {};
		["valueMissing", "typeMismatch", "patternMismatch", "tooShort", "tooLong"].forEach((nombre) => {
			if (v[nombre]) { banderas[nombre] = true; }
		});
		return { ...banderas, mensaje: this.entrada.validationMessage || "El valor no es válido." };
	}

	select() { this.entrada?.select(); }
}

/* <gota-cantidad>: números y dinero con pasos */
class GotaCantidad extends GotaControl {
	static etiqueta = "gota-cantidad";
	static descripcion = "Número con botones de paso, teclado (flechas, Inicio, Fin, Re Pág, Av Pág), límites y formato de moneda. Acepta coma decimal.";
	static ejemplo = '<gota-cantidad name="precio" formato="moneda" min="0" step="0.01" value="749.99"></gota-cantidad>';
	static partes = { caja: "Marco del campo.", entrada: "El input interno.", menos: "Botón de restar.", mas: "Botón de sumar.", unidad: "Símbolo de la moneda o la unidad." };

	static propiedades = {
		min: { tipo: Number, defecto: null, descripcion: "Valor mínimo. Sin él no hay límite." },
		max: { tipo: Number, defecto: null, descripcion: "Valor máximo. Sin él no hay límite." },
		step: { tipo: String, defecto: "1", descripcion: "Tamaño del paso. Con «any» no comprueba múltiplos." },
		formato: { tipo: String, defecto: "numero", opciones: ["numero", "moneda"], descripcion: "Cómo se muestra el valor al salir del campo." },
		moneda: { tipo: String, defecto: "EUR", descripcion: "Código ISO de la moneda." },
		unidad: { tipo: String, defecto: "", descripcion: "Unidad junto al número, como «uds.»." },
		placeholder: { tipo: String, defecto: "", descripcion: "Texto de ayuda con el campo vacío." },
		locale: { tipo: String, defecto: "es-ES", descripcion: "Idioma del formato." }
	};

	static metodos = {
		"incrementar(veces = 1)": "Suma pasos sin salir de los límites.",
		"decrementar(veces = 1)": "Resta pasos sin salir de los límites.",
		"stepUp(veces = 1)": "Igual que incrementar: mismo nombre que el input nativo.",
		"stepDown(veces = 1)": "Igual que decrementar: mismo nombre que el input nativo.",
		"select()": "Selecciona el texto."
	};

	get type() { return "number"; }

	/** Valor como número, o NaN si está vacío (igual que valueAsNumber) */
	get valorNumerico() { return this.value === "" ? NaN : Number(this.value); }

	/** Convierte lo que se escribe: «1.234,5», «1234,5» y «1234.5» son lo mismo */
	static interpretar(texto) {
		let limpio = String(texto).trim().replace(/\s|€/g, "");
		if (limpio === "") { return ""; }
		if (limpio.includes(",")) { limpio = limpio.replace(/\./g, "").replace(",", "."); }
		return /^-?\d*\.?\d+$|^-?\d+\.$/.test(limpio) ? String(Number(limpio)) : null;
	}

	normalizar(valor) {
		this.textoInvalido = false;
		if (valor === null || valor === undefined || valor === "") { return ""; }
		return GotaCantidad.interpretar(valor) ?? "";
	}

	construir() {
		this.raiz.innerHTML = `
			<div class="caja" part="caja">
				<input class="entrada" part="entrada" inputmode="decimal" role="spinbutton" autocomplete="off">
				<button class="mando" part="menos" type="button" tabindex="-1" aria-hidden="true">${icono("menos")}</button>
				<span class="unidad" part="unidad"></span>
				<button class="mando" part="mas" type="button" tabindex="-1" aria-hidden="true">${icono("mas")}</button>
			</div>`;
		this.entrada = this.raiz.querySelector("input");
		this.unidadVisible = this.raiz.querySelector(".unidad");
		this.botonMenos = this.raiz.querySelector("[part=menos]");
		this.botonMas = this.raiz.querySelector("[part=mas]");
		this.editando = false;

		this.aislarEventos(this.entrada);
		this.enviarConEnter(this.entrada);
		this.entrada.addEventListener("focus", () => {
			this.editando = true;
			if (!this.textoInvalido) { this.entrada.value = this.value; }
		});
		this.entrada.addEventListener("blur", () => {
			this.editando = false;
			this.mostrarValor();
			this.dispatchEvent(new Event("change", { bubbles: true }));
		});
		this.entrada.addEventListener("input", () => this.escribir());
		this.entrada.addEventListener("keydown", (evento) => this.teclado(evento));
		this.activarPulsacion(this.botonMenos, -1);
		this.activarPulsacion(this.botonMas, 1);
	}

	controlEtiquetado() { return this.entrada; }

	escribir() {
		const numero = GotaCantidad.interpretar(this.entrada.value);
		const anterior = this.valorActual;
		this.textoInvalido = numero === null;
		this.valorEditado = true;
		this.valorActual = numero ?? "";
		this.actualizarAria();
		this.volcarAlFormulario();
		this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		if (anterior !== this.valorActual) { this.emitir("gota-cambio", { valor: this.valorActual, anterior, origen: "teclado" }); }
	}

	teclado(evento) {
		const acciones = {
			ArrowUp: () => this.pasoUsuario(1, "teclado"),
			ArrowDown: () => this.pasoUsuario(-1, "teclado"),
			PageUp: () => this.pasoUsuario(10, "teclado"),
			PageDown: () => this.pasoUsuario(-10, "teclado"),
			Home: () => { if (this.min !== null) { this.cambiarPorUsuario(this.min, "teclado", false); } },
			End: () => { if (this.max !== null) { this.cambiarPorUsuario(this.max, "teclado", false); } }
		};
		if (acciones[evento.key] && !this.readonly && !this.bloqueado) {
			evento.preventDefault();
			acciones[evento.key]();
		}
	}

	/** Mantener pulsado repite el paso, cada vez más seguido */
	activarPulsacion(boton, sentido) {
		let espera;
		const parar = () => {
			if (espera === undefined) { return; }
			clearTimeout(espera);
			espera = undefined;
			this.dispatchEvent(new Event("change", { bubbles: true }));
		};
		boton.addEventListener("pointerdown", (evento) => {
			evento.preventDefault();
			if (this.bloqueado || this.readonly) { return; }
			this.pasoUsuario(sentido, "puntero");
			const repetir = (ritmo) => {
				espera = setTimeout(() => {
					this.pasoUsuario(sentido, "puntero");
					repetir(Math.max(50, ritmo * .82));
				}, ritmo);
			};
			repetir(420);
			// En window: al llegar al límite el botón se desactiva y ya no recibiría el pointerup
			window.addEventListener("pointerup", parar, { once: true });
			window.addEventListener("pointercancel", parar, { once: true });
		});
		// click() sin puntero: lo que hacen los gestos con la mano y los lectores de pantalla
		boton.addEventListener("click", (evento) => {
			if (evento.detail === 0 && !this.bloqueado && !this.readonly) { this.pasoUsuario(sentido, "puntero", true); }
		});
	}

	get pasoNumerico() {
		const paso = Number(this.step);
		return this.step === "any" || !(paso > 0) ? 1 : paso;
	}

	/** Suma pasos respetando los límites y sin los errores de redondeo de la coma flotante */
	calcularPaso(veces) {
		const paso = this.pasoNumerico;
		const decimales = (String(paso).split(".")[1] || "").length;
		const base = this.value === "" ? (this.min ?? 0) - (veces > 0 ? paso : -paso) : Number(this.value);
		let nuevo = Number((base + paso * veces).toFixed(Math.max(decimales, 2)));
		if (this.min !== null) { nuevo = Math.max(this.min, nuevo); }
		if (this.max !== null) { nuevo = Math.min(this.max, nuevo); }
		return nuevo;
	}

	pasoUsuario(veces, origen, confirmar = false) {
		this.cambiarPorUsuario(this.calcularPaso(veces), origen, confirmar);
	}

	incrementar(veces = 1) { this.value = this.calcularPaso(veces); }
	decrementar(veces = 1) { this.value = this.calcularPaso(-veces); }
	stepUp(veces = 1) { this.incrementar(veces); }
	stepDown(veces = 1) { this.decrementar(veces); }
	select() { this.entrada?.select(); }

	textoFormateado() {
		if (this.value === "") { return ""; }
		const moneda = this.formato === "moneda";
		return Number(this.value).toLocaleString(this.locale, {
			minimumFractionDigits: moneda ? 2 : 0,
			maximumFractionDigits: moneda ? 2 : 6
		});
	}

	simboloMoneda() {
		try {
			const partes = new Intl.NumberFormat(this.locale, { style: "currency", currency: this.moneda }).formatToParts(0);
			return partes.find((parte) => parte.type === "currency")?.value || this.moneda;
		} catch (error) {
			return this.moneda;
		}
	}

	mostrarValor() {
		if (this.textoInvalido) { return; }
		const texto = this.editando ? this.value : this.textoFormateado();
		if (this.entrada.value !== texto && !(this.editando && GotaCantidad.interpretar(this.entrada.value) === this.value)) {
			this.entrada.value = texto;
		}
	}

	actualizar() {
		this.entrada.disabled = this.bloqueado;
		this.entrada.readOnly = this.readonly;
		this.entrada.placeholder = this.placeholder;
		this.botonMenos.hidden = this.readonly;
		this.botonMas.hidden = this.readonly;
		this.unidadVisible.textContent = this.formato === "moneda" ? this.simboloMoneda() : this.unidad;
		this.unidadVisible.hidden = !this.unidadVisible.textContent;
		this.mostrarValor();
		this.actualizarAria();
	}

	actualizarAria() {
		const e = this.entrada;
		const fijar = (nombre, valor) => (valor === null || valor === "" ? e.removeAttribute(nombre) : e.setAttribute(nombre, valor));
		fijar("aria-valuemin", this.min);
		fijar("aria-valuemax", this.max);
		fijar("aria-valuenow", this.value);
		fijar("aria-valuetext", this.value === "" ? "" : `${this.textoFormateado()} ${this.unidadVisible.textContent}`.trim());
		this.botonMenos.disabled = this.bloqueado || this.readonly || (this.min !== null && this.value !== "" && Number(this.value) <= this.min);
		this.botonMas.disabled = this.bloqueado || this.readonly || (this.max !== null && this.value !== "" && Number(this.value) >= this.max);
	}

	validar() {
		if (this.textoInvalido) { return { badInput: true, mensaje: "Escribe un número." }; }
		if (this.value === "") { return super.validar(); }

		const numero = Number(this.value);
		if (this.min !== null && numero < this.min) { return { rangeUnderflow: true, mensaje: `El valor mínimo es ${this.min}.` }; }
		if (this.max !== null && numero > this.max) { return { rangeOverflow: true, mensaje: `El valor máximo es ${this.max}.` }; }
		if (this.step !== "any") {
			const cociente = (numero - (this.min ?? 0)) / this.pasoNumerico;
			if (Math.abs(cociente - Math.round(cociente)) > 1e-7) { return { stepMismatch: true, mensaje: `Usa múltiplos de ${this.step}.` }; }
		}
		return null;
	}

	static estilos = `
		:host{display:block;}
		/* El input va primero en el HTML para que reciba el foco; visualmente, entre los botones */
		.entrada{order:1;text-align:center;font-variant-numeric:tabular-nums;padding:0 4px;}
		.unidad{order:2;}
		[part=mas]{order:3;}
		:host([readonly]) .entrada{text-align:left;padding-left:14px;}
		.unidad{display:flex;align-items:center;padding-right:2px;color:var(--_tinta-suave);font-size:.9em;}
		.unidad[hidden],.mando[hidden]{display:none;}
		.mando:disabled{opacity:.3;cursor:default;}
	`;
}

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

/* <gota-fecha>: fecha escrita o elegida en un calendario */
class GotaFecha extends GotaControl {
	static etiqueta = "gota-fecha";
	static descripcion = "Fecha con calendario desplegable, que también se puede escribir (15/3/1990). El valor siempre es AAAA-MM-DD, como en un input date.";
	static ejemplo = '<gota-fecha name="alta" min="2026-01-01" value="2026-10-30"></gota-fecha>';
	static partes = { caja: "Marco del campo.", entrada: "El input interno.", abrir: "Botón del calendario.", calendario: "Panel del calendario.", dia: "Cada día." };

	static propiedades = {
		min: { tipo: String, defecto: "", descripcion: "Fecha mínima (AAAA-MM-DD)." },
		max: { tipo: String, defecto: "", descripcion: "Fecha máxima (AAAA-MM-DD)." },
		placeholder: { tipo: String, defecto: "dd/mm/aaaa", descripcion: "Texto de ayuda con el campo vacío." },
		locale: { tipo: String, defecto: "es-ES", descripcion: "Idioma del calendario." }
	};

	static eventos = {
		"gota-abrir": { detalle: "—", descripcion: "Se ha abierto el calendario." },
		"gota-cerrar": { detalle: "—", descripcion: "Se ha cerrado el calendario." },
		"gota-mes": { detalle: "{ anio, mes }", tipoDetalle: "{ anio: number; mes: number }", descripcion: "El calendario enseña otro mes. mes va de 1 a 12." }
	};

	static metodos = {
		"abrir()": "Abre el calendario.",
		"cerrar()": "Cierra el calendario.",
		"irAMes(anio, mes)": "Enseña ese mes (de 1 a 12) sin cambiar el valor.",
		"hoy()": "Elige la fecha de hoy y lanza los eventos."
	};

	get type() { return "date"; }

	/** Valor como Date local, o null (equivale a valueAsDate) */
	get valorFecha() { return GotaFecha.aFecha(this.value); }

	get estaAbierto() { return Boolean(this.flotante?.abierto); }

	static iso(fecha) {
		const mes = String(fecha.getMonth() + 1).padStart(2, "0");
		const dia = String(fecha.getDate()).padStart(2, "0");
		return `${String(fecha.getFullYear()).padStart(4, "0")}-${mes}-${dia}`;
	}

	/** De AAAA-MM-DD a Date en hora local. new Date("2026-03-01") sería UTC y podría cambiar de día. */
	static aFecha(iso) {
		const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
		if (!partes) { return null; }
		const [anio, mes, dia] = partes.slice(1).map(Number);
		const fecha = new Date(anio, mes - 1, dia);
		return fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null;
	}

	/** Entiende 15/3/1990, 15-03-90, 15.3.1990 y 1990-03-15. Devuelve el ISO, "" si está vacío o null si no es una fecha. */
	static interpretar(texto) {
		const limpio = String(texto ?? "").trim();
		if (!limpio) { return ""; }
		if (GotaFecha.aFecha(limpio)) { return limpio; }

		const partes = /^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{2}|\d{4})$/.exec(limpio);
		if (!partes) { return null; }
		const anio = partes[3].length === 2 ? 2000 + Number(partes[3]) - (Number(partes[3]) > 50 ? 100 : 0) : Number(partes[3]);
		const iso = `${String(anio).padStart(4, "0")}-${partes[2].padStart(2, "0")}-${partes[1].padStart(2, "0")}`;
		return GotaFecha.aFecha(iso) ? iso : null;
	}

	normalizar(valor) {
		this.textoInvalido = false;
		return GotaFecha.interpretar(valor) || "";
	}

	alDesconectar() { this.flotante?.cerrar(); }

	construir() {
		this.raiz.innerHTML = `
			<div class="caja" part="caja">
				<input class="entrada" part="entrada" inputmode="numeric" autocomplete="off" spellcheck="false">
				<button class="mando" part="abrir" type="button" tabindex="-1" aria-label="Abrir el calendario">${icono("calendario")}</button>
			</div>
			<div class="panel" part="calendario" role="dialog" aria-label="Calendario">
				<div class="cabecera">
					<button class="mando" type="button" data-meses="-12" aria-label="Año anterior">${icono("antes")}</button>
					<button class="mando" type="button" data-meses="-1" aria-label="Mes anterior">${icono("izquierda")}</button>
					<strong class="titulo" id="titulo" aria-live="polite"></strong>
					<button class="mando" type="button" data-meses="1" aria-label="Mes siguiente">${icono("derecha")}</button>
					<button class="mando" type="button" data-meses="12" aria-label="Año siguiente">${icono("despues")}</button>
				</div>
				<div class="dias-semana" aria-hidden="true"></div>
				<div class="rejilla" role="grid" aria-labelledby="titulo">
					<span class="gota" aria-hidden="true" hidden></span>
				</div>
			</div>`;
		this.caja = this.raiz.querySelector(".caja");
		this.entrada = this.raiz.querySelector("input");
		this.botonAbrir = this.raiz.querySelector("[part=abrir]");
		this.panel = this.raiz.querySelector(".panel");
		this.titulo = this.raiz.querySelector(".titulo");
		this.rejilla = this.raiz.querySelector(".rejilla");
		this.gota = this.raiz.querySelector(".gota");
		this.flotante = new PanelFlotante(this, this.panel, this.caja, () => this.alCerrarPanel(), { anchoDelAncla: false });
		this.vista = { anio: 0, mes: 0 };

		const semana = this.raiz.querySelector(".dias-semana");
		for (let dia = 0; dia < 7; dia++) {
			// El 5 de enero de 2026 fue lunes
			const texto = new Date(2026, 0, 5 + dia).toLocaleDateString(this.locale, { weekday: "narrow" });
			semana.append(Object.assign(crear("span"), { textContent: texto }));
		}

		this.aislarEventos(this.entrada);
		this.enviarConEnter(this.entrada);
		this.entrada.addEventListener("input", () => this.escribir());
		this.entrada.addEventListener("blur", () => this.alSalirDelTexto());
		this.entrada.addEventListener("keydown", (evento) => {
			if (evento.key === "ArrowDown" && !this.readonly) {
				evento.preventDefault();
				this.abrir(true);
			}
		});
		this.botonAbrir.addEventListener("mousedown", (evento) => evento.preventDefault());
		this.botonAbrir.addEventListener("click", () => {
			if (this.estaAbierto) { this.cerrar(); } else { this.abrir(); }
		});
		this.panel.addEventListener("mousedown", (evento) => evento.preventDefault());
		this.panel.addEventListener("click", (evento) => this.pulsar(evento));
		this.panel.addEventListener("keydown", (evento) => this.teclado(evento));
		this.addEventListener("click", (evento) => {
			if (evento.composedPath()[0] === this) { this.entrada.focus(); }
		});
	}

	controlEtiquetado() { return this.entrada; }

	textoVisible() {
		const fecha = this.valorFecha;
		return fecha ? fecha.toLocaleDateString(this.locale, { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
	}

	escribir() {
		const iso = GotaFecha.interpretar(this.entrada.value);
		const anterior = this.valorActual;
		this.textoInvalido = iso === null;
		this.valorEditado = true;
		this.valorActual = iso ?? "";
		this.volcarAlFormulario();
		this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		if (anterior !== this.valorActual) { this.emitir("gota-cambio", { valor: this.valorActual, anterior, origen: "teclado" }); }
	}

	alSalirDelTexto() {
		if (!this.textoInvalido) { this.entrada.value = this.textoVisible(); }
		this.dispatchEvent(new Event("change", { bubbles: true }));
	}

	actualizar() {
		this.entrada.disabled = this.bloqueado;
		this.entrada.readOnly = this.readonly;
		this.entrada.placeholder = this.placeholder;
		this.botonAbrir.disabled = this.bloqueado;
		this.botonAbrir.hidden = this.readonly;
		if (!this.textoInvalido && this.shadowRoot.activeElement !== this.entrada) { this.entrada.value = this.textoVisible(); }
		if (this.estaAbierto) { this.pintarMes(); }
	}

	validar() {
		if (this.textoInvalido) { return { badInput: true, mensaje: "Escribe una fecha como 15/03/2026." }; }
		if (!this.value) { return super.validar(); }
		if (this.min && this.value < this.min) { return { rangeUnderflow: true, mensaje: `La fecha no puede ser anterior a ${this.min}.` }; }
		if (this.max && this.value > this.max) { return { rangeOverflow: true, mensaje: `La fecha no puede ser posterior a ${this.max}.` }; }
		return null;
	}

	abrir(llevarFoco = false) {
		if (this.estaAbierto || this.bloqueado || this.readonly) { return; }
		const base = this.valorFecha || new Date();
		this.vista = { anio: base.getFullYear(), mes: base.getMonth() };
		this.enfocado = GotaFecha.iso(base);

		this.flotante.abrir(() => {
			this.gota.posicion = null;
			this.pintarMes();
		});
		if (llevarFoco) { this.diaEnfocado()?.focus(); }
		this.emitir("gota-abrir");
	}

	cerrar() {
		clearTimeout(this.esperaCierre);
		this.flotante?.cerrar();
	}

	alCerrarPanel() {
		this.emitir("gota-cerrar");
	}

	pulsar(evento) {
		const objetivo = evento.target.closest("button");
		if (!objetivo) { return; }
		if (objetivo.dataset.meses) {
			this.cambiarMes(Number(objetivo.dataset.meses));
		} else if (objetivo.dataset.dia && !objetivo.disabled) {
			this.elegirDia(objetivo.dataset.dia, "puntero");
		}
	}

	cambiarMes(meses) {
		const nueva = new Date(this.vista.anio, this.vista.mes + meses, 1);
		this.irAMes(nueva.getFullYear(), nueva.getMonth() + 1);
	}

	irAMes(anio, mes) {
		this.vista = { anio, mes: mes - 1 };
		this.gota.posicion = null;
		if (this.estaAbierto) { this.pintarMes(); }
		this.emitir("gota-mes", { anio, mes });
	}

	elegirDia(iso, origen) {
		this.cambiarPorUsuario(iso, origen);
		this.textoInvalido = false;
		this.entrada.value = this.textoVisible();
		this.volcarAlFormulario();
		// La espera deja ver cómo llega la gota al día elegido antes de cerrar
		clearTimeout(this.esperaCierre);
		this.esperaCierre = setTimeout(() => {
			this.cerrar();
			this.entrada.focus();
		}, sinMovimiento() ? 0 : 300);
	}

	hoy() { this.cambiarPorUsuario(GotaFecha.iso(new Date()), "codigo"); }

	diaEnfocado() {
		return this.rejilla.querySelector(`[data-dia="${this.enfocado}"]`) || this.rejilla.querySelector("[data-dia]:not(.otro)");
	}

	teclado(evento) {
		if (evento.key === "Escape") {
			evento.preventDefault();
			evento.stopPropagation();
			this.cerrar();
			this.entrada.focus();
			return;
		}
		const actual = evento.target.closest?.("[data-dia]");
		if (!actual) { return; }

		const fecha = GotaFecha.aFecha(actual.dataset.dia);
		const movimientos = {
			ArrowLeft: () => fecha.setDate(fecha.getDate() - 1),
			ArrowRight: () => fecha.setDate(fecha.getDate() + 1),
			ArrowUp: () => fecha.setDate(fecha.getDate() - 7),
			ArrowDown: () => fecha.setDate(fecha.getDate() + 7),
			Home: () => fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7)),
			End: () => fecha.setDate(fecha.getDate() + (6 - ((fecha.getDay() + 6) % 7))),
			PageUp: () => fecha.setMonth(fecha.getMonth() - 1),
			PageDown: () => fecha.setMonth(fecha.getMonth() + 1)
		};
		if (!movimientos[evento.key]) { return; }

		evento.preventDefault();
		movimientos[evento.key]();
		this.enfocado = GotaFecha.iso(fecha);
		if (fecha.getFullYear() !== this.vista.anio || fecha.getMonth() !== this.vista.mes) {
			this.irAMes(fecha.getFullYear(), fecha.getMonth() + 1);
		} else {
			this.marcarEnfocado();
		}
		this.diaEnfocado()?.focus();
	}

	marcarEnfocado() {
		this.rejilla.querySelectorAll("[data-dia]").forEach((dia) => {
			dia.tabIndex = dia.dataset.dia === this.enfocado ? 0 : -1;
		});
	}

	pintarMes() {
		const { anio, mes } = this.vista;
		const primero = new Date(anio, mes, 1);
		const hueco = (primero.getDay() + 6) % 7; // semana de lunes a domingo
		const hoy = GotaFecha.iso(new Date());

		this.titulo.textContent = primero.toLocaleDateString(this.locale, { month: "long", year: "numeric" });
		this.rejilla.querySelectorAll("[role=row]").forEach((semana) => semana.remove());

		// Seis semanas: role="grid" > row > gridcell, como pide el patrón de calendario de ARIA.
		// Las filas usan display:contents para que los días sigan en la rejilla de 7 columnas.
		let semana;
		for (let i = 0; i < 42; i++) {
			if (i % 7 === 0) {
				semana = crear("div", "semana", { role: "row" });
				this.rejilla.append(semana);
			}
			const fecha = new Date(anio, mes, 1 - hueco + i);
			const iso = GotaFecha.iso(fecha);
			const boton = crear("button", "dia", { type: "button", part: "dia", tabindex: "-1", role: "gridcell" });
			const fueraDeRango = (this.min && iso < this.min) || (this.max && iso > this.max);

			boton.dataset.dia = iso;
			boton.textContent = fecha.getDate();
			boton.setAttribute("aria-label", fecha.toLocaleDateString(this.locale, { dateStyle: "full" }));
			boton.setAttribute("aria-selected", String(iso === this.value));
			boton.disabled = Boolean(fueraDeRango);
			boton.classList.toggle("otro", fecha.getMonth() !== mes);
			boton.classList.toggle("hoy", iso === hoy);
			boton.classList.toggle("elegido", iso === this.value);
			semana.append(boton);
		}

		this.marcarEnfocado();
		const elegido = this.rejilla.querySelector(".elegido");
		if (elegido) {
			moverGota(this.gota, elegido);
		} else {
			this.gota.hidden = true;
			this.gota.posicion = null;
		}
		if (this.estaAbierto) { this.flotante.colocar(); }
	}

	static estilos = `
		:host{display:block;}
		.entrada{padding-right:2px;}
		.mando[hidden]{display:none;}
		.panel{width:296px;padding:10px;}
		.panel:not(:popover-open){display:none;}
		.cabecera{display:flex;align-items:center;gap:2px;margin-bottom:8px;}
		.cabecera .mando{width:26px;height:30px;border-radius:50%;}
		.titulo{flex:1;text-align:center;font-family:var(--_fuente-titulo);font-style:italic;font-weight:600;font-size:1.05em;white-space:nowrap;}
		.titulo::first-letter{text-transform:uppercase;}
		.dias-semana,.rejilla{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
		.dias-semana span{display:grid;place-items:center;height:26px;font-size:.8em;color:var(--_tinta-suave);}
		.rejilla{position:relative;}
		.semana{display:contents;}
		.gota{border-radius:50%;}
		.dia{
			position:relative;z-index:1;
			aspect-ratio:1;display:grid;place-items:center;padding:0;
			border:0;border-radius:50%;background:none;
			font-variant-numeric:tabular-nums;
			transition:background .15s,color .15s;
		}
		.dia.otro{color:var(--_tinta-suave);font-weight:300;}
		.dia.hoy{box-shadow:inset 0 0 0 1px var(--_tinta-suave);}
		.dia.elegido{color:var(--_sobre-acento);font-weight:700;opacity:1;}
		.dia:disabled{opacity:.25;cursor:not-allowed;}
		.dia:focus-visible{outline:2px solid var(--_acento);outline-offset:1px;}
		@media (hover:hover){.dia:hover:not(:disabled,.elegido){background:var(--_boton-hover);}}
	`;
}

/* <gota-interruptor>: sí o no */
class GotaInterruptor extends GotaControl {
	static etiqueta = "gota-interruptor";
	static descripcion = "Interruptor para valores de sí o no. La gota cruza el canal y se estira al hacerlo. Se usa igual que una casilla: propiedad checked y evento change.";
	static ejemplo = '<gota-interruptor name="activo" checked></gota-interruptor>';
	static partes = { canal: "El canal por el que corre la gota." };

	static propiedades = {
		checked: { tipo: Boolean, atributo: "checked", defecto: false, descripcion: "Activado. El atributo es el estado inicial, al que vuelve con reset(); la propiedad es el estado actual." },
		value: { tipo: String, defecto: "on", descripcion: "Valor que se envía cuando está activado." }
	};

	static eventos = {
		"gota-cambio": { detalle: "{ valor, anterior, origen }", tipoDetalle: '{ valor: boolean; anterior: boolean; origen: "teclado" | "puntero" | "codigo" }', descripcion: "Cambio con datos. valor es true o false; origen es teclado, puntero o codigo." }
	};

	static metodos = { "alternar()": "Cambia de estado sin lanzar eventos." };

	get type() { return "checkbox"; }

	get checked() { return Boolean(this.marcado); }

	set checked(valor) {
		this.marcado = Boolean(valor);
		this.valorEditado = true;
		if (this.construido) { this.actualizar("checked"); }
		this.volcarAlFormulario();
	}

	get value() { return this.getAttribute("value") ?? "on"; }
	set value(valor) { this.setAttribute("value", valor); }

	connectedCallback() {
		if (!this.construido && !this.valorEditado) {
			this.marcado = this.hasAttribute("checked");
			this.recuperar();
		}
		super.connectedCallback();
	}

	attributeChangedCallback(nombre, anterior, actual) {
		if (nombre === "checked" && !this.valorEditado) { this.marcado = actual !== null; }
		super.attributeChangedCallback(nombre, anterior, actual);
	}

	/** El valor de un interruptor no cambia al usarlo: lo que se recuerda es checked */
	recuperar() {
		if (!this.persistir) { return; }
		try {
			const guardado = localStorage.getItem(`gota:${this.persistir}`);
			if (guardado !== null) {
				this.marcado = guardado === "true";
				this.valorEditado = true;
			}
		} catch (error) { /* almacenamiento bloqueado */ }
	}

	textoAGuardar() { return String(this.checked); }

	construir() {
		this.raiz.innerHTML = `
			<button class="canal" part="canal" type="button" role="switch" aria-checked="false">
				<span class="hueco inicio"></span>
				<span class="hueco final"></span>
				<span class="gota"></span>
			</button>`;
		this.canal = this.raiz.querySelector("button");
		this.gota = this.raiz.querySelector(".gota");
		this.inicio = this.raiz.querySelector(".inicio");
		this.final = this.raiz.querySelector(".final");

		this.canal.addEventListener("click", (evento) => {
			this.alternarUsuario(evento.detail === 0 ? "teclado" : "puntero");
		});
		// El clic que reenvía el <label> llega al propio componente
		this.addEventListener("click", (evento) => {
			if (evento.composedPath()[0] === this) { this.canal.click(); }
		});
		vigilarTamano(this.canal, () => this.colocar(false));
	}

	controlEtiquetado() { return this.canal; }

	alternarUsuario(origen) {
		if (this.bloqueado || this.readonly) { return; }
		const anterior = this.checked;
		this.checked = !anterior;
		this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		this.dispatchEvent(new Event("change", { bubbles: true }));
		this.emitir("gota-cambio", { valor: this.checked, anterior, origen });
	}

	alternar() { this.checked = !this.checked; }

	limpiar() { this.checked = false; }

	formResetCallback() {
		this.valorEditado = false;
		this.marcado = this.hasAttribute("checked");
		this.actualizar("checked");
		this.volcarAlFormulario();
	}

	formStateRestoreCallback(estado) {
		this.checked = estado !== null;
	}

	actualizar() {
		this.canal.setAttribute("aria-checked", String(this.checked));
		this.canal.disabled = this.bloqueado;
		this.canal.setAttribute("aria-readonly", String(this.readonly));
		this.colocar(true);
	}

	colocar(animar) {
		moverGota(this.gota, this.checked ? this.final : this.inicio, { animar });
	}

	valorDeFormulario() { return this.checked ? this.value : null; }

	validar() {
		return this.required && !this.checked ? { valueMissing: true, mensaje: "Hay que activar esta opción." } : null;
	}

	static estilos = `
		:host{display:inline-block;vertical-align:middle;line-height:0;}
		.canal{
			position:relative;display:block;
			width:46px;height:26px;padding:0;
			border:0;border-radius:999px;
			background:var(--_campo);
			box-shadow:var(--_sombra-campo),inset 0 0 0 1px var(--_linea);
			transition:background .25s;
		}
		.canal[aria-checked="true"]{background:var(--_acento-suave);}
		.canal:focus-visible{outline:2px solid var(--_acento);outline-offset:3px;}
		.canal:disabled{opacity:.45;cursor:not-allowed;}
		:host([readonly]) .canal{cursor:default;opacity:.7;}
		.hueco{position:absolute;top:3px;width:20px;height:20px;}
		.inicio{left:3px;}
		.final{right:3px;}
		.canal[aria-checked="false"] .gota{
			background:radial-gradient(70% 55% at 50% 108%,color-mix(in oklab,white 34%,transparent),transparent 72%),var(--_tinta-suave);
			box-shadow:inset 0 1px 1px color-mix(in oklab,white 40%,transparent);
		}
	`;
}

/* <gota-clave>: contraseña que envuelve un <input> real */
class GotaClave extends GotaElemento {
	static etiqueta = "gota-clave";
	static descripcion = "Envuelve un <input type=\"password\"> real, que se queda en el HTML de la página para que los gestores de contraseñas lo encuentren. Añade mostrar y ocultar y, si se pide, un medidor de fuerza.";
	static ejemplo = '<gota-clave medidor><input name="clave" type="password" autocomplete="new-password"></gota-clave>';
	static partes = { caja: "Marco del campo.", ver: "Botón de mostrar y ocultar.", medidor: "Tubo de fuerza.", texto: "Texto de fuerza." };

	static propiedades = {
		medidor: { tipo: Boolean, defecto: false, descripcion: "Muestra el medidor de fuerza." },
		minimo: { tipo: Number, defecto: 8, descripcion: "Longitud mínima que pide el medidor." },
		visible: { tipo: Boolean, defecto: false, descripcion: "La contraseña se ve en claro." }
	};

	static eventos = {
		"gota-visibilidad": { detalle: "{ visible }", tipoDetalle: "{ visible: boolean }", descripcion: "Se ha mostrado u ocultado la contraseña." },
		"gota-fuerza": { detalle: "{ puntos, texto }", tipoDetalle: "{ puntos: number; texto: string }", descripcion: "Ha cambiado la fuerza de la contraseña (de 0 a 5)." }
	};

	static metodos = {
		"mostrar()": "Enseña la contraseña en claro.",
		"ocultar()": "Vuelve a ocultarla.",
		"alternar()": "Cambia entre las dos."
	};

	static NIVELES = ["", "Débil", "Mejorable", "Aceptable", "Buena", "Muy buena"];

	/** Puntos de 0 a 5: longitud, mayúsculas y minúsculas, números y símbolos */
	static puntuar(clave) {
		let puntos = 0;
		if (clave.length >= 8) { puntos++; }
		if (clave.length >= 12) { puntos++; }
		if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) { puntos++; }
		if (/\d/.test(clave)) { puntos++; }
		if (/[^A-Za-z0-9]/.test(clave)) { puntos++; }
		return puntos;
	}

	get entrada() { return this.querySelector("input"); }
	get value() { return this.entrada?.value ?? ""; }
	set value(valor) {
		if (this.entrada) { this.entrada.value = valor; }
		this.medir();
	}

	/** De 0 a 5; con algo escrito, al menos 1 */
	get fuerza() { return this.value ? Math.max(1, GotaClave.puntuar(this.value)) : 0; }

	construir() {
		this.raiz.innerHTML = `
			<div class="caja" part="caja">
				<slot></slot>
				<button class="mando" part="ver" type="button"></button>
			</div>
			<div class="medidor" hidden>
				<div class="tubo" part="medidor"><div class="liquido"></div></div>
				<span class="texto" part="texto" aria-live="polite"></span>
			</div>`;
		this.boton = this.raiz.querySelector("button");
		this.zonaMedidor = this.raiz.querySelector(".medidor");
		this.liquido = this.raiz.querySelector(".liquido");
		this.texto = this.raiz.querySelector(".texto");

		this.boton.addEventListener("click", () => this.alternar());
		this.addEventListener("input", (evento) => {
			if (evento.target === this.entrada) { this.medir(); }
		});
		this.medir();
	}

	mostrar() { this.visible = true; }
	ocultar() { this.visible = false; }
	alternar() { this.visible = !this.visible; }

	actualizar(atributo) {
		const visible = this.visible;
		if (this.entrada) { this.entrada.type = visible ? "text" : "password"; }
		this.boton.innerHTML = icono(visible ? "ojoCerrado" : "ojo");
		this.boton.setAttribute("aria-label", visible ? "Ocultar la contraseña" : "Mostrar la contraseña");
		this.boton.setAttribute("aria-pressed", String(visible));
		this.zonaMedidor.hidden = !this.medidor;
		if (atributo === "visible") { this.emitir("gota-visibilidad", { visible }); }
		this.medir();
	}

	medir() {
		if (!this.construido || !this.liquido) { return; }
		const puntos = this.fuerza;
		const corta = this.value.length < this.minimo;
		const texto = corta ? `Mínimo ${this.minimo} caracteres.` : GotaClave.NIVELES[puntos];

		this.liquido.style.transform = `scaleX(${puntos / 5})`;
		this.zonaMedidor.dataset.puntos = puntos;
		if (this.texto.textContent !== texto) { this.texto.textContent = texto; }
		if (puntos !== this.puntosAnteriores) {
			if (this.puntosAnteriores !== undefined) { this.emitir("gota-fuerza", { puntos, texto }); }
			this.puntosAnteriores = puntos;
		}
	}

	static estilos = `
		:host{display:block;}
		.caja{position:relative;}
		slot{display:block;flex:1;min-width:0;}
		::slotted(input){
			width:100%;height:100%;min-height:var(--_alto);
			border:0!important;background:none!important;box-shadow:none!important;outline:none;
			padding:0 44px 0 14px!important;
			font:inherit;color:inherit;
		}
		.mando{position:absolute;right:2px;top:2px;bottom:2px;}
		.medidor{display:grid;gap:4px;margin-top:6px;}
		.medidor[hidden]{display:none;}
		.tubo{height:6px;border-radius:999px;overflow:hidden;background:var(--_campo);box-shadow:var(--_sombra-campo);}
		.liquido{height:100%;transform:scaleX(0);transform-origin:0 50%;background:var(--_peligro);border-radius:inherit;transition:transform .45s cubic-bezier(.3,.7,.3,1),background .3s;}
		[data-puntos="2"] .liquido,[data-puntos="3"] .liquido{background:var(--_aviso);}
		[data-puntos="4"] .liquido,[data-puntos="5"] .liquido{background:var(--_exito);}
		.texto{font-size:12px;font-weight:400;color:var(--_tinta-suave);}
	`;
}

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

/* <gota-nivel>: una cantidad como líquido en un tubo */
class GotaNivel extends GotaElemento {
	static etiqueta = "gota-nivel";
	static descripcion = "Enseña una cantidad como el líquido de un tubo, con una marca de mínimo y un estado que cambia de color: agotado, bajo, normal o lleno.";
	static ejemplo = '<gota-nivel value="7" max="60" minimo="10" unidad="uds."></gota-nivel>';
	static partes = { tubo: "El tubo.", liquido: "El líquido.", marca: "La marca del mínimo.", cifra: "El número." };

	static propiedades = {
		value: { tipo: Number, defecto: 0, descripcion: "Cantidad actual." },
		max: { tipo: Number, defecto: 100, descripcion: "Cantidad con la que el tubo está lleno." },
		minimo: { tipo: Number, defecto: 0, descripcion: "Por debajo de esta cantidad el estado es «bajo». Con 0 no hay marca." },
		unidad: { tipo: String, defecto: "", descripcion: "Unidad junto a la cifra." },
		vertical: { tipo: Boolean, defecto: false, descripcion: "Tubo de pie, como una probeta." },
		sinCifra: { tipo: Boolean, defecto: false, descripcion: "Oculta el número." },
		etiqueta: { tipo: String, defecto: "Nivel", descripcion: "Nombre para los lectores de pantalla." }
	};

	static eventos = {
		"gota-umbral": { detalle: "{ estado, anterior, valor }", tipoDetalle: '{ estado: EstadoNivel; anterior: EstadoNivel; valor: number }', descripcion: "El nivel ha pasado a otro estado." }
	};

	static metodos = {
		"ajustar(diferencia)": "Suma o resta a la cantidad actual, sin bajar de 0."
	};

	static delegarFoco = false;

	/** agotado, bajo, normal o lleno */
	get estado() {
		const valor = this.value;
		if (valor <= 0) { return "agotado"; }
		if (valor < this.minimo) { return "bajo"; }
		return valor >= this.max ? "lleno" : "normal";
	}

	/** Parte del tubo que está llena, de 0 a 1 */
	get proporcion() {
		return this.max > 0 ? Math.min(1, Math.max(0, this.value / this.max)) : 0;
	}

	construir() {
		this.raiz.innerHTML = `
			<div class="nivel" role="meter">
				<div class="tubo" part="tubo">
					<div class="liquido" part="liquido"><svg class="ola" viewBox="0 0 40 8" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4c5-4 10-4 15 0s10 4 15 0 10-4 15 0 10 4 15 0v8H0Z"/></svg></div>
					<span class="minimo" part="marca" hidden></span>
				</div>
				<span class="cifra" part="cifra"></span>
			</div>`;
		this.caja = this.raiz.querySelector(".nivel");
		this.liquido = this.raiz.querySelector(".liquido");
		this.ola = this.raiz.querySelector(".ola");
		this.marca = this.raiz.querySelector(".minimo");
		this.cifra = this.raiz.querySelector(".cifra");
		this.estadoAnterior = null;
		this.proporcionAnterior = null;
	}

	actualizar() {
		const estado = this.estado;
		const proporcion = this.proporcion;
		const eje = this.vertical ? "scaleY" : "scaleX";
		const unidad = this.unidad ? ` ${this.unidad}` : "";

		this.caja.dataset.estado = estado;
		this.caja.setAttribute("aria-label", this.etiqueta);
		this.caja.setAttribute("aria-valuemin", "0");
		this.caja.setAttribute("aria-valuemax", String(this.max));
		this.caja.setAttribute("aria-valuenow", String(this.value));
		this.caja.setAttribute("aria-valuetext", `${this.value}${unidad}, ${estado}`);
		this.caja.classList.toggle("en-pie", this.vertical);
		this.liquido.style.transform = `${eje}(${proporcion})`;
		this.cifra.textContent = `${Number(this.value).toLocaleString("es-ES")}${unidad}`;
		this.cifra.hidden = this.sinCifra;

		const hayMarca = this.minimo > 0 && this.max > 0;
		this.marca.hidden = !hayMarca;
		if (hayMarca) {
			const posicion = `${Math.min(100, (this.minimo / this.max) * 100)}%`;
			this.marca.style.left = this.vertical ? "" : posicion;
			this.marca.style.bottom = this.vertical ? posicion : "";
		}

		this.animarLiquido(proporcion, eje);

		if (this.estadoAnterior !== null && estado !== this.estadoAnterior) {
			this.emitir("gota-umbral", { estado, anterior: this.estadoAnterior, valor: this.value });
		}
		this.estadoAnterior = estado;
	}

	/** El líquido solo se mueve cuando cambia la cantidad: en una tabla no debe distraer */
	animarLiquido(proporcion, eje) {
		const anterior = this.proporcionAnterior;
		this.proporcionAnterior = proporcion;
		if (anterior === null || anterior === proporcion || sinMovimiento()) { return; }

		this.liquido.animate([
			{ transform: `${eje}(${anterior})` },
			{ transform: `${eje}(${proporcion + (proporcion - anterior) * .08})`, offset: .7 },
			{ transform: `${eje}(${proporcion})` }
		], { duration: 620, easing: "cubic-bezier(.3,.7,.3,1)" });
		this.ola.animate([{ transform: "translateX(0)" }, { transform: "translateX(-37.5%)" }], { duration: 620, iterations: 2, easing: "linear" });
	}

	ajustar(diferencia) { this.value = Math.max(0, this.value + diferencia); }

	static estilos = `
		:host{display:inline-block;vertical-align:middle;--_color:var(--_acento);}
		.nivel{display:flex;align-items:center;gap:8px;}
		.nivel[data-estado="bajo"]{--_color:var(--_aviso);}
		.nivel[data-estado="agotado"]{--_color:var(--_peligro);}
		.nivel[data-estado="agotado"] .cifra{color:var(--_peligro);}
		/* El ámbar solo no llega a 4,5:1 sobre fondo claro: la cifra lo mezcla con la tinta */
		.nivel[data-estado="bajo"] .cifra{color:color-mix(in oklab,var(--_aviso) 60%,var(--_tinta));}
		.tubo{
			position:relative;flex:none;
			width:var(--gota-nivel-largo,64px);height:12px;
			border-radius:999px;overflow:hidden;
			background:var(--_campo);
			box-shadow:var(--_sombra-campo),inset 0 0 0 1px var(--_linea);
		}
		.liquido{
			position:absolute;inset:0;transform-origin:0 50%;
			background:linear-gradient(180deg,color-mix(in oklab,white 26%,var(--_color)),var(--_color) 58%);
			transition:background .3s;
		}
		.ola{display:none;}
		.minimo{position:absolute;top:1px;bottom:1px;width:2px;margin-left:-1px;background:var(--_tinta);opacity:.55;}
		.cifra{font-variant-numeric:tabular-nums;min-width:2ch;text-align:right;white-space:nowrap;}
		.cifra[hidden]{display:none;}

		.en-pie{flex-direction:column-reverse;gap:6px;}
		.en-pie .tubo{width:34px;height:var(--gota-nivel-largo,120px);border-radius:6px 6px 17px 17px;}
		.en-pie .liquido{transform-origin:50% 100%;}
		.en-pie .minimo{top:auto;left:0;right:0;width:auto;height:2px;margin:0 0 -1px;}
		.en-pie .ola{
			display:block;position:absolute;left:0;bottom:calc(100% - 1px);
			width:400%;height:7px;fill:color-mix(in oklab,white 26%,var(--_color));
		}
	`;
}

/* =========================================================
   REGISTRO Y API PÚBLICA
   ========================================================= */
const COMPONENTES = [GotaCampo, GotaCantidad, GotaSelector, GotaFecha, GotaInterruptor, GotaClave, GotaFiltros, GotaPaginador, GotaNivel];

COMPONENTES.forEach((componente) => componente.definir());

/** Devuelve la API de todos los componentes como datos: de aquí salen la documentación y el banco de pruebas */
function manifiesto() {
	return COMPONENTES.map((componente) => ({
		etiqueta: componente.etiqueta,
		clase: componente.name,
		descripcion: componente.descripcion,
		ejemplo: componente.ejemplo,
		esControl: componente.formAssociated === true,
		propiedades: Object.entries(componente.todasLasPropiedades()).map(([nombre, p]) => ({
			nombre,
			atributo: p.atributo === false ? null : (p.atributo || nombreAtributo(nombre)),
			tipo: p.tipo.name,
			defecto: p.defecto,
			opciones: p.opciones || null,
			descripcion: p.descripcion
		})),
		eventos: Object.entries(componente.todosLosEventos()).map(([nombre, e]) => ({ nombre, ...e })),
		metodos: Object.entries(componente.todosLosMetodos()).map(([firma, descripcion]) => ({ firma, descripcion })),
		partes: Object.entries(componente.partes).map(([nombre, descripcion]) => ({ nombre, descripcion }))
	}));
}

const VERSION = "1.2.0";

export { GotaElemento, GotaControl, GotaCampo, GotaCantidad, GotaSelector, GotaFecha, GotaInterruptor, GotaClave, GotaFiltros, GotaPaginador, GotaNivel, moverGota, manifiesto, VERSION };
