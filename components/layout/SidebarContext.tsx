'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';


interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  toggleCollapse: () => void;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Cargar estado desde localStorage. Sólo se recuerda si el menú de escritorio está colapsado:
  // el menú de celular (isOpen) siempre empieza cerrado, para no tapar la pantalla al volver.
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) setIsCollapsed(savedCollapsed === 'true');
    setMounted(true);
  }, []);

  // Persistir estado
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }
  }, [isCollapsed, mounted]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const openSidebar = () => setIsOpen(true);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <SidebarContext.Provider value={{ isOpen, isCollapsed, toggleSidebar, closeSidebar, openSidebar, toggleCollapse, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
