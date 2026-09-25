# Fase 1 — Asociaciones recolectoras

Módulo que conecta al centro de acopio de Puerto Peñasco con las empresas que se llevan los
residuos reciclables. Reemplaza los prototipos con datos mock de `/dashboard/asociaciones` y
`/dashboard-recolector`.

## Decisiones tomadas (validar con el asesor externo)

| Tema | Decisión | Dónde cambiarla |
|---|---|---|
| Tipos de residuo | Plástico, aceite usado (L), cartón, chatarra metálica, vidrio, orgánico y filtros usados (piezas). El resto en kg. | Dominio `tipo_residuo` (SQL) **y** `lib/constants/residuos.ts` |
| Origen del inventario | Lo **captura el admin** a mano (pestaña Inventario). No se calcula de los manifiestos. | — |
| Momento del descuento | Al **aprobar** una solicitud se descuenta lo aprobado. Al **completarla** se ajusta la diferencia con lo realmente recolectado. Si se cancela una aprobada, regresa al inventario. | RPC `aprobar_solicitud` / `completar_solicitud` / `cancelar_solicitud` |
| Aprobación parcial | Permitida: el admin puede aprobar menos de lo solicitado. | `aprobar_solicitud` |
| Puertos | Un solo centro de acopio (Puerto Peñasco). | `PUERTO_PENASCO` en `lib/constants/residuos.ts` |
| Alta de empresas | **Por invitación.** El admin registra la asociación y vincula el correo de su usuario. Registrarse sin invitación deja la cuenta `pendiente`. | RPC `invitar_usuario` |
| Cuentas existentes | Las 6 cuentas que ya existían quedan como **admin** para no perder acceso. | Migración 1 (backfill) |
| Chat | Incluido (una conversación por asociación, en tiempo real). | — |
| Impacto ambiental | CO₂e estimado con factores **provisionales** por tipo de residuo. | `lib/constants/impacto.ts` |
| i18n | Los módulos nuevos están en español (como el resto de pantallas fuera de las 4 traducidas). | — |

## Flujo

```
Admin publica inventario ──► Asociación ve residuos y crea solicitud (pendiente)
                                         │
             ┌───────────────────────────┼──────────────────────────┐
             ▼                           ▼                          ▼
     Admin rechaza (motivo)     Admin aprueba (descuenta)   Asociación cancela
        → rechazada                 → aprobada                 → cancelada
                                         │
                       Admin registra la recolección (cantidad real,
                       nombres y firmas) → completada + recolección con
                       folio REC-AAAA-NNNNN + comprobante PDF
```

Cada cambio de estado genera una notificación para la otra parte (triggers en la BD).

## Roles

| Rol | Entra a | Puede |
|---|---|---|
| `admin` | `/dashboard` | Todo lo operativo + gestionar asociaciones, inventario y solicitudes |
| `recolector` | `/dashboard-recolector` | Ver inventario publicado, crear/cancelar sus solicitudes, ver su historial y comprobantes, chatear, editar contacto de su asociación |
| `pendiente` | `/acceso-pendiente` | Nada (espera a que el admin lo vincule) |

## Cómo dar de alta a una empresa

1. Admin → **Asociaciones → Nueva**: captura razón social, RFC, contacto y materiales que recolecta.
2. En su perfil, sección **Usuarios con acceso al portal**, escribe el correo de la persona y pulsa **Vincular**.
3. Si esa persona ya tenía cuenta en SiMAR, obtiene acceso de inmediato. Si no, que se registre en
   la landing (**Iniciar sesión → Empresa Recolectora → Regístrate**) con ese mismo correo.

## Puesta en marcha en Supabase

Aplicar en el SQL Editor (en este orden) y verificar después con los *Advisors* de seguridad:

1. `supabase/migrations/20260923000001_roles_y_rls.sql`
2. `supabase/migrations/20260923000002_modulo_asociaciones.sql`

Ajustes que se hacen en el panel de Supabase (no son SQL):

- **Authentication → Providers → Email:** mantener la confirmación de correo activa (el alta por
  invitación depende de que el correo esté verificado).
- **Authentication → Password security:** activar *Leaked password protection*.

## Pendiente para Fase 2

- Validar con fuentes los factores de CO₂e.
- Envío de invitaciones por correo (hoy el admin avisa a la empresa por fuera).
- Notificaciones por correo.
- Varios centros de acopio (tabla `puertos`).
- Calcular inventario sugerido a partir de los manifiestos (aceite y filtros).
