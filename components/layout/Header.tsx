import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { LogoSimar } from './LogoSimar';

/** Barra superior sólo en móvil: botón de menú y logo, en vidrio flotante. */
export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="lg:hidden sticky top-3 z-30 mx-3 mt-3 h-16 rounded-3xl simar-vidrio flex items-center gap-3 px-2">
      <button
        onClick={toggleSidebar}
        className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-white/10 text-simar-texto flex items-center justify-center flex-shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex-1 flex justify-center pr-16">
        <LogoSimar tamano={40} />
      </div>
    </header>
  );
}
