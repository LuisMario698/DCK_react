'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider } from './SidebarContext';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    // Iniciar fade out
    setTransitionStage('fadeOut');
    
    const timer = setTimeout(() => {
      // Actualizar contenido y hacer fade in
      setDisplayChildren(children);
      setTransitionStage('fadeIn');
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col min-h-screen w-full">
          <Header />
          <main 
            className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 transition-opacity duration-150 ${
              transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="max-w-[100vw] overflow-x-hidden">
              {displayChildren}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
