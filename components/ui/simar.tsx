/**
 * Piezas de presentación del lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md → Componentes).
 * Sólo dibujan: no guardan estado ni hacen consultas. Los manejadores (onChange, onClick)
 * los pasa cada pantalla tal cual.
 */
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, Info, Loader2, Search, type LucideIcon } from 'lucide-react';
import { NumeroAnimado } from './movimiento';

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
    accionesClassName = '',
}: {
    icono: LucideIcon;
    titulo: ReactNode;
    subtitulo?: ReactNode;
    tono?: Tono;
    acciones?: ReactNode;
    /** Clases extra del bloque de acciones (p. ej. "movil:hidden" si en celular va en BotonFlotante) */
    accionesClassName?: string;
}) {
    // En celular (zona compacta): ícono de 40 px arriba a la izquierda, título de 19 px y la acción
    // a lo ancho debajo, para que el contenido empiece antes.
    return (
        <header className="simar-aparece flex flex-wrap items-center gap-5 movil:gap-x-3 movil:gap-y-3">
            <span className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center movil:w-[40px] movil:h-[40px] movil:self-start movil:mt-0.5 ${TONO_CIRCULO[tono]}`}>
                <Icono className="w-[30px] h-[30px] movil:w-[22px] movil:h-[22px]" strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-[240px] movil:min-w-0">
                <h1 className="text-[28px] md:text-[34px] font-extrabold leading-tight text-simar-texto movil:text-[19px]">{titulo}</h1>
                {subtitulo && <p className="mt-1 text-lg md:text-[19px] text-simar-texto-2 movil:mt-0 movil:text-[14px] movil:leading-snug">{subtitulo}</p>}
            </div>
            {acciones && <div className={`flex flex-wrap gap-3 w-full sm:w-auto movil:gap-2 ${accionesClassName}`}>{acciones}</div>}
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

/**
 * Dato grande con etiqueta (conteos de la pantalla). Si el valor es un número, cuenta al aparecer.
 * Con `href` la tarjeta entera lleva a otra pantalla y muestra una flecha a la derecha.
 * `compacto` baja el valor a 24 px para textos largos ("Puerto Peñasco", "Hace 1 día").
 * `apilada`: en celular el ícono va arriba y el dato debajo, para poner dos o tres tarjetas por
 * fila (ver DISEÑO_SIMAR.md → "Versión móvil"); desde 640 px vuelve a ser horizontal. En la zona
 * compacta (recinto) el ícono y el número comparten la primera línea y la etiqueta va debajo.
 */
export function TarjetaDato({
    etiqueta,
    valor,
    icono: Icono,
    tono = 'marea',
    detalle,
    href,
    compacto = false,
    apilada = false,
    className = '',
    style,
}: {
    etiqueta: ReactNode;
    valor: ReactNode;
    icono: LucideIcon;
    tono?: Tono;
    detalle?: ReactNode;
    href?: string;
    compacto?: boolean;
    apilada?: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    const contenido = (
        <>
            <span className={`${apilada ? 'w-11 h-11 sm:w-14 sm:h-14 movil:w-8 movil:h-8 movil:order-1' : 'w-14 h-14 movil:w-11 movil:h-11'} flex-shrink-0 rounded-full flex items-center justify-center ${TONO_CIRCULO[tono]}`}>
                <Icono className={apilada ? 'w-[22px] h-[22px] sm:w-7 sm:h-7 movil:w-[17px] movil:h-[17px]' : 'w-7 h-7 movil:w-[22px] movil:h-[22px]'} strokeWidth={2} />
            </span>
            <div className={`min-w-0 flex-1 ${apilada ? 'movil:contents' : ''}`}>
                <p className={`${apilada ? 'text-[15px] sm:text-[17px] movil:order-3 movil:col-span-2 movil:text-[13px] movil:leading-tight' : 'text-[17px]'} text-simar-texto-2 leading-snug`}>{etiqueta}</p>
                <p className={`${compacto ? 'text-[24px]' : apilada ? 'text-[26px] sm:text-[30px] movil:order-2 movil:text-[21px]' : 'text-[30px]'} font-extrabold leading-tight text-simar-texto ${compacto ? '' : 'whitespace-nowrap'}`}>
                    {typeof valor === 'number' ? <NumeroAnimado valor={valor} /> : valor}
                </p>
                {detalle && <div className={`text-[15px] text-simar-texto-2 ${apilada ? 'movil:order-4 movil:col-span-2' : ''}`}>{detalle}</div>}
            </div>
            {/* La flecha va encima del margen derecho: así no le quita ancho a la etiqueta */}
            {href && (
                <ChevronRight
                    aria-hidden="true"
                    className={`absolute right-3.5 w-6 h-6 text-simar-texto-2 ${apilada ? 'top-4 sm:top-1/2 sm:-translate-y-1/2' : 'top-1/2 -translate-y-1/2'}`}
                    strokeWidth={2}
                />
            )}
        </>
    );
    const disposicion = apilada
        ? `p-4 sm:p-5 ${href ? 'sm:pr-11' : ''} flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-4 movil:grid movil:grid-cols-[auto_1fr] movil:items-center movil:gap-x-2 movil:gap-y-1 movil:p-3`
        : `p-5 ${href ? 'pr-11' : ''} flex items-center gap-4 movil:p-3.5 movil:gap-3`;
    const clases = `relative bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] ${disposicion} ${className}`;

    if (href) {
        return (
            <Link href={href} className={`simar-tarjeta-accion ${clases}`} style={style}>
                {contenido}
            </Link>
        );
    }
    return (
        <div className={clases} style={style}>
            {contenido}
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
        <div className={`flex items-start gap-3.5 rounded-2xl p-5 text-simar-texto movil:p-3.5 movil:gap-2.5 ${tono === 'info' ? 'bg-simar-marea-suave' : 'bg-simar-coral-suave'}`}>
            <Icono className={`w-6 h-6 flex-shrink-0 ${tono === 'info' ? 'text-simar-marea-tinta' : 'text-simar-coral'}`} />
            <div className="min-w-0">
                {titulo && <p className="text-lg font-bold leading-snug movil:text-[15px]">{titulo}</p>}
                {children && <div className="text-base text-simar-texto-2 mt-0.5 movil:text-[14px] movil:leading-snug">{children}</div>}
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

/**
 * Pestañas que sólo existen en celular (variante movil:): parten una pantalla larga en dos vistas
 * ("Nuevo" / "Registros") para no bajar por el formulario hasta llegar a la lista. En tableta y
 * escritorio no se muestran y la pantalla enseña las dos partes, como siempre.
 */
export function PestanasMovil<T extends string>({
    opciones,
    valor,
    onCambiar,
    etiqueta,
    className = '',
}: {
    opciones: { valor: T; texto: ReactNode; icono?: LucideIcon; conteo?: number }[];
    valor: T;
    onCambiar: (valor: T) => void;
    /** Nombre del grupo para el lector de pantalla */
    etiqueta: string;
    className?: string;
}) {
    return (
        <div
            role="tablist"
            aria-label={etiqueta}
            className={`hidden movil:grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-full bg-simar-superficie border border-simar-borde shadow-simar ${className}`}
        >
            {opciones.map((o) => {
                const activa = o.valor === valor;
                const Icono = o.icono;
                return (
                    <button
                        key={o.valor}
                        type="button"
                        role="tab"
                        aria-selected={activa}
                        onClick={() => onCambiar(o.valor)}
                        className={`simar-presiona min-h-[42px] px-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 ${
                            activa ? 'bg-simar-marea text-white' : 'text-simar-texto-2'
                        }`}
                    >
                        {Icono && <Icono className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2.2} />}
                        {o.texto}
                        {o.conteo !== undefined && (
                            <span
                                className={`min-w-[24px] h-[22px] px-1.5 rounded-full text-[13px] font-bold flex items-center justify-center ${
                                    activa ? 'bg-white/20 text-white' : 'bg-simar-papel text-simar-texto'
                                }`}
                            >
                                {o.conteo}
                            </span>
                        )}
                    </button>
                );
            })}
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
