# 🚀 Servicios de Supabase - Documentación

## 📋 Configuración Inicial

### 1. Variables de Entorno

Edita el archivo `.env.local` y agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SB_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SB_ANON_KEY=tu-anon-key-aqui
```

### 2. Obtener Credenciales

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings > API**
4. Copia la **URL** y **anon/public key**

---

## 📦 Servicios Disponibles

### 🚢 **Buques** (`lib/services/buques.ts`)

```typescript
import { getBuques, getBuqueById, createBuque, updateBuque, deleteBuque, searchBuques } from '@/lib/services/buques'

// Obtener todos los buques
const buques = await getBuques()

// Obtener buque por ID
const buque = await getBuqueById(1)

// Crear nuevo buque
const nuevoBuque = await createBuque({
  nombre_buque: 'La Perla Negra',
  tipo_buque: 'Velero',
  matricula: 'ABC-123',
  puerto_base: 'Puerto Limón',
  capacidad_toneladas: 500,
  estado: 'Activo',
  propietario_id: 1,
  fecha_registro: '2025-01-01'
})

// Actualizar buque
const actualizado = await updateBuque(1, {
  estado: 'En Mantenimiento'
})

// Eliminar buque
await deleteBuque(1)

// Buscar buques
const resultados = await searchBuques('Perla')
```

---

### ♻️ **Residuos** (`lib/services/residuos.ts`)

```typescript
import { 
  getResiduos, 
  createResiduo, 
  getResiduosByBuque, 
  getEstadisticasResiduos 
} from '@/lib/services/residuos'

// Obtener todos los residuos con relaciones
const residuos = await getResiduos()

// Crear nuevo residuo
const nuevoResiduo = await createResiduo({
  buque_id: 1,
  tipo_residuo_id: 3,
  cantidad_generada: 150.5,
  fecha_generacion: '2025-11-06',
  estado: 'Generado',
  observaciones: 'Residuos de aceite'
})

// Obtener residuos de un buque específico
const residuosBuque = await getResiduosByBuque(1)

// Obtener estadísticas
const stats = await getEstadisticasResiduos()
console.log(stats)
// {
//   total: 45,
//   cantidadTotal: 2500.5,
//   porEstado: {
//     generado: 10,
//     almacenado: 15,
//     recolectado: 12,
//     procesado: 8
//   }
// }
```

---

### 🗑️ **Manifiesto Basurón** (`lib/services/manifiesto_basuron.ts`)

```typescript
import { 
  getManifiestosBasuron, 
  createManifiestoBasuron,
  completarManifiestoBasuron,
  getManifiestosBasuronByFecha,
  getEstadisticasManifiestosBasuron
} from '@/lib/services/manifiesto_basuron'

// Obtener todos los manifiestos
const manifiestos = await getManifiestosBasuron()

// Crear nuevo manifiesto (entrada)
const nuevoManifiesto = await createManifiestoBasuron({
  fecha: '2025-11-06',
  hora_entrada: '09:50:00',
  peso_entrada: 4490,
  buque_id: 1,
  usuario_sistema_id: 1,
  tipo_residuo_id: 2,
  estado: 'En Proceso',
  observaciones: 'Residuos orgánicos'
})

// Completar manifiesto (salida)
const completado = await completarManifiestoBasuron(
  nuevoManifiesto.id,
  '11:30:00', // hora_salida
  3500 // peso_salida
)

// El total_depositado se calcula automáticamente: 4490 - 3500 = 990

// Obtener manifiestos de hoy
const hoy = new Date().toISOString().split('T')[0]
const manifestosHoy = await getManifiestosBasuronByFecha(hoy)

// Obtener estadísticas del día
const statsHoy = await getEstadisticasManifiestosBasuron(hoy)
console.log(statsHoy)
// {
//   total: 15,
//   completados: 12,
//   enProceso: 3,
//   pesoTotalDepositado: 12500.5,
//   pesoPromedioDepositado: 833.37
// }
```

---

### 👥 **Personas** (`lib/services/personas.ts`)

```typescript
import { 
  getPersonas, 
  createPersona, 
  searchPersonas 
} from '@/lib/services/personas'

// Obtener todas las personas con su tipo
const personas = await getPersonas()

// Crear nueva persona
const nuevaPersona = await createPersona({
  nombre: 'Juan Pérez García',
  tipo_persona_id: 1, // 1 = Capitán
  info_contacto: 'tel: +506 8888-8888, email: juan@mail.com'
})

// Buscar personas
const resultados = await searchPersonas('Juan')
```

---

### 🏢 **Asociaciones** (`lib/services/asociaciones.ts`)

```typescript
import { 
  getAsociaciones, 
  createAsociacion, 
  getAsociacionesByEstado 
} from '@/lib/services/asociaciones'

// Obtener todas las asociaciones
const asociaciones = await getAsociaciones()

// Crear nueva asociación
const nuevaAsociacion = await createAsociacion({
  nombre_asociacion: 'Recicladores del Caribe',
  tipo_asociacion: 'Cooperativa',
  contacto_asociacion: '+506 2222-3333',
  email: 'info@recicladores.cr',
  especialidad: ['Plástico', 'Metal', 'Vidrio'],
  estado: 'Activo'
})

// Filtrar por estado
const activas = await getAsociacionesByEstado('Activo')
```

---

### ♻️ **Reutilización** (`lib/services/reutilizacion.ts`)

```typescript
import { 
  getReutilizaciones, 
  createReutilizacion,
  getEstadisticasReutilizacion 
} from '@/lib/services/reutilizacion'

// Obtener todas las reutilizaciones
const reutilizaciones = await getReutilizaciones()

// Crear nueva reutilización
const nuevaReutilizacion = await createReutilizacion({
  residuo_id: 1,
  asociacion_id: 1,
  fecha_reutilizacion: '2025-11-06',
  cantidad_reutilizada: 100,
  metodo_reutilizacion: 'Reciclaje',
  producto_final: 'Pellets de plástico',
  costo_proceso: 500,
  ingreso_generado: 1200
})

// Obtener estadísticas
const stats = await getEstadisticasReutilizacion()
console.log(stats)
// {
//   total: 25,
//   cantidadTotal: 5000,
//   costoTotal: 12500,
//   ingresoTotal: 28000,
//   ganancia: 15500
// }
```

---

### ✅ **Cumplimiento** (`lib/services/cumplimiento.ts`)

```typescript
import { 
  getCumplimientos, 
  createCumplimiento,
  getCumplimientosByBuque,
  getEstadisticasCumplimiento 
} from '@/lib/services/cumplimiento'

// Obtener todos los cumplimientos
const cumplimientos = await getCumplimientos()

// Crear nueva inspección
const nuevaInspeccion = await createCumplimiento({
  buque_id: 1,
  fecha_inspeccion: '2025-11-06',
  usuario_sistema_id: 1,
  calificacion: 'Excelente',
  estado: 'Aprobado',
  observaciones: 'Cumple con todos los requisitos'
})

// Obtener inspecciones de un buque
const inspeccionesBuque = await getCumplimientosByBuque(1)

// Obtener estadísticas
const stats = await getEstadisticasCumplimiento()
```

---

## 🎯 Ejemplo de Uso en Componente

### Página de Buques con Supabase

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getBuques, createBuque } from '@/lib/services/buques'
import { Buque } from '@/types/database'

export default function BuquesPage() {
  const [buques, setBuques] = useState<Buque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBuques()
  }, [])

  async function loadBuques() {
    try {
      setLoading(true)
      const data = await getBuques()
      setBuques(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error cargando buques:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(formData: any) {
    try {
      await createBuque(formData)
      await loadBuques() // Recargar lista
    } catch (err) {
      console.error('Error creando buque:', err)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Buques</h1>
      <ul>
        {buques.map(buque => (
          <li key={buque.id}>
            {buque.nombre_buque} - {buque.matricula}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 🔒 Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** habilitado. Asegúrate de configurar las políticas en Supabase Dashboard:

1. Ve a **Authentication > Policies**
2. Selecciona cada tabla
3. Agrega políticas según tus necesidades

### Ejemplo de política:
```sql
-- Permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura" ON buques
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Permitir inserción solo a administradores
CREATE POLICY "Permitir inserción admin" ON buques
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'rol' = 'Administrador'
  );
```

---

## 📊 Vistas Disponibles

### Vista: Manifiestos de Basurón
```typescript
const supabase = createClient()
const { data } = await supabase
  .from('vista_manifiestos_basuron')
  .select('*')
```

### Vista: Resumen Diario
```typescript
const { data } = await supabase
  .from('vista_resumen_diario_basuron')
  .select('*')
  .eq('fecha', '2025-11-06')
```

---

## 🛠️ Debugging

Si tienes problemas de conexión:

```typescript
// Verificar credenciales
console.log('URL:', process.env.NEXT_PUBLIC_SB_URL)
console.log('Key exists:', !!process.env.NEXT_PUBLIC_SB_ANON_KEY)

// Probar conexión
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data, error } = await supabase.from('buques').select('count')
console.log('Conexión:', error ? 'Error' : 'OK', data)
```

---

## 📝 Notas

- ✅ Todos los servicios usan tipos TypeScript
- ✅ Manejo de errores con try/catch
- ✅ Relaciones JOIN automáticas
- ✅ Ordenamiento por defecto
- ✅ Funciones de búsqueda y filtrado
- ✅ Estadísticas calculadas
- ✅ Validaciones de datos

---

## 🚀 Próximos Pasos

1. Configura tus credenciales en `.env.local`
2. Ejecuta el script SQL en Supabase (`zTablas.sql`)
3. Verifica la conexión
4. Usa los servicios en tus componentes
5. Configura las políticas RLS según necesites

¡Todo listo para empezar a trabajar con Supabase! 🎉
