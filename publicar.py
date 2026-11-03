#!/usr/bin/env python3
"""
Publica serena | iu en https://iu.serenaesteve.com.

    python3 publicar.py                # pone las versiones y copia a la web
    python3 publicar.py --sin-copiar   # solo pone las versiones

1. A cada CSS y JS propio que cargan index.html y login.html le pone ?v=<huella de su contenido>.
   El servidor guarda en caché un año los archivos con ?v=, y no guarda nunca las páginas,
   así que quien vuelva a entrar recibe lo nuevo sin recargar a mano, y lo que no ha cambiado
   no se vuelve a descargar.
2. Copia la carpeta a /var/www/html/serena-iu (sin .git) con rsync.
"""
import hashlib
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PAGINAS = ["index.html", "login.html"]
DESTINO = "/var/www/html/serena-iu/"

# href="css/estilo.css" o src="js/aplicacion.js?v=1a2b3c4d"; las direcciones con http no se tocan
RECURSO = re.compile(r'(?P<atributo>href|src)="(?P<ruta>(?!https?:|//)[^"?#]+\.(?:css|js))(?:\?v=[\w]*)?"')


def huella(ruta):
    return hashlib.sha256((RAIZ / ruta).read_bytes()).hexdigest()[:10]


def versionar():
    for nombre in PAGINAS:
        pagina = RAIZ / nombre
        antes = pagina.read_text(encoding="utf-8")
        despues = RECURSO.sub(lambda m: f'{m["atributo"]}="{m["ruta"]}?v={huella(m["ruta"])}"', antes)
        if despues != antes:
            pagina.write_text(despues, encoding="utf-8")
        for ruta, version in re.findall(r'="([^"]+\.(?:css|js))\?v=(\w+)"', despues):
            print(f"  {nombre}: {ruta}?v={version}")


def copiar():
    subprocess.run(["rsync", "-a", "--delete", "--exclude", ".git", f"{RAIZ}/", DESTINO], check=True)
    print(f"  Copiado en {DESTINO}")


if __name__ == "__main__":
    versionar()
    if "--sin-copiar" not in sys.argv:
        copiar()
