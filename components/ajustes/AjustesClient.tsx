'use client';

import { useState } from 'react';
import { BitacoraTab } from './BitacoraTab';
import { RespaldosTab } from './RespaldosTab';

type Tab = 'bitacora' | 'respaldos';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
        id: 'bitacora',
        label: 'Bitácora',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        id: 'respaldos',
        label: 'Respaldos',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M9 11v6m6-6v6" />
            </svg>
        ),
    },
];

export function AjustesClient() {
    const [tab, setTab] = useState<Tab>('bitacora');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ajustes del sistema</h1>
                <p className="text-sm text-gray-400 mt-1">Bitácora de cambios, respaldos y programación de respaldos automáticos</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            tab === t.id
                                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === 'bitacora' && <BitacoraTab />}
            {tab === 'respaldos' && <RespaldosTab />}
        </div>
    );
}
