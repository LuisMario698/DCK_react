'use client';

import { useFontSize } from '@/components/layout/FontSizeContext';

const OPCIONES = [
    {
        id: 'pequeño' as const,
        label: 'Pequeño',
        desc: 'Texto más compacto, más información visible',
        preview: 'Aa',
        size: 'text-sm',
    },
    {
        id: 'normal' as const,
        label: 'Normal',
        desc: 'Tamaño por defecto del sistema',
        preview: 'Aa',
        size: 'text-base',
    },
    {
        id: 'grande' as const,
        label: 'Grande',
        desc: 'Mayor legibilidad, texto más grande',
        preview: 'Aa',
        size: 'text-lg',
    },
];

export function AparienciaTab() {
    const { fontSize, setFontSize } = useFontSize();

    return (
        <div className="max-w-xl space-y-5">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">Tamaño de letra</h3>
                    <p className="text-sm text-gray-400 mt-0.5">Se aplica en todo el sistema y se guarda para tu dispositivo</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {OPCIONES.map(op => (
                        <button
                            key={op.id}
                            onClick={() => setFontSize(op.id)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                                fontSize === op.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            <span className={`block font-bold ${op.size} ${fontSize === op.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                {op.preview}
                            </span>
                            <span className={`block font-semibold mt-1 text-sm ${fontSize === op.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                {op.label}
                            </span>
                            <span className="block text-xs text-gray-400 mt-0.5">{op.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Vista previa */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Vista previa</p>
                <p className="font-bold text-gray-800 dark:text-white">Título de sección</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Este es un ejemplo de cómo se verá el texto del sistema con el tamaño seleccionado.</p>
                <div className="mt-3 flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">Etiqueta</span>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">Completado</span>
                </div>
            </div>
        </div>
    );
}
