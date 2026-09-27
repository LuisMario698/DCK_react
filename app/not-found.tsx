/**
 * 404 fuera de /es y /en (por ejemplo, un idioma que no existe). El layout raíz (app/layout.tsx)
 * sólo devuelve children, así que esta página pone su propio <html> y <body>; sin ellos Next
 * muestra el error "Missing <html> and <body> tags in the root layout".
 * La 404 normal, con el diseño completo, es app/[locale]/not-found.tsx.
 */
import Link from 'next/link';

export default function NoEncontradaRaiz() {
    return (
        <html lang="es">
            <body className="simar min-h-screen flex items-center justify-center p-6 bg-simar-papel text-simar-texto font-sans antialiased">
                <main className="w-full max-w-md text-center bg-simar-superficie border border-simar-borde shadow-simar rounded-[30px] p-8">
                    <p className="text-lg font-bold text-simar-marea-tinta">Error 404</p>
                    <h1 className="mt-1 text-[30px] font-extrabold leading-tight">No encontramos esta página</h1>
                    <p className="mt-3 text-lg text-simar-texto-2">Revisa el enlace o vuelve al inicio.</p>
                    <Link
                        href="/es"
                        className="mt-6 inline-flex min-h-[60px] px-7 items-center justify-center rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[19px] font-extrabold transition-colors"
                    >
                        Volver al inicio
                    </Link>
                </main>
            </body>
        </html>
    );
}
