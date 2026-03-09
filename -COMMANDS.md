# DCK — Comandos de referencia

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Correr en modo desarrollo (Next.js + hot reload)
npm run dev

# Build de producción
npm run build

# Correr build de producción
npm start
```

## Docker (producción)

```bash
# Construir imagen (solo cuando cambie código)
docker compose build app

# Levantar todos los servicios (app + postgres + prisma studio)
docker compose up -d

# Levantar Y reconstruir imagen
docker compose up -d --build

# Ver logs de la app en tiempo real
docker compose logs -f app

# Detener todos los servicios
docker compose down

# Detener Y borrar volúmenes (⚠️ borra la base de datos)
docker compose down -v
```

## Accesos

| Servicio       | URL                       |
|----------------|---------------------------|
| App            | http://localhost:3000     |
| Prisma Studio  | http://localhost:5555     |
| Usuario admin  | admin@dck.local           |
| Contraseña     | admin123                  |

## Base de datos (Prisma)

```bash
# Aplicar cambios del schema a la BD local
npx prisma db push

# Abrir Prisma Studio (admin visual de la BD)
npx prisma studio

# Correr seed (crear usuario admin)
npx prisma db seed

# Generar cliente Prisma después de cambiar schema
npx prisma generate
```

### Flujo DBeaver → schema.prisma (BD primero)

Si prefieres modificar la estructura desde DBeaver y luego sincronizar Prisma:

```bash
# 1. Haz tus cambios en DBeaver (agregar columna, tabla, etc.)

# 2. Sincroniza schema.prisma desde la BD actual
npx prisma db pull

# 3. Regenera el cliente TypeScript con los nuevos tipos
npx prisma generate
```

> ⚠️ Si usas este flujo, evita correr `prisma db push` después,
> ya que sobreescribiría los cambios que hiciste en DBeaver.

## Distribución / Release

```bash
# Generar paquete de distribución (zip + exe Windows)
./release.sh

# Forzar rebuild de imagen antes de empaquetar
./release.sh --build
```

El release genera en `dist/`:
- `dck-YYYYMMDD.zip` → Mac / Linux
- `DCK-Installer.exe` → Windows (requiere NSIS: `brew install nsis`)

## Git

```bash
# Ver estado
git status

# Push a GitHub
git push origin main
```
