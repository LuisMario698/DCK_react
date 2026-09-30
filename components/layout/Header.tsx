'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSimar } from './LogoSimar';
import { BotonTemaIcono } from './ThemeToggle';
import { useAuth } from './AuthProvider';
import { useSidebar } from './SidebarContext';
import { useOcultarAlBajar } from './useOcultarAlBajar';
import { useRefraccion } from '@/components/ui/vidrioLiquido';
import { CampanaMovil } from './AvisosRecinto';

/**
 * Barra superior sólo en celular y tableta, en cristal líquido flotante (como la barra inferior):
 * el logo (lleva al Panel), el tema, los avisos y el perfil. Se esconde al bajar y vuelve al
 * subir. Las secciones están en la barra inferior.
 */
export function Header() {
    const locale = usePathname().split('/')[1] || 'es';
    const { user } = useAuth();
    const { abrirPerfil } = useSidebar();
    const [oculto, setOculto] = useOcultarAlBajar();
    const [refCristal, cristal] = useRefraccion<HTMLDivElement>({ radio: 999, bisel: 12, fuerza: 20, desenfoque: 4 });
    const inicial = user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase();

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
                <Link href={`/${locale}/dashboard`} aria-label="Ir al panel" className="rounded-xl">
                    <LogoSimar tamano={38} />
                </Link>
                <div className="flex items-center gap-1">
                    <BotonTemaIcono compacto plano />
                    <CampanaMovil />
                    <button
                        type="button"
                        onClick={abrirPerfil}
                        aria-label="Ver perfil"
                        title="Ver perfil"
                        className="simar-presiona w-[52px] h-[52px] flex-shrink-0 rounded-full bg-simar-texto text-simar-superficie text-lg font-bold flex items-center justify-center"
                    >
                        {inicial}
                    </button>
                </div>
            </div>
        </header>
    );
}
