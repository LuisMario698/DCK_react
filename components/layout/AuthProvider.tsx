'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';

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
    const pathname = usePathname();

    // INACTIVIDAD (30 minutos)
    useEffect(() => {
        // Solo aplicar timeout si hay usuario logueado
        if (!user) return;

        let timeoutId: NodeJS.Timeout;
        const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutos

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                console.log('⏳ Sesión expirada por inactividad');
                await signOut();
            }, TIMEOUT_DURATION);
        };

        // Eventos a escuchar
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        // Configurar listeners
        const setupListeners = () => {
            events.forEach(event => document.addEventListener(event, resetTimer));
            resetTimer(); // Iniciar timer
        };

        setupListeners();

        // Limpiar
        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

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
