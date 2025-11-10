# 📋 GUÍA DE ACTUALIZACIÓN - Sistema de Manifiestos

## 🔍 Problema Detectado

Existe una **incompatibilidad** entre:
- La estructura de la tabla `manifiestos` en la base de datos SQL
- Los tipos TypeScript definidos en el código
- La funcionalidad del nuevo modal de manifiestos

## ✅ Solución Implementada

### 1. **Nueva Estructura de Base de Datos**

He creado el archivo `ACTUALIZAR_MANIFIESTOS.sql` que contiene:

#### Tabla Principal: `manifiestos`
```sql
- numero_manifiesto (TEXT, UNIQUE)
- fecha_emision (DATE)
- buque_id (BIGINT, FK a buques)
- generador_id (BIGINT, FK a personas)
- transportista_id (BIGINT, FK a personas)
- receptor_id (BIGINT, FK a personas)
- imagen_manifiesto_url (TEXT)
- estado_digitalizacion (pendiente|en_proceso|completado)
- digitalizador_id (BIGINT, FK a usuarios_sistema)
- fecha_digitalizacion (DATE)
- observaciones (TEXT)
```

#### Nueva Tabla Intermedia: `manifiestos_residuos`
Esta tabla relaciona manifiestos con múltiples tipos de residuos:
```sql
- manifiesto_id (BIGINT, FK a manifiestos)
- tipo_residuo_id (BIGINT, FK a tipos_residuos)
- cantidad (NUMERIC)
- unidad (kg|ton|m3|l|unidades)
- observaciones (TEXT)
```

### 2. **Servicios Actualizados**

He modificado `/lib/services/manifiestos.ts`:

#### Función `createManifiesto`
```typescript
createManifiesto(
  manifiesto: Omit<Manifiesto, 'id' | 'created_at' | 'updated_at'>,
  residuos?: Array<{ tipo_residuo_id: number; cantidad: number; unidad: string }>
)
```
- Ahora acepta un array de residuos
- Inserta el manifiesto y luego los residuos asociados

#### Función `updateManifiesto`
```typescript
updateManifiesto(
  id: number, 
  manifiesto: Partial<Manifiesto>,
  residuos?: Array<{ tipo_residuo_id: number; cantidad: number; unidad: string }>
)
```
- Actualiza el manifiesto
- Elimina residuos anteriores e inserta los nuevos

#### Nueva Función `getManifiestoResiduos`
```typescript
getManifiestoResiduos(manifiestoId: number)
```
- Obtiene todos los residuos asociados a un manifiesto
- Incluye información del tipo de residuo

### 3. **Modal Actualizado**

El modal `CreateManifiestoModal.tsx` ahora:
- ✅ Envía los residuos seleccionados al servicio
- ✅ Formatea correctamente los datos antes de enviar
- ✅ Mantiene compatibilidad con la nueva estructura

## 📝 PASOS PARA APLICAR LA ACTUALIZACIÓN

### Paso 1: Ejecutar SQL en Supabase

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `ACTUALIZAR_MANIFIESTOS.sql`
4. **IMPORTANTE**: Lee los comentarios en el SQL antes de ejecutar
5. Ejecuta el script

### Paso 2: Verificar la Actualización

Ejecuta esta consulta para verificar:
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'manifiestos'
ORDER BY ordinal_position;
```

### Paso 3: Verificar Permisos (RLS)

Asegúrate de tener políticas de seguridad (RLS) configuradas:

```sql
-- Habilitar RLS
ALTER TABLE manifiestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifiestos_residuos ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (ajustar según tus necesidades)
CREATE POLICY "Permitir lectura de manifiestos"
  ON manifiestos FOR SELECT
  USING (true);

CREATE POLICY "Permitir lectura de manifiestos_residuos"
  ON manifiestos_residuos FOR SELECT
  USING (true);

-- Política de escritura (ajustar según autenticación)
CREATE POLICY "Permitir inserción de manifiestos"
  ON manifiestos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir inserción de manifiestos_residuos"
  ON manifiestos_residuos FOR INSERT
  WITH CHECK (true);

-- Políticas de actualización y borrado según necesites
```

### Paso 4: Probar la Aplicación

1. Reinicia el servidor de desarrollo (si está corriendo)
2. Navega a la sección de Manifiestos
3. Intenta crear un nuevo manifiesto:
   - Selecciona una embarcación
   - Selecciona varios residuos y llena sus datos
   - Selecciona una persona
   - Opcionalmente carga un archivo
   - Guarda

4. Verifica en Supabase que:
   - Se creó el registro en `manifiestos`
   - Se crearon los registros en `manifiestos_residuos`

## 🔧 Características de la Nueva Estructura

### ✅ Ventajas

1. **Relación Múltiple**: Un manifiesto puede tener múltiples tipos de residuos
2. **Normalización**: No hay duplicación de datos
3. **Flexibilidad**: Cada residuo tiene su propia cantidad y unidad
4. **Escalabilidad**: Fácil agregar más información por residuo
5. **Integridad**: Constraints y foreign keys aseguran consistencia
6. **Triggers**: Actualización automática de `updated_at`

### 📊 Estructura Visual

```
manifiestos
├── id
├── numero_manifiesto
├── fecha_emision
├── buque_id ──────────┐
├── generador_id       │
├── ...                │
└── observaciones      │
                       │
                       │ 1:N
                       ├────────> manifiestos_residuos
                       │          ├── id
                       │          ├── manifiesto_id
                       │          ├── tipo_residuo_id ──> tipos_residuos
                       │          ├── cantidad
                       │          ├── unidad
                       │          └── observaciones
                       │
                       └────────> buques
                                  ├── id
                                  ├── nombre_buque
                                  └── ...
```

## ⚠️ IMPORTANTE - Migración de Datos

Si ya tienes datos en la tabla `manifiestos` antigua:

1. El script renombra la tabla antigua a `manifiestos_backup`
2. **NO** migra datos automáticamente
3. Si necesitas migrar datos, crea un script personalizado:

```sql
-- Ejemplo de migración (ajustar según tu estructura antigua)
INSERT INTO manifiestos (
    numero_manifiesto,
    fecha_emision,
    buque_id,
    generador_id,
    observaciones
)
SELECT 
    numero_manifiesto,
    fecha_creacion::date,
    buque_id,
    persona_responsable_id,
    observaciones
FROM manifiestos_backup
WHERE numero_manifiesto IS NOT NULL;
```

## 🐛 Troubleshooting

### Error: "relation 'manifiestos_residuos' does not exist"
**Solución**: Ejecuta el SQL de actualización en Supabase

### Error: "permission denied for table manifiestos"
**Solución**: Configura las políticas RLS (ver Paso 3)

### Error: "duplicate key value violates unique constraint"
**Solución**: Verifica que no haya números de manifiesto duplicados

### Los residuos no se guardan
**Solución**: 
1. Verifica que la tabla `manifiestos_residuos` exista
2. Revisa la consola del navegador para errores
3. Verifica las políticas RLS de la tabla

## 📞 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Revisa los logs de Supabase
3. Verifica que todas las tablas existan
4. Confirma que las políticas RLS estén configuradas

## ✨ Próximos Pasos (Opcional)

Podrías agregar:
1. Vista para mostrar los residuos en la tabla de manifiestos
2. Edición de manifiestos existentes con sus residuos
3. Reportes de residuos por manifiesto
4. Estadísticas de tipos de residuos más comunes
5. Subida real de archivos a Supabase Storage

---

**Fecha de actualización**: 9 de noviembre de 2025
**Versión**: 2.0
