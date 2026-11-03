/* =========================================================
   REGISTRO Y API PÚBLICA
   ========================================================= */
const COMPONENTES = [GotaCampo, GotaCantidad, GotaSelector, GotaFecha, GotaInterruptor, GotaClave, GotaFiltros, GotaPaginador, GotaNivel];

COMPONENTES.forEach((componente) => componente.definir());

/** Devuelve la API de todos los componentes como datos: de aquí salen la documentación y el banco de pruebas */
function manifiesto() {
	return COMPONENTES.map((componente) => ({
		etiqueta: componente.etiqueta,
		clase: componente.name,
		descripcion: componente.descripcion,
		ejemplo: componente.ejemplo,
		esControl: componente.formAssociated === true,
		propiedades: Object.entries(componente.todasLasPropiedades()).map(([nombre, p]) => ({
			nombre,
			atributo: p.atributo === false ? null : (p.atributo || nombreAtributo(nombre)),
			tipo: p.tipo.name,
			defecto: p.defecto,
			opciones: p.opciones || null,
			descripcion: p.descripcion
		})),
		eventos: Object.entries(componente.todosLosEventos()).map(([nombre, e]) => ({ nombre, ...e })),
		metodos: Object.entries(componente.todosLosMetodos()).map(([firma, descripcion]) => ({ firma, descripcion })),
		partes: Object.entries(componente.partes).map(([nombre, descripcion]) => ({ nombre, descripcion }))
	}));
}

const VERSION = "__VERSION__";
