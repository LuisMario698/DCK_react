'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';

const MEDIA = [
    { type: 'image', src: 'https://images.unsplash.com/photo-1516937941348-c09645f8b927?auto=format&fit=crop&q=80' }, // Port container
    { type: 'video', src: 'https://cdn.pixabay.com/video/2020/05/25/40139-424930032_large.mp4', poster: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b0?auto=format&fit=crop&q=80' }, // Ocean waves video
    { type: 'image', src: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80' }, // Ship
    { type: 'video', src: 'https://cdn.pixabay.com/video/2019/04/23/23011-332483109_large.mp4', poster: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80' }, // Aerial sea video
    { type: 'image', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80' }, // Beach/Ocean generic
];

export function VariantCinematic() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setPrevIndex(currentIndex);
            setCurrentIndex((prev) => (prev + 1) % MEDIA.length);
        }, 6000); // Increased duration for better viewing
        return () => clearInterval(interval);
    }, [currentIndex]);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-gray-900 font-sans text-white selection:bg-blue-500 selection:text-white">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-500">
                <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
                    <div className="group flex items-center gap-6 rounded-full px-6 py-3 transition-all duration-300 hover:bg-white/95 hover:shadow-xl hover:scale-105 cursor-default">
                        {/* DCK Logo - Swaps on hover */}
                        {/* DCK Logo - Swaps on hover */}
                        <div className="relative h-20 w-auto">
                            <img src="/assets/logo_DCK.png" alt="DCK Logo" className="h-full w-auto object-contain drop-shadow-lg" />
                        </div>

                        <div className="h-12 w-px bg-white/30 transition-colors duration-300 group-hover:bg-black/10"></div>

                        <div className="flex items-center gap-5">
                            <img src="/assets/logo_ITSPP.png" alt="ITSPP Logo" className="h-14 w-auto object-contain opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:drop-shadow-none drop-shadow-md" />
                            <img src="/assets/logo_ICS.png" alt="ICS Logo" className="h-14 w-auto object-contain opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:drop-shadow-none drop-shadow-md" />
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-10 text-sm font-bold tracking-widest text-white/90">
                        <a href="#about" className="hover:text-blue-400 transition-colors drop-shadow-md">CONCIENCIA AZUL</a>
                        <a href="#services" className="hover:text-blue-400 transition-colors drop-shadow-md">SERVICIOS</a>
                        <a href="#impact" className="hover:text-blue-400 transition-colors drop-shadow-md">IMPACTO</a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
                {/* Background Layers */}
                <div className="absolute inset-0 z-0 bg-black">
                    {MEDIA.map((item, index) => {
                        const isActive = index === currentIndex;
                        const isPrev = index === prevIndex;
                        // Keep previous slide visible (opacity 1) until it's no longer previous or active
                        // Actually, we want the NEW slide to fade in ON TOP of the OLD slide.
                        // So OLD slide should stay opacity-100.
                        // But eventually OLD slide needs to hide.
                        // When does OLD slide hide? When it is neither active nor prev?
                        // If we cycle 0 -> 1. Prev=0, Curr=1.
                        // 0 is visible. 1 fades in.
                        // When we go 1 -> 2. Prev=1, Curr=2.
                        // 0 is now hidden.

                        let zIndex = 0;
                        let opacity = 'opacity-0';

                        if (isActive) {
                            zIndex = 20;
                            opacity = 'opacity-100';
                        } else if (isPrev) {
                            zIndex = 10;
                            opacity = 'opacity-100';
                        }

                        return (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${opacity}`}
                                style={{ zIndex }}
                            >
                                {item.type === 'video' ? (
                                    <video
                                        src={item.src}
                                        poster={item.poster}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={item.src}
                                        alt="Background"
                                        className="h-full w-full object-cover transform scale-105 animate-ken-burns"
                                    />
                                )}
                                {/* Overlay for text readability */}
                                <div className="absolute inset-0 bg-black/40"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/30 z-20 pointer-events-none"></div>

                {/* Hero Content */}
                <div className="relative z-30 max-w-5xl space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-md">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                        <span className="text-blue-300 text-sm font-medium tracking-widest uppercase">Puerto Peñasco, Sonora</span>
                    </div>
                    <h1 className="text-6xl md:text-9xl font-bold leading-none tracking-tighter text-white drop-shadow-2xl">
                        CONCIENCIA <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">AZUL</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed">
                        Transformando la gestión marítima con trazabilidad digital y compromiso ecológico.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 rounded-sm"
                        >
                            PLATAFORMA DIGITAL <Icons.ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 animate-bounce text-white/50">
                    <Icons.ArrowRight className="w-6 h-6 rotate-90" />
                </div>
            </header>

            {/* About Section */}
            <section id="about" className="py-32 px-6 bg-gray-900 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                            <span className="text-blue-500">DCK</span> y <span className="text-white">ITSPP</span>: <br />
                            Innovación por el Mar.
                        </h2>
                        <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
                            <p>
                                En colaboración con <strong>DCK Conciencia y Cultura</strong> y el <strong>Instituto Tecnológico Superior de Puerto Peñasco</strong>,
                                hemos desarrollado una solución pionera para la gestión de residuos marítimos.
                            </p>
                            <p>
                                Nuestro sistema digitaliza y centraliza el registro de desechos de embarcaciones,
                                reemplazando procesos manuales obsoletos para garantizar la trazabilidad total
                                y el cumplimiento de normativas internacionales como <strong>MARPOL</strong>.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">SEMARNAT</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Colaboración Estratégica</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">MARPOL</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Cumplimiento Anexo V</div>
                            </div>
                        </div>
                    </div>
                    <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1468581264429-2548ef9eb732?auto=format&fit=crop&q=80"
                            alt="Ocean"
                            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-32 px-6 bg-black relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Gestión Integral de Residuos</h2>
                        <p className="text-gray-400 text-lg">
                            Tecnología aplicada a la sostenibilidad del Mar de Cortés.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'Registro Digital', desc: 'Digitalización de manifiestos de entrega-recepción de residuos (aceites, filtros, basura).', icon: Icons.Document },
                            { title: 'Trazabilidad Total', desc: 'Seguimiento completo del ciclo de vida del residuo, desde la embarcación hasta su disposición final.', icon: Icons.Dashboard },
                            { title: 'Estadísticas Ambientales', desc: 'Generación automática de reportes y KPIs para la toma de decisiones estratégicas.', icon: Icons.Chart },
                        ].map((service, i) => (
                            <div key={i} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2">
                                <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                    <service.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section (Stats) */}
            <section id="impact" className="py-32 px-6 bg-blue-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16 text-white">Impacto del Proyecto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="p-8 backdrop-blur-sm bg-white/5 rounded-3xl border border-white/10">
                            <div className="text-6xl font-bold text-blue-300 mb-2">5,000+</div>
                            <div className="text-lg text-blue-100 font-medium">Reportes Digitalizados</div>
                        </div>
                        <div className="p-8 backdrop-blur-sm bg-white/5 rounded-3xl border border-white/10">
                            <div className="text-6xl font-bold text-blue-300 mb-2">100%</div>
                            <div className="text-lg text-blue-100 font-medium">Trazabilidad Digital</div>
                        </div>
                        <div className="p-8 backdrop-blur-sm bg-white/5 rounded-3xl border border-white/10">
                            <div className="text-6xl font-bold text-blue-300 mb-2">2014-2025</div>
                            <div className="text-lg text-blue-100 font-medium">Histórico Recuperado</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black py-20 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/assets/logo_DCK.png" alt="DCK Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <p className="text-gray-500 max-w-md mb-8">
                            Sistema de Gestión de Residuos Marinos. <br />
                            Desarrollado por estudiantes de Ingeniería en Sistemas Computacionales del ITSPP.
                        </p>
                        <div className="flex gap-4">
                            {/* Social placeholders */}
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                                <Icons.Globe className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">Créditos</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li>Michelle Jacquelinne Diaz Aguirre</li>
                            <li>Darien Alejandro Verdugo Reyna</li>
                            <li>Abrham Sayd Martinez Corrales</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">Institucional</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-white">ITSPP</a></li>
                            <li><a href="#" className="hover:text-white">DCK Conciencia y Cultura</a></li>
                            <li><a href="#" className="hover:text-white">SEMARNAT</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
                    © 2025 DCK / ITSPP. Todos los derechos reservados.
                </div>
            </footer>

        </div>
    );
}
