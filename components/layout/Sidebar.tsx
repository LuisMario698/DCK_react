'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { useSidebar } from './SidebarContext';

const menuItems = [
  { label: 'Panel', href: '/dashboard', icon: 'Dashboard' },
  { label: 'Personas', href: '/dashboard/personas', icon: 'Users' },
  { label: 'Embarcaciones', href: '/dashboard/embarcaciones', icon: 'Ship' },
  { label: 'Manifiesto', href: '/dashboard/manifiesto', icon: 'Document' },
];

const externosItems = [
  { label: 'Asociaciones recolectoras', href: '/dashboard/asociaciones', icon: 'Building' },
  { label: 'Reutilización de residuos', href: '/dashboard/reutilizacion', icon: 'Recycle' },
];

const sistemaItems = [
  { label: 'Usuarios del sistema', href: '/dashboard/usuarios', icon: 'User' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const menuRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const navRef = useRef<HTMLDivElement>(null);

  // Marcar que ya se ha animado después del primer render
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Actualizar posición del indicador cuando cambia la ruta
  useEffect(() => {
    const activeRef = menuRefs.current[pathname];
    const navElement = navRef.current;
    if (activeRef && navElement) {
      // Calcular la posición relativa al contenedor nav
      const navRect = navElement.getBoundingClientRect();
      const linkRect = activeRef.getBoundingClientRect();
      const relativeTop = linkRect.top - navRect.top;
      
      setIndicatorStyle({
        top: relativeTop,
        height: linkRect.height,
        opacity: 1,
      });
    }
  }, [pathname, isOpen]); // Agregamos isOpen para recalcular cuando se abre el sidebar
  
  const isActive = (href: string) => pathname === href;
  
  const IconComponent = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons];
    return Icon ? <Icon /> : null;
  };

  const handleLinkClick = () => {
    // Ya no cerramos el sidebar al hacer clic en un link
    // Solo se cierra clickeando fuera o en la X
  };

  return (
    <>
      {/* Overlay invisible para cerrar al hacer clic fuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 sm:top-4 sm:left-4 sm:bottom-4
          w-[280px] sm:w-[280px] sm:max-h-[calc(100vh-2rem)]
          bg-gray-900/8 backdrop-blur-2xl
          sm:rounded-2xl
          z-50 
          ${hasAnimated ? 'transition-transform duration-200 ease-in-out' : ''}
          ${isOpen ? 'translate-x-0' : '-translate-x-full sm:-translate-x-[calc(100%+2rem)]'}
          shadow-2xl border-r-2 sm:border-2 border-white/40
          will-change-transform
          overflow-y-auto
        `}
        style={{
          boxShadow: '0 20px 60px 0 rgba(0, 0, 0, 0.2), 0 8px 16px 0 rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header del sidebar con botón cerrar */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Icons.Ship />
                </div>
                <h1 className="text-xl font-bold text-gray-800">CIAD</h1>
              </div>
              <button
                onClick={closeSidebar}
                className="p-2 rounded-lg hover:bg-white/20 text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Cerrar menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Contenido del menú */}
          <div className="p-5 pb-6">
            <nav ref={navRef} className="space-y-7 relative">
              {/* Indicador estilo vidrio azul - Fluent Design */}
              <div
                className="absolute left-0 rounded-lg transition-all duration-200 ease-out pointer-events-none"
                style={{
                  top: `${indicatorStyle.top}px`,
                  height: `${indicatorStyle.height}px`,
                  width: '100%',
                  opacity: indicatorStyle.opacity,
                  zIndex: 0,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.25) 100%)',
                  backdropFilter: 'blur(12px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  boxShadow: '0 2px 12px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }}
              />
              
              {/* Menu Principal */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Menú Principal</p>
                <div className="space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      ref={(el) => { menuRefs.current[item.href] = el; }}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white/10'
                      }`}
                      style={{ zIndex: 1 }}
                    >
                      <div className="flex-shrink-0">
                        {IconComponent(item.icon)}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Externos */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Gestión Externa</p>
                <div className="space-y-1">
                  {externosItems.map((item) => (
                    <Link
                      key={item.href}
                      ref={(el) => { menuRefs.current[item.href] = el; }}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white/10'
                      }`}
                      style={{ zIndex: 1 }}
                    >
                      <div className="flex-shrink-0">
                        {IconComponent(item.icon)}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Sistema */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Administración</p>
                <div className="space-y-1">
                  {sistemaItems.map((item) => (
                    <Link
                      key={item.href}
                      ref={(el) => { menuRefs.current[item.href] = el; }}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white/10'
                      }`}
                      style={{ zIndex: 1 }}
                    >
                      <div className="flex-shrink-0">
                        {IconComponent(item.icon)}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
          
          {/* Footer del sidebar */}
          <div className="p-4 border-t border-white/30 bg-white/20">
            <div className="text-xs text-gray-500 text-center">
              CIAD Sistema v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
