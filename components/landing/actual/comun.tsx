import { Fragment, type CSSProperties } from 'react';

/**
 * Lo que comparten las secciones de la landing Actual (components/landing/actual/).
 */

/**
 * Texto que se enfoca palabra por palabra: dentro de un `.reveal-palabras` lo hace al
 * aparecer con el scroll; dentro de `.simar-enfoca-palabras`, al cargar. `desde` sigue la
 * cascada de un texto anterior. El lector de pantalla oye la frase entera, una sola vez.
 */
export function TextoEnfoca({ texto, desde = 0 }: { texto: string; desde?: number }) {
    return (
        <>
            <span aria-hidden="true">
                {texto.split(' ').map((palabra, i) => (
                    <Fragment key={i}>
                        {i > 0 && ' '}
                        <span className="palabra" style={{ '--i': desde + i } as CSSProperties}>
                            {palabra}
                        </span>
                    </Fragment>
                ))}
            </span>
            <span className="sr-only">{texto}</span>
        </>
    );
}
