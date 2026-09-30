'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { AvisoGlobal } from './AvisoGlobal';
import { FondoSimar } from './FondoSimar';
import { BarraInferior } from './BarraInferior';
import { HojaMas } from './HojaMas';
import { UserProfileModal } from './UserProfileModal';
import { AvisosRecintoProvider, PanelAvisos } from './AvisosRecinto';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart3, Ellipsis, FileText, LayoutGrid, Recycle } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Inner component to consume context
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, closeSidebar, hojaAbierta, abrirHoja, cerrarHoja, perfilAbierto, cerrarPerfil } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations('Sidebar');
  const locale = pathname.split('/')[1] || 'es';

  // En celular el menú lateral y la hoja "Más" se cierran solos al llegar a otra pantalla
  useEffect(() => {
    closeSidebar();
    cerrarHoja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Espacio para el menú flotante de vidrio (276 px + 16 px de margen a cada lado)
  const getSidebarPadding = () => {
    return isCollapsed ? 'pl-0 lg:pl-[120px]' : 'pl-0 lg:pl-[308px]';
  };

  // Barra inferior (celular y tableta): las tareas del día y "Más" para lo demás
  const principales = [
    { label: t('menu.panel'), href: `/${locale}/dashboard`, icon: LayoutGrid },
    { label: t('menu.manifiesto'), href: `/${locale}/dashboard/manifiesto`, icon: FileText },
    { label: 'Basurón', href: `/${locale}/dashboard/manifiesto-basuron`, icon: Recycle },
    { label: 'Estadísticas', href: `/${locale}/dashboard/estadisticas`, icon: BarChart3 },
  ].map((i) => ({ ...i, activo: pathname === i.href }));

  return (
    // simar-compacto: en celular todo el recinto usa la escala compacta (ver DISEÑO_SIMAR.md)
    <div className="simar-compacto min-h-screen bg-simar-papel">
      <FondoSimar />
      <Sidebar />
      <div className={`relative flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${getSidebarPadding()}`}>
        <Header />
        {/* Abajo deja lugar a la barra inferior flotante (y a la zona segura del teléfono) */}
        <main className="flex-1 px-3.5 pt-3 pb-[calc(100px+env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 md:px-6 md:pt-6 lg:py-10 lg:pr-10 lg:pl-8">
          <AvisoGlobal className="max-w-[1600px]" />
          {/* Cada pantalla entra con un fundido corto (simar-pagina); la clave la reinicia al navegar.
              overflow-x-clip y no hidden: hidden lo vuelve contenedor de desplazamiento y las barras
              sticky (guardar manifiesto) dejaban de flotar sobre la pantalla. */}
          <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-clip">
            {children}
          </div>
        </main>
      </div>
      <BarraInferior
        items={principales}
        onAbrirMenu={abrirHoja}
        etiquetaMenu="Más"
        iconoMenu={Ellipsis}
        menuAbierto={hojaAbierta}
      />
      <HojaMas />
      <PanelAvisos colapsado={isCollapsed} />
      <UserProfileModal isOpen={perfilAbierto} onClose={cerrarPerfil} />
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      {/* Avisos: una sola consulta y suscripción para la campana del celular y la del menú */}
      <AvisosRecintoProvider>
        <DashboardContent>{children}</DashboardContent>
      </AvisosRecintoProvider>
    </SidebarProvider>
  );
}
