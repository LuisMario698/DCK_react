# 📋 GUÍA ACTUALIZADA - Sistema de Manifiestos de Residuos Marítimos

## 🎯 Cambios Implementados

El sistema ahora captura **campos específicos** de residuos marítimos según el formato del manifiesto físico.

## ✅ Nueva Estructura

### **Campos de Residuos Capturados:**

1. **🛢️ ACEITE USADO** - En litros
2. **🔧 FILTROS DE ACEITE** - En unidades
3. **⛽ FILTROS DE DIESEL** - En unidades
4. **💨 FILTROS DE AIRE** - En unidades
5. **🗑️ BASURA** - En kilogramos

## 📊 Estructura de Base de Datos

### Tabla: `manifiestos`
```sql
- numero_manifiesto (TEXT)
- fecha_emision (DATE)
- buque_id (BIGINT)
- generador_id (BIGINT) // Persona responsable
- observaciones (TEXT)
- imagen_manifiesto_url (TEXT)
- estado_digitalizacion (pendiente|en_proceso|completado)
```

### Tabla: `manifiestos_residuos`
```sql
- manifiesto_id (BIGINT) - UNIQUE (1:1 con manifiesto)
- aceite_usado (NUMERIC) - Litros
- filtros_aceite (INTEGER) - Unidades
- filtros_diesel (INTEGER) - Unidades
- filtros_aire (INTEGER) - Unidades
- basura (NUMERIC) - Kilogramos
- observaciones (TEXT)
```

## 🚀 PASOS PARA ACTUALIZAR

### **Paso 1: Ejecutar SQL en Supabase**

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a tu proyecto
3. SQL Editor
4. Copia y pega el contenido de `ACTUALIZAR_MANIFIESTOS.sql`
5. **Ejecuta el script**

### **Paso 2: Configurar Políticas RLS (Seguridad)**

```sql
-- Habilitar RLS
ALTER TABLE manifiestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifiestos_residuos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso total (ajustar según autenticación)
CREATE POLICY "Permitir todo en manifiestos" 
  ON manifiestos FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir todo en manifiestos_residuos" 
  ON manifiestos_residuos FOR ALL 
  USING (true) 
  WITH CHECK (true);
```

### **Paso 3: Verificar Tablas Creadas**

```sql
-- Verificar estructura de manifiestos
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'manifiestos'
ORDER BY ordinal_position;

-- Verificar estructura de manifiestos_residuos
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'manifiestos_residuos'
ORDER BY ordinal_position;
```

## 📝 Uso del Sistema

### **Crear un Nuevo Manifiesto:**

1. Navega a la sección **Manifiestos**
2. Clic en **"Nuevo Manifiesto"**
3. Completa los campos:

   **📋 Información Básica:**
   - Número de Manifiesto (ej: MAN-2025-001)
   - Fecha de Emisión

   **🚢 Embarcación:**
   - Selecciona el buque del dropdown

   **♻️ Residuos Marítimos:**
   - Aceite Usado (litros)
   - Filtros de Aceite (unidades)
   - Filtros de Diesel (unidades)
   - Filtros de Aire (unidades)
   - Basura (kg)

   **👤 Persona Responsable:**
   - Selecciona del dropdown

   **📤 Digitalizar:**
   - Arrastra y suelta el archivo PDF/imagen
   - O clic en "Seleccionar Archivo"

4. Clic en **"✨ Crear Manifiesto"**

## 🎨 Características de la Nueva Interfaz

### **Sección de Residuos:**
- ✅ Campos individuales para cada tipo de residuo
- ✅ Unidades predefinidas según estándar marítimo
- ✅ Resumen visual en tiempo real
- ✅ Iconos distintivos para cada tipo
- ✅ Validación automática de valores numéricos
- ✅ Diseño similar al formato de manifiesto físico

### **Resumen Dinámico:**
Muestra en tiempo real:
```
📊 Resumen de Residuos:
Aceite: 45.5 L | F. Aceite: 3 un | F. Diesel: 2 un | F. Aire: 4 un | Basura: 12.5 kg
```

## 📂 Archivos Modificados

### ✨ Nuevos/Actualizados:
1. ✅ `ACTUALIZAR_MANIFIESTOS.sql` - Script SQL actualizado
2. ✅ `lib/services/manifiestos.ts` - Servicios actualizados
3. ✅ `components/manifiestos/CreateManifiestoModal.tsx` - Modal con campos específicos
4. ✅ `GUIA_ACTUALIZACION_MANIFIESTOS_V2.md` - Esta guía

## 🔄 Diferencias con Versión Anterior

| Aspecto | Versión Anterior | Nueva Versión |
|---------|-----------------|---------------|
| Residuos | Selección múltiple genérica | 5 campos específicos predefinidos |
| Unidades | Dropdown para cada residuo | Unidades fijas por tipo |
| UI | Checkboxes + formularios dinámicos | Campos directos con iconos |
| Base de Datos | Tabla intermedia con múltiples registros | Un registro por manifiesto |
| Validación | Requerir al menos 1 residuo | Todos los campos opcionales (pueden ser 0) |

## 🎯 Ventajas del Nuevo Diseño

1. **✅ Simplicidad:** Campos fijos, sin complejidad de multi-selección
2. **✅ Rapidez:** Entrada directa de datos, sin pasos adicionales
3. **✅ Consistencia:** Mismo formato que el manifiesto físico
4. **✅ Claridad:** Unidades predefinidas evitan errores
5. **✅ Visualización:** Resumen inmediato de todos los residuos

## 📊 Estructura de Datos Guardados

**Ejemplo de Manifiesto:**
```json
{
  "numero_manifiesto": "MAN-2025-001",
  "fecha_emision": "2025-11-09",
  "buque_id": 1,
  "generador_id": 5,
  "observaciones": "Manifiesto de rutina"
}
```

**Residuos Asociados:**
```json
{
  "manifiesto_id": 1,
  "aceite_usado": 45.5,
  "filtros_aceite": 3,
  "filtros_diesel": 2,
  "filtros_aire": 4,
  "basura": 12.5
}
```

## 🔍 Consultas Útiles

### Ver manifiestos con sus residuos:
```sql
SELECT 
  m.numero_manifiesto,
  m.fecha_emision,
  b.nombre_buque,
  mr.aceite_usado,
  mr.filtros_aceite,
  mr.filtros_diesel,
  mr.filtros_aire,
  mr.basura
FROM manifiestos m
LEFT JOIN buques b ON m.buque_id = b.id
LEFT JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
ORDER BY m.fecha_emision DESC;
```

### Estadísticas de residuos:
```sql
SELECT 
  COUNT(*) as total_manifiestos,
  SUM(aceite_usado) as total_aceite,
  SUM(filtros_aceite) as total_filtros_aceite,
  SUM(filtros_diesel) as total_filtros_diesel,
  SUM(filtros_aire) as total_filtros_aire,
  SUM(basura) as total_basura
FROM manifiestos_residuos;
```

## ⚠️ IMPORTANTE

- La tabla `manifiestos_backup` contiene la estructura anterior
- Los campos de residuos aceptan valor 0 (cero)
- La relación es 1:1 entre manifiesto y residuos
- El archivo `ACTUALIZAR_MANIFIESTOS.sql` está listo para ejecutar

## 🐛 Troubleshooting

### **Error: "table manifiestos_residuos does not exist"**
✅ Solución: Ejecuta el SQL de actualización

### **Error: "duplicate key value violates unique constraint"**
✅ Solución: Ya existe un registro de residuos para ese manifiesto

### **Los valores no se guardan**
✅ Solución: Verifica políticas RLS y permisos de la tabla

### **No aparecen los datos en el formulario**
✅ Solución: Reinicia el servidor de desarrollo

## 📞 Siguiente Paso

**¡Listo para ejecutar el SQL en Supabase!** 🚀

Una vez ejecutado, podrás:
- ✅ Crear manifiestos con los 5 campos de residuos
- ✅ Ver resumen en tiempo real
- ✅ Subir archivos digitalizados
- ✅ Consultar estadísticas de residuos

---

**Fecha:** 9 de noviembre de 2025  
**Versión:** 2.0 - Campos Específicos
