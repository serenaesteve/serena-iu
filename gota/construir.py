#!/usr/bin/env python3
"""
Construye la librería gota. Solo necesita Python.

    python3 construir.py

 1. Une src/ en dist/gota.js (script clásico) y dist/gota.mjs (módulo ES).
 2. Si hay Playwright, lee los metadatos de los componentes y genera con ellos:
      docs/API.md                 la referencia para leer
      dist/custom-elements.json   el formato estándar Custom Elements Manifest (Storybook, editores)
      dist/gota.d.ts              los tipos de TypeScript (autocompletado también en JavaScript)
      dist/gota.html-data.json    las etiquetas y atributos para el autocompletado HTML de VS Code
 3. Crea dist/gota-<versión>.tgz con el mismo formato que `npm pack`.
"""
import gzip
import io
import json
import sys
import tarfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SRC = RAIZ / "src"
DIST = RAIZ / "dist"

# El orden importa: cada archivo usa lo que definen los anteriores
FUENTES = [
    "estilos.js", "nucleo.js", "movimiento.js",
    "componentes/campo.js", "componentes/cantidad.js", "componentes/selector.js",
    "componentes/fecha.js", "componentes/interruptor.js", "componentes/clave.js",
    "componentes/filtros.js", "componentes/paginador.js", "componentes/nivel.js",
    "indice.js",
]
PUBLICO = [
    "GotaElemento", "GotaControl", "GotaCampo", "GotaCantidad", "GotaSelector", "GotaFecha",
    "GotaInterruptor", "GotaClave", "GotaFiltros", "GotaPaginador", "GotaNivel",
    "moverGota", "manifiesto", "VERSION",
]
GENERADOS = ["dist/custom-elements.json", "dist/gota.d.ts", "dist/gota.html-data.json"]
EMPAQUETADOS = ["dist/gota.js", "dist/gota.mjs", *GENERADOS, "docs/API.md", "LEEME.md", "CAMBIOS.md", "LICENSE", "package.json", "temas/agua.css", "banco/banco.js", "banco/banco.css"]


def unir(version):
    cuerpo = "\n".join((SRC / f).read_text(encoding="utf-8") for f in FUENTES).replace("__VERSION__", version)
    cabecera = f"/*! gota {version} · componentes visuales · MIT · Serena Sania Esteve */\n"
    lista = ", ".join(PUBLICO)

    DIST.mkdir(exist_ok=True)
    (DIST / "gota.js").write_text(
        f'{cabecera}(() => {{\n"use strict";\n\n{cuerpo}\nwindow.gota = {{ {lista} }};\n}})();\n',
        encoding="utf-8",
    )
    (DIST / "gota.mjs").write_text(f"{cabecera}{cuerpo}\nexport {{ {lista} }};\n", encoding="utf-8")


def celda(texto):
    return str(texto).replace("|", "\\|").replace("\n", " ")


def valor_defecto(propiedad):
    defecto = propiedad["defecto"]
    if defecto is None or defecto == "":
        return "—"
    return f"`{json.dumps(defecto, ensure_ascii=False)}`"


def markdown_api(componentes, version):
    lineas = [
        f"# gota {version} · referencia de la API",
        "",
        "> Generado por `construir.py` a partir de los metadatos de cada componente. No se edita a mano.",
        "",
    ]
    for c in componentes:
        lineas += [f"## `<{c['etiqueta']}>`", "", c["descripcion"], "", "```html", c["ejemplo"], "```", ""]
        lineas += ["### Propiedades y atributos", "", "| Propiedad | Atributo | Tipo | Por defecto | Descripción |", "|---|---|---|---|---|"]
        for p in c["propiedades"]:
            atributo = f"`{p['atributo']}`" if p["atributo"] else "—"
            detalle = p["descripcion"]
            if p["opciones"]:
                detalle += " Valores: " + ", ".join(f"`{o}`" for o in p["opciones"]) + "."
            lineas.append(f"| `{p['nombre']}` | {atributo} | {p['tipo']} | {valor_defecto(p)} | {celda(detalle)} |")
        lineas += ["", "### Métodos", ""]
        lineas += [f"- `{m['firma']}`: {m['descripcion']}" for m in c["metodos"]] or ["Sin métodos propios."]
        lineas += ["", "### Eventos", "", "| Evento | detail | Cuándo |", "|---|---|---|"]
        lineas += [f"| `{e['nombre']}` | `{celda(e['detalle'])}` | {celda(e['descripcion'])} |" for e in c["eventos"]]
        if c["partes"]:
            lineas += ["", "### Partes (`::part`)", ""]
            lineas += [f"- `{p['nombre']}`: {p['descripcion']}" for p in c["partes"]]
        lineas.append("")
    return "\n".join(lineas)


# ---------- Formatos para herramientas ----------

# Las firmas de los métodos no llevan tipos; los parámetros se llaman igual en toda la librería
TIPOS_PARAMETRO = {
    "veces": "number", "texto": "string", "valor": "string", "anio": "number", "mes": "number",
    "pagina": "number", "diferencia": "number", "cantidades": "Record<string, number>",
}
TIPOS_RETORNO = {"checkValidity": "boolean", "reportValidity": "boolean"}
TIPOS_JS = {"String": "string", "Number": "number", "Boolean": "boolean", "Array": "Array<OpcionGota | string>"}


def tipo_ts(propiedad):
    if propiedad["opciones"]:
        return " | ".join(json.dumps(o) for o in propiedad["opciones"])
    tipo = TIPOS_JS[propiedad["tipo"]]
    return f"{tipo} | null" if propiedad["defecto"] is None else tipo


def leer_firma(firma):
    """«incrementar(veces = 1)» → ("incrementar", [("veces", "number", True)])"""
    nombre, resto = firma.split("(", 1)
    parametros = []
    for trozo in filter(None, (t.strip() for t in resto.rstrip(")").split(","))):
        parametro, _, defecto = (s.strip() for s in trozo.partition("="))
        parametros.append((parametro, TIPOS_PARAMETRO.get(parametro, "unknown"), bool(defecto)))
    return nombre, parametros


def tipo_evento(evento):
    if evento.get("tipoDetalle"):
        return f"CustomEvent<{evento['tipoDetalle']}>"
    return "Event" if evento["nombre"] in ("input", "change") else "CustomEvent<Record<string, never>>"


def comentario(texto, sangria="\t"):
    return f"{sangria}/** {texto.replace('*/', '*∕')} */"


def manifiesto_estandar(componentes, version):
    """Custom Elements Manifest 2.1: https://github.com/webcomponents/custom-elements-manifest"""
    modulo = "dist/gota.mjs"
    declaraciones, exportaciones = [], []
    for c in componentes:
        atributos = [{
            "name": p["atributo"], "fieldName": p["nombre"], "type": {"text": tipo_ts(p)},
            "default": json.dumps(p["defecto"], ensure_ascii=False), "description": p["descripcion"],
        } for p in c["propiedades"] if p["atributo"]]
        miembros = [{
            "kind": "field", "name": p["nombre"], "type": {"text": tipo_ts(p)},
            "default": json.dumps(p["defecto"], ensure_ascii=False), "description": p["descripcion"],
            **({"attribute": p["atributo"]} if p["atributo"] else {}),
        } for p in c["propiedades"]]
        for m in c["metodos"]:
            nombre, parametros = leer_firma(m["firma"])
            miembros.append({
                "kind": "method", "name": nombre, "description": m["descripcion"],
                "parameters": [{"name": n, "type": {"text": t}, "optional": o} for n, t, o in parametros],
                "return": {"type": {"text": TIPOS_RETORNO.get(nombre, "void")}},
            })
        declaraciones.append({
            "kind": "class", "name": c["clase"], "tagName": c["etiqueta"], "customElement": True,
            "description": c["descripcion"],
            "superclass": {"name": "GotaControl" if c["esControl"] else "GotaElemento", "module": modulo},
            "attributes": atributos, "members": miembros,
            "events": [{"name": e["nombre"], "type": {"text": tipo_evento(e)}, "description": e["descripcion"]} for e in c["eventos"]],
            "cssParts": [{"name": p["nombre"], "description": p["descripcion"]} for p in c["partes"]],
        })
        exportaciones += [
            {"kind": "js", "name": c["clase"], "declaration": {"name": c["clase"], "module": modulo}},
            {"kind": "custom-element-definition", "name": c["etiqueta"], "declaration": {"name": c["clase"], "module": modulo}},
        ]
    return {
        "schemaVersion": "2.1.0",
        "readme": f"gota {version}",
        "modules": [{"kind": "javascript-module", "path": modulo, "declarations": declaraciones, "exports": exportaciones}],
    }


def tipos_typescript(componentes, version):
    lineas = [
        f"/*! gota {version} · tipos generados por construir.py a partir de los metadatos. No se edita a mano. */",
        "",
        "/** Opción de gota-selector y gota-filtros. También se puede dar solo el texto. */",
        "export interface OpcionGota {",
        "\tvalor: string;",
        "\ttexto?: string;",
        "\t/** Tono (0-360) del punto de color. */",
        "\ttono?: number | null;",
        "\tcantidad?: number;",
        "\tdesactivada?: boolean;",
        "}",
        "",
        'export type EstadoNivel = "agotado" | "bajo" | "normal" | "lleno";',
        "",
        "export declare class GotaElemento extends HTMLElement {",
        "\tstatic readonly etiqueta: string;",
        "\tstatic readonly descripcion: string;",
        "\t/** Registra la etiqueta si aún no lo está. */",
        "\tstatic definir(): void;",
        "}",
        "",
        "/** Base de los componentes que se envían con un formulario (form-associated). */",
        "export declare class GotaControl extends GotaElemento {",
        "\tstatic readonly formAssociated: true;",
        "\treadonly form: HTMLFormElement | null;",
        "\treadonly labels: NodeList;",
        "\treadonly validity: ValidityState;",
        "\treadonly validationMessage: string;",
        "\treadonly willValidate: boolean;",
        "}",
        "",
    ]
    globales = {}
    for c in componentes:
        clase, mapa = c["clase"], f"{c['clase']}EventMap"
        propios = [e for e in c["eventos"] if e["nombre"] not in ("input", "change")]
        for e in propios:
            globales.setdefault(e["nombre"], [])
            if tipo_evento(e) not in globales[e["nombre"]]:
                globales[e["nombre"]].append(tipo_evento(e))

        lineas.append(f"export interface {mapa} extends HTMLElementEventMap {{")
        for e in propios:
            lineas += [comentario(e["descripcion"]), f'\t"{e["nombre"]}": {tipo_evento(e)};']
        lineas += ["}", ""]

        lineas += [f"/**\n * {c['descripcion']}\n * @example {c['ejemplo']}\n */",
                   f"export declare class {clase} extends {'GotaControl' if c['esControl'] else 'GotaElemento'} {{"]
        for p in c["propiedades"]:
            lineas += [comentario(f"{p['descripcion']} Por defecto: {json.dumps(p['defecto'], ensure_ascii=False)}."), f"\t{p['nombre']}: {tipo_ts(p)};"]
        for m in c["metodos"]:
            nombre, parametros = leer_firma(m["firma"])
            argumentos = ", ".join(f"{n}{'?' if o else ''}: {t}" for n, t, o in parametros)
            lineas += [comentario(m["descripcion"]), f"\t{nombre}({argumentos}): {TIPOS_RETORNO.get(nombre, 'void')};"]
        opciones = "options?: boolean | AddEventListenerOptions"
        lineas += [
            f"\taddEventListener<K extends keyof {mapa}>(type: K, listener: (this: {clase}, ev: {mapa}[K]) => any, {opciones}): void;",
            f"\taddEventListener(type: string, listener: EventListenerOrEventListenerObject, {opciones}): void;",
            f"\tremoveEventListener<K extends keyof {mapa}>(type: K, listener: (this: {clase}, ev: {mapa}[K]) => any, options?: boolean | EventListenerOptions): void;",
            "\tremoveEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;",
            "}", "",
        ]

    clases = [c["clase"] for c in componentes]
    lineas += [
        "/** Mueve una gota hasta un elemento estirándola por el camino (animación FLIP). */",
        "export declare function moverGota(gota: HTMLElement, destino: Element | null, opciones?: { animar?: boolean }): void;",
        "",
        "/** Metadatos de todos los componentes: de aquí salen la documentación, el banco y las pruebas. */",
        "export declare function manifiesto(): Array<{",
        "\tetiqueta: string; clase: string; descripcion: string; ejemplo: string; esControl: boolean;",
        "\tpropiedades: Array<{ nombre: string; atributo: string | null; tipo: string; defecto: unknown; opciones: string[] | null; descripcion: string }>;",
        "\teventos: Array<{ nombre: string; detalle: string; tipoDetalle?: string; descripcion: string }>;",
        "\tmetodos: Array<{ firma: string; descripcion: string }>;",
        "\tpartes: Array<{ nombre: string; descripcion: string }>;",
        "}>;",
        "",
        "export declare const VERSION: string;",
        "",
        "declare global {",
        "\tinterface HTMLElementTagNameMap {",
        *[f'\t\t"{c["etiqueta"]}": {c["clase"]};' for c in componentes],
        "\t}",
        "\t/** Los eventos de gota salen del Shadow DOM y suben hasta document. */",
        "\tinterface GlobalEventHandlersEventMap {",
        *[f'\t\t"{nombre}": {" | ".join(tipos)};' for nombre, tipos in globales.items()],
        "\t}",
        "\t/** Con el script clásico (dist/gota.js) todo queda en window.gota. */",
        "\tinterface Window {",
        "\t\tgota: {",
        "\t\t\tGotaElemento: typeof GotaElemento; GotaControl: typeof GotaControl;",
        *[f"\t\t\t{n}: typeof {n};" for n in clases],
        "\t\t\tmoverGota: typeof moverGota; manifiesto: typeof manifiesto; VERSION: string;",
        "\t\t};",
        "\t}",
        "}",
        "",
    ]
    return "\n".join(lineas)


def datos_html(componentes):
    """Formato html.customData de VS Code: autocompletado y ayuda al pasar el ratón en los .html."""
    etiquetas = []
    for c in componentes:
        atributos = []
        for p in c["propiedades"]:
            if not p["atributo"]:
                continue
            atributo = {"name": p["atributo"], "description": f"{p['descripcion']} Por defecto: {json.dumps(p['defecto'], ensure_ascii=False)}."}
            if p["opciones"]:
                atributo["values"] = [{"name": o} for o in p["opciones"]]
            elif p["tipo"] == "Boolean":
                atributo["valueSet"] = "v"
            atributos.append(atributo)
        etiquetas.append({
            "name": c["etiqueta"],
            "description": {"kind": "markdown", "value": f"{c['descripcion']}\n\n```html\n{c['ejemplo']}\n```"},
            "attributes": atributos,
        })
    return {"version": 1.1, "tags": etiquetas}


def generar_api(version):
    """Los metadatos viven en el JavaScript, así que se leen en un navegador real."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  · Sin Playwright: docs/API.md y los formatos para herramientas se quedan como estaban")
        return
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page()
        pagina.goto("about:blank")
        pagina.add_script_tag(path=str(DIST / "gota.js"))
        componentes = pagina.evaluate("gota.manifiesto()")
        navegador.close()
    (RAIZ / "docs" / "API.md").write_text(markdown_api(componentes, version), encoding="utf-8")
    escribir_json(DIST / "custom-elements.json", manifiesto_estandar(componentes, version))
    (DIST / "gota.d.ts").write_text(tipos_typescript(componentes, version), encoding="utf-8")
    escribir_json(DIST / "gota.html-data.json", datos_html(componentes))
    print("  · docs/API.md, dist/custom-elements.json, dist/gota.d.ts y dist/gota.html-data.json")


def escribir_json(ruta, datos):
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8")


def empaquetar(version):
    """Un paquete de npm es un .tar.gz con todo dentro de una carpeta package/."""
    destino = DIST / f"gota-{version}.tgz"
    for antiguo in DIST.glob("gota-*.tgz"):
        antiguo.unlink()
    with open(destino, "wb") as salida:
        with gzip.GzipFile(fileobj=salida, mode="wb", mtime=0) as comprimido:
            with tarfile.open(fileobj=comprimido, mode="w") as tar:
                for relativa in EMPAQUETADOS:
                    contenido = (RAIZ / relativa).read_bytes()
                    info = tarfile.TarInfo(f"package/{relativa}")
                    info.size = len(contenido)
                    info.mode = 0o644
                    tar.addfile(info, io.BytesIO(contenido))
    return destino


def main():
    version = json.loads((RAIZ / "package.json").read_text(encoding="utf-8"))["version"]
    print(f"gota {version}")
    unir(version)
    print("  · dist/gota.js y dist/gota.mjs")
    generar_api(version)
    faltan = [r for r in ["docs/API.md", *GENERADOS] if not (RAIZ / r).exists()]
    if faltan:
        sys.exit(f"Falta {', '.join(faltan)}: instala Playwright y vuelve a construir.")
    paquete = empaquetar(version)
    tam = (DIST / "gota.js").stat().st_size
    comprimido = len(gzip.compress((DIST / "gota.js").read_bytes()))
    print(f"  · {paquete.relative_to(RAIZ)}")
    print(f"  gota.js: {tam / 1024:.1f} KB ({comprimido / 1024:.1f} KB con gzip)")


if __name__ == "__main__":
    main()
