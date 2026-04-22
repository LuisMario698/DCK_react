'use client';
import { useState, useEffect } from 'react';
import { HeroSection } from './informativa/HeroSection';
import { FranciscoSection } from './informativa/FranciscoSection';
import { StatsSection } from './informativa/StatsSection';
import { AwarenessSection } from './informativa/AwarenessSection';
import { MapSection } from './informativa/MapSection';
import { EquivalenceSection } from './informativa/EquivalenceSection';
import { ProjectSection } from './informativa/ProjectSection';
import { FooterSection } from './informativa/FooterSection';
import { WaveDivider } from './informativa/WaveDivider';

const NAV_LINKS = [
  { href: '#francisco', label: 'FRANCISCO' },
  { href: '#impacto', label: 'IMPACTO' },
  { href: '#mapa', label: 'PUERTOS' },
  { href: '#proyecto', label: 'PROYECTO' },
];

export function InformativaPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (y / h) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a1628] text-white" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Cursor glow (desktop) */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-[60] hidden md:block rounded-full mix-blend-screen transition-opacity duration-300"
        style={{
          left: cursor.x - 200,
          top: cursor.y - 200,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0) 60%)',
        }}
      />

      {/* Barra de progreso de scroll */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[70] bg-white/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-[width] duration-150 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${scrolled ? 'bg-[#0a1628]/90 backdrop-blur-2xl border-b border-white/[0.04]' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-4 group">
            <img src="/assets/logo_DCK.png" alt="DCK" className="h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="hidden sm:block h-6 w-px bg-white/10" />
            <div className="hidden sm:flex items-center gap-3">
              <img src="/assets/logo_ITSPP.png" alt="ITSPP" className="h-7 w-auto object-contain opacity-40" />
              <img src="/assets/logo_ICS.png" alt="ICS" className="h-7 w-auto object-contain opacity-40" />
            </div>
          </a>
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="text-[11px] font-medium tracking-[0.2em] text-white/35 hover:text-white/80 transition-colors duration-300">{link.label}</a>
            ))}
          </div>
          {/* Mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white/50 hover:text-white/80 p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0a1628]/98 backdrop-blur-2xl border-t border-white/[0.04] px-6 py-6 space-y-1">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium tracking-[0.15em] text-white/40 hover:text-white/80 transition-colors py-3">{link.label}</a>
            ))}
          </div>
        )}
      </nav>

      <HeroSection />
      <WaveDivider fromColor="#0a1628" toColor="#0a1628" />
      <FranciscoSection />
      <WaveDivider fromColor="#0a1628" toColor="#0c1a30" />
      <StatsSection />
      <AwarenessSection />
      <WaveDivider fromColor="#0c1a30" toColor="#0a1628" flip />
      <MapSection />
      <EquivalenceSection />
      <WaveDivider fromColor="#0a1628" toColor="#0a1628" flip />
      <ProjectSection />
      <FooterSection />
    </div>
  );
}
