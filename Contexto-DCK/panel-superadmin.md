# Panel de superadministrador (desarrollador)

Panel en `/[locale]/superadmin` para quien mantiene SiMAR: cuentas, suscripciones de las
asociaciones recolectoras, configuración global y bitácora. Migración:
`supabase/migrations/20260925000005_panel_superadmin.sql`.

## Decisiones tomadas

| Tema | Decisión | Dónde cambiarla |
|---|---|---|
| Quién es superadmin | Bandera `profiles.es_superadmin` sobre una cuenta `admin` (un `CHECK` lo exige). Sólo otro superadmin o el SQL Editor la otorgan. | RPC `sa_cambiar_superadmin` |
| Quién paga | Las **asociaciones recolectoras** (una suscripción por asociación). El centro de acopio no se cobra a sí mismo. | Tabla `suscripciones` |
| Cobro | **Manual**: el superadmin registra cada pago (transferencia, depósito, efectivo…). No hay pasarela. Importes en **MXN**. | RPC `sa_registrar_pago` |
| Estado «vencida» | No se guarda: se calcula (`prueba`/`activa` con `vence_el` pasado). No hace falta cron. | `estado_efectivo_suscripcion()` y `estadoEfectivo()` en TS |
| Efecto de no pagar | Por defecto **ninguno** (suscripciones informativas). Si se activa *Suscripción obligatoria* en Sistema, una asociación sin suscripción vigente no puede crear solicitudes. | Clave `suscripciones.obligatorias` |
| Límite de usuarios | Si el plan tiene `limite_usuarios`, `invitar_usuario` no deja pasar de ahí. El superadmin sí puede vincular de más desde Cuentas. | `invitar_usuario` |
| Suspender una cuenta | Corta el acceso a datos al instante (las funciones de RLS ya no reconocen su rol), cierra sus sesiones y bloquea el inicio de sesión (`auth.users.banned_until`). No borra nada. | RPC `sa_suspender_usuario` |
| Eliminar una cuenta | Borra la fila de `auth.users`; el perfil cae en cascada y los registros que la referencian quedan con el autor en `null`. Pide escribir el correo. | RPC `sa_eliminar_usuario` |
| Dónde se entra | Enlace discreto «Acceso desarrollador» en el footer de la landing, no en el panel admin. Si una cuenta sin el permiso entra por ahí, el middleware la manda a su panel normal. | `VariantCinematic.tsx` (footer y modal) |
| Modo mantenimiento | Lo aplica el middleware: todo el que entra a un panel va a `/mantenimiento`, salvo superadmins. La landing sigue arriba. | Clave `mantenimiento` |
| Bitácora | `audit_log` ahora guarda el correo de quien hizo el cambio y cubre también perfiles, planes, suscripciones, pagos y configuración. | `audit_trigger_fn()` |

## Protecciones

- Ningún superadmin puede quitarse su propio permiso, suspenderse, eliminarse ni cambiarse el
  rol (evita quedarse sin acceso).
- Un admin normal no puede tocar la cuenta de un superadmin (ni con `revocar_acceso` ni con
  `invitar_usuario`): lo bloquea el trigger `proteger_campos_perfil`.
- Cada RPC `sa_*` comprueba `is_superadmin()` en la base de datos; el middleware sólo decide la
  navegación.
- Si el código se despliega antes de aplicar la migración, el middleware cae a leer sólo
  `profiles.rol` (como antes) y nadie ve el panel.

## Puesta en marcha

1. Aplicar `supabase/migrations/20260925000005_panel_superadmin.sql` en el SQL Editor (es
   idempotente).
2. Nombrar al primer superadmin, una sola vez, en el SQL Editor:

   ```sql
   update public.profiles set rol = 'admin', es_superadmin = true
    where email = '<correo del desarrollador>';
   ```

3. Entrar desde la landing: enlace **Acceso desarrollador** en la barra inferior del footer
   (junto al copyright). Abre el modal de login en modo desarrollador (sin selector de rol ni
   registro) y tras iniciar sesión lleva a `/superadmin`. Abrir `/es/superadmin` sin sesión
   también abre ese modal. Luego crear los planes en **Planes** y asignar suscripciones en
   **Suscripciones**.

## Secciones

| Sección | Qué permite |
|---|---|
| Resumen | Cuentas, ingreso mensual recurrente, cobrado del mes, ingresos de 12 meses, suscripciones por estado, vencimientos próximos y actividad reciente. |
| Cuentas | Todas las cuentas de Supabase Auth: cambiar rol/asociación, suspender/reactivar, otorgar/quitar superadmin, eliminar, invitar (admin o recolector) y cancelar invitaciones. |
| Suscripciones | Suscripción de cada asociación (plan, ciclo, precio acordado, estado, vigencia), registrar y borrar pagos, suspender/activar la asociación. |
| Planes | Catálogo con precio mensual/anual, límite de usuarios y características; activar/desactivar. |
| Auditoría | Bitácora filtrable por tabla, operación, usuario y fechas, con el detalle de cada cambio. |
| Sistema | Modo mantenimiento, aviso global (banner en los paneles), reglas de suscripción y uso de la base de datos y Storage. |

## Pendiente

- Pasarela de pago y facturación (CFDI).
- Avisos por correo de vencimiento.
- Ver la suscripción desde el portal recolector (hoy sólo ve el aviso cuando está bloqueada).
