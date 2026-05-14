/**
 * db-materia.js — Integrante 3 (versión limpia)
 * Entidades: Materia + Período de carga
 */

const materias = [
  { id: 1, nombre: "Matemática I",             codigo: "MAT1", carreraId: 1, anio: 1 },
  { id: 2, nombre: "Algoritmos y Estructuras", codigo: "ALG1", carreraId: 1, anio: 1 },
  { id: 3, nombre: "Física I",                 codigo: "FIS1", carreraId: 1, anio: 1 },
];

const materiaDocente = [
  { materiaId: 1, docenteId: 1 },
  { materiaId: 2, docenteId: 2 },
  { materiaId: 3, docenteId: 1 },
];

const buscarMateria          = (id) => materias.find((m) => m.id === parseInt(id));
const listarMaterias         = () => materias;
const materiasPorDocente     = (docenteId) => {
  const ids = materiaDocente.filter((md) => md.docenteId === docenteId).map((md) => md.materiaId);
  return materias.filter((m) => ids.includes(m.id));
};
const buscarMateriaPorCodigo = (codigo) => materias.find((m) => m.codigo === codigo.toUpperCase());

module.exports = { buscarMateria, listarMaterias, materiasPorDocente, buscarMateriaPorCodigo };
