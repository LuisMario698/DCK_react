'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { MODO_DEMO } from '@/lib/demo/config';

/**
 * El cliente de Supabase llega aparte (≈ 180 KB): este proveedor envuelve TODAS las páginas, también
 * la landing y Noticias, y antes lo bajaba con ellas aunque nadie hubiera iniciado sesión. Ahora se
 * pide en el acto si hay una sesión guardada (la cookie `sb-…-auth-token`) y, si no, cuando la
 * página ya está en reposo (para que iniciar sesión desde la landing siga avisando aquí).
 */
let clientePedido: Promise<SupabaseClient> | null = null;
const pedirCliente = () => (clientePedido ??= import('@/lib/supabase/client').then((m) => m.createClient()));
const haySesionGuardada = () => typeof document !== 'undefined' && /(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie);

interface AuthContextType {
    user: User | null;
    session: Session | null;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    signOut: async () => { },
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // INACTIVIDAD: a los 30 min sin tocar nada se cierra la sesión; un minuto antes sale un aviso con
    // "Sigo aquí", y al cerrarla se dice por qué. Se mide con la hora de la última actividad y no con
    // un temporizador de 30 min: con la pantalla del teléfono apagada los temporizadores se detienen,
    // y al volver la sesión seguía abierta o se cerraba de golpe sin explicación.
    useEffect(() => {
        // En la demostración no: el equipo del stand se queda quieto entre una visita y otra
        if (!user || MODO_DEMO) return;

        const LIMITE_MS = 30 * 60 * 1000;
        const AVISO_MS = 60 * 1000;
        const AVISO_ID = 'aviso-inactividad';
        let ultimaActividad = Date.now();
        let avisado = false;
        let cerrando = false;

        const actividad = () => {
            ultimaActividad = Date.now();
            if (avisado) {
                avisado = false;
                toast.dismiss(AVISO_ID);
            }
        };

        const revisar = async () => {
            if (cerrando) return;
            const quieto = Date.now() - ultimaActividad;
            if (quieto >= LIMITE_MS) {
                cerrando = true;
                toast.dismiss(AVISO_ID);
                await (await pedirCliente()).auth.signOut();
                toast.info('Cerramos tu sesión tras 30 minutos sin actividad', {
                    description: 'Si estabas capturando un manifiesto, lo escrito sigue guardado en este equipo.',
                    duration: 15000,
                });
                router.push('/');
            } else if (quieto >= LIMITE_MS - AVISO_MS && !avisado) {
                avisado = true;
                toast.warning('Tu sesión se cerrará en un minuto', {
                    id: AVISO_ID,
                    description: 'No has usado SiMAR en un rato.',
                    duration: Infinity,
                    action: { label: 'Sigo aquí', onClick: actividad },
                });
            }
        };

        const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;
        eventos.forEach((e) => document.addEventListener(e, actividad, { passive: true }));
        const intervalo = setInterval(revisar, 15_000);
        // Al volver a la pestaña o a la app, se revisa en ese momento (no hasta el siguiente intervalo)
        const alVolver = () => {
            if (!document.hidden) revisar();
        };
        document.addEventListener('visibilitychange', alVolver);

        return () => {
            clearInterval(intervalo);
            eventos.forEach((e) => document.removeEventListener(e, actividad));
            document.removeEventListener('visibilitychange', alVolver);
            toast.dismiss(AVISO_ID);
        };
    }, [user, router]);

    // OBSERVAR ESTADO DE AUTH (con el cliente que llega aparte: ver arriba)
    useEffect(() => {
        let vivo = true;
        let soltar: (() => void) | null = null;
        let cancelarEspera = () => {};
        const suscribir = () => {
            pedirCliente().then((supabase) => {
                if (!vivo) return;
                const {
                    data: { subscription },
                } = supabase.auth.onAuthStateChange((_event, session) => {
                    setSession(session);
                    setUser(session?.user ?? null);
                    setLoading(false);
                });
                soltar = () => subscription.unsubscribe();
            });
        };
        if (haySesionGuardada()) {
            suscribir();
        } else {
            // Sin sesión guardada: nadie ha iniciado sesión todavía (no hay que esperar al cliente)
            setTimeout(() => vivo && setLoading(false), 0);
            if (typeof window.requestIdleCallback === 'function') {
                const id = window.requestIdleCallback(suscribir, { timeout: 4000 });
                cancelarEspera = () => window.cancelIdleCallback(id);
            } else {
                const t = window.setTimeout(suscribir, 2000);
                cancelarEspera = () => window.clearTimeout(t);
            }
        }
        return () => {
            vivo = false;
            cancelarEspera();
            soltar?.();
        };
    }, []);

    const signOut = async () => {
        await (await pedirCliente()).auth.signOut();
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, session, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
