# serena | iu

Interfaz de gestión (clientes, productos y pedidos) que se genera sola a partir de esquemas JSON, y que también se maneja **hablando, con gestos y con realidad aumentada**.
Evolución de *jocarsa | iu* · Desarrollo de interfaces · DAM · TAME Formación.

- RA1 · Interfaz gráfica: [memoria.md](memoria.md) · [respuestas-RA1.md](respuestas-RA1.md)
- RA2 · Interfaces naturales: [memoria-RA2.md](memoria-RA2.md) · [respuestas-RA2.md](respuestas-RA2.md)

## Ejecutar

```bash
php -S localhost:8000          # o: python3 -m http.server 8000
```

Abre `http://localhost:8000` en Chrome o Edge · Cuenta de prueba: `demo@serena.iu` / `demo1234`

Para las preguntas libres al asistente hace falta [Ollama](https://ollama.com) en marcha (`ollama serve`) con algún modelo, por ejemplo `ollama pull phi3:mini`. Con PHP se usa `ollama.php`; sin PHP, la app se conecta directamente a `localhost:11434`.

## Atajos

| Tecla | Acción |
|---|---|
| Ctrl + K | Paleta de comandos |
| / | Buscar |
| N | Nuevo registro |
| Esc | Volver al listado |
| ? | Ver todos los atajos |
| V | Dar una orden por voz |
| G | Activar o desactivar los gestos con la cámara |
| A | Abrir o cerrar el asistente |

## Interfaces naturales

Cada una está donde se usa (no hay un módulo aparte):

| Dónde | Qué hace | Con qué |
|---|---|---|
| Cabecera 🎤 / tecla V | Órdenes y preguntas: «pedidos pendientes», «¿qué cliente factura más?», «sí», «modo claro»… | Web Speech API |
| Formularios · «🎤 Dictar» | «Nuevo pedido cliente Carlos producto portátil unidades 2» → rellena, calcula el total; luego «guardar» | Web Speech API |
| Asistente ✦ / tecla A | Conversación por texto o voz; lo que no conoce se lo pregunta a un modelo local | Intérprete propio + Ollama |
| Cabecera 🖐️ / tecla G | Cursor con la mano, pellizco = clic, deslizar = página siguiente, palma = cerrar, 👍 = guardar | MediaPipe HandLandmarker |
| Diálogos | Asentir / negar para confirmar; datos ocultos si no hay nadie delante | MediaPipe FaceDetector |
| Productos · «🪄 Ver en tu mano» | El producto en 3D sobre la palma, para enseñárselo a un cliente | A-Frame + MediaPipe |
| Inicio › Panel | «🔊 Escuchar resumen» | SpeechSynthesis |

Ayuda: **Inicio › Ayuda y atajos**. Configuración: **Ajustes › Voz y gestos**. Los comandos de voz y los gestos se describen en `data/natural.json`.

## Añadir un módulo

1. Crea `data/facturas.json` con `titulo`, `singular`, `campos` y `datos`.
2. Añade a `data/menu.json`: `{ "id": "facturas", "emoji": "💶", "texto": "Facturas", "tipo": "datos", "origen": "data/facturas.json" }`

La tabla, el formulario, el resumen, la búsqueda y el dictado por voz funcionan sin tocar el JavaScript.
