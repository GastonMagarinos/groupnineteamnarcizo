/**
 * DB — Estudiante + Carrera
 * Integrante 1 — Milestone 1
 *
 * Define las estructuras de datos para Carrera y Estudiante,
 * sus datos de ejemplo y todas las funciones helper para
 * trabajar con ellas. Se integra al objeto `db` principal.
 */

// ─────────────────────────────────────────────
// ENTIDAD: Carrera
// ─────────────────────────────────────────────
// Campos:
//   id       {number}  — identificador único
//   nombre   {string}  — nombre de la carrera
//   duracion {number}  — duración en años
//   activa   {boolean} — si la carrera está vigente

const carreras = [
  { id: 1, nombre: "Ingeniería en Sistemas",       duracion: 5, activa: true  },
  { id: 2, nombre: "Ingeniería Industrial",         duracion: 5, activa: true  },
  { id: 3, nombre: "Licenciatura en Informática",   duracion: 4, activa: true  },
  { id: 4, nombre: "Tecnicatura en Programación",   duracion: 3, activa: true  },
  { id: 5, nombre: "Ingeniería Electrónica",        duracion: 5, activa: false },
];

// ─────────────────────────────────────────────
// ENTIDAD: Estudiante
// ─────────────────────────────────────────────
// Campos:
//   legajo    {string}  — identificador único (ej: "U001")
//   nombre    {string}  — nombre completo
//   email     {string}  — correo institucional
//   carreraId {number}  — FK → carreras.id
//   anioIngreso {number} — año en que ingresó
//   activo    {boolean} — si el estudiante está inscripto

const estudiantes = [
  { legajo: "U001", nombre: "Ana García",        email: "ana.garcia@uni.edu",        carreraId: 1, anioIngreso: 2023, activo: true  },
  { legajo: "U002", nombre: "Bruno Martínez",    email: "bruno.martinez@uni.edu",    carreraId: 1, anioIngreso: 2022, activo: true  },
  { legajo: "U003", nombre: "Carla López",       email: "carla.lopez@uni.edu",       carreraId: 3, anioIngreso: 2023, activo: true  },
  { legajo: "U004", nombre: "Diego Fernández",   email: "diego.fernandez@uni.edu",   carreraId: 2, anioIngreso: 2021, activo: true  },
  { legajo: "U005", nombre: "Elena Rodríguez",   email: "elena.rodriguez@uni.edu",   carreraId: 4, anioIngreso: 2024, activo: true  },
];

// ─────────────────────────────────────────────
// HELPERS — Carrera
// ─────────────────────────────────────────────

/** Devuelve una carrera por su id, o undefined si no existe */
const buscarCarrera = (id) =>
  carreras.find((c) => c.id === parseInt(id));

/** Devuelve solo las carreras activas */
const carrerasActivas = () =>
  carreras.filter((c) => c.activa);

/** Agrega una carrera nueva. Devuelve la carrera creada. */
const agregarCarrera = ({ nombre, duracion, activa = true }) => {
  const id = carreras.length > 0 ? Math.max(...carreras.map((c) => c.id)) + 1 : 1;
  const nueva = { id, nombre, duracion, activa };
  carreras.push(nueva);
  return nueva;
};

// ─────────────────────────────────────────────
// HELPERS — Estudiante
// ─────────────────────────────────────────────

/** Devuelve un estudiante por legajo (insensible a mayúsculas) */
const buscarEstudiante = (legajo) =>
  estudiantes.find((e) => e.legajo.toUpperCase() === legajo.toUpperCase());

/** Devuelve todos los estudiantes de una carrera */
const estudiantesPorCarrera = (carreraId) =>
  estudiantes.filter((e) => e.carreraId === parseInt(carreraId) && e.activo);

/**
 * Agrega un estudiante nuevo.
 * Valida que el legajo no exista y que la carrera sea válida.
 * Devuelve { ok: true, estudiante } o { ok: false, error }
 */
const agregarEstudiante = ({ legajo, nombre, email, carreraId, anioIngreso }) => {
  if (!legajo || !nombre || !email || !carreraId || !anioIngreso) {
    return { ok: false, error: "Todos los campos son obligatorios." };
  }
  if (buscarEstudiante(legajo)) {
    return { ok: false, error: `El legajo ${legajo} ya existe.` };
  }
  if (!buscarCarrera(carreraId)) {
    return { ok: false, error: `La carrera con id ${carreraId} no existe.` };
  }
  const nuevo = { legajo: legajo.toUpperCase(), nombre, email, carreraId: parseInt(carreraId), anioIngreso: parseInt(anioIngreso), activo: true };
  estudiantes.push(nuevo);
  return { ok: true, estudiante: nuevo };
};

/**
 * Da de baja (lógica) a un estudiante.
 * Devuelve true si se encontró y desactivó, false si no existía.
 */
const darDeBajaEstudiante = (legajo) => {
  const est = buscarEstudiante(legajo);
  if (!est) return false;
  est.activo = false;
  return true;
};

// ─────────────────────────────────────────────
// INTEGRACIÓN CON EL DB PRINCIPAL
// ─────────────────────────────────────────────
// Para usar junto con calificaciones.js, extendé el objeto `db`
// con estas dos propiedades al inicio del archivo:
//
//   const db = {
//     carreras,       // ← agregar esto
//     estudiantes,    // ← reemplaza el array original
//     periodoActivo: { ... },
//     materias: [ ... ],
//     calificaciones: [ ... ],
//     notificaciones: [],
//     logAuditoria: [],
//   };
//
// Y reemplazá la función buscarEstudiante() existente por la de este archivo,
// que además incluye validación de carrera y estado activo.

// ─────────────────────────────────────────────
// EXPORTS (para uso como módulo)
// ─────────────────────────────────────────────

module.exports = {
  // Datos
  carreras,
  estudiantes,
  // Helpers Carrera
  buscarCarrera,
  carrerasActivas,
  agregarCarrera,
  // Helpers Estudiante
  buscarEstudiante,
  estudiantesPorCarrera,
  agregarEstudiante,
  darDeBajaEstudiante,
};