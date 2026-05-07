# Bitácora de Pruebas del Sistema
## Desarrollo de sistema web para el registro de datos y visualización de estadísticas de residuos marinos en embarcaciones de Puerto Peñasco, Sonora

---

**Instituto Tecnológico Superior de Puerto Peñasco**
**Empresa:** SEMARNAT / DCK Conciencia y Cultura

| | |
|---|---|
| **Asesor externo** | Francisco Javier Bojórquez Ochoa |
| **Asesora interna** | Diana Elizabeth López Chacón |
| **Estudiante 1** | Quintero Aldana Jesús Manuel |
| **Estudiante 2** | Sabori Fernández Miguel Rogelio |
| **Estudiante 3** | Suárez Gutiérrez Luis Mario |
| **Estudiante 4** | Zamudio Martín Alexa Merary |
| **Fecha de elaboración** | 2026-05-01 |

---

## Resumen ejecutivo

La presente bitácora documenta las pruebas realizadas sobre el sistema web de gestión de residuos marítimos desarrollado para DCK / SEMARNAT en Puerto Peñasco, Sonora. Se evaluaron un total de **77 procesos** distribuidos en dos categorías: **67 procesos de backend** (servicios de datos con Supabase) y **10 procesos de frontend** (pantallas e interacciones de usuario). Las pruebas se llevaron a cabo entre el 09/11/2025 y el 27/04/2026, conforme al avance de cada módulo, obteniendo un resultado de **74 procesos funcionales (✅)** y **3 procesos con pendientes de implementación (⚠️)**. El sistema se encuentra en condiciones operativas para su uso en el centro de acopio del recinto portuario.

---

## 1. Procesos Backend

### 1.1 Módulo: Personas

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 1 | Personas | getPersonas | Listar todas las personas ordenadas por nombre | 2025-11-09 | ✅ Funcionó |
| 2 | Personas | getPersonaById | Obtener persona específica por ID | 2025-11-09 | ✅ Funcionó |
| 3 | Personas | createPersona | Crear nueva persona en la base de datos | 2025-11-09 | ✅ Funcionó |
| 4 | Personas | updatePersona | Actualizar datos de una persona existente | 2025-11-09 | ✅ Funcionó |
| 5 | Personas | deletePersona | Eliminar persona por ID | 2025-11-09 | ✅ Funcionó |
| 6 | Personas | searchPersonas | Buscar personas por nombre (búsqueda parcial) | 2025-11-09 | ✅ Funcionó |
| 7 | Personas | getPersonasByTipo | Filtrar personas por tipo de persona | 2025-11-09 | ✅ Funcionó |
| 8 | Personas | createPersonaAutomatica | Crear persona automáticamente desde un manifiesto si no existe | 2025-11-10 | ✅ Funcionó |
| 9 | Personas | getPersonasIncompletas | Listar personas con registro incompleto | 2025-11-10 | ✅ Funcionó |
| 10 | Personas | getOrCreateTipoPersona | Obtener o crear un tipo de persona automáticamente | 2025-11-10 | ✅ Funcionó |

### 1.2 Módulo: Buques / Embarcaciones

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 11 | Buques | getBuques | Listar todas las embarcaciones ordenadas por fecha de registro | 2025-11-09 | ✅ Funcionó |
| 12 | Buques | getBuqueById | Obtener embarcación específica por ID | 2025-11-09 | ✅ Funcionó |
| 13 | Buques | createBuque | Registrar nueva embarcación | 2025-11-09 | ✅ Funcionó |
| 14 | Buques | updateBuque | Actualizar datos de una embarcación | 2025-11-09 | ✅ Funcionó |
| 15 | Buques | deleteBuque | Eliminar embarcación por ID | 2025-11-09 | ✅ Funcionó |
| 16 | Buques | searchBuques | Buscar por nombre de buque o matrícula | 2025-11-09 | ✅ Funcionó |
| 17 | Buques | getBuquesByEstado | Filtrar embarcaciones por estado (Activo/Inactivo/Mantenimiento) | 2025-11-09 | ✅ Funcionó |
| 18 | Buques | createBuqueAutomatico | Crear embarcación automáticamente desde un manifiesto | 2025-11-10 | ✅ Funcionó |
| 19 | Buques | getBuquesIncompletos | Listar embarcaciones con registro incompleto | 2025-11-10 | ✅ Funcionó |

### 1.3 Módulo: Manifiestos

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 20 | Manifiestos | generarNumeroManifiesto | Generar número único de manifiesto (formato MAN + fecha + secuencia) | 2025-11-10 | ✅ Funcionó |
| 21 | Manifiestos | getManifiestos | Listar manifiestos con datos de responsables y residuos | 2025-11-10 | ✅ Funcionó |
| 22 | Manifiestos | getManifiestoById | Obtener detalle completo de un manifiesto por ID | 2025-11-10 | ✅ Funcionó |
| 23 | Manifiestos | createManifiesto | Crear manifiesto con residuos, upload de imagen y PDF | 2025-11-10 | ✅ Funcionó |
| 24 | Manifiestos | updateManifiesto | Actualizar manifiesto y sus residuos asociados | 2025-11-10 | ✅ Funcionó |
| 25 | Manifiestos | deleteManifiesto | Eliminar manifiesto por ID | 2025-11-10 | ✅ Funcionó |
| 26 | Manifiestos | getManifiestosByEstado | Filtrar manifiestos por estado de digitalización | 2025-12-07 | ✅ Funcionó |
| 27 | Manifiestos | getManifiestosByBuque | Listar manifiestos de una embarcación específica | 2025-12-07 | ✅ Funcionó |
| 28 | Manifiestos | getManifiestoResiduos | Obtener residuos y tipos asociados a un manifiesto | 2025-12-07 | ✅ Funcionó |
| 29 | Manifiestos | saveFirmaDigital — Firma Resp. Líquidos | Guardar firma digital del Responsable de Líquidos en el PDF | 2026-04-22 | ⚠️ Pendiente |

### 1.4 Módulo: Manifiestos Basurón

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 30 | Basurón | getManifiestosBasuron | Listar manifiestos de basurón con datos del buque | 2025-12-07 | ✅ Funcionó |
| 31 | Basurón | getManifiestoBasuronById | Obtener detalle de manifiesto de basurón | 2025-12-07 | ✅ Funcionó |
| 32 | Basurón | createManifiestoBasuron | Crear manifiesto de basurón con upload de PDF | 2025-12-07 | ✅ Funcionó |
| 33 | Basurón | updateManifiestoBasuron | Actualizar datos de manifiesto de basurón | 2025-12-07 | ✅ Funcionó |
| 34 | Basurón | deleteManifiestoBasuron | Eliminar manifiesto de basurón | 2025-12-07 | ✅ Funcionó |
| 35 | Basurón | completarManifiestoBasuron | Registrar peso de salida y generar PDF final | 2025-12-07 | ✅ Funcionó |
| 36 | Basurón | getManifiestosBasuronByBuque | Filtrar manifiestos de basurón por embarcación | 2025-12-07 | ✅ Funcionó |
| 37 | Basurón | getManifiestosBasuronByFecha | Filtrar por fecha exacta | 2025-12-07 | ✅ Funcionó |
| 38 | Basurón | getManifiestosBasuronByRangoFechas | Filtrar por rango de fechas | 2025-12-07 | ✅ Funcionó |
| 39 | Basurón | getManifiestosEnProceso | Listar manifiestos con estado "En Proceso" | 2025-12-07 | ✅ Funcionó |
| 40 | Basurón | getEstadisticasManifiestosBasuron | Calcular totales y promedios de residuos depositados | 2025-12-08 | ✅ Funcionó |
| 41 | Basurón | getManifiestoBasuronByTicket | Buscar manifiesto por número de ticket | 2025-12-08 | ✅ Funcionó |

### 1.5 Módulo: Asociaciones Recolectoras

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 42 | Asociaciones | getAsociaciones | Listar asociaciones ordenadas por nombre | 2025-12-09 | ✅ Funcionó |
| 43 | Asociaciones | getAsociacionById | Obtener asociación por ID | 2025-12-09 | ✅ Funcionó |
| 44 | Asociaciones | createAsociacion | Crear nueva asociación recolectora | 2025-12-09 | ✅ Funcionó |
| 45 | Asociaciones | updateAsociacion | Actualizar datos de asociación | 2025-12-09 | ✅ Funcionó |
| 46 | Asociaciones | deleteAsociacion | Eliminar asociación | 2025-12-09 | ✅ Funcionó |
| 47 | Asociaciones | searchAsociaciones | Buscar asociaciones por nombre | 2025-12-09 | ✅ Funcionó |
| 48 | Asociaciones | getAsociacionesByEstado | Filtrar por estado (Activo/Inactivo/Suspendido) | 2025-12-09 | ✅ Funcionó |
| 49 | Asociaciones | getAsociacionesByTipo | Filtrar por tipo de asociación | 2025-12-09 | ✅ Funcionó |

### 1.6 Módulo: Storage / Archivos

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 50 | Storage | uploadManifiestoImage | Subir imagen de manifiesto al bucket con marca de tiempo | 2025-11-10 | ✅ Funcionó |
| 51 | Storage | uploadManifiestoPDF | Subir PDF de manifiesto al bucket con marca de tiempo | 2025-12-07 | ✅ Funcionó |
| 52 | Storage | deleteManifiestoImage | Eliminar imagen de manifiesto por URL | 2025-12-07 | ✅ Funcionó |
| 53 | Storage | getManifiestoImageUrl | Obtener URL pública de imagen de manifiesto | 2025-11-10 | ✅ Funcionó |

### 1.7 Módulo: Estadísticas del Dashboard

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 54 | Dashboard Stats | calcularRangoFechas | Calcular rango de fechas por período (semana/mes/trimestre/año) | 2025-12-07 | ✅ Funcionó |
| 55 | Dashboard Stats | getDashboardKPIs | Obtener KPIs principales del dashboard via procedimiento almacenado | 2025-12-07 | ✅ Funcionó |
| 56 | Dashboard Stats | getDashboardKPIsFiltered | KPIs filtrados por período de tiempo | 2025-12-08 | ✅ Funcionó |
| 57 | Dashboard Stats | getComparacionPeriodoAnterior | Comparar métricas entre período actual y anterior | 2025-12-08 | ✅ Funcionó |
| 58 | Dashboard Stats | getDashboardStats | KPIs completos con gráficas (residuos por mes, top buques) | 2025-12-07 | ✅ Funcionó |
| 59 | Dashboard Stats | getReporteComplejo | Generar reporte detallado via procedimiento almacenado | 2025-12-08 | ✅ Funcionó |

### 1.8 Módulo: Landing Stats

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 60 | Landing Stats | getLandingStats | Totalizar métricas públicas (manifiestos, aceite, basura, filtros) | 2025-12-09 | ✅ Funcionó |

### 1.9 Módulo: Reportes

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 61 | Reportes | getReporteResiduosPorFechas | Agrupar residuos por fecha de emisión en un rango dado | 2025-12-07 | ✅ Funcionó |
| 62 | Reportes | getTotalesGenerales | Obtener suma histórica total de aceite, basura y diésel | 2025-12-07 | ✅ Funcionó |

### 1.10 Módulo: Tipos de Persona

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 63 | Tipos Persona | getTiposPersona | Listar todos los tipos de persona | 2025-11-09 | ✅ Funcionó |
| 64 | Tipos Persona | getTipoPersonaById | Obtener tipo de persona por ID | 2025-11-09 | ✅ Funcionó |
| 65 | Tipos Persona | createTipoPersona | Crear nuevo tipo de persona | 2025-11-09 | ✅ Funcionó |
| 66 | Tipos Persona | updateTipoPersona | Actualizar tipo de persona existente | 2025-11-09 | ✅ Funcionó |
| 67 | Tipos Persona | deleteTipoPersona | Eliminar tipo de persona | 2025-11-09 | ✅ Funcionó |

---

## 2. Procesos Frontend

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|--------------------|-------------------|-----------------|---------|
| 68 | Landing | Página de inicio pública | Visualización de KPIs globales del sistema (aceite, basura, manifiestos, filtros) | 2025-12-09 | ✅ Funcionó |
| 69 | Autenticación | Inicio de sesión | Acceso al sistema con credenciales de usuario | 2025-12-09 | ✅ Funcionó |
| 70 | Dashboard | Hub de navegación principal | Menú central para acceder a todos los módulos del sistema | 2025-12-09 | ✅ Funcionó |
| 71 | Personas | Gestión de personas/tripulantes | CRUD completo: listar, crear, editar, eliminar, buscar y filtrar por tipo | 2025-11-09 | ✅ Funcionó |
| 72 | Embarcaciones | Gestión de buques | CRUD completo: listar, crear, editar, eliminar, buscar y filtrar por estado | 2025-11-09 | ✅ Funcionó |
| 73 | Manifiestos | Registro y edición de manifiestos | Alta/edición con autocompletado buque/personas, residuos, firma digital (3 responsables), upload imagen/PDF y generación de PDF | 2026-04-22 | ✅ Funcionó |
| 74 | Basurón | Registro de manifiestos de basurón | Crear registro de pesos (entrada/salida), completar manifiesto, descargar PDF, buscar y filtrar | 2025-12-07 | ✅ Funcionó |
| 75 | Estadísticas | Dashboard analítico | KPIs, gráficas de residuos por mes, distribución por tipo y top buques; filtros por período y comparación con período anterior | 2025-12-07 | ✅ Funcionó |
| 76 | Asociaciones | Pantalla de asociaciones recolectoras | Módulo de gestión de asociaciones (backend implementado, interfaz de usuario pendiente) | 2025-12-09 | ⚠️ Pendiente |
| 77 | Dashboard Simple | Modo de uso simplificado | Vista reducida para usuarios no técnicos: manifiesto rápido, basurón y estadísticas básicas | 2025-12-09 | ✅ Funcionó |

---

## 3. Resumen de resultados

| Categoría | Total de procesos | Funcionó ✅ | Pendiente ⚠️ | Falló ❌ |
|-----------|:-----------------:|:-----------:|:------------:|:--------:|
| Backend | 67 | 65 | 2 | 0 |
| Frontend | 10 | 9 | 1 | 0 |
| **Total** | **77** | **74** | **3** | **0** |

**Observaciones:**
- El proceso `saveFirmaDigital` (firma del Responsable de Líquidos en el PDF del manifiesto) está pendiente de implementación en base de datos y módulo PDF.
- La pantalla de **Asociaciones Recolectoras** tiene el backend completamente funcional pero la interfaz de usuario queda como pendiente para una versión futura.
- El 96.1% de los procesos del sistema se encuentran operativos y listos para su uso en producción.

---

## 4. Firmas de validación

&nbsp;

&nbsp;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Asesor externo**
Francisco Javier Bojórquez Ochoa
SEMARNAT — Puerto Peñasco, Son.

&nbsp;

&nbsp;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Asesora interna**
Diana Elizabeth López Chacón
Instituto Tecnológico Superior de Puerto Peñasco

&nbsp;

&nbsp;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Estudiante**
Quintero Aldana Jesús Manuel

&nbsp;

&nbsp;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Estudiante**
Sabori Fernández Miguel Rogelio

&nbsp;

&nbsp;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Estudiante**
Suárez Gutiérrez Luis Mario

&nbsp;

&nbsp;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Estudiante**
Zamudio Martín Alexa Merary

---

*Bitácora generada el 2026-05-01 — Instituto Tecnológico Superior de Puerto Peñasco*
