'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { cuandoEnReposo } from '@/lib/utils/reposo';

/** Segundos que se queda cada fotografía del carrusel (la píldora activa se llena en ese tiempo) */
const SEGUNDOS_POR_FOTO = 6;

/**
 * Fotografías de fondo del hero. `encuadre` = object-position (dónde recortar las verticales).
 * Los reconocimientos (img6, img7) no van aquí: su texto grande pelea con el logo.
 */
const MEDIA: { src: string; encuadre?: string }[] = [
    { src: '/assets/images/img1.jpeg' },
    { src: '/assets/images/img2.jpeg' },
    { src: '/assets/images/img3.jpeg', encuadre: '50% 30%' },
    { src: '/assets/images/img5.jpeg', encuadre: '50% 35%' },
    { src: '/assets/images/img4.jpeg', encuadre: '50% 20%' },
];

/**
 * Las fotografías de fondo de la portada y sus controles, con su propio estado: cambiar de foto
 * sólo redibuja esto, no toda la landing. `children` es el contenido de la portada, que va entre
 * el fondo y los controles (así el orden en la página, y el del tabulador, no cambia).
 */
export function CarruselPortada({ children }: { children: ReactNode }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);

    // Carrusel: se puede pausar (botón, o al pasar el cursor / enfocar la foto).
    // Con "reducir movimiento" no avanza solo.
    const reducirMovimiento = usePrefiereMenosMovimiento();
    const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false);
    const [pausaMomentanea, setPausaMomentanea] = useState(false);
    const carruselPausado = pausadoPorUsuario || pausaMomentanea;

    // Las fotos que ya se pidieron. Al cargar, sólo la primera (las cinco a 1920 px competían con ella
    // y con el JavaScript); la segunda se pide ya en reposo, y cada cambio prepara la que sigue
    const [fotosPedidas, setFotosPedidas] = useState<ReadonlySet<number>>(() => new Set([0]));
    const pedirFotos = (...indices: number[]) =>
        setFotosPedidas((antes) => (indices.every((i) => antes.has(i)) ? antes : new Set([...antes, ...indices])));
    useEffect(() => cuandoEnReposo(() => pedirFotos(1)), []);

    // Cambia de foto: la anterior se queda debajo mientras la nueva se funde encima
    const irAFoto = (indice: number) => {
        if (indice === currentIndex) return;
        pedirFotos(indice, (indice + 1) % MEDIA.length);
        setPrevIndex(currentIndex);
        setCurrentIndex(indice);
    };
    // El avance lo marca la barra de la píldora activa: al terminar de llenarse, sigue la próxima.
    // Así la pausa detiene la barra y el cambio a la vez.
    const alTerminarAvance = () => irAFoto((currentIndex + 1) % MEDIA.length);

    return (
        <>
            {/* Fondo: las fotografías se funden y se enfocan una sobre otra. Son decorativas
                (el texto no depende de ellas); el velo oscurece para que todo se lea */}
            <div aria-hidden="true" className="simar-aparece absolute inset-0 -z-10">
                {MEDIA.map((foto, index) =>
                    fotosPedidas.has(index) ? (
                        <Image
                            key={foto.src}
                            src={foto.src}
                            alt=""
                            fill
                            sizes="100vw"
                            // Van bajo un velo oscuro y un tinte: con calidad 60 no se nota y pesan menos
                            quality={60}
                            // La primera es la que se ve al llegar (el LCP) y se pide antes que todo; las
                            // demás (pedirFotos) llegan después, sin quitarle ancho de banda
                            loading="eager"
                            fetchPriority={index === 0 ? 'high' : 'low'}
                            data-estado={index === currentIndex ? 'activa' : index === prevIndex ? 'anterior' : undefined}
                            className="simar-hero-foto object-cover"
                            style={{ objectPosition: foto.encuadre }}
                        />
                    ) : null
                )}
                <div className="simar-hero-tinte absolute inset-0 z-[5]" />
                <div className="simar-hero-velo absolute inset-0 z-10" />
            </div>

            {children}

            {/* Controles de las fotografías. Se pausan con el botón o al pasar el cursor / enfocar los controles
                (el cursor sobre el fondo no las detiene: están detrás de todo el hero) */}
            <div className="absolute z-20 inset-x-0 bottom-16 md:bottom-24 px-6 md:px-12 lg:px-24 flex justify-center lg:justify-end pointer-events-none movil:bottom-12">
                <div
                    role="group"
                    aria-label={`Fotografía ${currentIndex + 1} de ${MEDIA.length}`}
                    className="simar-enfoca simar-vidrio-fuerte vidrio-destello pointer-events-auto relative rounded-full pl-1.5 pr-3 py-1.5 flex items-center gap-1"
                    style={{ animationDelay: '1.7s' }}
                    onMouseEnter={() => setPausaMomentanea(true)}
                    onMouseLeave={() => setPausaMomentanea(false)}
                    onFocus={() => setPausaMomentanea(true)}
                    onBlur={() => setPausaMomentanea(false)}
                >
                    {!reducirMovimiento && (
                        <button
                            type="button"
                            onClick={() => setPausadoPorUsuario((p) => !p)}
                            aria-label={pausadoPorUsuario ? 'Reanudar fotografías' : 'Pausar fotografías'}
                            title={pausadoPorUsuario ? 'Reanudar' : 'Pausar'}
                            data-vidrio="claro"
                            className="simar-presiona w-11 h-11 rounded-full flex items-center justify-center text-simar-texto hover:bg-simar-texto/10 cursor-pointer"
                        >
                            {pausadoPorUsuario ? (
                                <Play className="w-[18px] h-[18px] ml-0.5" strokeWidth={2.4} />
                            ) : (
                                <Pause className="w-[18px] h-[18px]" strokeWidth={2.4} />
                            )}
                        </button>
                    )}
                    {MEDIA.map((_, index) => {
                        const activa = index === currentIndex;
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => irAFoto(index)}
                                aria-label={`Ver fotografía ${index + 1}`}
                                aria-current={activa ? 'true' : undefined}
                                className="h-11 px-[5px] flex items-center cursor-pointer group/punto"
                            >
                                <span
                                    style={{ transitionTimingFunction: 'var(--isla-rebote)' }}
                                    className={`relative block h-2.5 rounded-full overflow-hidden transition-[width,background-color] duration-500 ${
                                        activa ? 'w-10 bg-simar-texto/25' : 'w-2.5 bg-simar-texto/30 group-hover/punto:bg-simar-texto/60'
                                    }`}
                                >
                                    {/* La barra se llena mientras corre la foto; al llenarse pasa a la siguiente. En pausa se detiene donde va */}
                                    {activa && (
                                        <span
                                            key={currentIndex}
                                            className={`absolute inset-0 rounded-full bg-simar-texto ${reducirMovimiento ? '' : 'simar-avance'}`}
                                            style={{
                                                '--simar-avance-dur': `${SEGUNDOS_POR_FOTO}s`,
                                                animationPlayState: carruselPausado ? 'paused' : 'running',
                                            } as CSSProperties}
                                            onAnimationEnd={alTerminarAvance}
                                        />
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
