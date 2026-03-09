# C2-ACT4 — Instalación y Configuración del SGBD
## Proyecto Integrador: DCK — Sistema de Manifiestos de Residuos Marítimos

---

## 1. Introducción al SGBD

**Nombre:** PostgreSQL 16

**Empresa / Comunidad:** PostgreSQL Global Development Group (comunidad open source, fundada en 1996 a partir del proyecto POSTGRES de la Universidad de California, Berkeley).

**Tipo de licencia:** Libre — PostgreSQL License (similar a MIT/BSD, permite uso comercial sin restricciones).

**Principales características:**
- Motor relacional (SQL) con soporte ACID completo (Atomicidad, Consistencia, Aislamiento, Durabilidad)
- Soporte para tipos de datos avanzados: JSON/JSONB, arrays, UUID, tipos personalizados
- Integridad referencial con llaves foráneas y restricciones
- Soporte para procedimientos almacenados, triggers y vistas
- Alta concurrencia mediante MVCC (Multi-Version Concurrency Control)
- Extensible: PostGIS (geografía), pg_vector (IA), entre otras
- Replicación y alta disponibilidad nativa

**Casos de uso:**
- Sistemas transaccionales (ERP, CRM, facturación)
- Aplicaciones web y móviles con backend
- Sistemas de gestión documental
- Plataformas de logística y trazabilidad (como DCK)

---

## 2. Requerimientos del sistema

### Sistema operativo compatible
| SO | Versiones |
|----|-----------|
| Windows | 10 / 11 (64-bit) |
| macOS | 12 Monterey o superior |
| Linux | Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+ |

### Requerimientos de hardware (mínimos para desarrollo)
| Componente | Mínimo | Recomendado |
|---|---|---|
| RAM | 512 MB | 2 GB o más |
| Procesador | 1 GHz x64 | 2+ núcleos |
| Espacio en disco | 200 MB (binarios) | 1 GB+ (datos) |

### Software adicional requerido
En el contexto de este proyecto, PostgreSQL corre dentro de **Docker Desktop**:
- **Docker Desktop** 4.x o superior
- **Docker Compose** v2 (incluido en Docker Desktop)

Sin Docker (instalación directa):
- No requiere software adicional en Windows/macOS (instalador todo-en-uno)
- En Linux: `libssl`, `libreadline` (se instalan automáticamente vía `apt`)

### Versiones disponibles
- PostgreSQL 16 ← **versión utilizada en este proyecto**
- PostgreSQL 15, 14, 13 (LTS con soporte activo)
- Imagen Docker: `postgres:16-alpine` (versión ligera ~80 MB)

---

## 3. Proceso de instalación

En este proyecto, PostgreSQL se instala y ejecuta mediante **Docker**, lo que garantiza portabilidad entre Windows, macOS y Linux sin configuración manual del sistema operativo.

### Paso 1 — Instalar Docker Desktop

**Windows:**
```powershell
winget install Docker.DockerDesktop
```
O descargando el instalador desde el sitio oficial de Docker.

**macOS:**
```bash
brew install --cask docker
```

**Verificar instalación:**
```bash
docker --version
# Docker version 26.x.x

docker compose version
# Docker Compose version v2.x.x
```

### Paso 2 — Definir el servicio PostgreSQL en `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: dck_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: dck_db
      POSTGRES_USER: dck_user
      POSTGRES_PASSWORD: dck_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dck_user -d dck_db"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

### Paso 3 — Levantar el servicio

```bash
docker compose up -d db
```

### Paso 4 — Verificar que esté corriendo

```bash
docker compose ps
# dck_postgres   running (healthy)   0.0.0.0:5432->5432/tcp
```

---

## 4. Configuración inicial

### Usuarios y contraseñas
La configuración de usuarios se realiza mediante variables de entorno en Docker:

| Variable | Valor |
|---|---|
| `POSTGRES_DB` | `dck_db` |
| `POSTGRES_USER` | `dck_user` |
| `POSTGRES_PASSWORD` | `dck_password` |

### Configuración de puertos
- Puerto interno del contenedor: `5432`
- Puerto expuesto al host: `5432`
- Accesible en: `localhost:5432`

### Configuración de seguridad básica
- Contraseña obligatoria habilitada por defecto (`md5` / `scram-sha-256`)
- Red interna Docker: los servicios se comunican por nombre de contenedor (`db`), sin exponer credenciales al exterior
- En producción se recomienda no exponer el puerto 5432 públicamente

### Configuración de conexión con la aplicación
La cadena de conexión (DATABASE_URL) que usa la app Next.js:
```
postgresql://dck_user:dck_password@db:5432/dck_db
```
- `db` es el nombre del servicio Docker (resuelto internamente)
- Gestionada mediante la variable de entorno `DATABASE_URL` en `.env.docker`

### Herramienta administrativa instalada
**Prisma Studio** — interfaz web visual incluida en el proyecto:
```bash
docker compose up -d studio
# Accesible en http://localhost:5555
```

---

## 5. Demostración

### Inicio del servicio
```bash
docker compose up -d
```

### Conexión al gestor desde DBeaver
1. Nueva conexión → PostgreSQL
2. Host: `localhost` | Puerto: `5432`
3. Base de datos: `dck_db`
4. Usuario: `dck_user` | Contraseña: `dck_password`
5. Probar conexión → Conectado ✓

### Conexión desde terminal (psql)
```bash
docker exec -it dck_postgres psql -U dck_user -d dck_db
```

### Creación de una base de datos
*(Ya creada automáticamente por Docker vía `POSTGRES_DB`)*
```sql
-- Ver bases de datos existentes
\l

-- Conectarse a dck_db
\c dck_db
```

### Creación de una tabla (ejemplo)
```sql
CREATE TABLE ejemplo_buques (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  matricula VARCHAR(50)  UNIQUE NOT NULL,
  creado_en TIMESTAMP    DEFAULT NOW()
);
```

### Inserción de registros
```sql
INSERT INTO ejemplo_buques (nombre, matricula) VALUES
  ('Barco Omega',   'MX-001-2024'),
  ('Estrella Mar',  'MX-002-2024'),
  ('Ola Azul',      'MX-003-2024');
```

### Consulta de datos
```sql
-- Todos los registros
SELECT * FROM ejemplo_buques;

-- Con filtro
SELECT nombre, matricula
FROM ejemplo_buques
WHERE matricula LIKE 'MX-%'
ORDER BY creado_en DESC;
```

---

## 6. Aplicación en el Proyecto Integrador

### ¿Cómo se utiliza PostgreSQL en DCK?

PostgreSQL es el núcleo de almacenamiento del sistema **DCK — Sistema de Manifiestos de Residuos Marítimos**. Se accede a través de **Prisma ORM**, que actúa como capa intermedia entre la aplicación Next.js y la base de datos.

```
Next.js (App)  →  Prisma ORM  →  PostgreSQL 16
```

### Tipo de información almacenada

| Tabla | Descripción |
|---|---|
| `buques` | Embarcaciones registradas (nombre, matrícula, tipo) |
| `personas` | Tripulantes y responsables (nombre, tipo, buque) |
| `tipos_persona` | Catálogo de roles (Motorista, Cocinero, etc.) |
| `manifiestos` | Manifiestos de residuos generados por cada viaje |
| `manifiestos_residuos` | Detalle de residuos por manifiesto |
| `manifiestos_no_firmados` | Control de manifiestos pendientes de firma |
| `manifiesto_basuron` | Tickets de entrega a estación receptora |
| `usuarios_sistema` | Usuarios con acceso al sistema (auth JWT) |

### Relación con el sistema

1. **Autenticación:** Los usuarios se validan contra `usuarios_sistema` con contraseñas encriptadas (bcrypt) y sesiones JWT.
2. **Operaciones CRUD:** Cada módulo de la app (buques, personas, manifiestos) consume rutas API que ejecutan queries mediante Prisma sobre PostgreSQL.
3. **Reportes y estadísticas:** Las consultas agregadas (totales de residuos, comparativas por período) se procesan en PostgreSQL y se visualizan con gráficas Recharts.
4. **Archivos adjuntos:** Las URLs de comprobantes PDF se almacenan en la BD; los archivos físicos en volumen Docker.

### Sincronización del schema

El schema de la base de datos se define en `prisma/schema.prisma`. Para aplicar cambios:
```bash
npx prisma db push     # schema → BD
npx prisma db pull     # BD → schema (si se modificó desde DBeaver)
npx prisma generate    # regenera el cliente TypeScript
```

---

## Referencias

- Documentación oficial PostgreSQL 16: https://www.postgresql.org/docs/16/
- Imagen Docker postgres:16-alpine: https://hub.docker.com/_/postgres
- Prisma ORM: https://www.prisma.io/docs
- Docker Desktop: https://docs.docker.com/desktop/
