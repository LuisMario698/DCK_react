'use client';

/**
 * Cristal líquido (tipo "liquid glass" de Apple) para lo que flota: la barra inferior, su píldora
 * y el encabezado móvil. Ver DISEÑO_SIMAR.md → "Versión móvil" → "Cristal líquido".
 *
 * En lugar de sólo desenfocar el fondo, lo **refracta**: un filtro SVG (feDisplacementMap) con un
 * mapa de desplazamiento dibujado al tamaño exacto del elemento dobla el fondo cerca de los bordes,
 * como un cristal grueso con canto redondeado. El centro queda casi limpio.
 *
 * `backdrop-filter: url(#filtro)` sólo existe en navegadores Chromium (Chrome, Edge, Android). En
 * Safari y Firefox —y si el sistema pide menos transparencia— no se aplica y la clase CSS
 * (`simar-cristal`) deja un vidrio translúcido con desenfoque normal.
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';

const CONSULTA_TRANSPARENCIA = '(prefers-reduced-transparency: reduce)';

function suscribirTransparencia(avisar: () => void) {
    const consulta = window.matchMedia(CONSULTA_TRANSPARENCIA);
    consulta.addEventListener('change', avisar);
    return () => consulta.removeEventListener('change', avisar);
}

function puedeRefractar() {
    // userAgentData sólo existe en Chromium, que es el único que aplica filtros SVG al fondo
    const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
    const chromium = !!nav.userAgentData?.brands?.some((m) => /Chromium/i.test(m.brand));
    return chromium && !window.matchMedia(CONSULTA_TRANSPARENCIA).matches;
}

/** ¿Este navegador puede refractar el fondo? (false en el servidor y en Safari/Firefox) */
export function useSoportaRefraccion() {
    return useSyncExternalStore(suscribirTransparencia, puedeRefractar, () => false);
}

/**
 * Dibuja el mapa de desplazamiento de un rectángulo redondeado (PNG en data URL).
 * Rojo = desplazamiento en x, verde = en y (128 = nada). Dentro del bisel el fondo se toma
 * de más ADENTRO, contra la normal del borde: así el canto "dobla" lo que hay detrás como una
 * lente. Hacia adentro y no hacia afuera: afuera del elemento el navegador no tiene fondo y la
 * orilla quedaba vacía (se veía una píldora más chica dentro de la barra).
 */
export function mapaDesplazamiento(ancho: number, alto: number, radio: number, bisel: number): string {
    const w = Math.max(1, Math.round(ancho));
    const h = Math.max(1, Math.round(alto));
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return '';
    const imagen = ctx.createImageData(w, h);
    const datos = imagen.data;
    const r = Math.min(radio, w / 2, h / 2);
    const cx = w / 2;
    const cy = h / 2;
    const mx = w / 2 - r;
    const my = h / 2 - r;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const px = x + 0.5 - cx;
            const py = y + 0.5 - cy;
            const qx = Math.abs(px) - mx;
            const qy = Math.abs(py) - my;
            let distancia: number;
            let nx = 0;
            let ny = 0;
            if (qx > 0 && qy > 0) {
                const l = Math.hypot(qx, qy);
                distancia = r - l;
                nx = (qx / l) * Math.sign(px);
                ny = (qy / l) * Math.sign(py);
            } else if (qx > qy) {
                distancia = r - qx;
                nx = Math.sign(px);
            } else {
                distancia = r - qy;
                ny = Math.sign(py);
            }
            // Perfil de un canto convexo: fuerte en la orilla, nada al llegar al centro
            const t = Math.min(1, Math.max(0, distancia) / bisel);
            const fuerza = Math.pow(1 - t, 2.4);
            const i = (y * w + x) * 4;
            datos[i] = 128 - 127 * fuerza * nx;
            datos[i + 1] = 128 - 127 * fuerza * ny;
            datos[i + 2] = 128;
            datos[i + 3] = 255;
        }
    }
    ctx.putImageData(imagen, 0, 0);
    return lienzo.toDataURL();
}

interface OpcionesRefraccion {
    /** Radio de las esquinas en px (se limita a la mitad del lado corto) */
    radio: number;
    /** Ancho del canto que refracta, en px */
    bisel?: number;
    /** Desplazamiento máximo (el doble del corrimiento en px en la orilla) */
    fuerza?: number;
    /** Desenfoque mínimo del fondo, para que el texto se lea sobre fondos con mucho detalle */
    desenfoque?: number;
    /** Saturación del fondo (el cristal hace que los colores de atrás "brillen") */
    saturacion?: number;
    /** Espera antes de redibujar el mapa al cambiar de tamaño (ms). 0 = en el siguiente cuadro */
    espera?: number;
}

/**
 * Refracción para un elemento. Devuelve `[ref, cristal]`: la ref que hay que ponerle y, aparte
 * (para no leer la ref al dibujar), el `<svg>` con su filtro (se dibuja junto al elemento), el
 * estilo con el `backdrop-filter` y si está activa. Si el navegador no puede, `estilo` va vacío y
 * `activo` es false: queda el vidrio de la clase CSS.
 */
export function useRefraccion<T extends HTMLElement>({
    radio,
    bisel = 16,
    fuerza = 36,
    desenfoque = 1.2,
    saturacion = 1.6,
    espera = 120,
}: OpcionesRefraccion) {
    const ref = useRef<T>(null);
    const id = `simar-cristal-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const soportado = useSoportaRefraccion();
    const [mapa, setMapa] = useState<{ url: string; w: number; h: number } | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!soportado || !el) return;
        let temporizador: ReturnType<typeof setTimeout> | undefined;
        let cuadro = 0;
        const dibujar = () => {
            // offsetWidth/Height: el tamaño sin transformaciones (la píldora se estira con scale)
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            if (!w || !h) return;
            setMapa((antes) =>
                antes && antes.w === w && antes.h === h ? antes : { url: mapaDesplazamiento(w, h, radio, bisel), w, h }
            );
        };
        const programar = () => {
            clearTimeout(temporizador);
            cancelAnimationFrame(cuadro);
            if (espera > 0) temporizador = setTimeout(dibujar, espera);
            else cuadro = requestAnimationFrame(dibujar);
        };
        const observador = new ResizeObserver(programar);
        observador.observe(el);
        return () => {
            observador.disconnect();
            clearTimeout(temporizador);
            cancelAnimationFrame(cuadro);
        };
    }, [soportado, radio, bisel, espera]);

    const activo = soportado && !!mapa;
    const filtro = activo ? (
        <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
            <filter
                id={id}
                x="0"
                y="0"
                width={mapa.w}
                height={mapa.h}
                filterUnits="userSpaceOnUse"
                primitiveUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
            >
                <feImage href={mapa.url} x="0" y="0" width={mapa.w} height={mapa.h} preserveAspectRatio="none" result="mapa" />
                {/* duplicate: en la orilla repite el último píxel en vez de desvanecerse a transparente */}
                <feGaussianBlur in="SourceGraphic" stdDeviation={desenfoque} edgeMode="duplicate" result="suave" />
                <feDisplacementMap in="suave" in2="mapa" scale={fuerza} xChannelSelector="R" yChannelSelector="G" result="refractado" />
                <feColorMatrix in="refractado" type="saturate" values={String(saturacion)} />
            </filter>
        </svg>
    ) : null;
    const estilo: CSSProperties | undefined = activo
        ? { backdropFilter: `url(#${id})`, WebkitBackdropFilter: `url(#${id})` }
        : undefined;

    return [ref, { filtro, estilo, activo }] as const;
}
