import { notFound } from 'next/navigation';

/**
 * Cualquier dirección que no existe dentro de /es o /en cae aquí y muestra la página 404
 * de SiMAR (app/[locale]/not-found.tsx) con su layout completo. Sin esta ruta, Next usaba
 * el layout raíz (que no dibuja <html>) y salía el error "Missing <html> and <body> tags".
 */
export default function RutaInexistente() {
    notFound();
}
