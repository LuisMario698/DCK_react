import type { MetadataRoute } from 'next';

/**
 * Manifiesto de la app web (PWA): se sirve en /manifest.webmanifest y Next lo enlaza solo.
 * Con él, SiMAR se puede instalar en la pantalla de inicio (Chrome: "Instalar app";
 * Safari: Compartir → "Agregar a inicio") y, abierta desde su ícono, se ve sin la barra del
 * navegador (display: standalone). En una pestaña normal del navegador ninguna página puede
 * quitar esa barra.
 * El middleware no toca esta ruta (lleva punto), así que no se le antepone /es.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'SiMAR — Sistema Integral de Manejo Ambiental de Residuos',
        short_name: 'SiMAR',
        description:
            'Gestión digital de manifiestos de residuos de embarcaciones pesqueras en Puerto Peñasco, Sonora. Formato MARPOL Anexo V.',
        lang: 'es-MX',
        start_url: '/es',
        scope: '/',
        display: 'standalone',
        // Pantalla de arranque en Android: abismo, como el hero de la landing donde abre
        background_color: '#0B2236',
        // La etiqueta <meta name="theme-color"> de cada página (papel / abismo) manda sobre ésta
        theme_color: '#E9E4D9',
        icons: [
            { src: '/icons/simar-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/simar-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/simar-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
