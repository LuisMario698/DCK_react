'use client';
import { useState, useEffect, useRef } from 'react';
import { RevealOnScroll } from './useScrollReveal';

function useInView(threshold = 0.3) {
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

function AnimatedCounter({ end, suffix = '', started, duration = 2000 }: { end: number; suffix?: string; started: boolean; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const inc = end / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += inc;
      if (current >= end) { setCount(end); clearInterval(interval); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, end, duration]);
  return <>{count.toLocaleString()}{suffix}</>;
}

/* Anillo radial de progreso */
function RadialProgress({ percentage, color, started, size = 90 }: { percentage: number; color: string; started: boolean; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = started ? circ - (percentage / 100) * circ : circ;
  return (
    <svg width={size} height={size} className="relative">
      <defs>
        <linearGradient id={`ring-${color}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={`url(#ring-${color})`} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

/* Sparkline */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120, h = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 opacity-40 group-hover:opacity-80 transition-opacity duration-700" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#grad-${color})`} />
      {/* Punto final pulsante */}
      <circle cx={w} cy={h - ((data[data.length - 1] - min) / range) * h} r="2.5" fill={color}>
        <animate attributeName="r" values="2.5;5;2.5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* Ícono por estadística */
const Icon = ({ name, color }: { name: string; color: string }) => {
  const common = { className: 'w-6 h-6', fill: 'none' as const, stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'doc': return (<svg {...common} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" /></svg>);
    case 'boat': return (<svg {...common} viewBox="0 0 24 24"><path d="M2 20c1.5 1 3 1.5 5 1.5s3.5-.5 5-1.5 3-1.5 5-1.5 3.5.5 5 1.5M4 18l1-6h14l1 6M12 3v9M8 8h8" /></svg>);
    case 'weight': return (<svg {...common} viewBox="0 0 24 24"><path d="M5 8h14l-1.5 12h-11zM9 8V5a3 3 0 016 0v3" /></svg>);
    case 'track': return (<svg {...common} viewBox="0 0 24 24"><path d="M9 11a3 3 0 116 0 3 3 0 01-6 0z" /><path d="M12 2a9 9 0 019 9c0 4-9 13-9 13S3 15 3 11a9 9 0 019-9z" /></svg>);
    case 'calendar': return (<svg {...common} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>);
    case 'clock': return (<svg {...common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
    default: return null;
  }
};

const STATS = [
  { value: 5247, suffix: '', label: 'Manifiestos Digitalizados', desc: 'Reportes físicos convertidos a formato digital desde 2014', color: '#22d3ee', icon: 'doc', progress: 95, sparkline: [10, 30, 25, 60, 80, 120, 200, 350, 500, 800, 1200, 5247] },
  { value: 218, suffix: '', label: 'Embarcaciones Registradas', desc: 'Barcos pesqueros con trazabilidad completa de residuos', color: '#2dd4bf', icon: 'boat', progress: 72, sparkline: [20, 40, 55, 70, 90, 110, 130, 150, 170, 190, 205, 218] },
  { value: 1850, suffix: '', label: 'Toneladas Gestionadas', desc: 'De residuos correctamente procesados y documentados', color: '#34d399', icon: 'weight', progress: 85, sparkline: [50, 100, 200, 350, 500, 650, 800, 1000, 1200, 1450, 1650, 1850] },
  { value: 98, suffix: '%', label: 'Trazabilidad Lograda', desc: 'Seguimiento completo del ciclo de vida de cada residuo', color: '#818cf8', icon: 'track', progress: 98, sparkline: [20, 35, 45, 55, 65, 72, 78, 85, 90, 94, 97, 98] },
  { value: 12, suffix: '', label: 'Años de Datos Históricos', desc: 'Información recuperada y digitalizada de 2014 a 2026', color: '#f59e0b', icon: 'calendar', progress: 65, sparkline: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { value: 45, suffix: '%', label: 'Reducción Tiempo Admin', desc: 'Menos tiempo dedicado a procesos manuales de registro', color: '#f472b6', icon: 'clock', progress: 45, sparkline: [5, 8, 12, 15, 20, 25, 28, 32, 36, 40, 43, 45] },
];

function StatCard({ stat, delay }: { stat: typeof STATS[0]; delay: number }) {
  const { ref, inView } = useInView(0.3);
  return (
    <div ref={ref} className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden cursor-default hover:-translate-y-1">
      {/* Glow */}
      <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[80px]" style={{ backgroundColor: stat.color }} />
      {/* Barra superior animada */}
      <div className="absolute top-0 left-0 h-[2px] w-8 group-hover:w-full transition-all duration-700 ease-out" style={{ backgroundColor: stat.color, opacity: 0.6 }} />

      {/* Header: icono + anillo radial */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <RadialProgress percentage={stat.progress} color={stat.color} started={inView} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name={stat.icon} color={stat.color} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40">Progreso</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.progress}<span className="text-sm text-white/40">%</span></div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4">
        <Sparkline data={stat.sparkline} color={stat.color} />
      </div>

      {/* Número principal */}
      <div className="text-5xl md:text-6xl font-extrabold text-white tabular-nums tracking-tight" style={{ textShadow: `0 0 40px ${stat.color}22` }}>
        <AnimatedCounter end={stat.value} suffix={stat.suffix} started={inView} />
      </div>
      <div className="text-lg font-bold text-white mt-4">{stat.label}</div>
      <div className="text-[15px] text-white/60 mt-2 leading-relaxed">{stat.desc}</div>

      {/* Barra de llenado inferior */}
      <div className="mt-5 h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{
            width: inView ? `${stat.progress}%` : '0%',
            background: `linear-gradient(90deg, ${stat.color}, ${stat.color}aa)`,
            boxShadow: `0 0 12px ${stat.color}66`,
            transitionDuration: '1.8s',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

export function StatsSection() {
  return (
    <section id="impacto" className="py-32 px-6 bg-gradient-to-b from-[#0a1628] to-[#0c1a30] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3 animate-pulse-glow-soft" />

      <div className="max-w-7xl mx-auto relative z-10">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-blue-400 text-sm font-semibold tracking-[0.3em] uppercase">Datos y Estadísticas</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-5 text-white tracking-tight">Impacto en <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">números</span></h2>
            <p className="text-white/70 text-xl leading-relaxed">Resultados concretos de la digitalización de la gestión de residuos marítimos en Puerto Peñasco.</p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STATS.map((stat, i) => (
            <RevealOnScroll key={i} delay={i * 80}>
              <StatCard stat={stat} delay={i * 100} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
