import { FOTOS, textoCredito, type FotoNoticia } from '@/lib/constants/fotos';

/**
 * Créditos de la landing Actual (el <details> del pie): una línea por recurso de terceros.
 * Los modelos 3D van aparte, en PieActual, con el texto exacto que pide su licencia CC BY 4.0.
 * Si una sección empieza a usar otra foto o mapa ajeno, se agrega aquí.
 */
export interface Credito {
    /** Qué es y dónde sale: «Fotos de “Un litro”: aceite de motor» */
    que: string;
    /** «Foto: SIGAUS · CC BY-SA 4.0 (adaptada)» */
    texto: string;
    /** La página del original (Commons, Natural Earth) */
    pagina?: string;
}

const deFoto = (donde: string, f: FotoNoticia): Credito => ({
    que: `${donde}: ${f.que.toLowerCase()}`,
    texto: textoCredito(f.credito),
    pagina: f.credito.pagina,
});

export const CREDITOS: Credito[] = [
    deFoto('Un litro', FOTOS.aceiteDeMotor),
    deFoto('Un litro', FOTOS.gotaEnElAgua),
    deFoto('Un litro', FOTOS.olaMarAbierto),
    deFoto('Noticias del Mar', FOTOS.flotaDePuertoPenasco),
    {
        que: 'Contorno de México (mapa de puertos)',
        texto: 'Natural Earth · Dominio público',
        pagina: 'https://www.naturalearthdata.com/',
    },
];
