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
export function EnlacesPaneles(props: {
    actual: PanelSuperadmin;
    colapsado: boolean;
    onNavegar?: () => void;
    /**
     * En el superadmin, elegir asociación abre una ventana aquí mismo. Si estos enlaces van dentro de
     * algo que se cierra (la hoja "Más"), la ventana quedaría debajo o se iría con él: con esto la
     * abre quien lo contiene (recibe la asociación actual) y los enlaces sólo avisan.
     */
    onElegirAsociacion?: (actual: number | null) => void;
}) {
    // useSearchParams (?elegir_asociacion=1) necesita un límite de Suspense para el prerender
    return (
        <Suspense fallback={null}>
            <Enlaces {...props} />
        </Suspense>
    );
}

function Enlaces({
    actual,
    colapsado,
    onNavegar,
    onElegirAsociacion,
}: {
    actual: PanelSuperadmin;
    colapsado: boolean;
    onNavegar?: () => void;
    onElegirAsociacion?: (actual: number | null) => void;
}) {
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

    // Superadmin: abre la ventana aquí o se la pide a quien contiene los enlaces (ver onElegirAsociacion)
    const elegirAqui = () => {
        if (!onElegirAsociacion) return setAbierto(true);
        onNavegar?.();
        onElegirAsociacion(perfil.asociacion_id);
    };

    const items: { clave: PanelSuperadmin; label: string; detalle?: string; href?: string; icon: LucideIcon; onClick?: () => void }[] = [
        { clave: 'superadmin', label: 'Panel de superadmin', href: `/${locale}/superadmin`, icon: ShieldCheck },
        { clave: 'recinto', label: 'Recinto portuario', href: `/${locale}/dashboard`, icon: Anchor },
        asociacion
            ? { clave: 'asociacion', label: 'Portal de asociación', detalle: asociacion.nombre_asociacion, href: `/${locale}/dashboard-recolector`, icon: Recycle }
            : actual === 'superadmin'
              ? { clave: 'asociacion', label: 'Portal de asociación', detalle: 'Elegir asociación', icon: Recycle, onClick: elegirAqui }
              : { clave: 'asociacion', label: 'Portal de asociación', detalle: 'Elegir asociación', href: elegirUrl, icon: Recycle },
    ];

    // Mismo tamaño que los items del menú lateral; violeta = superadmin (ver DISEÑO_SIMAR.md)
    const itemCls = `group flex items-center ${colapsado ? 'justify-center px-0' : 'px-4'} min-h-[54px] py-2 rounded-2xl w-full text-left transition-colors text-simar-texto-2 font-medium hover:bg-simar-violeta-suave hover:text-simar-texto`;

    return (
        <div className="space-y-1">
            {!colapsado && (
                <p className="px-4 text-[15px] font-bold text-simar-violeta mb-1">
                    Superadmin
                </p>
            )}
            {items
                .filter((i) => i.clave !== actual)
                .map((i) => {
                    const Icono = i.icon;
                    const contenido = (
                        <>
                            <Icono className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                            {!colapsado && (
                                <span className="ml-3.5 min-w-0 flex-1">
                                    <span className="block text-lg leading-tight truncate">{i.label}</span>
                                    {i.detalle && <span className="block text-[15px] text-simar-texto-2 truncate">{i.detalle}</span>}
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
                    onClick={() => (actual === 'superadmin' ? elegirAqui() : router.push(elegirUrl))}
                    title={colapsado ? 'Cambiar asociación' : undefined}
                    className={itemCls}
                >
                    <ArrowLeftRight className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                    {!colapsado && <span className="ml-3.5 text-lg leading-tight">Cambiar asociación</span>}
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
