'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/ui/Icons';
import { useSidebar } from './SidebarContext';

export function Sidebar() {
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
    <>
      {/* Overlay invisible para cerrar al hacer clic fuera (solo móvil) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 
          h-full
          ${isCollapsed ? 'w-20' : 'w-64'}
          bg-white border-r border-gray-200
          z-50 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-lg
          flex flex-col
          overflow-x-hidden
        `}
      >
        {/* Header */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-gray-100 bg-white`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Icons.Ship className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <h1 className="text-lg font-bold text-gray-800 tracking-wide truncate">
                CIAD<span className="text-blue-600">.Panel</span>
              </h1>
            )}
          </div>
          {/* Botón cerrar solo visible en móvil */}
          <button onClick={closeSidebar} className="lg:hidden text-gray-400 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 custom-scrollbar overflow-x-hidden">
          <nav className="px-3 space-y-6">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-3 rounded-lg transition-all duration-200 relative
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
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
                </Link>
              ))}
            </div>

            <div className="space-y-1">
              {!isCollapsed && <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Externos</p>}
              {externosItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-3 rounded-lg transition-all duration-200 relative
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
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
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Footer / Collapse Toggle (Solo Desktop) */}
        <div className="hidden lg:block p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={toggleCollapse}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-center w-full gap-2'} p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm`}
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
    </>
  );
}
