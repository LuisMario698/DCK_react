'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Una foto de Noticias que llega bien, sin saltos:
 *  1. al instante se ve su vista previa (32 px, difuminada: lib/constants/previas.ts), con sus
 *     colores y su composición, en vez de un cuadro vacío;
 *  2. cuando la foto de verdad terminó de llegar (no antes), se enfoca encima: aparece y se asienta
 *     de 103 % a 100 %, como una cámara que enfoca. Sólo opacidad y transform (nada de desenfoques
 *     animados: la previa ya viene difuminada y no se mueve).
 * Si la foto ya estaba en caché, se revisa al montar. Sin JavaScript, a los 3 s se ve de todos
 * modos (globals.css, «Una foto que llega bien»). Sin previa, debajo queda el brillo de carga.
 *
 * Se enseña hasta que está decodificada (`img.decode()`): si no, el navegador la decodificaba en el
 * cuadro en que empezaba a aparecer y ese cuadro se trababa (se nota al bajar a las noticias, cuando
 * llegan varias fotos a la vez). Ya enfocada, la previa deja de pintarse.
 */
function cuandoDecodificada(img: HTMLImageElement, listo: () => void) {
    if (typeof img.decode !== 'function') return listo();
    img.decode().then(listo, listo);
}

export function FotoNota({
    src,
    alt,
    posicion = '50% 50%',
    previa,
    sizes,
    prioridad = false,
    className = '',
}: {
    src: string;
    alt: string;
    posicion?: string;
    previa?: string;
    sizes: string;
    prioridad?: boolean;
    className?: string;
}) {
    const [lista, setLista] = useState(false);
    return (
        <div className={`n-foto relative overflow-hidden ${previa ? '' : 'simar-cargando'} ${className}`} data-lista={lista}>
            {previa && <span aria-hidden="true" className="n-foto-previa" style={{ backgroundImage: `url("${previa}")`, backgroundPosition: posicion }} />}
            <Image
                ref={(img) => {
                    if (img?.complete && img.naturalWidth > 0) cuandoDecodificada(img, () => setLista(true));
                }}
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                priority={prioridad}
                onLoad={(e) => cuandoDecodificada(e.currentTarget, () => setLista(true))}
                className="n-foto-nitida object-cover"
                style={{ objectPosition: posicion }}
            />
        </div>
    );
}
