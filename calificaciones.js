#!/usr/bin/env node

/**
 * Sistema de Gestión de Calificaciones Universitarias
 * Implementa las US-01 a US-06 con menú interactivo en consola
 */

const readline = require("readline");

// ─────────────────────────────────────────────
// BASE DE DATOS EN MEMORIA
// ─────────────────────────────────────────────

const db = {
  periodoActivo: {
    inicio: new Date("2025-03-01"),
    cierre: new Date("2026-12-31"),
    excepciones: [], // legajos con acceso extendido
  },
  materias: [
    { id: 1, nombre: "Matemática I" },
    { id: 2, nombre: "Algoritmos y Estructuras" },
    { id: 3, nombre: "Física I" },
  ],
  estudiantes: [
    { legajo: "U001", nombre: "Ana García" },
    { legajo: "U002", nombre: "Bruno Martínez" },
    { legajo: "U003", nombre: "Carla López" },
    { legajo: "U004", nombre: "Diego Fernández" },
    { legajo: "U005", nombre: "Elena Rodríguez" },
  ],
  calificaciones: [
    // { legajo, materiaId, parcial1, parcial2, final, publicada, fechaCarga }
    { legajo: "U001", materiaId: 1, parcial1: 8, parcial2: 7, final: 8, publicada: true, fechaCarga: "2025-06-10" },
    { legajo: "U002", materiaId: 1, parcial1: 4, parcial2: 5, final: 4, publicada: true, fechaCarga: "2025-06-10" },
    { legajo: "U003", materiaId: 1, parcial1: 9, parcial2: 10, final: 9, publicada: true, fechaCarga: "2025-06-10" },
    { legajo: "U004", materiaId: 2, parcial1: 6, parcial2: 7, final: 7, publicada: true, fechaCarga: "2025-06-11" },
    { legajo: "U005", materiaId: 2, parcial1: null, parcial2: null, final: null, publicada: false, fechaCarga: null },
    { legajo: "U001", materiaId: 3, parcial1: 7, parcial2: 8, final: null, publicada: false, fechaCarga: null },
  ],
  notificaciones: [], // { legajo, mensaje, fecha }
  logAuditoria: [],   // { usuario, legajo, materiaId, notaAnterior, notaNueva, fecha }
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const pregunta = (msg) => new Promise((res) => rl.question(msg, res));

const limpiar = () => process.stdout.write("\x1Bc");

const linea = (char = "─", len = 56) => console.log(char.repeat(len));

const titulo = (texto) => {
  linea();
  console.log(`  ${texto}`);
  linea();
};

const pausa = () => pregunta("\n  Presioná ENTER para continuar...");

const colorVerde  = (t) => `\x1b[32m${t}\x1b[0m`;
const colorRojo   = (t) => `\x1b[31m${t}\x1b[0m`;
const colorAmarillo = (t) => `\x1b[33m${t}\x1b[0m`;
const colorCian   = (t) => `\x1b[36m${t}\x1b[0m`;
const colorGris   = (t) => `\x1b[90m${t}\x1b[0m`;
const negrita     = (t) => `\x1b[1m${t}\x1b[0m`;

const periodoHabilitado = (legajo = null) => {
  const hoy = new Date();
  if (legajo && db.periodoActivo.excepciones.includes(legajo)) return true;
  return hoy >= db.periodoActivo.inicio && hoy <= db.periodoActivo.cierre;
};

const buscarEstudiante = (legajo) =>
  db.estudiantes.find((e) => e.legajo.toUpperCase() === legajo.toUpperCase());

const buscarMateria = (id) => db.materias.find((m) => m.id === parseInt(id));

const buscarCalificacion = (legajo, materiaId) =>
  db.calificaciones.find(
    (c) => c.legajo.toUpperCase() === legajo.toUpperCase() && c.materiaId === parseInt(materiaId)
  );

const promedioCalificacion = (cal) => {
  if (!cal.parcial1 && !cal.parcial2 && !cal.final) return null;
  const notas = [cal.parcial1, cal.parcial2, cal.final].filter((n) => n !== null);
  return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
};

const registrarAuditoria = (usuario, legajo, materiaId, anterior, nueva) => {
  db.logAuditoria.push({
    usuario,
    legajo,
    materiaId,
    notaAnterior: anterior,
    notaNueva: nueva,
    fecha: new Date().toLocaleString("es-AR"),
  });
};

const enviarNotificacion = (legajo, mensaje) => {
  db.notificaciones.push({ legajo, mensaje, fecha: new Date().toLocaleString("es-AR") });
};

// ─────────────────────────────────────────────
// US-01 — Registrar / Editar calificaciones
// ─────────────────────────────────────────────

async function us01_registrarCalificaciones() {
  limpiar();
  titulo("US-01 · Registrar calificaciones  [Docente]");

  const legajo = (await pregunta("  Legajo del estudiante: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);
  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Estudiante no encontrado."));
    await pausa(); return;
  }

  console.log(`\n  Materias disponibles:`);
  db.materias.forEach((m) => console.log(`    [${m.id}] ${m.nombre}`));
  const matId = parseInt(await pregunta("  ID de materia: "));
  const materia = buscarMateria(matId);
  if (!materia) {
    console.log(colorRojo("\n  ✗ Materia no encontrada."));
    await pausa(); return;
  }

  if (!periodoHabilitado(legajo)) {
    console.log(colorRojo("\n  ✗ Período de carga cerrado. No se pueden modificar notas."));
    await pausa(); return;
  }

  const ingresarNota = async (label) => {
    while (true) {
      const val = await pregunta(`  ${label} (0-10, o Enter para omitir): `);
      if (val.trim() === "") return null;
      const n = parseFloat(val);
      if (!isNaN(n) && n >= 0 && n <= 10) return n;
      console.log(colorAmarillo("  ⚠  Nota inválida. Ingresá un valor entre 0 y 10."));
    }
  };

  const p1 = await ingresarNota("Parcial 1");
  const p2 = await ingresarNota("Parcial 2");
  const fin = await ingresarNota("Final    ");

  let calificacion = buscarCalificacion(legajo, matId);
  if (calificacion) {
    // Edición — registrar auditoría
    const anterior = { p1: calificacion.parcial1, p2: calificacion.parcial2, fin: calificacion.final };
    calificacion.parcial1 = p1 ?? calificacion.parcial1;
    calificacion.parcial2 = p2 ?? calificacion.parcial2;
    calificacion.final    = fin ?? calificacion.final;
    calificacion.fechaCarga = new Date().toISOString().split("T")[0];
    registrarAuditoria("docente", legajo, matId, anterior, { p1: calificacion.parcial1, p2: calificacion.parcial2, fin: calificacion.final });
    console.log(colorVerde("\n  ✓ Calificación actualizada. Cambio registrado en auditoría."));
  } else {
    db.calificaciones.push({
      legajo, materiaId: matId,
      parcial1: p1, parcial2: p2, final: fin,
      publicada: false,
      fechaCarga: new Date().toISOString().split("T")[0],
    });
    console.log(colorVerde("\n  ✓ Calificación registrada correctamente."));
  }
  await pausa();
}

// ─────────────────────────────────────────────
// US-02 — Importar calificaciones desde "Excel"
// ─────────────────────────────────────────────

async function us02_importarCalificaciones() {
  limpiar();
  titulo("US-02 · Importar calificaciones masivas  [Docente]");

  // Simulamos un archivo CSV como si fuera un Excel
  const archivoSimulado = [
    { legajo: "U001", materiaId: 2, parcial1: 9, parcial2: 8, final: 9 },
    { legajo: "U002", materiaId: 2, parcial1: 5, parcial2: 6, final: 5 },
    { legajo: "U003", materiaId: 2, parcial1: 15, parcial2: 7, final: 8 }, // nota inválida
    { legajo: "U099", materiaId: 2, parcial1: 7, parcial2: 7, final: 7 }, // legajo inexistente
    { legajo: "U004", materiaId: 2, parcial1: 8, parcial2: 9, final: 8 },
  ];

  console.log(colorGris(`\n  Procesando archivo simulado (${archivoSimulado.length} filas)...\n`));

  const filaValida   = [];
  const filaInvalida = [];

  for (const fila of archivoSimulado) {
    const errores = [];
    if (!buscarEstudiante(fila.legajo)) errores.push("legajo no existe");
    if (!buscarMateria(fila.materiaId))  errores.push("materia no existe");
    [fila.parcial1, fila.parcial2, fila.final].forEach((n, i) => {
      if (n !== null && (n < 0 || n > 10)) errores.push(`nota ${["P1","P2","F"][i]} fuera de rango`);
    });

    if (errores.length > 0) {
      filaInvalida.push({ ...fila, errores });
    } else {
      filaValida.push(fila);
    }
  }

  console.log(`  ${colorVerde("✓ Filas válidas:")}   ${filaValida.length}`);
  console.log(`  ${colorRojo("✗ Filas con error:")} ${filaInvalida.length}\n`);

  if (filaInvalida.length > 0) {
    console.log(colorAmarillo("  Reporte de errores:"));
    filaInvalida.forEach((f) =>
      console.log(`    Legajo ${f.legajo} → ${f.errores.join(", ")}`)
    );
    console.log();
  }

  const confirmar = (await pregunta("  ¿Importar las filas válidas? (s/n): ")).trim().toLowerCase();
  if (confirmar !== "s") {
    console.log(colorGris("\n  Importación cancelada."));
    await pausa(); return;
  }

  if (!periodoHabilitado()) {
    console.log(colorRojo("\n  ✗ Período de carga cerrado."));
    await pausa(); return;
  }

  filaValida.forEach((fila) => {
    const cal = buscarCalificacion(fila.legajo, fila.materiaId);
    if (cal) {
      Object.assign(cal, { parcial1: fila.parcial1, parcial2: fila.parcial2, final: fila.final });
    } else {
      db.calificaciones.push({ ...fila, publicada: false, fechaCarga: new Date().toISOString().split("T")[0] });
    }
  });

  console.log(colorVerde(`\n  ✓ ${filaValida.length} registros importados exitosamente.`));
  await pausa();
}

// ─────────────────────────────────────────────
// US-03 — Estadísticas del curso
// ─────────────────────────────────────────────

async function us03_estadisticasCurso() {
  limpiar();
  titulo("US-03 · Estadísticas del curso  [Docente]");

  console.log("  Materias:");
  db.materias.forEach((m) => console.log(`    [${m.id}] ${m.nombre}`));
  const matId = parseInt(await pregunta("  ID de materia: "));
  const materia = buscarMateria(matId);
  if (!materia) {
    console.log(colorRojo("\n  ✗ Materia no encontrada."));
    await pausa(); return;
  }

  const cals = db.calificaciones.filter((c) => c.materiaId === matId && c.final !== null);
  if (cals.length === 0) {
    console.log(colorAmarillo("\n  Sin calificaciones finales registradas para esta materia."));
    await pausa(); return;
  }

  const notas = cals.map((c) => c.final);
  const promedio = (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2);
  const sorted   = [...notas].sort((a, b) => a - b);
  const mediana  = sorted.length % 2 === 0
    ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(1)
    : sorted[Math.floor(sorted.length / 2)].toFixed(1);
  const aprobados  = cals.filter((c) => c.final >= 6).length;
  const aplazados  = cals.filter((c) => c.final < 6).length;

  console.log(`\n  Materia: ${negrita(materia.nombre)}`);
  linea("·", 56);
  console.log(`  Total evaluados : ${notas.length}`);
  console.log(`  Promedio        : ${colorCian(promedio)}`);
  console.log(`  Mediana         : ${colorCian(mediana)}`);
  console.log(`  Aprobados       : ${colorVerde(aprobados)} (${((aprobados / notas.length) * 100).toFixed(0)}%)`);
  console.log(`  Aplazados       : ${colorRojo(aplazados)} (${((aplazados / notas.length) * 100).toFixed(0)}%)`);
  linea("·", 56);

  console.log("\n  Detalle por estudiante:");
  cals.forEach((c) => {
    const est = buscarEstudiante(c.legajo);
    const enRiesgo = c.final < 6;
    const tag = enRiesgo ? colorRojo(" ⚠ EN RIESGO") : colorVerde(" ✓");
    console.log(`    ${est?.nombre.padEnd(22)} Nota final: ${String(c.final).padStart(4)}${tag}`);
  });

  await pausa();
}

// ─────────────────────────────────────────────
// US-04 — Consulta de calificaciones (Estudiante)
// ─────────────────────────────────────────────

async function us04_consultarCalificaciones() {
  limpiar();
  titulo("US-04 · Consultar mis calificaciones  [Estudiante]");

  const legajo = (await pregunta("  Tu legajo: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);
  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Legajo no encontrado."));
    await pausa(); return;
  }

  const misCals = db.calificaciones.filter((c) => c.legajo.toUpperCase() === legajo);
  if (misCals.length === 0) {
    console.log(colorAmarillo("\n  Sin registros académicos para este legajo."));
    await pausa(); return;
  }

  console.log(`\n  ${negrita(estudiante.nombre)} — Legajo: ${legajo}\n`);
  console.log(`  ${"Materia".padEnd(30)} ${"P1".padStart(4)} ${"P2".padStart(4)} ${"Final".padStart(6)}  Estado`);
  linea("·", 56);

  misCals.forEach((c) => {
    const mat = buscarMateria(c.materiaId);
    if (!c.publicada) {
      console.log(`  ${mat.nombre.padEnd(30)} ${colorGris("Pendiente de publicación")}`);
    } else {
      const p1  = c.parcial1 !== null ? String(c.parcial1).padStart(4) : "   -";
      const p2  = c.parcial2 !== null ? String(c.parcial2).padStart(4) : "   -";
      const fin = c.final    !== null ? String(c.final).padStart(6)    : "     -";
      const estado = c.final === null ? colorAmarillo("En curso") : c.final >= 6 ? colorVerde("Aprobado") : colorRojo("Aplazado");
      console.log(`  ${mat.nombre.padEnd(30)} ${p1} ${p2} ${fin}  ${estado}`);
    }
  });

  await pausa();
}

// ─────────────────────────────────────────────
// US-05 — Notificaciones al publicar notas
// ─────────────────────────────────────────────

async function us05_publicarNotificar() {
  limpiar();
  titulo("US-05 · Publicar notas y notificar  [Docente]");

  console.log("  Materias:");
  db.materias.forEach((m) => console.log(`    [${m.id}] ${m.nombre}`));
  const matId = parseInt(await pregunta("  ID de materia a publicar: "));
  const materia = buscarMateria(matId);
  if (!materia) {
    console.log(colorRojo("\n  ✗ Materia no encontrada."));
    await pausa(); return;
  }

  const pendientes = db.calificaciones.filter((c) => c.materiaId === matId && !c.publicada && c.final !== null);
  if (pendientes.length === 0) {
    console.log(colorAmarillo("\n  No hay calificaciones pendientes de publicación en esta materia."));
    await pausa(); return;
  }

  console.log(`\n  Se publicarán notas de ${pendientes.length} estudiante(s):`);
  pendientes.forEach((c) => {
    const est = buscarEstudiante(c.legajo);
    console.log(`    · ${est?.nombre} — Final: ${c.final}`);
  });

  const confirmar = (await pregunta("\n  ¿Confirmar publicación? (s/n): ")).trim().toLowerCase();
  if (confirmar !== "s") {
    console.log(colorGris("  Cancelado.")); await pausa(); return;
  }

  pendientes.forEach((c) => {
    c.publicada = true;
    const est = buscarEstudiante(c.legajo);
    const msg = `Tus notas de "${materia.nombre}" ya están disponibles. Final: ${c.final}`;
    enviarNotificacion(c.legajo, msg);
    console.log(colorVerde(`  ✓ Notificación enviada a ${est?.nombre}`));
  });

  console.log(colorGris("\n  [Bandeja de notificaciones actualizada]"));
  await pausa();
}

// ─────────────────────────────────────────────
// US-06 — Descargar historial académico en PDF
// ─────────────────────────────────────────────

async function us06_descargarHistorial() {
  limpiar();
  titulo("US-06 · Historial académico (simulado PDF)  [Estudiante]");

  const legajo = (await pregunta("  Tu legajo: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);
  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Legajo no encontrado."));
    await pausa(); return;
  }

  const misCals = db.calificaciones.filter((c) => c.legajo.toUpperCase() === legajo);
  const finales  = misCals.filter((c) => c.final !== null);
  const promedio = finales.length > 0
    ? (finales.reduce((a, c) => a + c.final, 0) / finales.length).toFixed(2)
    : "N/D";

  // Simulación del contenido del PDF en consola
  const sep = "═".repeat(56);
  console.log(`\n  ${sep}`);
  console.log(`  UNIVERSIDAD — HISTORIAL ACADÉMICO OFICIAL`);
  console.log(`  ${sep}`);
  console.log(`  Nombre   : ${estudiante.nombre}`);
  console.log(`  Legajo   : ${legajo}`);
  console.log(`  Carrera  : Ingeniería en Sistemas`);
  console.log(`  Fecha    : ${new Date().toLocaleDateString("es-AR")}`);
  console.log(`  ${sep}`);
  console.log(`  ${"MATERIA".padEnd(28)} ${"P1".padStart(4)} ${"P2".padStart(4)} ${"FINAL".padStart(6)}  ESTADO`);
  console.log(`  ${"─".repeat(54)}`);

  misCals.forEach((c) => {
    const mat = buscarMateria(c.materiaId);
    if (c.final === null) {
      console.log(`  ${mat.nombre.padEnd(28)} ${"".padStart(4)} ${"".padStart(4)} ${"".padStart(6)}  En curso`);
    } else {
      const estado = c.final >= 6 ? "Aprobado" : "Aplazado";
      console.log(
        `  ${mat.nombre.padEnd(28)} ${String(c.parcial1 ?? "-").padStart(4)} ${String(c.parcial2 ?? "-").padStart(4)} ${String(c.final).padStart(6)}  ${estado}`
      );
    }
  });

  console.log(`  ${"─".repeat(54)}`);
  console.log(`  Promedio general: ${negrita(promedio)}`);
  console.log(`  ${sep}`);
  console.log(`  ◉ Documento con sello digital institucional`);
  console.log(`  ${sep}\n`);

  console.log(colorVerde("  ✓ Historial generado. En producción se descargaría como PDF."));
  await pausa();
}

// ─────────────────────────────────────────────
// MENÚ PRINCIPAL
// ─────────────────────────────────────────────

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
    console.log(colorGris("  ──────────────────────────────────────────────────────"));
    console.log("   [0]  Salir");
    console.log();

    const opcion = (await pregunta("  Elegí una opción: ")).trim();

    switch (opcion) {
      case "1": await us01_registrarCalificaciones(); break;
      case "2": await us02_importarCalificaciones();  break;
      case "3": await us03_estadisticasCurso();       break;
      case "4": await us04_consultarCalificaciones(); break;
      case "5": await us05_publicarNotificar();       break;
      case "6": await us06_descargarHistorial();      break;
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

// ─────────────────────────────────────────────
// INICIO
// ─────────────────────────────────────────────

menuPrincipal().catch((err) => {
  console.error("Error:", err);
  rl.close();
});