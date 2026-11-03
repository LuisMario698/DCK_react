'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowRight, PlayCircle } from 'lucide-react';
import type { MotorDispositivos } from './motorDispositivos';
import { avanceDe, crearPrisa, crearRecorrido, crearSeguidor, etapaEn, rampa, scrollDe, suave, textoEn, usePrefiereMenosMovimiento } from './comun';
import { BarraPasos, ImanesPasos, colocarImanes, pintarPasos } from './PasosEscena';

/**
 * La portada y «Cómo funciona», en una sola escena fija al estilo de las páginas de producto de
 * Apple: arriba el texto y abajo una laptop y un celular en 3D con pantallas reales de la
 * demostración. La página abre con el título, los botones y la laptop cerrada; al bajar, el título
 * se va y la laptop se abre en el Panel. Luego la cámara se acerca al manifiesto y a las firmas,
 * gira para Estadísticas y al final entra el celular con el portal de las empresas.
 *
 * Seis paradas, una por toma del motor: 0 portada (cerrada), 1 Panel, 2 manifiesto, 3 firmas,
 * 4 Estadísticas y 5 el celular. La barra de pasos cuenta de la 1 a la 5 y aparece al salir de la
 * portada. El ancla #producto queda donde se lee la parada 1 («Ver cómo funciona» lleva ahí).
 */

const RECORRIDO = crearRecorrido([0.8, 1, 1, 1, 1, 0.85]);
const PARADAS = RECORRIDO.pasos;
/** Dónde se detiene el imán de cada parada (la portada, arriba de todo) */
const IMANES = [0, 0.28, 0.28, 0.28, 0.28, 0.3];
const ETIQUETAS = ['El Panel', 'El manifiesto', 'Las firmas', 'Estadísticas', 'Empresas recolectoras'];
const PANTALLAS = [
    '/assets/landing/3d/pantalla-panel.webp',
    '/assets/landing/3d/pantalla-manifiesto.webp',
    '/assets/landing/3d/pantalla-estadisticas.webp',
    '/assets/landing/3d/pantalla-portal.webp',
];
const CELULAR = '/assets/landing/3d/celular-portal.webp';

/** El texto de las paradas 1 a 5 (la 0 es la portada, con su propio diseño) */
const TEXTOS = [
    {
        antetitulo: 'SiMAR, en tus manos',
        titulo: 'Todo el centro de acopio, en una pantalla.',
        texto: 'Hecho con quienes llenan los manifiestos: botones grandes, letra clara y un paso a la vez.',
    },
    {
        antetitulo: 'Manifiesto digital',
        titulo: 'Un manifiesto en minutos.',
        texto: 'Fecha, embarcación, litros de aceite, filtros y kilos de basura, con el formato MARPOL Anexo V.',
    },
    {
        antetitulo: 'Firmas',
        titulo: 'Firmado ahí mismo.',
        texto: 'Quien recibe, el motorista y el cocinero firman en la pantalla, y el PDF del manifiesto queda guardado.',
    },
    {
        antetitulo: 'Estadísticas',
        titulo: 'Las cifras se cuentan solas.',
        texto: 'Basura, aceite y basurón por semana y por mes, y el reporte del mes para SEMARNAT en PDF.',
    },
    {
        antetitulo: 'Empresas recolectoras',
        titulo: 'Y quien recicla, conectado.',
        texto: 'Las empresas ven lo que hay en el centro de acopio, piden la recolección desde el celular y llevan la cuenta de lo que reciclaron.',
    },
];

/**
 * Toma del motor (0–5) en una posición. En la portada la laptop empieza a abrirse con el primer
 * movimiento del scroll (así se entiende que la página responde); después, toma por parada.
 */
function tomaEn(posicion: number) {
    return posicion < 1 ? suave(rampa(posicion, 0.04, 0.92)) : etapaEn(posicion, PARADAS);
}

/** La portada se va pronto, antes de que la tapa abierta llegue a la altura del título */
const portadaSale = (posicion: number) => 1 - rampa(posicion, 0.08, 0.4);

const BOTON =
    'simar-presiona min-h-[58px] px-7 rounded-full text-lg inline-flex items-center gap-2 transition-colors movil:min-h-[52px] movil:px-5 movil:text-[17px]';

export function ProductoEnEscena({ textoEntrar, alEntrar, rutaDemo }: { textoEntrar: string; alEntrar: () => void; rutaDemo: string | null }) {
    const seccionRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [estado, setEstado] = useState<'cargando' | 'listo' | 'sin3d'>('cargando');
    const [paradaQuieta, setParadaQuieta] = useState(0);
    const reducido = usePrefiereMenosMovimiento();

    useEffect(() => {
        const seccion = seccionRef.current;
        const canvas = canvasRef.current;
        if (!seccion || !canvas) return;

        let vivo = true;
        let visible = true;
        let motor: MotorDispositivos | null = null;
        let cargado = false;
        const portada = seccion.querySelector<HTMLElement>('[data-portada]');
        const aviso = seccion.querySelector<HTMLElement>('[data-portada-aviso]');
        const barra = seccion.querySelector<HTMLElement>('[data-barra]');
        const ancla = seccion.querySelector<HTMLElement>('#producto');
        const textos = Array.from(seccion.querySelectorAll<HTMLElement>('[data-texto]'));
        const rellenos = Array.from(seccion.querySelectorAll<HTMLElement>('[data-relleno]'));
        const botones = Array.from(seccion.querySelectorAll<HTMLElement>('[data-paso]'));
        let vertical = window.innerWidth >= 768;
        let scroll = scrollDe(seccion);
        const escenario = seccion.querySelector<HTMLElement>('[data-escenario]');
        // Dónde termina el texto de la portada (sin contar su transform): la laptop va debajo
        const libre = () => (portada && escenario ? (portada.offsetTop + portada.offsetHeight) / Math.max(1, escenario.clientHeight) + 0.015 : 0.6);
        const colocar = () => {
            colocarImanes(seccion, RECORRIDO, IMANES);
            if (ancla) ancla.style.top = `${Math.round(RECORRIDO.avance(1 + IMANES[1]) * scroll)}px`;
        };
        colocar();
        // Una sola posición seguida (con resorte) para textos, barra y cámara
        const seguidor = crearSeguidor();
        const prisa = crearPrisa();

        const cargar = async () => {
            if (cargado) return;
            cargado = true;
            const { crearMotorDispositivos } = await import('./motorDispositivos');
            const m = await crearMotorDispositivos(canvas, {
                movil: window.innerWidth < 768,
                reducido,
                pantallas: PANTALLAS,
                celular: CELULAR,
                logo: '/assets/simar/simbolo-grande.png',
                portadaLibre: libre(),
            });
            if (!vivo) {
                m?.destruir();
                return;
            }
            motor = m;
            setEstado(m ? 'listo' : 'sin3d');
        };

        let antes = performance.now();
        let cuadro = 0;
        let ultimaParada = -1;
        let barraVisible = false;
        const dibujar = (ahora: number) => {
            cuadro = requestAnimationFrame(dibujar);
            // Hasta 0.1 s por cuadro: en un celular lento la escena sigue al dedo sin quedarse atrás
            const dt = Math.min(0.1, (ahora - antes) / 1000);
            antes = ahora;
            const real = RECORRIDO.posicion(avanceDe(seccion, scroll));
            if (!visible) {
                seguidor.saltar(real);
                return;
            }
            const posicion = reducido ? real : seguidor.seguir(real, dt);
            const atenua = 1 - (reducido ? 0 : prisa(seguidor.velocidad, dt));

            if (portada) {
                const sale = portadaSale(posicion);
                portada.style.opacity = sale.toFixed(3);
                portada.style.transform = reducido ? '' : `translate3d(0, ${(-(1 - sale) * 40).toFixed(1)}px, 0)`;
                portada.style.visibility = sale > 0 ? '' : 'hidden';
            }
            if (aviso) aviso.style.opacity = (1 - rampa(posicion, 0.01, 0.1)).toFixed(3);
            for (const el of textos) {
                const [entra, sale] = textoEn(posicion, Number(el.dataset.texto), PARADAS);
                const op = entra * sale * atenua;
                el.style.opacity = op.toFixed(3);
                el.style.transform = reducido ? '' : `translate3d(0, ${((1 - entra) * 26 - (1 - sale) * 26).toFixed(1)}px, 0)`;
            }
            // La barra de pasos aparece cuando la laptop termina de abrirse
            if (barra) {
                const op = rampa(posicion, 0.6, 0.9);
                barra.style.opacity = op.toFixed(3);
                if (op > 0 !== barraVisible) {
                    barraVisible = op > 0;
                    barra.style.visibility = barraVisible ? '' : 'hidden';
                }
            }
            pintarPasos(rellenos, botones, posicion - 1, vertical);
            const parada = Math.min(PARADAS - 1, Math.max(0, Math.floor(posicion + 0.25)));
            if (parada !== ultimaParada) {
                ultimaParada = parada;
                setParadaQuieta(parada);
            }
            motor?.actualizar(tomaEn(posicion), dt);
        };
        cuadro = requestAnimationFrame(dibujar);

        // three.js se baja cuando el navegador queda libre: primero se pinta y responde la portada
        const conIdle = typeof window.requestIdleCallback === 'function';
        const espera = conIdle ? window.requestIdleCallback(() => void cargar(), { timeout: 700 }) : setTimeout(() => void cargar(), 150);
        const vista = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '80px 0px' });
        vista.observe(seccion);

        const alRedimensionar = () => {
            motor?.redimensionar();
            motor?.portada(libre());
            vertical = window.innerWidth >= 768;
            scroll = scrollDe(seccion);
            colocar();
        };
        window.addEventListener('resize', alRedimensionar);

        return () => {
            vivo = false;
            cancelAnimationFrame(cuadro);
            if (conIdle) window.cancelIdleCallback(espera as number);
            else clearTimeout(espera);
            vista.disconnect();
            window.removeEventListener('resize', alRedimensionar);
            motor?.destruir();
        };
    }, [reducido]);

    // Sin WebGL: la captura de cada parada en un marco sencillo
    const pantallaQuieta = PANTALLAS[[0, 0, 1, 1, 2, 3][paradaQuieta] ?? 0];

    return (
        <section ref={seccionRef} id="inicio" aria-label="SiMAR y cómo funciona" style={{ height: RECORRIDO.alto }} className="relative bg-simar-superficie text-simar-texto">
            <ImanesPasos pasos={PARADAS} />
            {/* «Cómo funciona» empieza en la parada 1 (colocar() lo pone en su lugar) */}
            <div id="producto" aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-px h-px" />
            <div data-escenario className="sticky top-0 h-[100svh] overflow-hidden">
                {/* Un brillo muy suave detrás de los dispositivos */}
                <div aria-hidden="true" className="t3-escenario pointer-events-none absolute inset-0" />
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${estado === 'listo' ? 'opacity-100' : 'opacity-0'}`}
                />
                {estado === 'sin3d' && (
                    <div className="absolute inset-x-6 bottom-[8vh] mx-auto max-w-[880px] rounded-[22px] border-[10px] border-[#1b1d21] bg-[#1b1d21] shadow-simar overflow-hidden">
                        <Image src={pantallaQuieta} alt="" width={1600} height={1000} className="w-full h-auto rounded-[12px]" />
                    </div>
                )}

                <BarraPasos etiquetas={ETIQUETAS} recorrido={RECORRIDO} imanes={IMANES} desde={1} tono="claro" nombre="Pasos de cómo funciona" />

                {/* 0 · La portada de la página */}
                <div data-portada className="absolute inset-x-0 top-0 px-6 pt-[clamp(104px,15vh,168px)] text-center movil:px-5 movil:pt-[100px]">
                    <p className="text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">SiMAR · Puerto Peñasco, Sonora</p>
                    <h1 className="mx-auto mt-3 max-w-[18ch] text-balance text-[clamp(40px,min(5.3vw,8vh),80px)] font-extrabold leading-[1.02] tracking-[-0.035em] movil:mt-2 movil:text-[34px] movil:leading-[1.06] movil:tracking-[-0.02em]">
                        Cuidar el mar empieza por contar lo que sale de él.
                    </h1>
                    <p className="mx-auto mt-5 max-w-[50ch] text-pretty text-xl md:text-[21px] leading-relaxed text-simar-texto-2 movil:mt-3 movil:text-[16px]">
                        SiMAR digitaliza los manifiestos de residuos de las embarcaciones pesqueras: cada litro de aceite y cada kilo de basura, registrado, firmado y comprobado.
                    </p>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3 movil:mt-5 movil:gap-2.5">
                        <a href="#producto" className={`${BOTON} bg-simar-marea hover:bg-simar-marea-hover text-white font-extrabold`}>
                            Ver cómo funciona
                            <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
                        </a>
                        {rutaDemo ? (
                            <a href={rutaDemo} className={`${BOTON} border-2 border-simar-campo-borde text-simar-texto font-bold hover:bg-simar-texto/5`}>
                                <PlayCircle className="w-5 h-5" />
                                Probar la demo
                            </a>
                        ) : (
                            <button type="button" onClick={alEntrar} className={`${BOTON} border-2 border-simar-campo-borde text-simar-texto font-bold hover:bg-simar-texto/5 cursor-pointer`}>
                                {textoEntrar}
                            </button>
                        )}
                    </div>
                </div>
                <div data-portada-aviso aria-hidden="true" className="absolute inset-x-0 bottom-6 flex justify-center movil:bottom-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-simar-superficie/80 px-4 py-2 text-[15px] font-bold text-simar-texto-2 backdrop-blur-md">
                        <ArrowDown className="w-4 h-4 t3-baja" />
                        Baja para abrirla
                    </span>
                </div>

                {TEXTOS.map((t, i) => (
                    <div
                        key={t.titulo}
                        data-texto={i + 1}
                        style={{ opacity: 0 }}
                        className="absolute inset-x-0 top-0 px-6 pt-[clamp(108px,14vh,150px)] text-center movil:px-5 movil:pt-[124px]"
                    >
                        <p className="text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">{t.antetitulo}</p>
                        <h2 className="mx-auto mt-3 max-w-[22ch] text-[clamp(36px,3.9vw,60px)] font-extrabold leading-[1.04] tracking-[-0.03em] movil:mt-2 movil:text-[28px] movil:leading-[1.1] movil:tracking-[-0.02em]">
                            {t.titulo}
                        </h2>
                        <p className="mx-auto mt-4 max-w-[60ch] text-xl md:text-[20px] leading-relaxed text-simar-texto-2 movil:mt-2.5 movil:text-[16px]">{t.texto}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
