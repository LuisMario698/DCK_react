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
    ShieldCheck,
    Users,
    X,
} from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { EnlacesPaneles } from './EnlacesPaneles';

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

    const itemCls = (active: boolean) => `
        group flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg transition-all duration-200
        ${active
            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }
    `;

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm" onClick={onClose} />}

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
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">SiMAR</span>
                                <span className="text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400 font-semibold">Superadmin</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white" aria-label="Cerrar menú">
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
                                    aria-current={active ? 'page' : undefined}
                                    className={itemCls(active)}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'scale-110' : ''} transition-transform`} />
                                    {!isCollapsed && <span className="ml-3 text-sm flex-1">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="px-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <EnlacesPaneles actual="superadmin" colapsado={isCollapsed} onNavegar={onClose} />
                    </div>
                </div>

                <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2`}>
                        <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm border border-violet-200 dark:border-violet-800 flex-shrink-0">
                            {(user?.user_metadata?.full_name || user?.email || 'S').charAt(0).toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate text-gray-900 dark:text-white">
                                    {user?.user_metadata?.full_name || 'Superadministrador'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</span>
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
