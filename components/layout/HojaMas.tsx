'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, ChevronRight, LogOut, Ship, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useSidebar } from './SidebarContext';
import { HojaInferior } from './HojaInferior';
import { BotonTema } from './ThemeToggle';
import { EnlacesPaneles } from '@/components/superadmin/EnlacesPaneles';

/**
 * Hoja "Más" del recinto (celular y tableta): lo que en escritorio vive en el menú lateral y
 * no cabe en la barra inferior. Perfil arriba, las otras secciones en mosaico, los accesos de
 * superadmin (si aplica) y al final tema y cerrar sesión.
 */
export function HojaMas() {
    const t = useTranslations('Sidebar');
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const { signOut, user } = useAuth();
    const { hojaAbierta, cerrarHoja, abrirPerfil } = useSidebar();

    const nombre = user?.user_metadata?.full_name || 'Usuario';
    const inicial = user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase();

    const secciones: { label: string; href: string; icon: LucideIcon; tono: string }[] = [
        { label: t('menu.personas'), href: `/${locale}/dashboard/personas`, icon: Users, tono: 'bg-simar-marea-suave text-simar-marea-tinta' },
        { label: t('menu.embarcaciones'), href: `/${locale}/dashboard/embarcaciones`, icon: Ship, tono: 'bg-simar-marea-suave text-simar-marea-tinta' },
        { label: t('externos.asociaciones'), href: `/${locale}/dashboard/asociaciones`, icon: Building2, tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta' },
    ];

    return (
        <HojaInferior abierto={hojaAbierta} onCerrar={cerrarHoja} etiqueta="Más opciones">
            {/* Perfil */}
            <button
                type="button"
                onClick={abrirPerfil}
                className="simar-presiona w-full flex items-center gap-3 rounded-[18px] bg-simar-papel p-3 text-left"
            >
                <span className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-simar-texto text-simar-superficie flex items-center justify-center text-lg font-bold">
                    {inicial}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold text-simar-texto truncate">{nombre}</span>
                    <span className="block text-[15px] text-simar-texto-2 truncate">Ver perfil</span>
                </span>
                <ChevronRight aria-hidden="true" className="w-6 h-6 flex-shrink-0 text-simar-texto-2" />
            </button>

            {/* Otras secciones en mosaico */}
            <p className="mt-5 mb-2.5 px-1 text-[15px] font-bold text-simar-texto-2">Otras secciones</p>
            <nav aria-label="Otras secciones" className="grid grid-cols-3 gap-2.5">
                {secciones.map((s) => {
                    const Icono = s.icon;
                    const activo = pathname === s.href;
                    return (
                        <Link
                            key={s.href}
                            href={s.href}
                            onClick={cerrarHoja}
                            aria-current={activo ? 'page' : undefined}
                            className={`simar-presiona min-h-[96px] rounded-[18px] border p-2.5 flex flex-col items-center justify-center gap-2 text-center ${
                                activo ? 'border-simar-marea-tinta bg-simar-marea-suave' : 'border-simar-borde bg-simar-superficie'
                            }`}
                        >
                            <span className={`w-11 h-11 rounded-full flex items-center justify-center ${s.tono}`}>
                                <Icono className="w-6 h-6" strokeWidth={2} />
                            </span>
                            <span className="text-[15px] font-bold leading-tight text-simar-texto">{s.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Accesos a los otros paneles (sólo superadmin; si no, no muestra nada) */}
            <div className="mt-4 empty:hidden">
                <EnlacesPaneles actual="recinto" colapsado={false} onNavegar={cerrarHoja} />
            </div>

            {/* Tema y salida */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
                <BotonTema />
                <button
                    type="button"
                    onClick={signOut}
                    className="simar-presiona min-h-[52px] rounded-2xl bg-simar-coral-suave text-simar-coral text-[17px] font-bold flex items-center justify-center gap-2.5"
                >
                    <LogOut className="w-[22px] h-[22px] flex-shrink-0" />
                    {t('menu.logout')}
                </button>
            </div>
        </HojaInferior>
    );
}
