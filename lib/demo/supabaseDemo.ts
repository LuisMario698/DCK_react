import { avisarCambioBloqueado } from './avisos';

/**
 * `fetch` del cliente de Supabase en la demostración: las escrituras se detienen aquí, antes de salir,
 * con un aviso amable. Es la primera llave; la segunda está en la base de la demo
 * (supabase/demo/30_candado.sql), por si alguien llama a la API a mano.
 */

// Se llaman solas al abrir avisos y mensajes: se responden "hecho", sin aviso
const RPC_CALLADAS = new Set(['marcar_notificaciones_leidas', 'marcar_mensajes_leidos']);
// Las RPC que escriben (las demás sólo leen: mi_acceso, estadisticas_publicas, sa_listar_usuarios…)
const RPC_QUE_ESCRIBEN =
    /^(crear|aprobar|rechazar|cancelar|completar)_solicitud$|^actualizar_mi_asociacion$|^invitar_usuario$|^revocar_acceso$|^registrar_bitacora|^sa_(?!listar_usuarios$|metricas$)/;
// En Storage, lo que sólo lee aunque vaya por POST
const STORAGE_LECTURA = /^\/storage\/v1\/object\/(sign|list|public|authenticated|info)\//;

function detenida() {
    avisarCambioBloqueado();
    return new Response(
        JSON.stringify({ message: 'En la demostración no se guardan cambios', code: 'P0001', hint: 'modo_demo', details: null }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
}

export const fetchDemo: typeof fetch = async (entrada, init) => {
    const pedido = entrada instanceof Request ? entrada : null;
    const url = new URL(pedido ? pedido.url : String(entrada));
    const metodo = (init?.method ?? pedido?.method ?? 'GET').toUpperCase();
    const lee = metodo === 'GET' || metodo === 'HEAD';
    const ruta = url.pathname;

    if (ruta.startsWith('/rest/v1/rpc/')) {
        const funcion = ruta.slice('/rest/v1/rpc/'.length);
        if (RPC_CALLADAS.has(funcion)) return new Response(null, { status: 204 });
        if (RPC_QUE_ESCRIBEN.test(funcion)) return detenida();
    } else if (ruta.startsWith('/rest/v1/') && !lee) {
        return detenida();
    } else if (ruta.startsWith('/storage/v1/object') && !lee && !STORAGE_LECTURA.test(ruta)) {
        return detenida();
    } else if (ruta === '/auth/v1/user' && metodo === 'PUT') {
        // Cambiar la contraseña o el correo de una cuenta que comparten todos los visitantes
        return detenida();
    } else if (ruta === '/auth/v1/logout' && url.searchParams.get('scope') !== 'local') {
        // Cerrar sesión "en todos lados" sacaría a todos los que usan la misma cuenta de la demo
        url.searchParams.set('scope', 'local');
        return fetch(url, { ...init, method: metodo, headers: init?.headers ?? pedido?.headers });
    }

    const respuesta = await fetch(entrada, init);
    // Si algo se escapó y lo detuvo la base, el aviso es el mismo
    if (respuesta.status === 400) {
        respuesta
            .clone()
            .json()
            .then((cuerpo) => cuerpo?.hint === 'modo_demo' && avisarCambioBloqueado())
            .catch(() => {});
    }
    return respuesta;
};
