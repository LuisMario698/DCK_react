'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid,
    Map,
    ClipboardList,
    History,
    Leaf,
    UserCircle,
    Bell,
    MessageSquare,
    LogOut,
    ChevronsLeft,
} from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { useRecolector } from './RecolectorContext';
import { EnlacesPaneles } from '@/components/superadmin/EnlacesPaneles';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTema } from '@/components/layout/ThemeToggle';
import { LineaMarea } from '@/components/layout/LineaMarea';

interface SidebarRecolectorProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

/**
 * Menú lateral del portal, sólo en escritorio (desde 1024 px). En celular y tableta las secciones
 * están en la barra inferior y la hoja "Más" (HojaMasRecolector), como en el recinto.
 */
export function SidebarRecolector({ isCollapsed, onToggleCollapse }: SidebarRecolectorProps) {
    const pathname = usePathname();
    const { signOut, user } = useAuth();
    const { asociacion, mensajesNoLeidos, notificacionesNoLeidas } = useRecolector();
    const locale = pathname.split('/')[1] || 'es';
    const base = `/${locale}/dashboard-recolector`;

    const items = [
        { label: 'Inicio', href: base, icon: LayoutGrid },
        { label: 'Residuos disponibles', href: `${base}/mapa`, icon: Map },
        { label: 'Mis solicitudes', href: `${base}/solicitudes`, icon: ClipboardList },
        { label: 'Historial', href: `${base}/historial`, icon: History },
        { label: 'Impacto ambiental', href: `${base}/impacto`, icon: Leaf },
        { label: 'Mensajes', href: `${base}/mensajes`, icon: MessageSquare, badge: mensajesNoLeidos },
        { label: 'Notificaciones', href: `${base}/notificaciones`, icon: Bell, badge: notificacionesNoLeidas },
        { label: 'Perfil', href: `${base}/perfil`, icon: UserCircle },
    ];

    const isActive = (href: string) =>
        href === base ? pathname === base || pathname === `${base}/` : pathname.startsWith(href);

    return (
            <aside
                className={`
                    simar-vidrio fixed z-50 top-4 bottom-4 left-4 rounded-[30px]
                    ${isCollapsed ? 'w-[88px]' : 'w-[276px]'}
                    px-4 pt-6 pb-4 hidden lg:flex flex-col gap-5 overflow-x-hidden
                    transition-all duration-300 ease-in-out
                `}
            >
                <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : ''} px-2.5`}>
                    <div className="rounded-xl">
                        <LogoSimar variante={isCollapsed ? 'simbolo' : 'horizontal'} tamano={46} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
                    <nav aria-label="Menú de la empresa" className="flex flex-col gap-1">
                        {items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    title={isCollapsed ? item.label : ''}
                                    className={`flex items-center gap-3.5 min-h-[54px] rounded-2xl transition-colors ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'} ${active
                                        ? 'bg-simar-superficie text-simar-texto font-bold shadow-[0_4px_14px_-8px_rgba(11,34,54,0.3)]'
                                        : 'text-simar-texto-2 font-medium hover:bg-white/60 dark:hover:bg-white/5 hover:text-simar-texto'
                                        }`}
                                >
                                    <span className="relative flex-shrink-0">
                                        <Icon className="w-6 h-6" strokeWidth={2} />
                                        {isCollapsed && !!item.badge && (
                                            <span className="hidden lg:block absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#A63F0E]" />
                                        )}
                                    </span>
                                    <span className={`relative flex-1 text-lg leading-tight ${isCollapsed ? 'lg:hidden' : ''}`}>
                                        {item.label}
                                        {active && <LineaMarea />}
                                    </span>
                                    {!!item.badge && (
                                        <span className={`min-w-[26px] h-[26px] px-1.5 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold flex items-center justify-center ${isCollapsed ? 'lg:hidden' : ''}`}>
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-4 empty:hidden">
                        <EnlacesPaneles actual="asociacion" colapsado={isCollapsed} />
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    <div className={`flex items-center gap-3 rounded-[18px] bg-simar-superficie p-2.5 ${isCollapsed ? 'lg:justify-center' : ''}`}>
                        <span className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-simar-texto text-simar-superficie flex items-center justify-center text-lg font-bold">
                            {(asociacion?.nombre_asociacion || user?.email || 'E').charAt(0).toUpperCase()}
                        </span>
                        <span className={`min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
                            <span className="block text-[17px] font-bold text-simar-texto truncate">
                                {asociacion?.nombre_asociacion || user?.user_metadata?.full_name || 'Empresa'}
                            </span>
                            <span className="block text-[15px] text-simar-texto-2 truncate">{user?.email}</span>
                        </span>
                    </div>

                    <div className={`flex gap-2 ${isCollapsed ? 'lg:flex-col' : ''}`}>
                        <BotonTema colapsado={isCollapsed} />
                        <button
                            onClick={onToggleCollapse}
                            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                            className="hidden lg:flex w-[52px] min-h-[52px] rounded-2xl border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 transition-colors flex-shrink-0 self-center"
                        >
                            <ChevronsLeft className={`w-[22px] h-[22px] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    <button
                        onClick={signOut}
                        title={isCollapsed ? 'Cerrar sesión' : ''}
                        className="w-full min-h-[52px] rounded-2xl border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto text-[17px] font-bold flex items-center justify-center gap-2.5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                    >
                        <LogOut className="w-[22px] h-[22px] flex-shrink-0" />
                        <span className={isCollapsed ? 'lg:hidden' : ''}>Cerrar sesión</span>
                    </button>
                </div>
            </aside>
    );
}
