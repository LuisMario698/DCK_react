import {
    Building2,
    ClipboardList,
    FileText,
    LayoutGrid,
    Leaf,
    MapPin,
    PenLine,
    Scale,
    Ship,
    Waves,
    type LucideIcon,
} from 'lucide-react';
import type { VistaDemo } from '@/lib/demo/config';

export type TonoPaso = 'marea' | 'arrecife' | 'violeta';

export interface PasoRecorrido {
    /** Pantalla del paso, sin el idioma ("/dashboard/manifiesto") */
    ruta: string;
    /** Qué se ilumina: el primer selector que esté a la vista (en celular algunas partes cambian) */
    objetivo: string[];
    icono: LucideIcon;
    tono?: TonoPaso;
    titulo: string;
    texto: string;
}

export interface Recorrido {
    bienvenida: { titulo: string; texto: string };
    pasos: PasoRecorrido[];
    final: { titulo: string; texto: string; otraVista: { vista: VistaDemo; texto: string } };
}

/**
 * Los dos recorridos de la demostración. Cuentan una historia (el barco llega, se registra, la basura
 * se va al basurón, el aceite se recicla y se ve el impacto), no un menú de pantallas. Cada paso: una
 * idea, una o dos frases cortas, de tú (DISEÑO_SIMAR.md §11). Los objetivos son `data-recorrido` en
 * las pantallas; si uno no aparece, el paso sale igual, al centro.
 */
export const RECORRIDOS: Record<VistaDemo, Recorrido> = {
    puerto: {
        bienvenida: {
            titulo: 'Te damos la bienvenida a SiMAR',
            texto:
                'En 7 pasos verás cómo el centro de acopio de Puerto Peñasco registra los residuos de los barcos, desde que llegan al muelle hasta que se reciclan. Todo son datos de ejemplo.',
        },
        pasos: [
            {
                ruta: '/dashboard',
                objetivo: ['[data-recorrido="panel-importante"]', '[data-recorrido="panel-saludo"]'],
                icono: LayoutGrid,
                titulo: 'Así empieza el día',
                texto: 'El Panel dice lo que llegó hoy y lo que falta por atender: solicitudes por revisar y recolecciones por venir.',
            },
            {
                ruta: '/dashboard',
                objetivo: ['[data-recorrido="panel-acciones"]'],
                icono: Ship,
                titulo: 'Llega un barco al muelle',
                texto: 'Entrega su aceite usado, sus filtros y su basura. Todo eso se anota en un manifiesto. Vamos a verlo.',
            },
            {
                ruta: '/dashboard/manifiesto',
                objetivo: ['[data-recorrido="manifiesto-datos"]'],
                icono: FileText,
                titulo: 'El manifiesto, sin papel',
                texto: 'Se elige la embarcación y se anotan los litros de aceite, los filtros y los kilos de basura. Letra grande y pocos pasos.',
            },
            {
                ruta: '/dashboard/manifiesto',
                objetivo: ['[data-recorrido="manifiesto-firmas"]'],
                icono: PenLine,
                titulo: 'Se firma en la pantalla',
                texto: 'La tripulación firma con el dedo y sale el PDF oficial, en formato MARPOL, listo para SEMARNAT.',
            },
            {
                ruta: '/dashboard/manifiesto-basuron',
                objetivo: ['[data-recorrido="basuron-pesaje"]', '[data-recorrido="basuron"]'],
                icono: Scale,
                tono: 'arrecife',
                titulo: 'La basura llega al basurón',
                texto: 'El camión se pesa al entrar y al salir del relleno sanitario. Así se sabe cuántos kilos se dejaron de verdad.',
            },
            {
                ruta: '/dashboard/asociaciones',
                objetivo: ['[data-recorrido="empresas-conteos"]', '[data-recorrido="empresas-secciones"]'],
                icono: Building2,
                titulo: 'El aceite no se tira: se recicla',
                texto: 'Las empresas recolectoras piden lo que reciclan. El puerto aprueba, registra la recolección y entrega un comprobante.',
            },
            {
                ruta: '/dashboard/estadisticas',
                objetivo: ['[data-recorrido="impacto"]'],
                icono: Waves,
                tono: 'violeta',
                titulo: 'Lo que gana el mar',
                texto: 'Cada litro de aceite que no llega al mar protege mil litros de agua. Aquí se ve el impacto de todo lo registrado.',
            },
        ],
        final: {
            titulo: 'Ya conoces SiMAR',
            texto: 'Ahora recórrelo a tu ritmo. Puedes tocar todo: en la demostración nada se guarda.',
            otraVista: { vista: 'empresa', texto: 'Verlo como empresa recolectora' },
        },
    },
    empresa: {
        bienvenida: {
            titulo: 'Así ve SiMAR una empresa recolectora',
            texto:
                'En 4 pasos verás cómo una empresa le pide residuos al puerto para reciclarlos y cómo sigue cada recolección. Todo son datos de ejemplo.',
        },
        pasos: [
            {
                ruta: '/dashboard-recolector',
                objetivo: ['section[aria-label="Lo importante"]', '[data-recorrido="portal-saludo"]'],
                icono: LayoutGrid,
                titulo: 'Tu empresa, de un vistazo',
                texto: 'Lo importante va primero: la próxima recolección y los avisos que te manda el puerto.',
            },
            {
                ruta: '/dashboard-recolector/mapa',
                objetivo: ['[data-recorrido="residuos"]'],
                icono: MapPin,
                titulo: 'Lo que hay en el puerto',
                texto: 'El centro de acopio publica cuánto aceite, plástico o chatarra tiene. Tú pides la cantidad que puedes reciclar.',
            },
            {
                ruta: '/dashboard-recolector/solicitudes',
                objetivo: ['[data-recorrido="solicitudes"]'],
                icono: ClipboardList,
                titulo: 'Sigue cada solicitud',
                texto: 'Ves en qué va cada una (enviada, aprobada o recolectada) y el día en que pasas por los residuos.',
            },
            {
                ruta: '/dashboard-recolector/impacto',
                objetivo: ['[data-recorrido="impacto"]'],
                icono: Leaf,
                tono: 'arrecife',
                titulo: 'Tu aporte al mar',
                texto: 'Lo que tu empresa ha reciclado, convertido en agua protegida y CO₂ evitado. Te sirve para tus reportes y tu constancia anual.',
            },
        ],
        final: {
            titulo: 'Ya conoces el portal de empresas',
            texto: 'Ahora recórrelo a tu ritmo. Puedes tocar todo: en la demostración nada se guarda.',
            otraVista: { vista: 'puerto', texto: 'Verlo como el puerto' },
        },
    },
};
