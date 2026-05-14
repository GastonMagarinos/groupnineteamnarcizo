/**
 * db-estudiante.js — Integrante 1 (versión limpia sin duplicados)
 * Entidades: Estudiante + Carrera
 * Mismo estilo que el resto del grupo (arrays en memoria)
 */

// ─── Carrera ──────────────────────────────────────────────
const carreras = [
  { id: 1, nombre: "Ingeniería en Sistemas",      duracion: 5, activa: true  },
  { id: 2, nombre: "Ingeniería Industrial",        duracion: 5, activa: true  },
  { id: 3, nombre: "Licenciatura en Informática",  duracion: 4, activa: true  },
  { id: 4, nombre: "Tecnicatura en Programación",  duracion: 3, activa: true  },
  { id: 5, nombre: "Ingeniería Electrónica",       duracion: 5, activa: false },
];

// ─── Estudiante ───────────────────────────────────────────
const estudiantes = [
  { legajo: "U001", nombre: "Ana García",      email: "ana.garcia@uni.edu",      carreraId: 1, anioIngreso: 2023, activo: true },
  { legajo: "U002", nombre: "Bruno Martínez",  email: "bruno.martinez@uni.edu",  carreraId: 1, anioIngreso: 2022, activo: true },
  { legajo: "U003", nombre: "Carla López",     email: "carla.lopez@uni.edu",     carreraId: 3, anioIngreso: 2023, activo: true },
  { legajo: "U004", nombre: "Diego Fernández", email: "diego.fernandez@uni.edu", carreraId: 2, anioIngreso: 2021, activo: true },
  { legajo: "U005", nombre: "Elena Rodríguez", email: "elena.rodriguez@uni.edu", carreraId: 4, anioIngreso: 2024, activo: true },
];

// ─── Funciones ────────────────────────────────────────────
function buscarEstudiante(legajo) {
  return estudiantes.find((e) => e.legajo.toUpperCase() === legajo.toUpperCase());
}

function listarEstudiantes() {
  return estudiantes.filter((e) => e.activo);
}

function buscarCarrera(id) {
  return carreras.find((c) => c.id === parseInt(id));
}

function listarCarreras() {
  return carreras.filter((c) => c.activa);
}

function crearEstudiante({ legajo, nombre, email, carreraId, anioIngreso }) {
  if (buscarEstudiante(legajo)) return { ok: false, error: "Legajo ya existe." };
  if (!buscarCarrera(carreraId)) return { ok: false, error: "Carrera no existe." };
  const nuevo = {
    legajo: legajo.toUpperCase(), nombre, email,
    carreraId: parseInt(carreraId),
    anioIngreso: parseInt(anioIngreso),
    activo: true,
  };
  estudiantes.push(nuevo);
  return { ok: true, estudiante: nuevo };
}

// ─── Exports ──────────────────────────────────────────────
module.exports = {
  carreras,
  estudiantes,
  buscarEstudiante,
  listarEstudiantes,
  buscarCarrera,
  listarCarreras,
  crearEstudiante,
};
