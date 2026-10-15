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
 */

header("Content-Type: application/json; charset=utf-8");

const OLLAMA = "http://localhost:11434";


// Envía una petición a Ollama y devuelve el JSON decodificado (o null)

function ollama($ruta, $datos = null)
{
    $ch = curl_init(OLLAMA . $ruta);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 180);

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

    echo json_encode([
        "ok" => true,
        "modelos" => array_map(fn($m) => $m["name"], $etiquetas["models"] ?? [])
    ]);
    exit;
}


// POST: generar una respuesta

$entrada = json_decode(file_get_contents("php://input"), true);

$mensaje = trim($entrada["mensaje"] ?? "");
$sistema = trim($entrada["sistema"] ?? "");
$modelo  = $entrada["modelo"] ?? "phi3:mini";

if ($mensaje === "") {
    http_response_code(400);
    echo json_encode(["respuesta" => "El prompt está vacío."]);
    exit;
}

// El nombre del modelo solo puede tener letras, números y . : _ -
if (!preg_match('/^[\w.:\-\/]+$/', $modelo)) {
    $modelo = "phi3:mini";
}

$datos = [
    "model"   => $modelo,
    "prompt"  => $mensaje,
    "stream"  => false,
    "options" => ["temperature" => 0.2]
];

if ($sistema !== "") {
    $datos["system"] = $sistema;
}

// Con "format": "json" Ollama obliga al modelo a contestar con JSON válido
if (($entrada["formato"] ?? "") === "json") {
    $datos["format"] = "json";
}

$resultado = ollama("/api/generate", $datos);

if ($resultado === null) {
    http_response_code(503);
    echo json_encode(["respuesta" => "No se ha podido conectar con Ollama."]);
    exit;
}

echo json_encode([
    "respuesta" => $resultado["response"] ?? ($resultado["error"] ?? "No he podido responder.")
]);
