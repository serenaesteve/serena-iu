/**
 * serena | iu · núcleo
 * Clases compartidas por todas las páginas (aplicación y acceso).
 *
 * JavaScript no admite "|" en un identificador, así que el namespace
 * técnico es `serena.iu`.
 */
window.serena = window.serena || {};
window.serena.iu = window.serena.iu || {};

(() => {
	"use strict";

	/* ---------------------------------------------------------
	   DOM: atajos de selección y clonado de plantillas
	   --------------------------------------------------------- */
	class DOM {
		static uno(selector, contexto = document) {
			return contexto.querySelector(selector);
		}

		static todos(selector, contexto = document) {
			return [...contexto.querySelectorAll(selector)];
		}

		/** Clona el primer elemento de un <template>. Falla con un mensaje claro si no existe. */
		static plantilla(id) {
			const plantilla = document.getElementById(id);

			if (!plantilla) {
				throw new Error(`Falta la plantilla #${id} en el HTML`);
			}

			return plantilla.content.firstElementChild.cloneNode(true);
		}
	}

	/* ---------------------------------------------------------
	   Utilidades
	   --------------------------------------------------------- */
	class Utilidades {
		static hashTexto(texto) {
			let hash = 0;

			for (const caracter of texto) {
				hash = caracter.charCodeAt(0) + ((hash << 5) - hash);
				hash |= 0;
			}

			return Math.abs(hash);
		}

		static colorTexto(texto) {
			return `hsl(${Utilidades.hashTexto(texto) % 360},55%,45%)`;
		}

		static formatear(valor, campo) {
			if (valor === undefined || valor === null || valor === "") {
				return "—";
			}
			if (campo.tipo === "checkbox") {
				return valor ? "Sí" : "No";
			}
			if (campo.formato === "moneda") {
				return Number(valor).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
			}
			if (campo.tipo === "number") {
				return Number(valor).toLocaleString("es-ES");
			}
			if (campo.tipo === "date") {
				return new Date(valor + "T00:00").toLocaleDateString("es-ES");
			}
			return String(valor);
		}

		static normalizar(texto) {
			return String(texto ?? "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");
		}

		static async sha256(texto) {
			if (window.crypto?.subtle) {
				const bytes = new TextEncoder().encode(texto);
				const resumen = await crypto.subtle.digest("SHA-256", bytes);
				return [...new Uint8Array(resumen)].map((b) => b.toString(16).padStart(2, "0")).join("");
			}
			// Sin contexto seguro (file://) no hay crypto.subtle: se usa un hash simple
			return "h" + Utilidades.hashTexto(texto).toString(16);
		}

		static descargar(nombre, contenido, tipo) {
			const blob = new Blob([contenido], { type: tipo });
			const enlace = document.createElement("a");
			enlace.href = URL.createObjectURL(blob);
			enlace.download = nombre;
			enlace.click();
			setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
		}
	}

	/* ---------------------------------------------------------
	   Almacén: localStorage con prefijo y a prueba de errores
	   --------------------------------------------------------- */
	class Almacen {
		static prefijo = "serena-iu:";

		static leer(clave, defecto = null) {
			try {
				const valor = localStorage.getItem(Almacen.prefijo + clave);
				return valor === null ? defecto : JSON.parse(valor);
			} catch (error) {
				return defecto;
			}
		}

		static guardar(clave, valor) {
			try {
				localStorage.setItem(Almacen.prefijo + clave, JSON.stringify(valor));
			} catch (error) {
				// Almacenamiento lleno o bloqueado: la aplicación sigue funcionando sin persistir
			}
		}

		static borrar(clave) {
			try {
				localStorage.removeItem(Almacen.prefijo + clave);
			} catch (error) {}
		}

		static borrarPorPrefijo(prefijoClave) {
			try {
				Object.keys(localStorage)
					.filter((clave) => clave.startsWith(Almacen.prefijo + prefijoClave))
					.forEach((clave) => localStorage.removeItem(clave));
			} catch (error) {}
		}
	}

	/* ---------------------------------------------------------
	   Tema: modifica las variables CSS desde JavaScript
	   --------------------------------------------------------- */
	class TemaIU {
		static defecto = { tono: 335, modo: "oscuro" };

		static actual() {
			return { ...TemaIU.defecto, ...Almacen.leer("tema", {}) };
		}

		static aplicar(cambios = {}) {
			const tema = { ...TemaIU.actual(), ...cambios };
			const raiz = document.documentElement;

			raiz.style.setProperty("--tono", tema.tono);
			raiz.dataset.modo = tema.modo;
			Almacen.guardar("tema", tema);

			return tema;
		}

		static restablecer() {
			Almacen.borrar("tema");
			return TemaIU.aplicar(TemaIU.defecto);
		}
	}

	/* ---------------------------------------------------------
	   Sesión: registro y acceso simulados en el navegador.
	   En producción esto iría en el servidor (Flask/PHP); aquí
	   sirve para practicar el flujo completo de la interfaz.
	   --------------------------------------------------------- */
	class Sesion {
		static usuarios() {
			return Almacen.leer("usuarios", []);
		}

		static async prepararDemo() {
			if (Sesion.usuarios().length === 0) {
				Almacen.guardar("usuarios", [{
					nombre: "Serena",
					email: "demo@serena.iu",
					clave: await Utilidades.sha256("demo1234")
				}]);
			}
		}

		static async registrar(nombre, email, clave) {
			const usuarios = Sesion.usuarios();
			const correo = email.trim().toLowerCase();

			if (usuarios.some((usuario) => usuario.email === correo)) {
				throw new Error("Ya existe una cuenta con ese email.");
			}

			usuarios.push({ nombre: nombre.trim(), email: correo, clave: await Utilidades.sha256(clave) });
			Almacen.guardar("usuarios", usuarios);
			return Sesion.iniciar(correo, clave, false);
		}

		static async iniciar(email, clave, recordar) {
			const correo = email.trim().toLowerCase();
			const hash = await Utilidades.sha256(clave);
			const usuario = Sesion.usuarios().find((u) => u.email === correo && u.clave === hash);

			if (!usuario) {
				throw new Error("El email o la contraseña no son correctos.");
			}

			const sesion = { nombre: usuario.nombre, email: usuario.email };
			const destino = recordar ? localStorage : sessionStorage;

			try {
				destino.setItem(Almacen.prefijo + "sesion", JSON.stringify(sesion));
			} catch (error) {}

			return sesion;
		}

		static actual() {
			try {
				const texto = sessionStorage.getItem(Almacen.prefijo + "sesion")
					|| localStorage.getItem(Almacen.prefijo + "sesion");
				return texto ? JSON.parse(texto) : null;
			} catch (error) {
				return null;
			}
		}

		static cerrar() {
			try {
				sessionStorage.removeItem(Almacen.prefijo + "sesion");
				localStorage.removeItem(Almacen.prefijo + "sesion");
			} catch (error) {}
		}
	}

	/* ---------------------------------------------------------
	   Toasts: una sola implementación para todo el proyecto
	   --------------------------------------------------------- */
	class ToastIU {
		constructor(idPila = "pilaToasts") {
			this.idPila = idPila;
			this.duracion = 4500;
			this.iconos = { success: "✓", info: "i", warning: "!", danger: "×" };
		}

		obtenerPila() {
			let pila = document.getElementById(this.idPila);

			if (!pila) {
				pila = document.createElement("div");
				pila.id = this.idPila;
				pila.className = "toast-pila";
				pila.setAttribute("aria-live", "polite");
				document.body.appendChild(pila);
			}

			return pila;
		}

		/**
		 * @param opciones.accion  { texto, alPulsar } → añade un botón (p. ej. "Deshacer")
		 */
		mostrar(tipo = "info", titulo = "Información", texto = "", opciones = {}) {
			const toast = DOM.plantilla("tpl-toast");
			const botonAccion = DOM.uno(".toast-accion", toast);

			toast.className = `toast is-${tipo}`;
			DOM.uno(".toast-icono", toast).textContent = this.iconos[tipo] || "i";
			DOM.uno(".toast-titulo", toast).textContent = titulo;
			DOM.uno(".toast-texto", toast).textContent = texto;

			let temporizador;
			const cerrar = () => {
				clearTimeout(temporizador);
				toast.classList.add("sale");
				setTimeout(() => toast.remove(), 220);
			};

			DOM.uno(".toast-cerrar", toast).addEventListener("click", cerrar);

			if (opciones.accion) {
				botonAccion.hidden = false;
				botonAccion.textContent = opciones.accion.texto;
				botonAccion.addEventListener("click", () => {
					opciones.accion.alPulsar();
					cerrar();
				});
			}

			// Pausa el autocierre mientras el ratón está encima
			toast.addEventListener("mouseenter", () => clearTimeout(temporizador));
			toast.addEventListener("mouseleave", () => { temporizador = setTimeout(cerrar, 1500); });

			this.obtenerPila().appendChild(toast);
			temporizador = setTimeout(cerrar, this.duracion);
		}

		exito(titulo, texto, opciones) { this.mostrar("success", titulo, texto, opciones); }
		info(titulo, texto) { this.mostrar("info", titulo, texto); }
		aviso(titulo, texto) { this.mostrar("warning", titulo, texto); }
		error(titulo, texto) { this.mostrar("danger", titulo, texto); }
	}

	/* ---------------------------------------------------------
	   Diálogo de confirmación (sustituye a confirm())
	   --------------------------------------------------------- */
	class DialogoIU {
		static confirmar({ titulo = "¿Continuar?", texto = "", aceptar = "Aceptar", peligro = false } = {}) {
			return new Promise((resolver) => {
				const dialogo = DOM.plantilla("tpl-dialogo");
				const botonAceptar = DOM.uno("[data-accion=aceptar]", dialogo);

				DOM.uno("h2", dialogo).textContent = titulo;
				DOM.uno("p", dialogo).textContent = texto;
				botonAceptar.textContent = aceptar;
				botonAceptar.classList.toggle("peligro", peligro);
				botonAceptar.classList.toggle("primario", !peligro);

				const cerrar = (resultado) => {
					dialogo.close();
					dialogo.remove();
					resolver(resultado);
				};

				botonAceptar.addEventListener("click", () => cerrar(true));
				DOM.uno("[data-accion=cancelar]", dialogo).addEventListener("click", () => cerrar(false));
				dialogo.addEventListener("cancel", (evento) => { evento.preventDefault(); cerrar(false); });

				document.body.appendChild(dialogo);
				dialogo.showModal();
				DOM.uno("[data-accion=cancelar]", dialogo).focus();
			});
		}
	}

	Object.assign(window.serena.iu, { DOM, Utilidades, Almacen, TemaIU, Sesion, ToastIU, DialogoIU });

	// El tema se aplica cuanto antes para evitar un parpadeo de colores
	TemaIU.aplicar();

	/* Foco de luz: las tarjetas reciben la posición del puntero en --mx / --my
	   y el CSS dibuja un brillo suave que sigue al ratón. Un único listener. */
	document.addEventListener("pointermove", (evento) => {
		const tarjeta = evento.target.closest?.(".tarjeta,.acceso-tarjeta,.vitrina-tarjeta");
		if (!tarjeta) { return; }
		const caja = tarjeta.getBoundingClientRect();
		tarjeta.style.setProperty("--mx", `${evento.clientX - caja.left}px`);
		tarjeta.style.setProperty("--my", `${evento.clientY - caja.top}px`);
	}, { passive: true });
})();
