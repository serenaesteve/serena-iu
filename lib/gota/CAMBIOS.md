# Cambios

## 1.2.0 · 2026-11-03

- Nuevos archivos generados a partir de los metadatos: `dist/gota.d.ts` (tipos de TypeScript, también para JavaScript), `dist/gota.html-data.json` (autocompletado HTML de VS Code) y `dist/custom-elements.json` (Custom Elements Manifest 2.1). El `package.json` los declara en `types`, `customElements` y `exports`.
- Cada evento con datos declara el tipo de su `detail` (`tipoDetalle`). `gota-interruptor` documenta que su `gota-cambio` lleva un booleano.
- Pruebas de accesibilidad con axe-core (WCAG 2.2 AA) en claro y en oscuro, y pruebas que comparan los archivos generados con los componentes.
- Accesibilidad: el calendario de `gota-fecha` es una rejilla ARIA completa (semanas con `role="row"` y días con `role="gridcell"` y `aria-selected` en lugar de `aria-pressed`) y tiene nombre (el mes).
- Contraste: los días de otro mes en el calendario y la cifra de `gota-nivel` en estado «bajo» llegan a 4,5:1.

## 1.1.0 · 2026-11-03

- El tema por defecto pasa a ser el de Serena: ciruela sobre rosa empolvado, con modo oscuro invertido.
- El tema azul «agua clara» se conserva como alternativo en `temas/agua.css` (clase `.gota-tema-agua`).
- Nueva variable `--gota-fuente-titulo` para el título del calendario.
- El banco de pruebas permite cambiar de tema y va dentro del paquete (`banco/`), para montarlo en cualquier aplicación con `gotaBanco.montar(contenedor)`.

## 1.0.0 · 2026-10-30

Primera versión: gota-campo, gota-cantidad, gota-selector, gota-fecha, gota-interruptor, gota-clave, gota-filtros, gota-paginador y gota-nivel.
