#!/usr/bin/env node

/**
 * db_materia.js
 * Integrante 3 — Milestone 1
 *
 * Contiene las estructuras de datos (db en memoria) para:
 *   - Materia
 *   - Período de carga
 *
 * Para integrar: importar este archivo desde calificaciones.js
 * y reemplazar/extender el objeto `db` principal con estas colecciones.
 */

// ─────────────────────────────────────────────
// DB: MATERIA
// ─────────────────────────────────────────────

/**
 * Estructura de cada materia:
 *   id       {number}  - Identificador único autoincremental
 *   nombre   {string}  - Nombre completo de la materia
 *   codigo   {string}  - Código alfanumérico (ej: "MAT101")
 *   creditos {number}  - Cantidad de créditos académicos
 *   activa   {boolean} - false = baja lógica (no se borra para preservar historial)
 */
const materias = [
  { id: 1, nombre: "Matemática I",             codigo: "MAT101", creditos: 6, activa: true  },
  { id: 2, nombre: "Algoritmos y Estructuras", codigo: "AED201", creditos: 6, activa: true  },
  { id: 3, nombre: "Física I",                 codigo: "FIS101", creditos: 5, activa: true  },
  { id: 4, nombre: "Base de Datos I",          codigo: "BDD301", creditos: 5, activa: false },
];

// ─────────────────────────────────────────────
// DB: PERÍODO DE CARGA
// ─────────────────────────────────────────────

/**
 * Período activo (solo puede haber uno a la vez).
 *
 * Estructura:
 *   id          {number}   - Identificador del período
 *   nombre      {string}   - Descripción (ej: "1er cuatrimestre 2025")
 *   inicio      {Date}     - Fecha de inicio del período
 *   cierre      {Date}     - Fecha de cierre del período
 *   estado      {string}   - "abierto" | "cerrado"
 *   excepciones {string[]} - Legajos con permiso de edición aunque el período esté cerrado
 */
const periodoActivo = {
  id:          1,
  nombre:      "Primer cuatrimestre 2025",
  inicio:      new Date("2025-03-01"),
  cierre:      new Date("2026-12-31"),
  estado:      "abierto",
  excepciones: [],
};

/**
 * Historial de períodos anteriores (para auditoría).
 * Cada vez que se abre un período nuevo, el anterior se archiva aquí.
 *
 * Cada entrada tiene la misma estructura que periodoActivo,
 * más el estado final "cerrado".
 */
const historialPeriodos = [];

// ─────────────────────────────────────────────
// FUNCIONES CRUD — MATERIA
// ─────────────────────────────────────────────

/**
 * Busca una materia por su id.
 * @param {number|string} id
 * @returns {object|undefined}
 */
function buscarMateria(id) {
  return materias.find((m) => m.id === parseInt(id));
}

/**
 * Devuelve solo las materias activas.
 * @returns {object[]}
 */
function obtenerMateriasActivas() {
  return materias.filter((m) => m.activa);
}

/**
 * Agrega una nueva materia a la db.
 * @param {string} nombre
 * @param {string} codigo
 * @param {number} creditos
 * @returns {object} La materia creada.
 */
function agregarMateria(nombre, codigo, creditos) {
  const id = materias.length > 0 ? Math.max(...materias.map((m) => m.id)) + 1 : 1;
  const nueva = {
    id,
    nombre:   nombre.trim(),
    codigo:   codigo.trim().toUpperCase(),
    creditos: parseInt(creditos),
    activa:   true,
  };
  materias.push(nueva);
  return nueva;
}

/**
 * Desactiva una materia (baja lógica).
 * No se elimina el registro para preservar calificaciones históricas.
 * @param {number|string} id
 * @returns {boolean} true si se encontró y desactivó.
 */
function desactivarMateria(id) {
  const m = buscarMateria(id);
  if (!m) return false;
  m.activa = false;
  return true;
}

// ─────────────────────────────────────────────
// FUNCIONES CRUD — PERÍODO DE CARGA
// ─────────────────────────────────────────────

/**
 * Verifica si el período de carga está habilitado.
 * Si se pasa un legajo, también chequea si tiene excepción activa.
 * @param {string|null} legajo
 * @returns {boolean}
 */
function periodoHabilitado(legajo = null) {
  if (legajo && periodoActivo.excepciones.includes(legajo.toUpperCase())) return true;
  if (periodoActivo.estado === "cerrado") return false;
  const hoy = new Date();
  return hoy >= periodoActivo.inicio && hoy <= periodoActivo.cierre;
}

/**
 * Abre un nuevo período de carga.
 * Archiva el período activo anterior en historialPeriodos.
 * @param {string} nombre
 * @param {Date|string} inicio
 * @param {Date|string} cierre
 * @returns {object} El nuevo período activo.
 */
function abrirPeriodo(nombre, inicio, cierre) {
  if (periodoActivo.nombre) {
    historialPeriodos.push({ ...periodoActivo, estado: "cerrado" });
  }
  periodoActivo.id          = historialPeriodos.length + 1;
  periodoActivo.nombre      = nombre.trim();
  periodoActivo.inicio      = new Date(inicio);
  periodoActivo.cierre      = new Date(cierre);
  periodoActivo.estado      = "abierto";
  periodoActivo.excepciones = [];
  return { ...periodoActivo };
}

/**
 * Cierra el período activo manualmente.
 * Las excepciones siguen vigentes para edición individual.
 */
function cerrarPeriodo() {
  periodoActivo.estado = "cerrado";
}

/**
 * Extiende la fecha de cierre del período activo.
 * Si estaba cerrado, lo reabre automáticamente.
 * @param {Date|string} nuevaFechaCierre
 */
function extenderPeriodo(nuevaFechaCierre) {
  periodoActivo.cierre = new Date(nuevaFechaCierre);
  periodoActivo.estado = "abierto";
}

/**
 * Agrega una excepción de edición para un legajo específico.
 * @param {string} legajo
 * @returns {boolean} false si ya tenía excepción.
 */
function habilitarExcepcion(legajo) {
  const l = legajo.toUpperCase();
  if (periodoActivo.excepciones.includes(l)) return false;
  periodoActivo.excepciones.push(l);
  return true;
}

/**
 * Revoca la excepción de edición de un legajo.
 * @param {string} legajo
 * @returns {boolean} false si no tenía excepción.
 */
function revocarExcepcion(legajo) {
  const l = legajo.toUpperCase();
  const idx = periodoActivo.excepciones.indexOf(l);
  if (idx === -1) return false;
  periodoActivo.excepciones.splice(idx, 1);
  return true;
}

// ─────────────────────────────────────────────
// EXPORTAR
// (descomentar si el proyecto usa módulos CommonJS)
// ─────────────────────────────────────────────

// module.exports = {
//   // Datos
//   materias,
//   periodoActivo,
//   historialPeriodos,
//   // Materia
//   buscarMateria,
//   obtenerMateriasActivas,
//   agregarMateria,
//   desactivarMateria,
//   // Período
//   periodoHabilitado,
//   abrirPeriodo,
//   cerrarPeriodo,
//   extenderPeriodo,
//   habilitarExcepcion,
//   revocarExcepcion,
// };




/**
 * gestionar_periodos.js
 * Integrante 3 — Milestone 2
 *
 * Issue: Gestionar períodos de carga  [Administrador]
 *
 * Depende de db_materia.js (Milestone 1).
 * Para integrar: agregar la función menuGestionarPeriodos()
 * como opción en el menú principal de calificaciones.js.
 */

const readline = require("readline");

// ─────────────────────────────────────────────
// DB (copiada de db_materia.js para correr solo)
// Al integrar, estas líneas se eliminan y se importa
// el db_materia.js del Milestone 1.
// ─────────────────────────────────────────────

const periodoActivo = {
  id:          1,
  nombre:      "Primer cuatrimestre 2025",
  inicio:      new Date("2025-03-01"),
  cierre:      new Date("2026-12-31"),
  estado:      "abierto",   // "abierto" | "cerrado"
  excepciones: [],
};

const historialPeriodos = [];

// ─────────────────────────────────────────────
// LÓGICA DE NEGOCIO — PERÍODOS
// ─────────────────────────────────────────────

/**
 * Verifica si el período está habilitado para cargar notas.
 * Si se pasa legajo, también chequea excepciones individuales.
 */
function periodoHabilitado(legajo = null) {
  if (legajo && periodoActivo.excepciones.includes(legajo.toUpperCase())) return true;
  if (periodoActivo.estado === "cerrado") return false;
  const hoy = new Date();
  return hoy >= periodoActivo.inicio && hoy <= periodoActivo.cierre;
}

/**
 * Abre un nuevo período.
 * El período anterior se archiva en historialPeriodos.
 */
function abrirPeriodo(nombre, inicio, cierre) {
  historialPeriodos.push({
    id:          periodoActivo.id,
    nombre:      periodoActivo.nombre,
    inicio:      periodoActivo.inicio,
    cierre:      periodoActivo.cierre,
    estado:      "cerrado",
    excepciones: [...periodoActivo.excepciones],
  });
  periodoActivo.id          = historialPeriodos.length + 1;
  periodoActivo.nombre      = nombre.trim();
  periodoActivo.inicio      = new Date(inicio);
  periodoActivo.cierre      = new Date(cierre);
  periodoActivo.estado      = "abierto";
  periodoActivo.excepciones = [];
}

/**
 * Cierra el período activo.
 * Las excepciones individuales siguen vigentes.
 */
function cerrarPeriodo() {
  periodoActivo.estado = "cerrado";
}

/**
 * Extiende la fecha de cierre y reabre el período si estaba cerrado.
 */
function extenderPeriodo(nuevaFechaCierre) {
  periodoActivo.cierre = new Date(nuevaFechaCierre);
  periodoActivo.estado = "abierto";
}

// ─────────────────────────────────────────────
// HELPERS DE CONSOLA
// ─────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const pregunta      = (msg) => new Promise((res) => rl.question(msg, res));
const limpiar       = () => process.stdout.write("\x1Bc");
const linea         = (char = "─", len = 56) => console.log(char.repeat(len));
const titulo        = (texto) => { linea(); console.log(`  ${texto}`); linea(); };
const pausa         = () => pregunta("\n  Presioná ENTER para continuar...");
const colorVerde    = (t) => `\x1b[32m${t}\x1b[0m`;
const colorRojo     = (t) => `\x1b[31m${t}\x1b[0m`;
const colorAmarillo = (t) => `\x1b[33m${t}\x1b[0m`;
const colorCian     = (t) => `\x1b[36m${t}\x1b[0m`;
const colorGris     = (t) => `\x1b[90m${t}\x1b[0m`;
const negrita       = (t) => `\x1b[1m${t}\x1b[0m`;

/**
 * Parsea una fecha YYYY-MM-DD y devuelve un Date válido o null.
 */
function parsearFecha(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Muestra el estado actual del período activo en pantalla.
 */
function mostrarEstadoPeriodo() {
  const p = periodoActivo;
  const estadoColor = p.estado === "abierto" ? colorVerde("ABIERTO") : colorRojo("CERRADO");
  const hoyDentro   = periodoHabilitado()     ? colorVerde("Sí")      : colorRojo("No");

  console.log(`\n  Período activo`);
  linea("·", 56);
  console.log(`  Nombre      : ${negrita(p.nombre)}`);
  console.log(`  Estado      : ${estadoColor}`);
  console.log(`  Inicio      : ${p.inicio.toLocaleDateString("es-AR")}`);
  console.log(`  Cierre      : ${p.cierre.toLocaleDateString("es-AR")}`);
  console.log(`  Carga hoy   : ${hoyDentro}`);
  console.log(
    `  Excepciones : ${
      p.excepciones.length > 0
        ? p.excepciones.join(", ")
        : colorGris("ninguna")
    }`
  );
  linea("·", 56);
}

// ─────────────────────────────────────────────
// MENÚ: GESTIONAR PERÍODOS DE CARGA
// ─────────────────────────────────────────────

async function menuGestionarPeriodos() {
  while (true) {
    limpiar();
    titulo("Gestionar períodos de carga  [Administrador]");
    mostrarEstadoPeriodo();

    console.log();
    console.log("   [1]  Abrir nuevo período");
    console.log("   [2]  Cerrar período actual");
    console.log("   [3]  Extender fecha de cierre");
    console.log("   [4]  Ver historial de períodos");
    console.log("   [0]  Volver al menú principal");
    console.log();

    const op = (await pregunta("  Opción: ")).trim();

    // ── [1] Abrir nuevo período ────────────────────────────────────
    if (op === "1") {
      limpiar();
      titulo("Abrir nuevo período de carga");

      if (periodoActivo.estado === "abierto") {
        console.log(colorAmarillo(
          "  ⚠  Hay un período abierto actualmente.\n" +
          "     Abrir uno nuevo lo archivará y cerrará el actual."
        ));
        const conf = (await pregunta("  ¿Continuar? (s/n): ")).trim().toLowerCase();
        if (conf !== "s") {
          console.log(colorGris("  Cancelado."));
          await pausa();
          continue;
        }
      }

      const nombre = (await pregunta("  Nombre del período (ej: 2do cuatrimestre 2025): ")).trim();
      if (!nombre) {
        console.log(colorRojo("\n  ✗ El nombre no puede estar vacío."));
        await pausa();
        continue;
      }

      const inicioStr = (await pregunta("  Fecha de inicio (YYYY-MM-DD): ")).trim();
      const cierreStr = (await pregunta("  Fecha de cierre (YYYY-MM-DD): ")).trim();

      const inicio = parsearFecha(inicioStr);
      const cierre = parsearFecha(cierreStr);

      if (!inicio || !cierre) {
        console.log(colorRojo("\n  ✗ Fechas inválidas. Usá el formato YYYY-MM-DD."));
        await pausa();
        continue;
      }
      if (cierre <= inicio) {
        console.log(colorRojo("\n  ✗ La fecha de cierre debe ser posterior al inicio."));
        await pausa();
        continue;
      }

      abrirPeriodo(nombre, inicio, cierre);
      console.log(colorVerde(`\n  ✓ Período "${nombre}" abierto correctamente.`));
      console.log(colorGris(`    Inicio: ${inicio.toLocaleDateString("es-AR")}  →  Cierre: ${cierre.toLocaleDateString("es-AR")}`));
      await pausa();

    // ── [2] Cerrar período actual ──────────────────────────────────
    } else if (op === "2") {
      limpiar();
      titulo("Cerrar período actual");

      if (periodoActivo.estado === "cerrado") {
        console.log(colorAmarillo("\n  ⚠  El período ya está cerrado."));
        await pausa();
        continue;
      }

      mostrarEstadoPeriodo();
      const conf = (await pregunta(
        "\n  ¿Cerrar el período? Esto impedirá nuevas cargas de notas.\n" +
        "  (Los legajos con excepción seguirán pudiendo editar.) (s/n): "
      )).trim().toLowerCase();

      if (conf === "s") {
        cerrarPeriodo();
        console.log(colorVerde("\n  ✓ Período cerrado exitosamente."));
      } else {
        console.log(colorGris("  Cancelado."));
      }
      await pausa();

    // ── [3] Extender fecha de cierre ───────────────────────────────
    } else if (op === "3") {
      limpiar();
      titulo("Extender fecha de cierre");
      mostrarEstadoPeriodo();

      const nuevaStr = (await pregunta("\n  Nueva fecha de cierre (YYYY-MM-DD): ")).trim();
      const nueva = parsearFecha(nuevaStr);

      if (!nueva) {
        console.log(colorRojo("\n  ✗ Fecha inválida. Usá el formato YYYY-MM-DD."));
        await pausa();
        continue;
      }
      if (nueva <= periodoActivo.inicio) {
        console.log(colorRojo("\n  ✗ La nueva fecha debe ser posterior al inicio del período."));
        await pausa();
        continue;
      }

      const estabaAbierto = periodoActivo.estado === "abierto";
      extenderPeriodo(nueva);

      console.log(colorVerde(`\n  ✓ Fecha de cierre actualizada: ${nueva.toLocaleDateString("es-AR")}`));
      if (!estabaAbierto) {
        console.log(colorCian("  ℹ  El período estaba cerrado y fue reabierto automáticamente."));
      }
      await pausa();

    // ── [4] Historial ──────────────────────────────────────────────
    } else if (op === "4") {
      limpiar();
      titulo("Historial de períodos");

      if (historialPeriodos.length === 0) {
        console.log(colorGris("\n  No hay períodos anteriores registrados."));
      } else {
        historialPeriodos.forEach((h, i) => {
          console.log(`\n  ${i + 1}. ${negrita(h.nombre)}`);
          console.log(`     Inicio : ${h.inicio.toLocaleDateString("es-AR")}`);
          console.log(`     Cierre : ${h.cierre.toLocaleDateString("es-AR")}`);
          console.log(`     Estado : ${colorGris(h.estado)}`);
        });
      }
      await pausa();

    // ── [0] Volver ─────────────────────────────────────────────────
    } else if (op === "0") {
      break;

    } else {
      console.log(colorRojo("  ✗ Opción inválida."));
      await new Promise((r) => setTimeout(r, 600));
    }
  }
}

// ─────────────────────────────────────────────
// INICIO (para correr el archivo solo)
// Al integrar en calificaciones.js, eliminar este bloque
// y llamar a menuGestionarPeriodos() desde el menú principal.
// ─────────────────────────────────────────────

menuGestionarPeriodos().then(() => {
  console.log(colorGris("\n  Saliendo...\n"));
  rl.close();
  process.exit(0);
}).catch((err) => {
  console.error("Error:", err);
  rl.close();
});