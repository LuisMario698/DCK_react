'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { MotorDispositivos } from './motorDispositivos';
import { rampa, suave, usePrefiereMenosMovimiento } from './comun';

/**
 * Acto 2 · «SiMAR, en tus manos». Escena fija (600 vh) al estilo de las páginas de producto de
 * Apple: arriba un título grande y abajo una laptop y un celular en 3D con pantallas reales de la
 * demostración. La laptop se abre, la cámara se acerca al manifiesto y a las firmas, gira para
 * Estadísticas y al final entra el celular con el portal de las empresas recolectoras.
 */

const TOMAS = 6;
const PANTALLAS = [
    '/assets/landing/3d/pantalla-panel.webp',
    '/assets/landing/3d/pantalla-manifiesto.webp',
    '/assets/landing/3d/pantalla-estadisticas.webp',
    '/assets/landing/3d/pantalla-portal.webp',
];
const CELULAR = '/assets/landing/3d/celular-portal.webp';

/** Qué texto va en cada toma (el primero acompaña también la apertura) */
const TEXTOS = [
    {
        tomas: [0, 1],
        antetitulo: 'SiMAR, en tus manos',
        titulo: 'Todo el centro de acopio, en una pantalla.',
        texto: 'Hecho con quienes llenan los manifiestos: botones grandes, letra clara y un paso a la vez.',
    },
    {
        tomas: [2],
        antetitulo: 'Manifiesto digital',
        titulo: 'Un manifiesto en minutos.',
        texto: 'Fecha, embarcación, litros de aceite, filtros y kilos de basura, con el formato MARPOL Anexo V.',
    },
    {
        tomas: [3],
        antetitulo: 'Firmas',
        titulo: 'Firmado ahí mismo.',
        texto: 'Quien recibe, el motorista y el cocinero firman en la pantalla, y el PDF del manifiesto queda guardado.',
    },
    {
        tomas: [4],
        antetitulo: 'Estadísticas',
        titulo: 'Las cifras se cuentan solas.',
        texto: 'Basura, aceite y basurón por semana y por mes, y el reporte del mes para SEMARNAT en PDF.',
    },
    {
        tomas: [5],
        antetitulo: 'Empresas recolectoras',
        titulo: 'Y quien recicla, conectado.',
        texto: 'Las empresas ven lo que hay en el centro de acopio, piden la recolección desde el celular y llevan la cuenta de lo que reciclaron.',
    },
];

function etapaDe(tramo: number) {
    if (tramo >= TOMAS - 1) return TOMAS - 1;
    const k = Math.floor(tramo);
    return k + suave(rampa(tramo - k, 0.32, 0.82));
}

export function ProductoEnEscena() {
    const seccionRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [estado, setEstado] = useState<'cargando' | 'listo' | 'sin3d'>('cargando');
    const [tomaQuieta, setTomaQuieta] = useState(0);
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

        const cargar = async () => {
            if (cargado) return;
            cargado = true;
            const { crearMotorDispositivos } = await import('./motorDispositivos');
            const m = await crearMotorDispositivos(canvas, { movil: window.innerWidth < 768, reducido, pantallas: PANTALLAS, celular: CELULAR });
            if (!vivo) {
                m?.destruir();
                return;
            }
            motor = m;
            setEstado(m ? 'listo' : 'sin3d');
        };

        let antes = performance.now();
        let cuadro = 0;
        let ultimaToma = -1;
        const dibujar = (ahora: number) => {
            cuadro = requestAnimationFrame(dibujar);
            const dt = Math.min(0.05, (ahora - antes) / 1000);
            antes = ahora;
            if (!visible) return;
            const r = seccion.getBoundingClientRect();
            const recorrido = Math.max(1, r.height - window.innerHeight);
            const tramo = Math.min(1, Math.max(0, -r.top / recorrido)) * (TOMAS - 1);

            for (const el of textos) {
                const [desde, hasta] = (el.dataset.texto ?? '0,0').split(',').map(Number);
                const entra = desde === 0 ? 1 : rampa(tramo, desde - 0.22, desde - 0.06);
                const sale = hasta === TOMAS - 1 ? 1 : 1 - rampa(tramo, hasta + 0.28, hasta + 0.44);
                const op = entra * sale;
                el.style.opacity = op.toFixed(3);
                el.style.transform = reducido ? '' : `translate3d(0, ${((1 - entra) * 26 - (1 - sale) * 26).toFixed(1)}px, 0)`;
            }
            const toma = Math.round(tramo);
            if (toma !== ultimaToma) {
                ultimaToma = toma;
                setTomaQuieta(toma);
            }
            motor?.actualizar(etapaDe(tramo), dt);
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

        const alRedimensionar = () => motor?.redimensionar();
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

    // Sin WebGL: la captura de cada toma en un marco sencillo
    const pantallaQuieta = PANTALLAS[[0, 0, 1, 1, 2, 3][tomaQuieta] ?? 0];

    return (
        <section ref={seccionRef} id="producto" aria-label="Cómo funciona SiMAR" className="relative h-[600vh] bg-simar-superficie text-simar-texto">
            <div className="sticky top-0 h-[100svh] overflow-hidden">
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

                {TEXTOS.map((t) => (
                    <div
                        key={t.titulo}
                        data-texto={`${t.tomas[0]},${t.tomas[t.tomas.length - 1]}`}
                        style={{ opacity: t.tomas[0] === 0 ? 1 : 0 }}
                        className="absolute inset-x-0 top-0 px-6 pt-[clamp(108px,14vh,150px)] text-center movil:px-5 movil:pt-[92px]"
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
