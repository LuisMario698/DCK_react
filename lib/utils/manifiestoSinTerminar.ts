/**
 * Manifiesto sin terminar: lo que se lleva capturado en la pantalla Manifiesto se guarda solo en
 * este equipo (localStorage) mientras se escribe, para no perderlo si el teléfono se bloquea, se
 * cierra la pestaña o se va la señal a media captura (con las firmas ya puestas).
 *
 * - Es por usuario: en el recinto a veces se comparte el equipo.
 * - Se borra al guardar el manifiesto o al elegir "Empezar de nuevo"; caduca a los 7 días.
 * - El archivo adjunto no se guarda (un archivo no cabe en localStorage): sólo su nombre, para
 *   pedir que se adjunte otra vez.
 * - No confundir con "Descargar borrador" de la misma pantalla (el PDF para firmar a mano).
 */

const VERSION = 1;
const CADUCA_MS = 7 * 24 * 60 * 60 * 1000;
/** Avisa a esta misma pestaña (el evento `storage` sólo llega a las demás) */
const EVENTO = 'simar-manifiesto-sin-terminar';

export interface DatosSinTerminar {
    formData: {
        numero_manifiesto: string;
        fecha_emision: string;
        buque_id: string;
        responsable_principal_id: string;
        responsable_secundario_id: string;
        responsable_liquidos_id: string;
        observaciones: string;
    };
    residuos: { aceite_usado: number; filtros_aceite: number; filtros_diesel: number; filtros_aire: number; basura: number };
    nombres: { buque: string; motorista: string; cocinero: string; liquidos: string };
    /** Imágenes de las firmas (data URL PNG) */
    firmas: { motorista: string | null; cocinero: string | null; oficial: string | null; liquidos: string | null };
    /** Nombre del archivo que se había adjuntado (el archivo en sí no se guarda) */
    archivo: string | null;
}

export interface ManifiestoSinTerminar extends DatosSinTerminar {
    version: typeof VERSION;
    /** Date.now() de la última vez que se guardó */
    guardadoEn: number;
}

const clave = (usuarioId: string) => `simar-manifiesto-sin-terminar:${usuarioId}`;

/** ¿Hay algo que valga la pena guardar? La fecha sola no cuenta (se llena sola con la de hoy) */
export function tieneContenido(d: DatosSinTerminar): boolean {
    return Boolean(
        d.formData.buque_id ||
            d.formData.observaciones.trim() ||
            Object.values(d.nombres).some((n) => n.trim()) ||
            Object.values(d.residuos).some((v) => Number(v) > 0) ||
            Object.values(d.firmas).some(Boolean) ||
            d.archivo
    );
}

/** El texto tal cual está guardado (para `useSyncExternalStore`: un texto se compara por valor) */
export function leerTextoSinTerminar(usuarioId: string): string | null {
    try {
        return localStorage.getItem(clave(usuarioId));
    } catch {
        return null; // navegación privada o almacenamiento bloqueado
    }
}

/** Interpreta el texto guardado; null si no hay, es de otra versión, está dañado o ya caducó */
export function interpretarSinTerminar(texto: string | null): ManifiestoSinTerminar | null {
    if (!texto) return null;
    try {
        const m = JSON.parse(texto) as ManifiestoSinTerminar;
        if (m?.version !== VERSION || typeof m.guardadoEn !== 'number' || Date.now() - m.guardadoEn > CADUCA_MS) return null;
        return m;
    } catch {
        return null;
    }
}

/** El manifiesto sin terminar de este usuario, si hay. Si caducó o está dañado, lo borra */
export function leerSinTerminar(usuarioId: string): ManifiestoSinTerminar | null {
    const texto = leerTextoSinTerminar(usuarioId);
    const m = interpretarSinTerminar(texto);
    if (texto && !m) borrarSinTerminar(usuarioId);
    return m;
}

/** Guarda lo capturado. false si no se pudo (almacenamiento lleno o bloqueado) */
export function guardarSinTerminar(usuarioId: string, datos: DatosSinTerminar): boolean {
    try {
        const m: ManifiestoSinTerminar = { version: VERSION, guardadoEn: Date.now(), ...datos };
        localStorage.setItem(clave(usuarioId), JSON.stringify(m));
        window.dispatchEvent(new Event(EVENTO));
        return true;
    } catch {
        return false;
    }
}

export function borrarSinTerminar(usuarioId: string) {
    try {
        localStorage.removeItem(clave(usuarioId));
        window.dispatchEvent(new Event(EVENTO));
    } catch {
        // Sin almacenamiento no hay nada que borrar
    }
}

/** Avisa cuando cambia (en esta pestaña o en otra). Devuelve la función para dejar de escuchar */
export function suscribirSinTerminar(avisar: () => void) {
    window.addEventListener(EVENTO, avisar);
    window.addEventListener('storage', avisar);
    return () => {
        window.removeEventListener(EVENTO, avisar);
        window.removeEventListener('storage', avisar);
    };
}

/** "Don Chuy II · 2 firmas" */
export function describirSinTerminar(m: DatosSinTerminar): string {
    const barco = m.nombres.buque.trim() || 'Sin barco todavía';
    const firmas = Object.values(m.firmas).filter(Boolean).length;
    return firmas ? `${barco} · ${firmas} ${firmas === 1 ? 'firma' : 'firmas'}` : barco;
}
