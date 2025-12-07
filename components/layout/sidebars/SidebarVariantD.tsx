'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/ui/Icons';
import { useSidebar } from '../SidebarContext';

export function SidebarVariantD() {
    const t = useTranslations('Sidebar');
    const pathname = usePathname();
    const { isOpen, closeSidebar, isCollapsed, toggleCollapse } = useSidebar();

    const locale = pathname.split('/')[1] || 'es';

    const menuItems = [
        { label: t('menu.panel'), href: `/${locale}/dashboard`, icon: 'Dashboard' },
        { label: t('menu.personas'), href: `/${locale}/dashboard/personas`, icon: 'Users' },
        { label: t('menu.embarcaciones'), href: `/${locale}/dashboard/embarcaciones`, icon: 'Ship' },
        { label: t('menu.manifiesto'), href: `/${locale}/dashboard/manifiesto`, icon: 'Document' },
        { label: t('menu.manifiestoBasuron'), href: `/${locale}/dashboard/manifiesto-basuron`, icon: 'Recycle' },
    ];

    const externosItems = [
        { label: t('externos.asociaciones'), href: `/${locale}/dashboard/asociaciones`, icon: 'Building' },
    ];

    const isActive = (href: string) => pathname === href;

    const IconComponent = (iconName: string) => {
        const Icon = Icons[iconName as keyof typeof Icons];
        return Icon ? <Icon /> : null;
    };

    return (
        <aside
            className={`
        fixed inset-y-0 left-0 
        h-full
        ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}
        bg-slate-900 border-r border-slate-800
        z-50 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-xl
        flex flex-col
      `}
        >
            {/* Header */}
            <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-800 bg-slate-950/50`}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
                        <Icons.Ship className="w-5 h-5" />
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-lg font-bold text-white tracking-wide truncate">
                            CIAD<span className="text-blue-500">.Panel</span>
                        </h1>
                    )}
                </div>
                {!isCollapsed && (
                    <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                <nav className="px-3 space-y-6">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  group flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-3 rounded-lg transition-all duration-200
                  ${isActive(item.href)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                                    }
                `}
                                title={isCollapsed ? item.label : ''}
                            >
                                <div className={`flex-shrink-0 transition-transform duration-200 ${!isCollapsed && isActive(item.href) ? 'scale-110' : ''}`}>
                                    {IconComponent(item.icon)}
                                </div>
                                {!isCollapsed && (
                                    <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                                )}

                                {/* Tooltip for collapsed mode */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap border border-slate-700">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="space-y-1">
                        {!isCollapsed && <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Externos</p>}
                        {externosItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  group flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-3 rounded-lg transition-all duration-200
                  ${isActive(item.href)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                                    }
                `}
                                title={isCollapsed ? item.label : ''}
                            >
                                <div className="flex-shrink-0">
                                    {IconComponent(item.icon)}
                                </div>
                                {!isCollapsed && (
                                    <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                                )}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap border border-slate-700">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </nav>
            </div>

            {/* Footer / Collapse Toggle */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <button
                    onClick={toggleCollapse}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-center w-full gap-2'} p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors`}
                >
                    <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    {!isCollapsed && <span className="text-xs font-semibold uppercase">Colapsar</span>}
                </button>
            </div>
        </aside>
    );
}
