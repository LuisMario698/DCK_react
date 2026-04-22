'use client';
import { useState, useEffect } from 'react';

const IMAGES = [
  'https://images.unsplash.com/photo-1498623116890-37e912163d5d?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80',
];

const MINI_STATS = [
  { v: '1 puerto', l: 'piloto activo' },
  { v: '+5,000', l: 'manifiestos' },
  { v: '1,850 t', l: 'gestionadas' },
];

export function HeroSection() {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { setPrev(idx); setIdx(i => (i + 1) % IMAGES.length); }, 7000);
    return () => clearInterval(t);
  }, [idx]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="relative h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
      {/* Parallax Background */}
      <div className="absolute inset-0 z-0 bg-black" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        {IMAGES.map((src, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-[2500ms] ease-in-out ${i === idx ? 'opacity-100' : i === prev ? 'opacity-100' : 'opacity-0'}`} style={{ zIndex: i === idx ? 20 : i === prev ? 10 : 0 }}>
            <img src={src} alt="" className="h-full w-full object-cover scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/80 via-black/40 to-[#0a1628]" />
          </div>
        ))}
      </div>

      {/* Floating Sea Particles (Bubbles) */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {[...Array(24)].map((_, i) => {
          const size = Math.random() * 6 + 2;
          const left = Math.random() * 100;
          const animDuration = Math.random() * 15 + 10;
          const animDelay = Math.random() * 10;
          return (
            <div
              key={i}
              className="absolute bottom-[-20px] rounded-full bg-cyan-400/20 backdrop-blur-sm"
              style={{
                width: size, height: size, left: `${left}%`,
                animation: `float-particle ${animDuration}s linear ${animDelay}s infinite`,
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)'
              }}
            />
          );
        })}
      </div>

      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-black/30 z-20 pointer-events-none" />

      {/* Content */}
      <div className="relative z-30 max-w-5xl space-y-7" style={{ opacity: Math.max(0, 1 - scrollY / 600), transform: `translateY(${scrollY * 0.15}px)` }}>
        <div className="inline-flex items-center gap-2.5 px-6 py-3 bg-white/[0.08] border border-white/[0.15] rounded-full backdrop-blur-md">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-white/90 text-sm font-semibold tracking-[0.25em] uppercase">Puerto Peñasco, Sonora · México</span>
        </div>
        <h1 className="text-7xl md:text-[9rem] font-extrabold leading-[0.85] tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white animate-text-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #67e8f9 50%, #ffffff 100%)' }}>
          DCK
        </h1>
        <p className="text-3xl md:text-5xl font-light text-white/95 tracking-tight leading-tight drop-shadow-md">
          Conciencia <span className="text-cyan-400 font-medium">&</span> Cultura
        </p>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent mx-auto" />
        <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed tracking-wide drop-shadow-sm">
          Protegiendo el Mar de Cortés mediante la gestión digital de residuos marítimos.
        </p>

        {/* Mini stats strip */}
        <div className="flex items-center justify-center gap-4 md:gap-10 pt-2 flex-wrap">
          {MINI_STATS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-left">
                <div className="text-xl md:text-2xl font-bold text-white tabular-nums">{s.v}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/50">{s.l}</div>
              </div>
              {i < MINI_STATS.length - 1 && <div className="w-px h-8 bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <a href="/login" className="group relative px-10 py-5 overflow-hidden font-bold text-lg tracking-wide transition-all rounded-full hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-[#0a1628] shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50"
            style={{ background: 'linear-gradient(135deg, #67e8f9 0%, #22d3ee 50%, #2dd4bf 100%)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            Ir a la plataforma
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </a>
          <a href="#impacto" className="group px-10 py-5 border-2 border-white/30 hover:border-white/60 hover:bg-white/[0.08] text-white/90 hover:text-white font-bold text-lg tracking-wide transition-all rounded-full flex items-center justify-center gap-2">
            Descubrir el impacto
            <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </a>
        </div>
      </div>

      {/* Olas animadas en la parte inferior */}
      <div className="absolute inset-x-0 bottom-0 h-32 z-20 pointer-events-none overflow-hidden">
        <svg className="absolute bottom-0 w-[200%] h-full animate-wave-slide-slow" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z M1440,60 C1680,20 1920,100 2160,60 C2400,20 2640,100 2880,60 L2880,120 L1440,120 Z" fill="rgba(34,211,238,0.08)" />
        </svg>
        <svg className="absolute bottom-0 w-[200%] h-full animate-wave-slide" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,80 C240,50 480,110 720,80 C960,55 1200,110 1440,80 L1440,120 L0,120 Z M1440,80 C1680,50 1920,110 2160,80 C2400,55 2640,110 2880,80 L2880,120 L1440,120 Z" fill="rgba(45,212,191,0.12)" />
        </svg>
        <svg className="absolute bottom-0 w-[200%] h-full animate-wave-slide-reverse" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,100 C240,80 480,120 720,100 C960,88 1200,118 1440,100 L1440,120 L0,120 Z M1440,100 C1680,80 1920,120 2160,100 C2400,88 2640,118 2880,100 L2880,120 L1440,120 Z" fill="#0a1628" />
        </svg>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
        <span className="text-xs tracking-[0.3em] uppercase text-white/60 font-semibold">Scroll</span>
        <div className="w-[2px] h-10 bg-gradient-to-b from-white/40 to-transparent relative overflow-hidden rounded-full">
          <div className="absolute top-0 left-0 w-full h-4 bg-white/90 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
      </div>
    </header>
  );
}
