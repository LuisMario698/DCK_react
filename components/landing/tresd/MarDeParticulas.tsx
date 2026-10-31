'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, PlayCircle } from 'lucide-react';
import type { MotorParticulas } from './motorParticulas';
import { avanceDe, crearRecorrido, etapaEn, rampa, textoEn, usePrefiereMenosMovimiento } from './comun';
import { BarraPasos, ImanesPasos, colocarImanes, pintarPasos } from './PasosEscena';

/**
 * Acto 1 · «Mar de partículas». Una escena fija y alta: el escenario se queda pegado arriba y,
 * mientras se baja, las partículas pasan por seis figuras y a un lado aparece el texto de cada
 * parada. Todo depende de cuánto se ha bajado, no del tiempo: al subir se revierte.
 *
 * Paradas: 0 mar (portada) · 1 gota · 2 mancha · 3 papel · 4 golfo · 5 símbolo. Cómo se reparte
 * el scroll de cada parada (lectura quieta, luego viaje): `crearRecorrido` en comun.ts.
 */

/** Cuánto scroll le toca a cada parada (la de la mancha más: ahí corre el contador) */
const RECORRIDO = crearRecorrido([0.6, 1, 1.3, 1, 1, 0.85]);
const PARADAS = RECORRIDO.pasos;
/** Dónde se detiene el imán de cada parada (la portada arriba; la mancha ya crecida) */
const IMANES = [0, 0.28, 0.5, 0.28, 0.28, 0.3];
const ETIQUETAS = ['Inicio', 'Una gota', 'Un litro de aceite', 'El papel', 'Puerto Peñasco', 'SiMAR'];

/** La mancha crece cuando cae la gota y durante la primera mitad de su parada */
const manchaDe = (posicion: number) => rampa(posicion, 1.86, 2.46);

const litros = (mancha: number) => Math.round(Math.pow(10, 6 * mancha)).toLocaleString('es-MX');

export function MarDeParticulas({
    textoEntrar,
    alEntrar,
    rutaDemo,
}: {
    textoEntrar: string;
    alEntrar: () => void;
    rutaDemo: string | null;
}) {
    const seccionRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [listo, setListo] = useState(false);
    const reducido = usePrefiereMenosMovimiento();

    useEffect(() => {
        const seccion = seccionRef.current;
        const canvas = canvasRef.current;
        if (!seccion || !canvas) return;

        let vivo = true;
        let visible = true;
        let motor: MotorParticulas | null = null;
        const textos = Array.from(seccion.querySelectorAll<HTMLElement>('[data-parada]'));
        const contador = seccion.querySelector<HTMLElement>('[data-contador]');
        const etiqueta = seccion.querySelector<HTMLElement>('[data-puerto]');
        const rellenos = Array.from(seccion.querySelectorAll<HTMLElement>('[data-relleno]'));
        const botones = Array.from(seccion.querySelectorAll<HTMLElement>('[data-paso]'));
        let vertical = window.innerWidth >= 768;
        colocarImanes(seccion, RECORRIDO, IMANES);

        // three.js y las figuras se bajan aparte, después de que la portada ya se ve
        const cargar = async () => {
            const imagen = await new Promise<HTMLImageElement | null>((resolver) => {
                const img = new Image();
                img.onload = () => resolver(img);
                img.onerror = () => resolver(null);
                img.src = '/assets/simar/simbolo-grande.png';
            });
            const { crearMotorParticulas } = await import('./motorParticulas');
            if (!vivo) return;
            motor = crearMotorParticulas(canvas, { movil: window.innerWidth < 768, reducido, imagenLogo: imagen });
            if (motor) setListo(true);
        };
        const conIdle = typeof window.requestIdleCallback === 'function';
        const espera = conIdle ? window.requestIdleCallback(() => void cargar(), { timeout: 900 }) : setTimeout(() => void cargar(), 200);

        let antes = performance.now();
        let cuadro = 0;
        const dibujar = (ahora: number) => {
            cuadro = requestAnimationFrame(dibujar);
            const dt = Math.min(0.05, (ahora - antes) / 1000);
            antes = ahora;
            if (!visible) return;
            const posicion = RECORRIDO.posicion(avanceDe(seccion));

            // Los textos: llegan, se quedan quietos mientras se leen y se van
            for (const el of textos) {
                const [entra, sale] = textoEn(posicion, Number(el.dataset.parada), PARADAS);
                const op = entra * sale;
                el.style.opacity = op.toFixed(3);
                el.style.transform = reducido ? '' : `translate3d(0, ${((1 - entra) * 32 - (1 - sale) * 32).toFixed(1)}px, 0)`;
                el.style.pointerEvents = op > 0.5 ? '' : 'none';
            }
            const mancha = manchaDe(posicion);
            if (contador) contador.textContent = reducido ? '1,000,000' : litros(mancha);
            pintarPasos(rellenos, botones, posicion, vertical);

            if (motor) {
                const estado = motor.actualizar(etapaEn(posicion, PARADAS), mancha, dt);
                if (etiqueta) {
                    const op = rampa(posicion, 3.86, 3.98) * (1 - rampa(posicion, 4.56, 4.66));
                    etiqueta.style.opacity = op.toFixed(3);
                    etiqueta.style.transform = `translate3d(${estado.puertoX.toFixed(1)}px, ${estado.puertoY.toFixed(1)}px, 0)`;
                }
            }
        };
        cuadro = requestAnimationFrame(dibujar);

        const observador = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '120px 0px' });
        observador.observe(seccion);

        const alRedimensionar = () => {
            motor?.redimensionar();
            vertical = window.innerWidth >= 768;
            colocarImanes(seccion, RECORRIDO, IMANES);
        };
        window.addEventListener('resize', alRedimensionar);

        // El puntero aparta las partículas (sólo con mouse; en pantallas táctiles no)
        const finos = window.matchMedia('(pointer: fine)').matches;
        const alMover = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect();
            motor?.puntero(e.clientX - r.left, e.clientY - r.top);
        };
        const alSalir = () => motor?.puntero(null, null);
        if (finos) {
            seccion.addEventListener('pointermove', alMover);
            seccion.addEventListener('pointerleave', alSalir);
        }

        // Al cambiar de tema, el fondo del lienzo sigue a los tokens
        const tema = new MutationObserver(() => motor?.leerColores());
        tema.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

        return () => {
            vivo = false;
            cancelAnimationFrame(cuadro);
            if (conIdle) window.cancelIdleCallback(espera as number);
            else clearTimeout(espera);
            observador.disconnect();
            tema.disconnect();
            window.removeEventListener('resize', alRedimensionar);
            seccion.removeEventListener('pointermove', alMover);
            seccion.removeEventListener('pointerleave', alSalir);
            motor?.destruir();
        };
    }, [reducido]);

    return (
        <section ref={seccionRef} id="inicio" aria-label="La historia de SiMAR" style={{ height: RECORRIDO.alto }} className="relative bg-simar-abismo text-white">
            <ImanesPasos pasos={PARADAS} />
            <div className="sticky top-0 h-[100svh] overflow-hidden">
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    className={`absolute inset-0 w-full h-full transition-opacity duration-[1400ms] ease-out ${listo ? 'opacity-100' : 'opacity-0'}`}
                />
                {/* Viñeta: el centro queda limpio y las orillas se hunden */}
                <div aria-hidden="true" className="t3-vineta pointer-events-none absolute inset-0" />

                {/* Puerto Peñasco en el mapa */}
                <div data-puerto aria-hidden="true" className="pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform">
                    <span className="absolute left-4 -top-4 whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-[15px] font-bold text-white backdrop-blur-sm border border-white/20">
                        Puerto Peñasco
                    </span>
                </div>

                <BarraPasos etiquetas={ETIQUETAS} recorrido={RECORRIDO} imanes={IMANES} tono="oscuro" nombre="Pasos de la historia" />

                {/* 0 · Portada */}
                <div
                    data-parada="0"
                    className="absolute inset-x-0 top-0 px-6 pt-[clamp(120px,19vh,200px)] text-center movil:px-5 movil:pt-[128px]"
                >
                    <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">SiMAR · Puerto Peñasco, Sonora</p>
                    <h1 className="mx-auto mt-4 max-w-[17ch] text-[clamp(44px,6.4vw,96px)] font-extrabold leading-[1.0] tracking-[-0.035em] movil:mt-3 movil:text-[38px] movil:leading-[1.05] movil:tracking-[-0.02em]">
                        Cuidar el mar empieza por contar lo que sale de él.
                    </h1>
                    <p className="mx-auto mt-6 max-w-[46ch] text-xl md:text-[22px] leading-relaxed text-simar-franja-texto-2 movil:mt-4 movil:text-[17px]">
                        SiMAR digitaliza los manifiestos de residuos de las embarcaciones pesqueras: cada litro de aceite y cada kilo de basura, registrado, firmado y comprobado.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 movil:mt-6">
                        <a
                            href="#producto"
                            className="simar-presiona min-h-[58px] px-7 rounded-full bg-white text-simar-abismo text-lg font-extrabold inline-flex items-center gap-2 hover:bg-white/90 transition-colors movil:min-h-[52px] movil:px-5 movil:text-[17px]"
                        >
                            Ver cómo funciona
                            <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
                        </a>
                        {rutaDemo ? (
                            <a
                                href={rutaDemo}
                                className="min-h-[58px] px-7 rounded-full border-2 border-white/40 text-white text-lg font-bold inline-flex items-center gap-2 hover:bg-white/10 transition-colors movil:min-h-[52px] movil:px-5 movil:text-[17px]"
                            >
                                <PlayCircle className="w-5 h-5" />
                                Probar la demo
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={alEntrar}
                                className="min-h-[58px] px-7 rounded-full border-2 border-white/40 text-white text-lg font-bold inline-flex items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer movil:min-h-[52px] movil:px-5 movil:text-[17px]"
                            >
                                {textoEntrar}
                            </button>
                        )}
                    </div>
                </div>
                <div data-parada="0" aria-hidden="true" className="absolute inset-x-0 bottom-7 flex justify-center movil:bottom-5">
                    <span className="inline-flex items-center gap-2 text-[15px] font-bold text-simar-franja-texto-2">
                        <ArrowDown className="w-4 h-4" />
                        Baja para seguir la historia
                    </span>
                </div>

                <Parada j={1} antetitulo="El problema" titulo="Basta una gota.">
                    El aceite usado de un motor forma una capa en el agua que no deja pasar la luz ni el oxígeno que necesita la vida del mar.
                </Parada>

                <Parada
                    j={2}
                    antetitulo="Un litro de aceite"
                    titulo={
                        <>
                            puede contaminar hasta <span data-contador className="tabular-nums text-simar-aceite">1</span> litros de agua.
                        </>
                    }
                    tituloLector="Un litro de aceite puede contaminar hasta un millón de litros de agua."
                    nota="Estimación de la Agencia de Protección Ambiental de Estados Unidos (EPA)."
                >
                    Por eso cuenta cada litro que una embarcación entrega en el puerto en lugar de tirarlo.
                </Parada>

                <Parada j={3} antetitulo="Antes de SiMAR" titulo="Por años, todo se anotó en papel.">
                    En el centro de acopio, cada manifiesto se llenaba a mano, hoja por hoja. El tiempo las deterioraba hasta volverlas ilegibles, y con ellas se perdía la cuenta de lo que se le había quitado al mar.
                </Parada>

                <Parada j={4} antetitulo="Dónde empezó" titulo="SiMAR nació en Puerto Peñasco.">
                    En el Alto Golfo de California, a la orilla del mar que Jacques Cousteau llamó «el acuario del mundo». Aquí, el centro de acopio del recinto portuario recibe la basura y el aceite usado de las embarcaciones pesqueras.
                </Parada>

                <Parada j={5} antetitulo="SiMAR" titulo="Del papel al dato. Del dato, a un mar más limpio.">
                    Sistema Integral de Manejo Ambiental de Residuos.
                </Parada>
            </div>
        </section>
    );
}

/** El texto de una parada: a la izquierda en computadora, abajo en celular */
function Parada({
    j,
    antetitulo,
    titulo,
    tituloLector,
    nota,
    children,
}: {
    j: number;
    antetitulo: string;
    titulo: ReactNode;
    tituloLector?: string;
    nota?: string;
    children: ReactNode;
}) {
    return (
        <div
            data-parada={j}
            style={{ opacity: 0 }}
            className="absolute inset-y-0 left-[max(24px,6vw)] flex items-center w-[min(540px,42vw)] max-md:inset-y-auto max-md:left-5 max-md:right-5 max-md:bottom-[max(24px,env(safe-area-inset-bottom))] max-md:w-auto max-md:block"
        >
            <div className="t3-legible max-md:rounded-[24px] max-md:bg-simar-abismo/70 max-md:backdrop-blur-md max-md:p-5 max-md:-mx-1">
                <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">{antetitulo}</p>
                <h2 className="mt-3 text-[clamp(38px,4.3vw,66px)] font-extrabold leading-[1.04] tracking-[-0.03em] movil:mt-2 movil:text-[30px] movil:leading-[1.08] movil:tracking-[-0.02em]">
                    {tituloLector ? (
                        <>
                            <span className="sr-only">{tituloLector}</span>
                            <span aria-hidden="true">{titulo}</span>
                        </>
                    ) : (
                        titulo
                    )}
                </h2>
                <p className="mt-5 text-xl md:text-[21px] leading-relaxed text-simar-franja-texto-2 movil:mt-3 movil:text-[16px]">{children}</p>
                {nota && <p className="mt-4 text-[15px] text-simar-franja-texto-3">{nota}</p>}
            </div>
        </div>
    );
}
