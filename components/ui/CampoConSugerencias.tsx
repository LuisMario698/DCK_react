'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';

/**
 * Campo de texto con sugerencias debajo (patrón "combobox" de WAI-ARIA). Ver DISEÑO_SIMAR.md §10.4.
 *
 * - El lector de pantalla sabe que el campo abre una lista, cuántas opciones trae y cuál está
 *   resaltada (aria-activedescendant): el foco se queda siempre en el campo.
 * - ↑ ↓ recorren las opciones, Enter elige la resaltada y Escape cierra. Con nada resaltado, Enter
 *   cierra la lista y llama a `alEnterSinLista` (para pasar al siguiente campo).
 * - Al tocar una opción el campo no pierde el foco (mousedown sin acción), así que la lista se puede
 *   cerrar en cuanto el campo se desenfoca, sin esperar.
 *
 * Quien lo usa decide el texto (`valor`/`onCambiar`) y qué hacer al elegir (`onElegir`): el campo sólo
 * filtra `opciones` por lo escrito y dibuja la lista.
 */
export function CampoConSugerencias<T>({
    id,
    valor,
    onCambiar,
    opciones,
    textoDe,
    claveDe,
    onElegir,
    complementoDe,
    sinResultados,
    etiqueta,
    placeholder,
    invalido,
    inputRef,
    className,
    // Ancho mínimo: junto a «Firmar» el campo de nombre queda angosto y los nombres se partían en dos renglones
    claseLista = 'z-30 max-h-48 min-w-[280px]',
    envoltura,
    onFocus,
    onBlur,
    alEnterSinLista,
}: {
    /** id del campo, para la `<label htmlFor>` de afuera */
    id?: string;
    valor: string;
    onCambiar: (texto: string) => void;
    opciones: T[];
    textoDe: (opcion: T) => string;
    claveDe: (opcion: T) => string | number;
    onElegir: (opcion: T) => void;
    /** Dato chico junto al nombre (la matrícula de una embarcación) */
    complementoDe?: (opcion: T) => ReactNode;
    /** Qué decir cuando nada coincide; sin él, la lista no se abre */
    sinResultados?: string;
    /** Nombre del campo para el lector de pantalla, cuando no tiene `<label>` propia */
    etiqueta?: string;
    placeholder?: string;
    invalido?: boolean;
    inputRef?: Ref<HTMLInputElement>;
    className?: string;
    /** Capa, alto y ancho mínimo de la lista */
    claseLista?: string;
    /** Para meter el campo en una caja con ícono; la lista sale debajo de esa caja */
    envoltura?: (campo: ReactNode) => ReactNode;
    onFocus?: () => void;
    onBlur?: () => void;
    alEnterSinLista?: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
    const base = useId();
    const idLista = `${base}-lista`;
    const [abierto, setAbierto] = useState(false);
    const [resaltado, setResaltado] = useState(-1);
    const listaRef = useRef<HTMLUListElement>(null);

    const buscado = valor.trim().toLowerCase();
    const visibles = abierto ? opciones.filter((o) => textoDe(o).toLowerCase().includes(buscado)) : [];
    const mostrarLista = abierto && (visibles.length > 0 || !!sinResultados);
    const idOpcion = (i: number) => `${base}-opcion-${i}`;

    // La opción resaltada con el teclado siempre a la vista dentro de la lista
    useEffect(() => {
        if (resaltado < 0) return;
        listaRef.current?.children[resaltado]?.scrollIntoView({ block: 'nearest' });
    }, [resaltado]);

    const elegir = (opcion: T) => {
        onElegir(opcion);
        setAbierto(false);
        setResaltado(-1);
    };

    const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            if (!abierto && buscado) {
                e.preventDefault();
                setAbierto(true);
            } else if (visibles.length > 0) {
                e.preventDefault();
                setResaltado((r) => Math.min(r + 1, visibles.length - 1));
            }
        } else if (e.key === 'ArrowUp') {
            if (abierto && resaltado > 0) {
                e.preventDefault();
                setResaltado((r) => r - 1);
            }
        } else if (e.key === 'Enter') {
            const opcion = resaltado >= 0 ? visibles[resaltado] : undefined;
            if (opcion) {
                e.preventDefault();
                elegir(opcion);
            } else {
                setAbierto(false);
                alEnterSinLista?.(e);
            }
        } else if (e.key === 'Escape' && abierto) {
            // Cierra sólo la lista, no la ventana o el panel que la contenga
            e.preventDefault();
            e.stopPropagation();
            setAbierto(false);
            setResaltado(-1);
        }
    };

    const campo = (
        <input
            id={id}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={mostrarLista}
            aria-controls={idLista}
            aria-activedescendant={mostrarLista && resaltado >= 0 ? idOpcion(resaltado) : undefined}
            aria-label={etiqueta}
            aria-invalid={invalido || undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="next"
            value={valor}
            placeholder={placeholder}
            onChange={(e) => {
                onCambiar(e.target.value);
                setAbierto(e.target.value.trim().length > 0);
                setResaltado(-1);
            }}
            onFocus={() => {
                if (buscado) setAbierto(true);
                onFocus?.();
            }}
            onBlur={() => {
                setAbierto(false);
                setResaltado(-1);
                onBlur?.();
            }}
            onKeyDown={alTeclear}
            className={className}
        />
    );

    return (
        <div className="relative">
            {envoltura ? envoltura(campo) : campo}
            {/* La lista existe siempre (aria-controls apunta a ella); vacía y oculta cuando está cerrada */}
            <ul
                ref={listaRef}
                id={idLista}
                role="listbox"
                aria-label={etiqueta}
                hidden={!mostrarLista}
                className={`absolute w-full mt-2 rounded-2xl border border-simar-borde bg-simar-superficie shadow-[0_16px_32px_-16px_rgba(11,34,54,0.45)] overflow-y-auto overscroll-contain py-1 ${claseLista}`}
            >
                {visibles.map((opcion, i) => (
                    <li
                        key={claveDe(opcion)}
                        id={idOpcion(i)}
                        role="option"
                        aria-selected={i === resaltado}
                        // Sin esto el campo se desenfoca antes del clic y la lista se cierra sin elegir
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => elegir(opcion)}
                        className={`px-4 py-3 cursor-pointer text-lg text-simar-texto ${i === resaltado ? 'bg-simar-marea-suave' : 'hover:bg-simar-papel'}`}
                    >
                        {textoDe(opcion)}
                        {complementoDe?.(opcion)}
                    </li>
                ))}
                {mostrarLista && visibles.length === 0 && (
                    <li role="presentation" className="px-4 py-3 text-base text-simar-texto-2">{sinResultados}</li>
                )}
            </ul>
            {/* Cuántas opciones hay, dicho en voz baja al escribir */}
            <p className="sr-only" aria-live="polite">
                {mostrarLista ? (visibles.length === 1 ? '1 sugerencia' : visibles.length > 1 ? `${visibles.length} sugerencias` : sinResultados) : ''}
            </p>
        </div>
    );
}
