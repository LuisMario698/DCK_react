'use client';

import type { MouseEvent } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { usePathname } from 'next/navigation';

/** Centro del botón pulsado: de ahí se abre el tema nuevo (también con teclado). */
function centroDe(e: MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Botón flotante de tema (arriba a la derecha). Sólo aparece en las páginas sin menú lateral
 * (acceso pendiente, mantenimiento…): en los paneles el botón vive dentro del menú (BotonTema).
 */
export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();

    // Ocultar en landing page (/es o /en)
    if (pathname === '/es' || pathname === '/en' || pathname === '/') {
        return null;
    }
    // Paneles con menú lateral: el botón está en el menú
    if (pathname.includes('/dashboard') || pathname.includes('/superadmin')) {
        return null;
    }

    return (
        <button
            onClick={(e) => toggleTheme(centroDe(e))}
            className="simar-vidrio simar-presiona fixed top-4 right-4 lg:top-7 lg:right-8 z-[100] w-14 h-14 rounded-full text-simar-texto flex items-center justify-center"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
            {theme === 'dark' ? <Sun className="w-6 h-6" strokeWidth={2} /> : <Moon className="w-6 h-6" strokeWidth={2} />}
        </button>
    );
}

/** Botón de tema redondo, sólo ícono (barra de la landing). Lleva aria-label y title. */
export function BotonTemaIcono({ className = '', compacto = false }: { className?: string; compacto?: boolean }) {
    const { theme, toggleTheme } = useTheme();
    const oscuro = theme === 'dark';
    return (
        <button
            onClick={(e) => toggleTheme(centroDe(e))}
            aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={oscuro ? 'Modo claro' : 'Modo oscuro'}
            className={`simar-presiona ${compacto ? 'w-[52px] h-[52px]' : 'w-[54px] h-[54px] md:w-[58px] md:h-[58px]'} flex-shrink-0 rounded-[18px] border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 ${className}`}
        >
            {oscuro ? <Sun className="w-6 h-6" strokeWidth={2} /> : <Moon className="w-6 h-6" strokeWidth={2} />}
        </button>
    );
}

/** Botón de tema para el pie del menú lateral (ver DISEÑO_SIMAR.md → Menú lateral). */
export function BotonTema({ colapsado = false }: { colapsado?: boolean }) {
    const { theme, toggleTheme } = useTheme();
    const oscuro = theme === 'dark';

    return (
        <button
            onClick={(e) => toggleTheme(centroDe(e))}
            aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={colapsado ? (oscuro ? 'Modo claro' : 'Modo oscuro') : ''}
            className="simar-presiona flex-1 min-h-[52px] rounded-2xl border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto text-[17px] font-bold flex items-center justify-center gap-2.5 hover:bg-white/80 dark:hover:bg-white/10"
        >
            {oscuro ? <Sun className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2} /> : <Moon className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2} />}
            <span className={colapsado ? 'lg:hidden' : ''}>{oscuro ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
    );
}
