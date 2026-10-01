'use client';

/**
 * Botón "Reporte del mes" de Estadísticas: se elige un mes (los últimos 12) y se descarga el PDF
 * para SEMARNAT (ver pdfReporteMensual.ts). No depende del período que se esté viendo.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';
import { BotonPrimario, Modal } from '@/components/asociaciones/ui';
import { hoyPuerto } from '@/lib/utils/fechas';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

interface Mes {
    anio: number;
    /** 1 a 12 */
    mes: number;
    clave: string;
}

/** Los últimos 12 meses, del más nuevo (el que va en curso) al más viejo */
function ultimosMeses(): { meses: Mes[]; dia: number } {
    const [a, m, d] = hoyPuerto().split('-').map(Number);
    const meses = Array.from({ length: 12 }, (_, i) => {
        const fecha = new Date(a, m - 1 - i, 1);
        return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, clave: `${fecha.getFullYear()}-${fecha.getMonth() + 1}` };
    });
    return { meses, dia: d };
}

export function ReporteDelMes({ className = '' }: { className?: string }) {
    const [abierto, setAbierto] = useState(false);
    const [meses, setMeses] = useState<Mes[]>([]);
    const [elegido, setElegido] = useState('');
    const [generando, setGenerando] = useState(false);

    const abrir = () => {
        const { meses, dia } = ultimosMeses();
        setMeses(meses);
        // A fin de mes lo normal es reportar el que termina; antes, el mes pasado (ya completo)
        setElegido(meses[dia >= 25 ? 0 : 1].clave);
        setAbierto(true);
    };

    const mes = meses.find((x) => x.clave === elegido);
    const nombre = mes ? `${MESES[mes.mes - 1]} de ${mes.anio}` : '';

    const descargar = async () => {
        if (!mes) return;
        setGenerando(true);
        try {
            const [{ getReporteMensual }, { descargarReporteMensual }] = await Promise.all([import('@/lib/services/reporte_mensual'), import('./pdfReporteMensual')]);
            await descargarReporteMensual(await getReporteMensual(mes.anio, mes.mes));
            toast.success(`Reporte de ${nombre} descargado`);
            setAbierto(false);
        } catch (e) {
            console.error('Error generando el reporte del mes:', e);
            toast.error('No se pudo generar el reporte. Inténtalo de nuevo.');
        } finally {
            setGenerando(false);
        }
    };

    return (
        <>
            <button type="button" onClick={abrir} className={className}>
                <CalendarDays className="w-5 h-5 movil:w-4 movil:h-4" aria-hidden="true" />
                Reporte del mes
            </button>

            {abierto && (
                <Modal
                    titulo="Reporte del mes"
                    subtitulo="Para entregar a SEMARNAT: cada manifiesto, los viajes al basurón y lo que se llevaron las empresas, con renglones para firmar."
                    onClose={() => !generando && setAbierto(false)}
                >
                    <p id="reporte-mes-titulo" className="-mt-1 mb-2.5 text-[17px] font-bold text-simar-texto">
                        ¿De qué mes?
                    </p>
                    <div role="group" aria-labelledby="reporte-mes-titulo" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {meses.map((x, i) => {
                            const activo = x.clave === elegido;
                            return (
                                <button
                                    key={x.clave}
                                    type="button"
                                    onClick={() => setElegido(x.clave)}
                                    aria-pressed={activo}
                                    autoFocus={activo}
                                    className={`simar-presiona min-h-[56px] px-3 py-1.5 rounded-2xl border-2 text-left leading-tight transition-colors ${
                                        activo ? 'border-simar-marea bg-simar-marea text-white' : 'border-simar-campo-borde bg-simar-superficie text-simar-texto hover:border-simar-marea-tinta'
                                    }`}
                                >
                                    <span className="block text-[17px] font-bold first-letter:uppercase">{MESES[x.mes - 1]}</span>{' '}
                                    <span className={`block text-[14px] ${activo ? 'text-white/85' : 'text-simar-texto-2'}`}>{i === 0 ? `${x.anio} · en curso` : x.anio}</span>
                                </button>
                            );
                        })}
                    </div>
                    <BotonPrimario type="button" onClick={descargar} cargando={generando} className="mt-5 w-full">
                        {generando ? 'Generando…' : `Descargar ${MESES[(mes?.mes ?? 1) - 1]} ${mes?.anio ?? ''}`}
                    </BotonPrimario>
                </Modal>
            )}
        </>
    );
}
