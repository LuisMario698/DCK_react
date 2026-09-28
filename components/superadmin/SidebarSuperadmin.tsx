'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronsLeft,
    CreditCard,
    Layers,
    LayoutDashboard,
    LogOut,
    ScrollText,
    Settings2,
    Users,
    X,
} from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { EnlacesPaneles } from './EnlacesPaneles';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTema } from '@/components/layout/ThemeToggle';
import { LineaMarea } from '@/components/layout/LineaMarea';

interface SidebarSuperadminProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

export function SidebarSuperadmin({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarSuperadminProps) {
    const pathname = usePathname();
    const { signOut, user } = useAuth();
    const locale = pathname.split('/')[1] || 'es';
    const base = `/${locale}/superadmin`;

    const items = [
        { label: 'Resumen', href: base, icon: LayoutDashboard },
        { label: 'Cuentas', href: `${base}/cuentas`, icon: Users },
        { label: 'Suscripciones', href: `${base}/suscripciones`, icon: CreditCard },
        { label: 'Planes', href: `${base}/planes`, icon: Layers },
        { label: 'Auditoría', href: `${base}/auditoria`, icon: ScrollText },
        { label: 'Sistema', href: `${base}/sistema`, icon: Settings2 },
    ];

    const isActive = (href: string) =>
        href === base ? pathname === base || pathname === `${base}/` : pathname.startsWith(href);

    return (
        <>
            {isOpen && <div className="simar-velo fixed inset-0 z-40 lg:hidden bg-[rgba(11,34,54,0.28)]" onClick={onClose} />}

            {/* Menú de vidrio flotante, igual que en el recinto y el portal (ver DISEÑO_SIMAR.md); violeta = superadmin */}
            <aside
                className={`
                    simar-vidrio fixed z-50 top-4 bottom-4 left-4 rounded-[30px]
                    w-[276px] ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[276px]'}
                    px-4 pt-6 pb-4 flex flex-col gap-5 overflow-x-hidden
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}
                `}
            >
                <div className={`relative flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''} px-2.5`}>
                    <LogoSimar variante="simbolo" tamano={46} />
                    <div className={`flex flex-col ${isCollapsed ? 'lg:hidden' : ''}`}>
                        <LogoSimar variante="nombre" tamano={46} />
                        <span className="mt-1 text-[15px] font-bold text-simar-violeta">Superadmin</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden absolute right-0 w-12 h-12 rounded-2xl bg-white/60 dark:bg-white/10 text-simar-texto flex items-center justify-center"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
                    <nav aria-label="Menú de superadmin" className="flex flex-col gap-1">
                        {items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    title={isCollapsed ? item.label : ''}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex items-center gap-3.5 min-h-[54px] rounded-2xl transition-colors ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'} ${active
                                        ? 'bg-simar-superficie text-simar-texto font-bold shadow-[0_4px_14px_-8px_rgba(11,34,54,0.3)]'
                                        : 'text-simar-texto-2 font-medium hover:bg-white/60 dark:hover:bg-white/5 hover:text-simar-texto'
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 flex-shrink-0 ${active ? 'text-simar-violeta' : ''}`} strokeWidth={2} />
                                    <span className={`relative text-lg leading-tight ${isCollapsed ? 'lg:hidden' : ''}`}>
                                        {item.label}
                                        {active && <LineaMarea />}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-4 empty:hidden">
                        <EnlacesPaneles actual="superadmin" colapsado={isCollapsed} onNavegar={onClose} />
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    <div className={`flex items-center gap-3 rounded-[18px] bg-simar-superficie p-2.5 ${isCollapsed ? 'lg:justify-center' : ''}`}>
                        <span className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-simar-violeta-suave text-simar-violeta flex items-center justify-center text-lg font-bold">
                            {(user?.user_metadata?.full_name || user?.email || 'S').charAt(0).toUpperCase()}
                        </span>
                        <span className={`min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
                            <span className="block text-[17px] font-bold text-simar-texto truncate">
                                {user?.user_metadata?.full_name || 'Superadministrador'}
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
                        className="w-full min-h-[52px] rounded-2xl border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto text-[17px] font-bold flex items-center justify-center gap-2.5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                        title={isCollapsed ? 'Cerrar sesión' : ''}
                    >
                        <LogOut className="w-[22px] h-[22px] flex-shrink-0" />
                        <span className={isCollapsed ? 'lg:hidden' : ''}>Cerrar sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
