'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Anchor, ArrowLeftRight, Recycle, ShieldCheck, type LucideIcon } from 'lucide-react';
import { getMiPerfil, type PerfilConAsociacion } from '@/lib/services/perfil';
import { EVENTO_PERFIL_ACTUALIZADO, ModalElegirAsociacion } from './ModalElegirAsociacion';

export type PanelSuperadmin = 'superadmin' | 'recinto' | 'asociacion';

/**
 * Accesos del superadmin a los otros dos paneles (superadmin, recinto
 * portuario y portal de asociación). Se monta en los tres sidebars y no
 * muestra nada a quien no sea superadmin.
 */
export function EnlacesPaneles(props: { actual: PanelSuperadmin; colapsado: boolean; onNavegar?: () => void }) {
    // useSearchParams (?elegir_asociacion=1) necesita un límite de Suspense para el prerender
    return (
        <Suspense fallback={null}>
            <Enlaces {...props} />
        </Suspense>
    );
}

function Enlaces({ actual, colapsado, onNavegar }: { actual: PanelSuperadmin; colapsado: boolean; onNavegar?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'es';
    const pideElegir = useSearchParams().get('elegir_asociacion') === '1';

    const [perfil, setPerfil] = useState<PerfilConAsociacion | null>(null);
    const [abierto, setAbierto] = useState(false);
    const [descartado, setDescartado] = useState(false);

    const cargar = useCallback(() => {
        getMiPerfil()
            .then(setPerfil)
            .catch(() => setPerfil(null));
    }, []);

    useEffect(() => {
        cargar();
        window.addEventListener(EVENTO_PERFIL_ACTUALIZADO, cargar);
        return () => window.removeEventListener(EVENTO_PERFIL_ACTUALIZADO, cargar);
    }, [cargar]);

    if (!perfil?.es_superadmin) return null;

    const asociacion = perfil.asociacion;
    const elegirUrl = `/${locale}/superadmin?elegir_asociacion=1`;
    // El middleware manda aquí con ?elegir_asociacion=1 si se entra al portal sin asociación
    const modalVisible = actual === 'superadmin' && (abierto || (pideElegir && !descartado));

    const cerrarModal = () => {
        setAbierto(false);
        setDescartado(true);
        if (pideElegir) router.replace(pathname);
    };

    const items: { clave: PanelSuperadmin; label: string; detalle?: string; href?: string; icon: LucideIcon; onClick?: () => void }[] = [
        { clave: 'superadmin', label: 'Panel de superadmin', href: `/${locale}/superadmin`, icon: ShieldCheck },
        { clave: 'recinto', label: 'Recinto portuario', href: `/${locale}/dashboard`, icon: Anchor },
        asociacion
            ? { clave: 'asociacion', label: 'Portal de asociación', detalle: asociacion.nombre_asociacion, href: `/${locale}/dashboard-recolector`, icon: Recycle }
            : actual === 'superadmin'
              ? { clave: 'asociacion', label: 'Portal de asociación', detalle: 'Elegir asociación', icon: Recycle, onClick: () => setAbierto(true) }
              : { clave: 'asociacion', label: 'Portal de asociación', detalle: 'Elegir asociación', href: elegirUrl, icon: Recycle },
    ];

    const itemCls = `group flex items-center ${colapsado ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg w-full text-left transition-colors text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300`;

    return (
        <div className="space-y-1">
            {!colapsado && (
                <p className="px-3 text-xs font-semibold text-violet-600/80 dark:text-violet-400/80 uppercase tracking-wider mb-2">
                    Superadmin
                </p>
            )}
            {items
                .filter((i) => i.clave !== actual)
                .map((i) => {
                    const Icono = i.icon;
                    const contenido = (
                        <>
                            <Icono className="w-5 h-5 flex-shrink-0" />
                            {!colapsado && (
                                <span className="ml-3 min-w-0 flex-1">
                                    <span className="block text-sm font-medium truncate">{i.label}</span>
                                    {i.detalle && <span className="block text-[11px] text-gray-400 dark:text-gray-500 truncate">{i.detalle}</span>}
                                </span>
                            )}
                        </>
                    );
                    const titulo = colapsado ? `${i.label}${i.detalle ? ` · ${i.detalle}` : ''}` : undefined;
                    return i.href ? (
                        <Link key={i.clave} href={i.href} onClick={onNavegar} title={titulo} className={itemCls}>
                            {contenido}
                        </Link>
                    ) : (
                        <button key={i.clave} type="button" onClick={i.onClick} title={titulo} className={itemCls}>
                            {contenido}
                        </button>
                    );
                })}
            {actual !== 'recinto' && asociacion && (
                <button
                    type="button"
                    onClick={() => (actual === 'superadmin' ? setAbierto(true) : router.push(elegirUrl))}
                    title={colapsado ? 'Cambiar asociación' : undefined}
                    className={itemCls}
                >
                    <ArrowLeftRight className="w-5 h-5 flex-shrink-0" />
                    {!colapsado && <span className="ml-3 text-sm font-medium">Cambiar asociación</span>}
                </button>
            )}

            {/* Portal: el sidebar tiene transform y un modal fixed quedaría encerrado en él */}
            {modalVisible &&
                createPortal(
                    <ModalElegirAsociacion
                        actual={perfil.asociacion_id}
                        onClose={cerrarModal}
                        onElegida={(id) => {
                            cerrarModal();
                            if (id) router.push(`/${locale}/dashboard-recolector`);
                        }}
                    />,
                    document.body
                )}
        </div>
    );
}
