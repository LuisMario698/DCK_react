'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/auth';

interface AuthContextType {
    user: SessionUser | null;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    signOut: async () => { },
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Inactividad: 30 minutos
    useEffect(() => {
        if (!user) return;

        let timeoutId: NodeJS.Timeout;
        const TIMEOUT_DURATION = 30 * 60 * 1000;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                console.log('⏳ Sesión expirada por inactividad');
                await signOut();
            }, TIMEOUT_DURATION);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        events.forEach(event => document.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

    // Cargar sesión al montar
    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.ok ? res.json() : { user: null })
            .then(data => {
                setUser(data.user ?? null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const signOut = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
