'use client';

import { useCallback, useEffect, useState } from 'react';
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
        console.error('Error cargando estadísticas de asociaciones:', err);
        return null;
    }
}

export default function AsociacionesPage() {
    const [tab, setTab] = useState<Tab>('solicitudes');
    const [asociacionChat, setAsociacionChat] = useState<number | null>(null);
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

    // conteo: dato neutro que en celular reemplaza a su tarjeta de conteo (las tarjetas se ocultan)
    const tabs: { value: Tab; label: string; icon: React.ReactNode; badge?: number; conteo?: { valor: number; texto: string } }[] = [
        { value: 'solicitudes', label: 'Solicitudes', icon: <Inbox className="w-5 h-5" />, badge: stats.pendientes },
        { value: 'inventario', label: 'Inventario', icon: <Package className="w-5 h-5" /> },
        { value: 'empresas', label: 'Asociaciones', icon: <Building2 className="w-5 h-5" />, conteo: { valor: stats.empresas, texto: 'asociaciones activas' } },
        { value: 'chat', label: 'Mensajes', icon: <MessageSquare className="w-5 h-5" />, badge: stats.noLeidos },
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
                titulo="Asociaciones recolectoras"
                subtitulo="Publica residuos, gestiona solicitudes y comunícate con las empresas."
            />

            {/* Conteos. En celular se ocultan: cada número va en su pestaña (pendientes, sin leer, activas) */}
            <div className="simar-aparece grid grid-cols-3 gap-2.5 sm:gap-4 movil:hidden" style={{ animationDelay: '0.06s' }}>
                <TarjetaDato apilada etiqueta="Asociaciones activas" valor={stats.empresas} icono={Building2} tono="arrecife" />
                <TarjetaDato apilada etiqueta="Solicitudes pendientes" valor={stats.pendientes} icono={Inbox} tono={stats.pendientes > 0 ? 'coral' : 'neutro'} />
                <TarjetaDato apilada etiqueta="Mensajes sin leer" valor={stats.noLeidos} icono={MessageSquare} tono={stats.noLeidos > 0 ? 'coral' : 'neutro'} />
            </div>

            {/* Tabs */}
            <div className="bg-simar-superficie border border-simar-borde rounded-2xl p-1.5 shadow-simar movil:p-1">
                {/* En celular, las cuatro secciones en una sola fila (ícono arriba, palabra abajo y su número
                    en la esquina): todas a la vista, sin deslizar */}
                <nav aria-label="Secciones de asociaciones" className="grid grid-cols-2 sm:flex gap-1 movil:grid-cols-4">
                    {tabs.map((t) => {
                        const active = tab === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => setTab(t.value)}
                                aria-current={active ? 'page' : undefined}
                                className={`relative sm:flex-1 min-w-0 sm:min-w-fit whitespace-nowrap min-h-[52px] px-3 sm:px-5 text-[17px] sm:text-lg font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-2 movil:flex-col movil:gap-1 movil:min-h-[60px] movil:px-1 movil:text-[12.5px] movil:rounded-[16px] ${
                                    active
                                        ? 'bg-simar-marea text-white shadow-simar'
                                        : 'text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto'
                                }`}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                                {t.conteo !== undefined && (
                                    <span
                                        title={`${t.conteo.valor} ${t.conteo.texto}`}
                                        aria-label={`${t.conteo.valor} ${t.conteo.texto}`}
                                        className={`hidden movil:inline-flex absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold items-center justify-center ${
                                            active ? 'bg-white/25 text-white' : 'bg-simar-papel text-simar-texto-2'
                                        }`}
                                    >
                                        {t.conteo.valor}
                                    </span>
                                )}
                                {t.badge ? (
                                    <span className={`text-[13px] px-1.5 h-[22px] rounded-full font-bold min-w-[22px] inline-flex items-center justify-center movil:absolute movil:top-1 movil:right-1 movil:h-[18px] movil:min-w-[18px] movil:px-1 movil:text-[11px] ${
                                        active ? 'bg-white/25 text-white' : 'bg-[#A63F0E] text-white'
                                    }`}>
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
                {tab === 'solicitudes' && <SolicitudesTab onAbrirChat={abrirChat} onCambio={cargarStats} />}
                {tab === 'empresas' && <EmpresasTab onAbrirChat={abrirChat} onCambio={cargarStats} />}
                {tab === 'chat' && <ChatTab asociacionIdInicial={asociacionChat} onCambio={cargarStats} />}
            </div>
        </div>
    );
}
