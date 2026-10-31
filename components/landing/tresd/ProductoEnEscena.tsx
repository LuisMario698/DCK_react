'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { MotorDispositivos } from './motorDispositivos';
import { avanceDe, crearPrisa, crearRecorrido, crearSeguidor, etapaEn, rampa, scrollDe, suave, textoEn, usePrefiereMenosMovimiento } from './comun';
import { BarraPasos, ImanesPasos, colocarImanes, pintarPasos } from './PasosEscena';

/**
 * Acto 2 · «SiMAR, en tus manos». Escena fija al estilo de las páginas de producto de Apple: arriba
 * un título grande y abajo una laptop y un celular en 3D con pantallas reales de la demostración.
 * La laptop se abre mientras se lee el primer título, la cámara se acerca al manifiesto y a las
 * firmas, gira para Estadísticas y al final entra el celular con el portal de las empresas.
 *
 * Cinco paradas (una por título); el motor tiene seis tomas: 0 cerrada, 1 abierta en el Panel,
 * 2 manifiesto, 3 firmas, 4 Estadísticas y 5 el celular.
 */

const RECORRIDO = crearRecorrido([1.15, 1, 1, 1, 0.85]);
const PARADAS = RECORRIDO.pasos;
/** El imán de la primera parada espera a que la laptop termine de abrirse */
const IMANES = [0.47, 0.28, 0.28, 0.28, 0.3];
const ETIQUETAS = ['El Panel', 'El manifiesto', 'Las firmas', 'Estadísticas', 'Empresas recolectoras'];
const PANTALLAS = [
    '/assets/landing/3d/pantalla-panel.webp',
    '/assets/landing/3d/pantalla-manifiesto.webp',
    '/assets/landing/3d/pantalla-estadisticas.webp',
    '/assets/landing/3d/pantalla-portal.webp',
];
const CELULAR = '/assets/landing/3d/celular-portal.webp';

/** El texto de cada parada (el primero acompaña también la apertura) */
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

/** Toma del motor (0–5) en una posición: la apertura va al principio de la primera parada */
function tomaEn(posicion: number) {
    const apertura = posicion >= 1 ? 1 : suave(rampa(posicion, 0.02, 0.42));
    return etapaEn(posicion, PARADAS) + apertura;
}

export function ProductoEnEscena() {
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
        let visible = false;
        let motor: MotorDispositivos | null = null;
        let cargado = false;
        const textos = Array.from(seccion.querySelectorAll<HTMLElement>('[data-texto]'));
        const rellenos = Array.from(seccion.querySelectorAll<HTMLElement>('[data-relleno]'));
        const botones = Array.from(seccion.querySelectorAll<HTMLElement>('[data-paso]'));
        let vertical = window.innerWidth >= 768;
        let scroll = scrollDe(seccion);
        colocarImanes(seccion, RECORRIDO, IMANES);
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

            for (const el of textos) {
                const [entra, sale] = textoEn(posicion, Number(el.dataset.texto), PARADAS);
                const op = entra * sale * atenua;
                el.style.opacity = op.toFixed(3);
                el.style.transform = reducido ? '' : `translate3d(0, ${((1 - entra) * 26 - (1 - sale) * 26).toFixed(1)}px, 0)`;
            }
            const parada = pintarPasos(rellenos, botones, posicion, vertical);
            if (parada !== ultimaParada) {
                ultimaParada = parada;
                setParadaQuieta(parada);
            }
            motor?.actualizar(tomaEn(posicion), dt);
        };
        cuadro = requestAnimationFrame(dibujar);

        // Se carga un poco antes de llegar (una pantalla de margen) y sólo dibuja cuando se ve
        const cerca = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) void cargar();
            },
            { rootMargin: '100% 0px' }
        );
        cerca.observe(seccion);
        const vista = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '80px 0px' });
        vista.observe(seccion);

        const alRedimensionar = () => {
            motor?.redimensionar();
            vertical = window.innerWidth >= 768;
            scroll = scrollDe(seccion);
            colocarImanes(seccion, RECORRIDO, IMANES);
        };
        window.addEventListener('resize', alRedimensionar);

        return () => {
            vivo = false;
            cancelAnimationFrame(cuadro);
            cerca.disconnect();
            vista.disconnect();
            window.removeEventListener('resize', alRedimensionar);
            motor?.destruir();
        };
    }, [reducido]);

    // Sin WebGL: la captura de cada parada en un marco sencillo
    const pantallaQuieta = PANTALLAS[[0, 1, 1, 2, 3][paradaQuieta] ?? 0];

    return (
        <section ref={seccionRef} id="producto" aria-label="Cómo funciona SiMAR" style={{ height: RECORRIDO.alto }} className="relative bg-simar-superficie text-simar-texto">
            <ImanesPasos pasos={PARADAS} />
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

                <BarraPasos etiquetas={ETIQUETAS} recorrido={RECORRIDO} imanes={IMANES} tono="claro" nombre="Pasos de cómo funciona" />

                {TEXTOS.map((t, j) => (
                    <div
                        key={t.titulo}
                        data-texto={j}
                        style={{ opacity: j === 0 ? 1 : 0 }}
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
