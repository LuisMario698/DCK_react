'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapaLibre, type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/components/layout/ThemeContext';
import { TEXTOS_MAPA_ES } from '@/lib/constants/mapa';
import { movimientoQuieto } from './ajustesLectura';

/**
 * El mapa real de «En el mapa» (MapLibre GL + teselas de OpenFreeMap, sin clave): positron, con los
 * nombres en español, sin carreteras numeradas ni aeropuertos, y los colores de SiMAR (en oscuro,
 * todo el mapa en su azul marino: PALETA_OSCURA). Encima:
 *  - una marca por lugar con su número de noticias (botón: lleva a su capítulo); la del capítulo
 *    que se lee se enciende;
 *  - la zona donde vive la vaquita, aproximada (un círculo punteado; no es el límite legal).
 * Al cambiar de capítulo vuela a su vista (con «reducir movimiento» o «Sin animaciones», salta).
 * Zoom con Ctrl + rueda o dos dedos (cooperativeGestures: la página sigue bajando con la rueda).
 * Se carga sólo cuando la sección se acerca (MapaHistoria, next/dynamic); si no hay WebGL, avisa
 * con `alFallar` y se queda el mapa dibujado.
 */

export interface LugarMapa {
    id: string;
    nombre: string;
    cuantas: number;
    /** [lon, lat] de su marca; sin centro (México, el mundo) no lleva marca */
    centro?: [number, number];
}

/**
 * Un solo estilo base para los dos temas: positron (el más limpio). En oscuro se pinta capa por capa
 * con el azul marino de SiMAR (PALETA_OSCURA): el «dark» de OpenFreeMap tiene la tierra casi negra,
 * el agua gris y franjas en el mar (sus capas de agua se enciman con transparencia).
 */
const ESTILO_BASE = 'https://tiles.openfreemap.org/styles/positron';

/** El mapa en oscuro, con los tonos de SiMAR (papel #081624, superficie #132D45, abismo #0B2236) */
const PALETA_OSCURA = {
    tierra: '#1a3550',
    verde: '#1c3853',
    ciudad: '#1f3b57',
    edificio: '#23415f',
    agua: '#07131f',
    costa: '#3f7ea6',
    caminoBorde: '#1b3650',
    camino: '#21405e',
    autopista: '#2b5275',
    frontera: '#6a8bab',
    fronteraEstado: '#34536f',
    texto: '#dbe6ef',
    textoTenue: '#9db1c3',
    textoAgua: '#86bfd2',
    halo: '#07131f',
};

/** En claro: positron con el papel y el agua de SiMAR */
const PALETA_CLARA = { tierra: '#efece5', agua: '#c3dbec' };

/** Lo que no ayuda en un mapa de noticias (números y nombres de carreteras, aeropuertos, trenes) */
const SOBRA = /shield|highway-name|highway_name|road_oneway|airport|aeroway|railway/i;

/** A dónde vuela el mapa en cada capítulo (en celular, un poco más lejos) */
const VISTAS: Record<string, { centro: [number, number]; zoom: number }> = {
    golfo: { centro: [-111.2, 27.7], zoom: 5.25 },
    penasco: { centro: [-113.56, 31.3], zoom: 10.2 },
    altogolfo: { centro: [-114.55, 31.0], zoom: 8.1 },
    costa: { centro: [-109.7, 26.5], zoom: 6.4 },
    mexico: { centro: [-102.4, 23.8], zoom: 3.9 },
    mundo: { centro: [-100, 12], zoom: 1.2 },
};

/** La zona de la vaquita, aproximada: un círculo de 38 km alrededor del centro del Alto Golfo */
function circulo([lon, lat]: [number, number], km: number) {
    const puntos: [number, number][] = [];
    for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        puntos.push([lon + (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a), lat + (km / 110.57) * Math.sin(a)]);
    }
    return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [puntos] } };
}
const ZONA_VAQUITA: [number, number] = [-114.45, 30.95];

/** Cambia una propiedad de pintura sin romper si esa capa no la tiene */
function pintar(mapa: MapaLibre, id: string, propiedad: string, valor: unknown) {
    try {
        mapa.setPaintProperty(id, propiedad, valor);
    } catch {
        // Esa capa no tiene esa propiedad: se queda como viene
    }
}

/** El color de cada capa de positron en oscuro, según qué es */
function colorOscuro(id: string, tipo: string): string | null {
    const p = PALETA_OSCURA;
    if (tipo === 'background') return p.tierra;
    if (/^water$|waterway/i.test(id)) return p.agua;
    if (/ice|glacier/i.test(id)) return p.verde;
    if (/park|wood|landcover/i.test(id)) return p.verde;
    if (/residential|landuse/i.test(id)) return p.ciudad;
    if (/building/i.test(id)) return p.edificio;
    if (/pier/i.test(id)) return p.tierra;
    if (/casing/i.test(id)) return p.caminoBorde;
    if (/motorway/i.test(id)) return p.autopista;
    if (/highway|tunnel|road|path/i.test(id)) return p.camino;
    if (/boundary_3|boundary_state/i.test(id)) return p.fronteraEstado;
    if (/boundary/i.test(id)) return p.frontera;
    return null;
}

/**
 * Lo que se cambia al estilo de OpenFreeMap: los nombres en español, quitar lo que estorba, los
 * colores de SiMAR (en oscuro, todo el mapa) y la zona de la vaquita.
 */
function personalizar(mapa: MapaLibre, oscuro: boolean) {
    for (const capa of mapa.getStyle().layers ?? []) {
        const { id, type: tipo } = capa;
        if (SOBRA.test(id)) {
            mapa.setLayoutProperty(id, 'visibility', 'none');
            continue;
        }
        if (tipo === 'symbol' && /place|country|state|water|ocean|sea|marine|label|city|town|village/i.test(id) && !/housenumber|road|highway|shield|poi/i.test(id)) {
            mapa.setLayoutProperty(id, 'text-field', ['coalesce', ['get', 'name:es'], ['get', 'name_int'], ['get', 'name']]);
        }
        // El agua, siempre opaca: sin franjas donde se enciman sus capas
        if (/^water$/i.test(id)) {
            pintar(mapa, id, 'fill-color', oscuro ? PALETA_OSCURA.agua : PALETA_CLARA.agua);
            pintar(mapa, id, 'fill-opacity', 1);
            pintar(mapa, id, 'fill-antialias', false);
            continue;
        }
        if (!oscuro) {
            if (tipo === 'background') pintar(mapa, id, 'background-color', PALETA_CLARA.tierra);
            continue;
        }
        if (tipo === 'symbol') {
            const agua = /water/i.test(id);
            const grande = /country|state|city/i.test(id);
            pintar(mapa, id, 'text-color', agua ? PALETA_OSCURA.textoAgua : grande ? PALETA_OSCURA.texto : PALETA_OSCURA.textoTenue);
            pintar(mapa, id, 'text-halo-color', PALETA_OSCURA.halo);
            pintar(mapa, id, 'text-halo-width', 1.2);
            continue;
        }
        const color = colorOscuro(id, tipo);
        if (!color) continue;
        if (tipo === 'background') pintar(mapa, id, 'background-color', color);
        else if (tipo === 'fill') {
            pintar(mapa, id, 'fill-color', color);
            pintar(mapa, id, 'fill-outline-color', color);
        } else if (tipo === 'line') pintar(mapa, id, 'line-color', color);
    }
    // En oscuro, la orilla del agua con una línea fina en tono espuma (como una carta náutica): sin ella, la costa casi no se ve
    const agua = mapa.getLayer('water');
    if (oscuro && agua && !mapa.getLayer('costa-oscura')) {
        const primeraEtiqueta = mapa.getStyle().layers?.find((c) => c.type === 'symbol')?.id;
        mapa.addLayer(
            { id: 'costa-oscura', type: 'line', source: agua.source, 'source-layer': agua.sourceLayer, paint: { 'line-color': PALETA_OSCURA.costa, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 9, 1.4], 'line-opacity': 0.75 } },
            primeraEtiqueta,
        );
    }
    if (!mapa.getSource('zona-vaquita')) mapa.addSource('zona-vaquita', { type: 'geojson', data: circulo(ZONA_VAQUITA, 38) });
    if (!mapa.getLayer('zona-vaquita-fondo')) {
        mapa.addLayer({ id: 'zona-vaquita-fondo', type: 'fill', source: 'zona-vaquita', paint: { 'fill-color': '#7FE0D6', 'fill-opacity': oscuro ? 0.2 : 0.22 } });
        mapa.addLayer({
            id: 'zona-vaquita-borde',
            type: 'line',
            source: 'zona-vaquita',
            paint: { 'line-color': oscuro ? '#7FE0D6' : '#0f7d74', 'line-width': 2, 'line-dasharray': [2, 2] },
        });
    }
}

/** El botón de una marca (los colores y el encendido, en globals.css: .n-marca) */
const CLASE_MARCA =
    'n-marca flex items-center rounded-full p-1.5 text-[15px] font-bold whitespace-nowrap cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-golfo focus-visible:outline-offset-2';

export default function MapaInteractivo({
    lugares,
    activo,
    alElegir,
    alCargar,
    alFallar,
}: {
    lugares: LugarMapa[];
    activo: number;
    alElegir: (i: number) => void;
    alCargar: () => void;
    alFallar: () => void;
}) {
    const caja = useRef<HTMLDivElement>(null);
    const mapa = useRef<MapaLibre | null>(null);
    const marcas = useRef<(Marker | null)[]>([]);
    const { theme } = useTheme();
    const oscuro = theme === 'dark';
    const elegir = useRef(alElegir);
    const cargado = useRef(alCargar);
    useEffect(() => {
        elegir.current = alElegir;
        cargado.current = alCargar;
    });

    // Crear el mapa una vez
    useEffect(() => {
        if (!caja.current) return;
        let instancia: MapaLibre;
        try {
            const inicio = VISTAS[lugares[activo]?.id] ?? VISTAS.golfo;
            instancia = new maplibregl.Map({
                container: caja.current,
                style: ESTILO_BASE,
                center: inicio.centro,
                zoom: inicio.zoom,
                minZoom: 1,
                maxZoom: 13,
                attributionControl: { compact: true },
                cooperativeGestures: true,
                dragRotate: false,
                pitchWithRotate: false,
                touchPitch: false,
                locale: TEXTOS_MAPA_ES,
            });
        } catch {
            alFallar();
            return;
        }
        mapa.current = instancia;
        instancia.touchZoomRotate.disableRotation();
        instancia.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        instancia.on('style.load', () => personalizar(instancia, document.documentElement.classList.contains('dark')));
        instancia.once('load', () => {
            // Los créditos del mapa, plegados (el botón ⓘ los abre): desplegados tapan los botones de abajo
            instancia.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
            cargado.current();
        });
        instancia.on('error', (e) => {
            // Una tesela que no llega no es para rendirse; sólo si el mapa no arrancó
            if (!instancia.loaded() && /webgl|context/i.test(String(e.error?.message ?? ''))) alFallar();
        });

        // Las marcas: un botón por lugar con centro (dentro de un envoltorio: MapLibre lo mueve con transform)
        marcas.current = lugares.map((l, i) => {
            if (!l.centro) return null;
            const envoltorio = document.createElement('div');
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = CLASE_MARCA;
            boton.setAttribute('aria-label', `${l.nombre}: ${l.cuantas === 1 ? '1 noticia' : `${l.cuantas} noticias`}. Ir a sus noticias`);
            // El nombre sólo se ve en la marca encendida y al pasar el cursor (globals.css): así las cercanas no se enciman
            boton.innerHTML = `<span class="n-marca-numero flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-extrabold tabular-nums">${l.cuantas}</span><span class="n-marca-nombre pl-2 pr-2.5">${l.nombre}</span>`;
            boton.addEventListener('click', (e) => {
                e.stopPropagation();
                elegir.current(i);
            });
            envoltorio.appendChild(boton);
            return new maplibregl.Marker({ element: envoltorio, anchor: 'left', offset: [-22, 0] }).setLngLat(l.centro).addTo(instancia);
        });

        // La etiqueta de la zona de la vaquita (adentro de un envoltorio: MapLibre maneja la opacidad de sus marcas)
        const envoltura = document.createElement('div');
        envoltura.className = 'pointer-events-none';
        const etiqueta = document.createElement('span');
        etiqueta.className = 'n-zona-etiqueta block rounded-full px-3 py-1 text-[13px] font-bold transition-opacity duration-300';
        etiqueta.textContent = 'Zona de la vaquita (aprox.)';
        envoltura.appendChild(etiqueta);
        new maplibregl.Marker({ element: envoltura, anchor: 'top', offset: [0, 70] }).setLngLat(ZONA_VAQUITA).addTo(instancia);
        // De lejos estorban: la etiqueta sólo cerca del Alto Golfo; las marcas, desde que se ve el golfo
        const segunZoom = () => {
            const z = instancia.getZoom();
            etiqueta.style.opacity = z >= 7.2 ? '1' : '0';
            instancia.getContainer().classList.toggle('n-mapa-lejos', z < 4.2);
        };
        segunZoom();
        instancia.on('zoom', segunZoom);

        return () => {
            instancia.remove();
            mapa.current = null;
        };
        // El mapa se crea una vez; los cambios de capítulo y de tema van en sus efectos
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Claro u oscuro: se recarga la base y en style.load se vuelve a pintar con el tema nuevo
    const primero = useRef(true);
    useEffect(() => {
        if (primero.current) {
            primero.current = false;
            return;
        }
        mapa.current?.setStyle(ESTILO_BASE, { diff: false });
    }, [oscuro]);

    // El capítulo que se lee: volar a su vista y encender su marca
    useEffect(() => {
        const m = mapa.current;
        if (!m) return;
        const vista = VISTAS[lugares[activo]?.id] ?? VISTAS.golfo;
        const angosto = window.matchMedia('(max-width: 639px)').matches;
        // Margen arriba y abajo: ahí van «3 de 6 · lugar» y los botones de México y el mundo
        const destino = { center: vista.centro, zoom: vista.zoom - (angosto ? 0.7 : 0), padding: { top: 64, bottom: 64, left: 0, right: 0 } };
        if (movimientoQuieto()) m.jumpTo(destino);
        else m.flyTo({ ...destino, speed: 0.9, curve: 1.42, essential: false });
        marcas.current.forEach((marca, i) => {
            const el = marca?.getElement();
            const boton = el?.firstElementChild as HTMLElement | null;
            if (!el || !boton) return;
            boton.dataset.activo = String(i === activo);
            if (i === activo) boton.setAttribute('aria-current', 'location');
            else boton.removeAttribute('aria-current');
            el.style.zIndex = i === activo ? '2' : '1';
        });
    }, [activo, lugares]);

    // (maplibre-gl.css le pone position: relative al contenedor: va adentro de uno absoluto, a todo lo alto)
    return (
        <div className="absolute inset-0">
            <div ref={caja} className="h-full w-full" role="region" aria-label="Mapa del Golfo de California con las noticias" />
        </div>
    );
}
