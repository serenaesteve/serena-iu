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
