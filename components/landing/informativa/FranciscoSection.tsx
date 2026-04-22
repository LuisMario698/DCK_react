'use client';
import { RevealOnScroll } from './useScrollReveal';

export function FranciscoSection() {
  return (
    <section id="francisco" className="py-32 px-6 bg-[#0a1628] relative overflow-hidden">
      {/* Animated Ambient glow */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-cyan-600/[0.04] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow-soft" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-500/[0.03] rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 animate-gentle-float" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-12 gap-16 items-center">
          {/* Text content */}
          <div className="md:col-span-7 space-y-8">
            <RevealOnScroll direction="left" delay={0}>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-950/40 border border-cyan-800/50 rounded-full mb-8">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase">Liderazgo</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                El origen de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">DCK</span>
              </h2>
              <div className="space-y-6">
                <p className="text-white/80 text-[17px] md:text-lg leading-relaxed font-medium">
                  Este proyecto nació de la visión de un hombre comprometido con la conservación de nuestros mares.
                </p>
                <p className="text-white/70 text-base md:text-[17px] leading-relaxed">
                  Con más de 30 años de experiencia, Francisco vio de primera mano cómo el modelo tradicional de reportes en papel limitaba la capacidad de respuesta ante emergencias ecológicas y dificultaba el seguimiento de miles de litros de aceite quemado.
                </p>
                <p className="text-white/70 text-base md:text-[17px] leading-relaxed">
                  Hoy, el <strong className="text-white font-semibold">Sistema de Manifiestos Marítimos</strong> es una realidad tecnológica que garantiza que cada litro de residuo documentado llegue a su destino final, protegiendo el ecosistema marino.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <div className="flex items-center gap-10 pt-6 border-t border-white/[0.06]">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">+10 años</div>
                  <div className="text-[13px] text-white/60 font-semibold uppercase tracking-[0.15em] mt-2">De servicio</div>
                </div>
                <div className="w-px h-12 bg-white/[0.1]" />
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">SEMARNAT</div>
                  <div className="text-[13px] text-white/60 font-semibold uppercase tracking-[0.15em] mt-2">Institución</div>
                </div>
                <div className="w-px h-12 bg-white/[0.1]" />
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">MARPOL</div>
                  <div className="text-[13px] text-white/60 font-semibold uppercase tracking-[0.15em] mt-2">Cumplimiento</div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Image + Quote */}
          <div className="md:col-span-5">
            <RevealOnScroll direction="right" delay={150}>
              <div className="relative animate-gentle-float">
                <div className="relative h-[520px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.1)]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent mix-blend-overlay z-10 pointer-events-none" />
                  <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80" alt="Puerto pesquero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/20 to-transparent z-10" />
                </div>
                {/* Quote card */}
                <div className="absolute -bottom-6 -left-6 right-8 bg-[#0d1a2e]/95 backdrop-blur-xl rounded-xl p-8 border border-white/[0.1] shadow-2xl z-20 group hover:border-cyan-400/40 transition-colors duration-500">
                  <div className="w-8 h-1 bg-cyan-400/70 mb-5 rounded-full group-hover:w-16 group-hover:bg-cyan-400 transition-all duration-500" />
                  <p className="text-white/90 text-lg leading-relaxed italic group-hover:text-white transition-colors duration-500 font-medium">
                    &ldquo;La basura que generan las embarcaciones tiene un impacto grandísimo en el medio ambiente marítimo y terrestre de Puerto Peñasco.&rdquo;
                  </p>
                  <p className="text-cyan-400/80 text-base mt-4 font-bold tracking-wide group-hover:text-cyan-400 transition-colors duration-500">Francisco Javier Bojórquez Ochoa</p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
