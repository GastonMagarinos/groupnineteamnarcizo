// ─── Importar todas las DBs ───────────────────────────────
const { buscarEstudiante, listarEstudiantes }                                = require("./db-estudiante");
const { periodoHabilitado, listarDocentes }                                  = require("./db-docente");
const { buscarMateria, listarMaterias }                                      = require("./db-materia");
const { buscarCalificacion, guardarCalificacion, publicarCalificaciones,
        calificacionesPorEstudiante, calificacionesPorMateria,
        estadisticasMateria, rankingPromedios }                               = require("./db-calificacion");
const { enviarNotificacion, obtenerNotificaciones, marcarLeida,
        registrarAuditoria, obtenerLog,
        generarReporte, obtenerReportes, exportarExcel }                     = require("./db-notificacion");
        // Publicar en DB — Integrante 4
publicarCalificaciones(matId);

// Notificar — Integrante 5
pendientes.forEach((c) => {
  const est = buscarEstudiante(c.legajo);
  const msg = `Tus notas de "${materia.nombre}" están disponibles. Final: ${c.final}`;
  enviarNotificacion(c.legajo, msg);
  console.log(colorVerde(`  ✓ Notificación enviada a ${est?.nombre}`));
});