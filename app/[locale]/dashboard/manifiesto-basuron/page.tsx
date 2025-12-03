'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getManifiestosBasuron, deleteManifiestoBasuron } from '@/lib/services/manifiesto_basuron';
import { ManifiestoBasuronConRelaciones } from '@/types/database';
import { generateBasuronPDF } from '@/lib/utils/pdfGeneratorBasuron';
import { CreateManifiestoBasuronModal } from '@/components/manifiestos/CreateManifiestoBasuronModal';
import { getBuques } from '@/lib/services/buques';

export default function ManifiestoBasuronPage() {
  const [manifiestos, setManifiestos] = useState<ManifiestoBasuronConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [buques, setBuques] = useState<any[]>([]);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manifiesto Basurón</h1>
          <p className="text-sm text-gray-500 mt-1">Control de pesaje y depósito de residuos</p>
        </div>
      </div>

      {/* Wizard inline siempre visible */}
      <CreateManifiestoBasuronModal
        inline
        isOpen={false}
        onClose={() => { }}
        onSuccess={loadData}
        buques={buques}
      />

      {/* Eliminado resumen de registros y depositado */}

      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Registros Basurón</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Lista de todos los registros de pesaje</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 sm:rounded-xl">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Buque</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Horario</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pesaje (kg)</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifiestos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-semibold">No hay registros basurón</p>
                            <p className="text-sm">Crea uno nuevo con el formulario superior</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      manifiestos.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <div className="flex flex-col">
                              <span className="font-semibold text-blue-600 whitespace-nowrap">#{m.numero_ticket || m.id}</span>
                              {m.numero_ticket && <span className="text-xs text-gray-400">ID: {m.id}</span>}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <span className="font-medium text-gray-900 truncate">{m.buque?.nombre_buque || '—'}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 hidden sm:table-cell">
                            <span className="text-gray-600 whitespace-nowrap">{new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 hidden md:table-cell">
                            <div className="flex flex-col text-xs text-gray-600">
                              <span>E: {m.hora_entrada}</span>
                              <span>S: {m.hora_salida || '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <div className="flex flex-col text-sm">
                              <span className="text-gray-500 text-xs">Ent: {m.peso_entrada.toFixed(2)}</span>
                              {m.peso_salida && <span className="text-gray-500 text-xs">Sal: {m.peso_salida.toFixed(2)}</span>}
                              <span className="font-bold text-blue-600 mt-1">
                                Neto: {Number(m.total_depositado || 0).toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.estado === 'Completado'
                                ? 'bg-green-100 text-green-800'
                                : m.estado === 'En Proceso'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                              {m.estado || 'En Proceso'}
                            </span>
                          </td>

                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <div className="flex gap-1 sm:gap-2 min-w-[100px]">
                              <button
                                onClick={() => generateBasuronPDF(m)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Descargar PDF"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
    // </DashboardLayout>
  );
}
