/**
 * Piezas de presentación del lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md → Componentes).
 * Sólo dibujan: no guardan estado ni hacen consultas. Los manejadores (onChange, onClick)
 * los pasa cada pantalla tal cual.
 */
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, Info, Loader2, Search, type LucideIcon } from 'lucide-react';

type Tono = 'marea' | 'arrecife' | 'coral' | 'violeta' | 'neutro';

const TONO_CIRCULO: Record<Tono, string> = {
    marea: 'bg-simar-marea-suave text-simar-marea-tinta',
    arrecife: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
    coral: 'bg-simar-coral-suave text-simar-coral',
    violeta: 'bg-simar-violeta-suave text-simar-violeta',
    neutro: 'bg-simar-papel text-simar-texto-2',
};

/** Encabezado de pantalla: ícono en círculo, título que dice la tarea y una línea de contexto. */
export function EncabezadoPantalla({
    icono: Icono,
    titulo,
    subtitulo,
    tono = 'marea',
    acciones,
}: {
    icono: LucideIcon;
    titulo: ReactNode;
    subtitulo?: ReactNode;
    tono?: Tono;
    acciones?: ReactNode;
}) {
    return (
        <header className="simar-aparece flex flex-wrap items-center gap-5">
            <span className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center ${TONO_CIRCULO[tono]}`}>
                <Icono className="w-[30px] h-[30px]" strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-[240px]">
                <h1 className="text-[28px] md:text-[34px] font-extrabold leading-tight text-simar-texto">{titulo}</h1>
                {subtitulo && <p className="mt-1 text-lg md:text-[19px] text-simar-texto-2">{subtitulo}</p>}
            </div>
            {acciones && <div className="flex flex-wrap gap-3 w-full sm:w-auto">{acciones}</div>}
        </header>
    );
}

/** Tarjeta de contenido: superficie, borde y sombra (la regla de todas las tarjetas). */
export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] ${className}`}>
            {children}
        </section>
    );
}

/** Dato grande con etiqueta (conteos de la pantalla). */
export function TarjetaDato({
    etiqueta,
    valor,
    icono: Icono,
    tono = 'marea',
    detalle,
}: {
    etiqueta: ReactNode;
    valor: ReactNode;
    icono: LucideIcon;
    tono?: Tono;
    detalle?: ReactNode;
}) {
    return (
        <div className="bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] p-5 flex items-center gap-4">
            <span className={`w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center ${TONO_CIRCULO[tono]}`}>
                <Icono className="w-7 h-7" strokeWidth={2} />
            </span>
            <div className="min-w-0">
                <p className="text-[17px] text-simar-texto-2 leading-tight">{etiqueta}</p>
                <p className="text-[30px] font-extrabold leading-tight text-simar-texto">{valor}</p>
                {detalle && <p className="text-[15px] text-simar-texto-2">{detalle}</p>}
            </div>
        </div>
    );
}

/** Aviso en línea. El texto siempre en color de texto; el tono va en el fondo y el ícono. */
export function Aviso({
    tono = 'info',
    titulo,
    children,
    icono,
}: {
    tono?: 'info' | 'advertencia';
    titulo?: ReactNode;
    children?: ReactNode;
    icono?: LucideIcon;
}) {
    const Icono = icono ?? (tono === 'info' ? Info : AlertTriangle);
    return (
        <div className={`flex items-start gap-3.5 rounded-2xl p-5 text-simar-texto ${tono === 'info' ? 'bg-simar-marea-suave' : 'bg-simar-coral-suave'}`}>
            <Icono className={`w-6 h-6 flex-shrink-0 ${tono === 'info' ? 'text-simar-marea-tinta' : 'text-simar-coral'}`} />
            <div className="min-w-0">
                {titulo && <p className="text-lg font-bold leading-snug">{titulo}</p>}
                {children && <div className="text-base text-simar-texto-2 mt-0.5">{children}</div>}
            </div>
        </div>
    );
}

/** Campo de búsqueda de 56 px con lupa. Recibe las mismas props que un <input>. */
export function CampoBusqueda({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className={`relative ${className}`}>
            <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-simar-texto-2 pointer-events-none" />
            <input
                type="text"
                {...props}
                className="block w-full min-h-[56px] pl-12 pr-4 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors"
            />
        </div>
    );
}

/** Clase de un chip de filtro (48 px). La pantalla conserva su onClick. */
export function claseChip(activo: boolean) {
    return `min-h-[48px] px-5 rounded-full text-base font-bold transition-colors ${activo
        ? 'bg-simar-marea text-white'
        : 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta'
        }`;
}

/** Pantalla cargando. */
export function CargandoPantalla({ texto = 'Cargando…' }: { texto?: string }) {
    return (
        <div className="flex items-center justify-center gap-3 h-64 text-lg text-simar-texto-2">
            <Loader2 className="w-7 h-7 animate-spin text-simar-marea-tinta" />
            {texto}
        </div>
    );
}

/** Estado vacío: ícono, título y qué hacer. */
export function EstadoVacio({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: ReactNode; children?: ReactNode }) {
    return (
        <div className="flex flex-col items-center text-center gap-3 py-12 px-4">
            <span className="w-16 h-16 rounded-full bg-simar-papel text-simar-texto-2 flex items-center justify-center">
                <Icono className="w-8 h-8" />
            </span>
            <p className="text-lg font-bold text-simar-texto">{titulo}</p>
            {children && <p className="text-base text-simar-texto-2 max-w-md">{children}</p>}
        </div>
    );
}
