'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  BarChart3,
  Building2,
  ChevronsLeft,
  FileText,
  LayoutGrid,
  LogOut,
  Recycle,
  Ship,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useAuth } from '@/components/layout/AuthProvider';
import { UserProfileModal } from '@/components/layout/UserProfileModal';
import { EnlacesPaneles } from '@/components/superadmin/EnlacesPaneles';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTema } from '@/components/layout/ThemeToggle';

/** Línea de marea (la ola del logo) bajo la sección activa. */
function LineaMarea() {
  return (
    <svg aria-hidden="true" width="46" height="8" viewBox="0 0 44 8" className="absolute left-0 -bottom-[9px]">
      <path
        d="M0 4 Q2.75 0 5.5 4 T11 4 T16.5 4 T22 4 T27.5 4 T33 4 T38.5 4 T44 4"
        style={{ fill: 'none', stroke: 'var(--simar-golfo)', strokeWidth: 2, strokeLinecap: 'round' }}
      />
    </svg>
  );
}

export function Sidebar() {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const { isCollapsed, isOpen, closeSidebar, toggleCollapse } = useSidebar();
  const { signOut, user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const locale = pathname.split('/')[1] || 'es';

  const menuItems: { label: string; href: string; icon: LucideIcon }[] = [
    { label: t('menu.panel'), href: `/${locale}/dashboard`, icon: LayoutGrid },
    { label: t('menu.manifiesto'), href: `/${locale}/dashboard/manifiesto`, icon: FileText },
    { label: t('menu.manifiestoBasuron'), href: `/${locale}/dashboard/manifiesto-basuron`, icon: Recycle },
    { label: 'Estadísticas', href: `/${locale}/dashboard/estadisticas`, icon: BarChart3 },
    { label: t('menu.personas'), href: `/${locale}/dashboard/personas`, icon: Users },
    { label: t('menu.embarcaciones'), href: `/${locale}/dashboard/embarcaciones`, icon: Ship },
  ];

  const externosItems: { label: string; href: string; icon: LucideIcon }[] = [
    { label: t('externos.asociaciones'), href: `/${locale}/dashboard/asociaciones`, icon: Building2 },
  ];

  const isActive = (href: string) => pathname === href;

  const nombre = user?.user_metadata?.full_name || 'Usuario';
  const inicial = user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase();

  const renderItem = (item: { label: string; href: string; icon: LucideIcon }) => {
    const activo = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={activo ? 'page' : undefined}
        title={isCollapsed ? item.label : ''}
        className={`flex items-center gap-3.5 min-h-[54px] rounded-2xl transition-colors ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'} ${activo
          ? 'bg-simar-superficie text-simar-texto font-bold shadow-[0_4px_14px_-8px_rgba(11,34,54,0.3)]'
          : 'text-simar-texto-2 font-medium hover:bg-white/60 dark:hover:bg-white/5 hover:text-simar-texto'
          }`}
      >
        <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
        <span className={`relative text-lg leading-tight ${isCollapsed ? 'lg:hidden' : ''}`}>
          {item.label}
          {activo && <LineaMarea />}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Fondo para cerrar al tocar fuera (sólo móvil) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-[rgba(11,34,54,0.28)]"
          onClick={closeSidebar}
        />
      )}

      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <aside
        className={`
          simar-vidrio fixed z-50 top-4 bottom-4 left-4 rounded-[30px]
          w-[276px] ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[276px]'}
          px-4 pt-6 pb-4 flex flex-col gap-5 overflow-x-hidden
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : ''} px-2.5 relative`}>
          <div className="rounded-xl">
            {isCollapsed ? (
              <>
                <LogoSimar variante="simbolo" tamano={50} className="hidden lg:inline-flex" />
                <LogoSimar tamano={50} className="lg:hidden" />
              </>
            ) : (
              <LogoSimar tamano={50} />
            )}
          </div>
          {/* Cerrar (sólo móvil) */}
          <button
            onClick={closeSidebar}
            aria-label="Cerrar menú"
            className="lg:hidden absolute right-0 w-12 h-12 rounded-2xl bg-white/60 dark:bg-white/10 text-simar-texto flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1 custom-scrollbar">
          <nav aria-label={t('menu.titulo')} className="flex flex-col gap-1">
            {menuItems.map(renderItem)}

            <p className={`mt-3 mb-1 px-4 text-[15px] font-bold text-simar-texto-2 ${isCollapsed ? 'lg:hidden' : ''}`}>Externos</p>
            {externosItems.map(renderItem)}

            <div className="mt-3">
              <EnlacesPaneles actual="recinto" colapsado={isCollapsed} />
            </div>
          </nav>
        </div>

        {/* Perfil, tema, colapsar y cerrar sesión */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => setIsProfileOpen(true)}
            title={isCollapsed ? nombre : ''}
            className={`flex items-center gap-3 rounded-[18px] bg-simar-superficie p-2.5 text-left hover:shadow-[0_6px_18px_-12px_rgba(11,34,54,0.5)] transition-shadow ${isCollapsed ? 'lg:justify-center' : ''}`}
          >
            <span className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-simar-texto text-simar-superficie flex items-center justify-center text-lg font-bold">
              {inicial}
            </span>
            <span className={`min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
              <span className="block text-[17px] font-bold text-simar-texto truncate">{nombre}</span>
              <span className="block text-[15px] text-simar-texto-2">Ver perfil</span>
            </span>
          </button>

          <div className={`flex gap-2 ${isCollapsed ? 'lg:flex-col' : ''}`}>
            <BotonTema colapsado={isCollapsed} />
            <button
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
              title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
              className="hidden lg:flex w-[52px] min-h-[52px] rounded-2xl border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 transition-colors flex-shrink-0 self-center"
            >
              <ChevronsLeft className={`w-[22px] h-[22px] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <button
            onClick={signOut}
            title={isCollapsed ? t('menu.logout') : ''}
            className="w-full min-h-[52px] rounded-2xl border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto text-[17px] font-bold flex items-center justify-center gap-2.5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-[22px] h-[22px] flex-shrink-0" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>{t('menu.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
