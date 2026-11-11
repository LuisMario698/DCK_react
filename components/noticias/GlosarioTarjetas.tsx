import {
    BookOpen,
    Droplet,
    FileText,
    Ghost,
    Globe2,
    Grid3x3,
    Recycle,
    Scale,
    ShieldAlert,
    Truck,
    Warehouse,
    type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { FOTOS, textoCredito, type CreditoFoto } from '@/lib/constants/fotos';

const ICONO: Record<string, LucideIcon> = {
    Manifiesto: FileText,
    'Centro de acopio': Warehouse,
    Basurón: Truck,
    'Aceite usado': Droplet,
    'MARPOL Anexo V': Scale,
    'Empresa recolectora': Recycle,
    'Red de enmalle': Grid3x3,
    'Red fantasma': Ghost,
    'Zona de Tolerancia Cero': ShieldAlert,
    'Alta mar': Globe2,
};

/** Las dos palabras más grandes llevan su foto (ocupan dos columnas en computadora); sin crédito, es de SiMAR */
const FOTO: Record<string, { src: string; alt: string; credito?: CreditoFoto }> = {
    Manifiesto: { src: '/assets/images/img1.jpeg', alt: 'Fotos de la recolección de desechos en el muelle de Puerto Peñasco' },
    'Red fantasma': { src: FOTOS.retiroDeRedes.src, alt: 'Una máquina retira redes de pesca abandonadas sacadas del mar', credito: FOTOS.retiroDeRedes.credito },
};

/**
 * El glosario, todo a la vista: una tarjeta por palabra, con su ícono y lo que quiere decir. En
 * computadora, una cuadrícula de cuatro columnas; en celular, un carrusel que se desliza de lado.
 */
export function GlosarioTarjetas({ terminos }: { terminos: { termino: string; definicion: string }[] }) {
    return (
        <ul aria-label="Palabras (en celular, desliza de lado)" className="t3-enfoca mt-10 md:mt-12 simar-carrusel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 movil:mt-7">
            {terminos.map((g) => {
                const Icono = ICONO[g.termino] ?? BookOpen;
                const foto = FOTO[g.termino];
                return (
                    <li
                        key={g.termino}
                        className={`flex flex-col rounded-[26px] bg-simar-superficie border border-simar-borde overflow-hidden movil:rounded-[22px] ${foto ? 'sm:col-span-2 lg:flex-row' : ''}`}
                    >
                        {foto && (
                            <figure className="relative aspect-[16/9] lg:aspect-auto lg:w-[44%] flex-shrink-0 overflow-hidden simar-cargando">
                                <Image src={foto.src} alt={foto.alt} fill sizes="(min-width: 1024px) 280px, 100vw" className="object-cover" />
                                <figcaption className="absolute inset-x-3 bottom-2 text-right text-[12px] text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
                                    {foto.credito ? textoCredito(foto.credito) : 'Foto: SiMAR'}
                                </figcaption>
                            </figure>
                        )}
                        <div className="p-6 movil:p-5">
                            <span className="w-12 h-12 rounded-[16px] bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center">
                                <Icono aria-hidden="true" className="w-6 h-6" />
                            </span>
                            <h3 className="mt-4 font-titular text-[25px] font-semibold leading-tight tracking-[-0.01em] movil:text-[21px]">{g.termino}</h3>
                            <p className="mt-2 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{g.definicion}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
