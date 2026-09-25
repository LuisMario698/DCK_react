'use client';

import { useCallback, useEffect, useState } from 'react';
import { Package, Inbox, Building2, MessageSquare, Sparkles } from 'lucide-react';
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

    const tabs: { value: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { value: 'solicitudes', label: 'Solicitudes', icon: <Inbox className="w-[18px] h-[18px]" />, badge: stats.pendientes },
        { value: 'inventario', label: 'Inventario', icon: <Package className="w-[18px] h-[18px]" /> },
        { value: 'empresas', label: 'Asociaciones', icon: <Building2 className="w-[18px] h-[18px]" /> },
        { value: 'chat', label: 'Mensajes', icon: <MessageSquare className="w-[18px] h-[18px]" />, badge: stats.noLeidos },
    ];

    const abrirChat = (asociacionId: number) => {
        setAsociacionChat(asociacionId);
        setTab('chat');
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header compacto */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 sm:px-6 shadow-lg shadow-blue-600/15">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">
                                Asociaciones recolectoras
                            </h1>
                            <p className="text-xs text-blue-100/80 mt-0.5 hidden sm:block truncate">
                                Publica residuos, gestiona solicitudes y comunícate con las empresas.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <HeroStat label="Activas" value={stats.empresas.toString()} />
                        <HeroStat label="Pendientes" value={stats.pendientes.toString()} highlight={stats.pendientes > 0} />
                        <HeroStat label="Mensajes" value={stats.noLeidos.toString()} highlight={stats.noLeidos > 0} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm">
                <nav className="flex gap-0.5 overflow-x-auto">
                    {tabs.map((t) => {
                        const active = tab === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => setTab(t.value)}
                                className={`relative flex-1 min-w-fit whitespace-nowrap py-2 px-3 sm:px-4 text-sm font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-1.5 ${
                                    active
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                                {t.badge ? (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center ${
                                        active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'
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
            <div key={tab} className="animate-fade-in">
                {tab === 'inventario' && <InventarioTab />}
                {tab === 'solicitudes' && <SolicitudesTab onAbrirChat={abrirChat} onCambio={cargarStats} />}
                {tab === 'empresas' && <EmpresasTab onAbrirChat={abrirChat} onCambio={cargarStats} />}
                {tab === 'chat' && <ChatTab asociacionIdInicial={asociacionChat} onCambio={cargarStats} />}
            </div>
        </div>
    );
}

function HeroStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`relative px-3 py-1.5 rounded-lg backdrop-blur-sm border transition-all duration-200 text-center ${
            highlight
                ? 'bg-white/20 border-white/40'
                : 'bg-white/10 border-white/15'
        }`}>
            <p className="text-[10px] font-semibold text-blue-100/80 uppercase tracking-wider leading-none">{label}</p>
            <p className="text-lg font-bold text-white leading-tight mt-0.5">{value}</p>
            {highlight && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full">
                    <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
                </span>
            )}
        </div>
    );
}
