'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { AvisoGlobal } from './AvisoGlobal';
import { FondoSimar } from './FondoSimar';
import { BarraInferior } from './BarraInferior';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, LayoutGrid, Recycle } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Inner component to consume context
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, closeSidebar, openSidebar } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations('Sidebar');
  const locale = pathname.split('/')[1] || 'es';

  // En celular el menú lateral se cierra solo al llegar a otra pantalla
  useEffect(() => {
    closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Espacio para el menú flotante de vidrio (276 px + 16 px de margen a cada lado)
  const getSidebarPadding = () => {
    return isCollapsed ? 'pl-0 lg:pl-[120px]' : 'pl-0 lg:pl-[308px]';
  };

  // Barra inferior (celular y tableta): las tareas del día y "Menú" para lo demás
  const principales = [
    { label: t('menu.panel'), href: `/${locale}/dashboard`, icon: LayoutGrid },
    { label: t('menu.manifiesto'), href: `/${locale}/dashboard/manifiesto`, icon: FileText },
    { label: 'Basurón', href: `/${locale}/dashboard/manifiesto-basuron`, icon: Recycle },
  ].map((i) => ({ ...i, activo: pathname === i.href }));

  return (
    <div className="min-h-screen bg-simar-papel">
      <FondoSimar />
      <Sidebar />
      <div className={`relative flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${getSidebarPadding()}`}>
        <Header />
        {/* Abajo deja lugar a la barra inferior en celular (y a la zona segura del teléfono) */}
        <main className="flex-1 px-4 pt-4 pb-[calc(112px+env(safe-area-inset-bottom))] md:px-6 md:pt-6 lg:py-10 lg:pr-10 lg:pl-8">
          <AvisoGlobal className="max-w-[1600px]" />
          {/* Cada pantalla entra con un fundido corto (simar-pagina); la clave la reinicia al navegar */}
          <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      <BarraInferior items={principales} onAbrirMenu={openSidebar} />
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

