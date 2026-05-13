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