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
/**
 * `variante="barra"`: dos botones fijos junto al perfil, para los sidebars del
 * recinto y del portal. Como lista dentro del menú quedaban fuera de la vista
 * en pantallas de 900 px de alto o menos (el menú tiene letra y botones grandes).
 */
export function EnlacesPaneles(props: { actual: PanelSuperadmin; colapsado: boolean; onNavegar?: () => void; variante?: 'lista' | 'barra' }) {
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
    variante = 'lista',
}: {
    actual: PanelSuperadmin;
    colapsado: boolean;
    onNavegar?: () => void;
    variante?: 'lista' | 'barra';
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

    const items: { clave: PanelSuperadmin; label: string; detalle?: string; href?: string; icon: LucideIcon; onClick?: () => void }[] = [
        { clave: 'superadmin', label: 'Panel de superadmin', href: `/${locale}/superadmin`, icon: ShieldCheck },
        { clave: 'recinto', label: 'Recinto portuario', href: `/${locale}/dashboard`, icon: Anchor },
        asociacion
            ? { clave: 'asociacion', label: 'Portal de asociación', detalle: asociacion.nombre_asociacion, href: `/${locale}/dashboard-recolector`, icon: Recycle }
            : actual === 'superadmin'
              ? { clave: 'asociacion', label: 'Portal de asociación', detalle: 'Elegir asociación', icon: Recycle, onClick: () => setAbierto(true) }
              : { clave: 'asociacion', label: 'Portal de asociación', detalle: 'Elegir asociación', href: elegirUrl, icon: Recycle },
    ];

    // Mismo tamaño que los items del menú lateral; violeta = superadmin (ver DISEÑO_SIMAR.md)
    const itemCls = `group flex items-center ${colapsado ? 'justify-center px-0' : 'px-4'} min-h-[54px] py-2 rounded-2xl w-full text-left transition-colors text-simar-texto-2 font-medium hover:bg-simar-violeta-suave hover:text-simar-texto`;

    if (variante === 'barra') {
        const CORTO: Record<PanelSuperadmin, string> = { superadmin: 'Superadmin', recinto: 'Recinto', asociacion: 'Portal' };
        return (
            <div
                role="group"
                aria-label="Accesos de superadmin"
                className={`flex gap-1.5 rounded-[18px] bg-simar-violeta-suave p-1.5 ${colapsado ? 'lg:flex-col' : ''}`}
            >
                {items
                    .filter((i) => i.clave !== actual)
                    .map((i) => {
                        const Icono = i.icon;
                        const titulo = `${i.label}${i.detalle ? ` · ${i.detalle}` : ''}`;
                        return (
                            <Link
                                key={i.clave}
                                href={i.href ?? elegirUrl}
                                onClick={onNavegar}
                                title={titulo}
                                aria-label={titulo}
                                className="flex-1 min-w-0 min-h-[56px] rounded-2xl flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 text-[15px] font-bold leading-tight text-simar-violeta hover:bg-simar-superficie transition-colors"
                            >
                                {/* Ícono arriba y palabra abajo: en fila, «Superadmin» no cabía */}
                                <Icono className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                                <span className={`max-w-full truncate ${colapsado ? 'lg:hidden' : ''}`}>{CORTO[i.clave]}</span>
                            </Link>
                        );
                    })}
            </div>
        );
    }

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
                    onClick={() => (actual === 'superadmin' ? setAbierto(true) : router.push(elegirUrl))}
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
