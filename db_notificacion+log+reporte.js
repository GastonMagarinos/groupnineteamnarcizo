/*
 * ─────────────────────────────────────────────────────────
 *  INTEGRANTE 5 — db-notificacion.js
 *  Entidades: Notificacion | Log de Auditoría | Reporte
 *
 *  INSTALACIÓN:
 *    npm install better-sqlite3 exceljs
 * ─────────────────────────────────────────────────────────
 */
 
const Database = require("better-sqlite3");
const ExcelJS  = require("exceljs");
const path     = require("path");
 
// ─── Conexión ─────────────────────────────────────────────
const db = new Database(path.join(__dirname, "notificacion.db"));
db.pragma("journal_mode = WAL");
 
// ─── Crear tablas ─────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS notificacion (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    legajo   TEXT    NOT NULL,
    mensaje  TEXT    NOT NULL,
    leida    INTEGER NOT NULL DEFAULT 0,
    fecha    TEXT    NOT NULL
  );
 
  CREATE TABLE IF NOT EXISTS log_auditoria (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario        TEXT    NOT NULL,
    legajo         TEXT    NOT NULL,
    materia_id     INTEGER NOT NULL,
    nota_anterior  REAL,
    nota_nueva     REAL,
    fecha          TEXT    NOT NULL
  );
 
  CREATE TABLE IF NOT EXISTS reporte (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    materia_id    INTEGER NOT NULL,
    periodo       TEXT    NOT NULL,
    total_alumnos INTEGER NOT NULL DEFAULT 0,
    aprobados     INTEGER NOT NULL DEFAULT 0,
    aplazados     INTEGER NOT NULL DEFAULT 0,
    ausentes      INTEGER NOT NULL DEFAULT 0,
    promedio      REAL,
    fecha_gen     TEXT    NOT NULL
  );
`);
 
// ─────────────────────────────────────────────────────────
//  FUNCIONES — Notificacion
// ─────────────────────────────────────────────────────────
 
function enviarNotificacion(legajo, mensaje) {
  if (!legajo || !mensaje) throw new Error("Legajo y mensaje son obligatorios.");
  const result = db.prepare(`
    INSERT INTO notificacion (legajo, mensaje, leida, fecha)
    VALUES (?, ?, 0, ?)
  `).run(legajo, mensaje, new Date().toISOString());
  return { id: result.lastInsertRowid, legajo, mensaje };
}
 
function obtenerNotificaciones(legajo) {
  return db.prepare(`
    SELECT * FROM notificacion WHERE legajo = ? ORDER BY fecha DESC
  `).all(legajo);
}
 
function marcarLeida(id) {
  const result = db.prepare("UPDATE notificacion SET leida = 1 WHERE id = ?").run(id);
  return result.changes > 0;
}
 
function limpiarLeidas(legajo) {
  const result = db.prepare("DELETE FROM notificacion WHERE legajo = ? AND leida = 1").run(legajo);
  return result.changes;
}
 
// ─────────────────────────────────────────────────────────
//  FUNCIONES — Log de Auditoría
// ─────────────────────────────────────────────────────────
 
function registrarAuditoria(usuario, legajo, materiaId, notaAnterior, notaNueva) {
  if (!usuario || !legajo || !materiaId) throw new Error("Faltan datos obligatorios.");
  const result = db.prepare(`
    INSERT INTO log_auditoria
      (usuario, legajo, materia_id, nota_anterior, nota_nueva, fecha)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(usuario, legajo, materiaId, notaAnterior ?? null, notaNueva ?? null, new Date().toISOString());
  return { id: result.lastInsertRowid };
}
 
function obtenerLog({ usuario = null, materiaId = null } = {}) {
  let query    = "SELECT * FROM log_auditoria WHERE 1=1";
  const params = [];
  if (usuario)   { query += " AND usuario = ?";    params.push(usuario);   }
  if (materiaId) { query += " AND materia_id = ?"; params.push(materiaId); }
  query += " ORDER BY fecha DESC";
  return db.prepare(query).all(...params);
}
 
function exportarLog() {
  return db.prepare("SELECT * FROM log_auditoria ORDER BY fecha DESC").all();
}
 
// ─────────────────────────────────────────────────────────
//  FUNCIONES — Reporte
// ─────────────────────────────────────────────────────────
 
function generarReporte({ materiaId, periodo, totalAlumnos, aprobados, aplazados, ausentes, promedio }) {
  if (!materiaId || !periodo) throw new Error("Materia y período son obligatorios.");
  const result = db.prepare(`
    INSERT INTO reporte
      (materia_id, periodo, total_alumnos, aprobados, aplazados, ausentes, promedio, fecha_gen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    materiaId, periodo,
    totalAlumnos ?? 0,
    aprobados    ?? 0,
    aplazados    ?? 0,
    ausentes     ?? 0,
    promedio     ?? null,
    new Date().toISOString()
  );
  return { id: result.lastInsertRowid };
}
 
function obtenerReportes(materiaId = null) {
  if (materiaId) {
    return db.prepare("SELECT * FROM reporte WHERE materia_id = ? ORDER BY fecha_gen DESC").all(materiaId);
  }
  return db.prepare("SELECT * FROM reporte ORDER BY fecha_gen DESC").all();
}
 
function compararPeriodos(materiaId, periodo1, periodo2) {
  const stmt = db.prepare("SELECT * FROM reporte WHERE materia_id = ? AND periodo = ?");
  const r1   = stmt.get(materiaId, periodo1);
  const r2   = stmt.get(materiaId, periodo2);
  if (!r1 || !r2) return null;
  return {
    materia_id          : materiaId,
    periodo1            : { ...r1, pct_aprobados: ((r1.aprobados / r1.total_alumnos) * 100).toFixed(1) },
    periodo2            : { ...r2, pct_aprobados: ((r2.aprobados / r2.total_alumnos) * 100).toFixed(1) },
    diferencia_promedio : (r2.promedio - r1.promedio).toFixed(2),
  };
}
 
async function exportarExcel(materiaId = null) {
  const reportes = obtenerReportes(materiaId);
  if (reportes.length === 0) throw new Error("Sin reportes para exportar.");
 
  const workbook   = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Calificaciones — Integrante 5";
  workbook.created = new Date();
 
  // Hoja 1: Reportes
  const sheet1 = workbook.addWorksheet("Reportes");
  sheet1.columns = [
    { header: "ID",             key: "id",            width: 6  },
    { header: "Materia ID",     key: "materia_id",    width: 12 },
    { header: "Período",        key: "periodo",       width: 12 },
    { header: "Total Alumnos",  key: "total_alumnos", width: 15 },
    { header: "Aprobados",      key: "aprobados",     width: 12 },
    { header: "Aplazados",      key: "aplazados",     width: 12 },
    { header: "Ausentes",       key: "ausentes",      width: 12 },
    { header: "Promedio",       key: "promedio",      width: 10 },
    { header: "% Aprobados",    key: "pct",           width: 14 },
    { header: "Fecha Generado", key: "fecha_gen",     width: 22 },
  ];
  sheet1.getRow(1).eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.alignment = { horizontal: "center" };
  });
  reportes.forEach((r) => {
    const pct = r.total_alumnos > 0
      ? ((r.aprobados / r.total_alumnos) * 100).toFixed(1) + "%"
      : "N/D";
    sheet1.addRow({ ...r, pct, fecha_gen: r.fecha_gen.slice(0, 16) });
  });
 
  // Hoja 2: Notificaciones
  const sheet2 = workbook.addWorksheet("Notificaciones");
  sheet2.columns = [
    { header: "ID",      key: "id",      width: 6  },
    { header: "Legajo",  key: "legajo",  width: 10 },
    { header: "Mensaje", key: "mensaje", width: 50 },
    { header: "Leída",   key: "leida",   width: 8  },
    { header: "Fecha",   key: "fecha",   width: 22 },
  ];
  sheet2.getRow(1).eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.alignment = { horizontal: "center" };
  });
  const notifs = db.prepare("SELECT * FROM notificacion ORDER BY fecha DESC").all();
  notifs.forEach((n) => {
    sheet2.addRow({ ...n, leida: n.leida ? "Sí" : "No", fecha: n.fecha.slice(0, 16) });
  });
 
  const nombreArchivo = `reporte_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await workbook.xlsx.writeFile(path.join(__dirname, nombreArchivo));
  return nombreArchivo;
}
 
// ─── Exportar todo ────────────────────────────────────────
module.exports = {
  enviarNotificacion,
  obtenerNotificaciones,
  marcarLeida,
  limpiarLeidas,
  registrarAuditoria,
  obtenerLog,
  exportarLog,
  generarReporte,
  obtenerReportes,
  compararPeriodos,
  exportarExcel,
};
 