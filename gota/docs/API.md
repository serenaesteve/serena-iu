# gota 1.2.0 · referencia de la API

> Generado por `construir.py` a partir de los metadatos de cada componente. No se edita a mano.

## `<gota-campo>`

Campo de texto que indica qué dato espera y hereda la validación nativa de email, teléfono y URL.

```html
<gota-campo type="email" name="correo" placeholder="nombre@ejemplo.com" required></gota-campo>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `name` | `name` | String | — | Nombre con el que se envía en el formulario. |
| `value` | `value` | String | — | Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. |
| `disabled` | `disabled` | Boolean | `false` | Desactivado: no se puede usar ni se envía. |
| `required` | `required` | Boolean | `false` | Obligatorio: vacío marca valueMissing. |
| `readonly` | `readonly` | Boolean | `false` | Solo lectura: se envía, pero no se edita ni se valida. |
| `persistir` | `persistir` | String | — | Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. |
| `type` | `type` | String | `"text"` | Tipo de dato. Valores: `text`, `email`, `tel`, `url`. |
| `placeholder` | `placeholder` | String | — | Texto de ayuda con el campo vacío. |
| `pattern` | `pattern` | String | — | Expresión regular que debe cumplir. |
| `minlength` | `minlength` | Number | — | Longitud mínima. |
| `maxlength` | `maxlength` | Number | — | Longitud máxima. |
| `autocomplete` | `autocomplete` | String | `"off"` | Pista de autocompletado del navegador. |
| `sinMarca` | `sin-marca` | Boolean | `false` | Oculta el icono del tipo de dato. |

### Métodos

- `focus()`: Pone el foco en el control.
- `limpiar()`: Vacía el valor sin lanzar eventos.
- `checkValidity()`: Devuelve si es válido.
- `reportValidity()`: Devuelve si es válido y muestra el mensaje del navegador.
- `setCustomValidity(texto)`: Fija un error propio. Con texto vacío lo quita.
- `select()`: Selecciona todo el texto.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `input` | `—` | El valor está cambiando (igual que en un input nativo). |
| `change` | `—` | El usuario ha confirmado el cambio. |
| `gota-cambio` | `{ valor, anterior, origen }` | Cambio con datos. origen es teclado, puntero o codigo. |

### Partes (`::part`)

- `caja`: Marco del campo.
- `entrada`: El input interno.
- `marca`: Icono del tipo de dato.

## `<gota-cantidad>`

Número con botones de paso, teclado (flechas, Inicio, Fin, Re Pág, Av Pág), límites y formato de moneda. Acepta coma decimal.

```html
<gota-cantidad name="precio" formato="moneda" min="0" step="0.01" value="749.99"></gota-cantidad>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `name` | `name` | String | — | Nombre con el que se envía en el formulario. |
| `value` | `value` | String | — | Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. |
| `disabled` | `disabled` | Boolean | `false` | Desactivado: no se puede usar ni se envía. |
| `required` | `required` | Boolean | `false` | Obligatorio: vacío marca valueMissing. |
| `readonly` | `readonly` | Boolean | `false` | Solo lectura: se envía, pero no se edita ni se valida. |
| `persistir` | `persistir` | String | — | Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. |
| `min` | `min` | Number | — | Valor mínimo. Sin él no hay límite. |
| `max` | `max` | Number | — | Valor máximo. Sin él no hay límite. |
| `step` | `step` | String | `"1"` | Tamaño del paso. Con «any» no comprueba múltiplos. |
| `formato` | `formato` | String | `"numero"` | Cómo se muestra el valor al salir del campo. Valores: `numero`, `moneda`. |
| `moneda` | `moneda` | String | `"EUR"` | Código ISO de la moneda. |
| `unidad` | `unidad` | String | — | Unidad junto al número, como «uds.». |
| `placeholder` | `placeholder` | String | — | Texto de ayuda con el campo vacío. |
| `locale` | `locale` | String | `"es-ES"` | Idioma del formato. |

### Métodos

- `focus()`: Pone el foco en el control.
- `limpiar()`: Vacía el valor sin lanzar eventos.
- `checkValidity()`: Devuelve si es válido.
- `reportValidity()`: Devuelve si es válido y muestra el mensaje del navegador.
- `setCustomValidity(texto)`: Fija un error propio. Con texto vacío lo quita.
- `incrementar(veces = 1)`: Suma pasos sin salir de los límites.
- `decrementar(veces = 1)`: Resta pasos sin salir de los límites.
- `stepUp(veces = 1)`: Igual que incrementar: mismo nombre que el input nativo.
- `stepDown(veces = 1)`: Igual que decrementar: mismo nombre que el input nativo.
- `select()`: Selecciona el texto.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `input` | `—` | El valor está cambiando (igual que en un input nativo). |
| `change` | `—` | El usuario ha confirmado el cambio. |
| `gota-cambio` | `{ valor, anterior, origen }` | Cambio con datos. origen es teclado, puntero o codigo. |

### Partes (`::part`)

- `caja`: Marco del campo.
- `entrada`: El input interno.
- `menos`: Botón de restar.
- `mas`: Botón de sumar.
- `unidad`: Símbolo de la moneda o la unidad.

## `<gota-selector>`

Lista desplegable que se filtra escribiendo, sin distinguir acentos ni mayúsculas. Las opciones se dan con <option> o con la propiedad opciones.

```html
<gota-selector name="categoria"><option>Informática</option><option>Telefonía</option></gota-selector>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `name` | `name` | String | — | Nombre con el que se envía en el formulario. |
| `value` | `value` | String | — | Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. |
| `disabled` | `disabled` | Boolean | `false` | Desactivado: no se puede usar ni se envía. |
| `required` | `required` | Boolean | `false` | Obligatorio: vacío marca valueMissing. |
| `readonly` | `readonly` | Boolean | `false` | Solo lectura: se envía, pero no se edita ni se valida. |
| `persistir` | `persistir` | String | — | Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. |
| `placeholder` | `placeholder` | String | `"Selecciona…"` | Texto cuando no hay nada elegido. |
| `sinResultados` | `sin-resultados` | String | `"No hay coincidencias"` | Texto cuando el filtro no encuentra nada. |
| `opciones` | — | Array | `[]` | Lista de textos u objetos { valor, texto, tono, desactivada }. |

### Métodos

- `focus()`: Pone el foco en el control.
- `limpiar()`: Vacía el valor sin lanzar eventos.
- `checkValidity()`: Devuelve si es válido.
- `reportValidity()`: Devuelve si es válido y muestra el mensaje del navegador.
- `setCustomValidity(texto)`: Fija un error propio. Con texto vacío lo quita.
- `abrir()`: Abre la lista.
- `cerrar()`: Cierra la lista.
- `elegir(valor)`: Elige una opción como si la hubiera pulsado el usuario y lanza los eventos.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `input` | `—` | El valor está cambiando (igual que en un input nativo). |
| `change` | `—` | El usuario ha confirmado el cambio. |
| `gota-cambio` | `{ valor, anterior, origen }` | Cambio con datos. origen es teclado, puntero o codigo. |
| `gota-abrir` | `—` | Se ha abierto la lista. |
| `gota-cerrar` | `—` | Se ha cerrado la lista. |

### Partes (`::part`)

- `caja`: Marco del campo.
- `entrada`: El input interno.
- `flecha`: Botón de abrir.
- `lista`: Panel con las opciones.
- `opcion`: Cada opción.

## `<gota-fecha>`

Fecha con calendario desplegable, que también se puede escribir (15/3/1990). El valor siempre es AAAA-MM-DD, como en un input date.

```html
<gota-fecha name="alta" min="2026-01-01" value="2026-10-30"></gota-fecha>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `name` | `name` | String | — | Nombre con el que se envía en el formulario. |
| `value` | `value` | String | — | Valor. El atributo es el valor inicial, al que vuelve con reset(); la propiedad es el valor actual. |
| `disabled` | `disabled` | Boolean | `false` | Desactivado: no se puede usar ni se envía. |
| `required` | `required` | Boolean | `false` | Obligatorio: vacío marca valueMissing. |
| `readonly` | `readonly` | Boolean | `false` | Solo lectura: se envía, pero no se edita ni se valida. |
| `persistir` | `persistir` | String | — | Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. |
| `min` | `min` | String | — | Fecha mínima (AAAA-MM-DD). |
| `max` | `max` | String | — | Fecha máxima (AAAA-MM-DD). |
| `placeholder` | `placeholder` | String | `"dd/mm/aaaa"` | Texto de ayuda con el campo vacío. |
| `locale` | `locale` | String | `"es-ES"` | Idioma del calendario. |

### Métodos

- `focus()`: Pone el foco en el control.
- `limpiar()`: Vacía el valor sin lanzar eventos.
- `checkValidity()`: Devuelve si es válido.
- `reportValidity()`: Devuelve si es válido y muestra el mensaje del navegador.
- `setCustomValidity(texto)`: Fija un error propio. Con texto vacío lo quita.
- `abrir()`: Abre el calendario.
- `cerrar()`: Cierra el calendario.
- `irAMes(anio, mes)`: Enseña ese mes (de 1 a 12) sin cambiar el valor.
- `hoy()`: Elige la fecha de hoy y lanza los eventos.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `input` | `—` | El valor está cambiando (igual que en un input nativo). |
| `change` | `—` | El usuario ha confirmado el cambio. |
| `gota-cambio` | `{ valor, anterior, origen }` | Cambio con datos. origen es teclado, puntero o codigo. |
| `gota-abrir` | `—` | Se ha abierto el calendario. |
| `gota-cerrar` | `—` | Se ha cerrado el calendario. |
| `gota-mes` | `{ anio, mes }` | El calendario enseña otro mes. mes va de 1 a 12. |

### Partes (`::part`)

- `caja`: Marco del campo.
- `entrada`: El input interno.
- `abrir`: Botón del calendario.
- `calendario`: Panel del calendario.
- `dia`: Cada día.

## `<gota-interruptor>`

Interruptor para valores de sí o no. La gota cruza el canal y se estira al hacerlo. Se usa igual que una casilla: propiedad checked y evento change.

```html
<gota-interruptor name="activo" checked></gota-interruptor>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `name` | `name` | String | — | Nombre con el que se envía en el formulario. |
| `value` | `value` | String | `"on"` | Valor que se envía cuando está activado. |
| `disabled` | `disabled` | Boolean | `false` | Desactivado: no se puede usar ni se envía. |
| `required` | `required` | Boolean | `false` | Obligatorio: vacío marca valueMissing. |
| `readonly` | `readonly` | Boolean | `false` | Solo lectura: se envía, pero no se edita ni se valida. |
| `persistir` | `persistir` | String | — | Clave de localStorage donde recordar el valor entre visitas. Vacía: no se guarda. |
| `checked` | `checked` | Boolean | `false` | Activado. El atributo es el estado inicial, al que vuelve con reset(); la propiedad es el estado actual. |

### Métodos

- `focus()`: Pone el foco en el control.
- `limpiar()`: Vacía el valor sin lanzar eventos.
- `checkValidity()`: Devuelve si es válido.
- `reportValidity()`: Devuelve si es válido y muestra el mensaje del navegador.
- `setCustomValidity(texto)`: Fija un error propio. Con texto vacío lo quita.
- `alternar()`: Cambia de estado sin lanzar eventos.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `input` | `—` | El valor está cambiando (igual que en un input nativo). |
| `change` | `—` | El usuario ha confirmado el cambio. |
| `gota-cambio` | `{ valor, anterior, origen }` | Cambio con datos. valor es true o false; origen es teclado, puntero o codigo. |

### Partes (`::part`)

- `canal`: El canal por el que corre la gota.

## `<gota-clave>`

Envuelve un <input type="password"> real, que se queda en el HTML de la página para que los gestores de contraseñas lo encuentren. Añade mostrar y ocultar y, si se pide, un medidor de fuerza.

```html
<gota-clave medidor><input name="clave" type="password" autocomplete="new-password"></gota-clave>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `medidor` | `medidor` | Boolean | `false` | Muestra el medidor de fuerza. |
| `minimo` | `minimo` | Number | `8` | Longitud mínima que pide el medidor. |
| `visible` | `visible` | Boolean | `false` | La contraseña se ve en claro. |

### Métodos

- `mostrar()`: Enseña la contraseña en claro.
- `ocultar()`: Vuelve a ocultarla.
- `alternar()`: Cambia entre las dos.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `gota-visibilidad` | `{ visible }` | Se ha mostrado u ocultado la contraseña. |
| `gota-fuerza` | `{ puntos, texto }` | Ha cambiado la fuerza de la contraseña (de 0 a 5). |

### Partes (`::part`)

- `caja`: Marco del campo.
- `ver`: Botón de mostrar y ocultar.
- `medidor`: Tubo de fuerza.
- `texto`: Texto de fuerza.

## `<gota-filtros>`

Barra de filtros con una sola gota: al elegir otro, la gota viaja hasta él. Cada filtro puede llevar un punto de color y una cantidad.

```html
<gota-filtros etiqueta="Tipo de cliente"></gota-filtros>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `value` | `value` | String | — | Valor del filtro elegido. |
| `etiqueta` | `etiqueta` | String | `"Filtros"` | Nombre del grupo para los lectores de pantalla. |
| `opciones` | — | Array | `[]` | Lista de { valor, texto, cantidad, tono }. |

### Métodos

- `actualizarCantidades(cantidades)`: Cambia los números sin repintar. Recibe { valor: cantidad }.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `change` | `—` | El usuario ha elegido otro filtro. |
| `gota-cambio` | `{ valor, anterior, origen }` | Cambio con datos. origen es teclado o puntero. |

### Partes (`::part`)

- `barra`: Contenedor.
- `filtro`: Cada botón.
- `cantidad`: Número de cada filtro.

## `<gota-paginador>`

Paginación numerada que resume los saltos largos con puntos suspensivos. La gota marca la página actual.

```html
<gota-paginador pagina="3" paginas="12"></gota-paginador>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `pagina` | `pagina` | Number | `1` | Página actual, desde 1. |
| `paginas` | `paginas` | Number | `1` | Total de páginas. |
| `vecinas` | `vecinas` | Number | `1` | Páginas que se ven a cada lado de la actual. |
| `etiqueta` | `etiqueta` | String | `"Paginación"` | Nombre para los lectores de pantalla. |

### Métodos

- `siguiente()`: Avanza una página y lanza el evento.
- `anterior()`: Retrocede una página y lanza el evento.
- `ir(pagina)`: Va a esa página, sin salir del rango, y lanza el evento.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `gota-pagina` | `{ pagina, anterior }` | El usuario ha cambiado de página. |

### Partes (`::part`)

- `barra`: Contenedor.
- `pagina`: Botón de cada página.
- `flecha`: Botones de anterior y siguiente.

## `<gota-nivel>`

Enseña una cantidad como el líquido de un tubo, con una marca de mínimo y un estado que cambia de color: agotado, bajo, normal o lleno.

```html
<gota-nivel value="7" max="60" minimo="10" unidad="uds."></gota-nivel>
```

### Propiedades y atributos

| Propiedad | Atributo | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `value` | `value` | Number | `0` | Cantidad actual. |
| `max` | `max` | Number | `100` | Cantidad con la que el tubo está lleno. |
| `minimo` | `minimo` | Number | `0` | Por debajo de esta cantidad el estado es «bajo». Con 0 no hay marca. |
| `unidad` | `unidad` | String | — | Unidad junto a la cifra. |
| `vertical` | `vertical` | Boolean | `false` | Tubo de pie, como una probeta. |
| `sinCifra` | `sin-cifra` | Boolean | `false` | Oculta el número. |
| `etiqueta` | `etiqueta` | String | `"Nivel"` | Nombre para los lectores de pantalla. |

### Métodos

- `ajustar(diferencia)`: Suma o resta a la cantidad actual, sin bajar de 0.

### Eventos

| Evento | detail | Cuándo |
|---|---|---|
| `gota-umbral` | `{ estado, anterior, valor }` | El nivel ha pasado a otro estado. |

### Partes (`::part`)

- `tubo`: El tubo.
- `liquido`: El líquido.
- `marca`: La marca del mínimo.
- `cifra`: El número.
