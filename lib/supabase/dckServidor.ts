import { createClient as crearClienteSupabase, type SupabaseClient } from '@supabase/supabase-js';
import { DCK_URL } from './baseDatos';
import { fetchSoloConsulta, opcionesClienteDck } from './dck';

/**
 * Lo de la base de DCK que sólo existe en el servidor: su llave (`SB_DCK_ANON_KEY`, sin
 * NEXT_PUBLIC_ para que nunca entre al JavaScript del navegador). En CIAD RLS está apagado: con esta
 * llave se puede leer y cambiar todo. **Nunca importes este archivo desde código del navegador.**
 */

const DCK_LLAVE = process.env.SB_DCK_ANON_KEY ?? '';

/** ¿El servidor puede hablar con la base de DCK? (dirección y llave) */
export const DCK_SERVIDOR_DISPONIBLE = Boolean(DCK_URL && DCK_LLAVE);

/** Encabezados con la llave, para reenviar un pedido a CIAD (app/api/dck) */
export function encabezadosDck(): Record<string, string> {
    return { apikey: DCK_LLAVE, Authorization: `Bearer ${DCK_LLAVE}` };
}

/** Cliente de la base de DCK para Server Components: sólo lee */
export function crearClienteDckServidor(): SupabaseClient {
    return crearClienteSupabase(DCK_URL, DCK_LLAVE, opcionesClienteDck(fetchSoloConsulta()));
}
