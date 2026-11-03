/* Accesibilidad: axe-core revisa cada componente, Shadow DOM incluido, con las reglas WCAG 2.2 A y AA.
   Cada escenario se pinta de verdad (visible) con el tema por defecto y con «agua clara»;
   ejecutar.py repite este grupo con el esquema oscuro. */
(() => {
	const { afirmar, grupo, prueba, esperar } = arnes;
	const REGLAS = { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } };
	const TEMAS = { "tema por defecto": "", "tema agua clara": "gota-tema-agua" };

	const ESCENARIOS = [
		["gota-campo vacío y obligatorio", '<label>Correo <gota-campo type="email" name="correo" placeholder="nombre@ejemplo.com" required></gota-campo></label>'],
		["gota-campo con valor no válido", '<label>Correo <gota-campo type="email" value="esto-no"></gota-campo></label>', (e) => e.querySelector("gota-campo").reportValidity()],
		["gota-campo desactivado", '<label>Nombre <gota-campo value="Ada" disabled></gota-campo></label>'],
		["gota-cantidad con moneda y unidad", '<label>Precio <gota-cantidad formato="moneda" min="0" step="0.01" value="749.99"></gota-cantidad></label><label>Stock <gota-cantidad unidad="uds." value="12"></gota-cantidad></label>'],
		["gota-selector cerrado", '<label>País <gota-selector><option value="es">España</option><option value="pt">Portugal</option></gota-selector></label>'],
		["gota-selector abierto con una opción elegida", '<label>País <gota-selector value="pt"><option value="es">España</option><option value="pt">Portugal</option><option value="fr" disabled>Francia</option></gota-selector></label>',
			(e) => e.querySelector("gota-selector").abrir()],
		["gota-fecha con valor", '<label>Entrega <gota-fecha value="2026-11-09"></gota-fecha></label>'],
		["gota-fecha con el calendario abierto", '<label>Entrega <gota-fecha value="2026-11-09"></gota-fecha></label>', (e) => e.querySelector("gota-fecha").abrir()],
		["gota-interruptor activado, apagado y desactivado", '<label>Activo <gota-interruptor checked></gota-interruptor></label><label>Avisos <gota-interruptor></gota-interruptor></label><label>Bloqueado <gota-interruptor disabled></gota-interruptor></label>'],
		["gota-clave con medidor", '<label>Contraseña <gota-clave medidor><input type="password" value="Gota2026!"></gota-clave></label>',
			(e) => e.querySelector("input").dispatchEvent(new Event("input", { bubbles: true }))],
		["gota-clave en claro", '<label>Contraseña <gota-clave visible><input type="password" value="secreta"></gota-clave></label>'],
		["gota-filtros con puntos y cantidades", '<gota-filtros etiqueta="Tipo de cliente"></gota-filtros>', (e) => {
			const filtros = e.querySelector("gota-filtros");
			filtros.opciones = [{ valor: "", texto: "Todos", cantidad: 24 }, { valor: "vip", texto: "VIP", tono: 335, cantidad: 3 }, { valor: "nuevo", texto: "Nuevo", tono: 150, cantidad: 7 }];
			filtros.value = "vip";
		}],
		["gota-paginador en una página intermedia", '<gota-paginador pagina="5" paginas="12"></gota-paginador>'],
		["gota-nivel en sus cuatro estados", ["0", "3", "30", "60"].map((v) => `<gota-nivel value="${v}" max="60" minimo="5" unidad="uds." etiqueta="Stock"></gota-nivel>`).join("")]
	];

	function describir(violaciones) {
		return violaciones.map((v) => {
			const nodos = v.nodes.slice(0, 2).map((n) => n.target.flat().join(" › ")).join("; ");
			return `[${v.id}] ${v.help} → ${nodos}`;
		}).join(" | ");
	}

	grupo("Accesibilidad (axe-core, WCAG 2.2 AA)", () => {
		prueba("axe-core está cargado", () => {
			afirmar.cierto(window.axe?.version, "No se ha cargado pruebas/terceros/axe.min.js.");
		});

		ESCENARIOS.forEach(([nombre, html, preparar]) => {
			Object.entries(TEMAS).forEach(([tema, clase]) => {
				prueba(`${nombre} · ${tema}`, async () => {
					const lienzo = document.createElement("main");
					lienzo.className = `lienzo-accesible ${clase}`;
					lienzo.innerHTML = html;
					document.body.append(lienzo);
					try {
						await esperar(30);
						preparar?.(lienzo);
						await esperar(350);
						const resultado = await axe.run(lienzo, REGLAS);
						afirmar.igual(resultado.violations.length, 0, describir(resultado.violations));
					} finally {
						lienzo.querySelectorAll("gota-selector, gota-fecha").forEach((control) => control.cerrar?.());
						lienzo.remove();
					}
				});
			});
		});
	});
})();
