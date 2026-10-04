import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DCK_URL } from '@/lib/supabase/baseDatos';
import { esLecturaDck, respuestaSoloConsulta } from '@/lib/supabase/dck';
import { DCK_SERVIDOR_DISPONIBLE, encabezadosDck } from '@/lib/supabase/dckServidor';

/**
 * Intermediario de la base de DCK (proyecto "CIAD") para el navegador, en modo de sólo consulta.
 * Es la única ruta API de SiMAR, y existe por una razón: en CIAD RLS está apagado y su llave da
 * acceso a todo, así que no puede ir al navegador. Aquí:
 *   1. sólo pasan lecturas (las mismas que deja lib/supabase/dck.ts);
 *   2. sólo para un superadmin con sesión en SiMAR (la base de DCK es cosa suya);
 *   3. la llave se pone en el servidor y la respuesta regresa tal cual.
 * Ver lib/supabase/baseDatos.ts.
 */

export const dynamic = 'force-dynamic';

/** Encabezados del pedido que entiende PostgREST / Storage (los demás no se reenvían) */
const PASAN_AL_IR = ['accept', 'accept-profile', 'content-profile', 'content-type', 'prefer', 'range', 'range-unit'];
/** Encabezados de la respuesta que necesita supabase-js (conteos, tipo, rangos) */
const PASAN_AL_VOLVER = ['content-type', 'content-range', 'preference-applied', 'content-disposition', 'cache-control', 'etag', 'last-modified'];

const sinPermiso = (status: number, message: string) =>
    Response.json({ message, code: String(status), hint: null, details: null }, { status });

async function esSuperadmin() {
    const supabase = await createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.rpc('mi_acceso');
    const acceso = data as { es_superadmin?: boolean; suspendida?: boolean } | null;
    return Boolean(acceso?.es_superadmin && !acceso.suspendida);
}

async function reenviar(pedido: NextRequest, { params }: { params: Promise<{ ruta: string[] }> }) {
    if (!DCK_SERVIDOR_DISPONIBLE) return sinPermiso(404, 'La base de DCK no está configurada');
    const ruta = `/${(await params).ruta.map(encodeURIComponent).join('/')}`;
    if (!esLecturaDck(pedido.method, ruta)) return respuestaSoloConsulta(403);
    if (!(await esSuperadmin())) return sinPermiso(401, 'Sólo un superadmin puede consultar la base de DCK');

    const destino = new URL(`${DCK_URL}${ruta}`);
    destino.search = pedido.nextUrl.search;
    const encabezados = new Headers(encabezadosDck());
    for (const nombre of PASAN_AL_IR) {
        const valor = pedido.headers.get(nombre);
        if (valor) encabezados.set(nombre, valor);
    }
    const respuesta = await fetch(destino, {
        method: pedido.method,
        headers: encabezados,
        body: pedido.method === 'POST' ? await pedido.text() : undefined,
        cache: 'no-store',
    });

    const vuelta = new Headers();
    for (const nombre of PASAN_AL_VOLVER) {
        const valor = respuesta.headers.get(nombre);
        if (valor) vuelta.set(nombre, valor);
    }
    return new Response(pedido.method === 'HEAD' ? null : respuesta.body, { status: respuesta.status, headers: vuelta });
}

export { reenviar as GET, reenviar as HEAD, reenviar as POST };
