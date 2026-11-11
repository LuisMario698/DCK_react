import { Newsreader } from 'next/font/google';

/**
 * La letra de los titulares de Noticias (ver letraTitular.ts), sin precargarse: para la hoja de
 * noticias de la landing, que está muy abajo. Con precarga, sus dos archivos competían con la primera
 * foto y el JavaScript al abrir la página.
 *
 * Va en su propio archivo a propósito: Next precarga las letras de todo módulo que la página importa,
 * así que en el mismo archivo que `letraTitular` se precargaban las dos y cada archivo bajaba dos veces.
 */
export const letraTitularDiferida = Newsreader({
    subsets: ['latin'],
    variable: '--font-newsreader',
    display: 'swap',
    style: ['normal', 'italic'],
    axes: ['opsz'],
    preload: false,
});
