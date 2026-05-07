'use client';

import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan actual */}
                <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-100 dark:bg-emerald-900/20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Plan activo
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Renueva el 12/05/2026</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Plan Profesional</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Para empresas en crecimiento</p>

                        <ul className="mt-5 space-y-2">
                            {[
                                'Acceso a todos los puertos',
                                'Solicitudes ilimitadas',
                                'Reportes y estadísticas avanzadas',
                                'Descarga de comprobantes',
                                'Soporte prioritario',
                            ].map((b) => (
                                <li key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Plan empresarial */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
                    <Sparkles className="absolute top-4 right-4 w-20 h-20 opacity-10" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                            Recomendado
                        </span>
                        <h3 className="text-2xl font-bold mt-3">Plan Empresarial</h3>
                        <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold">$1,499</span>
                            <span className="text-sm text-gray-300">MXN/mes</span>
                        </div>

                        <ul className="mt-5 space-y-2">
                            {[
                                'Todo lo del plan Profesional',
                                'Analítica avanzada en tiempo real',
                                'API de integración',
                                'Asesoría personalizada',
                                'SLA garantizado',
                            ].map((b) => (
                                <li key={b} className="flex items-start gap-2 text-sm text-gray-200">
                                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    {b}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => toast.info('Próximamente disponible')}
                            className="mt-5 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-lg"
                        >
                            Cambiar de plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Preferencias */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Preferencias</h3>
                <div className="space-y-3">
                    <Toggle label="Notificaciones por email" defaultChecked />
                    <Toggle label="Notificaciones push" defaultChecked />
                    <Toggle label="Resumen semanal" />
                    <Toggle label="Mostrar puertos sin disponibilidad en el mapa" />
                </div>
            </div>
        </div>
    );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
    return (
        <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <span className="relative inline-flex">
                <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
                <span className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </span>
        </label>
    );
}
