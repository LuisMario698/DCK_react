'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light'); // Diseño SiMAR: claro por defecto (ver DISEÑO_SIMAR.md)
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Recuperar tema guardado
        try {
            const savedTheme = localStorage.getItem('theme') as Theme | null;
            if (savedTheme) {
                setTheme(savedTheme);
                // Aplicar clase inmediatamente
                if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } else {
                setTheme('light');
                document.documentElement.classList.remove('dark');
            }
        } catch (e) {
            console.error('Error accessing localStorage:', e);
            setTheme('light');
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            const root = document.documentElement;
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            localStorage.setItem('theme', theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Renderizamos el Provider SIEMPRE para evitar errores en childrens que usen el hook.
    // Solo evitamos mostrar el contenido si es crítico para el layout shift, 
    // pero para una app dashboard es mejor mostrar contenido y que el tema se ajuste.
    // Si mounted es false, usamos el valor por defecto ('light') que es seguro porque es el estado inicial.

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {/* 
        Usamos "suppressHydrationWarning" en el html/body generalmente, 
        pero aquí renderizamos los children directamente. 
        Si hay discrepancia de tema inicial, React la corregirá en el useEffect.
      */}
            {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
