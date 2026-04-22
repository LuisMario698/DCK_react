'use client';
import { useEffect, useRef, useState } from 'react';
import { RevealOnScroll } from './useScrollReveal';

function useInView(threshold = 0.2) {
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

function useCountUp(end: number, started: boolean, duration = 1800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.floor(eased * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);
  return v;
}

/* ============ FEATURED: 1,850 toneladas = 12 ballenas azules ============ */
function FeaturedWhales() {
  const { ref, inView } = useInView(0.2);
  const count = useCountUp(12, inView, 2000);
  const tons = useCountUp(1850, inView, 2200);

  return (
    <div ref={ref} className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#0d1e3a] via-[#0a1628] to-[#0e2540] p-8 md:p-12 mb-8">
      {/* Fondo oceánico */}
      <div className="absolute inset-0 opacity-40">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 400">
          <defs>
            <radialGradient id="ocean-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="400" fill="url(#ocean-glow)" />
        </svg>
      </div>
      {/* Partículas flotantes */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-cyan-300/40" style={{
            left: `${(i * 37) % 100}%`, bottom: `${(i * 23) % 80}%`,
            animation: `gentle-float ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite`,
            boxShadow: '0 0 6px rgba(34,211,238,0.6)'
          }} />
        ))}
      </div>

      <div className="relative z-10 grid md:grid-cols-12 gap-10 items-center">
        {/* Izquierda: texto */}
        <div className="md:col-span-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-300 tracking-[0.2em] uppercase">Equivalencia destacada</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/50 font-semibold mb-2">
            {tons.toLocaleString()} toneladas de residuos
          </div>
          <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 leading-none mb-3 tabular-nums">
            {count}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-5">
            Ballenas azules
          </div>
          <p className="text-white/70 text-[15px] leading-relaxed">
            El peso total de residuos gestionados por el programa equivale al de <strong className="text-white">{count} ballenas azules adultas</strong>, el animal más grande del planeta (≈150 t cada una). Cada manifiesto registrado es una acción directa contra esa montaña invisible.
          </p>
        </div>

        {/* Derecha: Ballenas visuales escaladas */}
        <div className="md:col-span-7 relative h-64 md:h-80">
          <svg viewBox="0 0 600 320" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="whale-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#164e63" />
              </linearGradient>
              <linearGradient id="whale-belly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Líneas de agua sutiles */}
            {[60, 130, 200, 270].map((y, i) => (
              <path key={i} d={`M0,${y} Q150,${y - 6} 300,${y} T600,${y}`} stroke="rgba(100,200,255,0.08)" strokeWidth="0.5" fill="none">
                <animate attributeName="d" values={`M0,${y} Q150,${y - 6} 300,${y} T600,${y};M0,${y} Q150,${y + 6} 300,${y} T600,${y};M0,${y} Q150,${y - 6} 300,${y} T600,${y}`} dur="6s" repeatCount="indefinite" />
              </path>
            ))}

            {/* 12 ballenas distribuidas en 3 filas */}
            {Array.from({ length: 12 }).map((_, i) => {
              const col = i % 4;
              const row = Math.floor(i / 4);
              const cx = 75 + col * 140;
              const cy = 70 + row * 85;
              const delay = i * 120;
              return (
                <g
                  key={i}
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translate(0,0)' : 'translate(-20px,0)',
                    transition: `opacity 600ms ease ${delay}ms, transform 600ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                >
                  {/* Ballena estilizada */}
                  <g transform={`translate(${cx - 50}, ${cy - 18})`}>
                    {/* Cuerpo */}
                    <path d="M0,18 Q10,5 40,5 Q70,5 80,15 Q90,18 95,18 Q92,22 88,22 L80,22 Q70,32 40,32 Q10,32 0,22 Z" fill="url(#whale-grad)" />
                    {/* Panza */}
                    <path d="M15,22 Q40,30 70,22 Q60,30 40,32 Q25,30 15,22 Z" fill="url(#whale-belly)" />
                    {/* Cola */}
                    <path d="M0,18 L-10,10 L-6,18 L-10,26 Z" fill="url(#whale-grad)" />
                    {/* Ojo */}
                    <circle cx="70" cy="15" r="1.2" fill="#0a1628" />
                    {/* Chorro */}
                    <g opacity="0.6">
                      <circle cx="58" cy="6" r="1" fill="#67e8f9">
                        <animate attributeName="cy" values="6;2;6" dur={`${2 + i * 0.2}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur={`${2 + i * 0.2}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ============ GRID EQUIVALENCIAS: visualizaciones únicas ============ */

/* ============ GRÁFICOS LIMPIOS E ICONOGRÁFICOS ============ */

/* 37 canchas de fútbol - SVG con icono claro */
function SoccerFields({ inView }: { inView: boolean }) {
  const total = 37, cap = 40;
  return (
    <div className="grid grid-cols-10 gap-1.5 h-28">
      {Array.from({ length: cap }).map((_, i) => {
        const filled = i < total;
        return (
          <svg key={i} viewBox="0 0 40 28" className="w-full h-full"
            style={{
              opacity: inView ? (filled ? 1 : 0.15) : 0,
              transform: inView ? 'scale(1)' : 'scale(0.4)',
              transition: `all 400ms cubic-bezier(0.34,1.56,0.64,1) ${i * 15}ms`,
              filter: filled ? 'drop-shadow(0 0 3px rgba(52,211,153,0.5))' : 'none',
            }}
          >
            <rect x="1" y="1" width="38" height="26" rx="1.5" fill={filled ? '#10b981' : 'rgba(255,255,255,0.06)'} stroke={filled ? '#6ee7b7' : 'rgba(255,255,255,0.1)'} strokeWidth="0.8" />
            <line x1="20" y1="1" x2="20" y2="27" stroke={filled ? '#6ee7b7' : 'rgba(255,255,255,0.15)'} strokeWidth="0.6" />
            <circle cx="20" cy="14" r="3" fill="none" stroke={filled ? '#6ee7b7' : 'rgba(255,255,255,0.15)'} strokeWidth="0.6" />
            <rect x="1" y="9" width="4" height="10" fill="none" stroke={filled ? '#6ee7b7' : 'rgba(255,255,255,0.15)'} strokeWidth="0.6" />
            <rect x="35" y="9" width="4" height="10" fill="none" stroke={filled ? '#6ee7b7' : 'rgba(255,255,255,0.15)'} strokeWidth="0.6" />
          </svg>
        );
      })}
    </div>
  );
}

/* 8 piscinas olímpicas - vista superior con carriles */
function OlympicPools({ inView }: { inView: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-2 h-28">
      {Array.from({ length: 8 }).map((_, i) => (
        <svg key={i} viewBox="0 0 80 30" className="w-full h-full"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'scale(1)' : 'scale(0.5)',
            transition: `all 500ms cubic-bezier(0.34,1.56,0.64,1) ${i * 80}ms`,
            filter: 'drop-shadow(0 2px 4px rgba(37,99,235,0.3))',
          }}
        >
          <defs>
            <linearGradient id={`pool-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          {/* piscina */}
          <rect x="2" y="2" width="76" height="26" rx="2" fill={`url(#pool-${i})`} stroke="#93c5fd" strokeWidth="1" />
          {/* carriles */}
          {[7, 12, 17, 22].map(y => (
            <line key={y} x1="4" y1={y} x2="76" y2={y} stroke="white" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
          ))}
          {/* brillo agua */}
          <ellipse cx="40" cy="6" rx="30" ry="1" fill="white" opacity="0.3" />
        </svg>
      ))}
    </div>
  );
}

/* 2,400 árboles - iconos pino limpios */
function ForestTrees({ inView }: { inView: boolean }) {
  const total = 48;
  return (
    <div className="grid grid-cols-12 gap-1 h-28 items-end">
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 28" className="w-full h-full"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(10px)',
            transition: `all 500ms cubic-bezier(0.34,1.56,0.64,1) ${i * 15}ms`,
            filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.5))',
          }}
        >
          {/* copa (3 capas tipo pino) */}
          <polygon points="10,1 3,10 17,10" fill="#10b981" />
          <polygon points="10,6 2,16 18,16" fill="#059669" />
          <polygon points="10,11 1,22 19,22" fill="#047857" />
          {/* tronco */}
          <rect x="8" y="22" width="4" height="5" fill="#78350f" />
        </svg>
      ))}
    </div>
  );
}

/* Pila de papel vs edificio - comparación limpia */
function PaperStack({ inView }: { inView: boolean }) {
  return (
    <div className="relative h-28 flex items-end justify-around gap-4 px-2">
      {/* Pila de papel */}
      <div className="flex-1 flex flex-col items-center justify-end h-full">
        <svg viewBox="0 0 60 100" className="h-full" preserveAspectRatio="xMidYMax meet">
          <g style={{
            transform: inView ? 'translateY(0)' : 'translateY(80px)',
            transition: 'transform 1400ms cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* sombras apiladas */}
            {Array.from({ length: 18 }).map((_, i) => (
              <rect key={i} x="10" y={15 + i * 4.5} width="40" height="4" fill={i % 2 === 0 ? '#fef3c7' : '#fde68a'} stroke="#d97706" strokeWidth="0.3" />
            ))}
            {/* top paper con líneas */}
            <rect x="10" y="10" width="40" height="5" fill="white" stroke="#d97706" strokeWidth="0.4" />
            <line x1="14" y1="12.5" x2="30" y2="12.5" stroke="#d97706" strokeWidth="0.3" opacity="0.5" />
          </g>
        </svg>
        <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mt-1">250m papel</div>
      </div>

      <div className="text-3xl font-black text-white/50 self-center">=</div>

      {/* Edificio */}
      <div className="flex-1 flex flex-col items-center justify-end h-full">
        <svg viewBox="0 0 60 100" className="h-full" preserveAspectRatio="xMidYMax meet">
          <g style={{
            transform: inView ? 'translateY(0)' : 'translateY(80px)',
            transition: 'transform 1400ms cubic-bezier(0.16,1,0.3,1) 300ms',
          }}>
            {/* edificio */}
            <rect x="12" y="8" width="36" height="82" fill="#6366f1" />
            <rect x="12" y="8" width="36" height="82" fill="url(#bldg-shine)" opacity="0.3" />
            <defs>
              <linearGradient id="bldg-shine" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="50%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* techo */}
            <rect x="10" y="5" width="40" height="5" fill="#4338ca" />
            {/* antena */}
            <line x1="30" y1="5" x2="30" y2="0" stroke="#818cf8" strokeWidth="1" />
            {/* ventanas */}
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 3 }).map((_, col) => (
                <rect key={`${row}-${col}`} x={17 + col * 10} y={14 + row * 10} width="6" height="6" fill="#fbbf24" opacity={inView ? (0.4 + ((row + col) % 3) * 0.2) : 0} style={{ transition: `opacity 300ms ease ${800 + (row * 3 + col) * 40}ms` }} />
              ))
            )}
          </g>
        </svg>
        <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mt-1">80 pisos</div>
      </div>
    </div>
  );
}

/* Ruta 1,400 km - mapa estilizado */
function KmRoute({ inView }: { inView: boolean }) {
  return (
    <div className="relative h-28">
      <svg viewBox="0 0 400 110" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="route-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>

        {/* fondo tipo mapa - puntos */}
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i} cx={(i * 37) % 400} cy={(i * 23) % 110} r="0.8" fill="rgba(255,255,255,0.08)" />
        ))}

        {/* Ruta sombra */}
        <path d="M30,70 Q130,25 230,65 Q320,95 370,45" stroke="rgba(0,0,0,0.3)" strokeWidth="6" fill="none" strokeLinecap="round" transform="translate(0,2)" />
        {/* Ruta principal */}
        <path d="M30,70 Q130,25 230,65 Q320,95 370,45" stroke="url(#route-line)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="800" strokeDashoffset={inView ? 0 : 800} style={{ transition: 'stroke-dashoffset 2.5s ease-out' }} />
        {/* Línea punteada animada encima */}
        <path d="M30,70 Q130,25 230,65 Q320,95 370,45" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="4 8" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2s" repeatCount="indefinite" />
        </path>

        {/* Punto inicial: Puerto Peñasco */}
        <g opacity={inView ? 1 : 0} style={{ transition: 'opacity 400ms ease 300ms' }}>
          <circle cx="30" cy="70" r="10" fill="#f472b6" opacity="0.25">
            <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="70" r="6" fill="#f472b6" stroke="white" strokeWidth="1.5" />
          <path d="M30,64 L30,70 L34,68 Z" fill="white" />
        </g>
        <text x="10" y="92" fill="#f472b6" fontSize="11" fontWeight="800" style={{ fontFamily: 'system-ui' }}>P. Peñasco</text>

        {/* Punto final: Guadalajara */}
        <g opacity={inView ? 1 : 0} style={{ transition: 'opacity 400ms ease 2300ms' }}>
          <circle cx="370" cy="45" r="10" fill="#60a5fa" opacity="0.25">
            <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="370" cy="45" r="6" fill="#60a5fa" stroke="white" strokeWidth="1.5" />
          <path d="M370,39 L370,45 L374,43 Z" fill="white" />
        </g>
        <text x="318" y="28" fill="#60a5fa" fontSize="11" fontWeight="800" style={{ fontFamily: 'system-ui' }}>Guadalajara</text>

        {/* Partícula viajera */}
        {inView && (
          <circle r="3.5" fill="white" opacity="1">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M30,70 Q130,25 230,65 Q320,95 370,45" />
            <animate attributeName="r" values="3.5;5;3.5" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Distancia */}
        <text x="200" y="17" textAnchor="middle" fill="white" fontSize="12" fontWeight="900" opacity="0.9">1,400 km</text>
      </svg>
    </div>
  );
}

/* 92,500 bolsas - iconos bolsa bien hechos + número */
function GarbageBags({ inView }: { inView: boolean }) {
  const total = 40;
  return (
    <div className="grid grid-cols-10 gap-1 h-28 items-end">
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 28" className="w-full h-full"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0) rotate(0deg)' : `translateY(15px) rotate(${(i % 2 ? -8 : 8)}deg)`,
            transition: `all 500ms cubic-bezier(0.34,1.56,0.64,1) ${i * 18}ms`,
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))',
          }}
        >
          <defs>
            <linearGradient id={`bag-${i}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          {/* Nudo (dos orejas) */}
          <path d="M6,3 Q7,1 10,2 Q13,1 14,3 L14,5 L6,5 Z" fill="#334155" />
          {/* Cuerpo bolsa */}
          <path d="M4,5 Q2,14 3,22 Q4,27 10,27 Q16,27 17,22 Q18,14 16,5 Z" fill={`url(#bag-${i})`} stroke="#0f172a" strokeWidth="0.4" />
          {/* brillo */}
          <path d="M6,8 Q5,14 6,20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}

/* ============ DATOS ============ */
const EQUIVS = [
  {
    topLabel: 'Superficie total',
    value: '37',
    unit: 'campos de fútbol',
    detail: 'Las 1,850 toneladas de residuos, extendidas, cubrirían 37 canchas profesionales completas.',
    color: '#34d399',
    ring: 75,
    Graphic: SoccerFields,
  },
  {
    topLabel: 'Volumen de aceite',
    value: '8',
    unit: 'piscinas olímpicas',
    detail: 'El aceite usado recuperado llenaría 8 piscinas olímpicas. Sin gestión, habría contaminado millones de litros de mar.',
    color: '#60a5fa',
    ring: 60,
    Graphic: OlympicPools,
  },
  {
    topLabel: 'Árboles salvados',
    value: '2,400',
    unit: 'árboles maduros',
    detail: 'La digitalización de 5,000+ manifiestos en papel evitó la tala equivalente a un pequeño bosque urbano completo.',
    color: '#10b981',
    ring: 92,
    Graphic: ForestTrees,
  },
  {
    topLabel: 'Altura del papel',
    value: '250m',
    unit: 'de pila de hojas',
    detail: 'Si apiláramos las hojas de los 5,000 manifiestos, superarían la altura de un edificio de 80 pisos.',
    color: '#a78bfa',
    ring: 80,
    Graphic: PaperStack,
  },
  {
    topLabel: 'Distancia evitada',
    value: '1,400 km',
    unit: 'de contaminación lineal',
    detail: 'Si los residuos se hubieran derramado en línea, cubrirían la distancia de Puerto Peñasco a Guadalajara.',
    color: '#f472b6',
    ring: 70,
    Graphic: KmRoute,
  },
  {
    topLabel: 'En bolsas de basura',
    value: '92,500',
    unit: 'bolsas de 20 kg',
    detail: 'El residuo gestionado equivale a 92,500 bolsas domésticas — más de una bolsa por cada habitante del puerto.',
    color: '#94a3b8',
    ring: 55,
    Graphic: GarbageBags,
  },
];

function EquivCard({ item, delay }: { item: typeof EQUIVS[0]; delay: number }) {
  const { ref, inView } = useInView(0.2);
  const count = useCountUp(parseInt(item.value.replace(/[^\d]/g, '')) || 0, inView, 1800);
  const displaysCount = /^\d[\d,]*$/.test(item.value);

  return (
    <div ref={ref} className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.18] transition-all duration-500 overflow-hidden hover:-translate-y-1 p-6">
      {/* glow hover */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[80px]" style={{ backgroundColor: item.color }} />
      {/* barra superior */}
      <div className="absolute top-0 left-0 h-[2px] transition-all duration-700 ease-out" style={{ backgroundColor: item.color, width: inView ? '100%' : '0%', opacity: 0.8, boxShadow: `0 0 8px ${item.color}` }} />

      {/* Header */}
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">{item.topLabel}</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: item.color }}>{item.ring}%</span>
      </div>

      {/* Número gigante */}
      <div className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-1 tabular-nums" style={{ color: item.color, textShadow: `0 0 30px ${item.color}33` }}>
        {displaysCount ? count.toLocaleString() : item.value}
      </div>
      <div className="text-base font-bold text-white/90 mb-4">{item.unit}</div>

      {/* Visualización única */}
      <div className="mb-4 rounded-xl bg-black/30 border border-white/[0.04] p-3">
        <item.Graphic inView={inView} />
      </div>

      <p className="text-white/55 text-[13px] leading-relaxed">{item.detail}</p>
    </div>
  );
}

export function EquivalenceSection() {
  return (
    <section className="py-32 px-6 bg-[#0a1628] relative overflow-hidden">
      {/* Fondo ambiental */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3 animate-pulse-glow-soft" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3 animate-gentle-float" />

      <div className="max-w-7xl mx-auto relative z-10">
        <RevealOnScroll>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-[0.3em] uppercase">Equivalencias de Impacto</span>
            <h2 className="text-5xl md:text-6xl font-black mt-4 mb-5 text-white tracking-tight leading-[1.05]">
              Cuando los números <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300">se vuelven tangibles</span>
            </h2>
            <p className="text-white/70 text-xl leading-relaxed">
              Traducir toneladas, litros y papel a cosas que puedes imaginar. Así es como se ve realmente el impacto del programa.
            </p>
          </div>
        </RevealOnScroll>

        {/* Featured destacado */}
        <RevealOnScroll>
          <FeaturedWhales />
        </RevealOnScroll>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EQUIVS.map((item, i) => (
            <RevealOnScroll key={i} delay={i * 80}>
              <EquivCard item={item} delay={i * 100} />
            </RevealOnScroll>
          ))}
        </div>

        {/* Footer quote */}
        <RevealOnScroll delay={200}>
          <div className="mt-16 max-w-3xl mx-auto text-center px-8 py-10 rounded-2xl bg-gradient-to-r from-cyan-500/[0.05] via-teal-500/[0.05] to-emerald-500/[0.05] border border-white/[0.06]">
            <div className="text-white/50 text-xs font-bold tracking-[0.3em] uppercase mb-3">Reflexión final</div>
            <p className="text-2xl md:text-3xl font-semibold text-white/90 leading-snug">
              Cada <span className="text-cyan-300">manifiesto</span> es una decisión. Cada decisión, un <span className="text-emerald-300">futuro</span> para el mar.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
