import Image from 'next/image';
import { ILUSTRACION_DE, type Noticia } from '@/lib/constants/noticias';
import { DibujoPortada } from './ilustraciones';

/**
 * La portada de una noticia: su foto o, si no tiene, un dibujo de puntos de su tema (el mismo
 * lenguaje del mar de partículas). Así ninguna tarjeta queda vacía ni se inventa una foto.
 */
export function PortadaNoticia({
    noticia,
    sizes,
    prioridad = false,
    className = '',
}: {
    noticia: Pick<Noticia, 'slug' | 'imagen' | 'ilustracion' | 'categoria'>;
    sizes: string;
    prioridad?: boolean;
    className?: string;
}) {
    if (noticia.imagen) {
        return (
            <div className={`relative overflow-hidden bg-simar-abismo ${className}`}>
                <Image
                    src={noticia.imagen.src}
                    alt={noticia.imagen.alt}
                    fill
                    sizes={sizes}
                    priority={prioridad}
                    className="object-cover"
                    style={{ objectPosition: noticia.imagen.posicion ?? '50% 50%' }}
                />
            </div>
        );
    }
    const tipo = noticia.ilustracion ?? ILUSTRACION_DE[noticia.categoria];
    return (
        <div aria-hidden="true" className={`relative overflow-hidden bg-simar-abismo ${className}`}>
            <DibujoPortada tipo={tipo} id={noticia.slug} />
        </div>
    );
}
