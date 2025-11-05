'use client';

import { Icons } from '@/components/ui/Icons';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1"></div>
      
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
