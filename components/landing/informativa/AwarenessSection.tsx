'use client';
import { useEffect, useRef, useState } from 'react';
import { RevealOnScroll } from './useScrollReveal';

/* SVG icons */
const WaveIcon = () => (
  <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20c3-4 6-4 8 0s5 4 8 0 5-4 8 0" />
    <path d="M2 14c3-4 6-4 8 0s5 4 8 0 5-4 8 0" opacity=".5" />
    <path d="M2 26c3-4 6-4 8 0s5 4 8 0 5-4 8 0" opacity=".3" />
  </svg>
);
const DropIcon = () => (
  <svg className="w-8 h-8 text-amber-400" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4s-8 8.5-8 14a8 8 0 0016 0c0-5.5-8-14-8-14z" />
    <path d="M12 22a4 4 0 004 4" opacity=".5" />
  </svg>
);
const FishIcon = () => (
  <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 16c0 0-4-6-10-6s-10 6-10 6 4 6 10 6 10-6 10-6z" />
    <circle cx="10" cy="16" r="1.5" fill="currentColor" stroke="none" />
    <path d="M26 12l-4 4 4 4" />
  </svg>
);
const AnchorIcon = () => (
  <svg className="w-8 h-8 text-rose-400" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="8" r="3" />
    <path d="M16 11v15M8 22a8 8 0 0016 0" />
    <path d="M12 16h8" />
  </svg>
);

/* Hook: detectar visibilidad */
function useInView(threshold = 0.25) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* Visualizaciones gráficas por cada tarjeta */

/* Gráfico: proporción 1 litro aceite vs 1M litros agua (puntos) */
function OilRatioGraphic({ inView }: { inView: boolean }) {
  return (
    <div className="relative w-full h-24 rounded-xl bg-black/20 border border-white/[0.04] overflow-hidden p-3">
      {/* Gota de aceite */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <div className="w-6 h-8 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full rounded-t-none shadow-[0_0_12px_rgba(245,158,11,0.6)]" style={{ clipPath: 'ellipse(50% 60% at 50% 55%)', animation: 'gentle-float 3s ease-in-out infinite' }} />
        <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">1L</span>
      </div>
      {/* Flecha */}
      <div className="absolute left-14 top-1/2 -translate-y-1/2 text-white/30">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      </div>
      {/* Grid de puntos de agua contaminada */}
      <div className="absolute left-24 right-3 top-1/2 -translate-y-1/2 grid grid-cols-20 gap-[2px]" style={{ gridTemplateColumns: 'repeat(30, 1fr)' }}>
        {Array.from({ length: 90 }).map((_, i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-cyan-400/60 transition-all"
            style={{
              animation: inView ? `drift-up 2s ease-out ${i * 12}ms forwards` : 'none',
              opacity: inView ? 0.6 : 0,
            }}
          />
        ))}
      </div>
      <div className="absolute right-3 top-2 text-[9px] text-cyan-400 font-bold uppercase tracking-wider">1,000,000 L</div>
    </div>
  );
}

/* Barras proporcionales: 8M toneladas = ciclo de llenado */
function PlasticBars({ inView }: { inView: boolean }) {
  const bars = [20, 35, 55, 75, 100, 85, 60, 40, 90, 70, 45, 30];
  return (
    <div className="relative w-full h-24 rounded-xl bg-black/20 border border-white/[0.04] overflow-hidden p-3 flex items-end gap-[3px]">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all ease-out"
          style={{
            height: inView ? `${b}%` : '0%',
            background: `linear-gradient(to top, #22d3ee, #67e8f9)`,
            boxShadow: '0 0 8px rgba(34,211,238,0.4)',
            transitionDuration: '1.2s',
            transitionDelay: `${i * 60}ms`,
          }}
        />
      ))}
      <div className="absolute top-2 left-3 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Toneladas / año</div>
    </div>
  );
}

/* Iconitos de peces: 1 vivo por cada muerto */
function FishCount({ inView }: { inView: boolean }) {
  return (
    <div className="relative w-full h-24 rounded-xl bg-black/20 border border-white/[0.04] overflow-hidden p-3">
      <div className="grid grid-cols-20 gap-1 h-full">
        {Array.from({ length: 40 }).map((_, i) => {
          const alive = i < 4;
          return (
            <div
              key={i}
              className="flex items-center justify-center transition-all"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'scale(1)' : 'scale(0.5)',
                transitionDuration: '400ms',
                transitionDelay: `${i * 25}ms`,
              }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill={alive ? '#34d399' : 'rgba(251,113,133,0.7)'}>
                <path d="M6 12c0-3 3-5 6-5s6 2 6 5-3 5-6 5-6-2-6-5z M18 10l3-3v10l-3-3z" />
              </svg>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-1 right-3 text-[9px] font-bold">
        <span className="text-emerald-400">Vivos</span>
        <span className="text-white/30 mx-1">·</span>
        <span className="text-rose-400">Muertos</span>
      </div>
    </div>
  );
}

/* Contador de embarcaciones */
function BoatCount({ inView }: { inView: boolean }) {
  return (
    <div className="relative w-full h-24 rounded-xl bg-black/20 border border-white/[0.04] overflow-hidden p-3">
      <div className="flex flex-wrap gap-1 h-full content-center">
        {Array.from({ length: 30 }).map((_, i) => (
          <svg
            key={i}
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fb7185"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: inView ? (i < 7 ? 1 : 0.3) : 0,
              transform: inView ? 'translateY(0)' : 'translateY(8px)',
              transition: `all 400ms ease ${i * 30}ms`,
            }}
          >
            <path d="M2 20c1.5 1 3 1.5 5 1.5s3.5-.5 5-1.5 3-1.5 5-1.5 3.5.5 5 1.5M4 18l1-6h14l1 6M12 3v9M8 8h8" />
          </svg>
        ))}
      </div>
      <div className="absolute bottom-1 right-3 text-[9px] text-rose-400 font-bold uppercase tracking-wider">200+ embarcaciones</div>
    </div>
  );
}

const AWARENESS_DATA = [
  {
    title: 'Los océanos se ahogan en basura',
    stat: '8 millones',
    unit: 'de toneladas de plástico llegan al mar cada año',
    detail: 'Esto equivale a vaciar un camión de basura en el océano cada minuto. Los residuos de embarcaciones pesqueras son una fuente significativa de esta contaminación.',
    color: '#22d3ee',
    hoverBg: 'hover:border-cyan-500/30',
    icon: <WaveIcon />,
    graphic: 'plastic',
  },
  {
    title: 'El aceite usado: un veneno silencioso',
    stat: '1 litro',
    unit: 'de aceite contamina 1 millón de litros de agua',
    detail: 'Las embarcaciones pesqueras generan grandes cantidades de aceite usado. Sin gestión adecuada, este residuo destruye ecosistemas acuáticos completos.',
    color: '#f59e0b',
    hoverBg: 'hover:border-amber-500/30',
    icon: <DropIcon />,
    graphic: 'oil',
  },
  {
    title: 'La vida marina en peligro',
    stat: '100,000+',
    unit: 'animales marinos mueren por basura anualmente',
    detail: 'Tortugas, delfines, aves y peces confunden la basura con alimento. Los filtros de diésel y plásticos son especialmente mortales para la fauna del Mar de Cortés.',
    color: '#34d399',
    hoverBg: 'hover:border-emerald-500/30',
    icon: <FishIcon />,
    graphic: 'fish',
  },
  {
    title: 'Puerto Peñasco: un tesoro en riesgo',
    stat: '200+',
    unit: 'embarcaciones generan residuos cada mes',
    detail: 'Sin un sistema de trazabilidad, los residuos de la pesca pueden terminar en las playas y fondos marinos, afectando turismo y ecosistemas.',
    color: '#fb7185',
    hoverBg: 'hover:border-rose-500/30',
    icon: <AnchorIcon />,
    graphic: 'boat',
  },
];

function AwarenessCard({ item, i }: { item: typeof AWARENESS_DATA[0]; i: number }) {
  const { ref, inView } = useInView(0.25);
  return (
    <div ref={ref} className={`group relative p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.05] ${item.hoverBg} hover:bg-white/[0.03] transition-all duration-500 overflow-hidden cursor-default hover:-translate-y-1`}>
      {/* Glow */}
      <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[60px]" style={{ backgroundColor: item.color }} />
      {/* Número gigante de fondo */}
      <div className="absolute top-4 right-6 text-[80px] md:text-[100px] font-black leading-none opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700 select-none pointer-events-none" style={{ color: item.color }}>
        {item.stat.replace(/[^0-9+,]/g, '')}
      </div>

      <div className="relative flex items-start gap-5 mb-5">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:border-white/[0.15] transition-all duration-500 shadow-lg shadow-black/20 relative">
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" style={{ background: `linear-gradient(to top right, transparent, ${item.color})` }} />
          <div className="animate-gentle-float" style={{ animationDelay: `${i * 0.5}s` }}>{item.icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 transition-colors duration-500" style={{ color: item.color }}>
            {item.stat}
          </div>
          <div className="text-[14px] font-semibold text-white/70">{item.unit}</div>
        </div>
      </div>

      {/* Visualización gráfica */}
      <div className="mb-5">
        {item.graphic === 'plastic' && <PlasticBars inView={inView} />}
        {item.graphic === 'oil' && <OilRatioGraphic inView={inView} />}
        {item.graphic === 'fish' && <FishCount inView={inView} />}
        {item.graphic === 'boat' && <BoatCount inView={inView} />}
      </div>

      <p className="text-white/60 text-base leading-relaxed">{item.detail}</p>
    </div>
  );
}

export function AwarenessSection() {
  return (
    <section className="py-32 px-6 bg-[#0c1a30] relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-600/[0.03] rounded-full blur-[150px] animate-pulse-glow-soft" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[120px] animate-gentle-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-emerald-400 text-sm font-semibold tracking-[0.3em] uppercase">Concientización Ambiental</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-5 text-white tracking-tight">¿Por qué <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">importa?</span></h2>
            <p className="text-white/70 text-xl leading-relaxed">Cada manifiesto que registramos es un paso hacia la protección de nuestros mares.</p>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-6">
          {AWARENESS_DATA.map((item, i) => (
            <RevealOnScroll key={i} delay={i * 100} direction={i % 2 === 0 ? 'left' : 'right'}>
              <AwarenessCard item={item} i={i} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
