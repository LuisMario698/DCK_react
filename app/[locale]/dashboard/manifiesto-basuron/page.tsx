'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { getManifiestosBasuron, deleteManifiestoBasuron } from '@/lib/services/manifiesto_basuron';
import { ManifiestoBasuronConRelaciones } from '@/types/database';
import { generateBasuronPDF } from '@/lib/utils/pdfGeneratorBasuron';
import { CreateManifiestoBasuronModal } from '@/components/manifiestos/CreateManifiestoBasuronModal';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';

export default function ManifiestoBasuronPage() {
  const [manifiestos, setManifiestos] = useState<ManifiestoBasuronConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buques, setBuques] = useState<any[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [manifestosData, buquesData, personasData] = await Promise.all([
        getManifiestosBasuron(),
        getBuques(),
        getPersonas(),
      ]);
      setManifiestos(manifestosData);
      setBuques(buquesData);
      setPersonas(personasData);
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
    enProceso: manifiestos.filter(m => m.estado === 'En Proceso').length,
    completados: manifiestos.filter(m => m.estado === 'Completado').length,
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
          <Button onClick={() => setIsModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Registro
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">Total Registros</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">En Proceso</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.enProceso}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-green-600">{stats.completados}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">Total Depositado</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalDepositado.toFixed(2)} kg</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : manifiestos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay registros</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buque</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salida</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depositado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {manifiestos.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-4 font-mono text-sm">{m.id}</td>
                    <td className="px-6 py-4">{m.buque?.nombre_buque || '—'}</td>
                    <td className="px-6 py-4">{new Date(m.fecha).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{m.peso_entrada} kg</td>
                    <td className="px-6 py-4">{m.peso_salida || '—'} kg</td>
                    <td className="px-6 py-4 font-bold text-purple-600">{m.total_depositado} kg</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        m.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                        m.estado === 'En Proceso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => generateBasuronPDF(m)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Descargar PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-800">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <CreateManifiestoBasuronModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
          buques={buques}
          personas={personas}
        />
      </div>
    // </DashboardLayout>
  );
}
