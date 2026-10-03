'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';
import { MODO_DEMO } from '@/lib/demo/config';

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
    const supabase = createClient();

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
                await supabase.auth.signOut();
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
    }, [user, supabase, router]);

    // OBSEVAR ESTADO DE AUTH
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, session, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
