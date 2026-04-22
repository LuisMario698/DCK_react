'use client';
import { RevealOnScroll } from './useScrollReveal';

const TIMELINE = [
  { year: '2014', title: 'Inicio de registros', desc: 'Don Francisco comienza el registro manual de residuos mediante manifiestos físicos en el puerto pesquero.', side: 'left' as const },
  { year: '2024', title: 'Nace el proyecto digital', desc: 'Estudiantes del ITSPP, en colaboración con DCK y SEMARNAT, diseñan y desarrollan el sistema web.', side: 'right' as const },
  { year: '2025', title: 'Digitalización masiva', desc: 'Se procesan más de 5,000 reportes físicos con apoyo de voluntarios. Se realiza la entrega oficial del sistema.', side: 'left' as const },
  { year: '2026', title: 'Expansión y evolución', desc: 'El sistema evoluciona con nueva interfaz, estadísticas en tiempo real y planes de expansión a más puertos.', side: 'right' as const },
];

const FEATURES = [
  {
    title: 'Registro digital',
    desc: 'Manifiestos electrónicos con firma digital, reemplazando procesos manuales que acumulaban miles de documentos en papel.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
    ),
  },
  {
    title: 'Trazabilidad total',
    desc: 'Seguimiento del ciclo completo de cada residuo — desde la embarcación hasta su disposición final certificada.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
    ),
  },
  {
    title: 'Reportes automáticos',
    desc: 'Generación de estadísticas, PDFs y reportes para cumplimiento normativo MARPOL y toma de decisiones.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
    ),
  },
];

export function ProjectSection() {
  return (
    <section id="proyecto" className="py-32 px-6 bg-gradient-to-b from-[#0a1628] to-[#0c1a30] relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-24">
            <span className="text-purple-400 text-sm font-semibold tracking-[0.3em] uppercase">El Proyecto</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-5 text-white tracking-tight">Tecnología al servicio del mar</h2>
            <p className="text-white/70 text-xl leading-relaxed">Un sistema pionero en México que digitaliza la gestión de residuos de embarcaciones pesqueras.</p>
          </div>
        </RevealOnScroll>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent hidden md:block" />
          
          {TIMELINE.map((item, i) => (
            <RevealOnScroll key={i} delay={i * 120} direction={item.side === 'left' ? 'left' : 'right'}>
              <div className={`relative flex items-center mb-16 last:mb-0 ${item.side === 'right' ? 'md:flex-row-reverse' : ''}`}>
                <div className={`w-full md:w-5/12 ${item.side === 'right' ? 'md:text-left md:pl-12' : 'md:text-right md:pr-12'}`}>
                  <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-all duration-300">
                    <span className="text-cyan-400 font-mono text-base font-bold">{item.year}</span>
                    <h3 className="text-xl font-bold text-white mt-2 mb-2">{item.title}</h3>
                    <p className="text-white/60 text-[15px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                {/* Center dot - Animated */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0a1628] border-2 border-cyan-400 z-10 items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse-glow-soft" />
                </div>
                <div className="hidden md:block w-5/12" />
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Features */}
        <div className="mt-28 grid md:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <RevealOnScroll key={i} delay={i * 100}>
              <div className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/10 transition-colors duration-500" />
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-cyan-400/60 mb-5 group-hover:scale-110 group-hover:text-cyan-400 group-hover:border-cyan-400/30 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-500">
                    <div className="group-hover:animate-gentle-float">
                      {feat.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-50 transition-colors">{feat.title}</h3>
                  <p className="text-white/60 leading-relaxed text-base">{feat.desc}</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
