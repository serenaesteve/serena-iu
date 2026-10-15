/**
 * serena | iu · interfaces naturales (RA2)
 *
 * Una capa que se añade encima de la aplicación sin cambiar su arquitectura:
 *   · Voz ............... Web Speech API (SpeechRecognition + SpeechSynthesis)
 *   · Manos y cara ...... MediaPipe Tasks Vision (HandLandmarker + FaceDetector)
 *   · Asistente ......... intérprete de órdenes propio + modelo local con Ollama
 *   · Realidad aumentada  A-Frame dibujado encima de la imagen de la webcam
 *
 * Las librerías pesadas solo se descargan cuando el usuario activa la
 * función que las necesita: si nadie enciende la cámara, MediaPipe no se carga.
 */
(() => {
	"use strict";

	const { DOM, Utilidades, Almacen, TemaIU, DialogoIU, Enrutador } = window.serena.iu;

	const MEDIAPIPE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35";
	const MODELO_MANOS = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
	const MODELO_CARA = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";
	const AFRAME = "https://aframe.io/releases/1.7.1/aframe.min.js";

	const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));
	const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
	const moneda = (valor) => Number(valor).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
	const enumerar = (lista) => (lista.length < 2 ? lista.join("") : `${lista.slice(0, -1).join(", ")} y ${lista.at(-1)}`);

	/* =========================================================
	   AJUSTES: se guardan en el navegador como el tema
	   ========================================================= */
	class AjustesNaturales {
		static defecto = {
			hablar: true, voz: "", velocidad: 1, tono: 1, volumen: 1,
			palabraClave: "serena", usarIA: true, modelo: "phi3:mini",
			suavizado: 0.35, cabeza: true, privacidad: false
		};

		static leer() {
			return { ...AjustesNaturales.defecto, ...Almacen.leer("natural", {}) };
		}

		static guardar(cambios) {
			const ajustes = { ...AjustesNaturales.leer(), ...cambios };
			Almacen.guardar("natural", ajustes);
			return ajustes;
		}
	}

	/* =========================================================
	   TEXTO: normalizar lo que se dice para poder compararlo
	   ========================================================= */
	class TextoNatural {
		static NUMEROS = {
			uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
			once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20
		};

		/** «¿Cuántos pedidos HAY?» → «cuantos pedidos hay» */
		static limpiar(texto) {
			return Utilidades.normalizar(texto)
				.replace(/[¿?¡!.,;:"«»()]/g, " ")
				.replace(/\s+/g, " ")
				.trim();
		}

		/** ¿Aparece la palabra o la frase completa? Admite el plural: «pendiente» encuentra «pendientes» */
		static contiene(texto, frase) {
			if (!frase) { return false; }
			const escapada = frase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			return new RegExp(`(^| )${escapada}(s|es)?( |$)`).test(texto);
		}

		/**
		 * Como limpiar(), pero sin cambiar la longitud: cada carácter se convierte en uno.
		 * Así una posición encontrada en el texto «plano» sirve para recortar el original
		 * (y conservar mayúsculas, tildes, «@» y puntos al dictar).
		 */
		static plano(texto) {
			return String(texto).split("").map((caracter) => {
				const simple = caracter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
				return !simple || /[¿?¡!.,;:"«»()]/.test(simple) ? " " : simple[0];
			}).join("");
		}

		/** «pedido 8» u «pedido ocho» → 8 */
		static numero(texto) {
			const cifra = texto.match(/\b(\d+)\b/);
			if (cifra) { return Number(cifra[1]); }
			const palabra = texto.split(" ").find((p) => TextoNatural.NUMEROS[p]);
			return palabra ? TextoNatural.NUMEROS[palabra] : null;
		}

		/** Busca el registro cuyo texto coincide con más palabras de la frase */
		static mejorCoincidencia(registros, textoDe, frase) {
			const palabras = frase.split(" ").filter((p) => p.length > 2);
			let mejor = null;
			let puntos = 0;

			registros.forEach((registro) => {
				const texto = TextoNatural.limpiar(textoDe(registro));
				const aciertos = palabras.filter((p) => texto.includes(p)).length;
				if (aciertos > puntos) { mejor = registro; puntos = aciertos; }
			});

			return mejor;
		}
	}

	/* =========================================================
	   MANO: geometría de los 21 puntos de MediaPipe
	   0 muñeca · 4 pulgar · 8 índice · 12 corazón · 16 anular · 20 meñique
	   ========================================================= */
	class ManoIU {
		static CONEXIONES = [
			[0, 1], [1, 2], [2, 3], [3, 4],
			[0, 5], [5, 6], [6, 7], [7, 8],
			[5, 9], [9, 10], [10, 11], [11, 12],
			[9, 13], [13, 14], [14, 15], [15, 16],
			[13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
		];

		constructor(puntos) {
			this.p = puntos;
		}

		punto(i) { return this.p[i]; }

		distancia(a, b) {
			return Math.hypot(this.p[a].x - this.p[b].x, this.p[a].y - this.p[b].y);
		}

		centro(indices) {
			const suma = indices.reduce((total, i) => ({ x: total.x + this.p[i].x, y: total.y + this.p[i].y }), { x: 0, y: 0 });
			return { x: suma.x / indices.length, y: suma.y / indices.length };
		}

		/** Medida de referencia (muñeca → nudillo del corazón): los gestos no dependen de lo cerca que esté la mano */
		get palma() { return this.distancia(0, 9); }

		/** Un dedo está estirado si su punta queda más lejos de la muñeca que su articulación del medio */
		estirado(punta, articulacion) {
			return this.distancia(0, punta) > this.distancia(0, articulacion) * 1.12;
		}

		get dedos() {
			return {
				pulgar: this.distancia(4, 9) > this.palma * 0.7,
				indice: this.estirado(8, 6),
				corazon: this.estirado(12, 10),
				anular: this.estirado(16, 14),
				menique: this.estirado(20, 18)
			};
		}

		/** Separación entre las puntas de índice y pulgar, relativa al tamaño de la mano */
		get pinza() { return this.distancia(4, 8) / this.palma; }

		get postura() {
			const dedos = this.dedos;
			const estirados = [dedos.indice, dedos.corazon, dedos.anular, dedos.menique].filter(Boolean).length;

			if (estirados === 4 && dedos.pulgar) { return "palma"; }
			if (estirados === 0 && dedos.pulgar && this.p[4].y < this.p[3].y && this.p[4].y < this.p[5].y - this.palma * 0.3) { return "pulgar"; }
			if (estirados === 0) { return "puno"; }
			return "apuntar";
		}
	}

	/* =========================================================
	   VISIÓN: webcam + modelos de MediaPipe en un único bucle
	   ========================================================= */
	class VisionIU {
		constructor() {
			this.activa = false;
			this.cargando = false;
			this.flujo = null;
			this.manos = null;
			this.cara = null;
			this.ultimaCara = null;
			this.fotograma = 0;
			this.oyentes = new Set();
		}

		async iniciar(video) {
			this.cargando = true;
			this.video = video;

			try {
				this.flujo = await navigator.mediaDevices.getUserMedia({
					video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
					audio: false
				});
				video.srcObject = this.flujo;
				await video.play();

				// import() dinámico: el módulo de MediaPipe solo se descarga la primera vez
				if (!this.manos) {
					const { FilesetResolver, HandLandmarker, FaceDetector } = await import(`${MEDIAPIPE}/vision_bundle.mjs`);
					const vision = await FilesetResolver.forVisionTasks(`${MEDIAPIPE}/wasm`);

					[this.manos, this.cara] = await Promise.all([
						HandLandmarker.createFromOptions(vision, {
							baseOptions: { modelAssetPath: MODELO_MANOS },
							runningMode: "VIDEO",
							numHands: 1,
							minHandDetectionConfidence: 0.5,
							minHandPresenceConfidence: 0.5,
							minTrackingConfidence: 0.5
						}),
						FaceDetector.createFromOptions(vision, {
							baseOptions: { modelAssetPath: MODELO_CARA },
							runningMode: "VIDEO",
							minDetectionConfidence: 0.5
						})
					]);
				}

				this.activa = true;
				this.bucle();
			} catch (error) {
				this.detener();
				throw error;
			} finally {
				this.cargando = false;
			}
		}

		bucle() {
			if (!this.activa) { return; }

			const video = this.video;

			// Solo se analiza cuando la webcam ha entregado un fotograma nuevo
			if (video.readyState >= 2 && video.currentTime !== this.ultimoTiempo) {
				this.ultimoTiempo = video.currentTime;
				const ahora = performance.now();
				const manos = this.manos.detectForVideo(video, ahora);

				// La cara se mira uno de cada tres fotogramas: basta para asentir y ahorra CPU
				if (this.fotograma++ % 3 === 0) {
					this.ultimaCara = this.cara.detectForVideo(video, ahora);
				}

				const datos = {
					tiempo: ahora,
					mano: manos.landmarks[0] || null,
					cara: this.ultimaCara?.detections[0] || null,
					ancho: video.videoWidth,
					alto: video.videoHeight
				};

				this.oyentes.forEach((oyente) => oyente(datos));
			}

			this.peticion = requestAnimationFrame(() => this.bucle());
		}

		/** Devuelve una función para dejar de escuchar */
		escuchar(oyente) {
			this.oyentes.add(oyente);
			return () => this.oyentes.delete(oyente);
		}

		detener() {
			this.activa = false;
			cancelAnimationFrame(this.peticion);
			this.flujo?.getTracks().forEach((pista) => pista.stop());
			this.flujo = null;
			if (this.video) { this.video.srcObject = null; }
		}
	}

	/* =========================================================
	   VENTANA DE CÁMARA: miniatura con el esqueleto de la mano
	   ========================================================= */
	class VentanaCamaraIU {
		constructor(alApagar) {
			this.alApagar = alApagar;
			this.elemento = null;
		}

		crear() {
			if (this.elemento) { return; }

			this.elemento = DOM.plantilla("tpl-camara");
			this.video = DOM.uno("video", this.elemento);
			this.lienzo = DOM.uno("canvas", this.elemento);
			this.ctx = this.lienzo.getContext("2d");
			this.estado = DOM.uno(".camara-estado", this.elemento);
			this.gesto = DOM.uno(".camara-gesto", this.elemento);

			const minimizar = DOM.uno("[data-accion=minimizar]", this.elemento);
			minimizar.addEventListener("click", () => {
				const minimizada = this.elemento.classList.toggle("minimizada");
				minimizar.textContent = minimizada ? "□" : "—";
				minimizar.title = minimizada ? "Mostrar la cámara" : "Minimizar";
			});
			DOM.uno("[data-accion=apagar]", this.elemento).addEventListener("click", () => this.alApagar());

			document.body.appendChild(this.elemento);
		}

		mostrarEstado(texto) {
			if (this.estado && this.estado.textContent !== texto) { this.estado.textContent = texto; }
		}

		mostrarGesto(texto) {
			if (!this.gesto) { return; }
			this.gesto.textContent = texto;
			this.gesto.classList.remove("destello");
			void this.gesto.offsetWidth; // reinicia la animación
			this.gesto.classList.add("destello");
		}

		dibujar(datos) {
			const { ctx, lienzo } = this;
			if (!ctx) { return; }

			if (lienzo.width !== datos.ancho) {
				lienzo.width = datos.ancho;
				lienzo.height = datos.alto;
			}

			// El color de acento se lee del CSS de vez en cuando, por si cambia el tema
			if (!this.color || this.cuadros++ > 60) {
				this.color = getComputedStyle(document.documentElement).getPropertyValue("--acento").trim() || "#ff5fa2";
				this.cuadros = 0;
			}

			ctx.clearRect(0, 0, lienzo.width, lienzo.height);

			if (datos.cara) {
				const caja = datos.cara.boundingBox;
				ctx.strokeStyle = "rgba(255,255,255,.7)";
				ctx.lineWidth = 2;
				ctx.setLineDash([8, 6]);
				ctx.strokeRect(caja.originX, caja.originY, caja.width, caja.height);
				ctx.setLineDash([]);
			}

			if (datos.mano) {
				const punto = (i) => [datos.mano[i].x * lienzo.width, datos.mano[i].y * lienzo.height];

				ctx.strokeStyle = "rgba(255,255,255,.85)";
				ctx.lineWidth = 3;
				ManoIU.CONEXIONES.forEach(([a, b]) => {
					ctx.beginPath();
					ctx.moveTo(...punto(a));
					ctx.lineTo(...punto(b));
					ctx.stroke();
				});

				ctx.fillStyle = this.color;
				datos.mano.forEach((_, i) => {
					ctx.beginPath();
					ctx.arc(...punto(i), i === 4 || i === 8 ? 7 : 4, 0, Math.PI * 2);
					ctx.fill();
				});
			}
		}

		quitar() {
			this.elemento?.remove();
			this.elemento = null;
			this.ctx = null;
		}
	}

	/* =========================================================
	   GESTOS: la mano maneja la interfaz como si fuera un ratón
	   ========================================================= */
	class GestosIU {
		static CLICABLES = "button,a[href],input,select,textarea,label,summary,[role=link],[role=tab],[role=option],tr[data-id],th.ordenable,li[data-indice]";

		constructor(natural) {
			this.natural = natural;
			this.pausado = false;
			this.cursor = null;
			this.posicion = null;
			this.sobre = null;
			this.pinza = null;
			this.huella = [];
			this.postura = { nombre: "", desde: 0 };
			this.esperaHasta = 0;
			this.dialogos = 0;
		}

		crearCursor() {
			if (this.cursor) { return; }

			this.cursor = document.createElement("div");
			this.cursor.className = "cursor-natural oculto";
			this.cursor.setAttribute("aria-hidden", "true");

			// Como popover vive en la capa superior: así queda por encima de los <dialog> modales
			if ("popover" in HTMLElement.prototype) { this.cursor.popover = "manual"; }
			document.body.appendChild(this.cursor);
			this.cursor.showPopover?.();
		}

		/** Un diálogo abierto después del cursor lo taparía: se vuelve a mostrar para quedar encima */
		subirCursor() {
			const dialogos = document.querySelectorAll("dialog[open]").length;
			if (dialogos === this.dialogos || !this.cursor.showPopover) { return; }
			this.dialogos = dialogos;
			try {
				this.cursor.hidePopover();
				this.cursor.showPopover();
			} catch (error) { /* el navegador no admite popover */ }
		}

		procesar(datos) {
			if (this.pausado || !datos.mano) { this.soltar(); return; }

			this.crearCursor();
			const mano = new ManoIU(datos.mano);
			const ahora = datos.tiempo;
			const postura = mano.postura;

			// 1. CURSOR: punto medio entre índice y pulgar (no se mueve al pellizcar).
			//    La imagen se espeja y se usa solo la zona central, para no tener que llegar al borde.
			const medio = mano.centro([4, 8]);
			const objetivo = {
				x: limitar((1 - medio.x - 0.2) / 0.6, 0, 1) * innerWidth,
				y: limitar((medio.y - 0.15) / 0.55, 0, 1) * innerHeight
			};
			const k = this.natural.ajustes.suavizado;
			this.posicion = this.posicion
				? { x: this.posicion.x + (objetivo.x - this.posicion.x) * k, y: this.posicion.y + (objetivo.y - this.posicion.y) * k }
				: objetivo;

			const { x, y } = this.posicion;
			this.cursor.style.transform = `translate(${x}px, ${y}px)`;
			this.cursor.classList.remove("oculto");
			this.subirCursor();
			this.marcarSobre(x, y);

			// 2. PELLIZCO: clic al soltar o, si la mano se mueve mientras pellizca, desplazar (como en un móvil).
			//    Dos umbrales distintos para entrar y salir evitan que tiemble entre pinza y no pinza.
			const pinza = mano.pinza;
			if (!this.pinza && pinza < 0.3) {
				this.pinza = { x, y, ultimaY: y, desplazando: false, contenedor: this.desplazable(document.elementFromPoint(x, y)) };
			} else if (this.pinza && pinza > 0.45) {
				if (!this.pinza.desplazando) { this.clic(this.pinza.x, this.pinza.y); }
				this.pinza = null;
			} else if (this.pinza) {
				this.moverPinza(y);
			}

			this.cursor.classList.toggle("pulsando", Boolean(this.pinza));
			if (this.pinza) {
				this.huella = [];
				this.cursor.style.setProperty("--progreso", 0);
				return;
			}

			// 3. DESLIZAR: con la palma abierta, la muñeca recorre mucho espacio en poco tiempo
			const muneca = mano.punto(0);
			this.huella.push({ t: ahora, x: 1 - muneca.x, y: muneca.y });
			this.huella = this.huella.filter((h) => ahora - h.t < 450);
			const dx = this.huella.at(-1).x - this.huella[0].x;
			const dy = this.huella.at(-1).y - this.huella[0].y;

			if (postura === "palma" && ahora > this.esperaHasta && Math.abs(dx) > 0.28 && Math.abs(dy) < 0.15) {
				this.esperaHasta = ahora + 900;
				this.huella = [];
				// Igual que en una pantalla táctil: hacia la izquierda pasa a lo siguiente
				const paso = dx < 0 ? 1 : -1;
				this.natural.anunciarGesto("deslizar", this.natural.siguiente(paso));
				return;
			}

			// 4. POSTURAS MANTENIDAS: palma quieta 1 s (cerrar) y pulgar arriba 0,7 s (aceptar)
			if (postura !== this.postura.nombre) { this.postura = { nombre: postura, desde: ahora }; }
			const necesario = { palma: 1000, pulgar: 700 }[postura];
			const quieta = Math.hypot(dx, dy) < 0.04;

			if (necesario && ahora > this.esperaHasta) {
				if (postura === "palma" && !quieta) { this.postura.desde = ahora; }
				const progreso = limitar((ahora - this.postura.desde) / necesario, 0, 1);
				this.cursor.style.setProperty("--progreso", progreso);

				if (progreso >= 1) {
					this.esperaHasta = ahora + 1500;
					this.postura.desde = ahora + 1500;
					const resultado = postura === "palma" ? this.natural.cerrarOVolver() : this.natural.aceptar();
					this.natural.anunciarGesto(postura, resultado);
				}
			} else {
				this.cursor.style.setProperty("--progreso", 0);
			}

			const nombres = { palma: "✋ Palma", pulgar: "👍 Pulgar", puno: "✊ Puño", apuntar: "☝️ Apuntando" };
			this.natural.camara.mostrarEstado(nombres[postura]);
		}

		moverPinza(y) {
			const pinza = this.pinza;

			if (!pinza.desplazando && Math.abs(y - pinza.y) > 28) {
				pinza.desplazando = true;
				this.natural.anunciarGesto("arrastrar");
			}
			if (pinza.desplazando && pinza.contenedor) {
				// El contenido sigue a la mano: subir la mano sube el contenido
				pinza.contenedor.scrollTop -= (y - pinza.ultimaY) * 2;
			}
			pinza.ultimaY = y;
		}

		desplazable(elemento) {
			for (let nodo = elemento; nodo && nodo !== document.body; nodo = nodo.parentElement) {
				if (/(auto|scroll)/.test(getComputedStyle(nodo).overflowY) && nodo.scrollHeight > nodo.clientHeight) {
					return nodo;
				}
			}
			return DOM.uno("#escenario");
		}

		marcarSobre(x, y) {
			const elemento = document.elementFromPoint(x, y)?.closest(GestosIU.CLICABLES) || null;
			if (elemento === this.sobre) { return; }
			this.sobre?.classList.remove("natural-sobre");
			elemento?.classList.add("natural-sobre");
			this.sobre = elemento;
		}

		clic(x, y) {
			const elemento = document.elementFromPoint(x, y);
			if (!elemento) { return; }

			const objetivo = elemento.closest(GestosIU.CLICABLES) || elemento;
			this.onda(x, y);
			this.natural.anunciarGesto("pinza");

			// En los campos de texto el clic solo sirve para poner el foco
			if (objetivo.matches("input:not([type=checkbox],[type=radio],[type=button],[type=submit]),textarea,select")) {
				objetivo.focus();
				return;
			}
			objetivo.click();
		}

		onda(x, y) {
			const onda = document.createElement("span");
			onda.className = "onda-natural";
			onda.style.left = `${x}px`;
			onda.style.top = `${y}px`;
			document.body.appendChild(onda);
			setTimeout(() => onda.remove(), 600);
		}

		soltar() {
			this.cursor?.classList.add("oculto");
			this.sobre?.classList.remove("natural-sobre");
			this.sobre = null;
			this.pinza = null;
			this.posicion = null;
			this.huella = [];
		}
	}

	/* =========================================================
	   CABEZA: asentir / negar en los diálogos y presencia
	   ========================================================= */
	class CabezaIU {
		constructor(natural) {
			this.natural = natural;
			this.historial = [];
			this.sinCaraDesde = null;
			this.dialogoDesde = null;
			this.esperaHasta = 0;
		}

		/** Cuántas veces cambia de sentido un movimiento (ignorando temblores menores que «minimo») */
		static vaivenes(valores, minimo) {
			let cambios = 0;
			let sentido = 0;
			let ancla = valores[0];

			valores.forEach((valor) => {
				const diferencia = valor - ancla;
				if (Math.abs(diferencia) < minimo) { return; }
				const nuevo = Math.sign(diferencia);
				if (sentido && nuevo !== sentido) { cambios++; }
				sentido = nuevo;
				ancla = valor;
			});

			return cambios;
		}

		procesar(datos) {
			const ahora = datos.tiempo;
			const ajustes = this.natural.ajustes;

			// Presencia: sin nadie delante de la cámara, los datos se ocultan
			if (datos.cara) {
				this.sinCaraDesde = null;
				this.natural.privacidad(false);
			} else {
				this.sinCaraDesde ??= ahora;
				this.historial = [];
				if (ajustes.privacidad && ahora - this.sinCaraDesde > 2500) { this.natural.privacidad(true); }
				return;
			}

			const caja = datos.cara.boundingBox;
			this.historial.push({
				t: ahora,
				x: (caja.originX + caja.width / 2) / datos.ancho,
				y: (caja.originY + caja.height / 2) / datos.alto,
				alto: caja.height / datos.alto
			});
			this.historial = this.historial.filter((h) => ahora - h.t < 1400);

			// Solo se interpreta la cabeza mientras hay una pregunta en pantalla
			const dialogo = document.querySelector("dialog.dialogo[open]");
			if (!ajustes.cabeza || !dialogo) { this.dialogoDesde = null; return; }
			this.dialogoDesde ??= ahora;
			if (ahora - this.dialogoDesde < 700 || ahora < this.esperaHasta || this.historial.length < 6) { return; }

			const alto = this.historial.reduce((s, h) => s + h.alto, 0) / this.historial.length;
			const xs = this.historial.map((h) => h.x);
			const ys = this.historial.map((h) => h.y);
			const amplitudX = (Math.max(...xs) - Math.min(...xs)) / alto;
			const amplitudY = (Math.max(...ys) - Math.min(...ys)) / alto;

			let gesto = null;
			if (amplitudY > 0.12 && amplitudY > amplitudX * 1.6 && CabezaIU.vaivenes(ys, alto * 0.04) >= 2) { gesto = "asentir"; }
			if (amplitudX > 0.15 && amplitudX > amplitudY * 1.6 && CabezaIU.vaivenes(xs, alto * 0.04) >= 2) { gesto = "negar"; }

			if (gesto) {
				this.esperaHasta = ahora + 1500;
				this.historial = [];
				this.natural.anunciarGesto(gesto, this.natural.responderDialogo(gesto === "asentir"));
			}
		}
	}

	/* =========================================================
	   VOZ: reconocimiento (voz → texto) y síntesis (texto → voz)
	   ========================================================= */
	class VozIU {
		constructor() {
			this.Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
			this.disponible = Boolean(this.Reconocimiento);
			this.sintesis = "speechSynthesis" in window;
			this.reconocimiento = null;
			this.escuchando = false;
			this.continuo = false;
			this.hablando = false;
			this.alTexto = null;
			this.alCambio = null;
			this.alError = null;
		}

		voces() {
			return this.sintesis ? speechSynthesis.getVoices().filter((voz) => voz.lang.toLowerCase().startsWith("es")) : [];
		}

		/** continuo = manos libres: sigue escuchando hasta que se llama a detener() */
		escuchar({ continuo = false } = {}) {
			this.detener();
			this.continuo = continuo;

			const reconocimiento = new this.Reconocimiento();
			reconocimiento.lang = "es-ES";
			reconocimiento.continuous = continuo;
			reconocimiento.interimResults = true;

			reconocimiento.onstart = () => {
				this.escuchando = true;
				this.alCambio?.();
			};

			reconocimiento.onresult = (evento) => {
				for (let i = evento.resultIndex; i < evento.results.length; i++) {
					const resultado = evento.results[i];
					this.alTexto?.(resultado[0].transcript.trim(), resultado.isFinal);
				}
			};

			reconocimiento.onerror = (evento) => {
				if (evento.error === "not-allowed" || evento.error === "audio-capture") { this.continuo = false; }
				this.alError?.(evento.error);
			};

			reconocimiento.onend = () => {
				this.escuchando = false;
				// Chrome corta la escucha continua cada cierto tiempo: si sigue en manos libres, se reanuda
				if (this.continuo && !this.hablando && this.reconocimiento === reconocimiento) {
					setTimeout(() => { try { reconocimiento.start(); } catch (error) { /* ya estaba escuchando */ } }, 250);
				}
				this.alCambio?.();
			};

			this.reconocimiento = reconocimiento;
			reconocimiento.start();
		}

		detener() {
			const reconocimiento = this.reconocimiento;
			this.continuo = false;
			this.reconocimiento = null;
			reconocimiento?.abort();
			this.escuchando = false;
			this.alCambio?.();
		}

		hablar(texto, ajustes = AjustesNaturales.leer()) {
			if (!this.sintesis || !texto) { return; }

			speechSynthesis.cancel();
			const frase = new SpeechSynthesisUtterance(texto);
			const voz = speechSynthesis.getVoices().find((v) => v.name === ajustes.voz);

			frase.lang = voz?.lang || "es-ES";
			if (voz) { frase.voice = voz; }
			frase.rate = ajustes.velocidad;
			frase.pitch = ajustes.tono;
			frase.volume = ajustes.volumen;

			// Mientras habla no escucha: así no se oye a sí misma y no se da órdenes
			frase.onstart = () => {
				this.hablando = true;
				if (this.continuo) { this.reconocimiento?.stop(); }
				this.alCambio?.();
			};
			const terminar = () => {
				this.hablando = false;
				if (this.continuo && this.reconocimiento) {
					try { this.reconocimiento.start(); } catch (error) { /* se reanudará en onend */ }
				}
				this.alCambio?.();
			};
			frase.onend = terminar;
			frase.onerror = terminar;

			speechSynthesis.speak(frase);
		}

		callar() {
			if (this.sintesis) { speechSynthesis.cancel(); }
		}
	}

	/* =========================================================
	   OLLAMA: modelo de lenguaje local
	   Primero prueba el ollama.php de clase; si no hay PHP, va
	   directo a Ollama (que acepta peticiones desde localhost).
	   ========================================================= */
	class OllamaIU {
		static DIRECTO = "http://localhost:11434";

		constructor() {
			this.via = null;
			this.modelos = [];
		}

		async comprobar() {
			try {
				const datos = await (await fetch("ollama.php")).json();
				if (datos.ok) {
					this.via = "php";
					this.modelos = datos.modelos;
					return true;
				}
			} catch (error) { /* sin PHP el servidor devuelve el código fuente y no es JSON */ }

			try {
				const datos = await (await fetch(`${OllamaIU.DIRECTO}/api/tags`)).json();
				this.via = "directo";
				this.modelos = datos.models.map((modelo) => modelo.name);
				return true;
			} catch (error) {
				this.via = null;
				this.modelos = [];
				return false;
			}
		}

		/** Si el modelo elegido no está instalado se usa otro que haya (los de «embed» no generan texto) */
		modeloDisponible(preferido) {
			const generadores = this.modelos.filter((m) => !/embed/i.test(m));
			if (!generadores.length || generadores.includes(preferido)) { return preferido; }
			return generadores.find((m) => m.startsWith(preferido.split(":")[0])) || generadores[0];
		}

		async generar(mensaje, sistema, preferido) {
			if (!this.via && !(await this.comprobar())) {
				throw new Error("Ollama no responde");
			}

			const modelo = this.modeloDisponible(preferido);

			if (this.via === "php") {
				const respuesta = await fetch("ollama.php", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ mensaje, sistema, modelo, formato: "json" })
				});
				if (!respuesta.ok) { throw new Error(`ollama.php (${respuesta.status})`); }
				return (await respuesta.json()).respuesta;
			}

			const respuesta = await fetch(`${OllamaIU.DIRECTO}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ model: modelo, system: sistema, prompt: mensaje, format: "json", stream: false, options: { temperature: 0.2 } })
			});
			if (!respuesta.ok) { throw new Error(`Ollama (${respuesta.status})`); }
			return (await respuesta.json()).response;
		}
	}

	/* =========================================================
	   INTÉRPRETE: de una frase en lenguaje natural a una orden
	   { accion, ... } que la aplicación sabe ejecutar.
	   Primero reglas propias (rápidas y sin conexión); si ninguna
	   encaja, se le pregunta al modelo local.
	   ========================================================= */
	class InterpreteIU {
		static COLORES = { rosa: 335, azul: 200, violeta: 265, morado: 265, lila: 285, verde: 150, ambar: 32, naranja: 25, rojo: 355, amarillo: 50 };
		static ALIAS_MODULOS = { inicio: ["inicio", "panel principal", "portada"], ajustes: ["ajustes", "configuracion", "preferencias"] };
		static ALIAS_VISTAS = { listado: ["lista", "tabla"], apariencia: ["colores", "color", "tema"], atajos: ["atajos", "ayuda", "comandos"], natural: ["voz y gestos", "voz", "gestos"], datos: ["copia de seguridad", "copia"] };

		static SINONIMOS = { facturacion: ["factura", "facturado"], stock: ["existencias", "queda"], numero_empleados: ["empleados", "plantilla"], total: ["importe", "grande"] };
		static VACIAS = ["de", "del", "la", "el", "los", "las", "en", "a", "al", "mis", "mi", "y", "todos", "todas", "seccion", "vista", "pantalla", "pagina"];

		constructor(natural) {
			this.natural = natural;
		}

		get app() { return this.natural.app; }

		interpretar(texto) {
			const clave = TextoNatural.limpiar(this.natural.ajustes.palabraClave || "");
			let original = String(texto);
			let plano = TextoNatural.plano(original);

			// «Serena, …»: la palabra clave se quita del texto original y del plano a la vez
			const prefijo = clave && plano.match(new RegExp(`^\\s*${clave}(\\s+|$)`));
			if (prefijo) {
				original = original.slice(prefijo[0].length);
				plano = plano.slice(prefijo[0].length);
			}

			const t = TextoNatural.limpiar(original).replace(/\b(por favor|porfa|oye)\b/g, " ").replace(/\s+/g, " ").trim();
			if (!t) { return null; }

			const reglas = [
				() => /^(ayuda|que puedo decir|que sabes hacer|comandos)\b/.test(t) && { accion: "ayuda" },
				() => this.dialogo(t),
				() => this.control(t),
				() => /^(cierra|cerrar|salir|sal|atras|vuelve|volver|escape)\b/.test(t) && { accion: "cerrar" },
				() => /^(guarda|guardar|graba|grabar)\b/.test(t) && { accion: "guardar" },
				() => this.natural.dictado.analizar(original, plano).length && { accion: "dictar", original, plano },
				() => /^(siguiente|pagina siguiente|adelante|otro)\b/.test(t) && { accion: "paginar", paso: 1 },
				() => /^(anterior|pagina anterior)\b/.test(t) && { accion: "paginar", paso: -1 },
				() => this.tema(t),
				() => this.realidad(t),
				() => this.consulta(t),
				() => this.nuevo(t, original, plano),
				() => this.abrir(t),
				() => this.buscar(t),
				() => this.ir(t)
			];

			for (const regla of reglas) {
				const orden = regla();
				if (orden) { return orden; }
			}
			return null;
		}

		/* ---------- Reglas ---------- */

		dialogo(t) {
			if (!document.querySelector("dialog.dialogo[open]")) { return null; }
			if (/^(si|vale|aceptar|acepta|acepto|confirmar|confirmo|de acuerdo|ok|okey|claro|adelante)\b/.test(t)) { return { accion: "dialogo", aceptar: true }; }
			if (/^(no|cancelar|cancela|mejor no)\b/.test(t)) { return { accion: "dialogo", aceptar: false }; }
			return null;
		}

		control(t) {
			if (/\b(activa|enciende|empieza|pon|abre)\w*( el| los| la)? (gestos|camara|control por gestos)\b/.test(t)) { return { accion: "gestos", activar: true }; }
			if (/\b(desactiva|apaga|para|quita|cierra)\w*( el| los| la)? (gestos|camara)\b/.test(t)) { return { accion: "gestos", activar: false }; }
			if (/\b(deja de escuchar|para de escuchar|no escuches|desactiva( la)? escucha|apaga el microfono)\b/.test(t)) { return { accion: "escucha", activar: false }; }
			if (/\b(manos libres|escucha siempre|activa( la)? escucha)\b/.test(t)) { return { accion: "escucha", activar: true }; }
			if (/^(calla|callate|silencio|para de hablar)\b/.test(t)) { return { accion: "callar" }; }
			if (/\bpaleta de comandos\b|^(abre )?(la )?paleta$/.test(t)) { return { accion: "paleta" }; }
			return null;
		}

		tema(t) {
			const modo = t.match(/\b(modo|tema|pon|ponlo|activa|cambia)\b.*\b(claro|oscuro)\b/);
			if (modo) { return { accion: "tema", modo: modo[2] }; }

			const color = t.match(/\b(color|tono|ponlo|ponte|pon)\b.*\b(rosa|azul|violeta|morado|lila|verde|ambar|naranja|rojo|amarillo)\b/);
			if (color) { return { accion: "tema", tono: InterpreteIU.COLORES[color[2]], nombre: color[2] }; }
			return null;
		}

		/** «Enséñame el portátil en la mano» abre la realidad aumentada; dentro, «muestra el ratón» cambia de producto */
		realidad(t) {
			const ar = this.natural.ar;
			const productos = ar.productos();

			if (ar.activa) {
				const resto = t.match(/^(muestra|muestrame|ensename|ver|pon|cambia a)\s+(el |la |los |las |un |una )?(.+)/)?.[3];
				const elegido = resto && TextoNatural.mejorCoincidencia(productos, (p) => p.nombre, resto);
				return elegido ? { accion: "producto", id: elegido.id } : null;
			}

			if (!/(realidad aumentada|en (la|mi|tu) mano|en 3d|en tres de)/.test(t)) { return null; }
			const resto = t.replace(/(realidad aumentada|en (la|mi|tu) mano|en 3d|en tres de)/, " ");
			const elegido = TextoNatural.mejorCoincidencia(productos, (p) => p.nombre, resto.replace(/\b(ensename|muestra|muestrame|ver|abre|producto|productos)\b/g, " ").trim());
			return { accion: "ar", id: elegido?.id ?? this.natural.fichaAbierta("productos")?.id ?? null };
		}

		consulta(t) {
			if (/^(dame un resumen|resumen general|resumeme|como va|como vamos|que tal va|lee el panel|como esta todo)/.test(t)) { return { accion: "resumen" }; }
			if (/(cuanto (he|hemos|se ha) (vendido|facturado)|total (de )?ventas|ventas totales|total facturado)/.test(t)) { return { accion: "ventas" }; }

			const extremo = this.extremo(t);
			if (extremo) { return extremo; }

			if (/^(cuant[oa]s|numero de|cuenta( los| las)?)\b/.test(t)) {
				const entidad = this.entidadEn(t);
				if (!entidad) { return null; }
				return { accion: "contar", entidad: entidad.id, filtros: this.filtrosEn(entidad, t) };
			}
			return null;
		}

		/** «¿Qué producto es el más caro?», «cliente que más factura»: se calcula exacto, sin preguntar al modelo */
		extremo(t) {
			const entidad = this.entidadEn(t);
			const caro = /\b(caro|cara|caros)\b/.test(t);
			const barato = /\b(barato|barata|baratos)\b/.test(t);
			const sentido = caro || /\b(mas|mayor|maximo)\b/.test(t) ? 1 : barato || /\b(menos|menor|minimo)\b/.test(t) ? -1 : 0;
			if (!entidad || !sentido) { return null; }

			const numericos = entidad.campos.filter((c) => c.tipo === "number" && c.nombre !== "id");
			const campo = (caro || barato)
				? numericos.find((c) => c.formato === "moneda")
				: numericos.find((c) => [...InterpreteIU.SINONIMOS[c.nombre] || [], ...TextoNatural.limpiar(c.etiqueta).split(" ")]
					.some((palabra) => palabra.length > 3 && t.includes(palabra)));

			const adjetivo = caro ? "más caro" : barato ? "más barato" : "";
			return campo ? { accion: "extremo", entidad: entidad.id, campo: campo.nombre, sentido, adjetivo } : null;
		}

		/** «Nuevo cliente nombre Laura correo …»: abre el formulario y dicta el resto */
		nuevo(t, original, plano) {
			if (!/^(nuevo|nueva|crea|crear|anade|anadir|agrega|agregar|da de alta|alta|registra|registrar)\b/.test(t)) { return null; }
			const entidad = this.entidadEn(t) || this.entidadActual();
			if (!entidad) { return null; }

			const nombres = [entidad.singular, entidad.titulo].map((n) => TextoNatural.limpiar(n)).join("|");
			const fin = plano.match(new RegExp(`(^|\\s)(${nombres})(?=\\s|$)`));
			const desde = fin ? fin.index + fin[0].length : plano.length;
			const dictado = original.slice(desde).trim() ? { original: original.slice(desde), plano: plano.slice(desde) } : null;

			return { accion: "nuevo", entidad: entidad.id, dictado };
		}

		abrir(t) {
			const verbo = t.match(/^(abre|abrir|muestra|muestrame|mostrar|ensename|ver|edita|editar|modifica|modificar|ficha)\b/);

			for (const entidad of Object.values(this.app.entidades)) {
				const singular = TextoNatural.limpiar(entidad.singular);
				// Solo el singular exacto: «abre el cliente 3» abre una ficha; «abre clientes» va al listado
				const coincide = t.match(new RegExp(`(^| )(el |la |del |de la )?${singular}( |$)(.*)`));
				if (!coincide || (!verbo && coincide.index !== 0)) { continue; }

				const resto = coincide[4].replace(/\b(numero|num|con id|id|de)\b/g, " ").trim();
				if (!resto) { return null; }

				const editar = Boolean(verbo && /^(edita|editar|modifica|modificar)/.test(verbo[1]));
				const id = TextoNatural.numero(resto);
				const registro = id ? entidad.buscar(id) : TextoNatural.mejorCoincidencia(entidad.todos(), (r) => entidad.textoRegistro(r), resto);

				if (!registro) {
					return { accion: "responder", respuesta: `No encuentro ningún ${entidad.singular} «${resto}».` };
				}
				return { accion: "abrir", entidad: entidad.id, id: registro.id, editar };
			}
			return null;
		}

		buscar(t) {
			if (/^(quita|borra|limpia|elimina)( el| la| los)? (filtro|busqueda|filtros)/.test(t)) {
				const entidad = this.entidadActual();
				return entidad ? { accion: "buscar", entidad: entidad.id, texto: "", limpiar: true } : { accion: "responder", respuesta: "No hay ningún filtro puesto." };
			}

			const coincide = t.match(/^(busca|buscar|buscame|encuentra|encuentrame|filtra|filtrar|filtrame)\s+(.+)/);
			if (!coincide) { return null; }

			let texto = coincide[2];
			let entidad = null;
			const destino = texto.match(/^(.+?)\s+en\s+(los |las |el |la )?(\w+)$/);
			if (destino) {
				entidad = this.entidadEn(destino[3]);
				if (entidad) { texto = destino[1]; }
			}
			texto = texto.replace(/^(el|la|los|las|a|al)\s+/, "");

			// Sin decir dónde: en el módulo actual si allí hay resultados; si no, donde más salgan
			const actual = this.entidadActual();
			entidad ??= actual && this.coincidencias(actual, texto) ? actual : this.entidadConMasResultados(texto);
			return entidad ? { accion: "buscar", entidad: entidad.id, texto } : null;
		}

		ir(t) {
			const app = this.app;

			// Una pregunta nunca es una orden de navegación: la contesta el modelo
			if (/^(que|cual|cuales|quien|quienes|como|donde|cuando|por que|cuanto|cuanta|dime|sabes)\b/.test(t)) { return null; }

			const verbo = t.match(/^(ir a|ve a|vete a|vamos a|llevame a|abre|abrir|muestra|muestrame|mostrar|ensename|quiero ver|ver|pon|cambia a)\s+/);
			const resto = t.slice(verbo ? verbo[0].length : 0).replace(/^(el|la|los|las|mis)\s+/, "");

			const buscarVista = (modulo) => app.vistasDe(modulo).find((vista) => this.nombresVista(vista).some((n) => TextoNatural.contiene(resto, n)));
			const actual = app.modulo(Enrutador.leer().modulo);
			let destino = app.estado.menu.find((modulo) => this.nombresModulo(modulo).some((n) => TextoNatural.contiene(resto, n)));
			let vista = destino && buscarVista(destino);

			// Solo se ha dicho la vista («resumen»): primero en el módulo actual, si no en cualquiera
			if (!destino) {
				destino = actual && buscarVista(actual) ? actual : app.estado.menu.find((modulo) => buscarVista(modulo));
				vista = destino && buscarVista(destino);
			}
			if (!destino) { return null; }

			const orden = { accion: "ir", modulo: destino.id, vista: vista?.id || "" };

			// «pedidos pendientes» → listado de pedidos con el filtro rápido puesto
			const entidad = app.entidades[destino.id];
			const rapido = entidad?.esquema.filtroRapido;
			const filtro = rapido && this.filtrosEn(entidad, resto).find((f) => f.campo === rapido);
			if (filtro) {
				orden.vista = "listado";
				orden.filtroRapido = filtro.valor;
			}

			// Casi todas las palabras tienen que ser nombres conocidos: «pedidos pendientes» sí,
			// «el cliente que más factura» no (eso es una pregunta para el modelo)
			const conocidas = [
				this.nombresModulo(destino).find((n) => TextoNatural.contiene(resto, n)),
				vista && this.nombresVista(vista).find((n) => TextoNatural.contiene(resto, n)),
				filtro && TextoNatural.limpiar(filtro.valor)
			].filter(Boolean).join(" ").split(" ");
			const sobran = resto.split(" ").filter((p) => !InterpreteIU.VACIAS.includes(p) && !conocidas.some((c) => p.startsWith(c)));
			return sobran.length <= (verbo ? 1 : 0) ? orden : null;
		}

		/* ---------- Ayudantes ---------- */

		entidadActual() {
			return this.app.entidades[Enrutador.leer().modulo] || null;
		}

		/** La entidad que se nombra antes en la frase: «nuevo pedido cliente Carlos» → pedidos */
		entidadEn(t) {
			let elegida = null;
			let posicion = Infinity;

			Object.values(this.app.entidades).forEach((entidad) => {
				[entidad.titulo, entidad.singular].forEach((nombre) => {
					const indice = t.search(new RegExp(`(^| )${TextoNatural.limpiar(nombre)}(s|es)?( |$)`));
					if (indice > -1 && indice < posicion) { elegida = entidad; posicion = indice; }
				});
			});

			return elegida;
		}

		entidadConMasResultados(texto) {
			let mejor = null;
			let maximo = 0;

			Object.values(this.app.entidades).forEach((entidad) => {
				const total = this.coincidencias(entidad, texto);
				if (total > maximo) { mejor = entidad; maximo = total; }
			});

			return mejor || this.entidadActual() || Object.values(this.app.entidades)[0];
		}

		coincidencias(entidad, texto) {
			return entidad.todos().filter((r) => TextoNatural.limpiar(Object.values(r).join(" ")).includes(texto)).length;
		}

		/** Valores de los campos select y checkbox que aparecen en la frase: «pedidos pendientes no pagados» */
		filtrosEn(entidad, t) {
			const filtros = [];

			entidad.campos.forEach((campo) => {
				if (campo.tipo === "select" && campo.opciones) {
					const opcion = campo.opciones.find((o) => TextoNatural.contiene(t, TextoNatural.limpiar(o)));
					if (opcion) { filtros.push({ campo: campo.nombre, valor: opcion }); }
				}
				if (campo.tipo === "checkbox") {
					const palabra = TextoNatural.limpiar(campo.etiqueta).split(" ").at(-1); // «Cliente activo» → «activo»
					if (TextoNatural.contiene(t, palabra)) {
						filtros.push({ campo: campo.nombre, valor: !TextoNatural.contiene(t, `no ${palabra}`) });
					}
				}
			});

			return filtros;
		}

		nombresModulo(modulo) {
			const nombres = [TextoNatural.limpiar(modulo.texto), ...(InterpreteIU.ALIAS_MODULOS[modulo.id] || [])];
			const entidad = this.app.entidades[modulo.id];
			if (entidad) { nombres.push(TextoNatural.limpiar(entidad.singular)); }
			return nombres;
		}

		nombresVista(vista) {
			return [TextoNatural.limpiar(vista.texto), ...(InterpreteIU.ALIAS_VISTAS[vista.id] || [])];
		}

		/* ---------- Modelo local ---------- */

		async preguntarIA(texto) {
			const app = this.app;
			const modulos = app.estado.menu
				.map((m) => `  · modulo "${m.id}" (${m.texto}) → vistas: ${app.vistasDe(m).map((v) => `"${v.id}"`).join(", ")}`)
				.join("\n");

			// Los datos van en el prompt (máximo 25 registros por tabla) para que pueda contestar preguntas sobre ellos.
			// Se quitan los textos largos y las webs para no pasarse del contexto de un modelo pequeño.
			const datos = Object.values(app.entidades).map((entidad) => {
				const campos = entidad.campos.filter((c) => !["textarea", "url"].includes(c.tipo));
				const filas = entidad.todos().slice(0, 25).map((r) =>
					`  - id ${r.id}: ${campos.filter((c) => c.nombre !== "id").map((c) => `${c.etiqueta}: ${Utilidades.formatear(r[c.nombre], c)}`).join(" · ")}`);
				return `${entidad.titulo} (modulo "${entidad.id}", ${entidad.todos().length} en total):\n${filas.join("\n")}`;
			}).join("\n\n");

			const sistema = `Eres el asistente de «serena | iu», una aplicación de gestión de clientes, productos y pedidos.
Contestas siempre en español y SOLO con un objeto JSON con esta forma:
{"accion": "", "modulo": "", "vista": "", "id": 0, "texto": "", "modo": "", "respuesta": ""}

Acciones posibles:
- "ir": abrir una vista. "modulo" y "vista" deben salir de esta lista:
${modulos}
- "nuevo": crear un registro. "modulo": clientes, productos o pedidos.
- "abrir": abrir la ficha de un registro. "modulo" y su "id".
- "buscar": filtrar un listado. "modulo" y el "texto" que se busca.
- "tema": cambiar el aspecto. "modo": "claro" u "oscuro".
- "responder": contestar una pregunta usando los DATOS.

Reglas:
- Si el usuario PREGUNTA algo (qué, cuál, quién, cuánto, cuántos, cómo…), la acción es "responder" y la respuesta sale de los DATOS.
- Usa "ir", "nuevo", "abrir", "buscar" o "tema" solo cuando el usuario PIDE hacer algo.
- En "respuesta" escribe siempre una frase corta y amable para el usuario. No inventes datos que no estén abajo.

Ejemplos:
Usuario: ¿Cuántos productos hay?
{"accion": "responder", "modulo": "", "vista": "", "id": 0, "texto": "", "modo": "", "respuesta": "Hay ${app.entidades.productos?.todos().length ?? 0} productos en el catálogo."}
Usuario: llévame a ver los productos
{"accion": "ir", "modulo": "productos", "vista": "listado", "id": 0, "texto": "", "modo": "", "respuesta": "Te llevo al listado de productos."}

DATOS
${datos}`;

			const bruto = await this.natural.ollama.generar(texto, sistema, this.natural.ajustes.modelo);
			const orden = InterpreteIU.leerJSON(bruto);

			if (!orden) { return { accion: "responder", respuesta: String(bruto || "").slice(0, 400), ia: true }; }
			return this.validar(orden);
		}

		static leerJSON(texto) {
			try { return JSON.parse(texto); } catch (error) { /* puede venir con texto alrededor */ }
			try { return JSON.parse(String(texto).match(/\{[\s\S]*\}/)?.[0]); } catch (error) { return null; }
		}

		/** Nunca se ejecuta tal cual lo que diga el modelo: se comprueba que el módulo, la vista o el id existen */
		validar(o) {
			const app = this.app;
			const respuesta = String(o.respuesta || "").trim();
			const modulo = app.modulo(o.modulo);
			const entidad = app.entidades[o.modulo];
			let orden = { accion: "responder", respuesta: respuesta || "No sabría decirte." };

			if (o.accion === "ir" && modulo) { orden = { accion: "ir", modulo: modulo.id, vista: app.vistasDe(modulo).some((v) => v.id === o.vista) ? o.vista : "" }; }
			if (o.accion === "nuevo" && entidad) { orden = { accion: "nuevo", entidad: entidad.id }; }
			if (o.accion === "abrir" && entidad?.buscar(o.id)) { orden = { accion: "abrir", entidad: entidad.id, id: Number(o.id), editar: false }; }
			if (o.accion === "buscar" && entidad) { orden = { accion: "buscar", entidad: entidad.id, texto: TextoNatural.limpiar(o.texto || "") }; }
			if (o.accion === "tema" && ["claro", "oscuro"].includes(o.modo)) { orden = { accion: "tema", modo: o.modo }; }

			return { ...orden, ia: true, respuestaIA: respuesta };
		}
	}

	/* =========================================================
	   DICTADO: rellenar el formulario abierto hablando
	   «nombre Laura apellidos Gil correo laura@gil.es tipo particular»
	   Los nombres de los campos salen del esquema JSON, así que
	   cualquier formulario de la aplicación se puede dictar.
	   ========================================================= */
	class DictadoIU {
		static SINONIMOS = {
			email: ["correo", "mail", "email"], telefono: ["telefono", "movil"], fecha_nacimiento: ["nacimiento", "cumpleanos"],
			numero_empleados: ["empleados", "trabajadores"], web: ["web", "pagina web"], observaciones: ["observaciones", "notas"]
		};
		static MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

		constructor(natural) {
			this.natural = natural;
		}

		formulario() {
			return DOM.uno("#escenario form.tarjeta");
		}

		/** El formulario abierto y los campos que se pueden escribir */
		destino() {
			const formulario = this.formulario();
			const entidad = this.natural.app.entidades[Enrutador.leer().modulo];
			if (!formulario || !entidad) { return null; }

			const campos = entidad.campos.filter((c) => c.nombre !== "id" && !c.soloLectura && formulario.elements[c.nombre]);
			return { formulario, entidad, campos };
		}

		/** Cómo se puede decir cada campo: su etiqueta, su nombre técnico y una palabra corta, si no la comparte con otro */
		alias(campos) {
			const lista = campos.map((campo) => {
				const etiqueta = TextoNatural.limpiar(campo.etiqueta);
				const palabras = etiqueta.split(" ");
				const corta = campo.tipo === "checkbox" ? palabras.at(-1) : palabras[0]; // «Cliente activo» → «activo»
				const nombres = [etiqueta, campo.nombre.replace(/_/g, " "), corta, ...(DictadoIU.SINONIMOS[campo.nombre] || [])];
				return { campo, nombres: [...new Set(nombres)].filter((n) => n.length > 2) };
			});

			const usos = {};
			lista.forEach(({ nombres }) => nombres.forEach((n) => { usos[n] = (usos[n] || 0) + 1; }));
			lista.forEach((a) => { a.nombres = a.nombres.filter((n) => usos[n] === 1); });
			return lista;
		}

		/**
		 * Parte la frase en «campo valor campo valor…». Con desdeInicio, la frase tiene que
		 * empezar por un campo: así «abre el cliente 3» no se confunde con dictar el campo Cliente.
		 */
		analizar(original, plano, desdeInicio = true) {
			const destino = this.destino();
			if (!destino) { return []; }

			const encontrados = [];
			this.alias(destino.campos).forEach(({ campo, nombres }) => {
				nombres.forEach((nombre) => {
					const patron = new RegExp(`(^|\\s)(${nombre.split(" ").join("\\s+")})(?=\\s|$)`, "g");
					for (const coincidencia of plano.matchAll(patron)) {
						const inicio = coincidencia.index + coincidencia[1].length;
						encontrados.push({ campo, inicio, fin: coincidencia.index + coincidencia[0].length });
					}
				});
			});

			// Si dos nombres se pisan («tipo de cliente» y «cliente») gana el más largo; cada campo, una vez
			encontrados.sort((a, b) => a.inicio - b.inicio || (b.fin - b.inicio) - (a.fin - a.inicio));
			const elegidos = [];
			encontrados.forEach((e) => {
				const pisa = elegidos.some((o) => e.inicio < o.fin && o.inicio < e.fin);
				if (!pisa && !elegidos.some((o) => o.campo === e.campo)) { elegidos.push(e); }
			});

			if (!elegidos.length) { return []; }
			const antes = plano.slice(0, elegidos[0].inicio).replace(/^\s*(pon|ponle|rellena|escribe|y)?\s*(el|la|los|las)?\s*$/, "");
			if (desdeInicio && antes.trim()) { return []; }

			return elegidos.map((e, i) => ({
				campo: e.campo,
				valor: original.slice(e.fin, elegidos[i + 1]?.inicio ?? original.length)
					.replace(/^[\s:=,]*((es|son)\s+)?/i, "")       // «correo: …», «tipo es empresa»
					.replace(/(\s+y)?[\s,;]*\.?\s*$/i, "")           // «… y», coma o punto final
					.trim()
			}));
		}

		static numero(valor) {
			const texto = valor.replace(/(\d)\.(?=\d{3}(\D|$))/g, "$1").replace(/(\d),(\d)/g, "$1.$2"); // «42.000» y «12,5»
			const palabras = TextoNatural.limpiar(texto);
			const cifra = texto.match(/-?\d+(\.\d+)?/);
			let numero = cifra ? Number(cifra[0]) : TextoNatural.numero(palabras);

			if (numero === null && /\bmil\b/.test(palabras)) { numero = 1; }
			if (numero === null) { return null; }
			if (/\bmil\b/.test(palabras)) { numero *= 1000; }
			if (/\bmillon(es)?\b/.test(palabras)) { numero *= 1000000; }
			return String(numero);
		}

		static fecha(t) {
			const dia = new Date();
			const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

			if (/\bhoy\b/.test(t)) { return iso(dia); }
			if (/\bayer\b/.test(t)) { dia.setDate(dia.getDate() - 1); return iso(dia); }
			if (/\bmanana\b/.test(t)) { dia.setDate(dia.getDate() + 1); return iso(dia); }

			const larga = t.match(/(\d{1,2}) de (\w+)(?: del? (\d{4}))?/);           // «15 de marzo de 1990»
			if (larga && DictadoIU.MESES[larga[2]]) {
				return iso(new Date(Number(larga[3] || dia.getFullYear()), DictadoIU.MESES[larga[2]] - 1, Number(larga[1])));
			}
			const corta = t.match(/(\d{1,2})[\/\s-](\d{1,2})[\/\s-](\d{4})/);       // «15/3/1990»
			return corta ? iso(new Date(Number(corta[3]), Number(corta[2]) - 1, Number(corta[1]))) : null;
		}

		/** Lo dicho → el valor que espera cada tipo de campo */
		convertir(campo, valor, control) {
			const limpio = TextoNatural.limpiar(valor);

			switch (campo.tipo) {
				case "checkbox": return !/^(no|falso|desactivado|inactivo)\b/.test(limpio);
				case "email": return valor.toLowerCase().replace(/\s*arroba\s*/g, "@").replace(/\s*punto\s*/g, ".").replace(/\s+/g, "");
				case "url": {
					const url = valor.toLowerCase().replace(/\s*punto\s*/g, ".").replace(/\s*barra\s*/g, "/").replace(/\s+/g, "");
					return /^https?:\/\//.test(url) ? url : `https://${url}`;
				}
				case "tel": return valor.replace(/[^\d+]/g, "") || null;
				case "number": return DictadoIU.numero(valor);
				case "date": return DictadoIU.fecha(limpio);
				case "select": {
					const opciones = [...control.options].map((o) => o.value).filter(Boolean);
					return opciones.find((o) => TextoNatural.limpiar(o) === limpio) || TextoNatural.mejorCoincidencia(opciones, (o) => o, limpio);
				}
				default: return valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : null;
			}
		}

		/** Escribe el valor y lanza los mismos eventos que el teclado: validación, cálculos y aviso de cambios */
		aplicar(control, valor) {
			if (control.type === "checkbox") { control.checked = valor; } else { control.value = valor; }
			control.dispatchEvent(new Event("input", { bubbles: true }));
			control.dispatchEvent(new Event("change", { bubbles: true }));

			const caja = control.closest(".campo");
			caja?.classList.remove("dictado");
			void caja?.offsetWidth; // reinicia la animación
			caja?.classList.add("dictado");
		}

		rellenar(original, plano, desdeInicio = true) {
			const destino = this.destino();
			if (!destino) { return "No hay ningún formulario abierto."; }

			const hechos = [];
			const fallidos = [];

			this.analizar(original, plano, desdeInicio).forEach(({ campo, valor }) => {
				const control = destino.formulario.elements[campo.nombre];
				const convertido = valor || campo.tipo === "checkbox" ? this.convertir(campo, valor, control) : null;

				if (convertido === null || convertido === "") {
					fallidos.push(campo.etiqueta.toLowerCase());
					return;
				}
				this.aplicar(control, convertido);
				hechos.push(campo.etiqueta.toLowerCase());
			});

			const faltan = destino.campos
				.filter((c) => c.requerido && c.tipo !== "checkbox" && !destino.formulario.elements[c.nombre].value)
				.map((c) => c.etiqueta.toLowerCase());

			let texto = hechos.length ? `Apuntado: ${enumerar(hechos)}.` : "No he entendido ningún campo.";
			if (fallidos.length) { texto += ` No he entendido ${enumerar(fallidos)}.`; }
			texto += faltan.length ? ` Falta ${enumerar(faltan)}.` : " Di «guardar» cuando quieras.";
			return texto;
		}

		/** Botón y pista en cada formulario de datos, con un ejemplo hecho a partir de sus propios campos */
		preparar(formulario, entidad) {
			if (!this.natural.voz.disponible) { return; }

			const ejemplo = entidad.campos
				.filter((c) => c.nombre !== "id" && !c.soloLectura && c.tipo !== "textarea" && c.tipo !== "checkbox")
				.slice(0, 3)
				.map((c) => `${c.etiqueta.toLowerCase()} …`)
				.join(", ");

			const pista = document.createElement("p");
			pista.className = "pista-dictado";
			pista.textContent = `🎤 También puedes dictarlo: «${ejemplo}» y después «guardar».`;

			const boton = document.createElement("button");
			boton.type = "button";
			boton.className = "boton";
			boton.textContent = "🎤 Dictar";
			boton.addEventListener("click", () => this.natural.escucharFrase());

			DOM.uno(".fila-botones", formulario).append(boton, pista);
		}
	}

	/* =========================================================
	   ASISTENTE: ventana flotante con la conversación
	   ========================================================= */
	class AsistenteIU {
		constructor(natural) {
			this.natural = natural;
			this.elemento = null;
		}

		get abierto() { return Boolean(this.elemento && !this.elemento.hidden); }

		crear() {
			if (this.elemento) { return; }

			this.elemento = DOM.plantilla("tpl-asistente");
			this.lista = DOM.uno(".asistente-mensajes", this.elemento);
			this.estado = DOM.uno(".asistente-estado", this.elemento);
			this.entrada = DOM.uno("input", this.elemento);
			this.microfono = DOM.uno("[data-accion=microfono]", this.elemento);

			DOM.uno("form", this.elemento).addEventListener("submit", (evento) => {
				evento.preventDefault();
				const texto = this.entrada.value;
				this.entrada.value = "";
				this.natural.procesar(texto, "⌨️ texto");
			});
			DOM.uno("[data-accion=cerrar]", this.elemento).addEventListener("click", () => this.cerrar());
			this.microfono.addEventListener("click", () => this.natural.escucharFrase());
			this.elemento.addEventListener("keydown", (evento) => { if (evento.key === "Escape") { this.cerrar(); } });

			document.body.appendChild(this.elemento);
			this.decir("Hola. Puedes escribirme o hablarme. Prueba con «pedidos pendientes», «¿qué cliente factura más?» o, en un formulario, «nombre Laura correo …».", "serena");
		}

		abrir() {
			this.crear();
			this.elemento.hidden = false;
			this.natural.marcarBoton("#botonAsistente", true);
		}

		cerrar() {
			if (this.elemento) { this.elemento.hidden = true; }
			this.natural.marcarBoton("#botonAsistente", false);
		}

		alternar() {
			if (this.abierto) { this.cerrar(); return; }
			this.abrir();
			this.entrada.focus();
		}

		decir(texto, quien, origen = "") {
			if (!texto) { return; }
			this.crear();

			const mensaje = document.createElement("li");
			mensaje.className = `mensaje de-${quien}`;
			mensaje.textContent = texto;

			if (origen) {
				const etiqueta = document.createElement("small");
				etiqueta.textContent = origen;
				mensaje.prepend(etiqueta);
			}

			this.lista.appendChild(mensaje);
			while (this.lista.children.length > 40) { this.lista.firstElementChild.remove(); }
			this.lista.scrollTop = this.lista.scrollHeight;
		}

		mostrarEstado(texto, clase = "") {
			if (!this.elemento) { return; }
			this.estado.textContent = texto;
			this.elemento.dataset.estado = clase;
			this.microfono.classList.toggle("escuchando", clase === "escuchando");
		}
	}

	/* =========================================================
	   REALIDAD AUMENTADA: el producto en 3D sobre la palma
	   La webcam es el fondo; encima, una escena de A-Frame
	   transparente cuyo objeto sigue a la mano detectada.
	   ========================================================= */
	class RealidadAumentadaIU {
		static EMOJIS = { "Informática": "💻", "Periféricos": "🖱️", "Telefonía": "📱", "Oficina": "🖨️", "Almacenamiento": "💾" };
		static FOV = 50;
		static DISTANCIA = 2;

		constructor(natural) {
			this.natural = natural;
			this.activa = false;
			this.indice = 0;
			this.suave = null;
			this.perdida = 0;
			this.pinza = false;
		}

		get app() { return this.natural.app; }

		productos() {
			return this.app.entidades.productos?.todos().filter((p) => !p.descatalogado) ?? [];
		}

		get producto() {
			const lista = this.productos();
			return lista.length ? lista[((this.indice % lista.length) + lista.length) % lista.length] : null;
		}

		cargarAFrame() {
			if (window.AFRAME) { return Promise.resolve(); }

			return new Promise((resolver, rechazar) => {
				const script = document.createElement("script");
				script.src = AFRAME;
				script.onload = resolver;
				script.onerror = () => rechazar(new Error("No se ha podido descargar A-Frame. Comprueba la conexión."));
				document.head.appendChild(script);
			});
		}

		/** Abre la capa de realidad aumentada con un producto (o con el primero del catálogo) */
		async abrir(id = null) {
			if (this.capa) { return; }

			const lista = this.productos();
			if (!lista.length) {
				this.app.toast.aviso("Sin productos", "No hay productos en el catálogo para enseñar.");
				return;
			}
			if (id) { this.indice = Math.max(0, lista.findIndex((p) => p.id === id)); }

			this.app.detalle.cerrar(true);
			const capa = DOM.plantilla("tpl-ar");
			this.capa = capa;
			this.marco = DOM.uno(".ar-marco", capa);
			this.video = DOM.uno("video", capa);
			this.ayuda = DOM.uno(".ar-ayuda", capa);

			DOM.uno("[data-accion=anterior]", capa).addEventListener("click", () => this.cambiar(-1));
			DOM.uno("[data-accion=siguiente]", capa).addEventListener("click", () => this.cambiar(1));
			DOM.uno("[data-accion=captura]", capa).addEventListener("click", () => this.capturar());
			DOM.uno("[data-accion=cerrar]", capa).addEventListener("click", () => this.cerrar());
			capa.addEventListener("keydown", (evento) => {
				if (evento.key === "Escape") { evento.stopPropagation(); this.cerrar(); }
				if (evento.key === "ArrowRight") { this.cambiar(1); }
				if (evento.key === "ArrowLeft") { this.cambiar(-1); }
			});

			document.body.appendChild(capa);
			document.body.classList.add("ar-abierta");
			DOM.uno("[data-accion=cerrar]", capa).focus();
			this.pintarTitulo();

			// La cámara es la misma que la de los gestos: si está apagada, se enciende
			if (!this.natural.vision.activa) {
				this.mostrarAyuda("Activando la cámara…");
				const encendida = await this.natural.activarCamara();
				if (!encendida || this.capa !== capa) { this.cerrar(); return; }
			}

			this.mostrarAyuda("Cargando A-Frame…");
			try {
				await this.cargarAFrame();
			} catch (error) {
				this.mostrarAyuda(error.message);
				return;
			}
			if (this.capa !== capa) { return; } // se ha cerrado mientras cargaba

			this.montarEscena(DOM.uno(".ar-capa", capa));
			this.video.srcObject = this.natural.vision.flujo;
			this.activa = true;

			// Mientras tanto la mano sostiene el producto: no mueve el cursor
			this.natural.gestos.pausado = true;
			this.natural.gestos.soltar();
			this.mostrarAyuda("✋ Abre la mano delante de la cámara");
		}

		cerrar() {
			this.detener();
			this.capa?.remove();
			this.capa = null;
			document.body.classList.remove("ar-abierta");
		}

		pintarTitulo() {
			const producto = this.producto;
			const titulo = this.capa && DOM.uno(".ar-titulo strong", this.capa);
			if (titulo && producto) { titulo.textContent = `${producto.nombre} · ${moneda(producto.precio)}`; }
		}

		montarEscena(capa) {
			capa.innerHTML = `
				<a-scene embedded vr-mode-ui="enabled: false" loading-screen="enabled: false" device-orientation-permission-ui="enabled: false" renderer="alpha: true; antialias: true; colorManagement: true">
					<a-entity light="type: ambient; intensity: 0.9"></a-entity>
					<a-entity light="type: directional; intensity: 1.2" position="-1 2 2"></a-entity>
					<a-entity camera="fov: ${RealidadAumentadaIU.FOV}" position="0 0 0" look-controls="enabled: false" wasd-controls="enabled: false"></a-entity>
					<a-entity class="ar-ancla" visible="false">
						<a-entity animation="property: rotation; from: 0 0 0; to: 0 360 0; loop: true; dur: 9000; easing: linear">
							<a-box class="ar-caja" width="0.5" height="0.5" depth="0.5" material="roughness: 0.35; metalness: 0.1"></a-box>
						</a-entity>
						<a-ring radius-inner="0.36" radius-outer="0.4" rotation="-90 0 0" position="0 -0.34 0" material="shader: flat; transparent: true; opacity: 0.85"></a-ring>
						<a-plane class="ar-etiqueta" width="0.9" height="0.45" position="0 0.68 0" material="shader: flat; transparent: true"></a-plane>
					</a-entity>
				</a-scene>`;

			this.escena = DOM.uno("a-scene", capa);
			this.ancla = DOM.uno(".ar-ancla", capa);

			const listo = () => this.pintarProducto();
			if (this.escena.hasLoaded) { listo(); } else { this.escena.addEventListener("loaded", listo, { once: true }); }
		}

		tonoDe(producto) {
			const campo = this.app.entidades.productos.campos.find((c) => c.nombre === "categoria");
			return campo?.colores?.[producto.categoria] ?? Utilidades.hashTexto(producto.categoria || "") % 360;
		}

		/** Las caras de la caja y la etiqueta son lienzos 2D usados como textura (admiten tildes y emojis) */
		pintarProducto() {
			const producto = this.producto;
			if (!producto || !this.escena?.hasLoaded) { return; }

			const tono = this.tonoDe(producto);
			const caja = DOM.uno(".ar-caja", this.escena).getObject3D("mesh");
			const etiqueta = DOM.uno(".ar-etiqueta", this.escena).getObject3D("mesh");
			if (!caja || !etiqueta) { return; }

			this.aplicarTextura(caja, this.dibujarCara(producto, tono));
			this.aplicarTextura(etiqueta, this.dibujarEtiqueta(producto, tono));
			DOM.uno("a-ring", this.escena).setAttribute("material", "color", `hsl(${tono}, 85%, 62%)`);
		}

		aplicarTextura(malla, lienzo) {
			const THREE = window.AFRAME.THREE;
			const textura = new THREE.CanvasTexture(lienzo);
			textura.colorSpace = THREE.SRGBColorSpace;
			malla.material.map?.dispose();
			malla.material.map = textura;
			malla.material.color.set("#ffffff");
			malla.material.needsUpdate = true;
		}

		dibujarCara(producto, tono) {
			const lienzo = document.createElement("canvas");
			lienzo.width = lienzo.height = 256;
			const ctx = lienzo.getContext("2d");
			const degradado = ctx.createLinearGradient(0, 0, 256, 256);

			degradado.addColorStop(0, `hsl(${tono}, 90%, 68%)`);
			degradado.addColorStop(1, `hsl(${tono - 40}, 80%, 45%)`);
			ctx.fillStyle = degradado;
			ctx.fillRect(0, 0, 256, 256);
			ctx.strokeStyle = "rgba(255,255,255,.6)";
			ctx.lineWidth = 10;
			ctx.strokeRect(5, 5, 246, 246);
			ctx.font = "120px serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(RealidadAumentadaIU.EMOJIS[producto.categoria] || "📦", 128, 138);
			return lienzo;
		}

		dibujarEtiqueta(producto, tono) {
			const lienzo = document.createElement("canvas");
			lienzo.width = 512;
			lienzo.height = 256;
			const ctx = lienzo.getContext("2d");
			const fuente = '"DM Sans", system-ui, sans-serif';

			ctx.fillStyle = "rgba(25, 10, 22, .78)";
			ctx.strokeStyle = `hsl(${tono}, 85%, 65%)`;
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.roundRect(4, 4, 504, 248, 36);
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = "#fff";
			ctx.font = `700 40px ${fuente}`;
			ctx.fillText(producto.nombre.length > 22 ? `${producto.nombre.slice(0, 21)}…` : producto.nombre, 30, 70);

			ctx.fillStyle = "rgba(255,255,255,.7)";
			ctx.font = `400 26px ${fuente}`;
			ctx.fillText(`${producto.categoria} · ${producto.fabricante || ""}`, 30, 112);

			ctx.fillStyle = `hsl(${tono}, 90%, 72%)`;
			ctx.font = `700 54px ${fuente}`;
			ctx.fillText(moneda(producto.precio), 30, 190);

			const pocas = Number(producto.stock) < 5;
			ctx.fillStyle = pocas ? "hsl(355, 85%, 68%)" : "hsl(150, 60%, 62%)";
			ctx.font = `700 26px ${fuente}`;
			ctx.textAlign = "right";
			ctx.fillText(`${producto.stock} en stock`, 482, 190);
			return lienzo;
		}

		procesar(datos) {
			const objeto = this.ancla?.object3D;
			if (!this.activa || !objeto || !this.marco?.isConnected) { return; }

			if (!datos.mano) {
				// Unos fotogramas de margen: MediaPipe pierde la mano a ratos
				if (++this.perdida > 8) {
					objeto.visible = false;
					this.suave = null;
					this.mostrarAyuda("✋ Abre la mano delante de la cámara");
				}
				return;
			}
			this.perdida = 0;

			const mano = new ManoIU(datos.mano);
			const postura = mano.postura;

			// Pellizco = siguiente producto (una vez por pellizco)
			const pinza = mano.pinza;
			if (!this.pinza && pinza < 0.3) {
				this.pinza = true;
				this.natural.anunciarGesto("pinza", this.cambiar(1));
			} else if (this.pinza && pinza > 0.45) {
				this.pinza = false;
			}

			// Con el puño cerrado «guardas» el producto
			objeto.visible = postura !== "puno";
			if (postura === "puno") {
				this.mostrarAyuda("✊ Producto guardado · abre la mano");
				return;
			}
			this.mostrarAyuda("");

			// De coordenadas de la imagen (0–1) a píxeles del marco: el vídeo está espejado y recortado con object-fit: cover
			const { clientWidth: ancho, clientHeight: alto } = this.marco;
			const escala = Math.max(ancho / datos.ancho, alto / datos.alto);
			const desfaseX = (ancho - datos.ancho * escala) / 2;
			const desfaseY = (alto - datos.alto * escala) / 2;
			const aPantalla = (p) => ({ x: ancho - (desfaseX + p.x * datos.ancho * escala), y: desfaseY + p.y * datos.alto * escala });

			const centro = aPantalla(mano.centro([0, 5, 9, 13, 17]));
			const muneca = aPantalla(mano.punto(0));
			const nudillo = aPantalla(mano.punto(9));
			const palma = Math.hypot(nudillo.x - muneca.x, nudillo.y - muneca.y);

			// De píxeles a coordenadas 3D: lo que se ve a DISTANCIA metros de la cámara con ese campo de visión
			const mitadAlto = RealidadAumentadaIU.DISTANCIA * Math.tan((RealidadAumentadaIU.FOV / 2) * Math.PI / 180);
			const mitadAncho = mitadAlto * (ancho / alto);
			const objetivo = {
				x: (centro.x / ancho * 2 - 1) * mitadAncho,
				y: (1 - centro.y / alto * 2) * mitadAlto,
				tamano: limitar((palma / alto) * 2 * mitadAlto * 2.4, 0.2, 3),
				giro: Math.atan2(nudillo.x - muneca.x, muneca.y - nudillo.y)
			};

			// Suavizado para que el objeto no tiemble
			this.suave ??= { ...objetivo };
			Object.keys(objetivo).forEach((clave) => { this.suave[clave] += (objetivo[clave] - this.suave[clave]) * 0.4; });

			objeto.position.set(this.suave.x, this.suave.y, -RealidadAumentadaIU.DISTANCIA);
			objeto.scale.setScalar(this.suave.tamano);
			objeto.rotation.z = -this.suave.giro;
		}

		cambiar(paso) {
			if (!this.productos().length) { return "No hay productos."; }
			this.indice += paso;
			this.pintarProducto();
			this.pintarTitulo();
			const producto = this.producto;
			return `${producto.nombre} · ${moneda(producto.precio)}`;
		}

		mostrar(id) {
			const posicion = this.productos().findIndex((p) => p.id === id);
			if (posicion < 0) { return "Ese producto no está en el catálogo."; }
			this.indice = posicion;
			this.pintarProducto();
			this.pintarTitulo();
			return `Te enseño ${this.producto.nombre}.`;
		}

		mostrarAyuda(texto) {
			if (!this.ayuda || this.ayuda.textContent === texto) { return; }
			this.ayuda.textContent = texto;
			this.ayuda.hidden = !texto;
		}

		/** Foto de la imagen real + la escena 3D, para la memoria */
		capturar() {
			if (!this.activa || !this.escena) {
				this.app.toast.aviso("Sin imagen", "Activa la cámara para hacer una captura.");
				return;
			}

			const { clientWidth: ancho, clientHeight: alto } = this.marco;
			const lienzo = document.createElement("canvas");
			lienzo.width = ancho;
			lienzo.height = alto;
			const ctx = lienzo.getContext("2d");
			const video = this.video;
			const escala = Math.max(ancho / video.videoWidth, alto / video.videoHeight);

			// 1. La webcam, espejada y recortada igual que en pantalla
			ctx.save();
			ctx.translate(ancho, 0);
			ctx.scale(-1, 1);
			ctx.drawImage(video, (ancho - video.videoWidth * escala) / 2, (alto - video.videoHeight * escala) / 2, video.videoWidth * escala, video.videoHeight * escala);
			ctx.restore();

			// 2. La escena 3D: se dibuja justo antes de copiarla, porque WebGL borra el lienzo tras cada fotograma
			this.escena.renderer.render(this.escena.object3D, this.escena.camera);
			ctx.drawImage(this.escena.canvas, 0, 0, ancho, alto);

			lienzo.toBlob((imagen) => {
				Utilidades.descargar(`serena-iu-ar-${Date.now()}.png`, imagen, "image/png");
				this.app.toast.exito("Captura guardada", "Ya la puedes usar en la memoria.");
			}, "image/png");
		}

		detener() {
			this.activa = false;
			this.suave = null;
			this.natural.gestos.pausado = false;
			if (this.video) { this.video.srcObject = null; }

			// Liberar el contexto WebGL: el navegador solo permite unos pocos a la vez
			const escena = this.escena;
			escena?.remove();
			try {
				escena?.renderer?.forceContextLoss();
				escena?.renderer?.dispose();
			} catch (error) { /* la escena ya estaba liberada */ }

			this.escena = this.ancla = null;
		}
	}

	/* =========================================================
	   NATURAL: une todas las piezas y las conecta con la app
	   ========================================================= */
	class NaturalIU {
		constructor(app) {
			this.app = app;
			this.ajustes = AjustesNaturales.leer();
			this.config = { comandos: [], gestos: [] };
			this.voz = new VozIU();
			this.vision = new VisionIU();
			this.camara = new VentanaCamaraIU(() => this.desactivarCamara());
			this.gestos = new GestosIU(this);
			this.cabeza = new CabezaIU(this);
			this.ollama = new OllamaIU();
			this.interprete = new InterpreteIU(this);
			this.dictado = new DictadoIU(this);
			this.asistente = new AsistenteIU(this);
			this.ar = new RealidadAumentadaIU(this);
			this.privado = false;
			this.esperandoOrden = 0;

			this.listo = fetch("data/natural.json")
				.then((respuesta) => respuesta.json())
				.then((config) => { this.config = config; })
				.catch(() => { /* la app funciona sin las tablas de ayuda */ });

			this.conectarVoz();
			this.activarControles();
		}

		guardarAjustes(cambios) {
			this.ajustes = AjustesNaturales.guardar(cambios);
		}

		/* ---------- Controles de la cabecera y teclado ---------- */
		activarControles() {
			DOM.uno("#botonVoz")?.addEventListener("click", () => this.escucharFrase());
			DOM.uno("#botonGestos")?.addEventListener("click", () => this.alternarCamara());
			DOM.uno("#botonAsistente")?.addEventListener("click", () => this.asistente.alternar());

			if (!this.voz.disponible) {
				const boton = DOM.uno("#botonVoz");
				if (boton) { boton.title = "Tu navegador no tiene reconocimiento de voz (usa Chrome o Edge)"; }
			}

			document.addEventListener("keydown", (evento) => {
				const escribiendo = evento.target.closest("input,textarea,select,[contenteditable]");
				if (escribiendo || document.querySelector("dialog[open]") || evento.ctrlKey || evento.metaKey || evento.altKey) { return; }

				const tecla = evento.key.toLowerCase();
				if (tecla === "v") { evento.preventDefault(); this.escucharFrase(); }
				if (tecla === "g") { evento.preventDefault(); this.alternarCamara(); }
				if (tecla === "a") { evento.preventDefault(); this.asistente.alternar(); }
			});
		}

		marcarBoton(selector, activo) {
			const boton = DOM.uno(selector);
			boton?.setAttribute("aria-pressed", String(activo));
			boton?.classList.toggle("activo", activo);
		}

		/** Entradas para la paleta de comandos (Ctrl + K) */
		comandosPaleta() {
			return [
				{ grupo: "Natural", emoji: "🎤", texto: "Dar una orden por voz", ejecutar: () => this.escucharFrase() },
				{ grupo: "Natural", emoji: "👂", texto: "Manos libres: escuchar siempre", ejecutar: () => this.manosLibres(true) },
				{ grupo: "Natural", emoji: "🖐️", texto: "Activar o desactivar los gestos con la cámara", ejecutar: () => this.alternarCamara() },
				{ grupo: "Natural", emoji: "✦", texto: "Abrir el asistente", ejecutar: () => this.asistente.abrir() }
			];
		}

		/* ---------- Voz ---------- */
		conectarVoz() {
			this.voz.alTexto = (texto, final) => {
				this.reflejarTranscripcion(texto, final);

				if (!final) {
					this.asistente.mostrarEstado(`«${texto}…»`, "escuchando");
					return;
				}

				// En manos libres solo se obedecen las frases que empiezan por la palabra clave
				if (this.voz.continuo) {
					const limpio = TextoNatural.limpiar(texto);
					const clave = TextoNatural.limpiar(this.ajustes.palabraClave);
					const conClave = clave && (limpio === clave || limpio.startsWith(`${clave} `));

					if (!conClave && performance.now() > this.esperandoOrden) { return; }
					if (limpio === clave) {
						this.esperandoOrden = performance.now() + 6000;
						this.responder("¿Sí?");
						return;
					}
					this.esperandoOrden = 0;
				}

				this.procesar(texto, "🎤 voz");
			};

			this.voz.alCambio = () => this.reflejarVoz();

			this.voz.alError = (error) => {
				const mensajes = {
					"not-allowed": "El navegador no deja usar el micrófono.",
					"audio-capture": "No se encuentra ningún micrófono.",
					network: "El reconocimiento de voz necesita conexión a internet.",
					"no-speech": "No he oído nada."
				};
				if (error === "aborted" || (error === "no-speech" && this.voz.continuo)) { return; }
				this.asistente.abrir();
				this.asistente.mostrarEstado(mensajes[error] || `Error de voz: ${error}`);
			};

			// Las voces del sistema llegan tarde en Chrome
			if (this.voz.sintesis) {
				speechSynthesis.addEventListener("voiceschanged", () => {
					this.rellenarVoces();
				});
			}
		}

		escucharFrase() {
			if (!this.voz.disponible) {
				this.app.toast.error("Sin reconocimiento de voz", "Este navegador no lo admite. Prueba con Chrome o Edge.");
				return;
			}
			if (this.voz.escuchando && !this.voz.continuo) {
				this.voz.detener();
				return;
			}
			this.voz.callar();
			this.asistente.abrir();
			this.voz.escuchar({ continuo: false });
		}

		manosLibres(activar) {
			if (!activar) {
				this.voz.detener();
				return "He dejado de escuchar.";
			}
			if (!this.voz.disponible) { return "Este navegador no tiene reconocimiento de voz."; }

			this.asistente.abrir();
			this.voz.escuchar({ continuo: true });
			return `Te escucho. Empieza tus órdenes con «${capitalizar(this.ajustes.palabraClave)}».`;
		}

		reflejarVoz() {
			const escuchando = this.voz.escuchando || this.voz.continuo;
			const clave = capitalizar(this.ajustes.palabraClave);
			const boton = DOM.uno("#botonVoz");

			boton?.classList.toggle("escuchando", escuchando);
			boton?.setAttribute("aria-pressed", String(escuchando));
			DOM.uno("[data-accion=manos-libres]")?.setAttribute("aria-pressed", String(this.voz.continuo));

			if (this.voz.hablando) { this.asistente.mostrarEstado("Hablando…", "hablando"); }
			else if (this.voz.continuo) { this.asistente.mostrarEstado(`Manos libres · di «${clave}, …»`, "escuchando"); }
			else if (this.voz.escuchando) { this.asistente.mostrarEstado("Escuchando…", "escuchando"); }
			else { this.asistente.mostrarEstado("Escribe o pulsa el micrófono"); }
		}

		reflejarTranscripcion(texto, final) {
			const caja = DOM.uno(".transcripcion-texto");
			if (!caja) { return; }
			caja.textContent = texto;
			caja.classList.toggle("provisional", !final);
		}

		responder(texto, origen = "") {
			if (!texto) { return; }
			this.asistente.decir(texto, "serena", origen);
			if (this.ajustes.hablar) { this.voz.hablar(texto, this.ajustes); }
		}

		/* ---------- De la frase a la acción ---------- */
		async procesar(texto, origen = "⌨️ texto") {
			texto = String(texto || "").trim();
			if (!texto) { return; }

			this.asistente.abrir();
			this.asistente.decir(texto, "usuario", origen);

			let orden = this.interprete.interpretar(texto);

			if (!orden && this.ajustes.usarIA) {
				this.asistente.mostrarEstado("Pensando con el modelo local…", "pensando");
				try {
					orden = await this.interprete.preguntarIA(texto);
				} catch (error) {
					console.warn(error);
					orden = { accion: "responder", respuesta: "No te he entendido y el modelo local (Ollama) no responde. Di «ayuda» para ver lo que sé hacer." };
				}
				this.reflejarVoz();
			}

			orden ??= { accion: "responder", respuesta: "No te he entendido. Di «ayuda» para ver ejemplos." };

			let resultado;
			try {
				resultado = this.ejecutar(orden);
			} catch (error) {
				console.error(error);
				resultado = "Algo ha fallado al hacerlo.";
			}

			this.responder(orden.respuestaIA || resultado, orden.ia ? "✦ IA local" : "");
		}

		ejecutar(orden) {
			const app = this.app;
			const acciones = {
				ayuda: () => {
					Enrutador.ir("inicio", "atajos");
					return "Aquí tienes lo que puedes decir. Por ejemplo: «pedidos pendientes», «nuevo cliente nombre Laura…» o «¿qué cliente factura más?».";
				},
				dictar: (o) => this.dictado.rellenar(o.original, o.plano),
				ar: (o) => {
					this.ar.abrir(o.id);
					const producto = o.id && app.entidades.productos.buscar(o.id);
					return producto ? `Te enseño ${producto.nombre}. Abre la mano delante de la cámara.` : "Abre la mano delante de la cámara para ver los productos.";
				},
				dialogo: (o) => this.responderDialogo(o.aceptar),
				cerrar: () => this.cerrarOVolver(),
				guardar: () => this.guardar(),
				paginar: (o) => this.siguiente(o.paso),
				gestos: (o) => {
					if (o.activar) { this.activarCamara(); return "Activo la cámara para los gestos."; }
					this.desactivarCamara();
					return "Gestos desactivados.";
				},
				escucha: (o) => this.manosLibres(o.activar),
				callar: () => { this.voz.callar(); return ""; },
				paleta: () => { app.paleta.abrir(); return "Abro la paleta de comandos."; },
				tema: (o) => this.cambiarTema(o),
				producto: (o) => this.ar.mostrar(o.id),
				resumen: () => this.resumen(),
				ventas: () => this.ventas(),
				contar: (o) => this.contar(o),
				extremo: (o) => this.extremo(o),
				nuevo: (o) => {
					const entidad = app.entidades[o.entidad];
					const titulo = `${capitalizar(entidad.singular)} nuevo.`;

					// «Nuevo cliente nombre Laura…»: cuando el formulario esté pintado, se dicta el resto
					if (o.dictado) {
						this.navegar(entidad.id, "nuevo", () => this.responder(`${titulo} ${this.dictado.rellenar(o.dictado.original, o.dictado.plano, false)}`));
						return "";
					}
					this.navegar(entidad.id, "nuevo");
					return `${titulo} Dicta los campos, por ejemplo «nombre …», y después «guardar».`;
				},
				abrir: (o) => this.abrirRegistro(o),
				buscar: (o) => this.buscar(o),
				ir: (o) => this.ir(o),
				responder: (o) => o.respuesta
			};

			return (acciones[orden.accion] || acciones.responder)(orden);
		}

		/** Navega y, cuando la vista ya está pintada, ejecuta «despues» */
		navegar(modulo, vista, despues) {
			const ruta = Enrutador.ruta(modulo, vista);

			if (location.hash === ruta) {
				this.app.pintarActual();
				despues?.();
				return;
			}
			// Si hay cambios sin guardar, la aplicación pregunta antes de salir: se espera a que la vista
			// nueva esté pintada de verdad, y si el usuario decide quedarse, «despues» no se ejecuta
			if (despues) {
				const inicio = Date.now();
				const comprobar = () => {
					if (this.app.estado.rutaActual === ruta) { despues(); return; }
					if (location.hash === ruta && Date.now() - inicio < 30000) { setTimeout(comprobar, 100); }
				};
				setTimeout(comprobar, 0);
			}
			location.hash = ruta;
		}

		ir({ modulo, vista, filtroRapido }) {
			const app = this.app;
			const destino = app.modulo(modulo);
			if (!destino) { return "No conozco esa sección."; }

			const entidad = app.entidades[modulo];
			const vistaElegida = app.vistasDe(destino).find((v) => v.id === vista);

			if (entidad && filtroRapido !== undefined) {
				const estado = app.tabla.estadoDe(entidad);
				estado.filtroCampo = filtroRapido;
				estado.pagina = 1;
			}

			this.navegar(modulo, vistaElegida?.id || "");

			if (entidad && filtroRapido) {
				const total = app.tabla.filtrarYOrdenar(entidad).length;
				return `${total} ${total === 1 ? entidad.singular : entidad.titulo.toLowerCase()} con «${filtroRapido}».`;
			}
			return `Abro ${destino.texto}${vistaElegida ? ` › ${vistaElegida.texto}` : ""}.`;
		}

		abrirRegistro({ entidad: id, id: registroId, editar }) {
			const entidad = this.app.entidades[id];
			const registro = entidad.buscar(registroId);
			const nombre = `${capitalizar(entidad.singular)} ${entidad.textoRegistro(registro)}`;

			if (editar) {
				Enrutador.ir(entidad.id, "editar", registro.id);
				return `Editando: ${nombre}.`;
			}
			this.navegar(entidad.id, "listado", () => this.app.detalle.abrir(entidad, registro));
			return `${nombre}.`;
		}

		buscar({ entidad: id, texto, limpiar }) {
			const entidad = this.app.entidades[id];
			const estado = this.app.tabla.estadoDe(entidad);

			estado.filtro = texto;
			estado.pagina = 1;
			if (limpiar) { estado.filtroCampo = ""; }
			this.navegar(entidad.id, "listado");

			if (limpiar) { return "Filtros quitados."; }
			const total = this.app.tabla.filtrarYOrdenar(entidad).length;
			return total
				? `He encontrado ${total} ${total === 1 ? entidad.singular : entidad.titulo.toLowerCase()} con «${texto}».`
				: `No hay ${entidad.titulo.toLowerCase()} con «${texto}».`;
		}

		contar({ entidad: id, filtros }) {
			const entidad = this.app.entidades[id];
			const total = entidad.todos().filter((r) => filtros.every((f) => r[f.campo] === f.valor)).length;

			// Si el filtro es el rápido del listado, además se enseña
			const rapido = filtros.find((f) => f.campo === entidad.esquema.filtroRapido);
			if (rapido && filtros.length === 1) { this.ir({ modulo: entidad.id, vista: "listado", filtroRapido: rapido.valor }); }

			const partes = filtros.map((f) => {
				const campo = entidad.campos.find((c) => c.nombre === f.campo);
				return campo.tipo === "checkbox" ? `«${campo.etiqueta}: ${f.valor ? "sí" : "no"}»` : `${campo.etiqueta.toLowerCase()} «${f.valor}»`;
			});

			const nombre = total === 1 ? entidad.singular : entidad.titulo.toLowerCase();
			return `Hay ${total} ${nombre}${partes.length ? ` con ${enumerar(partes)}` : ""}.`;
		}

		extremo({ entidad: id, campo: nombre, sentido, adjetivo }) {
			const entidad = this.app.entidades[id];
			const campo = entidad.campos.find((c) => c.nombre === nombre);
			const registro = entidad.todos()
				.filter((r) => r[nombre] !== undefined && r[nombre] !== "")
				.sort((a, b) => (Number(b[nombre]) - Number(a[nombre])) * sentido)[0];

			if (!registro) { return `No hay ${entidad.titulo.toLowerCase()} con ${campo.etiqueta.toLowerCase()}.`; }

			this.navegar(entidad.id, "listado", () => this.app.detalle.abrir(entidad, registro));
			const valor = Utilidades.formatear(registro[nombre], campo);
			const cual = adjetivo || `con ${sentido > 0 ? "más" : "menos"} ${campo.etiqueta.toLowerCase()}`;
			return `${capitalizar(entidad.singular)} ${cual}: ${entidad.textoRegistro(registro)} (${valor}).`;
		}

		resumen() {
			const app = this.app;
			const partes = Object.values(app.entidades).map((e) => `${e.todos().length} ${e.titulo.toLowerCase()}`);
			let texto = `Tienes ${enumerar(partes)}.`;

			const pedidos = app.entidades.pedidos;
			if (pedidos) {
				const pendientes = pedidos.todos().filter((p) => p.estado === "Pendiente").length;
				texto += ` ${this.ventas()} Hay ${pendientes} ${pendientes === 1 ? "pedido pendiente" : "pedidos pendientes"}.`;
			}

			const productos = app.entidades.productos;
			const pocos = productos?.todos().filter((p) => !p.descatalogado && Number(p.stock) < 5) || [];
			if (pocos.length) { texto += ` Ojo: ${enumerar(pocos.map((p) => p.nombre))} ${pocos.length === 1 ? "tiene" : "tienen"} poco stock.`; }

			return texto;
		}

		ventas() {
			const pedidos = this.app.entidades.pedidos;
			if (!pedidos) { return "No hay pedidos."; }
			const validos = pedidos.todos().filter((p) => p.estado !== "Cancelado");
			const total = validos.reduce((suma, p) => suma + (Number(p.total) || 0), 0);
			return `Llevas ${moneda(total)} vendidos en ${validos.length} pedidos.`;
		}

		cambiarTema({ modo, tono, nombre }) {
			const app = this.app;
			if (modo) { TemaIU.aplicar({ modo }); }
			if (tono !== undefined) { TemaIU.aplicar({ tono }); }
			app.actualizarBotonModo();

			const { modulo, vista } = Enrutador.leer();
			if (modulo === "ajustes" && vista === "apariencia") { app.pintarActual(); }
			return modo ? `Modo ${modo} activado.` : `Color cambiado a ${nombre}.`;
		}

		/** Siguiente/anterior: en un listado cambia de página; si no, de vista; en AR, de producto */
		siguiente(paso) {
			if (this.ar.activa) { return this.ar.cambiar(paso); }

			const app = this.app;
			const { modulo, vista } = Enrutador.leer();
			const entidad = app.entidades[modulo];

			if (entidad && (!vista || vista === "listado") && app.contenedorTabla?.isConnected) {
				const estado = app.tabla.estadoDe(entidad);
				const paginas = Math.max(1, Math.ceil(app.tabla.filtrarYOrdenar(entidad).length / app.tabla.porPagina));

				if (paginas > 1) {
					const nueva = limitar(estado.pagina + paso, 1, paginas);
					if (nueva === estado.pagina) { return paso > 0 ? "Ya estás en la última página." : "Ya estás en la primera página."; }
					estado.pagina = nueva;
					app.tabla.pintar(entidad, app.contenedorTabla);
					return `Página ${nueva} de ${paginas}.`;
				}
			}

			const actual = app.modulo(modulo) || app.modulo("inicio");
			const vistas = app.vistasDe(actual);
			if (!vistas.length) { return ""; }

			const posicion = Math.max(0, vistas.findIndex((v) => v.id === (vista === "editar" ? "listado" : vista || vistas[0].id)));
			const nueva = vistas[(posicion + paso + vistas.length) % vistas.length];
			Enrutador.ir(actual.id, nueva.id);
			return nueva.texto;
		}

		/** Lo mismo que la tecla Escape, pero también cierra diálogos y fichas */
		cerrarOVolver() {
			if (this.ar.capa) { this.ar.cerrar(); return "Realidad aumentada cerrada."; }
			const paleta = DOM.uno("dialog.paleta[open]");
			if (paleta) { paleta.close(); return "Paleta cerrada."; }
			if (DOM.uno("dialog.dialogo[open]")) { return this.responderDialogo(false); }
			if (DOM.uno(".detalle-capa.abierta")) { this.app.detalle.cerrar(); return "Ficha cerrada."; }

			const { modulo, vista } = Enrutador.leer();
			if (this.app.entidades[modulo] && vista && vista !== "listado") {
				Enrutador.ir(modulo, "listado");
				return "Vuelvo al listado.";
			}
			if (this.asistente.abierto) { this.asistente.cerrar(); return "Asistente cerrado."; }
			return "No hay nada que cerrar.";
		}

		responderDialogo(aceptar) {
			const dialogo = DOM.uno("dialog.dialogo[open]");
			if (!dialogo) { return "No hay ninguna pregunta pendiente."; }
			DOM.uno(`[data-accion=${aceptar ? "aceptar" : "cancelar"}]`, dialogo).click();
			return aceptar ? "Sí." : "No.";
		}

		/** Pulgar arriba: acepta el diálogo o, si no hay, guarda el formulario */
		aceptar() {
			return DOM.uno("dialog.dialogo[open]") ? this.responderDialogo(true) : this.guardar();
		}

		guardar() {
			const formulario = DOM.uno("#escenario form.tarjeta");
			if (!formulario) { return "No hay ningún formulario abierto."; }
			formulario.requestSubmit();
			return "Guardando.";
		}

		/* ---------- Cámara ---------- */
		alternarCamara() {
			this.vision.activa ? this.desactivarCamara() : this.activarCamara();
		}

		/** Devuelve true si la cámara queda encendida */
		async activarCamara() {
			if (this.vision.activa) { return true; }
			if (this.vision.cargando) { return false; }
			if (!navigator.mediaDevices?.getUserMedia) {
				this.app.toast.error("Sin cámara", "El navegador solo permite la cámara en https o en localhost.");
				return false;
			}

			this.camara.crear();
			this.camara.mostrarEstado("Cargando MediaPipe…");
			this.marcarBoton("#botonGestos", true);

			try {
				await this.vision.iniciar(this.camara.video);
				this.quitarOyente = this.vision.escuchar((datos) => this.alFotograma(datos));
				this.camara.mostrarEstado("Manos y cara activas");
				if (!this.ar.capa) { this.app.toast.exito("Gestos activados", "Pellizca para hacer clic. Palma abierta y quieta para cerrar."); }
				this.refrescarVista();
				return true;
			} catch (error) {
				console.error(error);
				this.desactivarCamara();
				const permiso = error.name === "NotAllowedError";
				this.app.toast.error("No se pudo activar la cámara", permiso ? "Has denegado el permiso de la cámara." : error.message);
				return false;
			}
		}

		desactivarCamara() {
			this.ar.cerrar();
			this.quitarOyente?.();
			this.quitarOyente = null;
			this.vision.detener();
			this.gestos.soltar();
			this.camara.quitar();
			this.privacidad(false);
			this.marcarBoton("#botonGestos", false);
			this.refrescarVista();
		}

		alFotograma(datos) {
			this.camara.dibujar(datos);
			this.gestos.procesar(datos);
			this.cabeza.procesar(datos);
			this.ar.procesar(datos);
		}

		anunciarGesto(id, resultado = "") {
			const gesto = this.config.gestos.find((g) => g.id === id);
			this.camara.mostrarGesto(`${gesto?.emoji || "🖐️"} ${resultado || gesto?.nombre || id}`);

			DOM.todos("[data-gesto]").forEach((fila) => fila.classList.toggle("detectado", fila.dataset.gesto === id));
			clearTimeout(this.temporizadorGesto);
			this.temporizadorGesto = setTimeout(() => DOM.todos("[data-gesto].detectado").forEach((fila) => fila.classList.remove("detectado")), 1400);
		}

		privacidad(activar) {
			if (activar === this.privado) { return; }
			this.privado = activar;
			document.body.classList.toggle("natural-privado", activar);

			if (activar) {
				const velo = document.createElement("div");
				velo.className = "velo-privacidad";
				velo.innerHTML = "<span>🙈</span><strong>Datos ocultos</strong><p>No hay nadie delante de la cámara. Vuelve para seguir.</p>";
				document.body.appendChild(velo);
				this.anunciarGesto("ausente");
			} else {
				DOM.uno(".velo-privacidad")?.remove();
			}
		}

		/* ---------- Enganches con la aplicación ---------- */
		alSalirDeVista() {
			this.ar.cerrar();
		}

		/** Si se están viendo los ajustes de voz y gestos, se repintan para reflejar el estado */
		refrescarVista() {
			const { modulo, vista } = Enrutador.leer();
			if (modulo === "ajustes" && vista === "natural" && !this.ar.capa) { this.app.pintarActual(); }
		}

		/** Formularios de datos: botón «Dictar» y una pista con sus propios campos */
		prepararFormulario(formulario, entidad) {
			this.dictado.preparar(formulario, entidad);
		}

		/** Ficha de detalle: si el esquema lo permite, «Ver en tu mano» */
		accionesDetalle(entidad, registro, pie) {
			this.ficha = { entidad: entidad.id, id: registro.id };
			if (!entidad.esquema.realidadAumentada) { return; }

			const boton = document.createElement("button");
			boton.type = "button";
			boton.className = "boton";
			boton.textContent = "🪄 Ver en tu mano";
			boton.title = "Ver el producto en 3D sobre tu mano (realidad aumentada)";
			boton.addEventListener("click", () => this.ar.abrir(registro.id));
			pie.appendChild(boton);
		}

		/** Registro de la ficha abierta, si es de esa entidad */
		fichaAbierta(entidadId) {
			if (!DOM.uno(".detalle-capa.abierta") || this.ficha?.entidad !== entidadId) { return null; }
			return this.app.entidades[entidadId]?.buscar(this.ficha.id) || null;
		}

		/** Panel de inicio: el resumen del día, en voz alta */
		leerResumen() {
			const texto = this.resumen();
			this.asistente.abrir();
			this.asistente.decir(texto, "serena");
			this.voz.hablar(texto, this.ajustes);
		}

		/** Tabla sencilla a partir de una lista de filas de texto */
		tabla(cabeceras, filas) {
			const contenedor = document.createElement("div");
			contenedor.className = "contenedor-tabla";
			contenedor.innerHTML = `<table><thead><tr>${cabeceras.map(() => "<th></th>").join("")}</tr></thead><tbody></tbody></table>`;
			DOM.todos("th", contenedor).forEach((th, i) => { th.textContent = cabeceras[i]; });

			filas.forEach((celdas) => {
				const fila = document.createElement("tr");
				celdas.forEach((celda) => {
					const td = document.createElement("td");
					celda instanceof Node ? td.appendChild(celda) : (td.textContent = celda);
					fila.appendChild(td);
				});
				DOM.uno("tbody", contenedor).appendChild(fila);
			});

			return contenedor;
		}

		/** Inicio › Ayuda y atajos: lo que se puede decir y los gestos, debajo de los atajos de teclado */
		async ayuda(escenario) {
			await this.listo;
			if (!escenario.isConnected) { return; }

			const voz = this.app.tarjeta("Con la voz", "<p>Pulsa 🎤 (o la tecla <kbd>V</kbd>) y habla. Pulsa un ejemplo para probarlo sin hablar.</p>");
			voz.appendChild(this.tabla(["Para", "Ejemplos", "Qué hace"], this.config.comandos.map((comando) => {
				const ejemplos = document.createElement("div");
				ejemplos.className = "fila-botones";
				comando.ejemplos.forEach((ejemplo) => {
					const boton = document.createElement("button");
					boton.type = "button";
					boton.className = "boton pequeno ejemplo";
					boton.textContent = ejemplo;
					boton.addEventListener("click", () => this.procesar(ejemplo, "👆 ejemplo"));
					ejemplos.appendChild(boton);
				});
				return [comando.grupo, ejemplos, comando.descripcion];
			})));

			const gestos = this.app.tarjeta("Con las manos y la cabeza", "<p>Pulsa 🖐️ (o la tecla <kbd>G</kbd>) para encender la cámara. La fila se ilumina cuando se detecta el gesto.</p>");
			gestos.appendChild(this.tabla(["", "Gesto", "Parte del cuerpo", "Acción"], this.config.gestos.map((g) => [g.emoji, g.nombre, g.parte, g.accion])));
			DOM.todos("tbody tr", gestos).forEach((fila, i) => { fila.dataset.gesto = this.config.gestos[i].id; });

			escenario.append(voz, gestos);
		}

		/** Ajustes › Voz y gestos */
		vistaAjustes(escenario) {
			const app = this.app;
			const ajustes = this.ajustes;
			const estado = (ok, texto) => `<p class="estado-texto" data-ok="${ok}">${texto}</p>`;

			const voz = app.tarjeta("🎙️ Voz", `
				${estado(this.voz.disponible, this.voz.disponible ? "Reconocimiento de voz disponible" : "Este navegador no reconoce la voz: usa Chrome o Edge")}
				<div class="fila-botones">
					<button class="boton primario" type="button" data-accion="escuchar">🎤 Probar el micrófono</button>
					<button class="boton" type="button" data-accion="manos-libres" aria-pressed="false">👂 Manos libres</button>
				</div>
				<p class="transcripcion" aria-live="polite"><span class="transcripcion-texto provisional">Aquí aparece lo que voy entendiendo…</span></p>
				<label class="campo"><span>Palabra clave para manos libres</span><input id="palabraClave" type="text" autocomplete="off"></label>
				<label class="campo campo-check"><input id="hablarRespuestas" type="checkbox"><span>Leer las respuestas en voz alta</span></label>
				<label class="campo"><span>Voz</span><select id="vozElegida"></select></label>
				<div class="ajuste"><label for="velocidadVoz">Velocidad <output></output></label><input id="velocidadVoz" type="range" min="0.5" max="2" step="0.1"></div>
				<div class="ajuste"><label for="tonoVoz">Tono <output></output></label><input id="tonoVoz" type="range" min="0" max="2" step="0.1"></div>
				<div class="ajuste"><label for="volumenVoz">Volumen <output></output></label><input id="volumenVoz" type="range" min="0" max="1" step="0.1"></div>
				<button class="boton" type="button" data-accion="probar">🔊 Probar la voz</button>`);

			const camara = app.tarjeta("🖐️ Cámara y gestos", `
				${estado(this.vision.activa, this.vision.activa ? "Cámara encendida · MediaPipe analizando manos y cara" : "Cámara apagada")}
				<p>La imagen se analiza en este navegador con MediaPipe: no se envía a ningún servidor.</p>
				<div class="fila-botones"><button class="boton primario" type="button" data-accion="camara"></button></div>
				<label class="campo campo-check"><input id="gestosCabeza" type="checkbox"><span>Confirmar los diálogos asintiendo o negando con la cabeza</span></label>
				<label class="campo campo-check"><input id="gestosPrivacidad" type="checkbox"><span>Ocultar los datos si me voy de delante de la cámara</span></label>
				<div class="ajuste"><label for="suavizado">Rapidez del cursor <output></output></label><input id="suavizado" type="range" min="0.1" max="0.8" step="0.05"></div>`);

			const ia = app.tarjeta("✦ Asistente", `
				<p class="estado-texto" id="estadoOllama" data-ok="null">Comprobando el modelo local…</p>
				<p>Las órdenes y preguntas habituales las entiende la propia aplicación. Lo demás se lo pregunta a un modelo local de Ollama junto con los datos, y la aplicación comprueba su respuesta antes de hacer nada.</p>
				<label class="campo campo-check"><input id="usarIA" type="checkbox"><span>Preguntar a Ollama lo que no entienda</span></label>
				<label class="campo"><span>Modelo</span><input id="modeloIA" type="text" list="modelosIA" autocomplete="off"><datalist id="modelosIA"></datalist></label>`);

			const rejilla = document.createElement("div");
			rejilla.className = "rejilla";
			rejilla.append(voz, camara, ia);
			escenario.append(app.cabecera("Voz y gestos", "Maneja la aplicación hablando o con la cámara. Lo que puedes decir está en Inicio › Ayuda y atajos.", [
				{ texto: "💡 Ver qué puedo decir", alPulsar: () => Enrutador.ir("inicio", "atajos") }
			]), rejilla);

			// Voz
			DOM.uno("[data-accion=escuchar]", voz).addEventListener("click", () => this.escucharFrase());
			DOM.uno("[data-accion=manos-libres]", voz).addEventListener("click", () => this.responder(this.manosLibres(!this.voz.continuo)));
			DOM.uno("[data-accion=probar]", voz).addEventListener("click", () => this.voz.hablar("Hola, soy serena. Así sonarán mis respuestas.", this.ajustes));

			const clave = DOM.uno("#palabraClave", voz);
			clave.value = ajustes.palabraClave;
			clave.addEventListener("change", () => this.guardarAjustes({ palabraClave: TextoNatural.limpiar(clave.value) || "serena" }));

			[["#hablarRespuestas", "hablar"], ["#usarIA", "usarIA"], ["#gestosCabeza", "cabeza"], ["#gestosPrivacidad", "privacidad"]].forEach(([id, nombre]) => {
				const control = DOM.uno(id, escenario);
				control.checked = ajustes[nombre];
				control.addEventListener("change", () => {
					this.guardarAjustes({ [nombre]: control.checked });
					if (nombre === "privacidad" && !control.checked) { this.privacidad(false); }
				});
			});

			[["#velocidadVoz", "velocidad"], ["#tonoVoz", "tono"], ["#volumenVoz", "volumen"], ["#suavizado", "suavizado"]].forEach(([id, nombre]) => {
				const rango = DOM.uno(id, escenario);
				const salida = DOM.uno("output", rango.closest(".ajuste"));
				rango.value = ajustes[nombre];
				salida.textContent = rango.value;
				rango.addEventListener("input", () => {
					salida.textContent = rango.value;
					this.guardarAjustes({ [nombre]: Number(rango.value) });
				});
			});

			DOM.uno("#vozElegida", voz).addEventListener("change", (evento) => this.guardarAjustes({ voz: evento.target.value }));
			this.rellenarVoces();

			// Cámara
			const boton = DOM.uno("[data-accion=camara]", camara);
			boton.textContent = this.vision.activa ? "Apagar la cámara" : "📷 Encender la cámara";
			boton.addEventListener("click", () => this.alternarCamara());

			// Asistente
			const modelo = DOM.uno("#modeloIA", ia);
			modelo.value = ajustes.modelo;
			modelo.addEventListener("change", () => this.guardarAjustes({ modelo: modelo.value.trim() || "phi3:mini" }));
			this.comprobarOllama();

			this.reflejarVoz();
		}

		async comprobarOllama() {
			const ok = await this.ollama.comprobar();
			const estado = DOM.uno("#estadoOllama");
			const lista = DOM.uno("#modelosIA");
			if (!estado) { return; }

			estado.dataset.ok = String(ok);
			const via = this.ollama.via === "php" ? "con ollama.php" : "directo a localhost:11434";
			estado.textContent = ok
				? `Modelo local conectado ${via} · usa ${this.ollama.modeloDisponible(this.ajustes.modelo)}`
				: "Ollama no responde: las órdenes habituales funcionan igual; para las preguntas libres arranca «ollama serve».";

			lista.innerHTML = "";
			this.ollama.modelos.forEach((nombre) => {
				const opcion = document.createElement("option");
				opcion.value = nombre;
				lista.appendChild(opcion);
			});
		}

		rellenarVoces() {
			const selector = DOM.uno("#vozElegida");
			if (!selector) { return; }

			selector.innerHTML = '<option value="">La del sistema (es-ES)</option>';
			this.voz.voces().forEach((voz) => {
				const opcion = document.createElement("option");
				opcion.value = voz.name;
				opcion.textContent = `${voz.name} · ${voz.lang}`;
				selector.appendChild(opcion);
			});
			selector.value = this.ajustes.voz;
		}
	}

	Object.assign(window.serena.iu, {
		AjustesNaturales, TextoNatural, ManoIU, VisionIU, VentanaCamaraIU, GestosIU, CabezaIU,
		VozIU, OllamaIU, InterpreteIU, DictadoIU, AsistenteIU, RealidadAumentadaIU, NaturalIU
	});

	// La aplicación ya existe (aplicacion.js se ejecuta antes): se le engancha la capa natural
	document.addEventListener("DOMContentLoaded", () => {
		const app = window.serena.iu.aplicacion;
		if (app) { app.natural = new NaturalIU(app); }
	});
})();
