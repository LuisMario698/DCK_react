'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CreditCard, Ellipsis, LayoutDashboard, Settings2, Users } from 'lucide-react';
import { SidebarSuperadmin } from '@/components/superadmin/SidebarSuperadmin';
import { HeaderSuperadmin, TituloPantallaSuperadmin } from '@/components/superadmin/HeaderSuperadmin';
import { HojaMasSuperadmin } from '@/components/superadmin/HojaMasSuperadmin';
import { ModalElegirAsociacion } from '@/components/superadmin/ModalElegirAsociacion';
import { AvisoGlobal } from '@/components/layout/AvisoGlobal';
import { FondoSimar } from '@/components/layout/FondoSimar';
import { BarraInferior } from '@/components/layout/BarraInferior';

/**
 * Panel del desarrollador / superadmin. El middleware sólo deja entrar a
 * cuentas con `profiles.es_superadmin`; además cada RPC `sa_*` lo verifica
 * en la base de datos.
 */
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'es';
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hojaAbierta, setHojaAbierta] = useState(false);
    // "Elegir asociación" desde la hoja "Más": la ventana vive aquí para no quedar debajo de la hoja
    const [elegir, setElegir] = useState<{ actual: number | null } | null>(null);

    // La hoja "Más" se cierra sola al llegar a otra pantalla (también con el botón de atrás)
    const [rutaHoja, setRutaHoja] = useState(pathname);
    if (rutaHoja !== pathname) {
        setRutaHoja(pathname);
        setHojaAbierta(false);
    }

    // Barra inferior (celular y tableta), como la del recinto: las cuatro secciones del día y "Más".
    // Suscripciones se llama "Cobros" aquí: con cinco botones "Suscripciones" no cabe ni a 9.5 px y la
    // barra se quedaba sin palabras (su pantalla conserva el título)
    const base = `/${locale}/superadmin`;
    const principales = [
        { label: 'Resumen', href: base, icon: LayoutDashboard, activo: pathname === base || pathname === `${base}/` },
        { label: 'Cuentas', href: `${base}/cuentas`, icon: Users, activo: pathname.startsWith(`${base}/cuentas`) },
        { label: 'Cobros', href: `${base}/suscripciones`, icon: CreditCard, activo: pathname.startsWith(`${base}/suscripciones`) },
        { label: 'Sistema', href: `${base}/sistema`, icon: Settings2, activo: pathname.startsWith(`${base}/sistema`) },
    ];

    return (
        // simar-compacto: en celular el superadmin usa la misma escala compacta que el recinto (ver DISEÑO_SIMAR.md)
        <div className="simar-compacto min-h-screen bg-simar-papel">
            <FondoSimar />
            <SidebarSuperadmin isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed((c) => !c)} />
            <div className={`relative flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0 lg:pl-[120px]' : 'pl-0 lg:pl-[308px]'}`}>
                <HeaderSuperadmin />
                {/* Abajo deja lugar a la barra inferior flotante (y a la zona segura del teléfono) */}
                <main className="flex-1 px-3.5 pt-3 pb-[calc(100px+env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 md:px-6 md:pt-6 lg:py-8 lg:pr-10 lg:pl-8">
                    <AvisoGlobal mostrarMantenimiento />
                    {/* overflow-x-clip y no hidden: hidden lo vuelve contenedor de desplazamiento (DISEÑO_SIMAR.md → "Cuidado") */}
                    <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-clip">
                        <TituloPantallaSuperadmin />
                        {children}
                    </div>
                </main>
            </div>
            <BarraInferior
                items={principales}
                onAbrirMenu={() => setHojaAbierta(true)}
                etiquetaMenu="Más"
                iconoMenu={Ellipsis}
                menuAbierto={hojaAbierta}
            />
            <HojaMasSuperadmin
                abierta={hojaAbierta}
                onCerrar={() => setHojaAbierta(false)}
                onElegirAsociacion={(actual) => setElegir({ actual })}
            />
            {elegir && (
                <ModalElegirAsociacion
                    actual={elegir.actual}
                    onClose={() => setElegir(null)}
                    onElegida={(id) => {
                        setElegir(null);
                        if (id) router.push(`/${locale}/dashboard-recolector`);
                    }}
                />
            )}
        </div>
    );
}
