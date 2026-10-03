import { esVistaDemo, type VistaDemo } from './config';

/**
 * En qué paso va el recorrido de la demostración. Vive en sessionStorage: sigue al recargar o al
 * cambiar de pantalla, y se olvida al cerrar la pestaña.
 */
export interface EstadoRecorrido {
    vista: VistaDemo;
    /** 0 = bienvenida; 1…N = pasos; N + 1 = final */
    paso: number;
}

const CLAVE = 'simar-recorrido';
/** Lo escucha <Recorrido> para abrirse sin recargar ("Repetir recorrido") */
export const EVENTO_RECORRIDO = 'simar-recorrido';

export function leerRecorrido(): EstadoRecorrido | null {
    try {
        const valor = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
        return valor && esVistaDemo(valor.vista) && Number.isInteger(valor.paso) ? valor : null;
    } catch {
        return null;
    }
}

export function guardarRecorrido(estado: EstadoRecorrido | null) {
    try {
        if (estado) sessionStorage.setItem(CLAVE, JSON.stringify(estado));
        else sessionStorage.removeItem(CLAVE);
    } catch {
        // Sin almacenamiento (ventana privada estricta): el recorrido sólo dura en esta pantalla
    }
}

/** Abre el recorrido desde el principio (al entrar a la demo o con "Repetir recorrido") */
export function iniciarRecorrido(vista: VistaDemo) {
    guardarRecorrido({ vista, paso: 0 });
    window.dispatchEvent(new Event(EVENTO_RECORRIDO));
}
