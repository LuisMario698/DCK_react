'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { Package, Inbox, Building2, MessageSquare } from 'lucide-react';
import { EncabezadoPantalla, TarjetaDato } from '@/components/ui/simar';
import { InventarioTab } from '@/components/asociaciones/InventarioTab';
import { SolicitudesTab } from '@/components/asociaciones/SolicitudesTab';
import { EmpresasTab } from '@/components/asociaciones/EmpresasTab';
import { ChatTab } from '@/components/asociaciones/ChatTab';
import { getAsociaciones } from '@/lib/services/asociaciones';
import { contarSolicitudesPendientes } from '@/lib/services/solicitudes';
import { contarMensajesNoLeidos, suscribirMensajes } from '@/lib/services/mensajes';
import { suscribirCambios } from '@/lib/services/notificaciones';

type Tab = 'inventario' | 'solicitudes' | 'empresas' | 'chat';

async function obtenerStats() {
    try {
        const [asociaciones, pendientes, noLeidos] = await Promise.all([
            getAsociaciones(),
            contarSolicitudesPendientes(),
            contarMensajesNoLeidos('recolector'),
        ]);
        return {
            empresas: asociaciones.filter((a) => a.estado === 'Activo').length,
            pendientes,
            noLeidos,
        };
    } catch (err) {
        console.error('Error cargando estadísticas de empresas:', err);
        return null;
    }
}

/**
 * El Panel ("Por atender") y los avisos de la campana llegan con parámetros:
 * - `?solicitud=ID`: Solicitudes, en el filtro de esa solicitud y resaltada;
 * - `?ver=por-recolectar`: Solicitudes en "Por recolectar";
 * - `?ver=mensajes` (con `&empresa=ID`, en esa conversación): Mensajes;
 * - `?ver=inventario`: Inventario.
 */
type Parametros = { ver?: string; empresa?: string; solicitud?: string };

const idValido = (v?: string) => (Number(v) > 0 ? Number(v) : null);
const seccionDe = (ver?: string): Tab => (ver === 'mensajes' ? 'chat' : ver === 'inventario' ? 'inventario' : 'solicitudes');

export default function AsociacionesPage({ searchParams }: { searchParams: Promise<Parametros> }) {
    const { ver, empresa, solicitud } = use(searchParams);
    const [tab, setTab] = useState<Tab>(seccionDe(ver));
    const [asociacionChat, setAsociacionChat] = useState<number | null>(ver === 'mensajes' ? idValido(empresa) : null);
    // Si ya se estaba aquí y llega otro aviso (cambian los parámetros), se va a su sección
    const clave = `${ver}|${empresa}|${solicitud}`;
    const [clavePrevia, setClavePrevia] = useState(clave);
    if (clave !== clavePrevia) {
        setClavePrevia(clave);
        setTab(seccionDe(ver));
        if (ver === 'mensajes') setAsociacionChat(idValido(empresa));
    }
    const [stats, setStats] = useState({ empresas: 0, pendientes: 0, noLeidos: 0 });

    const cargarStats = useCallback(() => {
        obtenerStats().then((s) => s && setStats(s));
    }, []);

    useEffect(() => {
        obtenerStats().then((s) => s && setStats(s));
        const off1 = suscribirCambios('solicitudes_recoleccion', cargarStats);
        const off2 = suscribirMensajes(cargarStats);
        return () => {
            off1();
            off2();
        };
    }, [cargarStats]);

    // badge: sólo avisos (algo que atender). En celular las tarjetas de conteo se ocultan: pendientes y
    // sin leer van aquí; las asociaciones activas, dentro de su pestaña (EmpresasTab)
    const tabs: { value: Tab; label: string; icon: React.ReactNode; badge?: number; badgeTexto?: string }[] = [
        { value: 'solicitudes', label: 'Solicitudes', icon: <Inbox className="w-5 h-5" />, badge: stats.pendientes, badgeTexto: 'pendientes' },
        { value: 'inventario', label: 'Inventario', icon: <Package className="w-5 h-5" /> },
        { value: 'empresas', label: 'Empresas', icon: <Building2 className="w-5 h-5" /> },
        { value: 'chat', label: 'Mensajes', icon: <MessageSquare className="w-5 h-5" />, badge: stats.noLeidos, badgeTexto: 'sin leer' },
    ];

    const abrirChat = (asociacionId: number) => {
        setAsociacionChat(asociacionId);
        setTab('chat');
    };

    return (
        <div className="max-w-[1600px] space-y-6 movil:space-y-3">
            {/* Lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
            <EncabezadoPantalla
                icono={Building2}
                titulo="Empresas recolectoras"
                subtitulo="Publica residuos, gestiona solicitudes y comunícate con las empresas."
            />

            {/* Conteos. En celular se ocultan: cada número va en su pestaña (pendientes, sin leer, activas) */}
            <div data-recorrido="empresas-conteos" className="simar-aparece grid grid-cols-3 gap-2.5 sm:gap-4 movil:hidden" style={{ animationDelay: '0.06s' }}>
                <TarjetaDato apilada etiqueta="Empresas activas" valor={stats.empresas} icono={Building2} tono="arrecife" />
                <TarjetaDato apilada etiqueta="Solicitudes pendientes" valor={stats.pendientes} icono={Inbox} tono={stats.pendientes > 0 ? 'coral' : 'neutro'} />
                <TarjetaDato apilada etiqueta="Mensajes sin leer" valor={stats.noLeidos} icono={MessageSquare} tono={stats.noLeidos > 0 ? 'coral' : 'neutro'} />
            </div>

            {/* Secciones (primer nivel de la pantalla: el único con la pastilla azul rellena; los filtros
                de cada sección van más discretos). En celular, las cuatro en una fila con el ícono arriba y
                la palabra abajo; el aviso va en la esquina del ícono, como en las apps del teléfono */}
            <div data-recorrido="empresas-secciones" className="bg-simar-superficie border border-simar-borde rounded-2xl p-1.5 shadow-simar movil:p-1 movil:rounded-[20px]">
                <nav aria-label="Secciones de empresas" className="grid grid-cols-2 sm:flex gap-1 movil:grid-cols-4 movil:gap-0.5">
                    {tabs.map((t) => {
                        const active = tab === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => setTab(t.value)}
                                aria-current={active ? 'page' : undefined}
                                className={`simar-presiona relative sm:flex-1 min-w-0 sm:min-w-fit whitespace-nowrap min-h-[52px] px-3 sm:px-5 text-[17px] sm:text-lg font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-2 movil:flex-col movil:gap-1 movil:min-h-[58px] movil:px-0.5 movil:text-[clamp(11px,3.3vw,13px)] movil:leading-none movil:rounded-[16px] ${
                                    active
                                        ? 'bg-simar-marea text-white shadow-simar'
                                        : 'text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto'
                                }`}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                                {t.badge ? (
                                    <span
                                        aria-label={`${t.badge} ${t.badgeTexto}`}
                                        className={`text-[13px] px-1.5 h-[22px] rounded-full font-bold min-w-[22px] inline-flex items-center justify-center movil:absolute movil:top-1 movil:left-[calc(50%+3px)] movil:h-[18px] movil:min-w-[18px] movil:px-1 movil:text-[11px] movil:bg-[#A63F0E] movil:text-white movil:ring-2 ${
                                            active ? 'bg-white/25 text-white movil:ring-simar-marea' : 'bg-[#A63F0E] text-white movil:ring-simar-superficie'
                                        }`}
                                    >
                                        {t.badge}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div key={tab} className="">
                {tab === 'inventario' && <InventarioTab />}
                {tab === 'solicitudes' && (
                    <SolicitudesTab
                        filtroInicial={ver === 'por-recolectar' ? 'aprobada' : 'pendiente'}
                        resaltar={idValido(solicitud) ?? undefined}
                        onAbrirChat={abrirChat}
                        onCambio={cargarStats}
                    />
                )}
                {tab === 'empresas' && <EmpresasTab onAbrirChat={abrirChat} onCambio={cargarStats} />}
                {tab === 'chat' && <ChatTab asociacionIdInicial={asociacionChat} onCambio={cargarStats} />}
            </div>
        </div>
    );
}
