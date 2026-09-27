'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, Truck, Package, Leaf, ArrowRight, Inbox } from 'lucide-react';
import { PUERTO_PENASCO, formatCantidad, tiempoRelativo } from '@/lib/constants/residuos';
import { co2eEvitadoKg } from '@/lib/constants/impacto';
import { InventarioResiduo, Notificacion, Recoleccion, SolicitudRecoleccion } from '@/types/database';
import { getInventario } from '@/lib/services/inventario';
import { getSolicitudes } from '@/lib/services/solicitudes';
import { getRecolecciones } from '@/lib/services/recolecciones';
import { getNotificaciones } from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { Cargando } from '@/components/asociaciones/ui';
import { NotifIcon } from '@/components/recolector/NotifIcon';
import { MapaCentroAcopio } from '@/components/recolector/MapaCentroAcopio';


export default function DashboardRecolectorPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const base = `/${locale}/dashboard-recolector`;
    const { asociacion, cargando: cargandoPerfil } = useRecolector();

    const [inventario, setInventario] = useState<InventarioResiduo[]>([]);
    const [solicitudes, setSolicitudes] = useState<SolicitudRecoleccion[]>([]);
    const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);

    // Todo se filtra por la asociación: un superadmin en el portal también es admin y la RLS le mostraría todo
    const asociacionId = asociacion?.id;
    useEffect(() => {
        if (!asociacionId) return;
        Promise.all([
            getInventario(true),
            getSolicitudes({ asociacionId }),
            getRecolecciones(asociacionId),
            getNotificaciones(5, { destinatario: 'recolector', asociacionId }),
        ])
            .then(([inv, sol, rec, notif]) => {
                setInventario(inv);
                setSolicitudes(sol);
                setRecolecciones(rec);
                setNotificaciones(notif);
            })
            .catch((err) => console.error('Error cargando el inicio del recolector:', err))
            .finally(() => setCargando(false));
    }, [asociacionId]);

    const disponibles = inventario.filter((i) => i.cantidad > 0);
    const activas = solicitudes.filter((s) => s.estado === 'pendiente' || s.estado === 'aprobada').length;
    const kgRecolectados = recolecciones.filter((r) => r.unidad === 'kg').reduce((s, r) => s + r.cantidad, 0);
    const co2 = recolecciones.reduce((s, r) => s + co2eEvitadoKg(r.tipo, r.cantidad), 0);

    if (cargandoPerfil || (asociacionId && cargando)) return <Cargando />;

    const kpis = [
        {
            label: 'Solicitudes activas',
            value: activas,
            icon: ClipboardCheck,
            accent: 'bg-simar-marea-suave text-simar-marea-tinta',
            href: `${base}/solicitudes`,
        },
        {
            label: 'Recolecciones completadas',
            value: recolecciones.length,
            icon: Truck,
            accent: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
            href: `${base}/historial`,
        },
        {
            label: 'Material sólido obtenido',
            value: kgRecolectados >= 1000 ? `${formatCantidad(kgRecolectados / 1000)} t` : `${formatCantidad(kgRecolectados)} kg`,
            icon: Package,
            accent: 'bg-[#E4F5F7] text-[#0E7C8A] dark:bg-[rgba(32,178,196,0.2)] dark:text-[#7FE0D6]',
            href: `${base}/impacto`,
        },
        {
            label: 'CO₂e evitado (estimado)',
            value: co2 >= 1000 ? `${formatCantidad(co2 / 1000)} t` : `${formatCantidad(Math.round(co2))} kg`,
            icon: Leaf,
            accent: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
            href: `${base}/impacto`,
        },
    ];

    return (
        <div className="space-y-5 max-w-[1600px]">
            {/* Saludo */}
            <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[26px] p-6 sm:p-8">
                <p className="text-base text-simar-texto-2">¡Bienvenido de vuelta!</p>
                <h2 className="text-[27px] sm:text-[32px] font-extrabold leading-tight text-simar-texto mt-0.5">{asociacion?.nombre_asociacion ?? 'Empresa recolectora'}</h2>
                <p className="text-[17px] sm:text-lg leading-relaxed text-simar-texto-2 mt-2.5 max-w-2xl">
                    Tienes <strong className="text-simar-texto">{activas} {activas === 1 ? 'solicitud activa' : 'solicitudes activas'}</strong> y el
                    centro de acopio de {PUERTO_PENASCO.nombre} tiene{' '}
                    <strong className="text-simar-texto">{disponibles.length} {disponibles.length === 1 ? 'residuo disponible' : 'residuos disponibles'}</strong>.
                </p>
                <Link
                    href={`${base}/mapa`}
                    className="mt-5 min-h-[60px] w-full sm:w-auto px-7 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-lg font-extrabold inline-flex items-center justify-center gap-2.5 transition-colors"
                >
                    Ver residuos y solicitar <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
                </Link>
            </section>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {kpis.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <Link
                            key={kpi.label}
                            href={kpi.href}
                            style={{ animationDelay: `${0.06 + i * 0.04}s` }}
                            className="simar-aparece simar-tarjeta-accion bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] p-4 sm:p-5"
                        >
                            <span className={`w-11 h-11 rounded-full flex items-center justify-center ${kpi.accent}`}>
                                <Icon className="w-[22px] h-[22px]" />
                            </span>
                            <p className="mt-2.5 text-[28px] font-extrabold text-simar-texto">{kpi.value}</p>
                            <p className="text-base leading-snug text-simar-texto-2">{kpi.label}</p>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Mapa */}
                <section className="lg:col-span-2 bg-simar-superficie border border-simar-borde shadow-simar rounded-[26px] p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-xl font-extrabold text-simar-texto">Centro de acopio</h3>
                            <p className="text-base text-simar-texto-2">
                                {PUERTO_PENASCO.nombre}, {PUERTO_PENASCO.region}
                            </p>
                        </div>
                        <Link
                            href={`${base}/mapa`}
                            className="min-h-[44px] text-base font-bold text-simar-marea-tinta hover:underline inline-flex items-center gap-1"
                        >
                            Ver inventario <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="rounded-[18px] overflow-hidden">
                        <MapaCentroAcopio alto="h-80" />
                    </div>
                </section>

                {/* Actividad reciente */}
                <section className="bg-simar-superficie border border-simar-borde shadow-simar rounded-[26px] p-5">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-extrabold text-simar-texto">Actividad reciente</h3>
                        <Link
                            href={`${base}/notificaciones`}
                            className="min-h-[44px] inline-flex items-center text-base font-bold text-simar-marea-tinta hover:underline"
                        >
                            Ver todas
                        </Link>
                    </div>
                    {notificaciones.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-simar-texto-2">
                            <Inbox className="w-8 h-8" />
                            <p className="text-base">Sin actividad todavía.</p>
                        </div>
                    ) : (
                        <ul>
                            {notificaciones.map((n) => (
                                <li key={n.id} className="flex items-start gap-3 py-3 border-b border-simar-borde-suave last:border-b-0">
                                    <NotifIcon tipo={n.tipo} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[17px] font-bold text-simar-texto truncate">{n.titulo}</p>
                                        <p className="text-[15px] text-simar-texto-2 truncate">{n.detalle}</p>
                                        <p className="text-[15px] text-simar-texto-2 mt-0.5">{tiempoRelativo(n.created_at)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
