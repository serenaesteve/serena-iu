
## a) Se han analizado las herramientas y librerías disponibles para la generación de interfaces gráficos?

He comparado varias herramientas: las DevTools del navegador, Figma, Pinegrow, Qt Designer, Scene Builder y el editor de Android Studio. También he mirado librerías como React y Bootstrap. Al final elegí HTML, CSS y JavaScript sin librerías, y usé las DevTools del navegador como editor visual, porque son gratuitas, permiten ver los cambios al momento y me dejan controlar todo el código.

## b) Se ha creado un interfaz gráfico utilizando las herramientas de un editor visual?

Con las DevTools de Chrome he creado y ajustado la interfaz: una cabecera, dos columnas laterales y una zona central. En el panel Elements he añadido y ordenado los elementos, y en el panel Styles he probado los estilos antes de pasarlos al archivo CSS.

## c) Se han utilizado las funciones del editor para ubicar los componentes del interfaz?

He usado el editor de flexbox para colocar los elementos de la cabecera y de las columnas, y la vista de grid para organizar el formulario y las tarjetas. Con el modo dispositivo he comprobado cómo se ve la aplicación en el móvil.

## d) Se han modificado las propiedades de los componentes para adecuarlas a las necesidades de la aplicación?

He cambiado los colores, los tamaños, los bordes y los efectos de los componentes. Los colores salen de unas pocas variables CSS, así que cambiando una se actualiza toda la interfaz. He añadido un estilo de cristal translúcido, modo claro y oscuro, botones redondeados y colores distintos para cada estado.

## e) Se ha analizado el código generado por el editor visual?

Al revisar el código encontré varios fallos: la fuente no cargaba porque el `@import` estaba mal colocado, había reglas CSS repetidas que se pisaban, colores escritos a mano, datos que se cargaban pero no se usaban y código duplicado.

## f) Se ha modificado el código generado por el editor visual?

He corregido esos fallos, he ordenado todo el CSS en un solo archivo y he organizado el JavaScript en clases. Además, ahora la interfaz se genera a partir de archivos JSON: la aplicación lee los datos y crea sola las tablas, los formularios y las fichas.

## g) Se han asociado a los eventos las acciones correspondientes?

He programado eventos para cada acción. Al hacer clic en una fila se abre su ficha, al escribir en el buscador se filtra la tabla, al enviar un formulario se valida y se guarda, y al pulsar las cabeceras de la tabla se ordena. También hay atajos de teclado, como Ctrl + K para buscar, y un botón para deshacer algo borrado.

## h) Se ha desarrollado una aplicación que incluye el interfaz gráfico obtenido?

El resultado es serena | iu, una aplicación para gestionar clientes, productos y pedidos. Tiene login, un panel de inicio con gráficos, tablas con búsqueda y filtros, formularios, fichas de detalle y modo claro y oscuro, y funciona también en el móvil.
