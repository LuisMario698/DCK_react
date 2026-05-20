# C5 - Actividad 2: Seguridad en Base de Datos

**Alumno:** Luis Mario  
**Proyecto Integrador:** CIAD — Sistema de Gestión de Embarcaciones  
**Fecha de entrega:** 08 de mayo de 2026

---

## 1. Investigación: Espejeo, Réplica y Migración de Base de Datos

---

### 1.1 Espejeo (Mirroring)

El espejeo de base de datos es una técnica de alta disponibilidad en la que se mantiene una copia exacta y sincrónica de una base de datos en un servidor secundario (espejo). Cada transacción confirmada en el servidor principal se replica en tiempo real al servidor espejo, de modo que ambas bases de datos permanecen idénticas en todo momento.

**Características principales:**
- Sincronización en tiempo real (modo sincrónico) o con mínima latencia (modo asincrónico).
- En caso de falla del servidor principal, el servidor espejo puede asumir el rol de forma automática o manual (*failover*).
- Transparente para el cliente: las aplicaciones se reconectan al espejo sin cambios en el código.
- Utilizado principalmente para garantizar continuidad del negocio (*Business Continuity*).

**Modos de operación:**
| Modo | Descripción |
|------|-------------|
| Sincrónico (Alta seguridad) | La transacción se confirma solo cuando ambos servidores la han registrado. |
| Asincrónico (Alto rendimiento) | La transacción se confirma en el principal sin esperar al espejo. |

**Referencias:**
1. Microsoft. (2023). *Database Mirroring (SQL Server)*. Microsoft Learn. https://learn.microsoft.com/en-us/sql/database-engine/database-mirroring/database-mirroring-sql-server
2. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Database System Concepts* (7.ª ed.). McGraw-Hill Education. (Cap. 19: Recovery System, pp. 812–845)
3. Elmasri, R., & Navathe, S. B. (2016). *Fundamentals of Database Systems* (7.ª ed.). Pearson. (Cap. 25: Distributed Databases, pp. 956–987)

---

### 1.2 Réplica (Replication)

La replicación de base de datos es el proceso de copiar y distribuir datos e información desde una base de datos a una o varias bases de datos en distintas ubicaciones, con el objetivo de mejorar la disponibilidad, el rendimiento y la tolerancia a fallos. A diferencia del espejeo, la réplica no siempre es en tiempo real ni garantiza consistencia inmediata.

**Tipos de replicación:**

| Tipo | Descripción | Caso de uso |
|------|-------------|-------------|
| Snapshot | Copia completa de los datos en un momento dado. | Datos que cambian poco frecuentemente. |
| Transaccional | Replica cada transacción individualmente. | Alta frecuencia de escritura, baja latencia requerida. |
| De mezcla (Merge) | Permite actualizaciones en múltiples nodos; los cambios se sincronizan posteriormente. | Entornos distribuidos o desconectados. |

**Ventajas:**
- Distribución geográfica de datos para reducir latencia de lectura.
- Balanceo de carga entre servidores de lectura.
- Respaldo continuo de datos.
- Soporte para entornos de alta disponibilidad y recuperación ante desastres.

**Supabase y replicación:** Supabase (utilizado en este proyecto) emplea PostgreSQL con su mecanismo de *Logical Replication* y *Write-Ahead Logging (WAL)*, que permite replicar cambios de forma eficiente a réplicas de lectura.

**Referencias:**
1. PostgreSQL Global Development Group. (2024). *Logical Replication*. PostgreSQL Documentation 16. https://www.postgresql.org/docs/current/logical-replication.html
2. Supabase. (2024). *Architecture Overview — Replication & High Availability*. Supabase Docs. https://supabase.com/docs/guides/platform/architecture
3. Date, C. J. (2004). *An Introduction to Database Systems* (8.ª ed.). Addison-Wesley. (Cap. 21: Distributed Database Management, pp. 750–783)

---

### 1.3 Migración de Base de Datos

La migración de base de datos es el proceso de mover datos, esquemas o ambos desde un sistema de base de datos a otro. Puede implicar cambios de plataforma (por ejemplo, de MySQL a PostgreSQL), de estructura (modificación del esquema) o de entorno (de local a nube).

**Tipos de migración:**

| Tipo | Descripción |
|------|-------------|
| Migración de esquema | Modificación de la estructura de tablas, columnas o relaciones sin mover datos. |
| Migración de datos | Transferencia del contenido de una base de datos a otra. |
| Migración de plataforma | Cambio completo de motor de base de datos (ej. Oracle → PostgreSQL). |
| Migración a nube | Traslado de una base de datos on-premise a un servicio en la nube. |

**Herramientas comunes:**
- **Flyway / Liquibase:** Control de versiones para esquemas de base de datos.
- **pgdump / psql:** Exportación e importación nativa de PostgreSQL.
- **Supabase CLI:** Gestión de migraciones directamente vinculadas al proyecto.
- **AWS DMS / Azure Database Migration Service:** Migraciones a gran escala en la nube.

**Consideraciones de seguridad durante una migración:**
- Cifrado de datos en tránsito (TLS/SSL).
- Validación de integridad mediante checksums.
- Respaldo completo previo a cualquier migración.
- Control de acceso estricto durante el proceso.

**Referencias:**
1. Supabase. (2024). *Database Migrations*. Supabase Docs. https://supabase.com/docs/guides/cli/managing-migrations
2. Fowler, M. (2003). *Patterns of Enterprise Application Architecture*. Addison-Wesley. (Cap. 3: Mapping to Relational Databases, pp. 69–116)
3. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media. (Cap. 4: Encoding and Evolution, pp. 111–144)

---

## 2. Técnica Aplicada al Proyecto Integrador y Justificación

### Técnica seleccionada: Migración de Base de Datos

**Descripción de la aplicación en CIAD:**

El proyecto CIAD — Sistema de Gestión de Embarcaciones utiliza **Supabase** como plataforma de base de datos en la nube (PostgreSQL). Durante el desarrollo del proyecto se han generado y ejecutado múltiples scripts de migración para:

- Crear y modificar tablas (`embarcaciones`, `personas`, `manifiestos`, `asociaciones`).
- Agregar columnas nuevas (ej. campo `pdf`, campo `registro_completo`).
- Actualizar políticas de seguridad a nivel de fila (Row Level Security — RLS).
- Crear y gestionar buckets de almacenamiento de archivos.
- Limpiar tablas innecesarias para optimizar el esquema.

Evidencia directa: en el repositorio existen archivos como `ACTUALIZAR_MANIFIESTOS.sql`, `AGREGAR_CAMPO_REGISTRO_COMPLETO.sql`, `add_pdf_column.sql`, `fix_policies.sql`, entre otros, que representan cada iteración de migración del esquema.

**Justificación:**

La migración de base de datos es la técnica más adecuada para este proyecto por las siguientes razones:

1. **Etapa de desarrollo activo:** El sistema se encuentra en construcción continua; el esquema evoluciona con cada nueva funcionalidad (manifiestos, PDF, RLS), lo que requiere migraciones frecuentes y controladas.
2. **Control de versiones del esquema:** Usar migraciones permite rastrear cada cambio estructural de la base de datos de forma ordenada, facilitando la reversión en caso de errores.
3. **Compatibilidad con Supabase CLI:** La plataforma elegida (Supabase) provee herramientas nativas para gestionar migraciones, lo que integra de manera natural esta técnica al flujo de trabajo del proyecto.
4. **Escalabilidad futura:** Una vez que el sistema sea desplegado en producción, las migraciones permiten actualizar el esquema sin interrumpir el servicio.

El espejeo y la réplica no son prioritarios en esta etapa porque el proyecto aún no ha alcanzado una carga de usuarios que justifique múltiples servidores de base de datos; sin embargo, Supabase ya provee réplica interna y respaldo automático como parte de su infraestructura.

---

## 3. Justificación de Seguridad del Proyecto Integrador

### Por qué puede confiar en CIAD con sus datos

El sistema **CIAD — Sistema de Gestión de Embarcaciones** ha sido diseñado con seguridad como principio fundamental. A continuación se describen las medidas implementadas para proteger la información de cada usuario y organización.

---

### 3.1 Autenticación segura

- El acceso al sistema requiere **autenticación con correo electrónico y contraseña**, gestionada por **Supabase Auth**, un servicio de autenticación robusto y ampliamente utilizado en la industria.
- Las contraseñas **nunca se almacenan en texto plano**; Supabase utiliza hashing seguro (bcrypt) antes de guardarlas.
- Se soportan sesiones con tokens JWT (JSON Web Tokens) con tiempo de expiración, evitando accesos no autorizados prolongados.

---

### 3.2 Control de acceso a nivel de fila (Row Level Security — RLS)

- La base de datos implementa **políticas de seguridad a nivel de fila (RLS)** en PostgreSQL. Esto significa que cada usuario o rol solo puede ver y modificar los datos que le pertenecen o que tiene autorización explícita para acceder.
- Por ejemplo, un capturista no puede ver ni modificar los registros de otra organización, aunque comparta la misma base de datos.

---

### 3.3 Comunicación cifrada

- Toda la comunicación entre el navegador del usuario y el servidor utiliza **HTTPS con cifrado TLS**, garantizando que ningún tercero pueda interceptar los datos en tránsito.
- Las conexiones a la base de datos también se realizan a través de canales cifrados.

---

### 3.4 Almacenamiento seguro de archivos

- Los documentos generados por el sistema (manifiestos en PDF) se almacenan en **buckets privados de Supabase Storage**, con políticas de acceso configuradas para que solo usuarios autorizados puedan descargarlos.

---

### 3.5 Infraestructura en la nube confiable

- CIAD está desplegado en **Vercel** (frontend) y **Supabase** (backend y base de datos), dos plataformas líderes en la industria con certificaciones de seguridad (SOC 2 Type II) y respaldos automáticos diarios de la base de datos.
- Supabase ofrece **alta disponibilidad y réplica interna**, lo que protege contra pérdida de datos por fallas de hardware.

---

### 3.6 Principio de mínimo privilegio

- Cada componente del sistema (frontend, funciones de servidor) tiene acceso únicamente a los recursos que necesita para operar, siguiendo el principio de **mínimo privilegio**.
- Las claves de API expuestas al cliente son de tipo "anon key" con permisos limitados; las operaciones sensibles se realizan con claves de servicio protegidas en el servidor.

---

**En resumen:** CIAD protege sus datos mediante autenticación segura, cifrado en tránsito, control de acceso granular a nivel de base de datos, almacenamiento privado de documentos e infraestructura en la nube con estándares de seguridad de nivel empresarial. Sus datos están en manos de un sistema diseñado para mantenerlos privados, íntegros y disponibles.

---

## Referencias Generales

1. Microsoft. (2023). *Database Mirroring (SQL Server)*. Microsoft Learn. https://learn.microsoft.com/en-us/sql/database-engine/database-mirroring/database-mirroring-sql-server
2. PostgreSQL Global Development Group. (2024). *Logical Replication*. PostgreSQL 16 Documentation. https://www.postgresql.org/docs/current/logical-replication.html
3. Supabase. (2024). *Database Migrations*. Supabase Docs. https://supabase.com/docs/guides/cli/managing-migrations
4. Supabase. (2024). *Row Level Security*. Supabase Docs. https://supabase.com/docs/guides/database/row-level-security
5. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Database System Concepts* (7.ª ed.). McGraw-Hill Education.
6. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media.
7. Elmasri, R., & Navathe, S. B. (2016). *Fundamentals of Database Systems* (7.ª ed.). Pearson.
