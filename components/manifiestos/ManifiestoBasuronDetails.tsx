'use client';

import { ManifiestoBasuronConRelaciones } from '@/types/database';

interface ManifiestoBasuronDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    manifiesto: ManifiestoBasuronConRelaciones | null;
}

export function ManifiestoBasuronDetails({ isOpen, onClose, manifiesto }: ManifiestoBasuronDetailsProps) {
    if (!isOpen || !manifiesto) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative w-full max-w-5xl flex flex-col gap-6 my-8">

                    {/* Botón de cierre pegajoso o flotante */}
                    <div className="flex justify-end sticky top-0 z-10 pt-2 pr-2">
                        <button
                            onClick={onClose}
                            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm border border-white/20 shadow-lg"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Card 1: Información General */}
                    <div className="bg-white rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Detalles del Manifiesto #{manifiesto.numero_ticket || manifiesto.id}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Fecha</p>
                                <p className="text-gray-900 font-medium">{new Date(manifiesto.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Horario</p>
                                <p className="text-gray-900 font-medium">
                                    <span className="text-green-600">Entrada: {manifiesto.hora_entrada}</span>
                                    {manifiesto.hora_salida && <span className="text-red-600 ml-3">Salida: {manifiesto.hora_salida}</span>}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Recibimos de</p>
                                <p className="text-gray-900 font-medium">{manifiesto.recibimos_de || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Dirección</p>
                                <p className="text-gray-900 font-medium">{manifiesto.direccion || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Recibido por</p>
                                <p className="text-gray-900 font-medium">{manifiesto.recibido_por || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Peso Entrada</p>
                                <p className="text-gray-900 font-bold text-lg text-green-700">{manifiesto.peso_entrada} kg</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Peso Salida</p>
                                <p className="text-gray-900 font-bold text-lg text-red-700">{manifiesto.peso_salida ? `${manifiesto.peso_salida} kg` : '—'}</p>
                            </div>
                            <div className="space-y-1 md:col-span-3 lg:col-span-3">
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Depositado</p>
                                    <p className="text-3xl font-bold text-blue-900">{Number(manifiesto.total_depositado || 0).toFixed(2)} kg</p>
                                </div>
                            </div>
                            {manifiesto.observaciones && (
                                <div className="space-y-1 md:col-span-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Observaciones</p>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                                        {manifiesto.observaciones}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Documento Adjunto */}
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Documento Digitalizado
                            </h3>
                            {manifiesto.pdf_manifiesto_url && (
                                <a
                                    href={manifiesto.pdf_manifiesto_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                    Abrir original
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        <div className="bg-gray-200 min-h-[500px] p-4 flex justify-center items-center">
                            {manifiesto.pdf_manifiesto_url ? (
                                manifiesto.pdf_manifiesto_url.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={manifiesto.pdf_manifiesto_url}
                                        className="w-full min-h-[800px] rounded-lg border border-gray-300 shadow-md"
                                        title="Documento PDF"
                                    />
                                ) : (
                                    <img
                                        src={manifiesto.pdf_manifiesto_url}
                                        alt="Documento del manifiesto"
                                        className="max-w-full h-auto rounded-lg shadow-md"
                                        style={{ display: 'block' }}
                                    />
                                )
                            ) : (
                                <div className="text-center text-gray-400 self-center">
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
