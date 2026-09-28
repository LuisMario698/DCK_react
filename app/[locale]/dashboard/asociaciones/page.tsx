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

    const tabs: { value: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { value: 'solicitudes', label: 'Solicitudes', icon: <Inbox className="w-5 h-5" />, badge: stats.pendientes },
        { value: 'inventario', label: 'Inventario', icon: <Package className="w-5 h-5" /> },
        { value: 'empresas', label: 'Asociaciones', icon: <Building2 className="w-5 h-5" /> },
        { value: 'chat', label: 'Mensajes', icon: <MessageSquare className="w-5 h-5" />, badge: stats.noLeidos },
    ];

    const abrirChat = (asociacionId: number) => {
        setAsociacionChat(asociacionId);
        setTab('chat');
    };

    return (
        <div className="max-w-[1600px] space-y-6">
            {/* Lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
            <EncabezadoPantalla
                icono={Building2}
                titulo="Asociaciones recolectoras"
                subtitulo="Publica residuos, gestiona solicitudes y comunícate con las empresas."
            />

            {/* Conteos (en celular, los tres en una fila con tarjetas apiladas) */}
            <div className="simar-aparece grid grid-cols-3 gap-2.5 sm:gap-4" style={{ animationDelay: '0.06s' }}>
                <TarjetaDato apilada etiqueta="Asociaciones activas" valor={stats.empresas} icono={Building2} tono="arrecife" />
                <TarjetaDato apilada etiqueta="Solicitudes pendientes" valor={stats.pendientes} icono={Inbox} tono={stats.pendientes > 0 ? 'coral' : 'neutro'} />
                <TarjetaDato apilada etiqueta="Mensajes sin leer" valor={stats.noLeidos} icono={MessageSquare} tono={stats.noLeidos > 0 ? 'coral' : 'neutro'} />
            </div>

            {/* Tabs */}
            <div className="bg-simar-superficie border border-simar-borde rounded-2xl p-1.5 shadow-simar">
                {/* En celular, las cuatro secciones en una cuadrícula de 2 × 2: todas a la vista, sin deslizar */}
                <nav aria-label="Secciones de asociaciones" className="grid grid-cols-2 sm:flex gap-1">
                    {tabs.map((t) => {
                        const active = tab === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => setTab(t.value)}
                                aria-current={active ? 'page' : undefined}
                                className={`relative sm:flex-1 min-w-0 sm:min-w-fit whitespace-nowrap min-h-[52px] px-3 sm:px-5 text-[17px] sm:text-lg font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-2 ${
                                    active
                                        ? 'bg-simar-marea text-white shadow-simar'
                                        : 'text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto'
                                }`}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                                {t.badge ? (
                                    <span className={`text-[13px] px-1.5 h-[22px] rounded-full font-bold min-w-[22px] inline-flex items-center justify-center ${
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
