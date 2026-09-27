'use client';

import { ManifiestoBasuronConRelaciones } from '@/types/database';
import { parseFechaLocal } from '@/lib/utils/fechas';

interface ManifiestoBasuronDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    manifiesto: ManifiestoBasuronConRelaciones | null;
}

export function ManifiestoBasuronDetails({ isOpen, onClose, manifiesto }: ManifiestoBasuronDetailsProps) {
    if (!isOpen || !manifiesto) return null;

    return (
        <div className="simar-velo fixed inset-0 z-50 overflow-y-auto bg-[rgba(11,34,54,0.72)] backdrop-blur-sm">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="simar-ventana relative w-full max-w-5xl flex flex-col gap-6 my-8">

                    {/* Botón de cierre pegajoso o flotante */}
                    <div className="flex justify-end sticky top-0 z-10 pt-2 pr-2">
                        <button
                            onClick={onClose}
                            aria-label="Cerrar detalles"
                            className="simar-vidrio-fuerte w-14 h-14 rounded-full text-simar-texto flex items-center justify-center"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Card 1: Información General */}
                    <div className="simar-aparece bg-simar-superficie rounded-[28px] shadow-2xl p-6 sm:p-8">
                        <h3 className="text-2xl sm:text-[28px] font-extrabold text-simar-texto mb-6 flex items-center gap-3">
                            <svg className="w-6 h-6 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Detalles del Manifiesto #{manifiesto.numero_ticket || manifiesto.id}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-simar-texto-2">Fecha</p>
                                <p className="text-lg text-simar-texto font-medium">{parseFechaLocal(manifiesto.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-simar-texto-2">Horario</p>
                                <p className="text-lg text-simar-texto font-medium">
                                    <span className="text-simar-arrecife-tinta">Entrada: {manifiesto.hora_entrada}</span>
                                    {manifiesto.hora_salida && <span className="text-simar-coral ml-3">Salida: {manifiesto.hora_salida}</span>}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-simar-texto-2">Recibimos de</p>
                                <p className="text-lg text-simar-texto font-medium">{manifiesto.recibimos_de || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-simar-texto-2">Dirección</p>
                                <p className="text-lg text-simar-texto font-medium">{manifiesto.direccion || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-simar-texto-2">Recibido por</p>
                                <p className="text-lg text-simar-texto font-medium">{manifiesto.recibido_por || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-simar-texto-2">Peso de entrada</p>
                                <p className="font-extrabold text-xl text-simar-texto">{manifiesto.peso_entrada} kg</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-simar-texto-2">Peso de salida</p>
                                <p className="font-extrabold text-xl text-simar-texto">{manifiesto.peso_salida ? `${manifiesto.peso_salida} kg` : '—'}</p>
                            </div>
                            <div className="space-y-1 md:col-span-3 lg:col-span-3">
                                <div className="bg-simar-marea-suave p-4 rounded-[22px] text-center">
                                    <p className="text-[17px] font-bold text-simar-texto mb-1">Total depositado</p>
                                    <p className="text-3xl font-extrabold text-simar-marea-tinta">{Number(manifiesto.total_depositado || 0).toFixed(2)} kg</p>
                                </div>
                            </div>
                            {manifiesto.observaciones && (
                                <div className="space-y-1 md:col-span-3">
                                    <p className="text-[15px] font-bold text-simar-texto-2">Observaciones</p>
                                    <p className="text-simar-texto bg-simar-papel p-3 rounded-lg border border-simar-borde text-base">
                                        {manifiesto.observaciones}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Documento Adjunto */}
                    <div className="simar-aparece bg-simar-superficie rounded-[28px] shadow-2xl overflow-hidden flex-col">
                        <div className="p-4 border-b border-simar-borde flex justify-between items-center bg-simar-papel">
                            <h3 className="text-lg font-extrabold text-simar-texto flex items-center gap-2">
                                <svg className="w-5 h-5 text-simar-texto-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Documento Digitalizado
                            </h3>
                            {manifiesto.pdf_manifiesto_url && (
                                <a
                                    href={manifiesto.pdf_manifiesto_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="min-h-[44px] text-base text-simar-marea-tinta font-bold flex items-center gap-1.5 hover:underline"
                                >
                                    Abrir original
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        <div className="bg-simar-papel min-h-[500px] p-4 flex justify-center items-center">
                            {manifiesto.pdf_manifiesto_url ? (
                                manifiesto.pdf_manifiesto_url.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={manifiesto.pdf_manifiesto_url}
                                        className="w-full min-h-[800px] rounded-lg border border-simar-campo-borde shadow-simar"
                                        title="Documento PDF"
                                    />
                                ) : (
                                    <img
                                        src={manifiesto.pdf_manifiesto_url}
                                        alt="Documento del manifiesto"
                                        className="max-w-full h-auto rounded-lg shadow-simar"
                                        style={{ display: 'block' }}
                                    />
                                )
                            ) : (
                                <div className="text-center text-simar-texto-2 self-center">
                                    <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-lg font-medium">Sin documento adjunto</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}
