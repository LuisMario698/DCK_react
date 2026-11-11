import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { ProgresoLectura } from './ProgresoLectura';
import { BotonAjustesLectura, GotaLectura } from './PanelLectura';
import { IslaDinamica, RanuraActividad } from '@/components/isla/IslaDinamica';
import { TituloAlLeer } from './TituloAlLeer';
import { VidrioVivo } from '@/components/isla/VidrioVivo';

/**
 * Barra de arriba de /noticias: el logo lleva al inicio (la landing Actual, que es la que enlaza
 * aquí desde «Lo último del mar») y, en un artículo, «Todas las noticias» regresa a la página de
 * Noticias. Abajo de la barra, una línea dice cuánto falta de leer. A la derecha, «Lectura» (los
 * ajustes de accesibilidad: PanelLectura) y el tema. En una nota, al bajar, su título aparece en
 * la barra (TituloAlLeer).
 * La barra es la isla dinámica del portal (components/isla/IslaDinamica.tsx): «Lectura» cae de su
 * botón como una gota y, en una nota, el reproductor de «Escuchar» pone su cápsula en la isla
 * (RanuraActividad) y su panel en la gota «lector».
 */
export function EncabezadoNoticias({
    locale,
    enArticulo = false,
    nota,
    children,
}: {
    locale: string;
    enArticulo?: boolean;
    /** En una nota: su tema y título, para mostrarlos en la barra al bajar */
    nota?: { tema: string; titulo: string };
    children?: ReactNode;
}) {
    const inicio = `/${locale}`;
    return (
        <header className="sticky top-0 z-40 px-3 pt-3 md:px-8 md:pt-5">
            {/* La luz de los botones de vidrio sigue al cursor (data-vidrio) */}
            <VidrioVivo />
            <IslaDinamica
                etiqueta="Principal"
                radio={26}
                // Con secciones (la página de Noticias), la isla llega compacta y se alarga para sacarlas
                className={children ? 'isla-con-fila' : ''}
                gotas={[
                    { id: 'lectura', etiqueta: 'Ajustes de lectura', ancho: 400, contenido: <GotaLectura /> },
                    ...(enArticulo ? [{ id: 'lector', etiqueta: 'Lectura en voz alta', ancho: 460, libre: true }] : []),
                ]}
            >
                <div className="h-[68px] md:h-[76px] pl-3 md:pl-5 pr-2 md:pr-3 flex items-center gap-3 movil:h-[60px] movil:pl-2.5">
                    <Link href={inicio} className="flex items-center rounded-2xl" aria-label="SiMAR - Inicio">
                        <LogoSimar variante="simbolo" tamano={40} className="sm:hidden" />
                        <LogoSimar tamano={44} className="hidden sm:inline-flex" />
                    </Link>
                    {nota ? <TituloAlLeer tema={nota.tema} titulo={nota.titulo} /> : null}
                    <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 md:gap-2">
                        {/* La cápsula viva de una actividad (el reproductor), si hay */}
                        <RanuraActividad />
                        <Link
                            href={enArticulo ? `/${locale}/noticias` : inicio}
                            data-vidrio="claro"
                            className="min-h-[52px] px-4 md:px-5 rounded-full inline-flex items-center gap-2 text-[17px] font-bold text-simar-texto hover:bg-simar-texto/5 transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]"
                        >
                            <ArrowLeft aria-hidden="true" className="w-5 h-5" />
                            <span className="movil:hidden">{enArticulo ? 'Todas las noticias' : 'Volver al inicio'}</span>
                            {/* En celular, con una actividad en la isla, sólo la flecha (no cabe) */}
                            <span className="isla-volver-texto hidden movil:inline">{enArticulo ? 'Noticias' : 'Inicio'}</span>
                        </Link>
                        <BotonAjustesLectura ancla />
                        <BotonTemaIcono plano compacto vidrio className="movil:w-[46px] movil:h-[46px]" />
                    </div>
                </div>
                {/* En la página de Noticias, la fila de secciones (NavSecciones) */}
                {children}
                <ProgresoLectura />
            </IslaDinamica>
        </header>
    );
}
