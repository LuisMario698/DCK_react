# DCK — Conexión a la base de datos (DBeaver / TablePlus)

## Credenciales PostgreSQL

| Campo              | Valor          |
|--------------------|----------------|
| Host               | `localhost`    |
| Puerto             | `5432`         |
| Base de datos      | `dck_db`       |
| Nombre de usuario  | `dck_user`     |
| Contraseña         | `dck_password` |

> El contenedor debe estar corriendo: `docker compose up -d`

---

## Configuración en DBeaver

1. **Nueva conexión** → selecciona **PostgreSQL**
2. Llena los campos de la tabla de arriba
3. Clic en **Probar conexión** → debe decir "Conectado"
4. **Aceptar**

---

## Configuración en TablePlus

1. **+** → **PostgreSQL**
2. Llena los campos de la tabla de arriba
3. **Test** → verde = listo
4. **Connect**

---

## Notas importantes

- **No modifiques la estructura de tablas** desde el cliente gráfico.
  Los cambios de schema se hacen en `prisma/schema.prisma` y luego:
  ```bash
  npx prisma db push
  ```
- Para explorar datos sin restricciones puedes usar también **Prisma Studio**:
  ```bash
  # Si los contenedores están corriendo:
  http://localhost:5555
  ```
