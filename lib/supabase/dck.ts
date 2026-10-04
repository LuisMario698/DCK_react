import { createClient as crearClienteSupabase, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Base de DCK (proyecto "CIAD") en modo de sólo consulta. Ver lib/supabase/baseDatos.ts.
 *
 * - La sesión (auth) sigue siendo la de SiMAR: el superadmin entra con su cuenta de siempre.
 * - Los registros (manifiestos, basurón, personas, embarcaciones…) se leen de la base de DCK.
 * - La llave de CIAD nunca llega al navegador: ahí RLS está apagado y con ella cualquiera podría leer
 *   y cambiar los datos. El navegador le pide los datos a /api/dck (app/api/dck), que comprueba que
 *   sea un superadmin, deja pasar sólo lecturas y pone la llave. El servidor usa dckServidor.ts.
 * - Nada se escribe en la base de DCK y la base no se toca (sin migraciones ni ajustes).
 */

/** Lo que en modo DCK sigue saliendo de SiMAR: la cuenta y la configuración del sistema */
const TABLAS_DE_SIMAR = new Set(['profiles', 'configuracion_sistema']);
const RPC_DE_SIMAR = new Set(['configuracion_publica', 'mi_acceso']);

/** Funciones de la base de DCK que sólo leen (`estadisticas_publicas` no existe ahí: la landing cuenta a mano) */
const RPC_DE_LECTURA = new Set([
    'estadisticas_publicas',
    'get_reporte_detallado',
    'get_dashboard_kpis',
    'get_monthly_waste_stats',
    'get_chart_data',
    'get_top_buques_waste',
]);
/** En Storage, lo que sólo lee aunque vaya por POST (firmar una URL, listar) */
const STORAGE_DE_LECTURA = /^\/storage\/v1\/object\/(sign|list|public|authenticated|info)\//;

/** ¿Este pedido a la base de DCK sólo lee? (`ruta` sin el dominio: /rest/v1/…, /storage/v1/…) */
export function esLecturaDck(metodo: string, ruta: string): boolean {
    const m = metodo.toUpperCase();
    if (ruta.startsWith('/rest/v1/rpc/')) return RPC_DE_LECTURA.has(ruta.slice('/rest/v1/rpc/'.length)) && (m === 'POST' || m === 'GET' || m === 'HEAD');
    if (ruta.startsWith('/rest/v1/')) return m === 'GET' || m === 'HEAD';
    if (ruta.startsWith('/storage/v1/object/')) return m === 'GET' || m === 'HEAD' || STORAGE_DE_LECTURA.test(ruta);
    return false;
}

/** Respuesta con el error de un cambio detenido (la misma forma que los errores de PostgREST) */
export function respuestaSoloConsulta(status = 400) {
    return new Response(
        JSON.stringify({ message: 'La base de DCK es sólo de consulta: no se guardan cambios', code: 'P0001', hint: 'solo_consulta', details: null }),
        { status, headers: { 'Content-Type': 'application/json' } }
    );
}

/**
 * `fetch` que deja pasar sólo lecturas; `alDetener` avisa en pantalla. `prefijo` es lo que va antes
 * de /rest/v1 en la dirección (en el navegador, /api/dck).
 */
export function fetchSoloConsulta(alDetener?: () => void, prefijo = ''): typeof fetch {
    return async (entrada, init) => {
        const pedido = entrada instanceof Request ? entrada : null;
        const url = new URL(pedido ? pedido.url : String(entrada));
        const metodo = init?.method ?? pedido?.method ?? 'GET';
        if (!esLecturaDck(metodo, url.pathname.slice(prefijo.length))) {
            alDetener?.();
            return respuestaSoloConsulta();
        }
        return fetch(entrada, init);
    };
}

/** Opciones de un cliente de la base de DCK: sin sesión propia y sólo para leer */
export function opcionesClienteDck(fetchPropio: typeof fetch) {
    return {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'simar-dck-consulta' },
        global: { fetch: fetchPropio },
    };
}

/**
 * Cliente de la base de DCK para el navegador: habla con /api/dck (no con CIAD), así que no lleva
 * llave; el servidor pone la suya sólo si quien pide es superadmin.
 */
export function crearClienteDckNavegador(alDetener?: () => void): SupabaseClient {
    const base = `${window.location.origin}/api/dck`;
    return crearClienteSupabase(base, 'sin-llave', opcionesClienteDck(fetchSoloConsulta(alDetener, '/api/dck')));
}

/**
 * El cliente que reciben los servicios en modo DCK: igual al de SiMAR (sesión, tiempo real, cuenta y
 * configuración), salvo las tablas, funciones y archivos de los registros, que salen de DCK. Una
 * tabla que DCK no tiene (solicitudes, inventario…) falla en vez de mezclar datos de SiMAR: esas
 * partes se ocultan en modo DCK.
 */
export function conDatosDeDck<T extends object>(simar: T, dck: SupabaseClient): T {
    return new Proxy(simar, {
        get(cliente, prop) {
            const deSimar = cliente as unknown as SupabaseClient;
            if (prop === 'from') return (tabla: string) => (TABLAS_DE_SIMAR.has(tabla) ? deSimar : dck).from(tabla);
            if (prop === 'rpc')
                return (fn: string, args?: Record<string, unknown>, opciones?: Parameters<SupabaseClient['rpc']>[2]) =>
                    (RPC_DE_SIMAR.has(fn) ? deSimar : dck).rpc(fn, args, opciones);
            if (prop === 'storage') return dck.storage;
            if (prop === 'schema') return dck.schema.bind(dck);
            const valor = Reflect.get(cliente, prop, cliente);
            return typeof valor === 'function' ? valor.bind(cliente) : valor;
        },
    });
}
