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
