'use client';

import { type ReactNode } from 'react';

/**
 * Antetítulo, título y texto de una sección, con la escala grande de la landing nueva (títulos de
 * 40 a 64 px con el interletrado cerrado, como los de Apple; 32 px en celular). `oscuro` para las
 * franjas Abismo y de mar. El título puede ser un `TextoQueSeEnciende`.
 */
export function Encabezado({
    antetitulo,
    titulo,
    texto,
    oscuro = false,
    centrado = false,
    className = '',
}: {
    antetitulo: string;
    titulo: ReactNode;
    texto?: ReactNode;
    oscuro?: boolean;
    centrado?: boolean;
    className?: string;
}) {
    return (
        <div className={`max-w-4xl ${centrado ? 'mx-auto text-center' : ''} ${className}`}>
            <p className={`ln-enfoca text-lg md:text-xl font-bold movil:text-[15px] ${oscuro ? 'text-simar-espuma' : 'text-simar-marea-tinta'}`}>{antetitulo}</p>
            <h2 className="ln-enfoca mt-3 text-[clamp(40px,4.4vw,64px)] font-extrabold leading-[1.04] tracking-[-0.03em] movil:mt-2 movil:text-[32px] movil:leading-[1.08] movil:tracking-[-0.02em]">
                {titulo}
            </h2>
            {texto && (
                <p
                    className={`ln-enfoca mt-5 max-w-3xl text-xl md:text-[22px] leading-relaxed movil:mt-3 movil:text-[17px] ${centrado ? 'mx-auto' : ''} ${
                        oscuro ? 'text-simar-franja-texto-2' : 'text-simar-texto-2'
                    }`}
                >
                    {texto}
                </p>
            )}
        </div>
    );
}

/** Número con separador de miles a la mexicana y los decimales que pida */
export const cifra = (n: number, decimales = 0) =>
    n.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
