'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getManifiestosBasuron, deleteManifiestoBasuron } from '@/lib/services/manifiesto_basuron';
import { ManifiestoBasuronConRelaciones } from '@/types/database';
import { descargarPDFBasuron } from '@/lib/utils/pdfGeneratorBasuron';
import { ManifiestoBasuronDetails } from '@/components/manifiestos/ManifiestoBasuronDetails';
import { CreateManifiestoBasuronModal } from '@/components/manifiestos/CreateManifiestoBasuronModal';
import { getBuques } from '@/lib/services/buques';

export default function ManifiestoBasuronPage() {
  const [manifiestos, setManifiestos] = useState<ManifiestoBasuronConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [buques, setBuques] = useState<any[]>([]);
  const [selectedManifiesto, setSelectedManifiesto] = useState<ManifiestoBasuronConRelaciones | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [manifestosData, buquesData] = await Promise.all([
        getManifiestosBasuron(),
        getBuques(),
      ]);
      setManifiestos(manifestosData);
      setBuques(buquesData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      window.open(url, '_blank');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar?')) {
      try {
        await deleteManifiestoBasuron(id);
        await loadData();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const stats = {
    total: manifiestos.length,
    totalDepositado: manifiestos.reduce((sum, m) => sum + (m.total_depositado || 0), 0),
  };

  return (
    // <DashboardLayout>
    <div className="space-y-6">
      {/* Wizard inline siempre visible */}
      <CreateManifiestoBasuronModal
        inline
        isOpen={false}
        onClose={() => { }}
        onSuccess={loadData}
        buques={buques}
      />

      {/* Botón para ir a la lista de registros */}
      <div className="flex justify-center">
        <button
          onClick={() => document.getElementById('lista-registros')?.scrollIntoView({ behavior: 'smooth' })}
          className="group flex items-center gap-2 px-6 py-3 border-2 border-blue-500 bg-transparent hover:bg-blue-500 text-blue-500 hover:text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
        >
          <span>Ver registros</span>
          <svg className="w-5 h-5 animate-bounce stroke-blue-500 group-hover:stroke-white transition-colors duration-300" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      <div id="lista-registros" className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Recibos del Relleno Sanitario</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Lista de todos los recibos de pesaje registrados</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-xl">
                <table className="w-full">
                  <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]"># Ticket</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Fecha</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Hora</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[25%]">Total Depositado</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[25%]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifiestos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No hay recibos registrados</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Crea uno nuevo con el formulario superior</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      manifiestos.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <div className="flex flex-col">
                              <span className="font-semibold text-blue-600 whitespace-nowrap">#{m.numero_ticket || m.id}</span>
                              {m.numero_ticket && <span className="text-xs text-gray-400">ID: {m.id}</span>}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 text-center">
                            <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 text-center">
                            <span className="text-gray-600 dark:text-gray-300 font-mono">{m.hora_entrada}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 text-center">
                            <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{Number(m.total_depositado || 0).toFixed(2)} kg</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => setSelectedManifiesto(m)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 sm:gap-1.5 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap bg-white dark:bg-gray-800"
                                title="Ver Detalles"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="hidden sm:inline">Ver</span>
                              </button>
                              <button
                                onClick={() => m.pdf_manifiesto_url && handleDownload(m.pdf_manifiesto_url, `recibo_basuron_${m.numero_ticket || m.id}`)}
                                disabled={!m.pdf_manifiesto_url}
                                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 shadow-sm ${m.pdf_manifiesto_url
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                title="Descargar Imagen"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0 shadow-sm"
                                title="Eliminar"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* El listado queda debajo del wizard */}
      <ManifiestoBasuronDetails
        isOpen={!!selectedManifiesto}
        onClose={() => setSelectedManifiesto(null)}
        manifiesto={selectedManifiesto}
      />
    </div>
    // </DashboardLayout>
  );
}
