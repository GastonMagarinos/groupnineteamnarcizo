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
}async function us02_importarCalificaciones() {
  limpiar();
  titulo("US-02 · Importar calificaciones masivas  [Docente]");
 
  // Simulación de un archivo CSV/Excel
  const archivoSimulado = [
    { legajo: "U001", materiaId: 2, parcial1: 9,  parcial2: 8, final: 9 },
    { legajo: "U002", materiaId: 2, parcial1: 5,  parcial2: 6, final: 5 },
    { legajo: "U003", materiaId: 2, parcial1: 15, parcial2: 7, final: 8 }, // nota inválida
    { legajo: "U099", materiaId: 2, parcial1: 7,  parcial2: 7, final: 7 }, // legajo inexistente
    { legajo: "U004", materiaId: 2, parcial1: 8,  parcial2: 9, final: 8 },
  ];
 
  console.log(colorGris(`\n  Procesando archivo simulado (${archivoSimulado.length} filas)...\n`));
 
  const filaValida   = [];
  const filaInvalida = [];
 
  for (const fila of archivoSimulado) {
    const errores = [];
    if (!buscarEstudiante(fila.legajo))  errores.push("legajo no existe");
    if (!buscarMateria(fila.materiaId)) errores.push("materia no existe");
    [fila.parcial1, fila.parcial2, fila.final].forEach((n, i) => {
      if (n !== null && (n < 0 || n > 10))
        errores.push(`nota ${["P1", "P2", "F"][i]} fuera de rango`);
    });
 
    if (errores.length > 0) filaInvalida.push({ ...fila, errores });
    else                    filaValida.push(fila);
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
 
  // ► Verifica período antes de guardar (usa periodoHabilitado del Int.3)
  if (!periodoHabilitado()) {
    console.log(colorRojo("\n  ✗ Período de carga cerrado."));
    await pausa(); return;
  }
 
  filaValida.forEach((fila) => {
    const cal = buscarCalificacion(fila.legajo, fila.materiaId);
    if (cal) {
      Object.assign(cal, { parcial1: fila.parcial1, parcial2: fila.parcial2, final: fila.final });
    } else {
      db.calificaciones.push({
        ...fila,
        publicada:  false,
        fechaCarga: new Date().toISOString().split("T")[0],
      });
    }
  });
 
  console.log(colorVerde(`\n  ✓ ${filaValida.length} registros importados exitosamente.`));
  await pausa();
}
 
// ══════════════════════════════════════════════════════════════
//  INTEGRANTE 2 (VOS) — US-03: Estadísticas + alumnos en riesgo
//  Issue: "Visualizar estadísticas del curso"
//  Issue: "Identificar alumnos en riesgo académico"
//
//  ► Calcular promedio, mediana, % aprobados y % aplazados
//  ► Marcar con ⚠ EN RIESGO a estudiantes con final < 6
//  ► Conecta con db.calificaciones del Integrante 4
// ══════════════════════════════════════════════════════════════
 
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
 
  const notas     = cals.map((c) => c.final);
  const promedio  = (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2);
  const sorted    = [...notas].sort((a, b) => a - b);
  const mediana   = sorted.length % 2 === 0
    ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(1)
    : sorted[Math.floor(sorted.length / 2)].toFixed(1);
  const aprobados = cals.filter((c) => c.final >= 6).length;
  const aplazados = cals.filter((c) => c.final <  6).length;
 
  // ► Identificar alumnos en riesgo (final < 6)
  const enRiesgo = cals.filter((c) => c.final < 6);
 
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
    const est    = buscarEstudiante(c.legajo);
    const riesgo = c.final < 6;
    const tag    = riesgo ? colorRojo(" ⚠ EN RIESGO") : colorVerde(" ✓");
    console.log(`    ${est?.nombre.padEnd(22)} Nota final: ${String(c.final).padStart(4)}${tag}`);
  });
 
  if (enRiesgo.length > 0) {
    console.log(colorRojo(`\n  ⚠  ${enRiesgo.length} alumno(s) en riesgo académico.`));
  }
 
  await pausa();
}