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
import { LogoSimar } from '@/components/layout/LogoSimar';
import { TarjetaDato } from '@/components/ui/simar';


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

    // Formato común de datos (TarjetaDato): ícono en círculo, etiqueta, número grande y flecha
    const kpis = [
        {
            label: 'Solicitudes activas',
            value: activas,
            icon: ClipboardCheck,
            tono: 'marea' as const,
            href: `${base}/solicitudes`,
        },
        {
            label: 'Recolecciones completadas',
            value: recolecciones.length,
            icon: Truck,
            tono: 'arrecife' as const,
            href: `${base}/historial`,
        },
        {
            label: 'Material sólido obtenido',
            value: kgRecolectados >= 1000 ? `${formatCantidad(kgRecolectados / 1000)} t` : `${formatCantidad(kgRecolectados)} kg`,
            icon: Package,
            tono: 'violeta' as const,
            href: `${base}/impacto`,
        },
        {
            label: 'CO₂e evitado (estimado)',
            value: co2 >= 1000 ? `${formatCantidad(co2 / 1000)} t` : `${formatCantidad(Math.round(co2))} kg`,
            icon: Leaf,
            tono: 'arrecife' as const,
            href: `${base}/impacto`,
        },
    ];

    return (
        <div className="space-y-5 max-w-[1600px] movil:space-y-3">
            {/* Saludo: símbolo SiMAR (como el Panel del recinto) y la acción principal a la derecha */}
            <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 sm:p-8 flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-8">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <LogoSimar variante="simbolo" tamano={84} className="hidden sm:inline-flex flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-base text-simar-texto-2">¡Bienvenido de vuelta!</p>
                        <h2 className="text-[27px] sm:text-[32px] font-extrabold leading-tight text-simar-texto mt-0.5 movil:text-[21px]">{asociacion?.nombre_asociacion ?? 'Empresa recolectora'}</h2>
                        <p className="text-[17px] sm:text-lg leading-relaxed text-simar-texto-2 mt-2 max-w-2xl">
                            Tienes <strong className="text-simar-texto">{activas} {activas === 1 ? 'solicitud activa' : 'solicitudes activas'}</strong> y el
                            centro de acopio de {PUERTO_PENASCO.nombre} tiene{' '}
                            <strong className="text-simar-texto">{disponibles.length} {disponibles.length === 1 ? 'residuo disponible' : 'residuos disponibles'}</strong>.
                        </p>
                    </div>
                </div>
                <Link
                    href={`${base}/mapa`}
                    className="simar-presiona group flex-shrink-0 min-h-[60px] w-full sm:w-auto sm:self-start xl:self-center px-7 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-lg font-extrabold inline-flex items-center justify-center gap-2.5"
                >
                    Ver residuos y solicitar{' '}
                    <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                </Link>
            </section>

            {/* Datos: toda la tarjeta lleva a su pantalla (en celular, dos por fila) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 movil:grid-cols-2 movil:gap-2.5">
                {kpis.map((kpi, i) => (
                    <TarjetaDato
                        key={kpi.label}
                        apilada
                        etiqueta={kpi.label}
                        valor={kpi.value}
                        icono={kpi.icon}
                        tono={kpi.tono}
                        href={kpi.href}
                        className="simar-aparece"
                        style={{ animationDelay: `${0.06 + i * 0.04}s` }}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 movil:gap-3">
                {/* Mapa: crece hasta la altura de "Actividad reciente" (acomodo a escuadra). En celular va
                    después de la actividad, que es lo que cambia */}
                <section className="simar-aparece lg:col-span-2 bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 sm:p-6 flex flex-col movil:order-2" style={{ animationDelay: '0.24s' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-[22px] font-extrabold text-simar-texto">Centro de acopio</h3>
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
                    <div className="flex-1 min-h-[320px] rounded-[18px] overflow-hidden border border-simar-borde-suave movil:min-h-[210px]">
                        <MapaCentroAcopio alto="h-full" />
                    </div>
                </section>

                {/* Actividad reciente */}
                <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 sm:p-6" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[22px] font-extrabold text-simar-texto">Actividad reciente</h3>
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
