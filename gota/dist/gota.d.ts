/*! gota 1.2.0 · tipos generados por construir.py a partir de los metadatos. No se edita a mano. */

/** Opción de gota-selector y gota-filtros. También se puede dar solo el texto. */
export interface OpcionGota {
	valor: string;
	texto?: string;
	/** Tono (0-360) del punto de color. */
	tono?: number | null;
	cantidad?: number;
	desactivada?: boolean;
}

export type EstadoNivel = "agotado" | "bajo" | "normal" | "lleno";

export declare class GotaElemento extends HTMLElement {
	static readonly etiqueta: string;
	static readonly descripcion: string;
	/** Registra la etiqueta si aún no lo está. */
	static definir(): void;
}

/** Base de los componentes que se envían con un formulario (form-associated). */
export declare class GotaControl extends GotaElemento {
	static readonly formAssociated: true;
	readonly form: HTMLFormElement | null;
	readonly labels: NodeList;
	readonly validity: ValidityState;
	readonly validationMessage: string;
	readonly willValidate: boolean;
}

export interface GotaCampoEventMap extends HTMLElementEventMap {
	/** Cambio con datos. origen es teclado, puntero o codigo. */
	"gota-cambio": CustomEvent<{ valor: string; anterior: string; origen: "teclado" | "puntero" | "codigo" }>;
}

/**
 * Campo de texto que indica qué dato espera y hereda la validación nativa de email, teléfono y URL.
 * @example <gota-campo type="email" name="correo" placeholder="nombre@ejemplo.com" required></gota-campo>
 */
export declare class GotaCampo extends GotaControl {
	/** Nombre con el que se envía en el formulario. Por defecto: "". */
	name: string;
	/** Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. Por defecto: "". */
	value: string;
	/** Desactivado: no se puede usar ni se envía. Por defecto: false. */
	disabled: boolean;
	/** Obligatorio: vacío marca valueMissing. Por defecto: false. */
	required: boolean;
	/** Solo lectura: se envía, pero no se edita ni se valida. Por defecto: false. */
	readonly: boolean;
	/** Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. Por defecto: "". */
	persistir: string;
	/** Tipo de dato. Por defecto: "text". */
	type: "text" | "email" | "tel" | "url";
	/** Texto de ayuda con el campo vacío. Por defecto: "". */
	placeholder: string;
	/** Expresión regular que debe cumplir. Por defecto: "". */
	pattern: string;
	/** Longitud mínima. Por defecto: null. */
	minlength: number | null;
	/** Longitud máxima. Por defecto: null. */
	maxlength: number | null;
	/** Pista de autocompletado del navegador. Por defecto: "off". */
	autocomplete: string;
	/** Oculta el icono del tipo de dato. Por defecto: false. */
	sinMarca: boolean;
	/** Pone el foco en el control. */
	focus(): void;
	/** Vacía el valor sin lanzar eventos. */
	limpiar(): void;
	/** Devuelve si es válido. */
	checkValidity(): boolean;
	/** Devuelve si es válido y muestra el mensaje del navegador. */
	reportValidity(): boolean;
	/** Fija un error propio. Con texto vacío lo quita. */
	setCustomValidity(texto: string): void;
	/** Selecciona todo el texto. */
	select(): void;
	addEventListener<K extends keyof GotaCampoEventMap>(type: K, listener: (this: GotaCampo, ev: GotaCampoEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaCampoEventMap>(type: K, listener: (this: GotaCampo, ev: GotaCampoEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaCantidadEventMap extends HTMLElementEventMap {
	/** Cambio con datos. origen es teclado, puntero o codigo. */
	"gota-cambio": CustomEvent<{ valor: string; anterior: string; origen: "teclado" | "puntero" | "codigo" }>;
}

/**
 * Número con botones de paso, teclado (flechas, Inicio, Fin, Re Pág, Av Pág), límites y formato de moneda. Acepta coma decimal.
 * @example <gota-cantidad name="precio" formato="moneda" min="0" step="0.01" value="749.99"></gota-cantidad>
 */
export declare class GotaCantidad extends GotaControl {
	/** Nombre con el que se envía en el formulario. Por defecto: "". */
	name: string;
	/** Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. Por defecto: "". */
	value: string;
	/** Desactivado: no se puede usar ni se envía. Por defecto: false. */
	disabled: boolean;
	/** Obligatorio: vacío marca valueMissing. Por defecto: false. */
	required: boolean;
	/** Solo lectura: se envía, pero no se edita ni se valida. Por defecto: false. */
	readonly: boolean;
	/** Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. Por defecto: "". */
	persistir: string;
	/** Valor mínimo. Sin él no hay límite. Por defecto: null. */
	min: number | null;
	/** Valor máximo. Sin él no hay límite. Por defecto: null. */
	max: number | null;
	/** Tamaño del paso. Con «any» no comprueba múltiplos. Por defecto: "1". */
	step: string;
	/** Cómo se muestra el valor al salir del campo. Por defecto: "numero". */
	formato: "numero" | "moneda";
	/** Código ISO de la moneda. Por defecto: "EUR". */
	moneda: string;
	/** Unidad junto al número, como «uds.». Por defecto: "". */
	unidad: string;
	/** Texto de ayuda con el campo vacío. Por defecto: "". */
	placeholder: string;
	/** Idioma del formato. Por defecto: "es-ES". */
	locale: string;
	/** Pone el foco en el control. */
	focus(): void;
	/** Vacía el valor sin lanzar eventos. */
	limpiar(): void;
	/** Devuelve si es válido. */
	checkValidity(): boolean;
	/** Devuelve si es válido y muestra el mensaje del navegador. */
	reportValidity(): boolean;
	/** Fija un error propio. Con texto vacío lo quita. */
	setCustomValidity(texto: string): void;
	/** Suma pasos sin salir de los límites. */
	incrementar(veces?: number): void;
	/** Resta pasos sin salir de los límites. */
	decrementar(veces?: number): void;
	/** Igual que incrementar: mismo nombre que el input nativo. */
	stepUp(veces?: number): void;
	/** Igual que decrementar: mismo nombre que el input nativo. */
	stepDown(veces?: number): void;
	/** Selecciona el texto. */
	select(): void;
	addEventListener<K extends keyof GotaCantidadEventMap>(type: K, listener: (this: GotaCantidad, ev: GotaCantidadEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaCantidadEventMap>(type: K, listener: (this: GotaCantidad, ev: GotaCantidadEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaSelectorEventMap extends HTMLElementEventMap {
	/** Cambio con datos. origen es teclado, puntero o codigo. */
	"gota-cambio": CustomEvent<{ valor: string; anterior: string; origen: "teclado" | "puntero" | "codigo" }>;
	/** Se ha abierto la lista. */
	"gota-abrir": CustomEvent<Record<string, never>>;
	/** Se ha cerrado la lista. */
	"gota-cerrar": CustomEvent<Record<string, never>>;
}

/**
 * Lista desplegable que se filtra escribiendo, sin distinguir acentos ni mayúsculas. Las opciones se dan con <option> o con la propiedad opciones.
 * @example <gota-selector name="categoria"><option>Informática</option><option>Telefonía</option></gota-selector>
 */
export declare class GotaSelector extends GotaControl {
	/** Nombre con el que se envía en el formulario. Por defecto: "". */
	name: string;
	/** Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. Por defecto: "". */
	value: string;
	/** Desactivado: no se puede usar ni se envía. Por defecto: false. */
	disabled: boolean;
	/** Obligatorio: vacío marca valueMissing. Por defecto: false. */
	required: boolean;
	/** Solo lectura: se envía, pero no se edita ni se valida. Por defecto: false. */
	readonly: boolean;
	/** Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. Por defecto: "". */
	persistir: string;
	/** Texto cuando no hay nada elegido. Por defecto: "Selecciona…". */
	placeholder: string;
	/** Texto cuando el filtro no encuentra nada. Por defecto: "No hay coincidencias". */
	sinResultados: string;
	/** Lista de textos u objetos { valor, texto, tono, desactivada }. Por defecto: []. */
	opciones: Array<OpcionGota | string>;
	/** Pone el foco en el control. */
	focus(): void;
	/** Vacía el valor sin lanzar eventos. */
	limpiar(): void;
	/** Devuelve si es válido. */
	checkValidity(): boolean;
	/** Devuelve si es válido y muestra el mensaje del navegador. */
	reportValidity(): boolean;
	/** Fija un error propio. Con texto vacío lo quita. */
	setCustomValidity(texto: string): void;
	/** Abre la lista. */
	abrir(): void;
	/** Cierra la lista. */
	cerrar(): void;
	/** Elige una opción como si la hubiera pulsado el usuario y lanza los eventos. */
	elegir(valor: string): void;
	addEventListener<K extends keyof GotaSelectorEventMap>(type: K, listener: (this: GotaSelector, ev: GotaSelectorEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaSelectorEventMap>(type: K, listener: (this: GotaSelector, ev: GotaSelectorEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaFechaEventMap extends HTMLElementEventMap {
	/** Cambio con datos. origen es teclado, puntero o codigo. */
	"gota-cambio": CustomEvent<{ valor: string; anterior: string; origen: "teclado" | "puntero" | "codigo" }>;
	/** Se ha abierto el calendario. */
	"gota-abrir": CustomEvent<Record<string, never>>;
	/** Se ha cerrado el calendario. */
	"gota-cerrar": CustomEvent<Record<string, never>>;
	/** El calendario enseña otro mes. mes va de 1 a 12. */
	"gota-mes": CustomEvent<{ anio: number; mes: number }>;
}

/**
 * Fecha con calendario desplegable, que también se puede escribir (15/3/1990). El valor siempre es AAAA-MM-DD, como en un input date.
 * @example <gota-fecha name="alta" min="2026-01-01" value="2026-10-30"></gota-fecha>
 */
export declare class GotaFecha extends GotaControl {
	/** Nombre con el que se envía en el formulario. Por defecto: "". */
	name: string;
	/** Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. Por defecto: "". */
	value: string;
	/** Desactivado: no se puede usar ni se envía. Por defecto: false. */
	disabled: boolean;
	/** Obligatorio: vacío marca valueMissing. Por defecto: false. */
	required: boolean;
	/** Solo lectura: se envía, pero no se edita ni se valida. Por defecto: false. */
	readonly: boolean;
	/** Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. Por defecto: "". */
	persistir: string;
	/** Fecha mínima (AAAA-MM-DD). Por defecto: "". */
	min: string;
	/** Fecha máxima (AAAA-MM-DD). Por defecto: "". */
	max: string;
	/** Texto de ayuda con el campo vacío. Por defecto: "dd/mm/aaaa". */
	placeholder: string;
	/** Idioma del calendario. Por defecto: "es-ES". */
	locale: string;
	/** Pone el foco en el control. */
	focus(): void;
	/** Vacía el valor sin lanzar eventos. */
	limpiar(): void;
	/** Devuelve si es válido. */
	checkValidity(): boolean;
	/** Devuelve si es válido y muestra el mensaje del navegador. */
	reportValidity(): boolean;
	/** Fija un error propio. Con texto vacío lo quita. */
	setCustomValidity(texto: string): void;
	/** Abre el calendario. */
	abrir(): void;
	/** Cierra el calendario. */
	cerrar(): void;
	/** Enseña ese mes (de 1 a 12) sin cambiar el valor. */
	irAMes(anio: number, mes: number): void;
	/** Elige la fecha de hoy y lanza los eventos. */
	hoy(): void;
	addEventListener<K extends keyof GotaFechaEventMap>(type: K, listener: (this: GotaFecha, ev: GotaFechaEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaFechaEventMap>(type: K, listener: (this: GotaFecha, ev: GotaFechaEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaInterruptorEventMap extends HTMLElementEventMap {
	/** Cambio con datos. valor es true o false; origen es teclado, puntero o codigo. */
	"gota-cambio": CustomEvent<{ valor: boolean; anterior: boolean; origen: "teclado" | "puntero" | "codigo" }>;
}

/**
 * Interruptor para valores de sí o no. La gota cruza el canal y se estira al hacerlo. Se usa igual que una casilla: propiedad checked y evento change.
 * @example <gota-interruptor name="activo" checked></gota-interruptor>
 */
export declare class GotaInterruptor extends GotaControl {
	/** Nombre con el que se envía en el formulario. Por defecto: "". */
	name: string;
	/** Valor que se envía cuando está activado. Por defecto: "on". */
	value: string;
	/** Desactivado: no se puede usar ni se envía. Por defecto: false. */
	disabled: boolean;
	/** Obligatorio: vacío marca valueMissing. Por defecto: false. */
	required: boolean;
	/** Solo lectura: se envía, pero no se edita ni se valida. Por defecto: false. */
	readonly: boolean;
	/** Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. Por defecto: "". */
	persistir: string;
	/** Activado. El atributo es el estado inicial, al que vuelve con reset(); la propiedad es el estado actual. Por defecto: false. */
	checked: boolean;
	/** Pone el foco en el control. */
	focus(): void;
	/** Vacía el valor sin lanzar eventos. */
	limpiar(): void;
	/** Devuelve si es válido. */
	checkValidity(): boolean;
	/** Devuelve si es válido y muestra el mensaje del navegador. */
	reportValidity(): boolean;
	/** Fija un error propio. Con texto vacío lo quita. */
	setCustomValidity(texto: string): void;
	/** Cambia de estado sin lanzar eventos. */
	alternar(): void;
	addEventListener<K extends keyof GotaInterruptorEventMap>(type: K, listener: (this: GotaInterruptor, ev: GotaInterruptorEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaInterruptorEventMap>(type: K, listener: (this: GotaInterruptor, ev: GotaInterruptorEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaClaveEventMap extends HTMLElementEventMap {
	/** Se ha mostrado u ocultado la contraseña. */
	"gota-visibilidad": CustomEvent<{ visible: boolean }>;
	/** Ha cambiado la fuerza de la contraseña (de 0 a 5). */
	"gota-fuerza": CustomEvent<{ puntos: number; texto: string }>;
}

/**
 * Envuelve un <input type="password"> real, que se queda en el HTML de la página para que los gestores de contraseñas lo encuentren. Añade mostrar y ocultar y, si se pide, un medidor de fuerza.
 * @example <gota-clave medidor><input name="clave" type="password" autocomplete="new-password"></gota-clave>
 */
export declare class GotaClave extends GotaElemento {
	/** Muestra el medidor de fuerza. Por defecto: false. */
	medidor: boolean;
	/** Longitud mínima que pide el medidor. Por defecto: 8. */
	minimo: number;
	/** La contraseña se ve en claro. Por defecto: false. */
	visible: boolean;
	/** Enseña la contraseña en claro. */
	mostrar(): void;
	/** Vuelve a ocultarla. */
	ocultar(): void;
	/** Cambia entre las dos. */
	alternar(): void;
	addEventListener<K extends keyof GotaClaveEventMap>(type: K, listener: (this: GotaClave, ev: GotaClaveEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaClaveEventMap>(type: K, listener: (this: GotaClave, ev: GotaClaveEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaFiltrosEventMap extends HTMLElementEventMap {
	/** Cambio con datos. origen es teclado o puntero. */
	"gota-cambio": CustomEvent<{ valor: string; anterior: string; origen: "teclado" | "puntero" }>;
}

/**
 * Barra de filtros con una sola gota: al elegir otro, la gota viaja hasta él. Cada filtro puede llevar un punto de color y una cantidad.
 * @example <gota-filtros etiqueta="Tipo de cliente"></gota-filtros>
 */
export declare class GotaFiltros extends GotaElemento {
	/** Valor del filtro elegido. Por defecto: "". */
	value: string;
	/** Nombre del grupo para los lectores de pantalla. Por defecto: "Filtros". */
	etiqueta: string;
	/** Lista de { valor, texto, cantidad, tono }. Por defecto: []. */
	opciones: Array<OpcionGota | string>;
	/** Cambia los números sin repintar. Recibe { valor: cantidad }. */
	actualizarCantidades(cantidades: Record<string, number>): void;
	addEventListener<K extends keyof GotaFiltrosEventMap>(type: K, listener: (this: GotaFiltros, ev: GotaFiltrosEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaFiltrosEventMap>(type: K, listener: (this: GotaFiltros, ev: GotaFiltrosEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaPaginadorEventMap extends HTMLElementEventMap {
	/** El usuario ha cambiado de página. */
	"gota-pagina": CustomEvent<{ pagina: number; anterior: number }>;
}

/**
 * Paginación numerada que resume los saltos largos con puntos suspensivos. La gota marca la página actual.
 * @example <gota-paginador pagina="3" paginas="12"></gota-paginador>
 */
export declare class GotaPaginador extends GotaElemento {
	/** Página actual, desde 1. Por defecto: 1. */
	pagina: number;
	/** Total de páginas. Por defecto: 1. */
	paginas: number;
	/** Páginas que se ven a cada lado de la actual. Por defecto: 1. */
	vecinas: number;
	/** Nombre para los lectores de pantalla. Por defecto: "Paginación". */
	etiqueta: string;
	/** Avanza una página y lanza el evento. */
	siguiente(): void;
	/** Retrocede una página y lanza el evento. */
	anterior(): void;
	/** Va a esa página, sin salir del rango, y lanza el evento. */
	ir(pagina: number): void;
	addEventListener<K extends keyof GotaPaginadorEventMap>(type: K, listener: (this: GotaPaginador, ev: GotaPaginadorEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaPaginadorEventMap>(type: K, listener: (this: GotaPaginador, ev: GotaPaginadorEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface GotaNivelEventMap extends HTMLElementEventMap {
	/** El nivel ha pasado a otro estado. */
	"gota-umbral": CustomEvent<{ estado: EstadoNivel; anterior: EstadoNivel; valor: number }>;
}

/**
 * Enseña una cantidad como el líquido de un tubo, con una marca de mínimo y un estado que cambia de color: agotado, bajo, normal o lleno.
 * @example <gota-nivel value="7" max="60" minimo="10" unidad="uds."></gota-nivel>
 */
export declare class GotaNivel extends GotaElemento {
	/** Cantidad actual. Por defecto: 0. */
	value: number;
	/** Cantidad con la que el tubo está lleno. Por defecto: 100. */
	max: number;
	/** Por debajo de esta cantidad el estado es «bajo». Con 0 no hay marca. Por defecto: 0. */
	minimo: number;
	/** Unidad junto a la cifra. Por defecto: "". */
	unidad: string;
	/** Tubo de pie, como una probeta. Por defecto: false. */
	vertical: boolean;
	/** Oculta el número. Por defecto: false. */
	sinCifra: boolean;
	/** Nombre para los lectores de pantalla. Por defecto: "Nivel". */
	etiqueta: string;
	/** Suma o resta a la cantidad actual, sin bajar de 0. */
	ajustar(diferencia: number): void;
	addEventListener<K extends keyof GotaNivelEventMap>(type: K, listener: (this: GotaNivel, ev: GotaNivelEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener<K extends keyof GotaNivelEventMap>(type: K, listener: (this: GotaNivel, ev: GotaNivelEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

/** Mueve una gota hasta un elemento estirándola por el camino (animación FLIP). */
export declare function moverGota(gota: HTMLElement, destino: Element | null, opciones?: { animar?: boolean }): void;

/** Metadatos de todos los componentes: de aquí salen la documentación, el banco y las pruebas. */
export declare function manifiesto(): Array<{
	etiqueta: string; clase: string; descripcion: string; ejemplo: string; esControl: boolean;
	propiedades: Array<{ nombre: string; atributo: string | null; tipo: string; defecto: unknown; opciones: string[] | null; descripcion: string }>;
	eventos: Array<{ nombre: string; detalle: string; tipoDetalle?: string; descripcion: string }>;
	metodos: Array<{ firma: string; descripcion: string }>;
	partes: Array<{ nombre: string; descripcion: string }>;
}>;

export declare const VERSION: string;

declare global {
	interface HTMLElementTagNameMap {
		"gota-campo": GotaCampo;
		"gota-cantidad": GotaCantidad;
		"gota-selector": GotaSelector;
		"gota-fecha": GotaFecha;
		"gota-interruptor": GotaInterruptor;
		"gota-clave": GotaClave;
		"gota-filtros": GotaFiltros;
		"gota-paginador": GotaPaginador;
		"gota-nivel": GotaNivel;
	}
	/** Los eventos de gota salen del Shadow DOM y suben hasta document. */
	interface GlobalEventHandlersEventMap {
		"gota-cambio": CustomEvent<{ valor: string; anterior: string; origen: "teclado" | "puntero" | "codigo" }> | CustomEvent<{ valor: boolean; anterior: boolean; origen: "teclado" | "puntero" | "codigo" }> | CustomEvent<{ valor: string; anterior: string; origen: "teclado" | "puntero" }>;
		"gota-abrir": CustomEvent<Record<string, never>>;
		"gota-cerrar": CustomEvent<Record<string, never>>;
		"gota-mes": CustomEvent<{ anio: number; mes: number }>;
		"gota-visibilidad": CustomEvent<{ visible: boolean }>;
		"gota-fuerza": CustomEvent<{ puntos: number; texto: string }>;
		"gota-pagina": CustomEvent<{ pagina: number; anterior: number }>;
		"gota-umbral": CustomEvent<{ estado: EstadoNivel; anterior: EstadoNivel; valor: number }>;
	}
	/** Con el script clásico (dist/gota.js) todo queda en window.gota. */
	interface Window {
		gota: {
			GotaElemento: typeof GotaElemento; GotaControl: typeof GotaControl;
			GotaCampo: typeof GotaCampo;
			GotaCantidad: typeof GotaCantidad;
			GotaSelector: typeof GotaSelector;
			GotaFecha: typeof GotaFecha;
			GotaInterruptor: typeof GotaInterruptor;
			GotaClave: typeof GotaClave;
			GotaFiltros: typeof GotaFiltros;
			GotaPaginador: typeof GotaPaginador;
			GotaNivel: typeof GotaNivel;
			moverGota: typeof moverGota; manifiesto: typeof manifiesto; VERSION: string;
		};
	}
}
