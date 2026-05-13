# groupnineteamnarcizo
"Team Ferrari"
# 🎓 Sistema de Gestión de Calificaciones Universitarias

> **Team Ferrari** — Grupo 9 | Proyecto Final  
> Materia: Laboratorio de Computación · Universidad

---

## 📋 Descripción

Sistema de gestión de calificaciones universitarias desarrollado en **Node.js** con interfaz interactiva por consola. Permite a docentes registrar, editar y publicar notas, y a estudiantes consultar sus calificaciones y descargar su historial académico en PDF.

---

## 👥 Integrantes

| # | Integrante | Responsabilidades principales |
|---|-----------|-------------------------------|
| 1 | *(Integrante 1)* | DB Estudiante + Carrera · Consultar calificaciones · Historial PDF · README |
| 2 | *(Integrante 2)* | DB Docente + Administrador · Registrar/editar notas · Publicar · Importar masivo · Estadísticas |
| 3 | *(Integrante 3)* | DB Materia + Período de carga · Gestionar períodos · Excepciones de edición |
| 4 | *(Integrante 4)* | DB Calificación · Ranking de promedios |
| 5 | *(Integrante 5)* | DB Notificación + Log + Reporte · Auditoría · Notificaciones · Reportes · Exportar |

---

## ✅ Funcionalidades (User Stories)

### Módulo Docente
| US | Funcionalidad | Estado |
|----|--------------|--------|
| US-01 | Registrar y editar calificaciones (parciales y final) | ✅ Implementada |
| US-02 | Importar calificaciones masivas desde archivo | ✅ Implementada |
| US-03 | Ver estadísticas del curso y alumnos en riesgo | ✅ Implementada |
| US-05 | Publicar notas y notificar a estudiantes | ✅ Implementada |

### Módulo Estudiante
| US | Funcionalidad | Estado |
|----|--------------|--------|
| US-04 | Consultar calificaciones propias | ✅ Implementada |
| US-06 | Descargar historial académico en PDF | ✅ Implementada |

---

## 🗂️ Estructura del proyecto

```
groupnineteamnarcizo/
│
├── calificaciones.js              # Archivo principal — menú y todas las US
│
├── db_estudiante_carrera.js       # Entidades: Estudiante y Carrera (Int. 1)
├── db_consultar_calificaciones.js # US-04: consulta de notas del estudiante (Int. 1)
├── db_historial_academico.js      # US-06: generación de historial en PDF (Int. 1)
│
└── README.md                      # Este archivo
```

### Entidades del sistema

```
Carrera
  └── id, nombre, duracion, activa

Estudiante
  └── legajo, nombre, email, carreraId (FK), anioIngreso, activo

Docente
  └── id, nombre, email, materias[]

Administrador
  └── id, nombre, email

Materia
  └── id, nombre, carreraId (FK)

PeriodoDeCarga
  └── inicio, cierre, excepciones[]

Calificacion
  └── legajo (FK), materiaId (FK), parcial1, parcial2, final, publicada, fechaCarga

Notificacion
  └── legajo (FK), mensaje, fecha

LogAuditoria
  └── usuario, legajo, materiaId, notaAnterior, notaNueva, fecha

Reporte
  └── tipo, materiaId, datos, fechaGeneracion
```

---

## 🚀 Cómo ejecutar el proyecto

### Requisitos

- [Node.js](https://nodejs.org/) v16 o superior
- No requiere instalar dependencias externas (`npm install` no es necesario)

### Verificar Node.js instalado

```bash
node --version
```

### Ejecutar el sistema

```bash
node calificaciones.js
```

Esto abre el **menú principal interactivo** en la consola.

---

## 🖥️ Uso del sistema

Al ejecutar el programa, aparece el menú principal:

```
╔══════════════════════════════════════════════════════╗
║   SISTEMA DE GESTIÓN DE CALIFICACIONES — UNI         ║
╚══════════════════════════════════════════════════════╝

── Módulo Docente ─────────────────────────────────────
 [1]  US-01 · Registrar / editar calificaciones
 [2]  US-02 · Importar calificaciones masivas
 [3]  US-03 · Estadísticas y alumnos en riesgo

── Módulo Estudiante ──────────────────────────────────
 [4]  US-04 · Consultar mis calificaciones
 [5]  US-05 · Publicar notas y notificar
 [6]  US-06 · Descargar historial académico

──────────────────────────────────────────────────────
 [0]  Salir
```

Ingresás el número de la opción y presionás **Enter**.

### Datos de prueba incluidos

El sistema trae datos de ejemplo listos para usar:

| Legajo | Nombre           | Carrera                    |
|--------|-----------------|----------------------------|
| U001   | Ana García       | Ingeniería en Sistemas     |
| U002   | Bruno Martínez   | Ingeniería en Sistemas     |
| U003   | Carla López      | Licenciatura en Informática|
| U004   | Diego Fernández  | Ingeniería Industrial      |
| U005   | Elena Rodríguez  | Tecnicatura en Programación|

---

## 📄 Generación de historial en PDF (US-06)

El historial académico se genera como un **PDF real** sin librerías externas.

- Se guarda en la misma carpeta con el nombre: `historial_<LEGAJO>_<FECHA>.pdf`
- Ejemplo: `historial_U001_20260513.pdf`
- Incluye: datos del estudiante, tabla de calificaciones con estados coloreados y promedio general.

---

## 🔒 Reglas de negocio

- Las notas solo pueden ingresarse dentro del **período de carga activo** (configurable).
- Los docentes con **excepción** pueden editar notas fuera del período.
- Los estudiantes **solo ven notas publicadas** por el docente.
- Toda edición de una nota ya existente queda registrada en el **log de auditoría**.
- Al publicar notas, se genera automáticamente una **notificación** para cada estudiante.
- Las notas válidas están en el rango **0 a 10**.
- Una nota final **≥ 6** es Aprobado; **< 6** es Aplazado.

---

## 🧪 Prueba rápida (end-to-end)

1. Ejecutar `node calificaciones.js`
2. Opción **1** → legajo `U005`, materia `2`, cargar notas de prueba
3. Opción **5** → publicar notas de materia `2`
4. Opción **4** → legajo `U005`, verificar que las notas aparecen publicadas
5. Opción **6** → legajo `U005`, verificar que se genera el PDF
6. Opción **3** → materia `2`, verificar estadísticas actualizadas

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|-----------|-----|
| Node.js   | Entorno de ejecución |
| `readline` | Entrada interactiva por consola (nativo) |
| `fs`       | Generación del archivo PDF (nativo) |
| `path`     | Manejo de rutas de archivo (nativo) |
| Git / GitHub | Control de versiones y trabajo en equipo |

> ⚠️ El proyecto **no requiere** ninguna dependencia de npm. Todo está hecho con módulos nativos de Node.js.

---

## 📅 Milestones del proyecto

| Milestone | Semana | Objetivo |
|-----------|--------|---------|
| M1 — Entidades y DBs | Semana 1 | Todas las estructuras de datos definidas |
| M2 — Funcionalidades básicas | Semana 2 | Funcionalidades críticas operativas |
| M3 — Funcionalidades avanzadas | Semana 3 | Sistema completo |
| M4 — Integración y entrega | Semana 4 | Integración, testing y entrega final |

---

## 📝 Notas de desarrollo

- La base de datos es **en memoria**: los datos se reinician al cerrar el programa. En una versión futura se puede conectar a una base de datos real (SQLite, PostgreSQL, etc.).
- La importación masiva (US-02) usa un **archivo simulado** dentro del código. Se puede extender para leer un `.csv` real con `fs.readFileSync`.
- El PDF generado usa la especificación **PDF 1.4** construida manualmente, compatible con todos los lectores de PDF.