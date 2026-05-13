/**
 * DB — Estudiante + Carrera
 * Integrante 1 — Milestone 1
 *
 * Define las estructuras de datos para Carrera y Estudiante,
 * sus datos de ejemplo y todas las funciones helper para
 * trabajar con ellas. Se integra al objeto `db` principal.
 */

// ─────────────────────────────────────────────
// ENTIDAD: Carrera
// ─────────────────────────────────────────────
// Campos:
//   id       {number}  — identificador único
//   nombre   {string}  — nombre de la carrera
//   duracion {number}  — duración en años
//   activa   {boolean} — si la carrera está vigente

const carreras = [
  { id: 1, nombre: "Ingeniería en Sistemas",       duracion: 5, activa: true  },
  { id: 2, nombre: "Ingeniería Industrial",         duracion: 5, activa: true  },
  { id: 3, nombre: "Licenciatura en Informática",   duracion: 4, activa: true  },
  { id: 4, nombre: "Tecnicatura en Programación",   duracion: 3, activa: true  },
  { id: 5, nombre: "Ingeniería Electrónica",        duracion: 5, activa: false },
];

// ─────────────────────────────────────────────
// ENTIDAD: Estudiante
// ─────────────────────────────────────────────
// Campos:
//   legajo    {string}  — identificador único (ej: "U001")
//   nombre    {string}  — nombre completo
//   email     {string}  — correo institucional
//   carreraId {number}  — FK → carreras.id
//   anioIngreso {number} — año en que ingresó
//   activo    {boolean} — si el estudiante está inscripto

const estudiantes = [
  { legajo: "U001", nombre: "Ana García",        email: "ana.garcia@uni.edu",        carreraId: 1, anioIngreso: 2023, activo: true  },
  { legajo: "U002", nombre: "Bruno Martínez",    email: "bruno.martinez@uni.edu",    carreraId: 1, anioIngreso: 2022, activo: true  },
  { legajo: "U003", nombre: "Carla López",       email: "carla.lopez@uni.edu",       carreraId: 3, anioIngreso: 2023, activo: true  },
  { legajo: "U004", nombre: "Diego Fernández",   email: "diego.fernandez@uni.edu",   carreraId: 2, anioIngreso: 2021, activo: true  },
  { legajo: "U005", nombre: "Elena Rodríguez",   email: "elena.rodriguez@uni.edu",   carreraId: 4, anioIngreso: 2024, activo: true  },
];

// ─────────────────────────────────────────────
// HELPERS — Carrera
// ─────────────────────────────────────────────

/** Devuelve una carrera por su id, o undefined si no existe */
const buscarCarrera = (id) =>
  carreras.find((c) => c.id === parseInt(id));

/** Devuelve solo las carreras activas */
const carrerasActivas = () =>
  carreras.filter((c) => c.activa);

/** Agrega una carrera nueva. Devuelve la carrera creada. */
const agregarCarrera = ({ nombre, duracion, activa = true }) => {
  const id = carreras.length > 0 ? Math.max(...carreras.map((c) => c.id)) + 1 : 1;
  const nueva = { id, nombre, duracion, activa };
  carreras.push(nueva);
  return nueva;
};

// ─────────────────────────────────────────────
// HELPERS — Estudiante
// ─────────────────────────────────────────────

/** Devuelve un estudiante por legajo (insensible a mayúsculas) */
const buscarEstudiante = (legajo) =>
  estudiantes.find((e) => e.legajo.toUpperCase() === legajo.toUpperCase());

/** Devuelve todos los estudiantes de una carrera */
const estudiantesPorCarrera = (carreraId) =>
  estudiantes.filter((e) => e.carreraId === parseInt(carreraId) && e.activo);

/**
 * Agrega un estudiante nuevo.
 * Valida que el legajo no exista y que la carrera sea válida.
 * Devuelve { ok: true, estudiante } o { ok: false, error }
 */
const agregarEstudiante = ({ legajo, nombre, email, carreraId, anioIngreso }) => {
  if (!legajo || !nombre || !email || !carreraId || !anioIngreso) {
    return { ok: false, error: "Todos los campos son obligatorios." };
  }
  if (buscarEstudiante(legajo)) {
    return { ok: false, error: `El legajo ${legajo} ya existe.` };
  }
  if (!buscarCarrera(carreraId)) {
    return { ok: false, error: `La carrera con id ${carreraId} no existe.` };
  }
  const nuevo = { legajo: legajo.toUpperCase(), nombre, email, carreraId: parseInt(carreraId), anioIngreso: parseInt(anioIngreso), activo: true };
  estudiantes.push(nuevo);
  return { ok: true, estudiante: nuevo };
};

/**
 * Da de baja (lógica) a un estudiante.
 * Devuelve true si se encontró y desactivó, false si no existía.
 */
const darDeBajaEstudiante = (legajo) => {
  const est = buscarEstudiante(legajo);
  if (!est) return false;
  est.activo = false;
  return true;
};

// ─────────────────────────────────────────────
// INTEGRACIÓN CON EL DB PRINCIPAL
// ─────────────────────────────────────────────
// Para usar junto con calificaciones.js, extendé el objeto `db`
// con estas dos propiedades al inicio del archivo:
//
//   const db = {
//     carreras,       // ← agregar esto
//     estudiantes,    // ← reemplaza el array original
//     periodoActivo: { ... },
//     materias: [ ... ],
//     calificaciones: [ ... ],
//     notificaciones: [],
//     logAuditoria: [],
//   };
//
// Y reemplazá la función buscarEstudiante() existente por la de este archivo,
// que además incluye validación de carrera y estado activo.

// ─────────────────────────────────────────────
// EXPORTS (para uso como módulo)
// ─────────────────────────────────────────────

module.exports = {
  // Datos
  carreras,
  estudiantes,
  // Helpers Carrera
  buscarCarrera,
  carrerasActivas,
  agregarCarrera,
  // Helpers Estudiante
  buscarEstudiante,
  estudiantesPorCarrera,
  agregarEstudiante,
  darDeBajaEstudiante,
};





/**
 * US-04 — Consultar calificaciones propias
 * Integrante 1 — Milestone 2
 *
 * Permite que un estudiante consulte sus notas por materia.
 * Solo muestra calificaciones publicadas por el docente.
 * Indica el estado: Aprobado / Aplazado / En curso / Pendiente.
 *
 * USO STANDALONE:
 *   node db_consultar_calificaciones.js
 *
 * USO COMO MÓDULO (integrado en calificaciones.js):
 *   const { us04_consultarCalificaciones } = require('./db_consultar_calificaciones');
 */

const readline = require("readline");

// ─────────────────────────────────────────────
// BASE DE DATOS (se reemplaza por el db central al integrar)
// ─────────────────────────────────────────────

const db = {
  estudiantes: [
    { legajo: "U001", nombre: "Ana García",      email: "ana.garcia@uni.edu",      carreraId: 1 },
    { legajo: "U002", nombre: "Bruno Martínez",  email: "bruno.martinez@uni.edu",  carreraId: 1 },
    { legajo: "U003", nombre: "Carla López",     email: "carla.lopez@uni.edu",     carreraId: 3 },
    { legajo: "U004", nombre: "Diego Fernández", email: "diego.fernandez@uni.edu", carreraId: 2 },
    { legajo: "U005", nombre: "Elena Rodríguez", email: "elena.rodriguez@uni.edu", carreraId: 4 },
  ],
  carreras: [
    { id: 1, nombre: "Ingeniería en Sistemas"     },
    { id: 2, nombre: "Ingeniería Industrial"       },
    { id: 3, nombre: "Licenciatura en Informática" },
    { id: 4, nombre: "Tecnicatura en Programación" },
  ],
  materias: [
    { id: 1, nombre: "Matemática I"              },
    { id: 2, nombre: "Algoritmos y Estructuras"  },
    { id: 3, nombre: "Física I"                  },
  ],
  calificaciones: [
    // publicada: true  → el estudiante puede ver la nota
    // publicada: false → aparece como "Pendiente de publicación"
    { legajo: "U001", materiaId: 1, parcial1: 8,    parcial2: 7,    final: 8,    publicada: true,  fechaCarga: "2025-06-10" },
    { legajo: "U001", materiaId: 2, parcial1: 6,    parcial2: 7,    final: null, publicada: false, fechaCarga: null         },
    { legajo: "U001", materiaId: 3, parcial1: 7,    parcial2: 8,    final: null, publicada: false, fechaCarga: null         },
    { legajo: "U002", materiaId: 1, parcial1: 4,    parcial2: 5,    final: 4,    publicada: true,  fechaCarga: "2025-06-10" },
    { legajo: "U003", materiaId: 1, parcial1: 9,    parcial2: 10,   final: 9,    publicada: true,  fechaCarga: "2025-06-10" },
    { legajo: "U004", materiaId: 2, parcial1: 6,    parcial2: 7,    final: 7,    publicada: true,  fechaCarga: "2025-06-11" },
    { legajo: "U005", materiaId: 2, parcial1: null, parcial2: null, final: null, publicada: false, fechaCarga: null         },
  ],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const pregunta    = (msg) => new Promise((res) => rl.question(msg, res));
const limpiar     = () => process.stdout.write("\x1Bc");
const linea       = (char = "─", len = 58) => console.log(char.repeat(len));
const titulo      = (texto) => { linea(); console.log(`  ${texto}`); linea(); };
const pausa       = () => pregunta("\n  Presioná ENTER para continuar...");

const colorVerde    = (t) => `\x1b[32m${t}\x1b[0m`;
const colorRojo     = (t) => `\x1b[31m${t}\x1b[0m`;
const colorAmarillo = (t) => `\x1b[33m${t}\x1b[0m`;
const colorCian     = (t) => `\x1b[36m${t}\x1b[0m`;
const colorGris     = (t) => `\x1b[90m${t}\x1b[0m`;
const negrita       = (t) => `\x1b[1m${t}\x1b[0m`;

/** Busca un estudiante por legajo (insensible a mayúsculas) */
const buscarEstudiante = (legajo) =>
  db.estudiantes.find((e) => e.legajo.toUpperCase() === legajo.toUpperCase());

/** Busca una materia por id */
const buscarMateria = (id) =>
  db.materias.find((m) => m.id === parseInt(id));

/** Busca la carrera de un estudiante */
const buscarCarrera = (carreraId) =>
  db.carreras.find((c) => c.id === parseInt(carreraId));

/**
 * Determina el estado de una calificación.
 * Retorna: "Aprobado" | "Aplazado" | "En curso" | "Pendiente"
 */
const calcularEstado = (cal) => {
  if (!cal.publicada)       return "Pendiente";
  if (cal.final === null)   return "En curso";
  if (cal.final >= 6)       return "Aprobado";
  return "Aplazado";
};

/** Colorea el estado para mostrarlo en consola */
const estadoColoreado = (estado) => {
  switch (estado) {
    case "Aprobado":  return colorVerde(estado);
    case "Aplazado":  return colorRojo(estado);
    case "En curso":  return colorAmarillo(estado);
    case "Pendiente": return colorGris(estado);
    default:          return estado;
  }
};

/**
 * Calcula el promedio general del estudiante
 * considerando solo notas finales publicadas.
 */
const calcularPromedioGeneral = (legajo) => {
  const finales = db.calificaciones.filter(
    (c) => c.legajo.toUpperCase() === legajo.toUpperCase()
      && c.publicada
      && c.final !== null
  );
  if (finales.length === 0) return null;
  const suma = finales.reduce((acc, c) => acc + c.final, 0);
  return (suma / finales.length).toFixed(2);
};

// ─────────────────────────────────────────────
// US-04 — Consultar calificaciones propias
// ─────────────────────────────────────────────

async function us04_consultarCalificaciones() {
  limpiar();
  titulo("US-04 · Consultar mis calificaciones  [Estudiante]");

  // 1. Pedir legajo
  const legajo = (await pregunta("  Tu legajo: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);

  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Legajo no encontrado. Verificá el número ingresado."));
    await pausa();
    return;
  }

  // 2. Obtener calificaciones del estudiante
  const misCals = db.calificaciones.filter(
    (c) => c.legajo.toUpperCase() === legajo
  );

  // 3. Encabezado del estudiante
  const carrera = buscarCarrera(estudiante.carreraId);
  console.log(`\n  ${negrita(estudiante.nombre)}`);
  console.log(`  Legajo  : ${colorCian(legajo)}`);
  console.log(`  Carrera : ${carrera ? carrera.nombre : "—"}`);
  console.log(`  Email   : ${colorGris(estudiante.email)}`);
  linea("·", 58);

  if (misCals.length === 0) {
    console.log(colorAmarillo("\n  Sin registros académicos para este legajo."));
    await pausa();
    return;
  }

  // 4. Tabla de calificaciones
  const COL_MATERIA = 28;
  const header =
    `  ${"MATERIA".padEnd(COL_MATERIA)} ` +
    `${"P1".padStart(4)} ` +
    `${"P2".padStart(4)} ` +
    `${"FINAL".padStart(6)}  ESTADO`;
  console.log(`\n${colorGris(header)}`);
  linea("─", 58);

  let aprobadas = 0;
  let cursando  = 0;
  let aplazadas = 0;

  misCals.forEach((cal) => {
    const mat    = buscarMateria(cal.materiaId);
    const estado = calcularEstado(cal);

    if (estado === "Pendiente") {
      // Nota no publicada: no mostrar valores
      console.log(
        `  ${mat.nombre.padEnd(COL_MATERIA)} ` +
        `${colorGris("(pendiente de publicación por el docente)")}`
      );
      cursando++;
    } else {
      const p1  = cal.parcial1 !== null ? String(cal.parcial1).padStart(4) : colorGris("   -");
      const p2  = cal.parcial2 !== null ? String(cal.parcial2).padStart(4) : colorGris("   -");
      const fin = cal.final    !== null ? String(cal.final).padStart(6)    : colorGris("     -");

      console.log(
        `  ${mat.nombre.padEnd(COL_MATERIA)} ${p1} ${p2} ${fin}  ${estadoColoreado(estado)}`
      );

      if (estado === "Aprobado") aprobadas++;
      else if (estado === "Aplazado") aplazadas++;
      else cursando++;
    }
  });

  // 5. Resumen final
  linea("─", 58);
  const promedio = calcularPromedioGeneral(legajo);
  console.log(
    `\n  Aprobadas: ${colorVerde(aprobadas)}  ` +
    `Aplazadas: ${colorRojo(aplazadas)}  ` +
    `En curso/Pendiente: ${colorAmarillo(cursando)}`
  );
  if (promedio !== null) {
    console.log(`  Promedio general (materias con final publicado): ${negrita(colorCian(promedio))}`);
  } else {
    console.log(`  ${colorGris("Aún no hay notas finales publicadas para calcular promedio.")}`);
  }
  console.log();

  await pausa();
}

// ─────────────────────────────────────────────
// EXPORTS (para integrar en calificaciones.js)
// ─────────────────────────────────────────────

module.exports = {
  us04_consultarCalificaciones,
  // helpers reutilizables
  calcularEstado,
  calcularPromedioGeneral,
};

// ─────────────────────────────────────────────
// INICIO (solo si se ejecuta directamente)
// ─────────────────────────────────────────────

if (require.main === module) {
  us04_consultarCalificaciones().then(() => {
    rl.close();
    process.exit(0);
  });
}



/**
 * US-04 — Consultar calificaciones propias
 * Integrante 1 — Milestone 2
 *
 * Permite que un estudiante consulte sus notas por materia.
 * Solo muestra calificaciones publicadas por el docente.
 * Indica el estado: Aprobado / Aplazado / En curso / Pendiente.
 *
 * USO STANDALONE:
 *   node db_consultar_calificaciones.js
 *
 * USO COMO MÓDULO (integrado en calificaciones.js):
 *   const { us04_consultarCalificaciones } = require('./db_consultar_calificaciones');
 */

const readline = require("readline");

// ─────────────────────────────────────────────
// BASE DE DATOS (se reemplaza por el db central al integrar)
// ─────────────────────────────────────────────

const db = {
  estudiantes: [
    { legajo: "U001", nombre: "Ana García",      email: "ana.garcia@uni.edu",      carreraId: 1 },
    { legajo: "U002", nombre: "Bruno Martínez",  email: "bruno.martinez@uni.edu",  carreraId: 1 },
    { legajo: "U003", nombre: "Carla López",     email: "carla.lopez@uni.edu",     carreraId: 3 },
    { legajo: "U004", nombre: "Diego Fernández", email: "diego.fernandez@uni.edu", carreraId: 2 },
    { legajo: "U005", nombre: "Elena Rodríguez", email: "elena.rodriguez@uni.edu", carreraId: 4 },
  ],
  carreras: [
    { id: 1, nombre: "Ingeniería en Sistemas"     },
    { id: 2, nombre: "Ingeniería Industrial"       },
    { id: 3, nombre: "Licenciatura en Informática" },
    { id: 4, nombre: "Tecnicatura en Programación" },
  ],
  materias: [
    { id: 1, nombre: "Matemática I"              },
    { id: 2, nombre: "Algoritmos y Estructuras"  },
    { id: 3, nombre: "Física I"                  },
  ],
  calificaciones: [
    // publicada: true  → el estudiante puede ver la nota
    // publicada: false → aparece como "Pendiente de publicación"
    { legajo: "U001", materiaId: 1, parcial1: 8,    parcial2: 7,    final: 8,    publicada: true,  fechaCarga: "2025-06-10" },
    { legajo: "U001", materiaId: 2, parcial1: 6,    parcial2: 7,    final: null, publicada: false, fechaCarga: null         },
    { legajo: "U001", materiaId: 3, parcial1: 7,    parcial2: 8,    final: null, publicada: false, fechaCarga: null         },
    { legajo: "U002", materiaId: 1, parcial1: 4,    parcial2: 5,    final: 4,    publicada: true,  fechaCarga: "2025-06-10" },
    { legajo: "U003", materiaId: 1, parcial1: 9,    parcial2: 10,   final: 9,    publicada: true,  fechaCarga: "2025-06-10" },
    { legajo: "U004", materiaId: 2, parcial1: 6,    parcial2: 7,    final: 7,    publicada: true,  fechaCarga: "2025-06-11" },
    { legajo: "U005", materiaId: 2, parcial1: null, parcial2: null, final: null, publicada: false, fechaCarga: null         },
  ],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const pregunta    = (msg) => new Promise((res) => rl.question(msg, res));
const limpiar     = () => process.stdout.write("\x1Bc");
const linea       = (char = "─", len = 58) => console.log(char.repeat(len));
const titulo      = (texto) => { linea(); console.log(`  ${texto}`); linea(); };
const pausa       = () => pregunta("\n  Presioná ENTER para continuar...");

const colorVerde    = (t) => `\x1b[32m${t}\x1b[0m`;
const colorRojo     = (t) => `\x1b[31m${t}\x1b[0m`;
const colorAmarillo = (t) => `\x1b[33m${t}\x1b[0m`;
const colorCian     = (t) => `\x1b[36m${t}\x1b[0m`;
const colorGris     = (t) => `\x1b[90m${t}\x1b[0m`;
const negrita       = (t) => `\x1b[1m${t}\x1b[0m`;

/** Busca un estudiante por legajo (insensible a mayúsculas) */
const buscarEstudiante = (legajo) =>
  db.estudiantes.find((e) => e.legajo.toUpperCase() === legajo.toUpperCase());

/** Busca una materia por id */
const buscarMateria = (id) =>
  db.materias.find((m) => m.id === parseInt(id));

/** Busca la carrera de un estudiante */
const buscarCarrera = (carreraId) =>
  db.carreras.find((c) => c.id === parseInt(carreraId));

/**
 * Determina el estado de una calificación.
 * Retorna: "Aprobado" | "Aplazado" | "En curso" | "Pendiente"
 */
const calcularEstado = (cal) => {
  if (!cal.publicada)       return "Pendiente";
  if (cal.final === null)   return "En curso";
  if (cal.final >= 6)       return "Aprobado";
  return "Aplazado";
};

/** Colorea el estado para mostrarlo en consola */
const estadoColoreado = (estado) => {
  switch (estado) {
    case "Aprobado":  return colorVerde(estado);
    case "Aplazado":  return colorRojo(estado);
    case "En curso":  return colorAmarillo(estado);
    case "Pendiente": return colorGris(estado);
    default:          return estado;
  }
};

/**
 * Calcula el promedio general del estudiante
 * considerando solo notas finales publicadas.
 */
const calcularPromedioGeneral = (legajo) => {
  const finales = db.calificaciones.filter(
    (c) => c.legajo.toUpperCase() === legajo.toUpperCase()
      && c.publicada
      && c.final !== null
  );
  if (finales.length === 0) return null;
  const suma = finales.reduce((acc, c) => acc + c.final, 0);
  return (suma / finales.length).toFixed(2);
};

// ─────────────────────────────────────────────
// US-04 — Consultar calificaciones propias
// ─────────────────────────────────────────────

async function us04_consultarCalificaciones() {
  limpiar();
  titulo("US-04 · Consultar mis calificaciones  [Estudiante]");

  // 1. Pedir legajo
  const legajo = (await pregunta("  Tu legajo: ")).trim().toUpperCase();
  const estudiante = buscarEstudiante(legajo);

  if (!estudiante) {
    console.log(colorRojo("\n  ✗ Legajo no encontrado. Verificá el número ingresado."));
    await pausa();
    return;
  }

  // 2. Obtener calificaciones del estudiante
  const misCals = db.calificaciones.filter(
    (c) => c.legajo.toUpperCase() === legajo
  );

  // 3. Encabezado del estudiante
  const carrera = buscarCarrera(estudiante.carreraId);
  console.log(`\n  ${negrita(estudiante.nombre)}`);
  console.log(`  Legajo  : ${colorCian(legajo)}`);
  console.log(`  Carrera : ${carrera ? carrera.nombre : "—"}`);
  console.log(`  Email   : ${colorGris(estudiante.email)}`);
  linea("·", 58);

  if (misCals.length === 0) {
    console.log(colorAmarillo("\n  Sin registros académicos para este legajo."));
    await pausa();
    return;
  }

  // 4. Tabla de calificaciones
  const COL_MATERIA = 28;
  const header =
    `  ${"MATERIA".padEnd(COL_MATERIA)} ` +
    `${"P1".padStart(4)} ` +
    `${"P2".padStart(4)} ` +
    `${"FINAL".padStart(6)}  ESTADO`;
  console.log(`\n${colorGris(header)}`);
  linea("─", 58);

  let aprobadas = 0;
  let cursando  = 0;
  let aplazadas = 0;

  misCals.forEach((cal) => {
    const mat    = buscarMateria(cal.materiaId);
    const estado = calcularEstado(cal);

    if (estado === "Pendiente") {
      // Nota no publicada: no mostrar valores
      console.log(
        `  ${mat.nombre.padEnd(COL_MATERIA)} ` +
        `${colorGris("(pendiente de publicación por el docente)")}`
      );
      cursando++;
    } else {
      const p1  = cal.parcial1 !== null ? String(cal.parcial1).padStart(4) : colorGris("   -");
      const p2  = cal.parcial2 !== null ? String(cal.parcial2).padStart(4) : colorGris("   -");
      const fin = cal.final    !== null ? String(cal.final).padStart(6)    : colorGris("     -");

      console.log(
        `  ${mat.nombre.padEnd(COL_MATERIA)} ${p1} ${p2} ${fin}  ${estadoColoreado(estado)}`
      );

      if (estado === "Aprobado") aprobadas++;
      else if (estado === "Aplazado") aplazadas++;
      else cursando++;
    }
  });

  // 5. Resumen final
  linea("─", 58);
  const promedio = calcularPromedioGeneral(legajo);
  console.log(
    `\n  Aprobadas: ${colorVerde(aprobadas)}  ` +
    `Aplazadas: ${colorRojo(aplazadas)}  ` +
    `En curso/Pendiente: ${colorAmarillo(cursando)}`
  );
  if (promedio !== null) {
    console.log(`  Promedio general (materias con final publicado): ${negrita(colorCian(promedio))}`);
  } else {
    console.log(`  ${colorGris("Aún no hay notas finales publicadas para calcular promedio.")}`);
  }
  console.log();

  await pausa();
}

// ─────────────────────────────────────────────
// EXPORTS (para integrar en calificaciones.js)
// ─────────────────────────────────────────────

module.exports = {
  us04_consultarCalificaciones,
  // helpers reutilizables
  calcularEstado,
  calcularPromedioGeneral,
};

// ─────────────────────────────────────────────
// INICIO (solo si se ejecuta directamente)
// ─────────────────────────────────────────────

if (require.main === module) {
  us04_consultarCalificaciones().then(() => {
    rl.close();
    process.exit(0);
  });
}