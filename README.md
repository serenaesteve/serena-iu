# serena | iu

Interfaz de gestión (clientes, productos y pedidos) que se genera sola a partir de esquemas JSON, y que también se maneja **hablando, con gestos y con realidad aumentada**.
Evolución de *jocarsa | iu* · Desarrollo de interfaces · DAM · TAME Formación.

- RA1 · Interfaz gráfica: [memoria.md](memoria.md) · [respuestas-RA1.md](respuestas-RA1.md)
- RA2 · Interfaces naturales: [memoria-RA2.md](memoria-RA2.md) · [respuestas-RA2.md](respuestas-RA2.md)
- RA3 · Componentes visuales: [memoria-RA3.md](memoria-RA3.md) · [respuestas-RA3.md](respuestas-RA3.md) — los controles son de **gota**, mi librería de componentes: su código está en [`gota/`](gota/LEEME.md) y la app usa su paquete, instalado en `lib/gota/`

## Ejecutar

```bash
php -S localhost:8000          # o: python3 -m http.server 8000
```

Abre `http://localhost:8000` en Chrome o Edge · Cuenta de prueba: `demo@serena.iu` / `demo1234`

Para las preguntas libres al asistente hace falta [Ollama](https://ollama.com) en marcha (`ollama serve`) con algún modelo, por ejemplo `ollama pull phi3:mini`. Con PHP se usa `ollama.php`; sin PHP, la app se conecta directamente a `localhost:11434`.

En local `ollama.php` no tiene límites. En la web publicada solo ofrece los modelos pequeños (`MODELOS_PUBLICOS`), con un máximo de 5 preguntas por minuto y 60 al día por visitante, y atiende una pregunta cada vez. Los límites están al principio del archivo.

## Publicar

```bash
python3 publicar.py              # versiona los CSS/JS (?v=huella) y copia a /var/www/html/serena-iu
python3 publicar.py --sin-copiar # solo actualiza los ?v= de index.html y login.html
```

El servidor guarda en caché durante un año lo que lleva `?v=` y comprueba siempre las páginas y los datos. Así, quien vuelva a entrar recibe la versión nueva sin tener que recargar a mano.

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

## Componentes

Todos los controles salen de la librería **gota** (`lib/gota/`, versión en `lib/gota/package.json`): el generador de formularios elige el componente según el tipo de cada campo del JSON (`gota-campo`, `gota-cantidad`, `gota-selector`, `gota-fecha`, `gota-interruptor`), y los listados usan `gota-filtros`, `gota-paginador` y `gota-nivel`. Sus colores salen de las variables de la app (sección 15 de `css/estilo.css`).

| Carpeta | Qué es |
|---|---|
| `gota/` | El código de la librería: `src/`, las pruebas (`pruebas/`), el banco (`banco/`), la documentación (`LEEME.md`, `docs/API.md`) y el script que la construye y empaqueta (`construir.py`) |
| `gota/dist/gota-X.Y.Z.tgz` | El paquete, con el formato de `npm pack` |
| `lib/gota/` | El paquete instalado en la app, igual que lo dejaría npm en `node_modules` |

Para construir, probar e instalar una versión nueva:

```bash
cd gota && python3 construir.py && python3 pruebas/ejecutar.py chromium firefox && cd ..
rm -rf lib/gota && tar xzf gota/dist/gota-X.Y.Z.tgz -C lib && mv lib/package lib/gota
```

El banco de pruebas de la librería está dentro de la app: **Componentes › Librería gota**. En VS Code, `.vscode/settings.json` y `jsconfig.json` cargan `lib/gota/dist/gota.html-data.json` y `gota.d.ts`: el editor autocompleta las etiquetas, los atributos y los eventos de gota.

## Añadir un módulo

1. Crea `data/facturas.json` con `titulo`, `singular`, `campos` y `datos`.
2. Añade a `data/menu.json`: `{ "id": "facturas", "emoji": "💶", "texto": "Facturas", "tipo": "datos", "origen": "data/facturas.json" }`

La tabla, el formulario, el resumen, la búsqueda y el dictado por voz funcionan sin tocar el JavaScript.
