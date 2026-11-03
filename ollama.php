<?php
/**
 * serena | iu · puente con Ollama
 * Igual que el ollama.php de clase, pero acepta también el modelo,
 * unas instrucciones de sistema y la petición de responder en JSON.
 *
 *   GET  → comprueba que Ollama responde y lista los modelos instalados
 *   POST → { mensaje, sistema?, modelo?, formato? }  →  { respuesta }
 *
 * Ejecutar con:  php -S localhost:8000
 *
 * En clase (peticiones desde el propio ordenador) no hay límites. Publicado en
 * internet, cualquiera podría usar el servidor como un chat gratis, así que:
 *   · solo se ofrecen los modelos pequeños de MODELOS_PUBLICOS,
 *   · cada visitante puede hacer POR_MINUTO preguntas por minuto y POR_DIA al día,
 *   · el mensaje y las instrucciones tienen un tamaño máximo y la respuesta también,
 *   · el modelo contesta de una en una: si está ocupado, se espera un poco y si no, 503.
 */

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

const OLLAMA = "http://localhost:11434";

const MODELOS_PUBLICOS = ["llama3.2:latest", "qwen2:0.5b"];
const POR_MINUTO = 5;
const POR_DIA = 60;
const MAX_MENSAJE = 600;          // caracteres de la pregunta
const MAX_SISTEMA = 20000;        // caracteres de las instrucciones (llevan los datos de la aplicación)
const MAX_RESPUESTA = 400;        // tokens que puede generar el modelo
const ESPERA_OCUPADO = 20;        // segundos que se espera a que el modelo quede libre
const TIEMPO_MAXIMO = 150;        // segundos por respuesta (el servidor no tiene GPU)
const MANTENER_CARGADO = "30m";   // el modelo y su caché siguen en memoria entre preguntas

// En el servidor (solo CPU), leer los datos del prompt (~2.400 tokens) cuesta unos 100 s la primera vez.
// Ollama guarda en caché el principio del prompt, que es igual en todas las preguntas, así que las
// siguientes tardan unos 8 s mientras el modelo siga cargado: por eso se mantiene cargado más tiempo.

$local = in_array($_SERVER["REMOTE_ADDR"] ?? "", ["127.0.0.1", "::1"], true);


// Responde con un error en el formato que espera la aplicación y termina

function error($codigo, $texto, $extra = [])
{
    http_response_code($codigo);
    echo json_encode(["ok" => false, "respuesta" => $texto] + $extra);
    exit;
}


// Carpeta para los contadores y el turno (fuera de la web)

function carpetaEstado()
{
    $carpeta = sys_get_temp_dir() . "/serena-iu-ollama";
    if (!is_dir($carpeta)) {
        @mkdir($carpeta, 0700, true);
    }
    return $carpeta;
}


// Cuenta una pregunta de esta IP. Devuelve los segundos que hay que esperar (0 si puede preguntar).
// La IP no se guarda: el archivo se llama con su huella.

function esperaPorLimite()
{
    $ip = $_SERVER["REMOTE_ADDR"] ?? "desconocida";
    $archivo = carpetaEstado() . "/" . hash("sha256", "serena-iu|" . $ip) . ".json";

    $f = fopen($archivo, "c+");
    flock($f, LOCK_EX);
    $marcas = json_decode(stream_get_contents($f), true) ?: [];

    $ahora = time();
    $marcas = array_values(array_filter($marcas, fn($t) => $t > $ahora - 86400));
    $ultimoMinuto = array_values(array_filter($marcas, fn($t) => $t > $ahora - 60));

    $espera = 0;
    if (count($marcas) >= POR_DIA) {
        $espera = $marcas[0] + 86400 - $ahora;
    } elseif (count($ultimoMinuto) >= POR_MINUTO) {
        $espera = $ultimoMinuto[0] + 60 - $ahora;
    } else {
        $marcas[] = $ahora;
    }

    ftruncate($f, 0);
    rewind($f);
    fwrite($f, json_encode($marcas));
    flock($f, LOCK_UN);
    fclose($f);

    return max(0, $espera);
}


// Espera turno para usar el modelo: devuelve el cerrojo o null si sigue ocupado

function pedirTurno()
{
    $turno = fopen(carpetaEstado() . "/turno.lock", "c");
    $limite = microtime(true) + ESPERA_OCUPADO;

    while (!flock($turno, LOCK_EX | LOCK_NB)) {
        if (microtime(true) > $limite) {
            fclose($turno);
            return null;
        }
        usleep(250000);
    }
    return $turno;
}


// Envía una petición a Ollama y devuelve el JSON decodificado (o null)

function ollama($ruta, $datos = null)
{
    $ch = curl_init(OLLAMA . $ruta);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $GLOBALS["local"] ? 180 : TIEMPO_MAXIMO);

    if ($datos !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datos));
    }

    $respuesta = curl_exec($ch);
    curl_close($ch);

    return $respuesta === false ? null : json_decode($respuesta, true);
}


// GET: estado y modelos disponibles

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $etiquetas = ollama("/api/tags");

    if ($etiquetas === null) {
        http_response_code(503);
        echo json_encode(["ok" => false, "error" => "Ollama no responde en " . OLLAMA]);
        exit;
    }

    $modelos = array_map(fn($m) => $m["name"], $etiquetas["models"] ?? []);

    if (!$local) {
        // Los públicos en el orden de MODELOS_PUBLICOS: la aplicación usa el primero
        $modelos = array_values(array_intersect(MODELOS_PUBLICOS, $modelos));
    }

    echo json_encode([
        "ok" => true,
        "modelos" => $modelos,
        "limites" => $local ? null : ["porMinuto" => POR_MINUTO, "porDia" => POR_DIA]
    ]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: GET, POST");
    error(405, "Solo se admiten GET y POST.");
}


// POST: generar una respuesta

$entrada = json_decode(file_get_contents("php://input"), true);

$mensaje = trim($entrada["mensaje"] ?? "");
$sistema = trim($entrada["sistema"] ?? "");
$modelo  = $entrada["modelo"] ?? "phi3:mini";

if ($mensaje === "") {
    error(400, "El prompt está vacío.");
}

// El nombre del modelo solo puede tener letras, números y . : _ -
if (!preg_match('/^[\w.:\-\/]+$/', $modelo)) {
    $modelo = "phi3:mini";
}

if (!$local) {
    if (mb_strlen($mensaje) > MAX_MENSAJE || mb_strlen($sistema) > MAX_SISTEMA) {
        error(413, "La pregunta es demasiado larga para la versión pública. Prueba con una frase más corta.");
    }

    if (!in_array($modelo, MODELOS_PUBLICOS, true)) {
        $modelo = MODELOS_PUBLICOS[0];
    }

    $espera = esperaPorLimite();
    if ($espera > 0) {
        header("Retry-After: $espera");
        $cuando = $espera < 120 ? "$espera segundos" : ceil($espera / 3600) . " horas";
        error(429, "Has hecho muchas preguntas seguidas al modelo. En la versión pública hay un límite: vuelve a intentarlo dentro de $cuando. Las órdenes habituales siguen funcionando sin él.", ["espera" => $espera]);
    }

    $turno = pedirTurno();
    if ($turno === null) {
        header("Retry-After: 30");
        error(503, "El modelo está contestando a otra persona. Vuelve a preguntar en unos segundos.");
    }
}

$datos = [
    "model"   => $modelo,
    "prompt"  => $mensaje,
    "stream"  => false,
    "options" => ["temperature" => 0.2] + ($local ? [] : ["num_predict" => MAX_RESPUESTA])
];

if (!$local) {
    $datos["keep_alive"] = MANTENER_CARGADO;
}

if ($sistema !== "") {
    $datos["system"] = $sistema;
}

// Con "format": "json" Ollama obliga al modelo a contestar con JSON válido
if (($entrada["formato"] ?? "") === "json") {
    $datos["format"] = "json";
}

$resultado = ollama("/api/generate", $datos);

if ($resultado === null) {
    error(503, "No se ha podido conectar con Ollama.");
}

echo json_encode([
    "respuesta" => $resultado["response"] ?? ($resultado["error"] ?? "No he podido responder.")
]);
