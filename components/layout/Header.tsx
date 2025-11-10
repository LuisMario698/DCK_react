'use client';

import { Icons } from '@/components/ui/Icons';
import { useSidebar } from './SidebarContext';

export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Botón hamburguesa para abrir el sidebar */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
          <Icons.Globe />
        </button>
        
        {/* Settings */}
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
          <Icons.Settings />
        </button>
      </div>
    </header>
  );
}
