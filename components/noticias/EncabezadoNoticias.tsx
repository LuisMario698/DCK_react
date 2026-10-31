import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';

/**
 * Barra de arriba de /noticias: el logo lleva al inicio y "Noticias" a la lista. Mientras se
 * comparan las landings, el inicio es la versión 3D (?landing=3d), donde vive la sección.
 */
export function EncabezadoNoticias({ locale, enArticulo = false }: { locale: string; enArticulo?: boolean }) {
    const inicio = `/${locale}?landing=3d`;
    return (
        <header className="sticky top-0 z-40 px-3 pt-3 md:px-8 md:pt-5">
            <nav aria-label="Principal" className="simar-vidrio-fuerte relative rounded-[26px]">
                <div className="h-[68px] md:h-[76px] pl-3 md:pl-5 pr-2 md:pr-3 flex items-center gap-3 movil:h-[60px] movil:pl-2.5">
                    <Link href={inicio} className="flex items-center rounded-2xl" aria-label="SiMAR - Inicio">
                        <LogoSimar variante="simbolo" tamano={40} className="sm:hidden" />
                        <LogoSimar tamano={44} className="hidden sm:inline-flex" />
                    </Link>
                    <div className="ml-auto flex items-center gap-2">
                        <Link
                            href={enArticulo ? `/${locale}/noticias` : `${inicio}#noticias`}
                            className="min-h-[52px] px-4 md:px-5 rounded-full inline-flex items-center gap-2 text-[17px] font-bold text-simar-texto hover:bg-simar-texto/5 transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            {enArticulo ? 'Todas las noticias' : 'Volver al inicio'}
                        </Link>
                        <BotonTemaIcono className="movil:w-[46px] movil:h-[46px] movil:rounded-[15px]" />
                    </div>
                </div>
            </nav>
        </header>
    );
}
