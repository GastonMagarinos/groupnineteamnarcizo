#!/usr/bin/env node
 
/**
 * ─────────────────────────────────────────────────────────
 *  SISTEMA DE GESTIÓN DE CALIFICACIONES UNIVERSITARIAS
 *  Milestone 4 — Integración final
 *
 *  INSTALACIÓN:
 *    npm install better-sqlite3 exceljs
 *
 *  EJECUCIÓN:
 *    node calificaciones.js
 * ─────────────────────────────────────────────────────────
 */
 
const readline = require("readline");
 
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
 
// ─────────────────────────────────────────────────────────
//  HELPERS DE CONSOLA
// ─────────────────────────────────────────────────────────
 
const rl           = readline.createInterface({ input: process.stdin, output: process.stdout });
const pregunta     = (msg) => new Promise((res) => rl.question(msg, res));
const limpiar      = () => process.stdout.write("\x1Bc");
const linea        = (c = "─", n = 56) => console.log(c.repeat(n));
const pausa        = () => pregunta("\n  Presioná ENTER para continuar...");
const colorVerde   = (t) => `\x1b[32m${t}\x1b[0m`;
const colorRojo    = (t) => `\x1b[31m${t}\x1b[0m`;
const colorAmarillo= (t) => `\x1b[33m${t}\x1b[0m`;
const colorCian    = (t) => `\x1b[36m${t}\x1b[0m`;
const colorGris    = (t) => `\x1b[90m${t}\x1b[0m`;
const negrita      = (t) => `\x1b[1m${t}\x1b[0m`;
 
const ingresarNota = async (label) => {
  while (true) {
    const val = await pregunta(`  ${label} (0-10, Enter para omitir): `);
    if (val.trim() === "") return null;
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0 && n <= 10) return n;
    console.log(colorAmarillo("  ⚠  Nota inválida. Ingresá un valor entre 0 y 10."));
  }
};
 
// ─────────────────────────────────────────────────────────
//  US-01 — Registrar / Editar calificaciones
// ─────────────────────────────────────────────────────────
 
async function us01_registrarCalificaciones() {
  limpiar();
  linea(); console.log("  US-01 · Registrar calificaciones  [Docente]"); linea();
 
  const legajo = (await pregunta("  Legajo del estudiante: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);
  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Estudiante no encontrado."));
    await pausa(); return;
  }
 
  console.log("\n  Materias disponibles:");
  listarMaterias().forEach((m) => console.log(`    [${m.id}] ${m.nombre}`));
  const matId  = parseInt(await pregunta("  ID de materia: "));
  const materia = buscarMateria(matId);
  if (!materia) {
    console.log(colorRojo("\n  ✗ Materia no encontrada."));
    await pausa(); return;
  }
 
  if (!periodoHabilitado()) {
    console.log(colorRojo("\n  ✗ Período de carga cerrado. No se pueden modificar notas."));
    await pausa(); return;
  }
 
  const cal      = buscarCalificacion(legajo, matId);
  const anterior = cal ? cal.final : null;
 
  const p1  = await ingresarNota("Parcial 1");
  const p2  = await ingresarNota("Parcial 2");
  const fin = await ingresarNota("Final    ");
 
  const resultado = guardarCalificacion({ legajo, materiaId: matId, parcial1: p1, parcial2: p2, final: fin });
 
  // Auditoría — Integrante 5
  registrarAuditoria("docente", legajo, matId, anterior, fin);
 
  console.log(colorVerde(`\n  ✓ Calificación ${resultado.accion} correctamente.`));
  await pausa();
}
 
// ─────────────────────────────────────────────────────────
//  US-02 — Importar calificaciones masivas
// ─────────────────────────────────────────────────────────
 
async function us02_importarCalificaciones() {
  limpiar();
  linea(); console.log("  US-02 · Importar calificaciones masivas  [Docente]"); linea();
 
  const archivoSimulado = [
    { legajo: "U001", materiaId: 2, parcial1: 9,  parcial2: 8, final: 9 },
    { legajo: "U002", materiaId: 2, parcial1: 5,  parcial2: 6, final: 5 },
    { legajo: "U003", materiaId: 2, parcial1: 15, parcial2: 7, final: 8 }, // nota inválida
    { legajo: "U099", materiaId: 2, parcial1: 7,  parcial2: 7, final: 7 }, // legajo inexistente
    { legajo: "U004", materiaId: 2, parcial1: 8,  parcial2: 9, final: 8 },
  ];
 
  console.log(colorGris(`\n  Procesando archivo simulado (${archivoSimulado.length} filas)...\n`));
 
  const validas   = [];
  const invalidas = [];
 
  for (const fila of archivoSimulado) {
    const errores = [];
    if (!buscarEstudiante(fila.legajo)) errores.push("legajo no existe");
    if (!buscarMateria(fila.materiaId)) errores.push("materia no existe");
    [fila.parcial1, fila.parcial2, fila.final].forEach((n, i) => {
      if (n !== null && (n < 0 || n > 10)) errores.push(`nota ${["P1","P2","F"][i]} fuera de rango`);
    });
    errores.length > 0 ? invalidas.push({ ...fila, errores }) : validas.push(fila);
  }
 
  console.log(`  ${colorVerde("✓ Filas válidas:")}   ${validas.length}`);
  console.log(`  ${colorRojo("✗ Filas con error:")} ${invalidas.length}\n`);
  invalidas.forEach((f) => console.log(`    Legajo ${f.legajo} → ${f.errores.join(", ")}`));
 
  const ok = (await pregunta("\n  ¿Importar las filas válidas? (s/n): ")).trim().toLowerCase();
  if (ok !== "s") { console.log(colorGris("\n  Cancelado.")); await pausa(); return; }
 
  if (!periodoHabilitado()) {
    console.log(colorRojo("\n  ✗ Período cerrado.")); await pausa(); return;
  }
 
  validas.forEach((f) => {
    guardarCalificacion({ legajo: f.legajo, materiaId: f.materiaId, parcial1: f.parcial1, parcial2: f.parcial2, final: f.final });
  });
 
  console.log(colorVerde(`\n  ✓ ${validas.length} registros importados exitosamente.`));
  await pausa();
}
 
// ─────────────────────────────────────────────────────────
//  US-03 — Estadísticas del curso
// ─────────────────────────────────────────────────────────
 
async function us03_estadisticasCurso() {
  limpiar();
  linea(); console.log("  US-03 · Estadísticas del curso  [Docente]"); linea();
 
  console.log("\n  Materias disponibles:");
  listarMaterias().forEach((m) => console.log(`    [${m.id}] ${m.nombre}`));
  const matId  = parseInt(await pregunta("  ID de materia: "));
  const materia = buscarMateria(matId);
  if (!materia) {
    console.log(colorRojo("\n  ✗ Materia no encontrada.")); await pausa(); return;
  }
 
  const stats = estadisticasMateria(matId);
  if (!stats) {
    console.log(colorAmarillo("\n  Sin calificaciones finales registradas.")); await pausa(); return;
  }
 
  console.log(`\n  ${negrita(materia.nombre)}`);
  linea("·", 56);
  console.log(`  Total evaluados : ${stats.total}`);
  console.log(`  Promedio        : ${colorCian(stats.promedio)}`);
  console.log(`  Mediana         : ${colorCian(stats.mediana)}`);
  console.log(`  Aprobados       : ${colorVerde(stats.aprobados)} (${((stats.aprobados / stats.total) * 100).toFixed(0)}%)`);
  console.log(`  Aplazados       : ${colorRojo(stats.aplazados)} (${((stats.aplazados / stats.total) * 100).toFixed(0)}%)`);
  linea("·", 56);
 
  console.log("\n  Detalle por estudiante:");
  calificacionesPorMateria(matId)
    .filter((c) => c.final !== null)
    .forEach((c) => {
      const est = buscarEstudiante(c.legajo);
      const tag = c.final < 6 ? colorRojo(" ⚠ EN RIESGO") : colorVerde(" ✓");
      console.log(`    ${est?.nombre.padEnd(22)} Final: ${String(c.final).padStart(4)}${tag}`);
    });
 
  await pausa();
}
 
// ─────────────────────────────────────────────────────────
//  US-04 — Consultar calificaciones (Estudiante)
// ─────────────────────────────────────────────────────────
 
async function us04_consultarCalificaciones() {
  limpiar();
  linea(); console.log("  US-04 · Consultar mis calificaciones  [Estudiante]"); linea();
 
  const legajo = (await pregunta("  Tu legajo: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);
  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Legajo no encontrado.")); await pausa(); return;
  }
 
  const misCals = calificacionesPorEstudiante(legajo);
  if (misCals.length === 0) {
    console.log(colorAmarillo("\n  Sin registros académicos.")); await pausa(); return;
  }
 
  console.log(`\n  ${negrita(estudiante.nombre)} — Legajo: ${legajo}\n`);
  console.log(`  ${"Materia".padEnd(30)} ${"P1".padStart(4)} ${"P2".padStart(4)} ${"Final".padStart(6)}  Estado`);
  linea("·", 56);
 
  misCals.forEach((c) => {
    const mat = buscarMateria(c.materiaId);
    if (!mat) return; // ignorar si la materia no existe
    if (!c.publicada) {
      console.log(`  ${mat.nombre.padEnd(30)} ${colorGris("Pendiente de publicación")}`);
    } else {
      const p1     = c.parcial1 !== null ? String(c.parcial1).padStart(4) : "   -";
      const p2     = c.parcial2 !== null ? String(c.parcial2).padStart(4) : "   -";
      const fin    = c.final    !== null ? String(c.final).padStart(6)    : "     -";
      const estado = c.final === null
        ? colorAmarillo("En curso")
        : c.final >= 6 ? colorVerde("Aprobado") : colorRojo("Aplazado");
      console.log(`  ${mat.nombre.padEnd(30)} ${p1} ${p2} ${fin}  ${estado}`);
    }
  });
 
  await pausa();
}
 
// ─────────────────────────────────────────────────────────
//  US-05 — Publicar notas y notificar
// ─────────────────────────────────────────────────────────
 
async function us05_publicarNotificar() {
  limpiar();
  linea(); console.log("  US-05 · Publicar notas y notificar  [Docente]"); linea();
 
  console.log("\n  Materias disponibles:");
  listarMaterias().forEach((m) => console.log(`    [${m.id}] ${m.nombre}`));
  const matId  = parseInt(await pregunta("  ID de materia a publicar: "));
  const materia = buscarMateria(matId);
  if (!materia) {
    console.log(colorRojo("\n  ✗ Materia no encontrada.")); await pausa(); return;
  }
 
  const pendientes = calificacionesPorMateria(matId).filter((c) => !c.publicada && c.final !== null);
  if (pendientes.length === 0) {
    console.log(colorAmarillo("\n  No hay notas pendientes de publicación.")); await pausa(); return;
  }
 
  console.log(`\n  Se publicarán notas de ${pendientes.length} estudiante(s):`);
  pendientes.forEach((c) => {
    const est = buscarEstudiante(c.legajo);
    console.log(`    · ${est?.nombre} — Final: ${c.final}`);
  });
 
  const ok = (await pregunta("\n  ¿Confirmar publicación? (s/n): ")).trim().toLowerCase();
  if (ok !== "s") { console.log(colorGris("  Cancelado.")); await pausa(); return; }
 
  // Publicar en DB — Integrante 4
  publicarCalificaciones(matId);
 
  // Notificar — Integrante 5
  pendientes.forEach((c) => {
    const est = buscarEstudiante(c.legajo);
    const msg = `Tus notas de "${materia.nombre}" están disponibles. Final: ${c.final}`;
    enviarNotificacion(c.legajo, msg);
    console.log(colorVerde(`  ✓ Notificación enviada a ${est?.nombre}`));
  });
 
  await pausa();
}
 
// ─────────────────────────────────────────────────────────
//  US-06 — Historial académico
// ─────────────────────────────────────────────────────────
 
async function us06_descargarHistorial() {
  limpiar();
  linea(); console.log("  US-06 · Historial académico (PDF simulado)  [Estudiante]"); linea();
 
  const legajo = (await pregunta("  Tu legajo: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);
  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Legajo no encontrado.")); await pausa(); return;
  }
 
  const misCals  = calificacionesPorEstudiante(legajo);
  const finales  = misCals.filter((c) => c.final !== null);
  const promedio = finales.length > 0
    ? (finales.reduce((a, c) => a + c.final, 0) / finales.length).toFixed(2)
    : "N/D";
 
  const sep = "═".repeat(56);
  console.log(`\n  ${sep}`);
  console.log(`  UNIVERSIDAD — HISTORIAL ACADÉMICO OFICIAL`);
  console.log(`  ${sep}`);
  console.log(`  Nombre   : ${estudiante.nombre}`);
  console.log(`  Legajo   : ${legajo}`);
  console.log(`  Fecha    : ${new Date().toLocaleDateString("es-AR")}`);
  console.log(`  ${sep}`);
  console.log(`  ${"MATERIA".padEnd(28)} ${"P1".padStart(4)} ${"P2".padStart(4)} ${"FINAL".padStart(6)}  ESTADO`);
  console.log(`  ${"─".repeat(54)}`);
 
  misCals.forEach((c) => {
    const mat    = buscarMateria(c.materiaId);
    if (!mat) return; // ignorar si la materia no existe
    const estado = c.final === null ? "En curso" : c.final >= 6 ? "Aprobado" : "Aplazado";
    console.log(
      `  ${mat.nombre.padEnd(28)} ${String(c.parcial1 ?? "-").padStart(4)} ${String(c.parcial2 ?? "-").padStart(4)} ${String(c.final ?? "-").padStart(6)}  ${estado}`
    );
  });
 
  console.log(`  ${"─".repeat(54)}`);
  console.log(`  Promedio general: ${negrita(promedio)}`);
  console.log(`  ${sep}`);
  console.log(`  ◉ Documento con sello digital institucional`);
  console.log(`  ${sep}\n`);
  console.log(colorVerde("  ✓ Historial generado correctamente."));
  await pausa();
}
 
// ─────────────────────────────────────────────────────────
//  EXTRAS — Integrante 5
// ─────────────────────────────────────────────────────────
 
async function misNotificaciones() {
  limpiar();
  linea(); console.log("  NOTIFICACIONES  [Estudiante]"); linea();
 
  const legajo = (await pregunta("  Tu legajo: ")).trim().toUpperCase();
  const notifs = obtenerNotificaciones(legajo);
 
  if (notifs.length === 0) {
    console.log(colorAmarillo("\n  Sin notificaciones.")); await pausa(); return;
  }
 
  notifs.forEach((n) => {
    const estado = n.leida ? colorGris("✓ leída") : colorVerde("● nueva");
    console.log(`\n  [${n.id}] ${estado}`);
    console.log(`       ${n.mensaje}`);
    console.log(`       ${colorGris(n.fecha.slice(0, 16))}`);
  });
 
  const idInput = (await pregunta("\n  ID a marcar como leída (Enter para omitir): ")).trim();
  if (idInput) {
    marcarLeida(parseInt(idInput));
    console.log(colorVerde("  ✓ Marcada como leída."));
  }
  await pausa();
}
 
async function verLogAuditoria() {
  limpiar();
  linea(); console.log("  LOG DE AUDITORÍA  [Administrador]"); linea();
 
  const registros = obtenerLog();
  if (registros.length === 0) {
    console.log(colorAmarillo("\n  Sin registros.")); await pausa(); return;
  }
 
  console.log(`\n  ${"ID".padEnd(4)} ${"Usuario".padEnd(12)} ${"Legajo".padEnd(8)} ${"Materia".padEnd(8)} ${"Anterior".padEnd(10)} Nueva`);
  linea("·", 56);
  registros.forEach((r) => {
    console.log(
      `  ${String(r.id).padEnd(4)} ${r.usuario.padEnd(12)} ${r.legajo.padEnd(8)} ${String(r.materia_id).padEnd(8)} ${String(r.nota_anterior ?? "-").padEnd(10)} ${r.nota_nueva ?? "-"}`
    );
  });
  await pausa();
}
 
async function verReportes() {
  limpiar();
  linea(); console.log("  REPORTES DE RENDIMIENTO  [Director]"); linea();
 
  const reportes = obtenerReportes();
  if (reportes.length === 0) {
    console.log(colorAmarillo("\n  Sin reportes generados.")); await pausa(); return;
  }
 
  reportes.forEach((r) => {
    const pct = r.total_alumnos > 0
      ? ((r.aprobados / r.total_alumnos) * 100).toFixed(1)
      : "N/D";
    console.log(`\n  Materia ${r.materia_id} | ${r.periodo} | Promedio: ${r.promedio} | Aprobados: ${pct}%`);
  });
 
  const exportar = (await pregunta("\n  ¿Exportar a Excel? (s/n): ")).trim().toLowerCase();
  if (exportar === "s") {
    try {
      const archivo = await exportarExcel();
      console.log(colorVerde(`\n  ✓ Archivo generado: ${archivo}`));
    } catch (err) {
      console.log(colorRojo(`\n  ✗ ${err.message}`));
    }
  }
  await pausa();
}
 
// ─────────────────────────────────────────────────────────
//  MENÚ PRINCIPAL
// ─────────────────────────────────────────────────────────
 
async function menuPrincipal() {
  while (true) {
    limpiar();
    console.log();
    console.log(colorCian("  ╔══════════════════════════════════════════════════════╗"));
    console.log(colorCian("  ║   SISTEMA DE GESTIÓN DE CALIFICACIONES — UNI         ║"));
    console.log(colorCian("  ╚══════════════════════════════════════════════════════╝"));
    console.log();
    console.log(colorAmarillo("  ── Módulo Docente ───────────────────────────────────"));
    console.log("   [1]  US-01 · Registrar / editar calificaciones");
    console.log("   [2]  US-02 · Importar calificaciones masivas");
    console.log("   [3]  US-03 · Estadísticas y alumnos en riesgo");
    console.log(colorVerde("  ── Módulo Estudiante ─────────────────────────────────"));
    console.log("   [4]  US-04 · Consultar mis calificaciones");
    console.log("   [5]  US-05 · Publicar notas y notificar");
    console.log("   [6]  US-06 · Descargar historial académico");
    console.log(colorCian("  ── Módulo Notificaciones / Auditoría / Reportes ──────"));
    console.log("   [7]  Ver mis notificaciones");
    console.log("   [8]  Ver log de auditoría");
    console.log("   [9]  Ver reportes y exportar a Excel");
    console.log(colorGris("  ──────────────────────────────────────────────────────"));
    console.log("   [0]  Salir");
    console.log();
 
    const op = (await pregunta("  Elegí una opción: ")).trim();
    switch (op) {
      case "1": await us01_registrarCalificaciones(); break;
      case "2": await us02_importarCalificaciones();  break;
      case "3": await us03_estadisticasCurso();       break;
      case "4": await us04_consultarCalificaciones(); break;
      case "5": await us05_publicarNotificar();       break;
      case "6": await us06_descargarHistorial();      break;
      case "7": await misNotificaciones();            break;
      case "8": await verLogAuditoria();              break;
      case "9": await verReportes();                  break;
      case "0":
        console.log(colorGris("\n  Saliendo del sistema...\n"));
        rl.close();
        process.exit(0);
      default:
        console.log(colorRojo("  ✗ Opción inválida."));
        await new Promise((r) => setTimeout(r, 800));
    }
  }
}
 
menuPrincipal().catch((err) => { console.error(err); rl.close(); });
 