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
}