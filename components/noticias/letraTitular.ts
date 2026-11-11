import { Newsreader } from 'next/font/google';

/**
 * La letra de los titulares de Noticias: Newsreader (Production Type, licencia OFL), hecha para
 * titulares de periódico en pantalla. Sólo los titulares y la cabecera; el texto sigue en Atkinson
 * (la de SiMAR, la más legible para la gente mayor). Se usa con la clase `font-titular` dentro de
 * un contenedor con `letraTitular.variable` (la página de Noticias, el artículo y sus esqueletos).
 */
export const letraTitular = Newsreader({
    subsets: ['latin'],
    variable: '--font-newsreader',
    display: 'swap',
    style: ['normal', 'italic'],
    axes: ['opsz'],
});
// La de la landing, sin precarga, está en letraTitularDiferida.ts (en este archivo se precargaba igual)
