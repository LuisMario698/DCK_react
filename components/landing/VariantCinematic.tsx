'use client';

import { type ReactNode } from 'react';
import type { VarianteMapa } from './mapa/puertos';
import type { LandingStats } from '@/lib/services/landing_stats';
import { useAccesoLanding } from './acceso/useAccesoLanding';
import { VidrioVivo } from '@/components/isla/VidrioVivo';
import { EscenaEquipos } from './escena-equipos/EscenaEquipos';
import { IslaActual } from './actual/Isla';
import { Portada } from './actual/Portada';
import { FranjaNoticias } from './actual/FranjaNoticias';
import { UnLitro } from './actual/un-litro/UnLitro';
import { DonFrancisco } from './actual/don-francisco/DonFrancisco';
import { Mapa } from './actual/Mapa';
import { Cierre } from './actual/Cierre';
import { PieActual } from './actual/PieActual';

/**
 * La landing Actual: el cascarón. Aquí sólo vive lo que comparten las secciones (la ventana de
 * acceso y los datos) y el orden en que van; cada sección está en components/landing/actual/, con
 * su propio useScrollReveal y su propio estado.
 */
export function VariantCinematic({
    stats,
    cifrasAl,
    varianteMapa,
    compararMapas = false,
    noticias,
}: {
    stats: LandingStats | null;
    /** «Cifras al…»: fecha y hora del puerto, armada en el servidor (page.tsx) */
    cifrasAl: string;
    varianteMapa: VarianteMapa;
    compararMapas?: boolean;
    /** Las tarjetas de las noticias más recientes, armadas en el servidor (NoticiasPortada) */
    noticias?: ReactNode;
}) {
    // La ventana de "Iniciar sesión" (la misma de la landing nueva). La demostración
    // (supabase/demo/README.md): en su despliegue, los botones de acceso llevan a ella; en
    // producción, si existe, un enlace discreto bajo los botones del inicio
    const { abrirAcceso, abrirAccesoDesarrollador, rutaDemo, ventana } = useAccesoLanding();
    const openLoginModal = () => abrirAcceso();

    return (
        <div className="simar-landing relative min-h-screen w-full overflow-x-clip bg-simar-papel font-sans text-simar-texto antialiased">
            {/* La luz de los botones sigue al cursor y nace donde se presiona (data-vidrio) */}
            <VidrioVivo />
            {/* Navbar — la isla dinámica del portal (components/isla): vidrio líquido; el menú de
                secciones cae como gota de su botón */}
            <IslaActual alAbrirAcceso={openLoginModal} />

            {/* Hero: las fotos del proyecto de fondo y el logo grande al centro */}
            <Portada alAbrirAcceso={openLoginModal} rutaDemo={rutaDemo} />

            {/* Así funciona SiMAR: laptop y celular 3D atados al scroll */}
            <EscenaEquipos />

            {/* Noticias y, al pie, el correo del mes (#correo-del-mes) */}
            {noticias && <FranjaNoticias noticias={noticias} />}

            {/* Por qué importa: un litro de aceite y lo que ya se entregó en el puerto (#impacto) */}
            <UnLitro stats={stats} cifrasAl={cifrasAl} />

            {/* Para él se hizo SiMAR: Don Francisco y la hoja que se vuelve dato */}
            <DonFrancisco totalManifiestos={stats?.totalManifiestos} />

            {/* Dónde: hoy un puerto, mañana los que se sumen */}
            <Mapa varianteMapa={varianteMapa} compararMapas={compararMapas} />

            {/* Hecho en Puerto Peñasco (#proyecto) y los tres caminos (#participa) */}
            <Cierre alAbrirAcceso={abrirAcceso} rutaDemo={rutaDemo} />

            <PieActual alAccesoDesarrollador={abrirAccesoDesarrollador} alAbrirAcceso={abrirAcceso} rutaDemo={rutaDemo} />

            {ventana}
        </div>
    );
}
