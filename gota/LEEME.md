# gota

Librería de componentes visuales para formularios y listados. Son Web Components estándar: no tienen dependencias, funcionan con cualquier framework o sin ninguno y su HTML se escribe como el de un control nativo.

En toda la librería la selección es **una gota que se mueve**. No cambia un color: la gota viaja hasta la opción elegida, se estira por el camino y recupera la forma al llegar.

| Componente | Sustituye a | Qué añade |
|---|---|---|
| `<gota-campo>` | `<input>` de texto, email, tel, url | Icono del tipo de dato |
| `<gota-cantidad>` | `<input type="number">` | Botones de paso, coma decimal, formato de moneda |
| `<gota-selector>` | `<select>` | Filtrar escribiendo, opciones con color |
| `<gota-fecha>` | `<input type="date">` | Calendario propio, fecha escrita a mano |
| `<gota-interruptor>` | `<input type="checkbox">` | La gota cruza el canal |
| `<gota-clave>` | Envuelve `<input type="password">` | Mostrar y ocultar, medidor de fuerza |
| `<gota-filtros>` | Grupo de botones | Una sola gota para todo el grupo, cantidades |
| `<gota-paginador>` | Paginación a mano | Puntos suspensivos, teclado |
| `<gota-nivel>` | `<meter>` | Líquido en un tubo, marca de mínimo, estados |

## Instalación

Con el paquete, en un proyecto con npm:

```bash
npm install ./gota-1.2.0.tgz
```

```js
import "gota-componentes";
```

Sin herramientas, copiando un solo archivo. No hace falta ningún CSS aparte:

```html
<script src="gota.js"></script>
```

## Uso

```html
<form>
	<label>Precio <gota-cantidad name="precio" formato="moneda" min="0" step="0.01" required></gota-cantidad></label>
	<label>Categoría
		<gota-selector name="categoria">
			<option>Informática</option>
			<option>Telefonía</option>
		</gota-selector>
	</label>
	<label><gota-interruptor name="activo" checked></gota-interruptor> Activo</label>
	<button>Guardar</button>
</form>
```

Los controles se usan como los nativos: aparecen en `form.elements`, se envían, se validan (`checkValidity`, `validity`), vuelven a su valor con `reset()` y se desactivan dentro de un `<fieldset disabled>`.

```js
const precio = document.querySelector("gota-cantidad");

precio.value = 12.5;                                     // propiedad
precio.setAttribute("max", "100");                       // atributo
precio.incrementar();                                    // método
precio.addEventListener("gota-cambio", (evento) => {     // evento con datos
	console.log(evento.detail); // { valor: "12.51", anterior: "12.5", origen: "puntero" }
});
```

La referencia completa de cada propiedad, método, evento y parte está en [docs/API.md](docs/API.md).

## Autocompletado y tipos

`construir.py` saca de la tabla de cada componente tres archivos para el editor y otras herramientas. Van dentro del paquete:

| Archivo | Para qué |
|---|---|
| `dist/gota.d.ts` | Tipos de TypeScript. Con npm se cargan solos; en JavaScript también dan autocompletado y avisos. `document.querySelector("gota-cantidad")` ya es un `GotaCantidad`, `formato` solo admite `"numero"` o `"moneda"` y `evento.detail` de `gota-pagina` es `{ pagina: number; anterior: number }`. |
| `dist/gota.html-data.json` | Etiquetas, atributos y valores para el autocompletado HTML de VS Code, con la descripción al pasar el ratón. |
| `dist/custom-elements.json` | El formato estándar [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest), que leen Storybook, los catálogos de componentes y los complementos de los editores. |

Sin npm, copiando la carpeta del paquete a `lib/gota`, basta con decírselo a VS Code:

```jsonc
// .vscode/settings.json
{ "html.customData": ["./lib/gota/dist/gota.html-data.json"] }
```

```jsonc
// jsconfig.json
{ "compilerOptions": { "checkJs": false, "lib": ["es2022", "dom"] }, "include": ["js/**/*.js", "lib/gota/dist/gota.d.ts"] }
```

## Personalizar

Los estilos están encapsulados: el CSS de la página no los rompe. Desde fuera entran estas variables, y todas tienen un valor por defecto. El tema propio es el de Serena (ciruela sobre rosa empolvado, con modo oscuro invertido):

```css
:root{
	--gota-acento:#2A2026;          /* la gota y lo seleccionado */
	--gota-sobre-acento:#FFFFFF;    /* texto encima de la gota */
	--gota-acento-suave:rgb(248 196 214 / .55);   /* anillo de foco */
	--gota-tinta:#1B1216;
	--gota-tinta-suave:#7A6770;
	--gota-campo:#FFFFFF;
	--gota-panel:#FFFBFC;
	--gota-linea:rgb(42 32 38 / .14);
	--gota-radio:18px;
	--gota-fuente:inherit;
	--gota-fuente-titulo:"Playfair Display", Georgia, serif;
}
gota-cantidad::part(entrada){font-weight:700;}
```

También: `--gota-campo-foco`, `--gota-boton`, `--gota-boton-hover`, `--gota-sombra`, `--gota-sombra-campo`, `--gota-peligro`, `--gota-aviso`, `--gota-exito`, `--gota-radio-panel`, `--gota-alto` y `--gota-nivel-largo`.

**Temas.** Un tema es solo un grupo de esas variables. El paquete trae un segundo tema, «agua clara» (azul), que se activa con una clase en cualquier contenedor:

```html
<link rel="stylesheet" href="temas/agua.css">
<section class="gota-tema-agua"> … </section>
```

Una aplicación también puede pasarle sus propias variables, como hace serena | iu para que los componentes cambien con su tono y su modo claro u oscuro:

```css
:root{ --gota-acento:var(--acento); --gota-campo:var(--campo); --gota-tinta:var(--tinta); }
```

## Crear un componente nuevo

Se hereda de `gota.GotaElemento` (o de `gota.GotaControl` si es de formulario) y se declara la API. Los atributos, los valores por defecto, la documentación y el banco de pruebas salen de esa tabla:

```js
class MiEstrella extends gota.GotaElemento {
	static etiqueta = "mi-estrella";
	static descripcion = "Una puntuación de 1 a 5.";
	static propiedades = {
		puntos: { tipo: Number, defecto: 3, descripcion: "Puntos de 1 a 5." }
	};

	construir() { this.raiz.innerHTML = "<output></output>"; }
	actualizar() { this.raiz.querySelector("output").textContent = "★".repeat(this.puntos); }
}
MiEstrella.definir();
```

## Desarrollo

```bash
python3 construir.py                  # une src/ en dist/, genera docs/API.md, los tipos y los manifiestos, y crea el .tgz
python3 pruebas/ejecutar.py           # pruebas unitarias en Chromium
python3 pruebas/ejecutar.py firefox   # en Firefox
python3 pruebas/ejecutar.py --paquete # las mismas pruebas sobre lo que hay dentro del .tgz
```

Cada navegador hace dos pasadas: todas las pruebas con el esquema claro y las de accesibilidad otra vez con el oscuro. Las de accesibilidad pasan [axe-core](https://github.com/dequelabs/axe-core) (en `pruebas/terceros/`, licencia MPL 2.0) con las reglas WCAG 2.2 A y AA sobre cada componente en sus estados (vacío, con valor, no válido, desactivado, abierto), con el tema por defecto y con «agua clara». Revisa también el contraste dentro del Shadow DOM. Otras pruebas comprueban que `custom-elements.json`, `gota.d.ts` y `gota.html-data.json` coinciden con los componentes.

Las pruebas también se pueden ver sin Playwright: sirve la carpeta (`python3 -m http.server`) y abre `pruebas/index.html`. El banco de pruebas está en `banco/index.html`.

**Navegadores:** hace falta Popover API y ElementInternals (Chrome 114, Edge 114, Firefox 125 y Safari 17 o posteriores).
