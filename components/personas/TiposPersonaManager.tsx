'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { getTiposPersona, createTipoPersona, updateTipoPersona, deleteTipoPersona } from '@/lib/services/tipos_persona';
import { TipoPersona } from '@/types/database';

interface TiposPersonaManagerProps {
  onUpdate?: () => void;
}

export function TiposPersonaManager({ onUpdate }: TiposPersonaManagerProps) {
  const [tipos, setTipos] = useState<TipoPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoPersona | null>(null);
  const [formData, setFormData] = useState({ nombre_tipo: '', descripcion: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTipos();
  }, []);

  async function loadTipos() {
    try {
      setLoading(true);
      const data = await getTiposPersona();
      setTipos(data);
    } catch (error) {
      console.error('Error cargando tipos:', error);
      alert('Error al cargar los tipos de persona');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (tipo?: TipoPersona) => {
    console.log('🟢 handleOpenModal llamado con tipo:', tipo);
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({ nombre_tipo: tipo.nombre_tipo, descripcion: tipo.descripcion || '' });
      console.log('🟢 Modo edición activado para tipo:', tipo.nombre_tipo);
    } else {
      setEditingTipo(null);
      setFormData({ nombre_tipo: '', descripcion: '' });
      console.log('🟢 Modo creación activado');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTipo(null);
    setFormData({ nombre_tipo: '', descripcion: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_tipo.trim()) {
      alert('El nombre del tipo es requerido');
      return;
    }

    try {
      setSaving(true);
      if (editingTipo) {
        await updateTipoPersona(editingTipo.id, {
          nombre_tipo: formData.nombre_tipo,
          descripcion: formData.descripcion || null
        });
      } else {
        await createTipoPersona({
          nombre_tipo: formData.nombre_tipo,
          descripcion: formData.descripcion || null
        });
      }
      await loadTipos();
      onUpdate?.();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error guardando tipo:', error);
      alert(`Error al guardar el tipo de persona: ${error?.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    console.log('🟡 handleDelete de tipo llamado con id:', id);
    if (confirm('¿Estás seguro de eliminar este tipo de persona? Esto puede afectar a las personas asociadas.')) {
      try {
        console.log('🟡 Eliminando tipo...');
        await deleteTipoPersona(id);
        await loadTipos();
        onUpdate?.();
        console.log('🟡 Tipo eliminado exitosamente');
      } catch (error) {
        console.error('❌ Error eliminando tipo:', error);
        alert('Error al eliminar. Es posible que haya personas asociadas a este tipo.');
      }
    } else {
      console.log('🟡 Eliminación de tipo cancelada por el usuario');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-simar-texto">Tipos de Persona</h3>
        <Button onClick={() => handleOpenModal()} variant="secondary" className="text-base">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Tipo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-simar-marea-tinta border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tipos.map((tipo) => (
            <div key={tipo.id} className="bg-simar-superficie border border-simar-borde rounded-lg p-4 transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-simar-texto">{tipo.nombre_tipo}</h4>
                  {tipo.descripcion && (
                    <p className="text-[15px] text-simar-texto-2 mt-1">{tipo.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(tipo)}
                    className="p-1 text-simar-marea-tinta hover:bg-simar-marea-suave rounded min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tipo.id)}
                    className="p-1 text-simar-coral hover:bg-simar-coral-suave rounded min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-[15px] text-simar-texto-2">ID: {tipo.id}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="simar-velo fixed inset-0 bg-[rgba(11,34,54,0.55)] flex items-center justify-center z-50 p-4">
          <div className="simar-ventana bg-simar-superficie rounded-[28px] p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-simar-texto">
                {editingTipo ? 'Editar Tipo de Persona' : 'Nuevo Tipo de Persona'}
              </h3>
              <button onClick={handleCloseModal} className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors" aria-label="Cerrar">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[17px] font-bold text-simar-texto mb-2">
                  Nombre del Tipo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_tipo}
                  onChange={(e) => setFormData({ ...formData, nombre_tipo: e.target.value })}
                  className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                  placeholder="Ej: Capitán, Tripulante, Inspector"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-[17px] font-bold text-simar-texto mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full resize-none px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                  placeholder="Descripción opcional del tipo de persona"
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-simar-borde">
                <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </span>
                  ) : (
                    editingTipo ? 'Actualizar' : 'Crear'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
