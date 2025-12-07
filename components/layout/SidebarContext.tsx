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

  // Cargar estado desde localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');

    if (savedState !== null) setIsOpen(savedState === 'true');
    if (savedCollapsed !== null) setIsCollapsed(savedCollapsed === 'true');

    setMounted(true);
  }, []);

  // Persistir estado
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', String(isOpen));
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }
  }, [isOpen, isCollapsed, mounted]);

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
