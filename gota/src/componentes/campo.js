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
