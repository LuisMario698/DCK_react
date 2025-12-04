'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';

const IMAGES = [
    'https://images.unsplash.com/photo-1516937941348-c09645f8b927?auto=format&fit=crop&q=80', // Port container
    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80', // Ocean
    'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80', // Ship
];

export function VariantCinematic() {
    const [currentImage, setCurrentImage] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-gray-900 font-sans text-white selection:bg-blue-500 selection:text-white">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo_DCK.png" alt="DCK Logo" className="h-12 w-auto object-contain" />
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
                        <a href="#about" className="hover:text-blue-400 transition-colors">CONCIENCIA AZUL</a>
                        <a href="#services" className="hover:text-blue-400 transition-colors">SERVICIOS</a>
                        <a href="#impact" className="hover:text-blue-400 transition-colors">IMPACTO</a>
                    </div>
                    <Link
                        href="/dashboard"
                        className="px-6 py-2 bg-white text-black font-bold text-sm tracking-wide hover:bg-blue-500 hover:text-white transition-colors rounded-sm"
                    >
                        ACCESO CLIENTES
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative h-screen flex flex-col justify-center items-center text-center px-6">
                {/* Background Layers */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${IMAGES[0]})`, opacity: mounted ? 0 : 1 }}
                />
                <div className="absolute inset-0 z-0">
                    {IMAGES.map((src, index) => (
                        <div
                            key={src}
                            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${mounted && index === currentImage ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <img src={src} alt="Background" className="h-full w-full object-cover transform scale-105 animate-ken-burns" />
                        </div>
                    ))}
                </div>
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/30 z-10"></div>

                {/* Hero Content */}
                <div className="relative z-20 max-w-5xl space-y-8 animate-fade-in-up">
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
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce text-white/50">
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
                            <img src="/logo_DCK.png" alt="DCK Logo" className="h-16 w-auto object-contain" />
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
