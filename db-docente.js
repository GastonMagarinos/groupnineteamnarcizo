/**
 * db-docente.js — Integrante 2 (versión limpia)
 * Entidades: Docente + Administrador + Período de carga
 */

const docentes = [
  { id: 1, legajo: "D001", nombre: "Prof. García",   email: "garcia@uni.edu"   },
  { id: 2, legajo: "D002", nombre: "Prof. Martínez", email: "martinez@uni.edu" },
];

const administradores = [
  { id: 1, nombre: "Admin Principal", email: "admin@uni.edu", rol: "admin" },
];

const periodos = [
  { id: 1, inicio: "2025-03-01", cierre: "2026-12-31", activo: true },
];

const excepciones = []; // { docenteId, hasta }

const buscarDocente     = (legajo) => docentes.find((d) => d.legajo === legajo);
const listarDocentes    = () => docentes;
const getPeriodoActivo  = () => periodos.find((p) => p.activo) || null;

const periodoHabilitado = (docenteId = null) => {
  const hoy    = new Date().toISOString().split("T")[0];
  const periodo = getPeriodoActivo();
  if (periodo && hoy >= periodo.inicio && hoy <= periodo.cierre) return true;
  if (docenteId) {
    return excepciones.some((e) => e.docenteId === docenteId && e.hasta >= hoy);
  }
  return false;
};

const crearPeriodo      = (inicio, cierre) => {
  periodos.forEach((p) => (p.activo = false));
  const nuevo = { id: periodos.length + 1, inicio, cierre, activo: true };
  periodos.push(nuevo);
  return nuevo;
};

const agregarExcepcion  = (docenteId, hasta) => {
  excepciones.push({ docenteId, hasta });
  return { docenteId, hasta };
};

module.exports = { buscarDocente, listarDocentes, getPeriodoActivo, periodoHabilitado, crearPeriodo, agregarExcepcion };
