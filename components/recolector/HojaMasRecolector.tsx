'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight, History, Leaf, LogOut, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { HojaInferior } from '@/components/layout/HojaInferior';
import { BotonTema } from '@/components/layout/ThemeToggle';
import { EnlacesPaneles } from '@/components/superadmin/EnlacesPaneles';
import { useRecolector } from './RecolectorContext';

/**
 * Hoja "Más" del portal de empresas (celular y tableta), hermana de la del recinto (HojaMas): la
 * empresa arriba (lleva a su perfil), las otras secciones en mosaico de tres, los accesos de
 * superadmin (si aplica) y al final tema y cerrar sesión. Ver DISEÑO_SIMAR.md → "Versión móvil".
 */
export function HojaMasRecolector({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
    const pathname = usePathname();
    const base = `/${pathname.split('/')[1] || 'es'}/dashboard-recolector`;
    const { signOut, user } = useAuth();
    const { asociacion, notificacionesNoLeidas } = useRecolector();

    const nombre = asociacion?.nombre_asociacion || user?.user_metadata?.full_name || 'Empresa';

    const secciones: { label: string; href: string; icon: LucideIcon; tono: string; badge?: number }[] = [
        { label: 'Historial', href: `${base}/historial`, icon: History, tono: 'bg-simar-marea-suave text-simar-marea-tinta' },
        { label: 'Impacto ambiental', href: `${base}/impacto`, icon: Leaf, tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta' },
        { label: 'Notificaciones', href: `${base}/notificaciones`, icon: Bell, tono: 'bg-simar-coral-suave text-simar-coral', badge: notificacionesNoLeidas },
    ];

    return (
        <HojaInferior abierto={abierta} onCerrar={onCerrar} etiqueta="Más opciones">
            {/* Empresa: lleva a su perfil */}
            <Link
                href={`${base}/perfil`}
                onClick={onCerrar}
                aria-current={pathname.startsWith(`${base}/perfil`) ? 'page' : undefined}
                className="simar-presiona w-full flex items-center gap-3 rounded-[18px] bg-simar-papel p-3 text-left"
            >
                <span className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-simar-texto text-simar-superficie flex items-center justify-center text-lg font-bold">
                    {nombre.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold text-simar-texto truncate">{nombre}</span>
                    <span className="block text-[15px] text-simar-texto-2 truncate">Perfil de la empresa</span>
                </span>
                <ChevronRight aria-hidden="true" className="w-6 h-6 flex-shrink-0 text-simar-texto-2" />
            </Link>

            {/* Otras secciones en mosaico */}
            <p className="mt-5 mb-2.5 px-1 text-[15px] font-bold text-simar-texto-2">Otras secciones</p>
            <nav aria-label="Otras secciones" className="grid grid-cols-3 gap-2.5">
                {secciones.map((s) => {
                    const Icono = s.icon;
                    const activo = pathname.startsWith(s.href);
                    return (
                        <Link
                            key={s.href}
                            href={s.href}
                            onClick={onCerrar}
                            aria-current={activo ? 'page' : undefined}
                            aria-label={s.badge ? `${s.label} (${s.badge} sin leer)` : undefined}
                            className={`simar-presiona min-h-[96px] rounded-[18px] border p-2.5 flex flex-col items-center justify-center gap-2 text-center ${
                                activo ? 'border-simar-marea-tinta bg-simar-marea-suave' : 'border-simar-borde bg-simar-superficie'
                            }`}
                        >
                            <span className={`relative w-11 h-11 rounded-full flex items-center justify-center ${s.tono}`}>
                                <Icono className="w-6 h-6" strokeWidth={2} />
                                {!!s.badge && (
                                    <span className="absolute -top-1 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#A63F0E] text-white text-[12px] font-bold flex items-center justify-center ring-2 ring-simar-superficie">
                                        {s.badge > 9 ? '9+' : s.badge}
                                    </span>
                                )}
                            </span>
                            <span className="text-[15px] font-bold leading-tight text-simar-texto">{s.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Accesos a los otros paneles (sólo superadmin; si no, no muestra nada) */}
            <div className="mt-4 empty:hidden">
                <EnlacesPaneles actual="asociacion" colapsado={false} onNavegar={onCerrar} />
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
