'use client';

import Link from 'next/link';
import { useTituloPestana } from '@/components/layout/useTituloPestana';
import { usePathname } from 'next/navigation';
import { CreditCard, Layers, LayoutDashboard, ScrollText, Settings2, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { useOcultarAlBajar } from '@/components/layout/useOcultarAlBajar';
import { useRefraccion } from '@/components/ui/vidrioLiquido';
import { EncabezadoPantalla } from '@/components/ui/simar';

const PANTALLAS: Record<string, { title: string; subtitle: string; icon: LucideIcon }> = {
    superadmin: { title: 'Resumen', subtitle: 'Estado general de cuentas, suscripciones e ingresos', icon: LayoutDashboard },
    cuentas: { title: 'Cuentas', subtitle: 'Usuarios, roles, suspensiones e invitaciones', icon: Users },
    suscripciones: { title: 'Suscripciones', subtitle: 'Planes contratados por las empresas y sus pagos', icon: CreditCard },
    planes: { title: 'Planes', subtitle: 'Catálogo de planes y precios (MXN)', icon: Layers },
    auditoria: { title: 'Auditoría', subtitle: 'Bitácora de cambios en la base de datos', icon: ScrollText },
    sistema: { title: 'Sistema', subtitle: 'Mantenimiento, avisos, reglas y uso de recursos', icon: Settings2 },
};

function usePantalla() {
    const segments = usePathname().split('/').filter(Boolean);
    const clave = segments[segments.length - 1] || 'superadmin';
    return { locale: segments[0] || 'es', meta: PANTALLAS[clave] ?? PANTALLAS.superadmin };
}

/**
 * Encabezado del superadmin. Escritorio: vidrio flotante con el título de la pantalla. Celular y
 * tableta: la píldora de cristal líquido del recinto con el logo, la marca "Superadmin" (para no
 * confundir este panel con los otros) y el tema; el título va en la pantalla (TituloPantallaSuperadmin)
 * y las secciones en la barra inferior.
 */
export function HeaderSuperadmin() {
    const { locale, meta } = usePantalla();
    // "Cuentas · SiMAR" en la pestaña
    useTituloPestana(meta.title);

    return (
        <>
            <EncabezadoMovil locale={locale} />
            <header className="hidden lg:block sticky top-3 z-30 mt-6">
                <div className="simar-vidrio relative rounded-3xl min-h-[74px] flex items-center justify-between gap-3 pl-4 pr-4">
                    <div className="min-w-0">
                        <h1 className="text-xl font-extrabold text-simar-texto leading-tight truncate">{meta.title}</h1>
                        <p className="text-[15px] text-simar-texto-2 truncate">{meta.subtitle}</p>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[15px] font-bold bg-simar-violeta-suave text-simar-violeta">
                        Sólo desarrollador
                    </span>
                </div>
            </header>
        </>
    );
}

function EncabezadoMovil({ locale }: { locale: string }) {
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
                className="simar-cristal rounded-full min-h-[56px] flex items-center justify-between gap-2 pl-4 pr-1.5"
            >
                <Link href={`/${locale}/superadmin`} aria-label="Ir al resumen" className="rounded-xl flex-shrink-0">
                    <LogoSimar tamano={38} />
                </Link>
                <div className="flex items-center gap-1 min-w-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-simar-violeta-suave text-simar-violeta text-[13px] font-bold whitespace-nowrap">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Superadmin
                    </span>
                    <BotonTemaIcono compacto plano />
                </div>
            </div>
        </header>
    );
}

/** Título de la pantalla en celular y tableta (en escritorio va en el encabezado), como en el recinto. */
export function TituloPantallaSuperadmin() {
    const { meta } = usePantalla();
    return (
        <div className="lg:hidden mb-5 movil:mb-3">
            <EncabezadoPantalla icono={meta.icon} titulo={meta.title} subtitulo={meta.subtitle} tono="violeta" />
        </div>
    );
}
