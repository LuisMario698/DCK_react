'use client';
import { useState } from 'react';
import { RevealOnScroll } from './useScrollReveal';

const PORTS = [
  { name: 'Puerto Peñasco', state: 'Sonora', status: 'Activo', vessels: 218, manifests: 5247, x: 22, y: 28, active: true, color: '#00ddb4' },
  { name: 'Guaymas', state: 'Sonora', status: 'En implementación', vessels: 150, manifests: 0, x: 30, y: 42, active: false, color: '#f59e0b' },
  { name: 'Mazatlán', state: 'Sinaloa', status: 'Próximamente', vessels: 320, manifests: 0, x: 32, y: 58, active: false, color: '#818cf8' },
  { name: 'Ensenada', state: 'Baja California', status: 'Próximamente', vessels: 175, manifests: 0, x: 10, y: 26, active: false, color: '#818cf8' },
  { name: 'La Paz', state: 'Baja California Sur', status: 'Próximamente', vessels: 95, manifests: 0, x: 18, y: 55, active: false, color: '#818cf8' },
  { name: 'Cabo San Lucas', state: 'Baja California Sur', status: 'Próximamente', vessels: 80, manifests: 0, x: 16, y: 60, active: false, color: '#818cf8' },
];

/* Mini bar chart for a port */
function MiniChart({ vessels, manifests }: { vessels: number; manifests: number }) {
  const maxVal = Math.max(vessels, manifests, 1);
  return (
    <div className="flex items-end gap-1.5 h-8">
      {[vessels * 0.3, vessels * 0.6, vessels, vessels * 0.8, manifests * 0.2, manifests * 0.5, manifests * 0.7, manifests].map((v, i) => (
        <div key={i} className="w-2 rounded-t-sm transition-all duration-500 hover:opacity-100" style={{ height: `${Math.max(4, (v / maxVal) * 100)}%`, backgroundColor: i < 4 ? '#2dd4bf' : '#22d3ee', opacity: 0.5 }} />
      ))}
    </div>
  );
}

export function MapSection() {
  const [selected, setSelected] = useState(0);
  const sel = PORTS[selected];

  return (
    <section id="mapa" className="py-32 px-6 bg-gradient-to-b from-[#0c1a30] to-[#0a1628] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-400 text-sm font-semibold tracking-[0.3em] uppercase">Cobertura del Programa</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-5 text-white tracking-tight">Puertos participantes</h2>
            <p className="text-white/70 text-xl leading-relaxed">Expandiendo la gestión digital de residuos marítimos a lo largo del noroeste de México.</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={150}>
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Map */}
            <div className="lg:col-span-3 relative bg-[#080f1e] rounded-2xl border border-white/[0.05] overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(100,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,200,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Coastline */}
                <path d="M5,20 Q8,15 15,12 Q25,8 40,10 Q50,12 55,18 Q52,20 50,25 Q48,30 45,35 Q42,40 40,45 Q38,50 36,55 Q34,58 32,62 Q30,66 28,70 Q26,74 24,78 Q22,80 20,82 Q18,84 15,80 Q12,75 10,68 Q8,60 7,52 Q6,45 5,38 Q4,30 5,20Z" fill="rgba(100,200,255,0.04)" stroke="rgba(100,200,255,0.1)" strokeWidth="0.4" />
                <path d="M15,25 Q20,22 25,25 Q28,30 30,35 Q32,40 33,45 Q34,50 33,55 Q32,58 30,60 Q28,58 25,55 Q22,50 20,45 Q18,40 16,35 Q15,30 15,25Z" fill="rgba(0,100,200,0.06)" stroke="rgba(100,200,255,0.06)" strokeWidth="0.3" />
                
                {/* Connection lines - static base */}
                {PORTS.filter((_, idx) => idx !== 0).map((port, i) => (
                  <line key={`line-${i}`} x1={PORTS[0].x} y1={PORTS[0].y} x2={port.x} y2={port.y} stroke="rgba(100,200,255,0.08)" strokeWidth="0.25" strokeDasharray="1 1.5" />
                ))}

                {/* Flujo animado desde Puerto Peñasco hacia puertos en proceso/próximos */}
                {PORTS.filter((_, idx) => idx !== 0).map((port, i) => (
                  <g key={`flow-${i}`}>
                    <line
                      x1={PORTS[0].x} y1={PORTS[0].y}
                      x2={port.x} y2={port.y}
                      stroke={port.color}
                      strokeWidth="0.35"
                      strokeLinecap="round"
                      strokeDasharray="1.5 3"
                      opacity={selected === (i + 1) ? 0.9 : 0.35}
                      className="transition-opacity duration-500"
                    >
                      <animate attributeName="stroke-dashoffset" from="0" to="-30" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
                    </line>
                    {/* Partícula viajando */}
                    <circle r="0.6" fill={port.color} opacity="0.9">
                      <animateMotion dur={`${4 + i * 0.5}s`} repeatCount="indefinite" path={`M${PORTS[0].x},${PORTS[0].y} L${port.x},${port.y}`} />
                      <animate attributeName="opacity" values="0;1;1;0" dur={`${4 + i * 0.5}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                ))}

                {/* Port markers */}
                {PORTS.map((port, i) => (
                  <g key={i} onClick={() => setSelected(i)} className="cursor-pointer">
                    {/* Onda expansiva (ripple) múltiple para el activo */}
                    {port.active && (
                      <>
                        <circle cx={port.x} cy={port.y} r="3" fill="none" stroke={port.color} strokeWidth="0.25">
                          <animate attributeName="r" values="2;10;2" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={port.x} cy={port.y} r="3" fill="none" stroke={port.color} strokeWidth="0.2">
                          <animate attributeName="r" values="2;12;2" dur="3s" begin="1s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" begin="1s" repeatCount="indefinite" />
                        </circle>
                      </>
                    )}
                    {/* Halo selección */}
                    <circle cx={port.x} cy={port.y} r={selected === i ? 4 : 0} fill={port.color} opacity="0.15" className="transition-all duration-300" />
                    {/* Hover ring */}
                    <circle cx={port.x} cy={port.y} r="4" fill="none" stroke={selected === i ? port.color : 'transparent'} strokeWidth="0.3" opacity="0.4" />
                    {/* Dot */}
                    <circle cx={port.x} cy={port.y} r={selected === i ? 2.8 : 1.6} fill={port.color} opacity={selected === i ? 1 : 0.7} className="transition-all duration-300" style={{ filter: `drop-shadow(0 0 3px ${port.color})` }} />
                    {/* Label */}
                    <text x={port.x + 4} y={port.y + 1.2} fill={selected === i ? 'rgba(255,255,255,0.95)' : 'rgba(200,220,255,0.35)'} fontSize="2.6" fontWeight={selected === i ? '700' : '400'} className="pointer-events-none select-none" style={{ fontFamily: 'system-ui' }}>{port.name}</text>
                  </g>
                ))}
              </svg>

              {/* Floating info badge */}
              <div className="absolute bottom-4 left-4 px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] backdrop-blur-md">
                <div className="flex items-center gap-4 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00ddb4] shadow-[0_0_8px_rgba(0,221,180,0.6)]" /> Activo</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> En proceso</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#818cf8] opacity-70" /> Próximo</span>
                </div>
              </div>
            </div>

            {/* Port list */}
            <div className="lg:col-span-2 space-y-2">
              {PORTS.map((port, i) => (
                <button key={i} onClick={() => setSelected(i)} className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${selected === i ? 'bg-white/[0.04] border-white/[0.1]' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: port.color, boxShadow: port.active ? `0 0 8px ${port.color}60` : 'none' }} />
                      <span className={`text-lg font-bold transition-colors ${selected === i ? 'text-white' : 'text-white/70'}`}>{port.name}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${port.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.06] text-white/50'}`}>{port.status}</span>
                  </div>
                  <div className={`text-sm mt-1 ml-5 transition-colors ${selected === i ? 'text-white/60' : 'text-white/40'}`}>{port.state}</div>
                  
                  {/* Expandable details with chart */}
                  <div className={`overflow-hidden transition-all duration-300 ${selected === i ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-4 border-t border-white/[0.1] ml-5">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-2xl font-bold tracking-tight" style={{ color: port.color }}>{port.vessels}</div>
                          <div className="text-xs text-white/50 font-medium uppercase tracking-wider">Embarcaciones</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold tracking-tight" style={{ color: port.color }}>{port.manifests.toLocaleString()}</div>
                          <div className="text-xs text-white/50 font-medium uppercase tracking-wider">Manifiestos</div>
                        </div>
                      </div>
                      {port.active && <MiniChart vessels={port.vessels} manifests={port.manifests} />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
