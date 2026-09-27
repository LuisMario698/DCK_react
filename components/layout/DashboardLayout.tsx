'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { AvisoGlobal } from './AvisoGlobal';
import { FondoSimar } from './FondoSimar';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Inner component to consume context
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  // Espacio para el menú flotante de vidrio (276 px + 16 px de margen a cada lado)
  const getSidebarPadding = () => {
    return isCollapsed ? 'pl-0 lg:pl-[120px]' : 'pl-0 lg:pl-[308px]';
  };

  return (
    <div className="min-h-screen bg-simar-papel">
      <FondoSimar />
      <Sidebar />
      <div className={`relative flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${getSidebarPadding()}`}>
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:py-10 lg:pr-10 lg:pl-8">
          <AvisoGlobal className="max-w-[1600px]" />
          {/* Cada pantalla entra con un fundido corto (simar-pagina); la clave la reinicia al navegar */}
          <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}

