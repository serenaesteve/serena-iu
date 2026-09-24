/**
 * serena | iu · acceso
 * Pestañas, validación, mostrar contraseña, medidor de fuerza y sesión.
 */
(() => {
	"use strict";

	const { DOM, Sesion, ToastIU } = window.serena.iu;

	class AccesoIU {
		constructor() {
			this.toast = new ToastIU();
			this.formEntrar = DOM.uno("#form-entrar");
			this.formRegistro = DOM.uno("#form-registro");
		}

		async iniciar() {
			if (Sesion.actual()) {
				location.replace("index.html");
				return;
			}

			await Sesion.prepararDemo();
			this.activarPestanas();
			this.activarVerClave();
			this.activarFuerza();
			this.formEntrar.addEventListener("submit", (evento) => this.entrar(evento));
			this.formRegistro.addEventListener("submit", (evento) => this.registrar(evento));
			this.formEntrar.elements.email.focus();
		}

		activarPestanas() {
			const pestanas = DOM.todos("[role=tab]");

			const mostrar = (pestana) => {
				pestanas.forEach((p) => {
					const activa = p === pestana;
					p.setAttribute("aria-selected", String(activa));
					p.tabIndex = activa ? 0 : -1;
					document.getElementById(p.getAttribute("aria-controls")).hidden = !activa;
				});
				DOM.uno("input", document.getElementById(pestana.getAttribute("aria-controls"))).focus();
			};

			pestanas.forEach((pestana, i) => {
				pestana.addEventListener("click", () => mostrar(pestana));
				// Flechas izquierda/derecha entre pestañas (patrón accesible de tabs)
				pestana.addEventListener("keydown", (evento) => {
					if (evento.key === "ArrowRight" || evento.key === "ArrowLeft") {
						const siguiente = pestanas[(i + (evento.key === "ArrowRight" ? 1 : -1) + pestanas.length) % pestanas.length];
						siguiente.focus();
						mostrar(siguiente);
					}
				});
			});
		}

		activarVerClave() {
			DOM.todos("[data-accion=ver]").forEach((boton) => {
				boton.addEventListener("click", () => {
					const entrada = boton.previousElementSibling;
					const visible = entrada.type === "text";
					entrada.type = visible ? "password" : "text";
					boton.textContent = visible ? "Mostrar" : "Ocultar";
					boton.setAttribute("aria-pressed", String(!visible));
				});
			});
		}

		static fuerza(clave) {
			let puntos = 0;
			if (clave.length >= 8) { puntos++; }
			if (clave.length >= 12) { puntos++; }
			if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) { puntos++; }
			if (/\d/.test(clave)) { puntos++; }
			if (/[^A-Za-z0-9]/.test(clave)) { puntos++; }
			return puntos;
		}

		activarFuerza() {
			const entrada = this.formRegistro.elements.clave;
			const barra = DOM.uno(".fuerza span", this.formRegistro);
			const texto = DOM.uno(".fuerza-texto", this.formRegistro);
			const niveles = [
				["Mínimo 8 caracteres.", "var(--peligro)"],
				["Débil", "var(--peligro)"],
				["Mejorable", "var(--aviso)"],
				["Aceptable", "var(--aviso)"],
				["Buena", "var(--exito)"],
				["Muy buena", "var(--exito)"]
			];

			entrada.addEventListener("input", () => {
				const puntos = entrada.value ? Math.max(1, AccesoIU.fuerza(entrada.value)) : 0;
				barra.style.width = `${(puntos / 5) * 100}%`;
				barra.style.background = niveles[puntos][1];
				texto.textContent = entrada.value.length < 8 ? niveles[0][0] : niveles[puntos][0];
			});
		}

		mensaje(formulario, texto) {
			DOM.uno(".mensaje-formulario", formulario).textContent = texto;
		}

		ocupado(formulario, activo) {
			const boton = DOM.uno("[type=submit]", formulario);
			boton.disabled = activo;
			boton.dataset.texto ??= boton.textContent;
			boton.textContent = activo ? "Un momento…" : boton.dataset.texto;
		}

		async entrar(evento) {
			evento.preventDefault();
			const f = this.formEntrar;

			if (!f.elements.email.value || !f.elements.clave.value) {
				this.mensaje(f, "Escribe tu email y tu contraseña.");
				return;
			}
			if (!f.elements.email.checkValidity()) {
				this.mensaje(f, "El email no tiene un formato válido.");
				return;
			}

			this.ocupado(f, true);
			try {
				const sesion = await Sesion.iniciar(f.elements.email.value, f.elements.clave.value, f.elements.recordar.checked);
				this.mensaje(f, "");
				this.toast.exito(`Hola, ${sesion.nombre}`, "Entrando en tu espacio…");
				setTimeout(() => location.replace("index.html"), 700);
			} catch (error) {
				this.mensaje(f, error.message);
				f.elements.clave.select();
				this.ocupado(f, false);
			}
		}

		async registrar(evento) {
			evento.preventDefault();
			const f = this.formRegistro;
			const { nombre, email, clave, repetir } = f.elements;

			if (!nombre.value.trim()) { this.mensaje(f, "Escribe tu nombre."); nombre.focus(); return; }
			if (!email.checkValidity()) { this.mensaje(f, "Escribe un email válido, como nombre@dominio.com."); email.focus(); return; }
			if (clave.value.length < 8) { this.mensaje(f, "La contraseña debe tener al menos 8 caracteres."); clave.focus(); return; }
			if (clave.value !== repetir.value) { this.mensaje(f, "Las contraseñas no coinciden."); repetir.focus(); return; }

			this.ocupado(f, true);
			try {
				await Sesion.registrar(nombre.value, email.value, clave.value);
				this.mensaje(f, "");
				this.toast.exito("Cuenta creada", "Te llevamos a la aplicación…");
				setTimeout(() => location.replace("index.html"), 800);
			} catch (error) {
				this.mensaje(f, error.message);
				this.ocupado(f, false);
			}
		}
	}

	document.addEventListener("DOMContentLoaded", () => new AccesoIU().iniciar());
})();
