'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { createResiduo, updateResiduo } from '@/lib/services/residuos';
import { getBuques } from '@/lib/services/buques';
import { getTiposResiduos } from '@/lib/services/tipos_residuos';
import { ResiduoConRelaciones, Buque, TipoResiduo } from '@/types/database';

interface CreateResiduoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  residuoToEdit?: ResiduoConRelaciones | null;
}

interface TipoResiduoItem {
  tipo_residuo_id: number;
  cantidad: number;
  unidad: string;
}

export function CreateResiduoModal({ isOpen, onClose, onSave, residuoToEdit }: CreateResiduoModalProps) {
  const [loading, setLoading] = useState(false);
  const [buques, setBuques] = useState<Buque[]>([]);
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<TipoResiduoItem[]>([]);
  const [formData, setFormData] = useState({
    buque_id: '',
    fecha_generacion: new Date().toISOString().split('T')[0],
    estado: 'Generado' as 'Generado' | 'Almacenado' | 'Recolectado' | 'Procesado',
    ubicacion_almacenamiento: '',
    observaciones: '',
  });

  // Selector temporal para agregar tipos
  const [nuevoTipo, setNuevoTipo] = useState({
    tipo_residuo_id: '',
    cantidad: '',
    unidad: 'kg',
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (residuoToEdit) {
      setFormData({
        buque_id: residuoToEdit.buque_id?.toString() || '',
        fecha_generacion: residuoToEdit.fecha_generacion,
        estado: residuoToEdit.estado,
        ubicacion_almacenamiento: residuoToEdit.ubicacion_almacenamiento || '',
        observaciones: residuoToEdit.observaciones || '',
      });
      // Si hay un tipo de residuo asociado, agregarlo a la lista
      if (residuoToEdit.tipo_residuo_id) {
        setTiposSeleccionados([{
          tipo_residuo_id: residuoToEdit.tipo_residuo_id,
          cantidad: residuoToEdit.cantidad_generada || 0,
          unidad: 'kg' // Valor por defecto ya que unidad_medida no existe en el tipo
        }]);
      }
    } else {
      resetForm();
    }
  }, [residuoToEdit]);

  async function loadData() {
    try {
      const [buquesData, tiposData] = await Promise.all([
        getBuques(),
        getTiposResiduos()
      ]);
      setBuques(buquesData);
      setTiposResiduos(tiposData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  const resetForm = () => {
    setFormData({
      buque_id: '',
      fecha_generacion: new Date().toISOString().split('T')[0],
      estado: 'Generado',
      ubicacion_almacenamiento: '',
      observaciones: '',
    });
    setTiposSeleccionados([]);
    setNuevoTipo({ tipo_residuo_id: '', cantidad: '', unidad: 'kg' });
  };

  const agregarTipoResiduo = () => {
    if (!nuevoTipo.tipo_residuo_id || !nuevoTipo.cantidad) {
      alert('Debes seleccionar un tipo de residuo y especificar la cantidad');
      return;
    }

    // Verificar que no esté duplicado
    const yaExiste = tiposSeleccionados.some(
      t => t.tipo_residuo_id === parseInt(nuevoTipo.tipo_residuo_id)
    );

    if (yaExiste) {
      alert('Este tipo de residuo ya está en la lista');
      return;
    }

    setTiposSeleccionados([
      ...tiposSeleccionados,
      {
        tipo_residuo_id: parseInt(nuevoTipo.tipo_residuo_id),
        cantidad: parseFloat(nuevoTipo.cantidad),
        unidad: nuevoTipo.unidad,
      }
    ]);

    setNuevoTipo({ tipo_residuo_id: '', cantidad: '', unidad: 'kg' });
  };

  const eliminarTipoResiduo = (tipo_residuo_id: number) => {
    setTiposSeleccionados(tiposSeleccionados.filter(t => t.tipo_residuo_id !== tipo_residuo_id));
  };

  const getTipoNombre = (id: number) => {
    return tiposResiduos.find(t => t.id === id)?.nombre_tipo || 'Desconocido';
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tiposSeleccionados.length === 0) {
      alert('Debes agregar al menos un tipo de residuo');
      return;
    }

    setLoading(true);

    try {
      // Por ahora, vamos a crear un residuo por cada tipo seleccionado
      // En una implementación más avanzada, podrías crear una tabla intermedia
      for (const tipo of tiposSeleccionados) {
        const residuoData: any = {
          buque_id: formData.buque_id ? parseInt(formData.buque_id) : 0,
          tipo_residuo_id: tipo.tipo_residuo_id,
          cantidad_generada: tipo.cantidad,
          fecha_generacion: formData.fecha_generacion,
          cumplimiento_id: null,
          estado: formData.estado,
          ubicacion_almacenamiento: formData.ubicacion_almacenamiento || null,
          observaciones: `${formData.observaciones || ''} | Unidad: ${tipo.unidad}`.trim(),
        };

        if (residuoToEdit && tiposSeleccionados.length === 1) {
          const updateData: any = { ...residuoData };
          delete updateData.cumplimiento_id;
          await updateResiduo(residuoToEdit.id, updateData);
        } else {
          await createResiduo(residuoData);
        }
      }

      alert(residuoToEdit ? 'Residuo actualizado exitosamente' : 
            `${tiposSeleccionados.length} residuo(s) creado(s) exitosamente`);
      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error guardando residuo:', error);
      alert(`Error al ${residuoToEdit ? 'actualizar' : 'crear'} el residuo`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {residuoToEdit ? 'Editar Residuo' : 'Nuevo Registro de Residuos'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Información General */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buque
                </label>
                <select
                  value={formData.buque_id}
                  onChange={(e) => setFormData({ ...formData, buque_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                >
                  <option value="">Seleccionar buque</option>
                  {buques.map((buque) => (
                    <option key={buque.id} value={buque.id}>
                      {buque.nombre_buque} {buque.matricula ? `(${buque.matricula})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Generación <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha_generacion}
                  onChange={(e) => setFormData({ ...formData, fecha_generacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                >
                  <option value="Generado">Generado</option>
                  <option value="Almacenado">Almacenado</option>
                  <option value="Recolectado">Recolectado</option>
                  <option value="Procesado">Procesado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación de Almacenamiento
                </label>
                <input
                  type="text"
                  value={formData.ubicacion_almacenamiento}
                  onChange={(e) => setFormData({ ...formData, ubicacion_almacenamiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: Bodega A, Sector 3"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={2}
                  placeholder="Observaciones adicionales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Tipos de Residuos */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Tipos de Residuos <span className="text-red-500">*</span>
            </h3>

            {/* Agregar Tipo */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Residuo
                  </label>
                  <select
                    value={nuevoTipo.tipo_residuo_id}
                    onChange={(e) => setNuevoTipo({ ...nuevoTipo, tipo_residuo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    disabled={loading}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposResiduos.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre_tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoTipo.cantidad}
                    onChange={(e) => setNuevoTipo({ ...nuevoTipo, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad
                  </label>
                  <select
                    value={nuevoTipo.unidad}
                    onChange={(e) => setNuevoTipo({ ...nuevoTipo, unidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    disabled={loading}
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="m³">m³</option>
                    <option value="ton">ton</option>
                    <option value="unidad">unidad</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  onClick={agregarTipoResiduo}
                  variant="secondary"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar a la Lista
                </Button>
              </div>
            </div>

            {/* Lista de Tipos Seleccionados */}
            <div className="space-y-2">
              {tiposSeleccionados.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 font-medium">No hay tipos de residuos agregados</p>
                  <p className="text-gray-400 text-sm">Usa el formulario de arriba para agregar</p>
                </div>
              ) : (
                tiposSeleccionados.map((tipo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{getTipoNombre(tipo.tipo_residuo_id)}</p>
                        <p className="text-sm text-gray-600">
                          Cantidad: <span className="font-medium">{tipo.cantidad} {tipo.unidad}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarTipoResiduo(tipo.tipo_residuo_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="mt-6 flex gap-3 justify-end border-t pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {residuoToEdit ? 'Actualizando...' : 'Guardando...'}
                </span>
              ) : (
                residuoToEdit ? 'Actualizar Residuo' : 'Crear Residuos'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
