'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';

interface Buque {
  id: number;
  nombre_buque: string;
}

interface Persona {
  id: number;
  nombre: string;
}

interface CreateManifiestoBasuronModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buques: Buque[];
  personas: Persona[];
}

export function CreateManifiestoBasuronModal({
  isOpen,
  onClose,
  onSuccess,
  buques,
  personas,
}: CreateManifiestoBasuronModalProps) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso_entrada: '',
    peso_salida: '',
    buque_id: '',
    responsable_id: '',
    observaciones: '',
    estado: 'En Proceso' as 'En Proceso' | 'Completado' | 'Cancelado',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        peso_entrada: '',
        peso_salida: '',
        buque_id: '',
        responsable_id: '',
        observaciones: '',
        estado: 'En Proceso',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pesoEntrada = parseFloat(formData.peso_entrada);
      const pesoSalida = formData.peso_salida ? parseFloat(formData.peso_salida) : null;

      await createManifiestoBasuron({
        fecha: formData.fecha,
        peso_entrada: pesoEntrada,
        peso_salida: pesoSalida,
        buque_id: parseInt(formData.buque_id),
        responsable_id: formData.responsable_id ? parseInt(formData.responsable_id) : null,
        observaciones: formData.observaciones || null,
        estado: formData.estado,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el registro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Nuevo Registro de Basurón</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buque *</label>
            <select
              value={formData.buque_id}
              onChange={(e) => setFormData({ ...formData, buque_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar buque</option>
              {buques.map((buque) => (
                <option key={buque.id} value={buque.id}>{buque.nombre_buque}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Peso de Entrada (kg) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.peso_entrada}
                onChange={(e) => setFormData({ ...formData, peso_entrada: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Peso de Salida (kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.peso_salida}
                onChange={(e) => setFormData({ ...formData, peso_salida: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
            <select
              value={formData.responsable_id}
              onChange={(e) => setFormData({ ...formData, responsable_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar responsable</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>{persona.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="En Proceso">En Proceso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Agregar observaciones..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
