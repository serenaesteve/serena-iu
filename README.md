# serena | iu

Interfaz de gestión (clientes, productos y pedidos) que se genera sola a partir de esquemas JSON.
Evolución de *jocarsa | iu* · Desarrollo de interfaces · DAM · TAME Formación.

## Ejecutar

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` · Cuenta de prueba: `demo@serena.iu` / `demo1234`

## Atajos

| Tecla | Acción |
|---|---|
| Ctrl + K | Paleta de comandos |
| / | Buscar |
| N | Nuevo registro |
| Esc | Volver al listado |
| ? | Ver todos los atajos |

## Añadir un módulo

1. Crea `data/facturas.json` con `titulo`, `singular`, `campos` y `datos`.
2. Añade a `data/menu.json`: `{ "id": "facturas", "emoji": "💶", "texto": "Facturas", "tipo": "datos", "origen": "data/facturas.json" }`

La tabla, el formulario, el resumen y la búsqueda funcionan sin tocar el JavaScript.
