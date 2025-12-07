'use client';

import { Icons } from '@/components/ui/Icons';
import { useSidebar } from './SidebarContext';
import LanguageSwitcher from './LanguageSwitcher';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import logoMobile from '@/Contexto-DCK/logo_DCK.png';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  // Extract locale from pathname (e.g., "/es/dashboard" -> "es")
  const locale = (pathname.split('/')[1] || 'es') as 'es' | 'en';

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      {/* Botón hamburguesa para abrir el sidebar - Solo móvil */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 lg:hidden"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo/Title en móvil */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="relative w-24 h-8">
          <Image
            src={logoMobile}
            alt="DCK Logo"
            fill
            className="object-contain object-left"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher currentLocale={locale} />

        {/* Settings */}
        <button className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
          <Icons.Settings />
        </button>
      </div>
    </header>
  );
}
