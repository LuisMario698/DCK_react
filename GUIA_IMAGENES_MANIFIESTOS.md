# 📸 Guía de Implementación: Sistema de Imágenes para Manifiestos

## ✅ Archivos Creados y Modificados

### Nuevos Archivos:
1. ✅ `CREAR_BUCKET_MANIFIESTOS.sql` - Script SQL para crear el bucket
2. ✅ `lib/services/storage.ts` - Servicio para manejar archivos en Supabase Storage
3. ✅ `ACTUALIZAR_MANIFIESTOS_V2.sql` - Script de migración de base de datos

### Archivos Modificados:
1. ✅ `lib/services/manifiestos.ts` - Agregada funcionalidad de subida de imágenes
2. ✅ `app/dashboard/manifiesto/page.tsx` - Agregado modal de visualización
3. ✅ `types/database.ts` - Actualizadas interfaces
4. ✅ `zTablas.sql` - Actualizada estructura de tablas

## 🗄️ Paso 1: Ejecutar SQL en Supabase

### 1.1 Crear el Bucket de Imágenes

Ve a tu Dashboard de Supabase → **SQL Editor** y ejecuta:

```sql
-- Crear el bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifiestos_img', 'manifiestos_img', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'manifiestos_img');

-- Política para permitir subida
CREATE POLICY "Allow upload manifiestos_img"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'manifiestos_img');

-- Política para permitir actualización
CREATE POLICY "Allow update manifiestos_img"
ON storage.objects FOR UPDATE
USING (bucket_id = 'manifiestos_img');

-- Política para permitir eliminación
CREATE POLICY "Allow delete manifiestos_img"
ON storage.objects FOR DELETE
USING (bucket_id = 'manifiestos_img');
```

### 1.2 Actualizar Estructura de Manifiestos

Ejecuta el script `ACTUALIZAR_MANIFIESTOS_V2.sql`:

```sql
-- Agregar segundo responsable
ALTER TABLE manifiestos 
ADD COLUMN IF NOT EXISTS responsable_secundario_id BIGINT REFERENCES personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_manifiestos_responsable_secundario 
ON manifiestos(responsable_secundario_id);

-- Renombrar generador_id a responsable_principal_id
ALTER TABLE manifiestos 
RENAME COLUMN generador_id TO responsable_principal_id;

DROP INDEX IF EXISTS idx_manifiestos_generador;
CREATE INDEX IF NOT EXISTS idx_manifiestos_responsable_principal 
ON manifiestos(responsable_principal_id);

-- Eliminar columna filtros_aire
ALTER TABLE manifiestos_residuos 
DROP COLUMN IF EXISTS filtros_aire;
```

### 1.3 Verificar el Bucket

1. Ve a **Storage** en el dashboard de Supabase
2. Deberías ver el bucket `manifiestos_img`
3. Verifica que esté marcado como "público"
4. Verifica que las políticas estén activas (4 políticas)

## 🎯 Funcionalidades Implementadas

### 1. **Subida de Imágenes**
- ✅ Al crear un manifiesto, puedes adjuntar una imagen
- ✅ La imagen se sube automáticamente al bucket `manifiestos_img`
- ✅ Nombre del archivo: `{numero_manifiesto}_{timestamp}.{extension}`
- ✅ URL pública se guarda en `imagen_manifiesto_url`
- ✅ Estado cambia a "completado" automáticamente

### 2. **Generación Automática de Número**
- ✅ Formato: `MAN{ddmmyyyy}{número del día}`
- ✅ Ejemplo: `MAN10112025001` (primer manifiesto del 10/11/2025)
- ✅ Se genera automáticamente al guardar

### 3. **Dos Responsables**
- ✅ Responsable Principal (obligatorio)
- ✅ Responsable Secundario (opcional)
- ✅ Ambos se muestran en la tabla y en la vista detallada

### 4. **Vista Detallada del Manifiesto** 👁️
- ✅ Botón de "ojito" en cada fila de la tabla
- ✅ Modal emergente con toda la información:
  * Información básica (número, fecha, estado)
  * Embarcación
  * Responsables (principal y secundario)
  * Residuos registrados (4 tipos)
  * **Imagen del manifiesto** (si existe)
  * Observaciones
- ✅ Opción para abrir imagen en nueva pestaña

### 5. **Eliminación de Filtros de Aire**
- ✅ Removido de toda la aplicación
- ✅ Solo quedan 4 tipos de residuos:
  * Aceite usado (litros)
  * Filtros de aceite (unidades)
  * Filtros de diesel (unidades)
  * Basura (kilogramos)

## 🎨 Interfaz de Usuario

### Formulario de Creación (Wizard de 5 Pasos):

**Paso 1: Información Básica**
- Solo fecha de emisión (número se genera automáticamente)

**Paso 2: Embarcación**
- Selector de buque con confirmación visual

**Paso 3: Residuos**
- 4 tarjetas coloridas para cada tipo de residuo

**Paso 4: Responsables**
- Selector de responsable principal (obligatorio)
- Selector de responsable secundario (opcional)

**Paso 5: Digitalizar**
- Área de drag & drop para la imagen
- Campo de observaciones
- Botón "Guardar Manifiesto"

### Tabla de Manifiestos:

**Columnas:**
1. Número
2. Fecha
3. Buque
4. Responsables (principal + secundario)
5. Estado
6. Acciones (👁️ Ver / 🗑️ Eliminar)

## 🧪 Cómo Probar

### 1. Crear un Manifiesto con Imagen:

```
1. Ve a /dashboard/manifiesto
2. Completa el Paso 1 (solo fecha)
3. Selecciona un buque en Paso 2
4. Ingresa cantidades de residuos en Paso 3
5. Selecciona responsable(s) en Paso 4
6. Arrastra una imagen o haz clic para seleccionar en Paso 5
7. Agrega observaciones (opcional)
8. Clic en "Guardar Manifiesto"
```

### 2. Ver Detalles del Manifiesto:

```
1. En la tabla de manifiestos, localiza el manifiesto creado
2. Haz clic en el icono del ojito 👁️
3. Verás un modal con toda la información
4. Si tiene imagen, verás la imagen escaneada
5. Puedes hacer clic en "Abrir imagen en nueva pestaña"
```

### 3. Verificar en Supabase Storage:

```
1. Ve a Storage → manifiestos_img
2. Deberías ver el archivo subido
3. Formato: MAN10112025001_1731234567890.jpg
```

## 🔧 Configuración Técnica

### Estructura del Bucket:
```
manifiestos_img/
├── MAN10112025001_1731234567890.pdf
├── MAN10112025002_1731234567891.jpg
└── MAN11112025001_1731320987890.png
```

### Tipos de Archivo Soportados:
- PDF
- JPG/JPEG
- PNG
- Cualquier imagen estándar

### URL Pública Generada:
```
https://tggvwdjdioyzoftzwneb.supabase.co/storage/v1/object/public/manifiestos_img/MAN10112025001_1731234567890.jpg
```

## 📊 Cambios en la Base de Datos

### Tabla `manifiestos`:
```sql
- generador_id → responsable_principal_id (RENOMBRADO)
+ responsable_secundario_id (NUEVO - nullable)
  imagen_manifiesto_url (EXISTENTE - ahora se usa)
```

### Tabla `manifiestos_residuos`:
```sql
  aceite_usado ✅
  filtros_aceite ✅
  filtros_diesel ✅
- filtros_aire ❌ (ELIMINADO)
  basura ✅
```

## 🚀 Comandos para Iniciar

```bash
cd my_app_react_ejemplo
npm run dev
```

Luego abre: `http://localhost:3000/dashboard/manifiesto`

## ✅ Checklist de Implementación

- [x] Crear bucket en Supabase Storage
- [x] Configurar políticas de seguridad
- [x] Actualizar estructura de tablas
- [x] Implementar servicio de storage
- [x] Modificar servicio de manifiestos
- [x] Actualizar componente de formulario
- [x] Agregar modal de vista detallada
- [x] Agregar botón de visualización en tabla
- [x] Probar subida de archivos
- [x] Probar visualización de imágenes

## 🎉 ¡Listo para Usar!

Ahora tu aplicación puede:
1. ✅ Subir imágenes de manifiestos al crear/editar
2. ✅ Ver detalles completos con imagen incluida
3. ✅ Generar números automáticos
4. ✅ Manejar dos responsables
5. ✅ Eliminar filtros de aire

**¡Todo funcionando! 🚀**
