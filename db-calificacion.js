/**
 * db-calificacion.js — Integrante 4 (versión limpia)
 * Entidad: Calificación
 */

const calificaciones = [
  { legajo: "U001", materiaId: 1, parcial1: 8,    parcial2: 7,    final: 8,    publicada: true,  fechaCarga: "2025-06-10" },
  { legajo: "U002", materiaId: 1, parcial1: 4,    parcial2: 5,    final: 4,    publicada: true,  fechaCarga: "2025-06-10" },
  { legajo: "U003", materiaId: 1, parcial1: 9,    parcial2: 10,   final: 9,    publicada: true,  fechaCarga: "2025-06-10" },
  { legajo: "U004", materiaId: 2, parcial1: 6,    parcial2: 7,    final: 7,    publicada: true,  fechaCarga: "2025-06-11" },
  { legajo: "U005", materiaId: 2, parcial1: null, parcial2: null, final: null, publicada: false, fechaCarga: null         },
  { legajo: "U001", materiaId: 3, parcial1: 7,    parcial2: 8,    final: null, publicada: false, fechaCarga: null         },
];

const buscarCalificacion = (legajo, materiaId) =>
  calificaciones.find((c) => c.legajo.toUpperCase() === legajo.toUpperCase() && c.materiaId === parseInt(materiaId));

const calificacionesPorEstudiante = (legajo) =>
  calificaciones.filter((c) => c.legajo.toUpperCase() === legajo.toUpperCase());

const calificacionesPorMateria = (materiaId) =>
  calificaciones.filter((c) => c.materiaId === parseInt(materiaId));

const guardarCalificacion = ({ legajo, materiaId, parcial1, parcial2, final }) => {
  const cal   = buscarCalificacion(legajo, materiaId);
  const fecha = new Date().toISOString().split("T")[0];
  if (cal) {
    if (parcial1 !== null) cal.parcial1 = parcial1;
    if (parcial2 !== null) cal.parcial2 = parcial2;
    if (final    !== null) cal.final    = final;
    cal.fechaCarga = fecha;
    return { accion: "actualizado" };
  }
  calificaciones.push({ legajo: legajo.toUpperCase(), materiaId: parseInt(materiaId), parcial1: parcial1 ?? null, parcial2: parcial2 ?? null, final: final ?? null, publicada: false, fechaCarga: fecha });
  return { accion: "creado" };
};

const publicarCalificaciones = (materiaId) => {
  let cant = 0;
  calificaciones.forEach((c) => {
    if (c.materiaId === parseInt(materiaId) && !c.publicada && c.final !== null) {
      c.publicada = true;
      cant++;
    }
  });
  return cant;
};

const estadisticasMateria = (materiaId) => {
  const cals = calificacionesPorMateria(materiaId).filter((c) => c.final !== null);
  if (cals.length === 0) return null;
  const notas    = cals.map((c) => c.final);
  const promedio = (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2);
  const sorted   = [...notas].sort((a, b) => a - b);
  const mediana  = sorted.length % 2 === 0
    ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(1)
    : sorted[Math.floor(sorted.length / 2)].toFixed(1);
  return { total: cals.length, promedio, mediana, aprobados: cals.filter((c) => c.final >= 6).length, aplazados: cals.filter((c) => c.final < 6).length };
};

const rankingPromedios = () => {
  const porLegajo = {};
  calificaciones.filter((c) => c.final !== null).forEach((c) => {
    if (!porLegajo[c.legajo]) porLegajo[c.legajo] = [];
    porLegajo[c.legajo].push(c.final);
  });
  return Object.entries(porLegajo)
    .map(([legajo, notas]) => ({ legajo, promedio: (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) }))
    .sort((a, b) => b.promedio - a.promedio);
};

module.exports = { buscarCalificacion, calificacionesPorEstudiante, calificacionesPorMateria, guardarCalificacion, publicarCalificaciones, estadisticasMateria, rankingPromedios };
