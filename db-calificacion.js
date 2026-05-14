/**
 * db.calificaciones.js
 * Entidad: Calificación
 * Milestone 1 — Semana 1
 * Integrante 4 — Group Nine Team Narcizo
 *
 * Este archivo define la estructura y los datos iniciales
 * de la entidad Calificación. NO contiene lógica ni menús.
 * calificaciones.js lo importa para hacer las conexiones.
 */

// ─────────────────────────────────────────────
// SCHEMA (referencia de la estructura)
// ─────────────────────────────────────────────
//
// {
//   id          : Number   → identificador único del registro
//   legajo      : String   → legajo del estudiante (FK → db.estudiantes)
//   materiaId   : Number   → id de la materia     (FK → db.materias)
//   parcial1    : Number | null  → nota parcial 1 (0-10)
//   parcial2    : Number | null  → nota parcial 2 (0-10)
//   final       : Number | null  → nota final      (0-10)
//   publicada   : Boolean  → true si el docente ya publicó las notas
//   fechaCarga  : String   → fecha ISO "YYYY-MM-DD" de la última modificación
// }

// ─────────────────────────────────────────────
// DATOS INICIALES DE PRUEBA
// ─────────────────────────────────────────────

const calificaciones = [
  // ── Matemática I (materiaId: 1) ──────────────────────────
  {
    id: 1,
    legajo: "U001",
    materiaId: 1,
    parcial1: 8,
    parcial2: 7,
    final: 8,
    publicada: true,
    fechaCarga: "2025-06-10",
  },
  {
    id: 2,
    legajo: "U002",
    materiaId: 1,
    parcial1: 4,
    parcial2: 5,
    final: 4,
    publicada: true,
    fechaCarga: "2025-06-10",
  },
  {
    id: 3,
    legajo: "U003",
    materiaId: 1,
    parcial1: 9,
    parcial2: 10,
    final: 9,
    publicada: true,
    fechaCarga: "2025-06-10",
  },

  // ── Algoritmos y Estructuras (materiaId: 2) ──────────────
  {
    id: 4,
    legajo: "U004",
    materiaId: 2,
    parcial1: 6,
    parcial2: 7,
    final: 7,
    publicada: true,
    fechaCarga: "2025-06-11",
  },
  {
    id: 5,
    legajo: "U005",
    materiaId: 2,
    parcial1: null,
    parcial2: null,
    final: null,
    publicada: false,
    fechaCarga: null,
  },

  // ── Física I (materiaId: 3) ──────────────────────────────
  {
    id: 6,
    legajo: "U001",
    materiaId: 3,
    parcial1: 7,
    parcial2: 8,
    final: null,
    publicada: false,
    fechaCarga: null,
  },
];

// ─────────────────────────────────────────────
// HELPERS BÁSICOS DE LA ENTIDAD
// (sin readline, sin menú, solo operaciones sobre los datos)
// ─────────────────────────────────────────────

/**
 * Devuelve todas las calificaciones.
 */
function getAll() {
  return calificaciones;
}

/**
 * Busca una calificación por legajo y materiaId.
 * @param {string} legajo
 * @param {number} materiaId
 * @returns {Object|undefined}
 */
function findByLegajoYMateria(legajo, materiaId) {
  return calificaciones.find(
    (c) =>
      c.legajo.toUpperCase() === legajo.toUpperCase() &&
      c.materiaId === parseInt(materiaId)
  );
}

/**
 * Devuelve todas las calificaciones de un estudiante.
 * @param {string} legajo
 * @returns {Object[]}
 */
function findByLegajo(legajo) {
  return calificaciones.filter(
    (c) => c.legajo.toUpperCase() === legajo.toUpperCase()
  );
}

/**
 * Devuelve todas las calificaciones de una materia.
 * @param {number} materiaId
 * @returns {Object[]}
 */
function findByMateria(materiaId) {
  return calificaciones.filter((c) => c.materiaId === parseInt(materiaId));
}

/**
 * Agrega una nueva calificación.
 * @param {Object} nueva
 * @returns {Object} el registro creado
 */
function agregar(nueva) {
  const id = calificaciones.length > 0
    ? Math.max(...calificaciones.map((c) => c.id)) + 1
    : 1;

  const registro = {
    id,
    legajo: nueva.legajo,
    materiaId: nueva.materiaId,
    parcial1: nueva.parcial1 ?? null,
    parcial2: nueva.parcial2 ?? null,
    final: nueva.final ?? null,
    publicada: false,
    fechaCarga: new Date().toISOString().split("T")[0],
  };

  calificaciones.push(registro);
  return registro;
}

/**
 * Actualiza una calificación existente por legajo y materiaId.
 * @param {string} legajo
 * @param {number} materiaId
 * @param {Object} cambios  → { parcial1?, parcial2?, final?, publicada? }
 * @returns {Object|null} el registro actualizado, o null si no existe
 */
function actualizar(legajo, materiaId, cambios) {
  const cal = findByLegajoYMateria(legajo, materiaId);
  if (!cal) return null;

  if (cambios.parcial1  !== undefined) cal.parcial1  = cambios.parcial1;
  if (cambios.parcial2  !== undefined) cal.parcial2  = cambios.parcial2;
  if (cambios.final     !== undefined) cal.final     = cambios.final;
  if (cambios.publicada !== undefined) cal.publicada = cambios.publicada;

  cal.fechaCarga = new Date().toISOString().split("T")[0];
  return cal;
}

/**
 * Publica todas las calificaciones de una materia que tengan final cargado.
 * @param {number} materiaId
 * @returns {Object[]} las calificaciones que fueron publicadas
 */
function publicarPorMateria(materiaId) {
  const pendientes = calificaciones.filter(
    (c) => c.materiaId === parseInt(materiaId) && !c.publicada && c.final !== null
  );
  pendientes.forEach((c) => {
    c.publicada = true;
    c.fechaCarga = new Date().toISOString().split("T")[0];
  });
  return pendientes;
}

/**
 * Calcula el promedio de notas de una calificación.
 * Solo toma los valores no nulos.
 * @param {Object} cal
 * @returns {string|null} promedio con 1 decimal, o null si no hay notas
 */
function calcularPromedio(cal) {
  const notas = [cal.parcial1, cal.parcial2, cal.final].filter((n) => n !== null);
  if (notas.length === 0) return null;
  return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
}

// ─────────────────────────────────────────────
// EXPORTACIONES
// ─────────────────────────────────────────────

module.exports = {
  // datos crudos (para acceso directo si hace falta)
  calificaciones,

  // operaciones
  getAll,
  findByLegajoYMateria,
  findByLegajo,
  findByMateria,
  agregar,
  actualizar,
  publicarPorMateria,
  calcularPromedio,
};