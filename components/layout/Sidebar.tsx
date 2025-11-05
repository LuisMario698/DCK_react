'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';

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
  
  const isActive = (href: string) => pathname === href;
  
  const IconComponent = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons];
    return Icon ? <Icon /> : null;
  };

  return (
    <aside className="w-[260px] min-h-screen bg-[#fafafa] border-r border-gray-200">
      <div className="p-5">
        {/* Logo */}
        <div className="mb-10 px-2 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Icons.Ship />
            </div>
            <h1 className="text-xl font-bold text-gray-800">CIAD</h1>
          </div>
        </div>
        
        {/* Menu Principal */}
        <nav className="space-y-7">
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3 px-2">Menu</p>
            <div className="space-y-0.5">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {IconComponent(item.icon)}
                  <span className="text-[13px]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Externos */}
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3 px-2">Externos</p>
            <div className="space-y-0.5">
              {externosItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {IconComponent(item.icon)}
                  <span className="text-[13px]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Sistema */}
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3 px-2">Sistema</p>
            <div className="space-y-0.5">
              {sistemaItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {IconComponent(item.icon)}
                  <span className="text-[13px]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
