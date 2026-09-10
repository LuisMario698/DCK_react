'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/LoginForm';
import { Anchor, Recycle, ArrowRight, ArrowLeft, Check } from 'lucide-react';

import logoSimar from '@/assets/logo_simar.png';

type Role = 'admin' | 'recolector';

function saveRole(r: Role) {
    document.cookie = `simar_user_role=${r}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    localStorage.setItem('simar_user_role', r);
}

function clearSavedRole() {
    document.cookie = 'simar_user_role=; path=/; max-age=0; SameSite=Lax';
    localStorage.removeItem('simar_user_role');
}

function readSavedRole(): Role | null {
    const ls = localStorage.getItem('simar_user_role');
    if (ls === 'admin' || ls === 'recolector') return ls;
    return null;
}

/** Fondo compartido por las dos vistas: degradado marino con luces suaves. */
function Fondo({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#070d18] px-4 py-12 sm:px-6 lg:px-8">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/10"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-40 -right-24 h-[26rem] w-[26rem] rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/10"
            />
            <div className="relative flex min-h-[calc(100vh-6rem)] items-center justify-center">{children}</div>
        </div>
    );
}

export default function LoginPage() {
    // undefined = aún no sabemos (pre-hidratación), null = no hay rol guardado
    const [role, setRole] = useState<Role | null | undefined>(undefined);

    useEffect(() => {
        setRole(readSavedRole());
    }, []);

    if (role === undefined) {
        return (
            <Fondo>
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cyan-500 border-t-transparent" />
            </Fondo>
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
    const esRecolector = role === 'recolector';

    return (
        <Fondo>
            <div className="w-full max-w-md space-y-4">
                <button
                    type="button"
                    onClick={clearRole}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Cambiar tipo de usuario
                </button>

                <div
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-sm ${
                        esRecolector
                            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-cyan-200 bg-cyan-50/80 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300'
                    }`}
                >
                    {esRecolector ? <Recycle className="h-5 w-5 flex-shrink-0" /> : <Anchor className="h-5 w-5 flex-shrink-0" />}
                    <span>
                        Acceso como{' '}
                        <strong className="font-semibold">
                            {esRecolector ? 'Empresa Recolectora' : 'Administrador Portuario'}
                        </strong>
                    </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/40 sm:p-8">
                    <LoginForm showLogo redirectTo={redirectTo} />
                </div>

                <p className="text-center text-xs text-slate-400 dark:text-slate-600">
                    Puerto Peñasco, Sonora · Formato MARPOL Anexo V
                </p>
            </div>
        </Fondo>
    );
}

function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
    return (
        <Fondo>
            <div className="w-full max-w-3xl">
                <div className="mb-10 flex flex-col items-center text-center">
                    <Image
                        src={logoSimar}
                        alt="SiMAR"
                        priority
                        className="h-28 w-auto object-contain"
                    />

                    <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                        ¿Cómo deseas ingresar?
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Selecciona tu tipo de usuario para acceder al panel correspondiente
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <RoleCard
                        title="Administrador Portuario"
                        description="Gestiona manifiestos, embarcaciones, personal y reportes del puerto."
                        bullets={['Manifiestos digitales MARPOL', 'Control de embarcaciones', 'Estadísticas y reportes']}
                        accent="cyan"
                        Icon={Anchor}
                        onClick={() => onSelect('admin')}
                    />
                    <RoleCard
                        title="Empresa Recolectora"
                        description="Panel de seguimiento de recolecciones e impacto ambiental."
                        bullets={['Mapa del puerto', 'Solicitudes de recolección', 'Indicadores de impacto']}
                        accent="emerald"
                        Icon={Recycle}
                        badge="Vista previa"
                        onClick={() => onSelect('recolector')}
                    />
                </div>

                <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
                    El panel de Empresa Recolectora es una vista previa con datos de demostración.
                </p>
            </div>
        </Fondo>
    );
}

function RoleCard({
    title,
    description,
    bullets,
    accent,
    Icon,
    badge,
    onClick,
}: {
    title: string;
    description: string;
    bullets: string[];
    accent: 'cyan' | 'emerald';
    Icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    onClick: () => void;
}) {
    const styles =
        accent === 'cyan'
            ? {
                  hover: 'hover:border-cyan-400/70 hover:shadow-cyan-500/10 dark:hover:border-cyan-500/50',
                  iconWrap: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
                  arrow: 'text-cyan-600 dark:text-cyan-400',
                  check: 'text-cyan-600 dark:text-cyan-400',
                  ring: 'focus-visible:ring-cyan-500/40',
              }
            : {
                  hover: 'hover:border-emerald-400/70 hover:shadow-emerald-500/10 dark:hover:border-emerald-500/50',
                  iconWrap: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                  arrow: 'text-emerald-600 dark:text-emerald-400',
                  check: 'text-emerald-600 dark:text-emerald-400',
                  ring: 'focus-visible:ring-emerald-500/40',
              };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group rounded-2xl border border-slate-200 bg-white/80 p-6 text-left shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30 ${styles.hover} ${styles.ring}`}
        >
            <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconWrap}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                    {badge && (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            {badge}
                        </span>
                    )}
                    <ArrowRight
                        className={`h-5 w-5 transition-all duration-200 ${styles.arrow} opacity-0 group-hover:translate-x-1 group-hover:opacity-100`}
                    />
                </div>
            </div>

            <h3 className="mb-1.5 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{description}</p>

            <ul className="space-y-2">
                {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Check className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${styles.check}`} />
                        <span>{b}</span>
                    </li>
                ))}
            </ul>
        </button>
    );
}
