#!/usr/bin/env python3
"""
Ejecuta las pruebas unitarias en navegadores reales, sin ventana.

    python3 pruebas/ejecutar.py                      # Chromium, con dist/gota.js
    python3 pruebas/ejecutar.py chromium firefox webkit
    python3 pruebas/ejecutar.py --paquete            # prueba lo que hay DENTRO del .tgz

Cada navegador hace dos pasadas: todas las pruebas con el esquema claro y, después,
las de accesibilidad otra vez con el esquema oscuro (el contraste cambia con él).

Sin Playwright, basta con servir la carpeta y abrir pruebas/index.html en cualquier navegador.
"""
import functools
import http.server
import shutil
import sys
import tarfile
import tempfile
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent


class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def servir(carpeta):
    manejador = functools.partial(Silencioso, directory=str(carpeta))
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), manejador)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    return servidor


def preparar_paquete(destino):
    """Copia las pruebas y descomprime el .tgz al lado: solo se usa lo que trae el paquete."""
    paquete = next((RAIZ / "dist").glob("gota-*.tgz"))
    shutil.copytree(RAIZ / "pruebas", destino / "pruebas")
    with tarfile.open(paquete) as tar:
        tar.extractall(destino, filter="data")
    print(f"Paquete: {paquete.name}")
    return "?paquete=../package/dist/gota.js"


def main():
    argumentos = sys.argv[1:]
    con_paquete = "--paquete" in argumentos
    navegadores = [a for a in argumentos if not a.startswith("--")] or ["chromium"]
    temporal = tempfile.mkdtemp(prefix="gota-pruebas-")
    consulta = preparar_paquete(Path(temporal)) if con_paquete else ""
    servidor = servir(temporal if con_paquete else RAIZ)
    url = f"http://127.0.0.1:{servidor.server_address[1]}/pruebas/index.html{consulta}"
    errores = 0

    pasadas = [("claro", ""), ("oscuro", "grupo=Accesibilidad")]

    with sync_playwright() as p:
        for nombre in navegadores:
            navegador = getattr(p, nombre).launch()
            for esquema, filtro in pasadas:
                pagina = navegador.new_page(locale="es-ES", timezone_id="Europe/Madrid", color_scheme="light" if esquema == "claro" else "dark")
                consola = []
                pagina.on("pageerror", lambda error: consola.append(str(error)))
                pagina.goto(url + ("&" if "?" in url else "?") + filtro if filtro else url)
                pagina.wait_for_selector("html[data-terminado]", state="attached", timeout=180000)
                datos = pagina.evaluate("window.resultadosPruebas")
                fallos = datos["fallos"]
                que = "todas" if not filtro else "accesibilidad"
                print(f"{nombre} {navegador.version} · {que} · esquema {esquema}: {datos['total'] - len(fallos)}/{datos['total']} superadas")
                for fallo in fallos:
                    print(f"  ✗ {fallo['grupo']} › {fallo['nombre']}\n      {fallo['error']}")
                for error in consola:
                    print(f"  ! Error de JavaScript: {error}")
                errores += len(fallos) + len(consola)
                pagina.close()
            navegador.close()

    servidor.shutdown()
    shutil.rmtree(temporal, ignore_errors=True)
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
