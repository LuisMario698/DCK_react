import type { ReactNode } from 'react';

/** Una gota de la isla dinámica (IslaDinamica) */
export interface GotaIsla {
    id: string;
    /** El nombre de la gota para los lectores de pantalla */
    etiqueta: string;
    /** Ancho en computadora (en celular va a todo lo ancho) */
    ancho?: number;
    contenido?: ReactNode;
    /** Acompaña mientras se usa la página (el reproductor): no atrapa el foco ni se cierra al tocar afuera */
    libre?: boolean;
}

/** La columna donde vive una gota, medida al abrirla */
export interface Zona {
    left: number;
    width: number;
    height: number;
    /** El centro y el tamaño del botón, dentro de la zona */
    ancla: { x: number; y: number; w: number; h: number };
    angosta: boolean;
    /** Se midió sin botón (todavía no existía): se vuelve a medir en cuanto aparezca */
    sinAncla: boolean;
}

/** Espacio entre la isla y la gota ya caída (el cuello se corta al pasar de aquí) */
export const SEPARACION = 12;
/** Margen de la capa líquida alrededor de la gota (para el cuello y el borde suave del filtro) */
export const MARGEN = 20;
