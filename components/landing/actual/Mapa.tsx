import { SeccionMapaPuertos } from '../mapa/SeccionMapaPuertos';
import type { VarianteMapa } from '../mapa/puertos';
import { OlaSeparador } from '../OlaSeparador';
import '../mapa/mapa.css';

/**
 * «Dónde» (#mapa): hoy, un puerto; mañana, los que se sumen. Franja oscura que viene del
 * papel de Don Francisco (ola arriba) y termina lisa: el Cierre pone su propia ola abismo.
 */
export function Mapa({ varianteMapa, compararMapas }: { varianteMapa: VarianteMapa; compararMapas: boolean }) {
    return (
        <section
            id="mapa"
            aria-labelledby="mp-titulo"
            className="mp relative bg-simar-abismo text-white overflow-clip pt-28 pb-24 px-6 md:pt-36 md:pb-32 movil:pt-20 movil:pb-16 movil:px-4"
        >
            <OlaSeparador color="var(--simar-papel)" lado="arriba" />
            {/* Resplandor suave detrás del mapa: da profundidad sin cortar la franja */}
            <div aria-hidden="true" className="mp-resplandor pointer-events-none absolute inset-0" />

            <div className="relative max-w-[1248px] mx-auto">
                <header className="max-w-3xl mb-12 movil:mb-4">
                    <p className="mp-entra text-[15px] font-extrabold uppercase tracking-[0.14em] text-simar-espuma">Dónde</p>
                    <h2
                        id="mp-titulo"
                        className="mp-entra mp-d1 mt-4 font-titular text-[clamp(38px,4.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.024em] text-balance movil:mt-3 movil:text-[34px]"
                    >
                        Hoy, un puerto. <span className="text-white/60">Mañana, los que se sumen.</span>
                    </h2>
                </header>

                <SeccionMapaPuertos variante={varianteMapa} mostrarSelector={compararMapas} />
            </div>
        </section>
    );
}
