'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { getReutilizaciones, deleteReutilizacion } from '@/lib/services/reutilizacion';
import { ReutilizacionConRelaciones } from '@/types/database';

export default function ReutilizacionPage() {
  const [reutilizaciones, setReutilizaciones] = useState<ReutilizacionConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getReutilizaciones();
      setReutilizaciones(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar?')) {
      try {
        await deleteReutilizacion(id);
        await loadData();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const stats = {
    total: reutilizaciones.length,
    cantidad: reutilizaciones.reduce((sum, r) => sum + (r.cantidad_reutilizada || 0), 0),
    costo: reutilizaciones.reduce((sum, r) => sum + (r.costo_proceso || 0), 0),
    ingreso: reutilizaciones.reduce((sum, r) => sum + (r.ingreso_generado || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reutilización de Residuos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión y análisis de reutilización</p>
        </div>
        <Button onClick={() => alert('Próximamente')}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Reutilización
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">Cantidad</p>
            <p className="text-2xl font-bold text-green-600">{stats.cantidad.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">Costo</p>
            <p className="text-2xl font-bold text-orange-600">₡{stats.costo.toFixed(0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">Ingreso</p>
            <p className="text-2xl font-bold text-purple-600">₡{stats.ingreso.toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reutilizaciones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay registros</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asociación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingreso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reutilizaciones.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4">{r.id}</td>
                    <td className="px-6 py-4">{r.asociacion?.nombre_asociacion || '—'}</td>
                    <td className="px-6 py-4">{r.cantidad_reutilizada}</td>
                    <td className="px-6 py-4 text-orange-600">₡{r.costo_proceso || 0}</td>
                    <td className="px-6 py-4 text-green-600">₡{r.ingreso_generado || 0}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(r.id)} className="text-red-600">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </div>
  );
}
