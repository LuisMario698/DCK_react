# 🚀 PAQUETE DE CONTEXTO MAESTRO Y PROMPT PARA CLAUDE
### *Diseñado para la generación del documento de Word final del Proyecto Integrador S6M*

---

> [!NOTE]
> Copia y pega el contenido de este archivo directamente en Claude (o Claude Code) para que tenga todo el contexto del proyecto, sepa exactamente qué corregir de los documentos obsoletos, entienda cómo estructurar el **Manual de Instalación y Configuración** (que te hace falta), y genere un reporte final unificado y perfecto listo para ser exportado a Word.

---

## 📋 INSTRUCCIONES DE COPIADO-PEGADO PARA CLAUDE

```text
Actúa como un Ingeniero de Software Senior y redactor técnico experto. Te proporciono el paquete de contexto completo del Proyecto Integrador "DCK - Plataforma de Gestión de Residuos Marítimos" de 6to Semestre. 

Mi objetivo es consolidar y pulir toda la documentación académica e ingenieril del proyecto para compilar el reporte final del proyecto integrador (que posteriormente exportaré a Microsoft Word). Actualmente tengo el "Manual Técnico" y el "Manual de Usuario" preliminares, pero me hace falta estructurar de forma completa y profunda el "Manual de Instalación y Configuración". Además, existen discrepancias en mis archivos anteriores (que mencionaban tecnologías del semestre pasado ya obsoletas como Astro, Golang y Docker).

Por favor, ayúdame a generar el contenido definitivo para el reporte final, resolviendo las inconsistencias técnicas, agregando el Manual de Instalación faltante, y enriqueciendo cada apartado con la información real de mi base de datos en Supabase y el despliegue en Vercel, donde ya tenemos 741 manifiestos reales cargados.

Genera el contenido estructurado y formal en español, listo para copiar a Word.
```

---

## 🛠️ 1. MAPEO DE ARQUITECTURA: ACTUAL vs. DEPRECADA
*(Crucial para que Claude no cometa errores técnicos ni mezcle tecnologías)*

Durante el 5° semestre, el proyecto inició con un stack que ha sido **completamente modificado** en este 6° semestre para mejorar la mantenibilidad y accesibilidad. A continuación se muestra la tabla de equivalencias que Claude debe aplicar para limpiar y corregir la documentación:

| Componente Técnico | Tecnología Antigua (5° Semestre - **DEPRECADA/ELIMINADA**) | Tecnología Nueva (6° Semestre - **ACTUAL EN PRODUCCIÓN**) | Razón Técnica del Cambio |
| :--- | :--- | :--- | :--- |
| **Arquitectura de Servidores** | Contenedores locales Docker (`docker-compose.yml` con frontend, backend y base de datos local). | **Serverless en la Nube (Vercel + Supabase BaaS).** | Se eliminó la sobrecarga de mantener y orquestar servidores físicos en el centro de acopio. |
| **Frontend Framework** | Astro JS + React (enrutamiento de páginas estáticas). | **Next.js 16 (con App Router) + React 19.** | Mejor manejo del estado, layouts anidados optimizados e integración nativa de Server/Client Components. |
| **Lenguaje de Programación** | Frontend JS/TS y Backend en **Golang (con GoFiber)**. | **TypeScript 5 (Frontend y Backend unificados en Next.js).** | Curva de aprendizaje reducida; todo el sistema se mantiene bajo un único lenguaje con tipado estricto (`types/database.ts`). |
| **Base de Datos** | PostgreSQL local en Docker. | **PostgreSQL administrado en Supabase Cloud.** | Evita pérdida de datos por cortes de luz en el puerto, respaldos automáticos y escalabilidad sin administración. |
| **Procesamiento de Documentos** | Servidor secundario de Python (Flask) para extracción digital de PDFs. | **jsPDF + html2canvas + browser-image-compression** integrados en el cliente de Next.js. | Eliminó la necesidad de correr un servidor secundario de Python. La compresión de imágenes y renderizado de PDF se hace en el navegador de la tablet/PC. |
| **Seguridad y Acceso** | Login básico autodesarrollado en Go. | **Supabase Auth con verificación por código OTP** y Row Level Security (RLS) en base de datos. | Seguridad bancaria integrada, sesiones JWT y protección de datos sensibles de la flota a nivel de fila. |
| **Estilos** | Tailwind CSS 3. | **Tailwind CSS 4.** | Compilación ultrarrápida nativa y mejor soporte integrado para el selector de Modo Oscuro. |

---

## 📂 2. LA ESTRUCTURA DE LA BASE DE DATOS REAL (SUPABASE)
*(Claude debe utilizar este esquema exacto de 13 tablas para detallar el modelo relacional y el Diccionario de Datos)*

```sql
-- 1. tipos_persona (id, nombre_tipo, descripcion, created_at, updated_at)
-- 2. personas (id, nombre, tipo_persona_id [FK], info_contacto, created_at, updated_at)
-- 3. buques (id, nombre_buque, tipo_buque, propietario_id [FK], fecha_registro, matricula, puerto_base, capacidad_toneladas, estado, created_at, updated_at)
-- 4. tipos_residuos (id, nombre_tipo, metrica, descripcion, categoria, peligrosidad, created_at, updated_at)
-- 5. usuarios_sistema (id, nombre_usuario, rol, contacto_usuario, email, hash_contraseña, estado, ultimo_acceso, created_at, updated_at)
-- 6. cumplimiento (id, buque_id [FK], fecha_inspeccion, observaciones, usuario_sistema_id [FK], calificacion, estado, documento_url, created_at, updated_at)
-- 7. residuos (id, buque_id [FK], tipo_residuo_id [FK], cantidad_generada, fecha_generacion, cumplimiento_id [FK], estado, ubicacion_almacenamiento, observaciones, created_at, updated_at)
-- 8. asociaciones_recolectoras (id, nombre_asociacion, tipo_asociacion, contacto_asociacion, email, telefono, direccion, certificaciones, especialidad, estado, created_at, updated_at)
-- 9. reutilizacion_residuos (id, residuo_id [FK], asociacion_id [FK], fecha_reutilizacion, cantidad_reutilizada, metodo_reutilizacion, producto_final, impacto_ambiental, costo_proceso, ingreso_generado, observaciones, created_at, updated_at)
-- 10. manifiestos (id, numero_manifiesto, fecha_emision, buque_id [FK], responsable_principal_id [FK], responsable_secundario_id [FK], imagen_manifiesto_url, pdf_manifiesto_url, estado_digitalizacion, digitalizador_id [FK], fecha_digitalizacion, observaciones, created_at, updated_at)
-- 11. manifiestos_residuos (id, manifiesto_id [FK], aceite_usado, filtros_aceite, filtros_diesel, filtros_aire, basura, observaciones, created_at, updated_at)
-- 12. manifiesto_basuron (id, fecha, hora_entrada, hora_salida, peso_entrada, peso_salida, total_depositado [Calculado], observaciones, buque_id [FK], usuario_sistema_id [FK], estado, numero_ticket, tipo_residuo_id [FK], comprobante_url, created_at, updated_at)
-- 13. manifiestos_no_firmados (id, manifiesto_id [FK], nombre_archivo, ruta_archivo, url_descarga, numero_manifiesto, fecha_generacion, estado, created_at, updated_at)
```

### 📦 Buckets de Almacenamiento (Supabase Storage):
1. `manifiestos_img` (Fotos de evidencias físicas)
2. `manifiestos_pdf` (PDFs digitales firmados)
3. `manifiestos_basuron_pdf` (PDFs de recibos de báscula del relleno sanitario)

---

## 📝 3. EL MANUAL DE INSTALACIÓN Y CONFIGURACIÓN (FALTANTE)
*(Claude debe redactar este manual paso a paso con el máximo detalle técnico)*

Este manual está dirigido al personal de TIC o administradores del sistema que requieran replicar o desplegar la plataforma desde cero en producción.

### **Paso 1: Clonado del Repositorio e Instalación de Node.js**
1. Asegurar tener instalado **Node.js v20.x o superior** y Git en la máquina local.
2. Clonar el repositorio desde la línea de comandos:
   ```bash
   git clone https://github.com/LuisMario698/DCK_react.git
   cd DCK_react
   ```
3. Instalar las dependencias de Node mediante el gestor de paquetes NPM:
   ```bash
   npm install
   ```

### **Paso 2: Configuración del Proyecto en Supabase Cloud**
1. Crear una cuenta e iniciar sesión en [Supabase.com](https://supabase.com/).
2. Crear un nuevo proyecto llamado `DCK_Production` y seleccionar la región más cercana (ej. *us-west* para el norte de México). Guardar de forma segura la contraseña de la base de datos PostgreSQL.
3. Ir a la pestaña **SQL Editor**, crear un **New Query** y pegar el script completo del esquema relacional (`ESQUEMA_COMPLETO_BASE_DATOS.sql` o `zTablas.sql`).
4. Hacer clic en **Run** y verificar que las 13 tablas, vistas, triggers y funciones relacionales se hayan creado en el esquema `public`.

### **Paso 3: Configuración de Buckets y Políticas de Almacenamiento (Storage)**
1. En la barra lateral de Supabase, ir a **Storage** y crear tres buckets públicos:
   - `manifiestos_img`
   - `manifiestos_pdf`
   - `manifiestos_basuron_pdf`
2. Ir a **Policies** dentro de Storage y configurar políticas de Row Level Security (RLS) para permitir que los usuarios autenticados realicen cargas (`INSERT`) y actualizaciones (`UPDATE`), y permitir la lectura pública (`SELECT`) para descarga de PDFs mediante URLs públicas.

### **Paso 4: Enlace de Variables de Entorno Locales**
1. En la raíz del proyecto, renombrar o crear el archivo `.env.local` con las credenciales obtenidas desde Supabase (Settings -> API):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-supabase.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-jwt-de-supabase
   ```

### **Paso 5: Publicación Continua (CI/CD) en Vercel**
1. Crear una cuenta en [Vercel.com](https://vercel.com/) y enlazarla con la cuenta de GitHub.
2. Importar el repositorio `DCK_react`.
3. En la sección **Environment Variables**, agregar las dos variables configuradas en el paso anterior (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. En la configuración de construcción, dejar los comandos por defecto (`npm run build` y `npm run start`).
5. Hacer clic en **Deploy**. Vercel compilará la aplicación Next.js y generará un subdominio seguro SSL (HTTPS) de forma automática.

---

## 📈 4. EL HITO DE PRODUCCIÓN: 741 MANIFIESTOS DIGITALIZADOS
*(Claude debe utilizar este argumento para enriquecer la sección de Resultados y Conclusiones)*

Un pilar fundamental de la justificación e implementación real de este semestre es que el sistema **no es un mero prototipo académico**, sino una herramienta en producción activa:
* **Digitalización Histórica:** Se procesaron y cargaron en la base de datos de producción **alrededor de 741 manifiestos reales** que el Sr. Francisco Bojórquez proporcionó del archivo histórico de la organización.
* **Integridad Relacional:** Esta carga masiva conllevó la creación de decenas de registros en el padrón de **personas** (tripulantes, motoristas, capitanes y responsables) y de las **embarcaciones** pesqueras activas de Puerto Peñasco, comprobando que las políticas de RLS, triggers y vistas analíticas funcionan perfectamente bajo un volumen de datos real y denso.
* **Resultados en Landing Page:** Los contadores dinámicos de la Landing Page en Vercel consumen esta información relacional en tiempo real, arrojando métricas impactantes de toneladas de basura y litros de aceite lubricante retirados del ecosistema costero.

---

## 💡 5. MEJORAS OBLIGATORIAS QUE DEBES PEDIRLE A CLAUDE

Cuando le entregues este paquete a Claude, pídele específicamente que haga las siguientes **mejoras y correcciones estructurales** en el reporte final:

1. **Eliminar Contradicciones:** Asegurar que los capítulos de *Planteamiento, Metodología, Arquitectura y Desarrollo* **no mencionen a Docker, Golang, GoFiber ni servidores de Python** como la arquitectura activa actual. Todo debe estar documentado bajo la arquitectura serverless Next.js + Supabase.
2. **Actualizar la Bibliografía:** Cambiar las referencias de Astro y Go por documentación oficial de *Next.js App Router (Vercel), React 19, Supabase RLS y Tailwind CSS 4*.
3. **Profundizar en el Capítulo de Implementación (Capítulo V):** Enriquecer la bitácora de pruebas de QA (QA Black Box Testing) agregando la carga exitosa de los 741 manifiestos históricos como evidencia de esfuerzo de migración y poblamiento de datos reales de la empresa.
4. **Completar las Portadas de los Manuales:** Redactar portadas formales individuales para cada uno de los anexos (Manual de Usuario, Manual Técnico y Manual de Instalación y Configuración) para que al momento de copiar a Word tengan una estructura elegante y presentable.
