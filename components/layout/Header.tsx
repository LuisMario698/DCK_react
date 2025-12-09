import { useSidebar } from './SidebarContext';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/components/layout/ThemeContext';
import logoMobile from '@/Contexto-DCK/logo_DCK.png';
import logoWhite from '@/assets/logo_DCK_blanco.png';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { theme } = useTheme();

  // Extract locale from pathname (e.g., "/es/dashboard" -> "es")
  const locale = (pathname.split('/')[1] || 'es') as 'es' | 'en';

  const logoSrcMobile = theme === 'dark' ? logoWhite : logoMobile;

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30 shadow-sm dark:shadow-gray-950/50">
      {/* Botón hamburguesa para abrir el sidebar - Solo móvil */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0 lg:hidden"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo - Solo móvil (Centrado) */}
      <div className="flex-1 lg:hidden flex justify-center">
        <div className="relative w-32 h-10">
          <Image
            src={logoSrcMobile}
            alt="DCK Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}


