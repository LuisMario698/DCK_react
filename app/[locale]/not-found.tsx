'use client';

import Link from 'next/link';
import { useTituloPestana } from '@/components/layout/useTituloPestana';
import { usePathname } from 'next/navigation';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { FondoSimar } from '@/components/layout/FondoSimar';
import { LogoSimar } from '@/components/layout/LogoSimar';

/** Página "no encontrada" dentro de /es o /en, con el lenguaje de diseño SiMAR. */
export default function PaginaNoEncontrada() {
    useTituloPestana('Página no encontrada');
    const locale = usePathname().split('/')[1] || 'es';

    return (
        <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
            <FondoSimar />
            <section className="simar-ventana relative w-full max-w-xl text-center bg-simar-superficie border border-simar-borde shadow-simar rounded-[30px] p-7 sm:p-10">
                <LogoSimar variante="simbolo" tamano={72} />
                <p className="mt-4 text-lg font-bold text-simar-marea-tinta">Error 404</p>
                <h1 className="mt-1 text-[28px] md:text-[34px] font-extrabold leading-tight text-simar-texto">
                    No encontramos esta página
                </h1>
                <p className="mt-3 text-lg text-simar-texto-2">
                    Puede que el enlace esté mal escrito o que la página ya no exista. Desde aquí puedes volver a
                    un lugar conocido.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                    {/* El middleware manda a cada rol a su panel (o al acceso si no hay sesión) */}
                    <Link
                        href={`/${locale}/dashboard`}
                        className="simar-presiona min-h-[60px] px-7 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[19px] font-extrabold inline-flex items-center justify-center gap-2.5"
                    >
                        <LayoutGrid className="w-[22px] h-[22px]" strokeWidth={2} />
                        Ir a mi panel
                    </Link>
                    <Link
                        href={`/${locale}`}
                        className="simar-presiona min-h-[60px] px-6 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold inline-flex items-center justify-center gap-2.5 hover:border-simar-marea-tinta"
                    >
                        <ArrowLeft className="w-[22px] h-[22px]" strokeWidth={2} />
                        Volver al inicio
                    </Link>
                </div>
            </section>
        </main>
    );
}
