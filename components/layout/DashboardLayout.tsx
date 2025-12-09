'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Inner component to consume context
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');
  const pathname = usePathname();

  useEffect(() => {
    setTransitionStage('fadeOut');
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('fadeIn');
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname, children]);

  // Calculate padding based on sidebar state
  const getSidebarPadding = () => {
    return isCollapsed ? 'pl-0 lg:pl-20' : 'pl-0 lg:pl-64';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className={`flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${getSidebarPadding()}`}>
        <Header />
        <main
          className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 transition-opacity duration-150 ${transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'
            }`}
        >
          <div className="max-w-[100vw] overflow-x-hidden">
            {displayChildren}
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

