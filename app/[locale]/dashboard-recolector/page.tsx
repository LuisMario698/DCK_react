'use client';

/**
 * Inicio del portal de empresas. Lo que la empresa viene a ver, en este orden:
 * - el saludo con una frase de lo más importante (hoy recoges, cuándo es tu próxima recolección,
 *   qué está esperando revisión o qué hay disponible) y el botón para pedir;
 * - cuatro datos (solicitudes activas, recolecciones, lo recolectado en cada unidad y el CO₂e);
 * - "Disponible ahora": lo que publicó el centro de acopio, con "Solicitar" ahí mismo;
 * - "Lo importante" (LoImportante.tsx), justo debajo del saludo: la recolección agendada en azul
 *   sólido, los avisos sin leer de aprobada / rechazada / completada en tarjetas de color con
 *   "Entendido", los mensajes nuevos y lo que espera revisión;
 * - la actividad reciente, donde cada aviso abre su solicitud.
 * En celular, después de lo importante va lo disponible, luego los datos y la actividad.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ClipboardCheck, Droplets, Inbox, Leaf, Package, PackageCheck, Send, Truck } from 'lucide-react';
import {
    PUERTO_PENASCO,
    TIPO_RESIDUO_COLOR,
    TIPO_RESIDUO_LABEL,
    formatCantidad,
    tiempoRelativo,
    unidadEscrita,
    type UnidadResiduo,
} from '@/lib/constants/residuos';
import { co2eEvitadoKg } from '@/lib/constants/impacto';
import { fechaHoyPuerto, hoyPuerto, saludoPuerto } from '@/lib/utils/fechas';
import { InventarioResiduo, Notificacion, Recoleccion, SolicitudConAsociacion } from '@/types/database';
import { getInventario } from '@/lib/services/inventario';
import { getSolicitudes, solicitudDelAviso } from '@/lib/services/solicitudes';
import { getRecolecciones } from '@/lib/services/recolecciones';
import { getNotificaciones, marcarNotificacionesLeidas, suscribirCambios } from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { Cargando } from '@/components/asociaciones/ui';
import { NotifIcon } from '@/components/recolector/NotifIcon';
import { SolicitarModal } from '@/components/recolector/SolicitarModal';
import { destinoDelAviso } from '@/components/recolector/destinoAviso';
import { LoImportante, avisoImportante, diaLargo, diasHasta } from '@/components/recolector/LoImportante';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { useEsCelular } from '@/components/layout/useEsCelular';
import { TarjetaDato } from '@/components/ui/simar';

const UNIDADES: UnidadResiduo[] = ['L', 'kg', 'pz'];

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-MX')} ${n === 1 ? uno : varios}`;

export default function DashboardRecolectorPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const base = `/${locale}/dashboard-recolector`;
    const { asociacion, cargando: cargandoPerfil, bloqueada, mensajesNoLeidos, esSuperadmin, recargarContadores } = useRecolector();
    const esCelular = useEsCelular();

    const [inventario, setInventario] = useState<InventarioResiduo[]>([]);
    const [solicitudes, setSolicitudes] = useState<SolicitudConAsociacion[]>([]);
    const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [solicitar, setSolicitar] = useState<InventarioResiduo | null>(null);

    // Todo se filtra por la empresa: un superadmin en el portal también es admin y la RLS le mostraría todo
    const asociacionId = asociacion?.id;
    const cargar = useCallback(async () => {
        if (!asociacionId) return;
        try {
            const [inv, sol, rec, notif] = await Promise.all([
                getInventario(true),
                getSolicitudes({ asociacionId }),
                getRecolecciones(asociacionId),
                // 20: además de la actividad (5) se buscan los avisos sin leer que van en "Lo importante"
                getNotificaciones(20, { destinatario: 'recolector', asociacionId }),
            ]);
            setInventario(inv);
            setSolicitudes(sol);
            setRecolecciones(rec);
            setNotificaciones(notif);
        } catch (err) {
            console.error('Error cargando el inicio del portal:', err);
        } finally {
            setCargando(false);
        }
    }, [asociacionId]);

    // Lo que publica el centro de acopio y lo que aprueba llega en vivo
    useEffect(() => {
        cargar();
        const quitarInventario = suscribirCambios('inventario_residuos', cargar);
        const quitarSolicitudes = suscribirCambios('solicitudes_recoleccion', cargar);
        return () => {
            quitarInventario();
            quitarSolicitudes();
        };
    }, [cargar]);

    if (cargandoPerfil || (asociacionId && cargando)) return <Cargando />;

    const hoy = hoyPuerto();
    const misTipos = asociacion?.tipos_residuo ?? [];
    const loRecolecta = (i: InventarioResiduo) => misTipos.length === 0 || misTipos.includes(i.tipo);
    // Primero lo que la empresa recolecta; luego lo demás
    const disponibles = inventario
        .filter((i) => i.cantidad > 0)
        .sort((a, b) => Number(loRecolecta(b)) - Number(loRecolecta(a)) || TIPO_RESIDUO_LABEL[a.tipo].localeCompare(TIPO_RESIDUO_LABEL[b.tipo]));
    const ultimaActualizacion = inventario.reduce<string | null>((max, i) => (!max || i.updated_at > max ? i.updated_at : max), null);

    const aprobadas = solicitudes.filter((s) => s.estado === 'aprobada').sort((a, b) => a.fecha_propuesta.localeCompare(b.fecha_propuesta));
    const proxima = aprobadas[0] ?? null;
    const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');
    const activas = aprobadas.length + pendientes.length;

    const porUnidad = UNIDADES.map((u) => ({ u, total: recolecciones.filter((r) => r.unidad === u).reduce((s, r) => s + r.cantidad, 0) })).filter(
        (x) => x.total > 0
    );
    const co2 = recolecciones.reduce((s, r) => s + co2eEvitadoKg(r.tipo, r.cantidad), 0);

    // La frase del saludo: lo más importante primero
    const frase = proxima
        ? diasHasta(proxima.fecha_propuesta, hoy) === 0
            ? 'Hoy tienes una recolección en el centro de acopio.'
            : diasHasta(proxima.fecha_propuesta, hoy) < 0
              ? `Tu recolección del ${diaLargo(proxima.fecha_propuesta).toLowerCase()} sigue pendiente de recoger.`
              : `Tu próxima recolección es el ${diaLargo(proxima.fecha_propuesta).toLowerCase()}.`
        : pendientes.length > 0
          ? `Tienes ${plural(pendientes.length, 'solicitud esperando', 'solicitudes esperando')} que el centro de acopio las revise.`
          : disponibles.length > 0
            ? `El centro de acopio de ${PUERTO_PENASCO.nombre} tiene ${plural(disponibles.length, 'residuo disponible', 'residuos disponibles')}.`
            : 'Por ahora el centro de acopio no tiene residuos disponibles. Te avisaremos cuando publique uno.';

    // Avisos sin leer que cambian algo. El de la próxima recolección no va aparte: la tarjeta azul lleva
    // "Recién aprobada"
    const sinLeer = notificaciones.filter(avisoImportante);
    const avisoDeLaProxima = proxima ? sinLeer.find((n) => n.tipo === 'aprobada' && solicitudDelAviso(n, solicitudes) === proxima.id) : undefined;
    const importantes = sinLeer.filter((n) => n !== avisoDeLaProxima);
    const entendido = async (id: number) => {
        // Se quita de la pantalla en seguida; si falla, vuelve con la siguiente carga
        setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
        try {
            await marcarNotificacionesLeidas([id], esSuperadmin);
            recargarContadores();
        } catch (err) {
            console.error('Error marcando el aviso como leído:', err);
        }
    };

    const datos = [
        { etiqueta: 'Solicitudes activas', valor: activas, icono: ClipboardCheck, tono: 'marea' as const, href: `${base}/solicitudes` },
        { etiqueta: 'Recolecciones completadas', valor: recolecciones.length, icono: Truck, tono: 'arrecife' as const, href: `${base}/historial` },
        {
            etiqueta: 'Lo que has recolectado',
            // Cada unidad por su lado (nunca se suman litros con kilos)
            valor: porUnidad.length ? porUnidad.map(({ u, total }) => `${formatCantidad(total)} ${u === 'pz' ? 'pz' : u}`).join(' · ') : 'Nada aún',
            icono: PackageCheck,
            tono: 'violeta' as const,
            href: `${base}/historial`,
            compacto: true,
        },
        {
            etiqueta: 'CO₂e evitado (estimado)',
            valor: co2 >= 1000 ? `${formatCantidad(co2 / 1000)} t` : `${formatCantidad(Math.round(co2))} kg`,
            icono: Leaf,
            tono: 'arrecife' as const,
            href: `${base}/impacto`,
        },
    ];

    return (
        <div className="space-y-5 max-w-[1600px] movil:space-y-3">
            {/* Saludo: la hora y el día del puerto, y la frase con lo más importante */}
            <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 sm:p-8 flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-8 movil:p-4 movil:gap-3.5 movil:rounded-[22px]">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <LogoSimar variante="simbolo" tamano={84} className="hidden sm:inline-flex flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-base text-simar-texto-2 movil:text-[14px]">
                            {saludoPuerto()} · {fechaHoyPuerto()}
                        </p>
                        <h2 className="text-[27px] sm:text-[32px] font-extrabold leading-tight text-simar-texto mt-0.5 movil:text-[21px]">
                            {asociacion?.nombre_asociacion ?? 'Empresa recolectora'}
                        </h2>
                        <p className="text-[17px] sm:text-lg leading-relaxed text-simar-texto-2 mt-2 max-w-2xl movil:text-[15px] movil:mt-1">{frase}</p>
                    </div>
                </div>
                <Link
                    href={`${base}/mapa`}
                    className="simar-presiona group flex-shrink-0 min-h-[60px] w-full sm:w-auto sm:self-start xl:self-center px-7 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-lg font-extrabold inline-flex items-center justify-center gap-2.5 movil:min-h-[50px] movil:text-[16px]"
                >
                    Ver residuos y solicitar <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                </Link>
            </section>

            {/* Lo importante: la recolección agendada, los avisos sin leer, los mensajes y lo que espera revisión */}
            <LoImportante
                proxima={proxima}
                otras={aprobadas.slice(1)}
                recienAprobada={!!avisoDeLaProxima}
                avisos={importantes.slice(0, 3).map((n) => ({ aviso: n, href: destinoDelAviso(n, solicitudes, base) }))}
                masAvisos={Math.max(0, importantes.length - 3)}
                mensajes={mensajesNoLeidos}
                pendientes={pendientes.length}
                hoy={hoy}
                base={base}
                onEntendido={entendido}
            />

            {/* En computadora los datos van arriba; en celular, después de lo disponible (order) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 movil:gap-3">
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 movil:order-4 movil:grid-cols-2 movil:gap-2.5">
                    {datos.map((d, i) => (
                        <TarjetaDato
                            key={d.etiqueta}
                            apilada
                            compacto={d.compacto}
                            etiqueta={d.etiqueta}
                            valor={d.valor}
                            icono={d.icono}
                            tono={d.tono}
                            href={d.href}
                            className="simar-aparece"
                            style={{ animationDelay: `${0.06 + i * 0.04}s` }}
                        />
                    ))}
                </div>

                {/* Disponible ahora: pedir sin salir del Inicio */}
                <section
                    className="simar-aparece lg:col-span-2 bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] overflow-hidden flex flex-col movil:order-2 movil:rounded-[22px]"
                    style={{ animationDelay: '0.22s' }}
                >
                    <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-simar-borde-suave movil:px-3.5 movil:pt-3.5 movil:pb-3">
                        <div className="min-w-0">
                            <h3 className="text-[22px] font-extrabold text-simar-texto movil:text-[17px]">Disponible ahora</h3>
                            <p className="text-base text-simar-texto-2 movil:text-[13px]">
                                Centro de acopio de {PUERTO_PENASCO.nombre}
                                {ultimaActualizacion && ` · actualizado ${tiempoRelativo(ultimaActualizacion).toLowerCase()}`}
                            </p>
                        </div>
                        <Link
                            href={`${base}/mapa`}
                            className="flex-shrink-0 min-h-[44px] text-base font-bold text-simar-marea-tinta hover:underline inline-flex items-center gap-1 movil:text-[14px] movil:min-h-[36px]"
                        >
                            <span className="movil:hidden">Ver todo y el mapa</span>
                            <span className="hidden movil:inline">Ver todo</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {disponibles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-simar-texto-2 movil:py-8">
                            <Package className="w-9 h-9 opacity-40" />
                            <p className="text-[17px] font-bold text-simar-texto movil:text-[15px]">Por ahora no hay residuos disponibles</p>
                            <p className="text-base movil:text-[14px]">Te avisaremos en Notificaciones cuando el centro de acopio publique uno.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-simar-borde-suave">
                            {disponibles.map((r) => {
                                const Icono = r.unidad === 'L' ? Droplets : Package;
                                return (
                                    <li key={r.id} className="flex items-center gap-4 px-5 sm:px-6 py-4 movil:gap-3 movil:px-3.5 movil:py-3">
                                        <span className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center ${TIPO_RESIDUO_COLOR[r.tipo]} movil:w-10 movil:h-10`}>
                                            <Icono className="w-6 h-6 movil:w-5 movil:h-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[18px] font-bold leading-tight text-simar-texto movil:text-[16px]">
                                                {TIPO_RESIDUO_LABEL[r.tipo]}
                                                {misTipos.length > 0 && misTipos.includes(r.tipo) && (
                                                    <span className="ml-2 align-middle inline-flex px-2 py-0.5 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta text-[13px] font-bold">
                                                        Lo recolectas
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-base text-simar-texto-2 mt-0.5 movil:text-[14px]">
                                                <strong className="text-[18px] font-extrabold tabular-nums text-simar-texto movil:text-[16px]">{formatCantidad(r.cantidad)}</strong>{' '}
                                                {unidadEscrita(r.unidad, r.cantidad)} disponibles
                                            </p>
                                            {r.notas && <p className="text-[15px] leading-snug text-simar-texto-2 mt-0.5 line-clamp-2 movil:text-[13px]">{r.notas}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSolicitar(r)}
                                            disabled={bloqueada}
                                            aria-label={`Solicitar recolección de ${TIPO_RESIDUO_LABEL[r.tipo].toLowerCase()}`}
                                            className="simar-presiona flex-shrink-0 min-h-[52px] px-5 rounded-2xl bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-bold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed movil:min-h-[42px] movil:px-3.5 movil:rounded-[14px] movil:text-[14px] movil:gap-1.5"
                                        >
                                            <Send className="w-5 h-5 movil:w-4 movil:h-4" />
                                            Solicitar
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Columna derecha: la actividad reciente */}
                <div className="flex flex-col gap-5 movil:contents">
                    <section
                        className="simar-aparece flex-1 bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 sm:p-6 movil:order-5 movil:rounded-[22px] movil:p-3.5"
                        style={{ animationDelay: '0.32s' }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[22px] font-extrabold text-simar-texto movil:text-[17px]">Actividad reciente</h3>
                            <Link href={`${base}/notificaciones`} className="min-h-[44px] inline-flex items-center text-base font-bold text-simar-marea-tinta hover:underline movil:text-[14px] movil:min-h-[36px]">
                                Ver todas
                            </Link>
                        </div>
                        {notificaciones.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-simar-texto-2">
                                <Inbox className="w-8 h-8" />
                                <p className="text-base">Sin actividad todavía.</p>
                            </div>
                        ) : (
                            <ul className="-mx-2">
                                {notificaciones.slice(0, 5).map((n) => (
                                    <li key={n.id}>
                                        {/* Cada aviso abre su solicitud (o Residuos, si es un residuo nuevo) */}
                                        <Link
                                            href={destinoDelAviso(n, solicitudes, base)}
                                            className="flex items-start gap-3 px-2 py-3 rounded-2xl border-b border-simar-borde-suave last:border-b-0 hover:bg-simar-papel transition-colors"
                                        >
                                            <NotifIcon tipo={n.tipo} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[17px] font-bold text-simar-texto leading-snug movil:text-[15px]">{n.titulo}</p>
                                                {n.detalle && <p className="text-[15px] text-simar-texto-2 leading-snug line-clamp-2 movil:text-[13px]">{n.detalle}</p>}
                                                <p className="text-[15px] text-simar-texto-2 mt-0.5 movil:text-[13px]">{tiempoRelativo(n.created_at)}</p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>

            {solicitar && (
                <SolicitarModal
                    residuo={solicitar}
                    onClose={() => setSolicitar(null)}
                    onCreada={() => {
                        setSolicitar(null);
                        cargar();
                    }}
                    locale={locale}
                    enfocar={!esCelular}
                />
            )}
        </div>
    );
}
