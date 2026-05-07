# Prompt para Claude Cowork — Bitácora de Pruebas en Word

Copia y pega este prompt en Claude Cowork para generar la bitácora en formato Word (.docx):

---

## PROMPT

Necesito que generes un documento Word (.docx) con una **bitácora de pruebas de sistema** para un proyecto académico de ingeniería en sistemas. 

### Datos del documento:

**Institución:** Instituto Tecnológico Superior de Puerto Peñasco (ITSPP)
**Proyecto:** Desarrollo de sistema web para el registro de datos y visualización de estadísticas de residuos marinos en embarcaciones de Puerto Peñasco, Sonora
**Cliente:** SEMARNAT / DCK Conciencia y Cultura
**Fecha de elaboración:** 2026-05-01

### Equipo:

| Rol | Nombre |
|---|---|
| Asesor externo | Francisco Javier Bojórquez Ochoa |
| Asesora interna | Diana Elizabeth López Chacón |
| Estudiante 1 | Quintero Aldana Jesús Manuel |
| Estudiante 2 | Sabori Fernández Miguel Rogelio |
| Estudiante 3 | Suárez Gutiérrez Luis Mario |
| Estudiante 4 | Zamudio Martín Alexa Merary |

### Resumen ejecutivo (un párrafo):

La presente bitácora documenta las pruebas realizadas sobre el sistema web de gestión de residuos marítimos desarrollado para DCK / SEMARNAT en Puerto Peñasco, Sonora. Se evaluaron un total de 77 procesos distribuidos en dos categorías: 67 procesos de backend (servicios de datos con Supabase) y 10 procesos de frontend (pantallas e interacciones de usuario). Las pruebas se llevaron a cabo entre el 09/11/2025 y el 27/04/2026, conforme al avance de cada módulo, obteniendo un resultado de 74 procesos funcionales (✅) y 3 procesos con pendientes de implementación (⚠️). El sistema se encuentra en condiciones operativas para su uso en el centro de acopio del recinto portuario.

### Estructura del documento:

1. **Portada/Encabezado** con logo ITSPP, título, datos de institución y equipo
2. **Sección 1. Procesos Backend** — 10 subsecciones por módulo con tablas
3. **Sección 2. Procesos Frontend** — tabla con 10 pantallas/módulos
4. **Sección 3. Resumen de Resultados** — tabla de totales
5. **Sección 4. Observaciones** — párrafo breve sobre los procesos pendientes
6. **Sección 5. Firmas de Validación** — 6 líneas para firmas (2 asesores + 4 estudiantes)

### Formato de tablas en cada módulo:

| # | Módulo | Nombre del proceso | Descripción breve | Fecha de prueba | Estatus |
|---|--------|-------------------|-------------------|-----------------|---------|

- **Columna Fecha de prueba:** usar la fecha indicada para cada proceso
- **Columna Estatus:** ✅ Funcionó o ⚠️ Pendiente según se indica

### Estilos Word solicitados:

- **Fuente:** Calibri 11pt (texto) / 12pt (títulos)
- **Encabezados:** Azul oscuro (#003366), negrita
- **Tablas:** bordes grises claros, encabezados con fondo gris claro (#E8E8E8)
- **Márgenes:** 2.54 cm (1 pulgada) todos los lados
- **Interlineado:** 1.5 líneas
- **Saltos de página:** antes de cada sección principal

### Procesos Backend detallados:

**PERSONAS (10):**
1. getPersonas — Listar todas las personas ordenadas por nombre — 2025-11-09 — ✅
2. getPersonaById — Obtener persona específica por ID — 2025-11-09 — ✅
3. createPersona — Crear nueva persona en la base de datos — 2025-11-09 — ✅
4. updatePersona — Actualizar datos de una persona existente — 2025-11-09 — ✅
5. deletePersona — Eliminar persona por ID — 2025-11-09 — ✅
6. searchPersonas — Buscar personas por nombre (búsqueda parcial) — 2025-11-09 — ✅
7. getPersonasByTipo — Filtrar personas por tipo de persona — 2025-11-09 — ✅
8. createPersonaAutomatica — Crear persona automáticamente desde un manifiesto si no existe — 2025-11-10 — ✅
9. getPersonasIncompletas — Listar personas con registro incompleto — 2025-11-10 — ✅
10. getOrCreateTipoPersona — Obtener o crear un tipo de persona automáticamente — 2025-11-10 — ✅

**BUQUES/EMBARCACIONES (9):**
11. getBuques — Listar todas las embarcaciones ordenadas por fecha de registro — 2025-11-09 — ✅
12. getBuqueById — Obtener embarcación específica por ID — 2025-11-09 — ✅
13. createBuque — Registrar nueva embarcación — 2025-11-09 — ✅
14. updateBuque — Actualizar datos de una embarcación — 2025-11-09 — ✅
15. deleteBuque — Eliminar embarcación por ID — 2025-11-09 — ✅
16. searchBuques — Buscar por nombre de buque o matrícula — 2025-11-09 — ✅
17. getBuquesByEstado — Filtrar embarcaciones por estado (Activo/Inactivo/Mantenimiento) — 2025-11-09 — ✅
18. createBuqueAutomatico — Crear embarcación automáticamente desde un manifiesto — 2025-11-10 — ✅
19. getBuquesIncompletos — Listar embarcaciones con registro incompleto — 2025-11-10 — ✅

**MANIFIESTOS (10):**
20. generarNumeroManifiesto — Generar número único de manifiesto (formato MAN + fecha + secuencia) — 2025-11-10 — ✅
21. getManifiestos — Listar manifiestos con datos de responsables y residuos — 2025-11-10 — ✅
22. getManifiestoById — Obtener detalle completo de un manifiesto por ID — 2025-11-10 — ✅
23. createManifiesto — Crear manifiesto con residuos, upload de imagen y PDF — 2025-11-10 — ✅
24. updateManifiesto — Actualizar manifiesto y sus residuos asociados — 2025-11-10 — ✅
25. deleteManifiesto — Eliminar manifiesto por ID — 2025-11-10 — ✅
26. getManifiestosByEstado — Filtrar manifiestos por estado de digitalización — 2025-12-07 — ✅
27. getManifiestosByBuque — Listar manifiestos de una embarcación específica — 2025-12-07 — ✅
28. getManifiestoResiduos — Obtener residuos y tipos asociados a un manifiesto — 2025-12-07 — ✅
29. saveFirmaDigital — Guardar firma digital del Responsable de Líquidos en el PDF — 2026-04-22 — ⚠️

**MANIFIESTOS BASURÓN (12):**
30. getManifiestosBasuron — Listar manifiestos de basurón con datos del buque — 2025-12-07 — ✅
31. getManifiestoBasuronById — Obtener detalle de manifiesto de basurón — 2025-12-07 — ✅
32. createManifiestoBasuron — Crear manifiesto de basurón con upload de PDF — 2025-12-07 — ✅
33. updateManifiestoBasuron — Actualizar datos de manifiesto de basurón — 2025-12-07 — ✅
34. deleteManifiestoBasuron — Eliminar manifiesto de basurón — 2025-12-07 — ✅
35. completarManifiestoBasuron — Registrar peso de salida y generar PDF final — 2025-12-07 — ✅
36. getManifiestosBasuronByBuque — Filtrar manifiestos de basurón por embarcación — 2025-12-07 — ✅
37. getManifiestosBasuronByFecha — Filtrar por fecha exacta — 2025-12-07 — ✅
38. getManifiestosBasuronByRangoFechas — Filtrar por rango de fechas — 2025-12-07 — ✅
39. getManifiestosEnProceso — Listar manifiestos con estado "En Proceso" — 2025-12-07 — ✅
40. getEstadisticasManifiestosBasuron — Calcular totales y promedios de residuos depositados — 2025-12-08 — ✅
41. getManifiestoBasuronByTicket — Buscar manifiesto por número de ticket — 2025-12-08 — ✅

**ASOCIACIONES (8):**
42. getAsociaciones — Listar asociaciones ordenadas por nombre — 2025-12-09 — ✅
43. getAsociacionById — Obtener asociación por ID — 2025-12-09 — ✅
44. createAsociacion — Crear nueva asociación recolectora — 2025-12-09 — ✅
45. updateAsociacion — Actualizar datos de asociación — 2025-12-09 — ✅
46. deleteAsociacion — Eliminar asociación — 2025-12-09 — ✅
47. searchAsociaciones — Buscar asociaciones por nombre — 2025-12-09 — ✅
48. getAsociacionesByEstado — Filtrar por estado (Activo/Inactivo/Suspendido) — 2025-12-09 — ✅
49. getAsociacionesByTipo — Filtrar por tipo de asociación — 2025-12-09 — ✅

**STORAGE / ARCHIVOS (4):**
50. uploadManifiestoImage — Subir imagen de manifiesto al bucket con marca de tiempo — 2025-11-10 — ✅
51. uploadManifiestoPDF — Subir PDF de manifiesto al bucket con marca de tiempo — 2025-12-07 — ✅
52. deleteManifiestoImage — Eliminar imagen de manifiesto por URL — 2025-12-07 — ✅
53. getManifiestoImageUrl — Obtener URL pública de imagen de manifiesto — 2025-11-10 — ✅

**DASHBOARD STATS (6):**
54. calcularRangoFechas — Calcular rango de fechas por período (semana/mes/trimestre/año) — 2025-12-07 — ✅
55. getDashboardKPIs — Obtener KPIs principales del dashboard via procedimiento almacenado — 2025-12-07 — ✅
56. getDashboardKPIsFiltered — KPIs filtrados por período de tiempo — 2025-12-08 — ✅
57. getComparacionPeriodoAnterior — Comparar métricas entre período actual y anterior — 2025-12-08 — ✅
58. getDashboardStats — KPIs completos con gráficas (residuos por mes, top buques) — 2025-12-07 — ✅
59. getReporteComplejo — Generar reporte detallado via procedimiento almacenado — 2025-12-08 — ✅

**LANDING STATS (1):**
60. getLandingStats — Totalizar métricas públicas (manifiestos, aceite, basura, filtros) — 2025-12-09 — ✅

**REPORTES (2):**
61. getReporteResiduosPorFechas — Agrupar residuos por fecha de emisión en un rango dado — 2025-12-07 — ✅
62. getTotalesGenerales — Obtener suma histórica total de aceite, basura y diésel — 2025-12-07 — ✅

**TIPOS DE PERSONA (5):**
63. getTiposPersona — Listar todos los tipos de persona — 2025-11-09 — ✅
64. getTipoPersonaById — Obtener tipo de persona por ID — 2025-11-09 — ✅
65. createTipoPersona — Crear nuevo tipo de persona — 2025-11-09 — ✅
66. updateTipoPersona — Actualizar tipo de persona existente — 2025-11-09 — ✅
67. deleteTipoPersona — Eliminar tipo de persona — 2025-11-09 — ✅

### Procesos Frontend detallados:

1. Página de inicio pública — Visualización de KPIs globales del sistema — 2025-12-09 — ✅
2. Inicio de sesión — Acceso al sistema con credenciales de usuario — 2025-12-09 — ✅
3. Hub de navegación principal — Menú central para acceder a todos los módulos — 2025-12-09 — ✅
4. Gestión de personas/tripulantes — CRUD completo: listar, crear, editar, eliminar, buscar y filtrar por tipo — 2025-11-09 — ✅
5. Gestión de buques — CRUD completo: listar, crear, editar, eliminar, buscar y filtrar por estado — 2025-11-09 — ✅
6. Registro y edición de manifiestos — Alta/edición con autocompletado, firma digital, upload imagen/PDF y generación de PDF — 2026-04-22 — ✅
7. Registro de manifiestos de basurón — Pesos entrada/salida, completar, descargar PDF, buscar y filtrar — 2025-12-07 — ✅
8. Dashboard analítico — KPIs, gráficas, filtros por período y comparación con período anterior — 2025-12-07 — ✅
9. Pantalla de asociaciones recolectoras — Backend implementado, interfaz de usuario pendiente — 2025-12-09 — ⚠️
10. Modo de uso simplificado — Vista reducida para usuarios no técnicos — 2025-12-09 — ✅

### Tabla de resumen final:

| Categoría | Total | ✅ Funcionó | ⚠️ Pendiente | ❌ Falló |
|-----------|-------|-----------|-------------|--------|
| Backend | 67 | 65 | 2 | 0 |
| Frontend | 10 | 9 | 1 | 0 |
| **Total** | **77** | **74** | **3** | **0** |

### Observaciones finales:

El proceso `saveFirmaDigital` (firma del Responsable de Líquidos en el PDF del manifiesto) está pendiente de implementación en base de datos y módulo PDF. La pantalla de Asociaciones Recolectoras tiene el backend completamente funcional pero la interfaz de usuario queda como pendiente para una versión futura. El 96.1% de los procesos del sistema se encuentran operativos y listos para su uso en producción.

### Archivo de salida:

Nombre: `BITACORA_PRUEBAS.docx`
Exportar con márgenes estándar, listo para imprimir.

---

## FIN DEL PROMPT

Pega esto completo en Claude Cowork y solicítale que genere el archivo Word.
