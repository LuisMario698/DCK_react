'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { useSidebar } from './SidebarContext';
import { useTheme } from '@/components/layout/ThemeContext';
import { useAuth } from '@/components/layout/AuthProvider';
import logoExpanded from '@/Contexto-DCK/logo_DCK.png';
import logoCollapsed from '@/Contexto-DCK/logo_DCK_no_letras.png';
import logoWhite from '@/assets/logo_DCK_blanco.png';
import { UserProfileModal } from '@/components/layout/UserProfileModal';

export function Sidebar() {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const { isCollapsed, isOpen, closeSidebar, toggleCollapse } = useSidebar();
  const { theme } = useTheme();
  const { signOut, user } = useAuth(); // Get user
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Modal State

  const locale = pathname.split('/')[1] || 'es';

  const menuItems = [
    { label: t('menu.panel'), href: `/${locale}/dashboard`, icon: 'Dashboard' },
    { label: t('menu.manifiesto'), href: `/${locale}/dashboard/manifiesto`, icon: 'Document' },
    { label: t('menu.manifiestoBasuron'), href: `/${locale}/dashboard/manifiesto-basuron`, icon: 'Recycle' },
    { label: 'Estadísticas', href: `/${locale}/dashboard/estadisticas`, icon: 'Chart' },
    { label: t('menu.personas'), href: `/${locale}/dashboard/personas`, icon: 'Users' },
    { label: t('menu.embarcaciones'), href: `/${locale}/dashboard/embarcaciones`, icon: 'Ship' },
  ];

  const externosItems = [
    { label: t('externos.asociaciones'), href: `/${locale}/dashboard/asociaciones`, icon: 'Building' },
  ];

  const isActive = (href: string) => pathname === href;

  const IconComponent = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons];
    return Icon ? <Icon /> : null;
  };

  const logoSrcExpanded = theme === 'dark' ? logoWhite : logoExpanded;

  return (
    <>
      {/* Overlay invisible para cerrar al hacer clic fuera (solo móvil) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Modal Perfil */}
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <aside
        className={`
          fixed inset-y-0 left-0 
          h-full
          ${isCollapsed ? 'w-20' : 'w-64'}
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          z-50 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-lg dark:shadow-gray-950/50
          flex flex-col
          overflow-x-hidden
        `}
      >
        {/* Header */}
        <div className={`h-28 flex items-center ${isCollapsed ? 'justify-center' : 'justify-center relative'} border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : 'w-full flex justify-center'}`}>
            {isCollapsed ? (
              <div className="flex-shrink-0 w-16 h-16 relative">
                <Image
                  src={logoCollapsed}
                  alt="DCK"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-60 h-24 transition-all duration-300">
                <Image
                  src={logoSrcExpanded}
                  alt="DCK Logo"
                  fill
                  className="object-contain object-center"
                  priority
                />
              </div>
            )}
          </div>
          {/* Botón cerrar solo visible en móvil */}
          <button onClick={closeSidebar} className="lg:hidden absolute right-4 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">
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
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
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
              {!isCollapsed && <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Externos</p>}
              {externosItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-3 rounded-lg transition-all duration-200 relative
                    ${isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
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

        {/* Footer / Collapse Toggle & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'w-full gap-3 px-3'} py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors group relative`}
            title={isCollapsed ? (user?.user_metadata?.full_name || 'Mi Perfil') : ''}
          >
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs border border-blue-500">
              {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start truncate overflow-hidden">
                <span className="text-sm font-medium truncate w-full text-left">{user?.user_metadata?.full_name || 'Usuario'}</span>
                <span className="text-xs text-gray-500 truncate w-full text-left">{user?.email}</span>
              </div>
            )}
          </button>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={signOut}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'w-full gap-3 px-3'} py-2 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors group relative`}
            title={isCollapsed ? t('menu.logout') : ''}
          >
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            {!isCollapsed && <span className="text-sm font-medium">Cerrar sesión</span>}
          </button>

          {/* Botón Colapsar (Solo Desktop) */}
          <button
            onClick={toggleCollapse}
            className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center' : 'w-full gap-3 px-3'} py-2 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition-colors`}
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

