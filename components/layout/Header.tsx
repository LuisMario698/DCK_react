'use client';

import { Icons } from '@/components/ui/Icons';
import { useSidebar } from './SidebarContext';

export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      {/* Botón hamburguesa para abrir el sidebar */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Logo/Title en móvil */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Icons.Ship />
        </div>
        <span className="text-sm font-bold text-gray-900">CIAD</span>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language Selector */}
        <button className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
          <Icons.Globe />
        </button>
        
        {/* Settings */}
        <button className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
          <Icons.Settings />
        </button>
      </div>
    </header>
  );
}
