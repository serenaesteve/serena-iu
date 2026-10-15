
## a) Se han identificado las herramientas disponibles para el aprendizaje automático relacionadas con las interfaces de usuario?

He comparado MediaPipe, la Web Speech API, Ollama, A-Frame, TensorFlow.js, ml5.js, Teachable Machine, OpenCV, Whisper, las APIs de OpenAI, Claude y Gemini, AR.js y WebXR. Elegí MediaPipe (manos y cara), la Web Speech API (voz), Ollama (modelo de lenguaje local) y A-Frame (3D), porque funcionan en el equipo del usuario, no envían datos de clientes a terceros y son las que vimos en clase. Al probarlas vi que un modelo pequeño es lento y falla en los cálculos, así que el asistente usa primero un intérprete propio y solo pregunta a Ollama lo que no entiende, validando siempre su respuesta. En Ajustes › Voz y gestos se ve el estado de cada herramienta.

## b) Se ha creado una interfaz natural de usuario utilizando las herramientas disponibles?

He integrado las interfaces naturales dentro de serena | iu, cada una donde se usa: botones para hablar, activar los gestos y abrir el asistente en la cabecera; «Dictar» en los formularios; «Ver en tu mano» en los productos; «Escuchar resumen» en el panel; y la ayuda y la configuración en Inicio y en Ajustes. Todas las entradas llaman a las mismas funciones que el ratón y el teclado, así que hablando o con la mano se hace lo mismo que con un clic.

## c) Se ha utilizado el reconocimiento de voz para implementar acciones en las interfaces naturales de usuario?

Con la Web Speech API se pueden dictar formularios completos: «nuevo pedido cliente Carlos producto portátil unidades 2» elige el cliente y el producto de sus listas, apunta las unidades, calcula el total y después se dice «guardar». Funciona en cualquier formulario porque los nombres de los campos salen del esquema JSON. También se puede navegar, abrir fichas, buscar y filtrar, y hacer preguntas como «¿cuántos pedidos pendientes hay?» o «¿qué cliente factura más?», que se responden en voz alta. Hay un modo manos libres que solo obedece las frases que empiezan por «Serena».

## d) Se ha incorporado la detección del movimiento del cuerpo para implementar acciones en las interfaces naturales de usuario?

Guardo las últimas posiciones de la mano y de la cara para seguir su movimiento. Deslizar la mano abierta pasa de página en los listados, y pellizcar y mover la mano desplaza la tabla. Asentir o negar con la cabeza responde a los diálogos, por ejemplo para confirmar el borrado de un cliente. Si el usuario se va de delante de la cámara, los datos de los clientes se ocultan (modo privacidad).

## e) Se han integrado elementos de detección de partes del cuerpo para implementar acciones en las interfaces naturales de usuario?

Con MediaPipe detecto los 21 puntos de la mano y la cara. A partir de los puntos calculo qué dedos están estirados: el índice y el pulgar mueven un cursor por la pantalla, el pellizco hace clic, la palma abierta cierra fichas y diálogos y el pulgar arriba acepta o guarda el formulario. Las medidas se calculan en proporción al tamaño de la mano, así que funcionan con la mano cerca o lejos, y el cursor también funciona sobre los diálogos de confirmación.

## f) Se ha integrado la realidad aumentada en los interfaces de usuario?

Desde la ficha de un producto (o diciendo «enséñame el portátil en la mano») se abre una capa en la que la webcam es el fondo y encima hay una escena de A-Frame transparente. Al abrir la mano, el producto aparece en 3D sobre la palma, con su nombre, precio y stock reales, sigue la mano, crece al acercarla y se inclina con ella. Sirve para enseñar productos a un cliente: con un pellizco o diciendo «siguiente» se cambia de producto, con el puño se esconde y un botón hace una captura. El botón aparece en cualquier entidad cuyo esquema tenga `"realidadAumentada": true`.
