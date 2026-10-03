# Demostración de SiMAR

Una copia de SiMAR para el jurado y el público: **datos inventados** y **de sólo lectura**, con
una entrada sin cuenta (`/es/demo`) y un recorrido guiado de 7 pasos (el puerto) o 4 (una empresa
recolectora).

## Cómo está armada

| Pieza | Dónde |
|---|---|
| Base de datos aparte (nunca la de producción: ahí hay datos reales de pescadores) | Otro proyecto Supabase, con `simar-demo.sql` |
| La misma app, con el modo demostración encendido | Otro proyecto de Vercel, mismo repo y rama, con `NEXT_PUBLIC_MODO_DEMO=1` |
| Entrada: elegir "Como el puerto" o "Como empresa recolectora" | `app/[locale]/demo/page.tsx`, `components/demo/EntradaDemo.tsx` |
| Recorrido guiado y franja "Demostración" | `components/demo/Recorrido.tsx`, `recorridos.ts` (textos), `FranjaDemo.tsx` |
| Primera llave: el navegador detiene cualquier guardado antes de enviarlo y avisa con calma | `lib/demo/supabaseDemo.ts`, `lib/demo/avisos.ts` |
| Segunda llave: la base rechaza toda escritura que llegue por la app | `30_candado.sql` |

Con el modo apagado (producción) no cambia nada, salvo que si existe `NEXT_PUBLIC_URL_DEMO` la
landing muestra "¿Sin cuenta? Prueba la demostración".

## Montarla (una vez, unos 15 minutos)

1. **Supabase → New project** (por ejemplo `SiMAR-demo`). Guarda la *Project URL* y la *anon key*
   (Project Settings → API).
2. **SQL Editor** → pega **todo** `supabase/demo/simar-demo.sql` → *Run*. Crea el esquema (base +
   migraciones), los buckets, los datos de ejemplo y el candado. Al final dice
   `Cuenta del puerto (...): falta crearla`: es normal, va en el paso 3.
3. **Authentication → Users → Add user → Create new user**, con *Auto Confirm User* marcado:
   - `puerto@simar.demo` · contraseña `SimarDemo2026`
   - `empresa@simar.demo` · contraseña `SimarDemo2026`
4. **SQL Editor** → corre `supabase/demo/40_cuentas.sql`. Debe decir **lista** en las dos cuentas.
5. **Storage → images** → sube `logoSemarnat.png` (el mismo del proyecto real) para que los PDF del
   manifiesto lleven el logo.
6. **Vercel → Add New → Project** → el mismo repositorio y rama que producción → *Environment
   Variables*:
   - `NEXT_PUBLIC_SB_URL` = la URL del proyecto de la demo
   - `NEXT_PUBLIC_SB_ANON_KEY` = la anon key de la demo
   - `NEXT_PUBLIC_MODO_DEMO` = `1`

   *Deploy*. (Las `NEXT_PUBLIC_*` se fijan al compilar: si cambias una, vuelve a desplegar.)
7. *(Opcional)* En el proyecto de **producción** de Vercel, `NEXT_PUBLIC_URL_DEMO` =
   `https://<tu-demo>.vercel.app` y vuelve a desplegar: aparece el enlace a la demo en la landing.
8. *(Recomendado para el stand)* Supabase de la demo → Authentication → *Rate Limits*: sube el
   límite de inicios de sesión. Muchos teléfonos en el mismo wifi cuentan como una sola IP.

Si Supabase no acepta esos correos, usa otros, ponlos en Vercel (`NEXT_PUBLIC_DEMO_CORREO_PUERTO`,
`NEXT_PUBLIC_DEMO_CORREO_EMPRESA`; la contraseña en `NEXT_PUBLIC_DEMO_CLAVE`) y corre
`select public.demo_configurar_cuentas('otro-puerto@...', 'otra-empresa@...');`.

## El día de la presentación

- **Enlace directo / código QR:** `https://<tu-demo>/es/demo?vista=puerto` entra solo y empieza el
  recorrido del puerto (`?vista=empresa` para el de la empresa).
- **Fechas al día:** si el proyecto tiene `pg_cron`, la demo se recorre sola cada noche para que lo
  más nuevo sea de hoy. Si no, la mañana del evento: `select public.demo_poner_al_dia();`.
- **Volver a empezar de cero:** corre `20_datos.sql` (borra y siembra otra vez; las cuentas se
  conservan).
- Nadie puede cambiar nada: ni guardar, ni borrar, ni cambiar la contraseña de las cuentas. Cerrar
  sesión sólo cierra la de ese equipo (no saca a los demás).
- Lleva el video del recorrido en la computadora y en un teléfono por si falla el internet del lugar.

## Archivos

| Archivo | Qué hace |
|---|---|
| `simar-demo.sql` | **Generado**: todo junto para pegarlo en el editor SQL. No lo edites a mano |
| `armar.mjs` | Lo genera: `node supabase/demo/armar.mjs` (vuélvelo a correr si cambian las migraciones) |
| `10_almacenamiento.sql` | Buckets que lee la app |
| `20_datos.sql` | Datos de ejemplo (todo inventado), `demo_configurar_cuentas()` y `demo_poner_al_dia()` |
| `30_candado.sql` | Sólo lectura: disparador en cada tabla y políticas restrictivas en Storage |
| `40_cuentas.sql` | Les da su rol a las dos cuentas después de crearlas |

Si después se agrega una tabla al esquema, corre otra vez `30_candado.sql` en la demo.
