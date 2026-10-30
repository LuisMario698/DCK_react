/**
 * Vista previa de PDF en la demostración: se muestran las páginas como imagen, sin descargar ni
 * imprimir. La pide el recorrido ("Ver cómo queda el PDF") y, en modo demostración, cualquier PDF que
 * la app iba a descargar (components/demo/VistaPreviaPdf.tsx los intercepta).
 */

export const EVENTO_VISTA_PREVIA = 'simar-demo-vista-previa';

export interface PedidoVistaPrevia {
    titulo: string;
    /** El PDF, o cómo generarlo (mientras tanto la ventana dice "Preparando…") */
    obtener: () => Promise<Blob>;
}

export function abrirVistaPrevia(titulo: string, pdf: Blob | (() => Promise<Blob>)) {
    const detail: PedidoVistaPrevia = { titulo, obtener: typeof pdf === 'function' ? pdf : () => Promise.resolve(pdf) };
    window.dispatchEvent(new CustomEvent<PedidoVistaPrevia>(EVENTO_VISTA_PREVIA, { detail }));
}

/** El título de la ventana según el archivo que la app iba a descargar ("SiMAR_reporte_2026-09.pdf" → "Reporte de septiembre 2026") */
export function tituloDeArchivo(nombre: string) {
    const reporte = /^SiMAR_reporte_(\d{4})-(\d{2})/i.exec(nombre);
    if (reporte) {
        const mes = new Date(Number(reporte[1]), Number(reporte[2]) - 1, 1).toLocaleDateString('es-MX', { month: 'long' });
        return `Reporte de ${mes} ${reporte[1]}`;
    }
    const constancia = /^SiMAR_constancia_.*_(\d{4})\.pdf$/i.exec(nombre);
    if (constancia) return `Constancia anual ${constancia[1]}`;
    if (/^SiMAR_estadisticas/i.test(nombre)) return 'Resumen de estadísticas';
    if (/^BORRADOR_Manifiesto/i.test(nombre)) return 'Borrador del manifiesto';
    if (/^Manifiesto_Basuron/i.test(nombre)) return 'Recibo del basurón';
    const limpio = nombre.replace(/\.pdf$/i, '').replace(/_+/g, ' ').trim();
    return limpio ? limpio[0].toUpperCase() + limpio.slice(1) : 'Documento';
}
