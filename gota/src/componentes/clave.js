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
