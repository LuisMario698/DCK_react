'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    Map,
    ClipboardList,
    History,
    Leaf,
    UserCircle,
    Bell,
    Settings,
    LogOut,
    Recycle,
    ChevronsLeft,
    X,
} from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

interface SidebarRecolectorProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

export function SidebarRecolector({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarRecolectorProps) {
    const pathname = usePathname();
    const { signOut, user } = useAuth();
    const locale = pathname.split('/')[1] || 'es';
    const base = `/${locale}/dashboard-recolector`;

    const items = [
        { label: 'Inicio', href: base, icon: LayoutDashboard },
        { label: 'Mapa de puertos', href: `${base}/mapa`, icon: Map },
        { label: 'Mis solicitudes', href: `${base}/solicitudes`, icon: ClipboardList },
        { label: 'Historial', href: `${base}/historial`, icon: History },
        { label: 'Impacto ambiental', href: `${base}/impacto`, icon: Leaf },
        { label: 'Perfil', href: `${base}/perfil`, icon: UserCircle },
        { label: 'Notificaciones', href: `${base}/notificaciones`, icon: Bell },
        { label: 'Configuración', href: `${base}/configuracion`, icon: Settings },
    ];

    const isActive = (href: string) =>
        href === base ? pathname === base || pathname === `${base}/` : pathname.startsWith(href);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 h-full
                    ${isCollapsed ? 'w-20' : 'w-64'}
                    bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
                    z-50 transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    shadow-lg dark:shadow-gray-950/50
                    flex flex-col overflow-x-hidden
                `}
            >
                <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-5'} border-b border-gray-100 dark:border-gray-800`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                            <Recycle className="w-5 h-5" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">DCK</span>
                                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">Recolector</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <nav className="px-3 space-y-1">
                        {items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    title={isCollapsed ? item.label : ''}
                                    className={`
                                        group flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg transition-all duration-200
                                        ${active
                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'scale-110' : ''} transition-transform`} />
                                    {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2`}>
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                            {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate text-gray-900 dark:text-white">
                                    {user?.user_metadata?.full_name || 'Empresa'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'demo@ecorecicla.mx'}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={signOut}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'w-full gap-3 px-3'} py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
                        title={isCollapsed ? 'Cerrar sesión' : ''}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">Cerrar sesión</span>}
                    </button>

                    <button
                        onClick={onToggleCollapse}
                        className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center' : 'w-full gap-3 px-3'} py-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors`}
                    >
                        <ChevronsLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                        {!isCollapsed && <span className="text-xs font-semibold uppercase">Colapsar</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
