import {
    Building2,
    ClipboardList,
    LayoutGrid,
    Leaf,
    MapPin,
    PenLine,
    Recycle,
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
    /** Una o dos frases cortas; lo que va entre **dobles asteriscos** sale en negritas */
    texto: string;
    /** Si aquí se puede probar con la pantalla de verdad (ver PruebaPaso) */
    prueba?: PruebaPaso;
}

/**
 * "Pruébalo tú": se ilumina SÓLO lo que se va a probar (lo demás no responde), una burbuja con flecha
 * dice qué hacer y, cuando se hizo, cambia a "¡Listo!" con "Seguir".
 */
export interface PruebaPaso {
    /** Qué hacer, en una frase: "Toca «Firmar» y firma con tu dedo." */
    texto: string;
    /** Lo único que se puede tocar (el primer selector que esté a la vista) */
    objetivo: string[];
    /**
     * Cómo se sabe que ya se probó: un campo con un número mayor que cero, un texto que aparece en la
     * pantalla ("Firmado") o una ventana que se abrió y se cerró (solicitar, ver una solicitud)
     */
    listo: { tipo: 'valor'; selector: string } | { tipo: 'texto'; selector: string; texto: string } | { tipo: 'ventana' };
    /** Lo que se dice al terminar: "Así se anota lo que entrega cada barco." */
    hecho: string;
}

export interface Recorrido {
    bienvenida: { titulo: string; texto: string };
    pasos: PasoRecorrido[];
    final: { titulo: string; texto: string; otraVista: { vista: VistaDemo; texto: string } };
}

/**
 * Los dos recorridos de la demostración. Cuentan una historia (el barco llega, se registra y se firma,
 * lo que entregó se junta en el acopio, una empresa lo recicla y se ve lo que gana el mar), no un menú
 * de pantallas. Cada paso: una idea, una o dos frases cortas, de tú (DISEÑO_SIMAR.md §11). Los
 * objetivos son `data-recorrido` en las pantallas; si uno no aparece, el paso sale igual, al centro.
 * El basurón (relleno sanitario) no entra en el recorrido a propósito.
 */
export const RECORRIDOS: Record<VistaDemo, Recorrido> = {
    puerto: {
        bienvenida: {
            titulo: 'Te damos la bienvenida a SiMAR',
            texto:
                'Así lleva el centro de acopio de Puerto Peñasco los residuos de los barcos, desde el muelle hasta el reciclaje. Son datos de ejemplo.',
        },
        pasos: [
            {
                ruta: '/dashboard',
                objetivo: ['[data-recorrido="panel-importante"]', '[data-recorrido="panel-saludo"]'],
                icono: LayoutGrid,
                titulo: 'Así empieza el día',
                texto: 'El **Panel** dice lo que llegó hoy y lo que falta por atender, sin buscar entre papeles.',
            },
            {
                ruta: '/dashboard/manifiesto',
                objetivo: ['[data-recorrido="manifiesto-datos"]'],
                icono: Ship,
                titulo: 'Llega un barco al muelle',
                texto: 'Lo que entrega (**aceite usado**, **filtros** y **basura**) se anota en un manifiesto digital. Letra grande y pocos pasos.',
                prueba: {
                    texto: 'Escribe cuántos litros de aceite entregó el barco.',
                    objetivo: ['[data-recorrido="manifiesto-aceite"]'],
                    listo: { tipo: 'valor', selector: '#manifiesto-aceite' },
                    hecho: 'Así se anota lo que entrega cada barco.',
                },
            },
            {
                ruta: '/dashboard/manifiesto',
                objetivo: ['[data-recorrido="manifiesto-firmas"]'],
                icono: PenLine,
                titulo: 'Se firma en la pantalla',
                texto: 'La tripulación **firma con el dedo** y sale el **PDF oficial MARPOL**, listo para SEMARNAT. Ya no hay papel.',
                prueba: {
                    texto: 'Toca «Firmar» y firma con tu dedo o con el mouse.',
                    objetivo: ['[data-recorrido="firma-oficial"]'],
                    listo: { tipo: 'texto', selector: '[data-recorrido="firma-oficial"]', texto: 'Firmado' },
                    hecho: 'Esa firma ya va en el PDF oficial del manifiesto.',
                },
            },
            {
                ruta: '/dashboard',
                objetivo: ['[data-recorrido="panel-acopio"]', '[data-recorrido="panel-saludo"]'],
                icono: Recycle,
                tono: 'arrecife',
                titulo: 'Todo se junta en el acopio',
                texto: 'SiMAR lleva la cuenta de lo que hay: **aceite**, **plástico**, **chatarra**… Listo para que alguien lo recicle.',
            },
            {
                ruta: '/dashboard/asociaciones',
                objetivo: ['[data-recorrido="empresas-conteos"]', '[data-recorrido="empresas-secciones"]'],
                icono: Building2,
                titulo: 'El aceite no se tira: se recicla',
                texto: 'Las **empresas recolectoras** piden lo que reciclan. El puerto aprueba, registra la entrega y da un **comprobante**.',
            },
            {
                ruta: '/dashboard/estadisticas',
                objetivo: ['[data-recorrido="impacto"]'],
                icono: Waves,
                tono: 'violeta',
                titulo: 'Lo que gana el mar',
                texto: 'Cada litro de aceite que no llega al mar protege **mil litros de agua**. Aquí se ve todo el impacto.',
            },
        ],
        final: {
            titulo: 'Ya conoces SiMAR',
            texto: 'Ahora recórrelo a tu ritmo: puedes tocar todo, aquí nada se guarda.',
            otraVista: { vista: 'empresa', texto: 'Verlo como empresa recolectora' },
        },
    },
    empresa: {
        bienvenida: {
            titulo: 'Así ve SiMAR una empresa recolectora',
            texto:
                'Así pide una empresa los residuos del puerto para reciclarlos y sigue cada recolección. Son datos de ejemplo.',
        },
        pasos: [
            {
                ruta: '/dashboard-recolector',
                objetivo: ['section[aria-label="Lo importante"]', '[data-recorrido="portal-saludo"]'],
                icono: LayoutGrid,
                titulo: 'Tu empresa, de un vistazo',
                texto: 'Lo importante va primero: **tu próxima recolección** y los avisos que te manda el puerto.',
            },
            {
                ruta: '/dashboard-recolector/mapa',
                objetivo: ['[data-recorrido="residuos"]'],
                icono: MapPin,
                titulo: 'Lo que hay en el puerto',
                texto: 'El centro de acopio publica cuánto **aceite**, **plástico** o **chatarra** tiene. Tú pides lo que puedes reciclar.',
                prueba: {
                    texto: 'Toca «Solicitar» y elige cuánto quieres llevarte.',
                    objetivo: ['[data-recorrido="solicitar"]'],
                    listo: { tipo: 'ventana' },
                    hecho: 'Así se pide. El puerto la revisa y te avisa.',
                },
            },
            {
                ruta: '/dashboard-recolector/solicitudes',
                objetivo: ['[data-recorrido="solicitudes"]'],
                icono: ClipboardList,
                titulo: 'Sigue cada solicitud',
                texto: 'Ves en qué va cada una (**enviada**, **aprobada** o **recolectada**) y el día en que pasas por ella.',
                prueba: {
                    texto: 'Toca «Ver» para ver en qué va esta solicitud.',
                    objetivo: ['[data-recorrido="ver-solicitud"]'],
                    listo: { tipo: 'ventana' },
                    hecho: 'Así sigues cada solicitud, paso a paso.',
                },
            },
            {
                ruta: '/dashboard-recolector/impacto',
                objetivo: ['[data-recorrido="impacto"]'],
                icono: Leaf,
                tono: 'arrecife',
                titulo: 'Tu aporte al mar',
                texto: 'Lo que reciclaste, convertido en **agua protegida** y **CO₂ evitado**. Te sirve para tus reportes y tu constancia anual.',
            },
        ],
        final: {
            titulo: 'Ya conoces el portal de empresas',
            texto: 'Ahora recórrelo a tu ritmo: puedes tocar todo, aquí nada se guarda.',
            otraVista: { vista: 'puerto', texto: 'Verlo como el puerto' },
        },
    },
};
