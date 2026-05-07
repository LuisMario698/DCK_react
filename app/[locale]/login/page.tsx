'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Anchor, Recycle, ArrowRight, ArrowLeft } from 'lucide-react';

type Role = 'admin' | 'recolector';

function saveRole(r: Role) {
    document.cookie = `dck_user_role=${r}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    localStorage.setItem('dck_user_role', r);
}

function clearSavedRole() {
    document.cookie = 'dck_user_role=; path=/; max-age=0; SameSite=Lax';
    localStorage.removeItem('dck_user_role');
}

function readSavedRole(): Role | null {
    const ls = localStorage.getItem('dck_user_role');
    if (ls === 'admin' || ls === 'recolector') return ls;
    return null;
}

export default function LoginPage() {
    // undefined = aún no sabemos (pre-hidratación), null = no hay rol guardado
    const [role, setRole] = useState<Role | null | undefined>(undefined);

    useEffect(() => {
        setRole(readSavedRole()); // se ejecuta una sola vez tras montar, sin flash
    }, []);

    // Mientras no sepamos el rol (SSR / pre-hidratación) mostramos loader
    if (role === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const selectRole = (r: Role) => {
        saveRole(r);
        setRole(r);
    };

    const clearRole = () => {
        clearSavedRole();
        setRole(null);
    };

    if (role === null) {
        return <RoleSelector onSelect={selectRole} />;
    }

    const redirectTo = role === 'recolector' ? '/dashboard-recolector' : '/dashboard';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-4">
                <button
                    type="button"
                    onClick={clearRole}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Cambiar tipo de usuario
                </button>

                <div className={`rounded-lg px-4 py-3 text-sm font-medium border flex items-center gap-3 ${
                    role === 'recolector'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                }`}>
                    {role === 'recolector' ? <Recycle className="w-5 h-5" /> : <Anchor className="w-5 h-5" />}
                    <span>
                        Acceso como{' '}
                        <strong>{role === 'recolector' ? 'Empresa Recolectora' : 'Administrador Portuario'}</strong>
                    </span>
                </div>

                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
                    <LoginForm showLogo={true} redirectTo={redirectTo} />
                </div>
            </div>
        </div>
    );
}

function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-blue-900 dark:text-white tracking-tight">SiMAR</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 tracking-widest uppercase">Sistema Integral de Manejo Ambiental de Residuos</p>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
                        ¿Cómo deseas ingresar?
                    </h2>
                    <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
                        Selecciona tu tipo de usuario para acceder al panel correspondiente
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RoleCard
                        title="Administrador Portuario"
                        description="Gestiona manifiestos, embarcaciones, personal y reportes del puerto."
                        bullets={['Manifiestos digitales', 'Control de embarcaciones', 'Estadísticas operativas']}
                        accent="blue"
                        Icon={Anchor}
                        onClick={() => onSelect('admin')}
                    />
                    <RoleCard
                        title="Empresa Recolectora"
                        description="Consulta residuos disponibles, solicita recolecciones y mide tu impacto."
                        bullets={['Mapa de residuos en tiempo real', 'Solicitudes de recolección', 'Impacto ambiental']}
                        accent="emerald"
                        Icon={Recycle}
                        onClick={() => onSelect('recolector')}
                    />
                </div>
            </div>
        </div>
    );
}

function RoleCard({
    title,
    description,
    bullets,
    accent,
    Icon,
    onClick,
}: {
    title: string;
    description: string;
    bullets: string[];
    accent: 'blue' | 'emerald';
    Icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
}) {
    const styles =
        accent === 'blue'
            ? {
                  ring: 'hover:border-blue-500 hover:shadow-blue-500/10',
                  iconWrap: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  arrow: 'text-blue-600 dark:text-blue-400',
                  bullet: 'text-blue-600 dark:text-blue-400',
              }
            : {
                  ring: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
                  iconWrap: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                  arrow: 'text-emerald-600 dark:text-emerald-400',
                  bullet: 'text-emerald-600 dark:text-emerald-400',
              };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-lg ${styles.ring} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${styles.iconWrap}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <ArrowRight className={`w-5 h-5 ${styles.arrow} opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
            <ul className="space-y-1.5">
                {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full ${styles.bullet} bg-current flex-shrink-0`} />
                        <span>{b}</span>
                    </li>
                ))}
            </ul>
        </button>
    );
}
