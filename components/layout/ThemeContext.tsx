'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

/** Punto de la pantalla (px) desde donde se abre el tema nuevo: el centro del botón. */
type Origen = { x: number; y: number };

interface ThemeContextType {
    theme: Theme;
    toggleTheme: (origen?: Origen) => void;
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

    const toggleTheme = (origen?: Origen) => {
        const nuevo: Theme = theme === 'dark' ? 'light' : 'dark';
        const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Sin View Transitions (o con "reducir movimiento") el cambio es instantáneo, como antes
        if (typeof document.startViewTransition !== 'function' || reducir) {
            setTheme(nuevo);
            return;
        }

        // El tema nuevo se abre en círculo desde el botón. La clase .dark se pone dentro
        // del callback para que la "foto" nueva ya salga con el tema cambiado.
        const transicion = document.startViewTransition(() => {
            flushSync(() => setTheme(nuevo));
            document.documentElement.classList.toggle('dark', nuevo === 'dark');
        });
        const x = origen?.x ?? window.innerWidth / 2;
        const y = origen?.y ?? window.innerHeight / 2;
        const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        transicion.ready
            .then(() => {
                document.documentElement.animate(
                    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
                    { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
                );
            })
            .catch(() => {
                // Si el navegador cancela la transición, el tema ya quedó aplicado
            });
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
