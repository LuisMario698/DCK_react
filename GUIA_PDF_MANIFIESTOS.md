# Guía: Sistema de Descarga de PDFs para Manifiestos No Firmados

## 📋 Descripción General

Se ha implementado un sistema completo para generar, almacenar y descargar PDFs de manifiestos no firmados. Este sistema permite a los usuarios descargar manifiestos en formato PDF para que puedan ser firmados manualmente por los responsables y posteriormente digitalizados.

## 🏗️ Arquitectura del Sistema

### 1. Base de Datos
**Tabla:** `manifiestos_no_firmados`

Campos principales:
- `id`: Identificador único
- `manifiesto_id`: Referencia al manifiesto original
- `nombre_archivo`: Nombre del archivo PDF
- `ruta_archivo`: Ruta en Supabase Storage
- `url_descarga`: URL temporal de descarga
- `numero_manifiesto`: Número del manifiesto (para búsquedas)
- `fecha_generacion`: Fecha de creación del PDF
- `estado`: Estado del documento (pendiente, descargado, firmado, cancelado)
- `descargado_en` / `descargado_por`: Tracking de descarga
- `firmado_en`: Fecha de firma
- `observaciones`: Notas adicionales

**Bucket de Storage:** `manifiestos-no-firmados`
- Límite de tamaño: 10MB por archivo
- Tipos permitidos: Solo PDFs
- Acceso: Privado con RLS habilitado

### 2. Servicios Backend

**Archivo:** `lib/services/manifiestos_no_firmados.ts`

Funciones principales:
- `getManifiestosNoFirmados()`: Obtener todos los registros con relaciones
- `getManifiestosNoFirmadosPorEstado(estado)`: Filtrar por estado
- `createManifiestoNoFirmado(data)`: Crear nuevo registro
- `updateManifiestoNoFirmado(id, updates)`: Actualizar registro
- `marcarComoDescargado(id, descargadoPor)`: Marcar como descargado
- `marcarComoFirmado(id)`: Marcar como firmado
- `uploadPDFToStorage(file, fileName, folder)`: Subir PDF a Storage
- `getDownloadURL(filePath)`: Generar URL de descarga temporal (1 hora)
- `deletePDFFromStorage(filePath)`: Eliminar archivo del Storage

### 3. Generación de PDFs

**Archivo:** `lib/utils/pdfGenerator.ts`

Funciones:
- `generarPDFManifiesto(manifiesto)`: Genera un PDF profesional con:
  - Encabezado con branding CIAD
  - Información del manifiesto (número, fecha, estado)
  - Datos de la embarcación (nombre, matrícula, tipo, puerto)
  - Responsables (principal y secundario con contacto)
  - Detalle de residuos (aceite usado, filtros, basura)
  - Sección de observaciones
  - Espacios para firmas
  - Pie de página con timestamp de generación

- `generarNombreArchivoPDF(numeroManifiesto)`: Crea nombres consistentes
  - Formato: `manifiesto_[NUMERO]_[FECHA].pdf`
  - Ejemplo: `manifiesto_MAN-2024-001_2024-01-15.pdf`

- `descargarPDFManifiesto(manifiesto)`: Descarga directa en navegador

## 🎯 Flujo de Uso

### Para el Usuario

1. **Generar PDF:**
   - Desde la tabla de manifiestos, hacer clic en el botón verde "PDF"
   - El sistema genera automáticamente un PDF del manifiesto

2. **Descarga Automática:**
   - El PDF se descarga inmediatamente al navegador
   - Se almacena una copia en Supabase Storage
   - Se crea un registro en la base de datos para tracking

3. **Firma Manual:**
   - Imprimir el PDF descargado
   - Obtener firmas de los responsables

4. **Digitalización:**
   - Escanear el documento firmado
   - Subir al sistema de manifiestos existente

### Flujo Técnico

```
Usuario → Clic en "Descargar PDF"
    ↓
Generar PDF con jsPDF
    ↓
Convertir a Blob
    ↓
Subir a Supabase Storage
    ↓
Generar URL temporal (1 hora)
    ↓
Crear registro en BD
    ↓
Descargar archivo al navegador
    ↓
Mostrar confirmación
```

## 🎨 Interfaz de Usuario

### Botón de Descarga
**Ubicación:** Columna de acciones en la tabla de manifiestos

**Estados:**
- **Normal:** Botón verde con icono de descarga
- **Cargando:** Spinner animado con texto "..."
- **Deshabilitado:** Opacidad reducida mientras se genera otro PDF

**Características:**
- Responsive (oculta texto "PDF" en pantallas pequeñas)
- Traducido (español/inglés)
- Feedback visual durante la generación
- Tooltips descriptivos

## 🌐 Internacionalización (i18n)

### Traducciones Agregadas

**Español** (`messages/es.json`):
```json
"Manifiestos": {
  "titulo": "Gestión de Manifiestos",
  "subtitulo": "Administra los manifiestos de residuos",
  "acciones": {
    "descargarPDF": "Descargar PDF"
  },
  "mensajes": {
    "generandoPDF": "Generando PDF...",
    "pdfGenerado": "PDF generado exitosamente",
    "errorGenerarPDF": "Error al generar PDF",
    "descargando": "Descargando...",
    "descargaExitosa": "Descarga completada",
    "errorDescarga": "Error al descargar PDF"
  }
}
```

**Inglés** (`messages/en.json`):
```json
"Manifiestos": {
  "titulo": "Manifests Management",
  "subtitulo": "Manage waste manifests",
  "acciones": {
    "descargarPDF": "Download PDF"
  },
  "mensajes": {
    "generandoPDF": "Generating PDF...",
    "pdfGenerado": "PDF generated successfully",
    "errorGenerarPDF": "Error generating PDF",
    "descargando": "Downloading...",
    "descargaExitosa": "Download completed",
    "errorDescarga": "Error downloading PDF"
  }
}
```

## 📦 Dependencias Instaladas

```bash
npm install jspdf html2canvas
```

**jsPDF:** Librería para generación de PDFs en JavaScript
**html2canvas:** Conversión de HTML a canvas (útil para capturas si se necesita)

## 🔒 Seguridad

### Row Level Security (RLS)
- Solo usuarios autenticados pueden acceder a los PDFs
- Las URLs de descarga expiran después de 1 hora
- Los archivos no son públicamente accesibles
- Cada usuario solo puede ver sus propios manifiestos (según políticas RLS)

### Validaciones
- Tipo de archivo: Solo PDFs
- Tamaño máximo: 10MB
- Nombres de archivo sanitizados
- Verificación de existencia de manifiesto antes de generar

## 🧪 Testing

### Verificación Manual

1. **Generación de PDF:**
   ```
   ✓ Verificar que el PDF se genera correctamente
   ✓ Comprobar que contiene toda la información del manifiesto
   ✓ Validar formato y estilo profesional
   ✓ Revisar secciones de firma
   ```

2. **Almacenamiento:**
   ```
   ✓ Verificar que el archivo se sube a Supabase Storage
   ✓ Comprobar que se crea el registro en la BD
   ✓ Validar que la URL de descarga funciona
   ✓ Verificar que la URL expira después de 1 hora
   ```

3. **Descarga:**
   ```
   ✓ Verificar que se descarga automáticamente
   ✓ Comprobar que el nombre del archivo es correcto
   ✓ Validar que el PDF se abre correctamente
   ```

4. **Estados:**
   ```
   ✓ Verificar estado inicial "pendiente"
   ✓ Comprobar que se puede marcar como "descargado"
   ✓ Validar transición a "firmado"
   ```

## 📊 Monitoreo

### Queries Útiles

**Ver todos los PDFs generados:**
```sql
SELECT 
  mnf.numero_manifiesto,
  mnf.nombre_archivo,
  mnf.estado,
  mnf.fecha_generacion,
  mnf.descargado_en,
  mnf.descargado_por
FROM manifiestos_no_firmados mnf
ORDER BY fecha_generacion DESC;
```

**PDFs pendientes de descarga:**
```sql
SELECT * FROM manifiestos_no_firmados
WHERE estado = 'pendiente'
ORDER BY fecha_generacion DESC;
```

**Estadísticas de uso:**
```sql
SELECT 
  estado,
  COUNT(*) as total,
  COUNT(DISTINCT descargado_por) as usuarios_unicos
FROM manifiestos_no_firmados
GROUP BY estado;
```

## 🚀 Mejoras Futuras

### Corto Plazo
- [ ] Agregar vista de gestión de PDFs generados
- [ ] Implementar limpieza automática de PDFs antiguos
- [ ] Notificaciones por email al generar PDF
- [ ] Historial de descargas por usuario

### Mediano Plazo
- [ ] Firma digital en lugar de firma manual
- [ ] Generación de PDFs en lote
- [ ] Plantillas personalizables de PDF
- [ ] Integración con servicios de firma electrónica

### Largo Plazo
- [ ] Sistema completo de workflow de aprobación
- [ ] Versionado de PDFs
- [ ] Auditoría completa de cambios
- [ ] Integración con sistemas externos

## 🆘 Troubleshooting

### Error: "Error al generar PDF"
**Causa:** Datos faltantes en el manifiesto
**Solución:** Verificar que el manifiesto tiene todos los datos relacionados (buque, responsables, residuos)

### Error: "Error al subir a Storage"
**Causa:** Permisos insuficientes o bucket no configurado
**Solución:** Verificar que el bucket existe y las políticas RLS están activas

### Error: "URL de descarga expirada"
**Causa:** La URL temporal ha expirado (después de 1 hora)
**Solución:** Generar nuevo PDF o regenerar URL con `getDownloadURL()`

### PDF en blanco o incompleto
**Causa:** Datos de manifiesto incompletos
**Solución:** Validar que el manifiesto tiene todas las relaciones cargadas

## 📝 Notas de Implementación

1. **Performance:** La generación de PDFs es sincrónica y puede tardar 1-2 segundos
2. **Límites:** No hay límite de PDFs por manifiesto (se pueden generar múltiples veces)
3. **Cleanup:** Los PDFs antiguos no se eliminan automáticamente (implementar manualmente si es necesario)
4. **URLs temporales:** Las URLs expiran en 1 hora por seguridad
5. **Estado del sistema:** El botón se deshabilita mientras se genera un PDF para evitar clics múltiples

## 🎓 Recursos

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next-Intl Documentation](https://next-intl-docs.vercel.app/)

---

**Fecha de creación:** 2024
**Versión:** 1.0
**Autor:** Sistema CIAD
