import Image from 'next/image';
import { Droplet, FileText, Fish, Waves, type LucideIcon } from 'lucide-react';
import type { CategoriaNoticia, Noticia } from '@/lib/constants/noticias';

const ICONOS: Record<CategoriaNoticia, LucideIcon> = {
    SiMAR: Waves,
    'Mar de Cortés': Fish,
    Normativa: FileText,
    Conciencia: Droplet,
};

/**
 * La portada de una noticia: su foto o, si no tiene, un dibujo con las líneas de profundidad de
 * SiMAR y el ícono del tema (así ninguna tarjeta queda vacía ni se inventa una foto).
 */
export function PortadaNoticia({ noticia, sizes, prioridad = false, className = '' }: { noticia: Noticia; sizes: string; prioridad?: boolean; className?: string }) {
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
    const Icono = ICONOS[noticia.categoria];
    const aceite = noticia.categoria === 'Conciencia';
    return (
        <div aria-hidden="true" className={`relative overflow-hidden bg-simar-abismo ${className}`}>
            <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <defs>
                    <radialGradient id={`luz-${noticia.slug}`} cx="70%" cy="40%" r="70%">
                        <stop offset="0%" stopColor={aceite ? '#F2C14E' : '#20B2C4'} stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#0B2236" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect width="400" height="250" fill={`url(#luz-${noticia.slug})`} />
                {[0, 1, 2, 3, 4, 5].map((k) => (
                    <ellipse
                        key={k}
                        cx="280"
                        cy="105"
                        rx={40 + k * 34}
                        ry={24 + k * 21}
                        fill="none"
                        stroke={aceite ? '#F2C14E' : '#7FE0D6'}
                        strokeOpacity={0.42 - k * 0.06}
                        strokeWidth="1.4"
                        transform={`rotate(${-8 + k * 3} 280 105)`}
                    />
                ))}
            </svg>
            <span className="absolute left-[70%] top-[42%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icono className={`w-8 h-8 ${aceite ? 'text-simar-aceite' : 'text-simar-espuma'}`} strokeWidth={1.8} />
            </span>
        </div>
    );
}
