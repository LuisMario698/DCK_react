'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ClipboardList, Ellipsis, LayoutGrid, Map as MapIcon, MessageSquare, ShieldCheck, Unlink } from 'lucide-react';
import { BarraInferior } from '@/components/layout/BarraInferior';
import { SidebarRecolector } from '@/components/recolector/SidebarRecolector';
import { HeaderRecolector, TituloPantallaRecolector } from '@/components/recolector/HeaderRecolector';
import { HojaMasRecolector } from '@/components/recolector/HojaMasRecolector';
import { RecolectorProvider, useRecolector } from '@/components/recolector/RecolectorContext';
import { AvisoGlobal } from '@/components/layout/AvisoGlobal';
import { FondoSimar } from '@/components/layout/FondoSimar';
import { ESTADO_SUSCRIPCION_LABEL } from '@/lib/constants/suscripciones';
import { ESTADO_EMPRESA_LABEL } from '@/lib/constants/empresas';
import { AvisoVencimiento } from '@/components/recolector/MiSuscripcion';

export default function DashboardRecolectorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hojaAbierta, setHojaAbierta] = useState(false);

    // La hoja "Más" se cierra sola al llegar a otra pantalla (también con el botón de atrás)
    const [rutaHoja, setRutaHoja] = useState(pathname);
    if (rutaHoja !== pathname) {
        setRutaHoja(pathname);
        setHojaAbierta(false);
    }

    return (
        <RecolectorProvider>
            {/* simar-compacto: en celular el portal usa la misma escala compacta que el recinto (ver DISEÑO_SIMAR.md) */}
            <div className="simar-compacto min-h-screen bg-simar-papel">
                <FondoSimar />
                <SidebarRecolector isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed((c) => !c)} />
                <div className={`relative flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0 lg:pl-[120px]' : 'pl-0 lg:pl-[308px]'}`}>
                    <HeaderRecolector />
                    {/* Abajo deja lugar a la barra inferior flotante (y a la zona segura del teléfono) */}
                    <main className="flex-1 px-3.5 pt-3 pb-[calc(100px+env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 md:px-6 md:pt-6 lg:py-8 lg:pr-10 lg:pl-8">
                        <AvisoGlobal />
                        <AvisoSuperadmin />
                        <AvisoEstado />
                        <AvisoVencimiento />
                        {/* Cada pantalla entra con un fundido corto (simar-pagina). overflow-x-clip y no hidden:
                            hidden lo vuelve contenedor de desplazamiento (DISEÑO_SIMAR.md → "Cuidado") */}
                        <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-clip">
                            <TituloPantallaRecolector />
                            <Contenido>{children}</Contenido>
                        </div>
                    </main>
                </div>
                <BarraPortal hojaAbierta={hojaAbierta} onAbrirHoja={() => setHojaAbierta(true)} />
                <HojaMasRecolector abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)} />
            </div>
        </RecolectorProvider>
    );
}

/**
 * Barra inferior del portal (celular y tableta), como la del recinto: las cuatro tareas del día y
 * "Más" para lo demás (hoja inferior). Los mensajes sin leer van en su botón.
 */
function BarraPortal({ hojaAbierta, onAbrirHoja }: { hojaAbierta: boolean; onAbrirHoja: () => void }) {
    const pathname = usePathname();
    const { mensajesNoLeidos } = useRecolector();
    const base = `/${pathname.split('/')[1] || 'es'}/dashboard-recolector`;
    const items = [
        { label: 'Inicio', href: base, icon: LayoutGrid, activo: pathname === base || pathname === `${base}/` },
        { label: 'Residuos', href: `${base}/mapa`, icon: MapIcon, activo: pathname.startsWith(`${base}/mapa`) },
        { label: 'Solicitudes', href: `${base}/solicitudes`, icon: ClipboardList, activo: pathname.startsWith(`${base}/solicitudes`) },
        { label: 'Mensajes', href: `${base}/mensajes`, icon: MessageSquare, activo: pathname.startsWith(`${base}/mensajes`), contador: mensajesNoLeidos },
    ];
    return (
        <BarraInferior items={items} onAbrirMenu={onAbrirHoja} etiquetaMenu="Más" iconoMenu={Ellipsis} menuAbierto={hojaAbierta} />
    );
}

/** Sin asociación vinculada no hay nada que mostrar (las páginas filtran por ella). */
function Contenido({ children }: { children: React.ReactNode }) {
    const { cargando, asociacion } = useRecolector();
    if (cargando || asociacion) return <>{children}</>;
    return (
        <div className="simar-aparece max-w-lg mx-auto mt-10 sm:mt-16 text-center bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-7 sm:p-9">
            <div className="mx-auto w-16 h-16 rounded-full bg-simar-coral-suave text-simar-coral flex items-center justify-center mb-5">
                <Unlink className="w-8 h-8" />
            </div>
            <p className="text-[22px] font-extrabold text-simar-texto leading-tight">Tu usuario no está vinculado a una empresa</p>
            <p className="text-lg text-simar-texto-2 mt-3">
                Pide al centro de acopio de Puerto Peñasco que vincule tu correo a tu empresa desde el módulo de Empresas.
            </p>
        </div>
    );
}

/** El superadmin usa el portal a nombre de su asociación: se le recuerda siempre. */
function AvisoSuperadmin() {
    const { esSuperadmin, asociacion } = useRecolector();
    const locale = usePathname().split('/')[1] || 'es';
    if (!esSuperadmin || !asociacion) return null;
    // En celular, en tres renglones: quién eres, a nombre de quién, y los dos enlaces en una fila
    return (
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-simar-violeta-suave px-5 py-4 text-base text-simar-texto movil:mb-3 movil:px-3.5 movil:py-2.5 movil:gap-x-2.5 movil:gap-y-0.5 movil:text-[14px] movil:leading-snug">
            <ShieldCheck className="w-6 h-6 flex-shrink-0 text-simar-violeta movil:w-5 movil:h-5 movil:self-start movil:mt-0.5" />
            <p className="flex-1 min-w-[220px] movil:min-w-0">
                <strong>Modo superadmin:</strong> usas el portal como <strong>{asociacion.nombre_asociacion}</strong>.
                <span className="movil:hidden"> Las solicitudes y mensajes que envíes quedan a nombre de esta empresa.</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base font-bold text-simar-violeta movil:basis-full movil:pl-[30px] movil:text-[14px]">
                <Link href={`/${locale}/superadmin?elegir_asociacion=1`} className="min-h-[44px] inline-flex items-center underline-offset-4 hover:underline">
                    Cambiar empresa
                </Link>
                <Link href={`/${locale}/superadmin`} className="min-h-[44px] inline-flex items-center underline-offset-4 hover:underline">
                    <span className="movil:hidden">Volver al panel de superadmin</span>
                    <span className="hidden movil:inline">Volver a superadmin</span>
                </Link>
            </div>
        </div>
    );
}

function AvisoEstado() {
    const { asociacion, motivoBloqueo, suscripcion } = useRecolector();
    if (!motivoBloqueo || !asociacion) return null;
    return (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-simar-coral-suave p-5 text-base text-simar-texto movil:mb-3 movil:p-3.5 movil:gap-2.5 movil:text-[14px] movil:leading-snug">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-simar-coral movil:w-5 movil:h-5" />
            {motivoBloqueo === 'asociacion' ? (
                <p>
                    Tu empresa está <strong>{ESTADO_EMPRESA_LABEL[asociacion.estado].toLowerCase()}</strong>. Puedes consultar tu historial y
                    escribir al centro de acopio, pero no crear nuevas solicitudes de recolección.
                </p>
            ) : (
                <p>
                    {suscripcion?.estado ? (
                        <>
                            La suscripción de tu empresa está{' '}
                            <strong>{ESTADO_SUSCRIPCION_LABEL[suscripcion.estado].toLowerCase()}</strong>.
                        </>
                    ) : (
                        'Tu empresa no tiene una suscripción activa.'
                    )}{' '}
                    Puedes consultar tu historial y escribir al centro de acopio, pero no crear nuevas solicitudes hasta
                    renovarla.
                </p>
            )}
        </div>
    );
}
