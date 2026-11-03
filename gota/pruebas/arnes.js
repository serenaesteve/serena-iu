/**
 * Arnés de pruebas mínimo, sin dependencias: se abre en cualquier navegador.
 * Las pruebas se ejecutan de verdad en el navegador, porque un Web Component
 * necesita un DOM real, Shadow DOM y ElementInternals.
 */
window.arnes = (() => {
	const pruebas = [];
	let grupoActual = "";

	class ErrorDePrueba extends Error {}

	const afirmar = {
		igual(actual, esperado, mensaje = "") {
			if (!Object.is(actual, esperado)) {
				throw new ErrorDePrueba(`${mensaje} Esperaba ${JSON.stringify(esperado)} y he obtenido ${JSON.stringify(actual)}.`);
			}
		},
		parecido(actual, esperado, mensaje = "") {
			const a = JSON.stringify(actual);
			const b = JSON.stringify(esperado);
			if (a !== b) { throw new ErrorDePrueba(`${mensaje} Esperaba ${b} y he obtenido ${a}.`); }
		},
		cierto(valor, mensaje = "Debería ser cierto.") {
			if (!valor) { throw new ErrorDePrueba(mensaje); }
		},
		falso(valor, mensaje = "Debería ser falso.") {
			if (valor) { throw new ErrorDePrueba(mensaje); }
		}
	};

	function grupo(nombre, definir) {
		grupoActual = nombre;
		definir();
	}

	// ?grupo=Accesibilidad ejecuta solo los grupos que empiezan así
	const soloGrupo = new URLSearchParams(location.search).get("grupo");

	function prueba(nombre, funcion) {
		if (soloGrupo && !grupoActual.startsWith(soloGrupo)) { return; }
		pruebas.push({ grupo: grupoActual, nombre, funcion });
	}

	/** Pinta un fragmento de HTML en la zona de pruebas y devuelve su primer elemento */
	function montar(html) {
		const zona = document.getElementById("zona");
		zona.innerHTML = html;
		return zona.firstElementChild;
	}

	/** Apunta los eventos que recibe un elemento */
	function escuchar(elemento, ...nombres) {
		const recibidos = [];
		nombres.forEach((nombre) => elemento.addEventListener(nombre, (evento) => {
			recibidos.push({ nombre, detalle: evento.detail ?? null });
		}));
		recibidos.nombres = () => recibidos.map((r) => r.nombre);
		return recibidos;
	}

	/** Pulsa una tecla en un elemento interno, igual que el teclado */
	function tecla(elemento, key) {
		const evento = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true });
		elemento.dispatchEvent(evento);
		return evento;
	}

	/** Escribe como una persona: cambia el valor y lanza el input que lanzaría el navegador */
	function escribir(entrada, texto) {
		entrada.focus();
		entrada.value = texto;
		entrada.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
	}

	const esperar = (ms = 0) => new Promise((resolver) => setTimeout(resolver, ms));

	async function ejecutar() {
		const salida = document.getElementById("resultados");
		const resumen = document.getElementById("resumen");
		const resultados = [];
		const zona = document.getElementById("zona");
		let grupoPintado = null;
		let lista;

		for (const { grupo: nombreGrupo, nombre, funcion } of pruebas) {
			let error = null;
			const inicio = performance.now();
			try {
				await funcion();
			} catch (fallo) {
				error = fallo.message || String(fallo);
			}
			zona.innerHTML = "";
			resultados.push({ grupo: nombreGrupo, nombre, error, ms: Math.round(performance.now() - inicio) });

			if (nombreGrupo !== grupoPintado) {
				grupoPintado = nombreGrupo;
				const titulo = document.createElement("h2");
				titulo.textContent = nombreGrupo;
				lista = document.createElement("ol");
				salida.append(titulo, lista);
			}
			const fila = document.createElement("li");
			fila.className = error ? "mal" : "bien";
			fila.textContent = error ? `${nombre}: ${error}` : nombre;
			lista.append(fila);
		}

		const fallos = resultados.filter((r) => r.error);
		resumen.textContent = fallos.length
			? `${fallos.length} de ${resultados.length} pruebas han fallado`
			: `${resultados.length} pruebas superadas`;
		resumen.className = fallos.length ? "mal" : "bien";
		window.resultadosPruebas = { total: resultados.length, fallos, resultados };
		document.documentElement.dataset.terminado = "si";
	}

	return { afirmar, grupo, prueba, montar, escuchar, tecla, escribir, esperar, ejecutar };
})();
