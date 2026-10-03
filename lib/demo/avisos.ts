import { toast } from 'sonner';

const ID_AVISO = 'modo-demo';
// Cuándo se detuvo el último cambio: el error que la pantalla muestre enseguida ("No se pudo guardar…")
// ya lo explica el aviso de la demo
let ultimoBloqueo = 0;

/** Aviso amable cuando alguien intenta guardar algo en la demostración (uno solo aunque sean varios intentos) */
export function avisarCambioBloqueado() {
    ultimoBloqueo = Date.now();
    toast.info('En la demostración no se guardan cambios', {
        id: ID_AVISO,
        description: 'Puedes probar todo con calma. En SiMAR, cada registro se guarda al momento.',
        duration: 6000,
    });
}

/**
 * Las pantallas, al fallar un guardado, dicen "No se pudo guardar… revisa tu conexión": en la demo
 * eso asusta y no es cierto. Los errores que llegan justo después de un cambio detenido se callan
 * (el aviso de la demo ya está en pantalla); los demás salen como siempre.
 */
export function callarErroresDeLaDemo() {
    const t = toast as typeof toast & { __modoDemo?: boolean };
    if (t.__modoDemo) return;
    t.__modoDemo = true;
    const original = toast.error;
    t.error = ((mensaje, datos) =>
        Date.now() - ultimoBloqueo < 4000 ? ID_AVISO : original(mensaje, datos)) as typeof toast.error;
}
