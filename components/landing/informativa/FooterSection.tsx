'use client';
import { RevealOnScroll } from './useScrollReveal';

export function FooterSection() {
  return (
    <footer className="bg-[#060d1a] pt-8 pb-16 px-6 border-t border-white/[0.04]">
      {/* CTA */}
      <RevealOnScroll>
        <div className="max-w-4xl mx-auto text-center mb-24 py-16 px-8 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05]">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Únete a la conciencia azul</h2>
          <p className="text-white/35 text-lg max-w-xl mx-auto mb-8 leading-relaxed">Cada acción cuenta. Desde registrar un manifiesto hasta compartir esta información, todos contribuimos a proteger nuestros mares.</p>
          <a href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0a1628] font-semibold tracking-wide rounded-full hover:shadow-lg hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Ir a la plataforma
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </RevealOnScroll>

      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-4 mb-6">
              <img src="/assets/logo_DCK.png" alt="DCK Logo" className="h-14 w-auto object-contain" />
              <div className="h-8 w-px bg-white/[0.06]" />
              <img src="/assets/logo_ITSPP.png" alt="ITSPP Logo" className="h-10 w-auto object-contain opacity-60" />
            </div>
            <p className="text-white/25 text-sm leading-relaxed max-w-sm mb-4">
              Sistema de Gestión de Residuos Marinos — Desarrollado por estudiantes de Ingeniería en Sistemas Computacionales del Instituto Tecnológico Superior de Puerto Peñasco, en colaboración con DCK Conciencia y Cultura y SEMARNAT.
            </p>
            <div className="text-white/20 text-xs">Puerto Peñasco, Sonora, México</div>
          </div>

          {/* Team */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-[0.15em] mb-5">Equipo</h4>
            <ul className="space-y-2.5 text-white/30 text-sm">
              <li>Michelle Jacquelinne Diaz Aguirre</li>
              <li>Darien Alejandro Verdugo Reyna</li>
              <li>Abrham Sayd Martinez Corrales</li>
            </ul>
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-[0.15em] mt-8 mb-5">Asesores</h4>
            <ul className="space-y-2.5 text-white/30 text-sm">
              <li>Francisco Javier Bojórquez Ochoa <span className="text-white/15">· Externo</span></li>
              <li>Diana Elizabeth López Chacón <span className="text-white/15">· Interno</span></li>
            </ul>
          </div>

          {/* Institutions + Norms */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-[0.15em] mb-5">Instituciones</h4>
            <ul className="space-y-2.5 text-white/30 text-sm">
              <li>ITSPP — Instituto Tecnológico Superior de Puerto Peñasco</li>
              <li>DCK — Conciencia y Cultura</li>
              <li>SEMARNAT</li>
            </ul>
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-[0.15em] mt-8 mb-5">Marco Normativo</h4>
            <ul className="space-y-2.5 text-white/30 text-sm">
              <li>Convenio MARPOL (OMI)</li>
              <li>LGPGIR (México)</li>
              <li>NOM-001-SEMARNAT-2021</li>
              <li>ODS 14 — Vida Submarina</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-white/[0.04] text-center text-white/15 text-xs tracking-wide">
          © {new Date().getFullYear()} DCK Conciencia y Cultura / ITSPP. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
