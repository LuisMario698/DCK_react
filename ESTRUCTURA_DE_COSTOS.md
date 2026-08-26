# Estructura de Costos y Ecosistema Tecnológico SiMAR

Con base en el escaneo profundo de todos los archivos del proyecto, esta es la lista detallada de todo el ecosistema tecnológico que compone esta plataforma, desde el punto de vista de sistemas.

Esta lista está dividida en dos secciones para facilitar el análisis financiero: **Servicios y plataformas con costo recurrente** y **Tecnologías de código abierto (gratuitas)**.

---

## 1. Plataformas y Servicios Cloud (Con Costo Recurrente)
Estas son las plataformas que requieren servidores o servicios gestionados en la nube y por las que deberás pagar una suscripción mensual o anual. Son los ítems que van en tu tabla de presupuesto.

*   **Supabase (BaaS - Backend as a Service)**: 
    *   **Para qué se usa:** Es el "corazón" del backend. Aloja la **Base de Datos (PostgreSQL)**, maneja la **Autenticación** de los usuarios (login/registro), las reglas de seguridad (Row Level Security) y el **Almacenamiento** de archivos (PDFs de manifiestos, imágenes).
    *   *Nota de costos:* El proyecto usa la nube de Supabase (URL `lbdurpdzavrkaxixiprq.supabase.co`). Supabase tiene un plan gratuito limitado, pero para proyectos reales suele usarse el plan "Pro", cuyo costo base debes investigar (suele rondar los $25 USD/mes).
*   **Vercel (Plataforma de Hosting Frontend)**:
    *   **Para qué se usa:** Es la infraestructura/servidor web donde se ejecuta el código visual del sistema y atiende las peticiones de los usuarios.
    *   *Nota de costos:* Vercel es la plataforma por defecto para publicar proyectos de Next.js (el framework usado aquí). Tienen un plan "Hobby" gratuito (no apto para uso comercial estricto) y un plan "Pro" (generalmente $20 USD/mes por desarrollador/asiento).
*   **Dominio Web (Ej: www.simar.com)**:
    *   **Para qué se usa:** La dirección web a la que entrarán los usuarios para usar el sistema.
    *   *Nota de costos:* Deberás comprarlo en proveedores externos como GoDaddy, Namecheap o Hostinger. (Costo aproximado: $10 a $20 USD por año).

---

## 2. Tecnologías Core y Librerías (De código abierto y Uso Gratuito)
Estas son las herramientas, lenguajes y programas que construyen SiMAR. **No tienen costo de licencia o suscripción**, pero definen el perfil técnico del proyecto.

### Framework y Lenguajes base:
*   **Next.js (v14/16)**: El framework principal sobre el que está construido todo el sistema frontend y las rutas.
*   **React (v19)**: La librería de JavaScript que dibuja las interfaces interactivas (botones, tablas, menús).
*   **TypeScript (v5)**: El lenguaje de programación utilizado. Proporciona seguridad de tipos.
*   **Node.js (v20+)**: El entorno de ejecución requerido en el servidor.

### Diseño y Experiencia de Usuario:
*   **Tailwind CSS (v4)**: Framework de CSS utilizado para el diseño responsivo y la estética visual de la plataforma.
*   **Lucide React**: Biblioteca de iconos utilizada en menús, botones y navegación.
*   **Sonner**: Herramienta utilizada para mostrar pequeñas notificaciones o alertas en pantalla ("Toast").

### Funcionalidades Específicas del Negocio:
*   **Leaflet y React-Leaflet**: Herramientas cartográficas open source para mostrar **mapas interactivos** dentro del sistema.
*   **Recharts**: Biblioteca para generar las **gráficas y estadísticas** visuales en el panel de control (Dashboard).
*   **jsPDF y html2canvas**: Tecnologías para la **generación de documentos PDF** (utilizado probablemente para exportar los Manifiestos de recolección de residuos).
*   **SheetJS (xlsx)**: Librería utilizada para poder **generar o leer archivos de Excel**, útil para exportar reportes.
*   **Browser Image Compression**: Utilidad que comprime fotos/imágenes en el navegador antes de subirlas al servidor para ahorrar espacio.
*   **Next-intl**: Herramienta de internacionalización (el sistema está preparado para soportar múltiples idiomas).
*   **Date-fns**: Biblioteca ligera para el manejo, formato y cálculo complejo de fechas y horarios.

---

## Resumen Financiero 💰

Para tu investigación de la estructura de costos (presupuesto operativo mensual/anual tecnológico sin contar nómina), debes investigar los precios de:
1.  **Suscripción de Supabase** (Plan Pro).
2.  **Suscripción de Vercel** (Plan Pro comercial).
3.  **Renovación anual del nombre de Dominio**.

Todo el resto del stack tecnológico listado arriba no genera impacto financiero en licencias ni suscripciones.
