'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, CalendarClock, CreditCard, History, TrendingUp, Users, Wallet } from 'lucide-react';
import { Cargando, ErrorCarga, mensajeError } from '@/components/asociaciones/ui';
import { EstadoSuscripcionBadge, EstadoVacio, Kpi, Tarjeta, formatoFecha, formatoNumero, hace } from '@/components/superadmin/ui';
import { GraficaIngresos, type IngresoMes } from '@/components/superadmin/GraficaIngresos';
import { getMetricas, getAuditoria, type MetricasSistema } from '@/lib/services/superadmin';
import { getAsociacionesConSuscripcion, getPagos, type AsociacionConSuscripcion, type PagoConAsociacion } from '@/lib/services/suscripciones';
import {
    ESTADO_SUSCRIPCION_LABEL,
    diasHasta,
    estadoEfectivo,
    formatoMXN,
    hoyPuerto,
    precioMensual,
    sumarMeses,
    type EstadoSuscripcion,
} from '@/lib/constants/suscripciones';
import type { EntradaAuditoria } from '@/types/database';

const DIAS_AVISO = 15;
const ORDEN_ESTADOS: EstadoSuscripcion[] = ['activa', 'prueba', 'vencida', 'suspendida', 'cancelada'];
const BARRA_ESTADO: Record<EstadoSuscripcion, string> = {
    activa: 'bg-[#127A5D]',
    prueba: 'bg-simar-marea',
    vencida: 'bg-[#A63F0E]',
    suspendida: 'bg-[#A63F0E]',
    cancelada: 'bg-simar-campo-borde',
};

interface Datos {
    metricas: MetricasSistema;
    asociaciones: AsociacionConSuscripcion[];
    pagos: PagoConAsociacion[];
    actividad: EntradaAuditoria[];
}

export default function ResumenSuperadminPage() {
    const pathname = usePathname();
    const base = `/${pathname.split('/')[1] || 'es'}/superadmin`;
    const [datos, setDatos] = useState<Datos | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [verTabla, setVerTabla] = useState(false);

    const cargar = useCallback(
        () =>
            Promise.all([getMetricas(), getAsociacionesConSuscripcion(), getPagos(), getAuditoria({}, 0, 8)])
                .then(([metricas, asociaciones, pagos, { entradas }]) => {
                    setDatos({ metricas, asociaciones, pagos, actividad: entradas });
                    setError(null);
                })
                .catch((err) =>
                    setError(mensajeError(err, 'No se pudo cargar el resumen. ¿Está aplicada la migración del panel de superadmin?'))
                ),
        []
    );

    useEffect(() => {
        cargar();
    }, [cargar]);

    const resumen = useMemo(() => {
        if (!datos) return null;
        const hoy = hoyPuerto();
        const mesActual = hoy.slice(0, 7);

        const porEstado = Object.fromEntries(ORDEN_ESTADOS.map((e) => [e, 0])) as Record<EstadoSuscripcion, number>;
        let mrr = 0;
        const atencion: { asociacion: AsociacionConSuscripcion; estado: EstadoSuscripcion; dias: number }[] = [];

        for (const a of datos.asociaciones) {
            const s = a.suscripcion;
            if (!s) continue;
            const estado = estadoEfectivo(s.estado, s.vence_el);
            porEstado[estado]++;
            if (estado === 'activa') mrr += precioMensual(Number(s.precio), s.ciclo);
            if (s.vence_el && (estado === 'vencida' || ((estado === 'activa' || estado === 'prueba') && diasHasta(s.vence_el) <= DIAS_AVISO))) {
                atencion.push({ asociacion: a, estado, dias: diasHasta(s.vence_el) });
            }
        }
        atencion.sort((x, y) => x.dias - y.dias);

        // Últimos 12 meses, incluido el actual
        const meses: IngresoMes[] = Array.from({ length: 12 }, (_, i) => ({
            mes: sumarMeses(`${mesActual}-01`, i - 11).slice(0, 7),
            total: 0,
        }));
        const indice = new Map(meses.map((m, i) => [m.mes, i]));
        for (const p of datos.pagos) {
            const i = indice.get(p.fecha_pago.slice(0, 7));
            if (i !== undefined) meses[i].total += Number(p.monto);
        }
        const cobradoMes = meses[11].total;
        const cobradoAnterior = meses[10].total;

        return {
            porEstado,
            conSuscripcion: datos.asociaciones.filter((a) => a.suscripcion).length,
            sinSuscripcion: datos.asociaciones.filter((a) => !a.suscripcion).length,
            mrr,
            atencion,
            meses,
            total12: meses.reduce((s, m) => s + m.total, 0),
            cobradoMes,
            cobradoAnterior,
        };
    }, [datos]);

    if (error) return <ErrorCarga mensaje={error} onReintentar={cargar} />;
    if (!datos || !resumen) return <Cargando texto="Cargando resumen…" />;

    const { metricas } = datos;
    const u = metricas.usuarios;
    const pendientesAtencion = resumen.atencion.length + u.pendiente;
    const variacion =
        resumen.cobradoAnterior > 0 ? ((resumen.cobradoMes - resumen.cobradoAnterior) / resumen.cobradoAnterior) * 100 : null;

    return (
        <div className="space-y-6 movil:space-y-3">
            {/* En celular, dos por fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 movil:grid-cols-2 movil:gap-2.5">
                <Kpi
                    label="Cuentas"
                    valor={formatoNumero(u.total)}
                    icono={Users}
                    detalle={`${u.activos_30d} con acceso en los últimos 30 días`}
                />
                <Kpi
                    label="Ingreso mensual recurrente"
                    valor={formatoMXN(resumen.mrr)}
                    icono={TrendingUp}
                    detalle={`${resumen.porEstado.activa} suscripción(es) activa(s)`}
                />
                <Kpi
                    label="Cobrado este mes"
                    valor={formatoMXN(resumen.cobradoMes)}
                    icono={Wallet}
                    detalle={
                        variacion === null
                            ? 'Sin cobros el mes anterior'
                            : `${variacion >= 0 ? '+' : '−'}${Math.abs(variacion).toFixed(0)} % vs. mes anterior`
                    }
                />
                <Kpi
                    label="Requieren atención"
                    valor={pendientesAtencion}
                    icono={AlertTriangle}
                    alerta={pendientesAtencion > 0}
                    detalle={
                        <>
                            <span className="movil:hidden">
                                {resumen.atencion.length} suscripción(es) por vencer o vencidas · {u.pendiente} cuenta(s) pendiente(s)
                            </span>
                            {/* En celular la tarjeta mide media pantalla: la versión corta */}
                            <span className="hidden movil:inline">
                                {resumen.atencion.length} por vencer · {u.pendiente} pendiente(s)
                            </span>
                        </>
                    }
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 movil:gap-3">
                <Tarjeta
                    className="xl:col-span-2"
                    titulo="Ingresos cobrados por mes"
                    subtitulo={`Últimos 12 meses · ${formatoMXN(resumen.total12)} en total`}
                    acciones={
                        resumen.total12 > 0 && (
                            <button
                                onClick={() => setVerTabla((v) => !v)}
                                className="text-[15px] font-semibold text-simar-violeta hover:underline"
                            >
                                {verTabla ? 'Ver gráfica' : 'Ver tabla'}
                            </button>
                        )
                    }
                >
                    {resumen.total12 > 0 ? (
                        <GraficaIngresos datos={resumen.meses} verTabla={verTabla} />
                    ) : (
                        <EstadoVacio
                            icono={Wallet}
                            titulo="Sin pagos registrados"
                            texto="Los pagos que registres en Suscripciones aparecerán aquí."
                        />
                    )}
                </Tarjeta>

                <Tarjeta
                    titulo="Suscripciones por estado"
                    subtitulo={`${resumen.conSuscripcion} con suscripción · ${resumen.sinSuscripcion} sin suscripción`}
                >
                    <ul className="space-y-3">
                        {ORDEN_ESTADOS.map((estado) => {
                            const n = resumen.porEstado[estado];
                            const pct = resumen.conSuscripcion ? (n / resumen.conSuscripcion) * 100 : 0;
                            return (
                                <li key={estado}>
                                    <div className="flex items-center justify-between gap-2">
                                        <EstadoSuscripcionBadge estado={estado} />
                                        <span className="text-base font-semibold text-simar-texto tabular-nums">{n}</span>
                                    </div>
                                    <div
                                        className="mt-1.5 h-1.5 rounded-full bg-simar-papel overflow-hidden"
                                        role="img"
                                        aria-label={`${ESTADO_SUSCRIPCION_LABEL[estado]}: ${n}`}
                                    >
                                        <div className={`h-full rounded-full ${BARRA_ESTADO[estado]}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <Link
                        href={`${base}/suscripciones`}
                        className="mt-5 inline-flex text-[15px] font-semibold text-simar-violeta hover:underline"
                    >
                        Gestionar suscripciones →
                    </Link>
                </Tarjeta>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 movil:gap-3">
                <Tarjeta titulo="Vencimientos" subtitulo={`Vencidas o que vencen en ${DIAS_AVISO} días o menos`}>
                    {resumen.atencion.length === 0 ? (
                        <EstadoVacio icono={CalendarClock} titulo="Nada por vencer" />
                    ) : (
                        <ul className="divide-y divide-simar-borde-suave">
                            {resumen.atencion.map(({ asociacion, estado, dias }) => (
                                <li key={asociacion.id} className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-base font-medium text-simar-texto truncate">{asociacion.nombre_asociacion}</p>
                                        <p className="text-[15px] text-simar-texto-2">
                                            {dias < 0 ? `Venció hace ${-dias} día(s)` : dias === 0 ? 'Vence hoy' : `Vence en ${dias} día(s)`} ·{' '}
                                            {formatoFecha(asociacion.suscripcion?.vence_el)}
                                        </p>
                                    </div>
                                    <EstadoSuscripcionBadge estado={estado} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Tarjeta>

                <Tarjeta titulo="Cuentas" subtitulo={`${metricas.invitaciones_pendientes} invitación(es) sin aceptar`}>
                    <dl className="grid grid-cols-2 gap-3">
                        {[
                            ['Administradores', u.admin],
                            ['Recolectores', u.recolector],
                            ['Pendientes', u.pendiente],
                            ['Superadmins', u.superadmin],
                            ['Suspendidas', u.suspendidos],
                            ['Correo sin confirmar', u.sin_confirmar],
                            ['Nuevas (30 días)', u.nuevos_30d],
                            ['Activas (30 días)', u.activos_30d],
                        ].map(([label, n]) => (
                            <div key={label} className="rounded-xl bg-simar-papel px-3 py-2.5">
                                <dt className="text-[15px] text-simar-texto-2">{label}</dt>
                                <dd className="text-lg font-bold text-simar-texto">{n}</dd>
                            </div>
                        ))}
                    </dl>
                    <Link
                        href={`${base}/cuentas`}
                        className="mt-4 inline-flex text-[15px] font-semibold text-simar-violeta hover:underline"
                    >
                        Gestionar cuentas →
                    </Link>
                </Tarjeta>

                <Tarjeta titulo="Actividad reciente" subtitulo="Últimos cambios registrados en la bitácora">
                    {datos.actividad.length === 0 ? (
                        <EstadoVacio icono={History} titulo="Sin actividad registrada" />
                    ) : (
                        <ul className="space-y-3">
                            {datos.actividad.map((e) => (
                                <li key={e.id} className="flex items-start gap-3">
                                    <span
                                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                            e.operacion === 'INSERT' ? 'bg-[#127A5D]' : e.operacion === 'DELETE' ? 'bg-[#A63F0E]' : 'bg-simar-marea'
                                        }`}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-base text-simar-texto">
                                            <span className="font-semibold">{e.operacion === 'INSERT' ? 'Alta' : e.operacion === 'DELETE' ? 'Baja' : 'Cambio'}</span>{' '}
                                            en <span className="font-mono text-[15px]">{e.tabla}</span>
                                        </p>
                                        <p className="text-[15px] text-simar-texto-2 truncate">
                                            {e.usuario_email ?? 'Sistema'} · {hace(e.created_at)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link
                        href={`${base}/auditoria`}
                        className="mt-4 inline-flex text-[15px] font-semibold text-simar-violeta hover:underline"
                    >
                        Ver bitácora completa →
                    </Link>
                </Tarjeta>
            </div>

            <p className="flex items-center gap-2 text-[15px] text-simar-texto-2">
                <CreditCard className="w-3.5 h-3.5" />
                Importes en MXN. El ingreso mensual recurrente suma las suscripciones activas (las anuales cuentan 1/12 por mes).
            </p>
        </div>
    );
}
