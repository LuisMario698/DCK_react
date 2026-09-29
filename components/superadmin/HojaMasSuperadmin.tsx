'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LogOut, ScrollText, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { HojaInferior } from '@/components/layout/HojaInferior';
import { BotonTema } from '@/components/layout/ThemeToggle';
import { EnlacesPaneles } from './EnlacesPaneles';

/**
 * Hoja "Más" del superadmin (celular y tableta), hermana de la del recinto (HojaMas) y la del portal
 * (HojaMasRecolector): quién eres arriba, las secciones que no caben en la barra, los accesos a los
 * otros paneles y al final tema y cerrar sesión. Violeta = superadmin (DISEÑO_SIMAR.md).
 */
export function HojaMasSuperadmin({
    abierta,
    onCerrar,
    onElegirAsociacion,
}: {
    abierta: boolean;
    onCerrar: () => void;
    /** "Elegir / cambiar asociación": la ventana la abre el layout (encima de la hoja no se vería) */
    onElegirAsociacion: (actual: number | null) => void;
}) {
    const pathname = usePathname();
    const base = `/${pathname.split('/')[1] || 'es'}/superadmin`;
    const { signOut, user } = useAuth();
    const nombre = user?.user_metadata?.full_name || 'Superadministrador';

    const secciones: { label: string; href: string; icon: LucideIcon }[] = [
        { label: 'Planes', href: `${base}/planes`, icon: Layers },
        { label: 'Auditoría', href: `${base}/auditoria`, icon: ScrollText },
    ];

    return (
        <HojaInferior abierto={abierta} onCerrar={onCerrar} etiqueta="Más opciones">
            {/* Quién eres (el superadmin no tiene pantalla de perfil) */}
            <div className="flex items-center gap-3 rounded-[18px] bg-simar-papel p-3">
                <span className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-simar-violeta-suave text-simar-violeta flex items-center justify-center text-lg font-bold">
                    {(user?.user_metadata?.full_name || user?.email || 'S').charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold text-simar-texto truncate">{nombre}</span>
                    <span className="block text-[15px] text-simar-texto-2 truncate">{user?.email}</span>
                </span>
                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-simar-violeta-suave text-simar-violeta text-[13px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Superadmin
                </span>
            </div>

            {/* Otras secciones en mosaico */}
            <p className="mt-5 mb-2.5 px-1 text-[15px] font-bold text-simar-texto-2">Otras secciones</p>
            <nav aria-label="Otras secciones" className="grid grid-cols-2 gap-2.5">
                {secciones.map((s) => {
                    const Icono = s.icon;
                    const activo = pathname.startsWith(s.href);
                    return (
                        <Link
                            key={s.href}
                            href={s.href}
                            onClick={onCerrar}
                            aria-current={activo ? 'page' : undefined}
                            className={`simar-presiona min-h-[96px] rounded-[18px] border p-2.5 flex flex-col items-center justify-center gap-2 text-center ${
                                activo ? 'border-simar-violeta bg-simar-violeta-suave' : 'border-simar-borde bg-simar-superficie'
                            }`}
                        >
                            <span className="w-11 h-11 rounded-full flex items-center justify-center bg-simar-violeta-suave text-simar-violeta">
                                <Icono className="w-6 h-6" strokeWidth={2} />
                            </span>
                            <span className="text-[15px] font-bold leading-tight text-simar-texto">{s.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Accesos a los otros paneles (recinto, portal de asociación, cambiar asociación) */}
            <div className="mt-4 empty:hidden">
                <EnlacesPaneles actual="superadmin" colapsado={false} onNavegar={onCerrar} onElegirAsociacion={onElegirAsociacion} />
            </div>

            {/* Tema y salida */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
                <BotonTema />
                <button
                    type="button"
                    onClick={signOut}
                    className="simar-presiona min-h-[52px] rounded-2xl bg-simar-coral-suave text-simar-coral text-[17px] font-bold flex items-center justify-center gap-2.5"
                >
                    <LogOut className="w-[22px] h-[22px] flex-shrink-0" />
                    Cerrar sesión
                </button>
            </div>
        </HojaInferior>
    );
}
