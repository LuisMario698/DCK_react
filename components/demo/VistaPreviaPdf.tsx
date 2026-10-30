'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, FileText, Loader2, X } from 'lucide-react';
import { usePresencia } from '@/components/ui/movimiento';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { EVENTO_VISTA_PREVIA, abrirVistaPrevia, tituloDeArchivo, type PedidoVistaPrevia } from '@/lib/demo/vistaPrevia';

/**
 * Vista previa de PDF de la demostración: las páginas se dibujan como imagen (pdf.js) y se ven en una
 * ventana, sin descargar ni imprimir. En celular sube como hoja (como todas las ventanas). La monta el
 * layout de cada área sólo en modo demostración; al montarse, los PDF que la app iba a descargar
 * (doc.save() de jsPDF, enlaces de descarga, abrir en otra pestaña) se abren aquí.
 *
 * pdf.js se carga del CDN (versión "legacy", para teléfonos no tan nuevos) sólo la primera vez que se
 * pide una vista previa: no es dependencia del proyecto ni pesa en producción.
 */

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.min.mjs';
const PDFJS_TRABAJADOR = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs';

// Lo poco de pdf.js que se usa
interface PaginaPdf {
    getViewport: (o: { scale: number }) => { width: number; height: number };
    render: (o: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}
interface DocumentoPdf {
    numPages: number;
    getPage: (n: number) => Promise<PaginaPdf>;
    destroy: () => Promise<void>;
}
interface PdfJs {
    getDocument: (o: { data: Uint8Array }) => { promise: Promise<DocumentoPdf> };
    GlobalWorkerOptions: { workerSrc: string };
}

let pdfjs: Promise<PdfJs> | null = null;
function cargarPdfJs(): Promise<PdfJs> {
    if (!pdfjs) {
        const url = PDFJS;
        pdfjs = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url).then((m: PdfJs) => {
            m.GlobalWorkerOptions.workerSrc = PDFJS_TRABAJADOR;
            return m;
        });
        // Si falló (sin internet), la próxima vez se intenta de nuevo
        pdfjs.catch(() => {
            pdfjs = null;
        });
    }
    return pdfjs;
}

/** Cada página del PDF como imagen, nítida en pantallas de alta densidad */
async function paginasComoImagen(pdf: Blob): Promise<string[]> {
    const lib = await cargarPdfJs();
    const documento = await lib.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) }).promise;
    const escala = Math.min(2.5, Math.max(1.5, (window.devicePixelRatio || 1) * 1.25));
    const paginas: string[] = [];
    for (let n = 1; n <= documento.numPages; n++) {
        const pagina = await documento.getPage(n);
        const viewport = pagina.getViewport({ scale: escala });
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.ceil(viewport.width);
        lienzo.height = Math.ceil(viewport.height);
        const ctx = lienzo.getContext('2d');
        if (!ctx) continue;
        await pagina.render({ canvasContext: ctx, viewport }).promise;
        paginas.push(lienzo.toDataURL('image/png'));
    }
    await documento.destroy();
    return paginas;
}

/** En la demo, lo que la app iba a descargar o abrir como PDF se ve aquí. Una sola vez por página */
let interceptado = false;
function interceptarPdfs() {
    if (interceptado) return;
    interceptado = true;

    // Enlaces de descarga de un PDF: los de las pantallas (manifiesto, borrador, basurón) usan
    // .click(), y doc.save() de jsPDF (Estadísticas, reporte del mes, constancia anual…) hace lo mismo
    // con dispatchEvent. Así no hay que bajar jsPDF al abrir cada pantalla para cambiarle el save()
    const esDescargaPdf = (a: HTMLAnchorElement) => !!a.download && /\.pdf$/i.test(a.download) && /^(blob|data):/.test(a.href);
    const mostrar = (a: HTMLAnchorElement) => {
        const pdf = fetch(a.href).then((r) => r.blob());
        abrirVistaPrevia(tituloDeArchivo(a.download), () => pdf);
    };
    const clicOriginal = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        if (esDescargaPdf(this)) return mostrar(this);
        return clicOriginal.call(this);
    };
    const despacharOriginal = HTMLAnchorElement.prototype.dispatchEvent;
    HTMLAnchorElement.prototype.dispatchEvent = function (this: HTMLAnchorElement, evento: Event) {
        if (evento.type === 'click' && esDescargaPdf(this)) {
            mostrar(this);
            return false;
        }
        return despacharOriginal.call(this, evento);
    };

    // Abrir un PDF recién hecho en otra pestaña
    const abrirOriginal = window.open;
    window.open = function (url?: string | URL, ...resto: [string?, string?]) {
        const direccion = url?.toString() ?? '';
        if (direccion.startsWith('blob:')) {
            const pdf = fetch(direccion).then((r) => r.blob());
            abrirVistaPrevia('Documento', () => pdf);
            return null;
        }
        return abrirOriginal.call(window, url, ...resto);
    } as typeof window.open;

    // Las pantallas liberan el PDF justo después del clic: que siga existiendo mientras se lee
    const liberarOriginal = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (direccion: string) => {
        setTimeout(() => liberarOriginal(direccion), 60_000);
    };
}

type Estado = 'preparando' | 'lista' | 'error';

export function VistaPreviaPdf() {
    const [abierto, setAbierto] = useState(false);
    // Se queda con el último documento mientras la ventana hace su salida
    const [titulo, setTitulo] = useState('');
    const [estado, setEstado] = useState<Estado>('preparando');
    const [paginas, setPaginas] = useState<string[]>([]);
    const { montado, saliendo } = usePresencia(abierto, 200);
    const panelRef = useRef<HTMLDivElement>(null);
    const cerrar = useCallback(() => setAbierto(false), []);
    useVentanaAccesible(panelRef, abierto, { alEscape: cerrar });

    useEffect(() => {
        interceptarPdfs();
        let turno = 0;
        const alPedir = (e: Event) => {
            const { titulo: t, obtener } = (e as CustomEvent<PedidoVistaPrevia>).detail;
            const mio = ++turno;
            setTitulo(t);
            setEstado('preparando');
            setPaginas([]);
            setAbierto(true);
            obtener()
                .then(paginasComoImagen)
                .then((p) => {
                    if (mio !== turno) return;
                    setPaginas(p);
                    setEstado('lista');
                })
                .catch((causa) => {
                    console.error('No se pudo mostrar la vista previa:', causa);
                    if (mio === turno) setEstado('error');
                });
        };
        window.addEventListener(EVENTO_VISTA_PREVIA, alPedir);
        return () => window.removeEventListener(EVENTO_VISTA_PREVIA, alPedir);
    }, []);

    if (!montado) return null;

    return createPortal(
        // simar-compacto: en celular la ventana sube como hoja, como todas
        <div className="simar-compacto">
            <div
                className={`${saliendo ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 z-[70] bg-[rgba(11,34,54,0.55)] flex items-center justify-center p-4`}
                onClick={cerrar}
            >
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="vista-previa-titulo"
                    tabIndex={-1}
                    onClick={(e) => e.stopPropagation()}
                    className={`${saliendo ? 'simar-ventana-sale' : 'simar-ventana'} outline-none w-full max-w-[760px] max-h-[92vh] flex flex-col bg-simar-superficie rounded-[28px] shadow-2xl overflow-hidden`}
                >
                    <div className="flex items-center gap-3.5 px-6 py-4 border-b border-simar-borde-suave movil:px-4 movil:py-3 movil:gap-3">
                        <span className="w-12 h-12 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center movil:w-10 movil:h-10">
                            <FileText className="w-6 h-6 movil:w-5 movil:h-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <h2 id="vista-previa-titulo" className="text-[20px] font-extrabold leading-tight text-simar-texto truncate movil:text-[17px]">
                                {titulo}
                            </h2>
                            <p className="text-[15px] text-simar-texto-2 movil:text-[15px]">Vista previa · en la demostración no se descarga</p>
                        </div>
                        <button
                            type="button"
                            onClick={cerrar}
                            aria-label="Cerrar"
                            className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto flex items-center justify-center transition-colors movil:w-11 movil:h-11"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-simar-papel p-5 md:p-6 movil:p-3">
                        {estado === 'preparando' && (
                            <div className="min-h-[280px] flex flex-col items-center justify-center gap-3 text-simar-texto-2">
                                <Loader2 className="w-8 h-8 animate-spin text-simar-marea-tinta" />
                                <p className="text-[17px] font-bold">Preparando el documento…</p>
                            </div>
                        )}
                        {estado === 'error' && (
                            <div className="min-h-[220px] flex flex-col items-center justify-center gap-3 text-center px-6">
                                <span className="w-14 h-14 rounded-full bg-simar-coral-suave text-simar-coral flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7" />
                                </span>
                                <p className="text-[17px] font-bold text-simar-texto">No pudimos mostrar el documento</p>
                                <p className="text-[15px] text-simar-texto-2">Revisa tu conexión a internet e inténtalo de nuevo.</p>
                            </div>
                        )}
                        {estado === 'lista' && (
                            // Sólo para ver: sin menú de "guardar imagen" ni arrastrar
                            <div className="space-y-4 select-none movil:space-y-3" onContextMenu={(e) => e.preventDefault()}>
                                {paginas.map((src, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element -- imagen generada en el navegador (data URL)
                                    <img
                                        key={i}
                                        src={src}
                                        alt={`${titulo}, página ${i + 1} de ${paginas.length}`}
                                        draggable={false}
                                        className="simar-aparece w-full h-auto rounded-xl bg-white border border-simar-borde shadow-simar pointer-events-none"
                                        style={{ animationDelay: `${i * 0.06}s` }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
