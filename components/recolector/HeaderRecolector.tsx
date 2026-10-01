'use client';

import Link from 'next/link';
import { useTituloPestana } from '@/components/layout/useTituloPestana';
import { Bell, ClipboardList, History, LayoutGrid, Leaf, Map as MapIcon, MessageSquare, UserCircle, type LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRecolector } from './RecolectorContext';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { useOcultarAlBajar } from '@/components/layout/useOcultarAlBajar';
import { useRefraccion } from '@/components/ui/vidrioLiquido';
import { EncabezadoPantalla } from '@/components/ui/simar';

const PANTALLAS: Record<string, { title: string; subtitle: string; icon: LucideIcon }> = {
    'dashboard-recolector': { title: 'Inicio', subtitle: 'Resumen de tu actividad', icon: LayoutGrid },
    mapa: { title: 'Residuos disponibles', subtitle: 'Inventario publicado por el centro de acopio', icon: MapIcon },
    solicitudes: { title: 'Mis solicitudes', subtitle: 'Estado de tus recolecciones', icon: ClipboardList },
    historial: { title: 'Historial', subtitle: 'Recolecciones completadas y comprobantes', icon: History },
    impacto: { title: 'Impacto ambiental', subtitle: 'Tu contribución al reciclaje', icon: Leaf },
    mensajes: { title: 'Mensajes', subtitle: 'Conversación con el centro de acopio', icon: MessageSquare },
    perfil: { title: 'Perfil', subtitle: 'Datos de tu empresa', icon: UserCircle },
    notificaciones: { title: 'Notificaciones', subtitle: 'Actividad reciente', icon: Bell },
};

function usePantalla() {
    const segments = usePathname().split('/').filter(Boolean);
    const clave = segments[segments.length - 1] || 'dashboard-recolector';
    return {
        locale: segments[0] || 'es',
        clave: PANTALLAS[clave] ? clave : 'dashboard-recolector',
        meta: PANTALLAS[clave] ?? PANTALLAS['dashboard-recolector'],
    };
}

/**
 * Encabezado del portal de empresas. Escritorio: vidrio flotante con el título de la pantalla, el
 * tema y la campana (ver DISEÑO_SIMAR.md). Celular y tableta: la píldora de cristal líquido del
 * recinto (logo, tema y campana) que se esconde al bajar; el título va en la pantalla
 * (TituloPantallaRecolector) y las secciones en la barra inferior.
 */
export function HeaderRecolector() {
    const { locale, meta } = usePantalla();
    const { notificacionesNoLeidas, asociacion } = useRecolector();
    // "Mis solicitudes · SiMAR" en la pestaña
    useTituloPestana(meta.title);

    return (
        <>
            <EncabezadoMovil locale={locale} notificaciones={notificacionesNoLeidas} />
            <header className="hidden lg:block sticky top-3 z-30 mt-6">
                <div className="simar-vidrio relative rounded-3xl min-h-[74px] flex items-center justify-between gap-3 pl-4 pr-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-extrabold text-simar-texto leading-tight truncate">{meta.title}</h1>
                        <p className="text-[15px] text-simar-texto-2 truncate">{meta.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {asociacion && (
                            <span className="text-[17px] font-bold text-simar-texto truncate max-w-[260px]">
                                {asociacion.nombre_asociacion}
                            </span>
                        )}
                        <Link
                            href={`/${locale}/dashboard-recolector/notificaciones`}
                            className="relative w-[52px] h-[52px] rounded-2xl bg-white/60 dark:bg-white/10 text-simar-texto flex items-center justify-center"
                            aria-label={`Notificaciones${notificacionesNoLeidas ? ` (${notificacionesNoLeidas} sin leer)` : ''}`}
                        >
                            <Bell className="w-6 h-6" />
                            {notificacionesNoLeidas > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold flex items-center justify-center">
                                    {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>
        </>
    );
}

/** Celular y tableta: igual que el Header del recinto, con la campana en lugar del perfil. */
function EncabezadoMovil({ locale, notificaciones }: { locale: string; notificaciones: number }) {
    const [oculto, setOculto] = useOcultarAlBajar();
    const [refCristal, cristal] = useRefraccion<HTMLDivElement>({ radio: 999, bisel: 12, fuerza: 20, desenfoque: 4 });

    return (
        <header
            data-oculto={oculto}
            // Con teclado el encabezado vuelve a verse al recibir el foco
            onFocusCapture={() => setOculto(false)}
            className="simar-encabezado-movil lg:hidden sticky top-2 z-30 mx-3 mt-2 md:mx-6 md:top-3 md:mt-3"
        >
            {cristal.filtro}
            <div
                ref={refCristal}
                style={cristal.estilo}
                data-refraccion={cristal.activo || undefined}
                className="simar-cristal rounded-full min-h-[56px] flex items-center justify-between gap-3 pl-4 pr-1.5"
            >
                <Link href={`/${locale}/dashboard-recolector`} aria-label="Ir al inicio" className="rounded-xl">
                    <LogoSimar tamano={38} />
                </Link>
                <div className="flex items-center gap-1">
                    <BotonTemaIcono compacto plano />
                    <Link
                        href={`/${locale}/dashboard-recolector/notificaciones`}
                        aria-label={`Notificaciones${notificaciones ? ` (${notificaciones} sin leer)` : ''}`}
                        title="Notificaciones"
                        className="simar-presiona relative w-[52px] h-[52px] flex-shrink-0 rounded-full hover:bg-simar-texto/5 dark:hover:bg-white/10 text-simar-texto flex items-center justify-center"
                    >
                        <Bell className="w-6 h-6" />
                        {notificaciones > 0 && (
                            <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#A63F0E] text-white text-[12px] font-bold flex items-center justify-center ring-2 ring-simar-superficie">
                                {notificaciones > 9 ? '9+' : notificaciones}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}

/**
 * Título de la pantalla en celular y tableta (en escritorio va en el encabezado), con el mismo
 * formato que las pantallas del recinto (EncabezadoPantalla). Inicio ya tiene su saludo y en
 * Mensajes el chat ocupa la pantalla, así que ahí no se pone.
 */
export function TituloPantallaRecolector() {
    const { clave, meta } = usePantalla();
    if (clave === 'dashboard-recolector' || clave === 'mensajes') return null;
    return (
        <div className="lg:hidden mb-5 movil:mb-3">
            <EncabezadoPantalla icono={meta.icon} titulo={meta.title} subtitulo={meta.subtitle} tono={clave === 'impacto' ? 'arrecife' : 'marea'} />
        </div>
    );
}
