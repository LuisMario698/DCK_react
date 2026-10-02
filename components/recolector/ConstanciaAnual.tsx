'use client';

/**
 * Botón "Constancia del año" del Historial del portal: se elige el año (los que tienen recolecciones)
 * y se descarga el PDF (ver pdfConstancia.ts). Los datos son los del Historial: no hay otra consulta.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Award } from 'lucide-react';
import type { Recoleccion } from '@/types/database';
import { BotonPrimario, Modal } from '@/components/asociaciones/ui';
import { useRecolector } from './RecolectorContext';

export function ConstanciaAnual({ historial, className = '' }: { historial: Recoleccion[]; className?: string }) {
    const { asociacion } = useRecolector();
    const [abierto, setAbierto] = useState(false);
    const [anio, setAnio] = useState<number | null>(null);
    const [generando, setGenerando] = useState(false);

    // Los años con recolecciones, del más nuevo al más viejo
    const anios = [...new Set(historial.map((r) => Number(r.fecha.slice(0, 4))))].sort((a, b) => b - a);
    const elegido = anio ?? anios[0];
    const cuantas = (a: number) => historial.filter((r) => r.fecha.startsWith(`${a}-`)).length;

    const descargar = async () => {
        if (!asociacion || !elegido) return;
        setGenerando(true);
        try {
            const { descargarConstancia } = await import('./pdfConstancia');
            await descargarConstancia(asociacion, historial, elegido);
            toast.success(`Constancia de ${elegido} descargada`);
            setAbierto(false);
        } catch (e) {
            console.error('Error generando la constancia:', e);
            toast.error('No se pudo generar la constancia. Inténtalo de nuevo.');
        } finally {
            setGenerando(false);
        }
    };

    return (
        <>
            <button type="button" onClick={() => setAbierto(true)} disabled={anios.length === 0} className={className}>
                <Award className="w-[22px] h-[22px] movil:w-[18px] movil:h-[18px]" />
                <span className="movil:hidden">Constancia del año (PDF)</span>
                <span className="hidden movil:inline">Constancia</span>
            </button>

            {abierto && (
                <Modal
                    titulo="Constancia del año"
                    subtitulo="Un PDF con todo lo que tu empresa recolectó en el año, con los folios de cada recolección y renglones para firmar."
                    onClose={() => !generando && setAbierto(false)}
                >
                    <p id="constancia-anio" className="-mt-1 mb-2.5 text-[17px] font-bold text-simar-texto">
                        ¿De qué año?
                    </p>
                    <div role="group" aria-labelledby="constancia-anio" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {anios.map((a) => {
                            const activo = a === elegido;
                            const n = cuantas(a);
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setAnio(a)}
                                    aria-pressed={activo}
                                    autoFocus={activo}
                                    className={`simar-presiona min-h-[56px] px-3 py-1.5 rounded-2xl border-2 text-left leading-tight transition-colors ${
                                        activo ? 'border-simar-marea bg-simar-marea text-white' : 'border-simar-campo-borde bg-simar-superficie text-simar-texto hover:border-simar-marea-tinta'
                                    }`}
                                >
                                    <span className="block text-[17px] font-bold">{a}</span>{' '}
                                    <span className={`block text-[14px] ${activo ? 'text-white/85' : 'text-simar-texto-2'}`}>
                                        {n} {n === 1 ? 'recolección' : 'recolecciones'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <BotonPrimario type="button" onClick={descargar} cargando={generando} className="mt-5 w-full">
                        {generando ? 'Generando…' : `Descargar constancia ${elegido ?? ''}`}
                    </BotonPrimario>
                </Modal>
            )}
        </>
    );
}
