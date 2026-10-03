import { Bell, Building2, ClipboardList, Leaf, MapPin, PenLine, Recycle, Ship, Waves, type LucideIcon } from 'lucide-react';
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
    /** Un documento de ejemplo que se puede ver (sólo vista previa: no se descarga) */
    documento?: { texto: string; tipo: 'manifiesto' | 'comprobante' };
}

/**
 * "Pruébalo tú": se ilumina SÓLO lo que se va a probar (lo demás no responde), una burbuja con flecha
 * dice qué hacer y, cuando se hizo, cambia a "¡Listo!" con "Seguir".
 */
export interface PruebaPaso {
    /** Qué hacer, en una frase: "Toca «Firmar» y haz una firma de prueba." */
    texto: string;
    /** Lo único que se puede tocar (el primer selector que esté a la vista) */
    objetivo: string[];
    /**
     * Cuándo ya se probó:
     * - `valor`: el campo tiene un número mayor que cero (al terminar de escribir o con Enter)
     * - `texto`: aparece un texto en la pantalla ("Firmado")
     * - `envio`: se intentó guardar (la demo lo detiene con su aviso). Cancelar no cuenta
     * - `ventana`: se abrió una ventana y se cerró (ver una solicitud: mirar ya es probar)
     */
    listo:
        | { tipo: 'valor'; selector: string }
        | { tipo: 'texto'; selector: string; texto: string }
        | { tipo: 'envio' }
        | { tipo: 'ventana' };
    /** Lo que se dice al terminar: "Así se anota lo que entrega cada barco." */
    hecho: string;
}

export interface Recorrido {
    bienvenida: { titulo: string; texto: string };
    pasos: PasoRecorrido[];
    final: { titulo: string; texto: string; otraVista: { vista: VistaDemo; texto: string } };
}

/**
 * Los dos recorridos de la demostración. Cuentan una historia en la que cada paso lleva al siguiente
 * (causa y efecto), no un menú de pantallas, para que cualquiera lo siga sin saber qué es SiMAR:
 *
 * - Puerto: el barco entrega → se firma → se junta en el acopio → una empresa lo pide y el puerto
 *   aprueba → lo que gana el mar.
 * - Empresa: ve lo que hay → lo pide → sigue su solicitud → el puerto le avisa el día → su aporte.
 *
 * Cada paso: una idea, una o dos frases cortas, de tú, y las palabras raras explicadas ("manifiesto",
 * DISEÑO_SIMAR.md §11). Los objetivos son `data-recorrido` en las pantallas; si uno no aparece, el paso
 * sale igual, al centro. El basurón (relleno sanitario) no entra a propósito.
 */
export const RECORRIDOS: Record<VistaDemo, Recorrido> = {
    puerto: {
        bienvenida: {
            titulo: 'Te damos la bienvenida a SiMAR',
            texto:
                'Sigue lo que entrega un barco en Puerto Peñasco, desde el muelle hasta que se recicla. En algunos pasos podrás **probarlo tú**. Son datos de ejemplo.',
        },
        pasos: [
            {
                ruta: '/dashboard/manifiesto',
                objetivo: ['[data-recorrido="manifiesto-datos"]'],
                icono: Ship,
                titulo: 'Llega un barco al muelle',
                texto: 'Lo que entrega (**aceite usado**, **filtros** y **basura**) se anota en el **manifiesto**, el registro oficial de cada entrega. Aquí ya es digital.',
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
                texto: 'La tripulación **firma digitalmente** en la pantalla y sale el **PDF oficial**, listo para entregarlo a SEMARNAT. Ya no hay papel.',
                prueba: {
                    texto: 'Toca «Firmar» y haz una firma de prueba en el recuadro.',
                    objetivo: ['[data-recorrido="firma-oficial"]'],
                    listo: { tipo: 'texto', selector: '[data-recorrido="firma-oficial"]', texto: 'Firmado' },
                    hecho: 'Esa firma ya va en el PDF del manifiesto.',
                },
                documento: { texto: 'Ver cómo queda el PDF del manifiesto', tipo: 'manifiesto' },
            },
            {
                ruta: '/dashboard',
                objetivo: ['[data-recorrido="panel-acopio"]', '[data-recorrido="panel-saludo"]'],
                icono: Recycle,
                tono: 'arrecife',
                titulo: 'Todo se junta en el acopio',
                texto: 'En el **Panel** ves lo que se ha juntado de todos los barcos: **aceite**, **plástico**, **chatarra**… Listo para reciclarse.',
            },
            {
                ruta: '/dashboard/asociaciones',
                objetivo: ['[data-recorrido="empresas-solicitudes"]', '[data-recorrido="empresas-secciones"]'],
                icono: Building2,
                titulo: 'Una empresa lo pide para reciclarlo',
                texto: 'Las **empresas recolectoras** piden lo que reciclan. Tú **apruebas** y, el día que pasan, queda su **comprobante**.',
                prueba: {
                    texto: 'Toca «Aprobar» en una solicitud y confírmala.',
                    objetivo: ['[data-recorrido="aprobar"]'],
                    listo: { tipo: 'envio' },
                    hecho: 'Así se aprueba. La empresa recibe el aviso al momento.',
                },
                documento: { texto: 'Ver un comprobante de recolección', tipo: 'comprobante' },
            },
            {
                ruta: '/dashboard/estadisticas',
                objetivo: ['[data-recorrido="impacto"]'],
                icono: Waves,
                tono: 'violeta',
                titulo: 'Lo que gana el mar',
                texto: 'Cada litro de aceite que no llega al mar protege **mil litros de agua**. Aquí se ve todo lo que se ha logrado.',
            },
        ],
        final: {
            titulo: 'Ya conoces SiMAR',
            texto: 'Ya viste cómo funciona de principio a fin. Ahora recórrelo a tu ritmo: puedes tocar todo y nada se guarda.',
            otraVista: { vista: 'empresa', texto: 'Verlo como empresa recolectora' },
        },
    },
    empresa: {
        bienvenida: {
            titulo: 'Así ve SiMAR una empresa recolectora',
            texto:
                'Sigue cómo una empresa pide los residuos del puerto para reciclarlos. En algunos pasos podrás **probarlo tú**. Son datos de ejemplo.',
        },
        pasos: [
            {
                ruta: '/dashboard-recolector/mapa',
                objetivo: ['[data-recorrido="residuos"]'],
                icono: MapPin,
                titulo: 'Lo que hay en el puerto',
                texto: 'El centro de acopio publica cuánto **aceite**, **plástico** o **chatarra** tiene. Tú pides lo que puedes reciclar.',
                prueba: {
                    texto: 'Toca «Solicitar», elige cuánto quieres y envíala.',
                    objetivo: ['[data-recorrido="solicitar"]'],
                    listo: { tipo: 'envio' },
                    hecho: 'Así se pide. El puerto la revisa y te avisa.',
                },
            },
            {
                ruta: '/dashboard-recolector/solicitudes',
                objetivo: ['[data-recorrido="solicitudes"]'],
                icono: ClipboardList,
                titulo: 'Sigue cada solicitud',
                texto: 'Ves en qué va cada una: **enviada**, **aprobada** o **recolectada**.',
                prueba: {
                    texto: 'Toca «Ver» para ver en qué va esta solicitud.',
                    objetivo: ['[data-recorrido="ver-solicitud"]'],
                    listo: { tipo: 'ventana' },
                    hecho: 'Así sigues cada solicitud, paso a paso.',
                },
                documento: { texto: 'Ver un comprobante de recolección', tipo: 'comprobante' },
            },
            {
                ruta: '/dashboard-recolector',
                objetivo: ['[data-recorrido="portal-importante"]', '[data-recorrido="portal-saludo"]'],
                icono: Bell,
                titulo: 'El puerto te avisa',
                texto: 'Cuando el puerto aprueba, en tu Inicio ves **el día de tu recolección** y, a un lado, sus **avisos** y **mensajes**.',
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
            texto: 'Ya viste cómo funciona de principio a fin. Ahora recórrelo a tu ritmo: puedes tocar todo y nada se guarda.',
            otraVista: { vista: 'puerto', texto: 'Verlo como el puerto' },
        },
    },
};
