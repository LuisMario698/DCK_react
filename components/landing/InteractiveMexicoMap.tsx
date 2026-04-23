'use client';

import { useState } from 'react';

type PortStatus = 'active' | 'future';

interface Port {
    id: string;
    name: string;
    state: string;
    status: PortStatus;
    description: string;
    x: number; // viewBox coordinate (0–1000)
    y: number; // viewBox coordinate (0–600)
}

const PORTS: Port[] = [
    {
        id: 'puerto-penasco',
        name: 'Puerto Peñasco',
        state: 'Sonora',
        status: 'active',
        description: 'Puerto pionero. Sistema en operación digitalizando manifiestos desde 2024 con SEMARNAT.',
        x: 139,
        y: 53,
    },
    {
        id: 'guaymas',
        name: 'Guaymas',
        state: 'Sonora',
        status: 'future',
        description: 'Flota pesquera de gran escala. Candidato prioritario para expansión regional.',
        x: 222,
        y: 160,
    },
    {
        id: 'ensenada',
        name: 'Ensenada',
        state: 'Baja California',
        status: 'future',
        description: 'Puerto de clase mundial en el Pacífico con alto volumen de embarcaciones.',
        x: 43,
        y: 50,
    },
    {
        id: 'la-paz',
        name: 'La Paz',
        state: 'Baja California Sur',
        status: 'future',
        description: 'Centro pesquero del Mar de Cortés con ecosistemas protegidos.',
        x: 240,
        y: 280,
    },
    {
        id: 'mazatlan',
        name: 'Mazatlán',
        state: 'Sinaloa',
        status: 'future',
        description: 'Uno de los principales puertos pesqueros del Pacífico mexicano.',
        x: 362,
        y: 308,
    },
    {
        id: 'manzanillo',
        name: 'Manzanillo',
        state: 'Colima',
        status: 'future',
        description: 'Puerto comercial y pesquero estratégico del Pacífico central.',
        x: 428,
        y: 440,
    },
    {
        id: 'acapulco',
        name: 'Acapulco',
        state: 'Guerrero',
        status: 'future',
        description: 'Bahía histórica con flota ribereña y de altura.',
        x: 568,
        y: 510,
    },
    {
        id: 'veracruz',
        name: 'Veracruz',
        state: 'Veracruz',
        status: 'future',
        description: 'Puerto más antiguo de América continental, con enorme potencial de expansión.',
        x: 683,
        y: 436,
    },
    {
        id: 'progreso',
        name: 'Progreso',
        state: 'Yucatán',
        status: 'future',
        description: 'Puerta al Golfo de México y al Caribe mexicano.',
        x: 885,
        y: 370,
    },
];

// Stylized simplified outline of Mexico (mainland)
const MAINLAND_PATH =
    'M140,40 Q230,28 330,32 Q420,35 475,48 Q520,60 540,100 Q555,160 562,220 Q572,290 600,350 Q635,410 690,440 Q735,470 780,485 Q830,475 880,430 Q925,380 955,350 Q945,390 915,430 Q875,465 830,485 Q780,510 735,535 Q680,550 625,545 Q565,535 520,510 Q470,480 425,460 Q380,435 355,400 Q340,360 345,320 Q340,280 320,245 Q290,215 255,195 Q220,175 200,145 Q180,105 165,75 Q150,55 140,40 Z';

// Stylized Baja California peninsula
const BAJA_PATH =
    'M62,40 Q40,55 50,90 Q70,130 105,165 Q140,200 175,230 Q210,255 240,280 Q265,300 278,320 Q270,335 255,328 Q225,305 195,275 Q160,245 130,215 Q95,175 75,135 Q55,95 55,65 Q58,48 62,40 Z';

// Yucatán peninsula tip (visual separation)
const YUCATAN_PATH =
    'M860,330 Q900,310 940,320 Q955,345 945,380 Q930,410 905,425 Q885,420 875,400 Q865,370 860,330 Z';

export function InteractiveMexicoMap() {
    const [activePort, setActivePort] = useState<string | null>('puerto-penasco');
    const activePortData = PORTS.find((p) => p.id === activePort) ?? null;
    const activeCount = PORTS.filter((p) => p.status === 'active').length;
    const futureCount = PORTS.filter((p) => p.status === 'future').length;

    return (
        <div className="w-full">
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10 items-center">
                {/* Mapa */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 shadow-2xl p-4 sm:p-8">
                    {/* Brillo decorativo */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-40 pointer-events-none"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 30%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 70%, rgba(34,211,238,0.15), transparent 60%)',
                        }}
                    />

                    <svg
                        viewBox="0 0 1000 600"
                        className="w-full h-auto relative z-10"
                        role="img"
                        aria-label="Mapa de México con puertos donde el sistema está implementado o podría expandirse"
                    >
                        <defs>
                            <linearGradient id="land-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.85" />
                                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                            </linearGradient>
                            <linearGradient id="land-border" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
                            </linearGradient>
                            <radialGradient id="active-glow">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        {/* Cuadrícula sutil */}
                        <g opacity="0.08" stroke="#60a5fa" strokeWidth="0.5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="600" />
                            ))}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <line key={`h-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} />
                            ))}
                        </g>

                        {/* Mar decorativo */}
                        <g opacity="0.25">
                            <path
                                d="M0,400 Q250,380 500,400 T1000,400 L1000,600 L0,600 Z"
                                fill="#0891b2"
                                opacity="0.2"
                            />
                        </g>

                        {/* Tierra */}
                        <g>
                            <path
                                d={MAINLAND_PATH}
                                fill="url(#land-gradient)"
                                stroke="url(#land-border)"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                            />
                            <path
                                d={BAJA_PATH}
                                fill="url(#land-gradient)"
                                stroke="url(#land-border)"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                            />
                            <path
                                d={YUCATAN_PATH}
                                fill="url(#land-gradient)"
                                stroke="url(#land-border)"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                            />
                        </g>

                        {/* Líneas de conexión desde el puerto activo */}
                        {activePortData?.status === 'active' &&
                            PORTS.filter((p) => p.status === 'future').map((port) => (
                                <line
                                    key={`line-${port.id}`}
                                    x1={activePortData.x}
                                    y1={activePortData.y}
                                    x2={port.x}
                                    y2={port.y}
                                    stroke="#22d3ee"
                                    strokeWidth="1"
                                    strokeDasharray="3 6"
                                    opacity="0.35"
                                />
                            ))}

                        {/* Marcadores */}
                        {PORTS.map((port, i) => {
                            const isActive = port.status === 'active';
                            const isSelected = port.id === activePort;
                            return (
                                <g
                                    key={port.id}
                                    transform={`translate(${port.x}, ${port.y})`}
                                    className="cursor-pointer animate-marker-pop"
                                    style={{ animationDelay: `${i * 120}ms` }}
                                    onMouseEnter={() => setActivePort(port.id)}
                                    onFocus={() => setActivePort(port.id)}
                                    onClick={() => setActivePort(port.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${port.name}, ${port.state}. ${isActive ? 'Puerto activo.' : 'Puerto de expansión futura.'}`}
                                >
                                    {isActive && <circle r="24" fill="url(#active-glow)" />}
                                    <circle
                                        r={isActive ? 10 : 8}
                                        fill={isActive ? '#22d3ee' : '#60a5fa'}
                                        className={isActive ? 'animate-map-ping' : ''}
                                        opacity="0.45"
                                    />
                                    <circle
                                        r={isSelected ? 9 : 6}
                                        fill={isActive ? '#06b6d4' : '#3b82f6'}
                                        stroke="#fff"
                                        strokeWidth={isSelected ? 3 : 2}
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                    {isSelected && (
                                        <g>
                                            <rect
                                                x={-port.name.length * 4 - 10}
                                                y={-38}
                                                width={port.name.length * 8 + 20}
                                                height="22"
                                                rx="11"
                                                fill="#0f172a"
                                                stroke={isActive ? '#22d3ee' : '#60a5fa'}
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                y={-23}
                                                textAnchor="middle"
                                                fill="#fff"
                                                fontSize="12"
                                                fontWeight="600"
                                                style={{ fontFamily: 'system-ui, sans-serif' }}
                                            >
                                                {port.name}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Leyenda */}
                    <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-white/80 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                            </span>
                            <span>Puerto activo ({activeCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-full bg-blue-500 border border-white/50" />
                            <span>Expansión futura ({futureCount})</span>
                        </div>
                    </div>
                </div>

                {/* Panel de información */}
                <div className="space-y-6">
                    <div>
                        <p className="text-cyan-400 text-sm font-semibold tracking-widest uppercase mb-3">
                            Cobertura nacional
                        </p>
                        <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                            De Puerto Peñasco <br /> a todo México.
                        </h3>
                        <p className="text-gray-300 text-base md:text-lg mt-4 leading-relaxed">
                            Selecciona un puerto en el mapa para conocer su estatus dentro del proyecto.
                            Nuestra visión es expandir el modelo a toda la costa mexicana.
                        </p>
                    </div>

                    {activePortData && (
                        <div
                            key={activePortData.id}
                            className="animate-fade-in-up p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <h4 className="text-2xl font-bold text-white">{activePortData.name}</h4>
                                    <p className="text-gray-400 text-sm">{activePortData.state}</p>
                                </div>
                                <span
                                    className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                                        activePortData.status === 'active'
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    }`}
                                >
                                    {activePortData.status === 'active' ? 'ACTIVO' : 'FUTURO'}
                                </span>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{activePortData.description}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {PORTS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActivePort(p.id)}
                                className={`text-sm px-4 py-2 rounded-full border transition-all cursor-pointer ${
                                    p.id === activePort
                                        ? p.status === 'active'
                                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                                            : 'bg-blue-500/20 border-blue-400 text-blue-200'
                                        : 'border-white/15 text-gray-400 hover:text-white hover:border-white/40'
                                }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
