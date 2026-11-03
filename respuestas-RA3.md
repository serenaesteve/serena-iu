
## a) Se han identificado las herramientas para diseño y prueba de componentes?

He comparado React, Vue, Lit, Stencil y los Web Components estándar para crear los componentes; Figma, Storybook, Ladle e Histoire para diseñarlos y verlos aislados; Jest, Vitest, Web Test Runner y Playwright para probarlos; y npm pack, Vite y Rollup para empaquetarlos. Elegí Web Components estándar porque funcionan en cualquier página sin dependencias, las DevTools para inspeccionar el Shadow DOM, un banco de pruebas propio al estilo de Storybook, Playwright para ejecutar las pruebas en navegadores reales, porque jsdom no implementa bien Shadow DOM ni ElementInternals, y axe-core para revisar la accesibilidad dentro de las propias pruebas.

## b) Se han creado componentes visuales?

He creado gota, una librería con nueve componentes: gota-campo, gota-cantidad, gota-selector, gota-fecha, gota-interruptor, gota-clave, gota-filtros, gota-paginador y gota-nivel. Usan Shadow DOM para que sus estilos estén encapsulados y se personalizan desde fuera con variables CSS --gota-* y con ::part. Su firma visual es una gota que viaja hasta la opción elegida y se estira por el camino. El tema por defecto es el de mi portafolio y trae otro alternativo, «agua clara».

## c) Se han definido sus métodos y propiedades con asignación de valores por defecto?

Cada componente declara sus propiedades en una tabla con su tipo, su valor por defecto y su descripción. A partir de ella, la clase base crea los getters y setters enlazados con su atributo HTML, y devuelve el valor por defecto cuando el atributo no está: por ejemplo, step "1" y formato "numero" en gota-cantidad, o placeholder "Selecciona…" en gota-selector. Los controles tienen además los métodos de un input nativo (focus, checkValidity, reportValidity, setCustomValidity) y otros propios, como incrementar(), elegir(valor), irAMes(), hoy(), siguiente() o ajustar().

## d) Se han determinado los eventos a los que debe responder el componente y se les han asociado las acciones correspondientes?

Los componentes responden al puntero, al teclado y al foco: las flechas suman pasos o recorren las opciones, escribir filtra el selector o interpreta una fecha, y Escape cierra la lista. Lanzan input y change como un control nativo, y además eventos propios con datos, como gota-cambio { valor, anterior, origen }, gota-pagina, gota-fuerza o gota-umbral, que salen del Shadow DOM. En serena | iu, por ejemplo, la paginación escucha gota-pagina y vuelve a pintar la tabla.

## e) Se han realizado pruebas unitarias sobre los componentes desarrollados?

He escrito 429 pruebas unitarias con un arnés propio que se ejecuta en navegadores reales con Playwright, y pasan todas en Chromium y en Firefox, también sobre el contenido del paquete. Comprueban que cada propiedad empieza en su valor por defecto y está enlazada con su atributo, que los controles funcionan dentro de un formulario (envío, validación, reset y desactivado), el comportamiento de cada componente y sus eventos. Las de accesibilidad pasan axe-core con las reglas WCAG 2.2 AA a cada componente en varios estados, con los dos temas y en modo claro y oscuro. Encontraron tres fallos reales (la estructura ARIA del calendario y dos contrastes insuficientes), que ya están corregidos. También he probado la integración en serena | iu.

## f) Se han documentado los componentes creados?

La librería tiene un LEEME con la instalación, el uso, los temas y cómo crear un componente nuevo, y un registro de cambios por versión. La referencia completa, docs/API.md, se genera automáticamente a partir de la tabla de cada componente, con sus propiedades, valores por defecto, métodos, eventos y partes. De la misma tabla salen los tipos de TypeScript, el autocompletado de VS Code y el Custom Elements Manifest estándar, así que el editor muestra la documentación al escribir. El banco de pruebas permite ver y probar cada componente en vivo.

## g) Se han empaquetado componentes?

Un script de construcción une el código en un módulo ES y en un script clásico, genera la documentación, los tipos y el manifiesto, y crea gota-1.2.0.tgz con el mismo formato que npm pack. El package.json declara la versión, la licencia, los archivos, los puntos de entrada (exports), los tipos (types) y el manifiesto (customElements). Se puede instalar con npm install o usar con un solo script, y así se ha instalado en serena | iu, en lib/gota.

## h) Se han programado aplicaciones cuyo interfaz gráfico utiliza los componentes creados?

serena | iu usa gota en toda la interfaz: los formularios generados desde JSON eligen el componente según el tipo de cada campo, los listados usan gota-filtros y gota-paginador, el stock se muestra con gota-nivel, el login usa gota-clave y los ajustes usan interruptores y selectores de gota. Como los componentes funcionan igual que los controles nativos, la validación, el cálculo de totales y el dictado por voz del RA2 siguieron funcionando sin cambios, y los componentes toman los colores de la aplicación en modo claro y oscuro.
