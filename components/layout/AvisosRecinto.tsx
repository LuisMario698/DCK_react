'use client';

/**
 * Avisos del recinto: la base de datos ya los genera para el administrador (una empresa pidió una
 * recolección, o la canceló), pero el recinto no tenía dónde verlos. Aquí:
 * - AvisosRecintoProvider: una sola consulta y una sola suscripción en tiempo real para todo el
 *   recinto (la campana del celular y la del menú lateral están montadas a la vez).
 * - CampanaMovil: en la píldora de arriba (celular y tableta).
 * - CampanaMenu: renglón "Avisos" del menú lateral (computadora).
 * - PanelAvisos: la lista; en computadora flota junto al menú, en celular sube como hoja.
 * Cada aviso lleva a Asociaciones (abre en Solicitudes). Un aviso nuevo en vivo también sale como
 * mensaje emergente y el número de la campana entra con un pulso (simar-confirma).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, CheckCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    contarNotificacionesNoLeidas,
    getNotificaciones,
    marcarNotificacionesLeidas,
    perteneceAlcance,
    suscribirNotificaciones,
    type AlcanceNotificaciones,
} from '@/lib/services/notificaciones';
import type { Notificacion } from '@/types/database';
import { NotifIcon } from '@/components/recolector/NotifIcon';
import { tiempoRelativo } from '@/lib/constants/residuos';
import { Esqueleto, usePresencia } from '@/components/ui/movimiento';
import { HojaInferior } from './HojaInferior';

const ALCANCE: AlcanceNotificaciones = { destinatario: 'admin' };

interface ContextoAvisos {
    /** null mientras no se ha abierto la lista por primera vez */
    avisos: Notificacion[] | null;
    noLeidos: number;
    error: boolean;
    abierto: boolean;
    alternar: () => void;
    cerrar: () => void;
    marcarTodos: () => void;
    abrirAviso: (n: Notificacion) => void;
}

const Contexto = createContext<ContextoAvisos | null>(null);

export function useAvisosRecinto() {
    const c = useContext(Contexto);
    if (!c) throw new Error('useAvisosRecinto va dentro de AvisosRecintoProvider');
    return c;
}

export function AvisosRecintoProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const locale = usePathname().split('/')[1] || 'es';
    const [avisos, setAvisos] = useState<Notificacion[] | null>(null);
    const [noLeidos, setNoLeidos] = useState(0);
    const [error, setError] = useState(false);
    const [abierto, setAbierto] = useState(false);
    const destino = `/${locale}/dashboard/asociaciones`;
    const destinoRef = useRef(destino);
    useEffect(() => {
        destinoRef.current = destino;
    }, [destino]);

    const cargarLista = useCallback(async () => {
        try {
            const [lista, n] = await Promise.all([getNotificaciones(20, ALCANCE), contarNotificacionesNoLeidas(ALCANCE)]);
            setAvisos(lista);
            setNoLeidos(n);
            setError(false);
        } catch (e) {
            console.error('Error cargando avisos:', e);
            setError(true);
        }
    }, []);

    // Al entrar: sólo el número (la lista se pide al abrirla). Después, lo nuevo llega en vivo.
    useEffect(() => {
        let vigente = true;
        contarNotificacionesNoLeidas(ALCANCE)
            .then((n) => vigente && setNoLeidos(n))
            .catch((e) => console.error('Error contando avisos:', e));
        const quitar = suscribirNotificaciones((n) => {
            if (!perteneceAlcance(n, ALCANCE)) return;
            setAvisos((lista) => (lista ? [n, ...lista.filter((a) => a.id !== n.id)].slice(0, 20) : lista));
            if (!n.leida) setNoLeidos((c) => c + 1);
            toast(n.titulo, {
                description: n.detalle ?? undefined,
                action: { label: 'Ver', onClick: () => router.push(destinoRef.current) },
            });
        });
        return () => {
            vigente = false;
            quitar();
        };
    }, [router]);

    const alternar = () => {
        // Cada vez que se abre, la lista se pide de nuevo (por si algo cambió desde otra pestaña)
        if (!abierto) cargarLista();
        setAbierto(!abierto);
    };
    const cerrar = useCallback(() => setAbierto(false), []);

    const marcarTodos = () => {
        const antes = { avisos, noLeidos };
        setAvisos((lista) => lista?.map((a) => ({ ...a, leida: true })) ?? lista);
        setNoLeidos(0);
        marcarNotificacionesLeidas().catch((e) => {
            console.error('Error marcando avisos:', e);
            setAvisos(antes.avisos);
            setNoLeidos(antes.noLeidos);
            toast.error('No se pudieron marcar como leídos. Inténtalo de nuevo.');
        });
    };

    const abrirAviso = (n: Notificacion) => {
        if (!n.leida) {
            setAvisos((lista) => lista?.map((a) => (a.id === n.id ? { ...a, leida: true } : a)) ?? lista);
            setNoLeidos((c) => Math.max(0, c - 1));
            marcarNotificacionesLeidas([n.id]).catch((e) => console.error('Error marcando aviso:', e));
        }
        setAbierto(false);
        router.push(destino);
    };

    return (
        <Contexto.Provider value={{ avisos, noLeidos, error, abierto, alternar, cerrar, marcarTodos, abrirAviso }}>
            {children}
        </Contexto.Provider>
    );
}

/** Número de avisos sin leer sobre la campana. Con la clave, entra de nuevo (pulso) cada vez que cambia. */
function Contador({ n, className }: { n: number; className: string }) {
    if (n <= 0) return null;
    return (
        <span key={n} aria-hidden="true" className={`simar-confirma min-w-[20px] h-5 px-1 rounded-full bg-[#A63F0E] text-white text-[12px] font-bold flex items-center justify-center ${className}`}>
            {n > 9 ? '9+' : n}
        </span>
    );
}

const etiquetaCampana = (n: number) => `Avisos${n ? ` (${n} sin leer)` : ''}`;

/** Campana de la píldora de arriba (celular y tableta) */
export function CampanaMovil() {
    const { noLeidos, abierto, alternar } = useAvisosRecinto();
    return (
        <button
            type="button"
            onClick={alternar}
            aria-label={etiquetaCampana(noLeidos)}
            aria-expanded={abierto}
            title="Avisos"
            className="simar-presiona relative w-[52px] h-[52px] flex-shrink-0 rounded-full hover:bg-simar-texto/5 dark:hover:bg-white/10 text-simar-texto flex items-center justify-center"
        >
            <Bell className="w-6 h-6" />
            <Contador n={noLeidos} className="absolute top-1 right-1 ring-2 ring-simar-superficie" />
        </button>
    );
}

/** Renglón "Avisos" del menú lateral (computadora); colapsado queda sólo la campana */
export function CampanaMenu({ colapsado }: { colapsado: boolean }) {
    const { noLeidos, abierto, alternar } = useAvisosRecinto();
    return (
        <button
            type="button"
            onClick={alternar}
            aria-label={etiquetaCampana(noLeidos)}
            aria-expanded={abierto}
            title={colapsado ? 'Avisos' : ''}
            className={`hidden lg:flex items-center gap-3.5 min-h-[54px] rounded-2xl text-simar-texto transition-colors ${
                abierto ? 'bg-simar-superficie shadow-simar' : 'hover:bg-white/60 dark:hover:bg-white/10'
            } ${colapsado ? 'lg:justify-center lg:px-0' : 'px-4'}`}
        >
            <span className="relative flex-shrink-0">
                <Bell className="w-6 h-6" />
                {colapsado && <Contador n={noLeidos} className="absolute -top-2.5 -right-3 ring-2 ring-simar-superficie" />}
            </span>
            <span className={`flex-1 text-left text-lg font-semibold leading-tight ${colapsado ? 'lg:hidden' : ''}`}>Avisos</span>
            {!colapsado && <Contador n={noLeidos} className="" />}
        </button>
    );
}

const CONSULTA_COMPUTADORA = '(min-width: 1024px)';
function suscribirAncho(avisar: () => void) {
    const consulta = window.matchMedia(CONSULTA_COMPUTADORA);
    consulta.addEventListener('change', avisar);
    return () => consulta.removeEventListener('change', avisar);
}
/** ¿Pantalla de computadora? (el menú lateral está a la vista desde 1024 px) */
function useEsComputadora() {
    return useSyncExternalStore(suscribirAncho, () => window.matchMedia(CONSULTA_COMPUTADORA).matches, () => false);
}

/** La lista de avisos: panel junto al menú en computadora, hoja inferior en celular */
export function PanelAvisos({ colapsado }: { colapsado: boolean }) {
    const { abierto, cerrar } = useAvisosRecinto();
    // Sólo uno de los dos se abre: la hoja bloquea el desplazamiento de la página y toma el foco,
    // y en computadora no se ve
    const computadora = useEsComputadora();
    const { montado, saliendo } = usePresencia(abierto && computadora, 180);
    const panelRef = useRef<HTMLDivElement>(null);

    // Computadora: Escape o un clic fuera lo cierran
    useEffect(() => {
        if (!abierto) return;
        const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
        const alPulsar = (e: PointerEvent) => {
            const t = e.target as HTMLElement;
            if (!window.matchMedia('(min-width: 1024px)').matches) return;
            if (panelRef.current?.contains(t) || t.closest('[aria-label^="Avisos"]')) return;
            cerrar();
        };
        window.addEventListener('keydown', alTeclear);
        window.addEventListener('pointerdown', alPulsar);
        return () => {
            window.removeEventListener('keydown', alTeclear);
            window.removeEventListener('pointerdown', alPulsar);
        };
    }, [abierto, cerrar]);

    return (
        <>
            {montado && (
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-label="Avisos"
                    className={`${saliendo ? 'simar-ventana-sale' : 'simar-ventana'} hidden lg:flex fixed z-[55] bottom-4 w-[420px] max-h-[min(640px,calc(100dvh-32px))] flex-col rounded-[26px] bg-simar-superficie border border-simar-borde shadow-[0_24px_60px_-24px_rgba(11,34,54,0.55)] ${
                        colapsado ? 'left-[120px]' : 'left-[308px]'
                    }`}
                >
                    <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
                        <h2 className="text-[22px] font-extrabold text-simar-texto">Avisos</h2>
                        <button
                            type="button"
                            onClick={cerrar}
                            aria-label="Cerrar avisos"
                            className="w-11 h-11 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto flex items-center justify-center"
                        >
                            <X className="w-[22px] h-[22px]" />
                        </button>
                    </div>
                    <div className="overflow-y-auto overscroll-contain px-3 pb-3">
                        <ListaAvisos />
                    </div>
                </div>
            )}
            <div className="lg:hidden">
                <HojaInferior abierto={abierto && !computadora} onCerrar={cerrar} etiqueta="Avisos">
                    <h2 className="px-1 pb-2 text-[20px] font-extrabold text-simar-texto">Avisos</h2>
                    <ListaAvisos />
                </HojaInferior>
            </div>
        </>
    );
}

function ListaAvisos() {
    const { avisos, noLeidos, error, marcarTodos, abrirAviso } = useAvisosRecinto();

    if (error && !avisos) {
        return <p className="px-2 py-8 text-center text-[17px] text-simar-texto-2 movil:text-[15px]">No se pudieron cargar los avisos. Revisa tu conexión.</p>;
    }
    if (!avisos) {
        return (
            <div role="status" aria-label="Cargando avisos" className="space-y-2 p-1">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                        <Esqueleto className="w-11 h-11 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Esqueleto className="h-4 w-3/4" />
                            <Esqueleto className="h-3.5 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    if (avisos.length === 0) {
        return (
            <div className="px-3 py-10 text-center movil:py-8">
                <span className="mx-auto w-14 h-14 rounded-full bg-simar-papel text-simar-texto-2 flex items-center justify-center">
                    <Bell className="w-7 h-7" />
                </span>
                <p className="mt-3 text-lg font-bold text-simar-texto movil:text-[16px]">Sin avisos</p>
                <p className="mt-1 text-[17px] text-simar-texto-2 movil:text-[14px]">
                    Aquí verás cuando una empresa recolectora pida o cancele una recolección.
                </p>
            </div>
        );
    }
    return (
        <div>
            {noLeidos > 0 && (
                <button
                    type="button"
                    onClick={marcarTodos}
                    className="simar-presiona mb-1 ml-auto flex items-center gap-2 min-h-[44px] px-3 rounded-xl text-[15px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave"
                >
                    <CheckCheck className="w-5 h-5" />
                    Marcar todo como leído
                </button>
            )}
            <ul className="space-y-1">
                {avisos.map((n, i) => (
                    <li key={n.id} className="simar-aparece" style={{ animationDelay: `${Math.min(i, 6) * 0.03}s` }}>
                        <button
                            type="button"
                            onClick={() => abrirAviso(n)}
                            className={`w-full text-left flex items-start gap-3 rounded-2xl p-2.5 transition-colors ${
                                n.leida ? 'hover:bg-simar-papel' : 'bg-simar-marea-suave/60 hover:bg-simar-marea-suave'
                            }`}
                        >
                            <NotifIcon tipo={n.tipo} />
                            <span className="flex-1 min-w-0">
                                <span className={`block text-[17px] leading-snug text-simar-texto movil:text-[15px] ${n.leida ? 'font-medium' : 'font-bold'}`}>{n.titulo}</span>
                                {n.detalle && <span className="block text-[15px] leading-snug text-simar-texto-2 movil:text-[13.5px]">{n.detalle}</span>}
                                <span className="block mt-0.5 text-[14px] text-simar-texto-2 movil:text-[12.5px]">{tiempoRelativo(n.created_at)}</span>
                            </span>
                            {!n.leida && <span aria-label="Sin leer" className="mt-2 w-2.5 h-2.5 flex-shrink-0 rounded-full bg-[#A63F0E]" />}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
