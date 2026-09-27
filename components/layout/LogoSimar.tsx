import Image from 'next/image';
import simbolo from '@/public/assets/simar/simbolo.png';
import nombreClaro from '@/public/assets/simar/nombre-claro.png';
import nombreOscuro from '@/public/assets/simar/nombre-oscuro.png';

/**
 * Logo de SiMAR del lenguaje de diseño (ver DISEÑO_SIMAR.md).
 * - variante "horizontal": símbolo + nombre (menús, encabezados).
 * - variante "simbolo": sólo la ola con flechas (menú colapsado, ventanas).
 * - variante "nombre": sólo la palabra SiMAR con su línea de marea.
 * El nombre cambia solo entre modo claro y oscuro (dos imágenes, se oculta una con CSS).
 * `tono="oscuro"` fuerza la versión para fondos oscuros (p. ej. bandas azul Abismo).
 */
export function LogoSimar({
    variante = 'horizontal',
    tamano = 50,
    tono = 'auto',
    className = '',
}: {
    variante?: 'horizontal' | 'simbolo' | 'nombre';
    tamano?: number;
    tono?: 'auto' | 'claro' | 'oscuro';
    className?: string;
}) {
    const alturaNombre = Math.round(tamano * 0.52);
    const anchoNombre = Math.round((alturaNombre * nombreClaro.width) / nombreClaro.height);
    // Si quien lo usa decide cuándo se ve (hidden, lg:inline-flex…), no se agrega inline-flex:
    // las dos clases chocaban y en celular con el menú colapsado salían dos logos.
    const decideVisibilidad = /(^|\s)(hidden|flex|inline-flex|block)(\s|$)/.test(className);

    return (
        <span className={`${decideVisibilidad ? '' : 'inline-flex'} items-center gap-2.5 ${className}`}>
            {variante !== 'nombre' && (
                <Image
                    src={simbolo}
                    alt={variante === 'simbolo' ? 'SiMAR' : ''}
                    width={tamano}
                    height={tamano}
                    className="object-contain flex-shrink-0"
                    priority
                />
            )}
            {variante !== 'simbolo' && (
                <>
                    {tono !== 'oscuro' && (
                        <Image
                            src={nombreClaro}
                            alt="SiMAR"
                            width={anchoNombre}
                            height={alturaNombre}
                            className={tono === 'auto' ? 'dark:hidden' : ''}
                            priority
                        />
                    )}
                    {tono !== 'claro' && (
                        <Image
                            src={nombreOscuro}
                            alt="SiMAR"
                            width={anchoNombre}
                            height={alturaNombre}
                            className={tono === 'auto' ? 'hidden dark:block' : ''}
                            priority
                        />
                    )}
                </>
            )}
        </span>
    );
}
