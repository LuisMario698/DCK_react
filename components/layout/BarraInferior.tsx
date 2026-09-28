'use client';

import Link from 'next/link';
import { Menu, type LucideIcon } from 'lucide-react';
import { LineaMarea } from './LineaMarea';

export interface ItemBarraInferior {
    label: string;
    href: string;
    icon: LucideIcon;
    activo: boolean;
    /** Contador (mensajes, pendientes). Se muestra con número, nunca sólo un punto. */
    contador?: number;
}

/**
 * Barra de navegación inferior para celular y tableta (se oculta desde 1024 px, donde está el menú
 * lateral). Tres secciones principales con ícono y palabra, más "Menú", que abre el menú lateral
 * completo. Botones de 64 px, al alcance del pulgar. La sección activa lleva la línea de marea.
 * Ver DISEÑO_SIMAR.md → "Versión móvil".
 */
export function BarraInferior({
    items,
    onAbrirMenu,
    contadorMenu = 0,
}: {
    items: ItemBarraInferior[];
    onAbrirMenu: () => void;
    /** Pendientes que viven en secciones del menú (p. ej. mensajes sin leer) */
    contadorMenu?: number;
}) {
    return (
        <nav
            aria-label="Navegación principal"
            className="simar-barra-inferior simar-vidrio-fuerte lg:hidden fixed inset-x-0 bottom-0 z-30 rounded-t-[26px] !border-b-0 px-1.5 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]"
        >
            {/* Pegada al borde como una barra de pestañas: así cada botón tiene todo el ancho posible */}
            <div className="relative grid grid-cols-4 gap-0.5 max-w-xl mx-auto">
                {items.map((item) => {
                    const Icono = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={item.activo ? 'page' : undefined}
                            className={`simar-presiona relative min-h-[64px] rounded-[20px] flex flex-col items-center justify-center gap-0.5 px-0.5 ${
                                item.activo
                                    ? 'bg-simar-superficie text-simar-texto shadow-[0_4px_14px_-8px_rgba(11,34,54,0.35)]'
                                    : 'text-simar-texto-2 hover:bg-white/50 dark:hover:bg-white/5'
                            }`}
                        >
                            <span className="relative">
                                <Icono className={`w-6 h-6 ${item.activo ? 'text-simar-marea-tinta' : ''}`} strokeWidth={2} />
                                {!!item.contador && item.contador > 0 && <Contador valor={item.contador} />}
                            </span>
                            <span className={`relative text-[15px] leading-tight whitespace-nowrap ${item.activo ? 'font-extrabold' : 'font-bold'}`}>
                                {item.label}
                                {item.activo && <LineaMarea key={item.href} className="absolute left-1/2 -translate-x-1/2 -bottom-[7px]" />}
                            </span>
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={onAbrirMenu}
                    className="simar-presiona relative min-h-[64px] rounded-[20px] flex flex-col items-center justify-center gap-0.5 text-simar-texto-2 hover:bg-white/50 dark:hover:bg-white/5"
                    aria-label={contadorMenu > 0 ? `Abrir menú (${contadorMenu} pendientes)` : 'Abrir menú'}
                >
                    <span className="relative">
                        <Menu className="w-6 h-6" strokeWidth={2} />
                        {contadorMenu > 0 && <Contador valor={contadorMenu} />}
                    </span>
                    <span className="text-[15px] font-bold leading-tight">Menú</span>
                </button>
            </div>
        </nav>
    );
}

function Contador({ valor }: { valor: number }) {
    return (
        <span className="absolute -top-2 -right-3 min-w-[22px] h-[22px] px-1 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold flex items-center justify-center">
            {valor > 9 ? '9+' : valor}
        </span>
    );
}
