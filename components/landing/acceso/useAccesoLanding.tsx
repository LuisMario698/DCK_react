'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Anchor, ArrowLeft, ArrowRight, Loader2, Recycle, SquareTerminal, X } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { usePresencia } from '@/components/ui/movimiento';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { MODO_DEMO, URL_DEMO } from '@/lib/demo/config';

// El formulario de acceso (con el registro y la recuperación de contraseña) se baja al abrir la
// ventana, no con la landing: sólo hace falta para entrar, y en la demostración ni se abre
const cargarLoginForm = () => import('@/components/auth/LoginForm').then((m) => m.LoginForm);
const LoginForm = dynamic(cargarLoginForm, {
    ssr: false,
    loading: () => (
        <div className="min-h-[320px] flex items-center justify-center text-simar-texto-2" role="status" aria-label="Cargando">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    ),
});

type RolGuardado = 'admin' | 'recolector';
// 'superadmin' = acceso de desarrollador (enlace discreto del footer, o /es/superadmin sin sesión);
// no se ofrece en el selector ni se recuerda.
type ModalRole = RolGuardado | 'superadmin';

const DESTINO_POR_ROL: Record<ModalRole, string> = {
    admin: '/dashboard',
    recolector: '/dashboard-recolector',
    superadmin: '/superadmin',
};

// Sólo recuerda la opción elegida en el modal. El acceso real lo decide
// `profiles.rol` en el middleware (utils/supabase/middleware.ts).
function saveRole(r: RolGuardado) {
    document.cookie = `simar_user_role=${r}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    localStorage.setItem('simar_user_role', r);
}

function readSavedRole(): RolGuardado | null {
    try {
        const v = localStorage.getItem('simar_user_role');
        return v === 'admin' || v === 'recolector' ? v : null;
    } catch {
        return null;
    }
}

function ModalRoleCard({
    title,
    desc,
    accent,
    Icon,
    onClick,
}: {
    title: string;
    desc: string;
    accent: 'blue' | 'emerald';
    Icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
}) {
    const s =
        accent === 'blue'
            ? { wrap: 'hover:border-simar-marea-tinta', icon: 'bg-simar-marea-suave text-simar-marea-tinta', arrow: 'text-simar-marea-tinta' }
            : { wrap: 'hover:border-simar-arrecife', icon: 'bg-simar-arrecife-suave text-simar-arrecife-tinta', arrow: 'text-simar-arrecife-tinta' };
    return (
        <button
            type="button"
            onClick={onClick}
            // En celular es un renglón: ícono, título y descripción, y la flecha a la derecha. En computadora
            // "Continuar" va al pie (mt-auto) y queda a la misma altura en las dos tarjetas
            className={`group text-left w-full rounded-3xl border-2 border-simar-borde bg-simar-superficie p-5 md:p-6 flex flex-col gap-2.5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 movil:grid movil:grid-cols-[auto_1fr_auto] movil:items-center movil:gap-x-3 movil:gap-y-0.5 movil:p-4 movil:rounded-[20px] ${s.wrap}`}
        >
            <span className={`w-14 h-14 rounded-full flex items-center justify-center movil:w-12 movil:h-12 movil:row-span-2 ${s.icon}`}>
                <Icon className="w-7 h-7 movil:w-6 movil:h-6" />
            </span>
            <span className="text-xl md:text-[21px] font-extrabold text-simar-texto movil:text-[17px] movil:leading-tight">{title}</span>
            <span className="text-[17px] leading-snug text-simar-texto-2 movil:col-start-2 movil:text-[15px]">{desc}</span>
            <span className={`mt-auto pt-1 flex items-center gap-1.5 text-[17px] font-bold movil:mt-0 movil:pt-0 movil:col-start-3 movil:row-start-1 movil:row-span-2 ${s.arrow}`}>
                <span className="movil:sr-only">Continuar</span> <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-0.5 transition-transform movil:w-[22px] movil:h-[22px]" />
            </span>
        </button>
    );
}

/**
 * La ventana de "Iniciar sesión" de la landing (elegir tipo de usuario y luego el formulario), para
 * las dos versiones de la página. Devuelve cómo abrirla y la ventana ya armada, que se pone al
 * final de la página. También abre sola con ?login=1 (el middleware manda aquí cuando se pide una
 * pantalla con sesión) y vuelve a ?siguiente= al entrar.
 *
 * `rutaDemo`: la demostración (supabase/demo/README.md). En su despliegue los botones de acceso
 * llevan a ella; en producción, si existe, se ofrece aparte.
 */
export function useAccesoLanding() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    // null = mostrar selector, 'admin'/'recolector' = ir directo al form
    const [modalRole, setModalRole] = useState<ModalRole | null>(null);
    // Página protegida que se pidió sin sesión (?siguiente=...), para volver tras el login
    const [siguiente, setSiguiente] = useState<string | null>(null);
    // La ventana de acceso se queda montada mientras hace su salida
    const ventanaAcceso = usePresencia(showLoginModal, 200);
    const accesoRef = useRef<HTMLDivElement>(null);

    const { locale } = useParams<{ locale: string }>();
    const rutaDemo = MODO_DEMO ? `/${locale}/demo` : URL_DEMO ? `${URL_DEMO}/${locale}/demo` : null;

    /** `rol` abre directo en el formulario de ese tipo de usuario (p. ej. "Registrar mi empresa") */
    const abrirAcceso = (rol?: RolGuardado) => {
        if (MODO_DEMO && rutaDemo) {
            window.location.assign(rutaDemo);
            return;
        }
        setModalRole(rol ?? readSavedRole()); // null si no hay guardado → selector
        setShowLoginModal(true);
    };

    // El middleware manda aquí con ?login=1 cuando se pide /dashboard sin sesión.
    // Solo abrimos el modal: NO tocamos la URL aquí, porque un replaceState en el
    // mismo commit provoca un re-render que descartaba el estado y el modal no salía.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === '1') {
            // Sólo rutas internas: evita redirecciones abiertas a otros dominios
            const param = params.get('siguiente');
            const destino = param && /^\/(?!\/)[\w\-/]*$/.test(param) ? param : null;
            // Si se pidió el panel de superadmin, el modal abre directo en el acceso de desarrollador
            // eslint-disable-next-line react-hooks/set-state-in-effect -- la URL sólo existe en el navegador
            setModalRole(destino && /^\/(\w{2}\/)?superadmin(\/|$)/.test(destino) ? 'superadmin' : readSavedRole());
            setShowLoginModal(true);
            if (destino) setSiguiente(destino);
        }
    }, []);

    const abrirAccesoDesarrollador = () => {
        setModalRole('superadmin');
        setShowLoginModal(true);
    };

    const cerrarLoginModal = () => {
        setShowLoginModal(false);
        // Ya con el modal cerrado, quitamos el parámetro para que un refresco no lo reabra.
        const params = new URLSearchParams(window.location.search);
        if (params.has('login')) {
            params.delete('login');
            const qs = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
        }
    };

    // Foco adentro al abrir, Tab no se sale y al cerrar regresa al botón "Iniciar sesión". Escape la
    // cierra, como todas las ventanas de SiMAR, y en celular (donde sube como hoja) también jalarla
    const cerrarLoginRef = useRef(cerrarLoginModal);
    useEffect(() => {
        cerrarLoginRef.current = cerrarLoginModal;
    });
    useVentanaAccesible(accesoRef, showLoginModal, { alEscape: () => cerrarLoginRef.current() });

    const selectModalRole = (r: RolGuardado) => {
        saveRole(r);
        setModalRole(r);
    };

    useEffect(() => {
        if (showLoginModal) {
            // Mientras se elige el tipo de usuario, ya se va bajando el formulario
            void cargarLoginForm();
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [showLoginModal]);

    // Login Modal: entra y sale (usePresencia); cada paso entra con simar-ventana
    const ventana = ventanaAcceso.montado ? (
        <div
            ref={accesoRef}
            tabIndex={-1}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Iniciar sesión"
        >
            <div
                className={`${ventanaAcceso.saliendo ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 bg-[rgba(11,34,54,0.42)] backdrop-blur-[6px]`}
                onClick={cerrarLoginModal}
            />

            {/* PASO 1 — Selector de rol */}
            {modalRole === null && (
                <div className={`${ventanaAcceso.saliendo ? 'simar-ventana-sale' : 'simar-ventana'} simar-vidrio-fuerte relative w-full max-w-[640px] rounded-[34px] p-7 md:p-9 movil:p-5 movil:pt-6`}>
                    <button
                        onClick={cerrarLoginModal}
                        className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto flex items-center justify-center transition-colors z-10"
                        aria-label="Cerrar"
                    >
                        <X className="w-[22px] h-[22px]" />
                    </button>
                    <div className="text-center">
                        <LogoSimar variante="simbolo" tamano={64} />
                        <h2 className="mt-2 text-[28px] md:text-[32px] font-extrabold text-simar-texto movil:mt-1 movil:text-[22px]">¿Cómo deseas ingresar?</h2>
                        <p className="mt-1.5 text-lg text-simar-texto-2 movil:mt-0.5 movil:text-[15px]">Selecciona tu tipo de usuario</p>
                    </div>
                    <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4 movil:mt-5 movil:gap-2.5">
                        <ModalRoleCard
                            title="Administrador Portuario"
                            desc="Manifiestos, embarcaciones y estadísticas del puerto."
                            accent="blue"
                            Icon={Anchor}
                            onClick={() => selectModalRole('admin')}
                        />
                        <ModalRoleCard
                            title="Empresa Recolectora"
                            desc="Residuos disponibles, solicitudes de recolección, historial e impacto."
                            accent="emerald"
                            Icon={Recycle}
                            onClick={() => selectModalRole('recolector')}
                        />
                    </div>
                </div>
            )}

            {/* PASO 2 — Formulario de login */}
            {modalRole !== null && (
                <div className={`${ventanaAcceso.saliendo ? 'simar-ventana-sale' : 'simar-ventana'} simar-vidrio-fuerte relative w-full max-w-[520px] rounded-[34px] p-7 md:p-9 movil:p-5 movil:pt-6`}>
                    <button
                        onClick={cerrarLoginModal}
                        className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto flex items-center justify-center transition-colors z-10"
                        aria-label="Cerrar"
                    >
                        <X className="w-[22px] h-[22px]" />
                    </button>
                    {/* Rol elegido + volver (pr-14: deja libre el botón de cerrar) */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pr-14">
                        {modalRole !== 'superadmin' && (
                            <button
                                onClick={() => setModalRole(null)}
                                className="min-h-[48px] px-3.5 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto text-[17px] font-bold flex items-center gap-2 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Cambiar
                            </button>
                        )}
                        <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-base font-bold ${
                            modalRole === 'recolector'
                                ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta'
                                : modalRole === 'superadmin'
                                    ? 'bg-simar-violeta-suave text-simar-violeta'
                                    : 'bg-simar-marea-suave text-simar-marea-tinta'
                        }`}>
                            {modalRole === 'recolector'
                                ? <><Recycle className="w-[18px] h-[18px]" /> Empresa Recolectora</>
                                : modalRole === 'superadmin'
                                    ? <><SquareTerminal className="w-[18px] h-[18px]" /> Acceso de desarrollador</>
                                    : <><Anchor className="w-[18px] h-[18px]" /> Administrador Portuario</>
                            }
                        </span>
                    </div>
                    <LoginForm
                        showLogo={true}
                        // El desarrollador no se registra aquí: su cuenta ya existe y se marca como superadmin en la BD
                        permitirRegistro={modalRole !== 'superadmin'}
                        redirectTo={siguiente ?? DESTINO_POR_ROL[modalRole]}
                        // Tras iniciar sesión sólo se oculta el modal: tocar la URL aquí
                        // (replaceState de cerrarLoginModal) cancelaba la navegación
                        // al panel y el usuario se quedaba en la landing.
                        onSuccess={() => setShowLoginModal(false)}
                    />
                </div>
            )}
        </div>
    ) : null;

    return { abrirAcceso, abrirAccesoDesarrollador, rutaDemo, ventana };
}
