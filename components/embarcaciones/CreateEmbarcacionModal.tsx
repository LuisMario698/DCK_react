 'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { createBuque, updateBuque } from '@/lib/services/buques';
import { Buque } from '@/types/database';

interface Props {
  onCreate: () => void;
  onClose: () => void;
  buqueToEdit?: Buque | null;
}

export function CreateEmbarcacionModal({ onCreate, onClose, buqueToEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Barco');
  const [matricula, setMatricula] = useState('');
  const [puerto, setPuerto] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [estado, setEstado] = useState<'Activo' | 'Inactivo' | 'En Mantenimiento'>('Activo');

  // Cargar datos si estamos editando
  useEffect(() => {
    if (buqueToEdit) {
      setNombre(buqueToEdit.nombre_buque);
      setTipo(buqueToEdit.tipo_buque || 'Barco');
      setMatricula(buqueToEdit.matricula || '');
      setPuerto(buqueToEdit.puerto_base || '');
      setCapacidad(buqueToEdit.capacidad_toneladas?.toString() || '');
      setEstado(buqueToEdit.estado);
    } else {
      resetForm();
    }
  }, [buqueToEdit]);

  const resetForm = () => {
    setNombre('');
    setTipo('Barco');
    setMatricula('');
    setPuerto('');
    setCapacidad('');
    setEstado('Activo');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const buqueData = {
        nombre_buque: nombre,
        tipo_buque: tipo,
        matricula: matricula || null,
        puerto_base: puerto || null,
        capacidad_toneladas: capacidad ? parseFloat(capacidad) : null,
        estado,
        propietario_id: null,
        fecha_registro: buqueToEdit?.fecha_registro || new Date().toISOString().split('T')[0]
      };

      if (buqueToEdit) {
        await updateBuque(buqueToEdit.id, buqueData);
        alert('Buque actualizado exitosamente');
      } else {
        await createBuque(buqueData);
        alert('Buque creado exitosamente');
      }

      onCreate();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error guardando buque:', error);
      alert(`Error al ${buqueToEdit ? 'actualizar' : 'crear'} el buque`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {buqueToEdit ? 'Editar Buque' : 'Crear Nuevo Buque'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✖</button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Nombre del Buque *</label>
            <input 
              required 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej: La Perla Negra"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900" 
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Tipo de Buque</label>
            <select 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)} 
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
            >
              <option value="Barco">Barco</option>
              <option value="Lancha">Lancha</option>
              <option value="Yate">Yate</option>
              <option value="Carga">Carga</option>
              <option value="Pesquero">Pesquero</option>
              <option value="Velero">Velero</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Matrícula</label>
            <input 
              value={matricula} 
              onChange={(e) => setMatricula(e.target.value)} 
              placeholder="Ej: ABC-1234"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900" 
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Puerto Base</label>
            <input 
              value={puerto} 
              onChange={(e) => setPuerto(e.target.value)} 
              placeholder="Ej: Puerto Limón"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900" 
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Capacidad (Toneladas)</label>
            <input 
              type="number" 
              step="0.01"
              value={capacidad} 
              onChange={(e) => setCapacidad(e.target.value)} 
              placeholder="Ej: 500"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900" 
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Estado</label>
            <select 
              value={estado} 
              onChange={(e) => setEstado(e.target.value as 'Activo' | 'Inactivo' | 'En Mantenimiento')} 
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="En Mantenimiento">En Mantenimiento</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {buqueToEdit ? 'Actualizando...' : 'Creando...'}
                </span>
              ) : (
                buqueToEdit ? 'Actualizar Buque' : 'Crear Buque'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
