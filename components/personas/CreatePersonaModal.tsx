'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { createPersona, updatePersona } from '@/lib/services/personas';
import { getTiposPersona } from '@/lib/services/tipos_persona';
import { TipoPersona, PersonaConTipo } from '@/types/database';

interface CreatePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: () => void;
  personaToEdit?: PersonaConTipo | null;
}

export interface PersonaFormData {
  nombre: string;
  tipo_persona_id: number | null;
  info_contacto: string;
}

export function CreatePersonaModal({ isOpen, onClose, onCreate, personaToEdit }: CreatePersonaModalProps) {
  const t = useTranslations('Personas.modal');
  const tm = useTranslations('Personas.mensajes');

  const [formData, setFormData] = useState<PersonaFormData>({
    nombre: '',
    tipo_persona_id: null,
    info_contacto: '',
  });
  const [tiposPersona, setTiposPersona] = useState<TipoPersona[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTiposPersona();
      if (personaToEdit) {
        setFormData({
          nombre: personaToEdit.nombre,
          tipo_persona_id: personaToEdit.tipo_persona_id,
          info_contacto: personaToEdit.info_contacto || '',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, personaToEdit]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo_persona_id: tiposPersona.find(t => t.nombre_tipo === 'Tripulante')?.id || null,
      info_contacto: '',
    });
  };

  const loadTiposPersona = async () => {
    try {
      setLoadingTipos(true);
      const tipos = await getTiposPersona();
      setTiposPersona(tipos);
      // Seleccionar por defecto "Tripulante" si existe
      const tripulante = tipos.find(t => t.nombre_tipo === 'Tripulante');
      if (tripulante && !formData.tipo_persona_id) {
        setFormData(prev => ({ ...prev, tipo_persona_id: tripulante.id }));
      }
    } catch (error) {
      console.error('Error cargando tipos de persona:', error);
    } finally {
      setLoadingTipos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo_persona_id) {
      alert(t('seleccioneTipo'));
      return;
    }

    try {
      setLoading(true);

      if (personaToEdit) {
        // Editar persona existente
        await updatePersona(personaToEdit.id, formData as { nombre: string; tipo_persona_id: number; info_contacto: string });
        alert(tm('personaEditada'));
      } else {
        // Crear nueva persona
        await createPersona(formData as { nombre: string; tipo_persona_id: number; info_contacto: string });
        alert(tm('personaCreada'));
      }

      resetForm();
      onCreate?.();
      onClose();
    } catch (error) {
      console.error('Error guardando persona:', error);
      alert(personaToEdit ? tm('errorEditar') : tm('errorCrear'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {personaToEdit ? t('tituloEditar') : t('tituloCrear')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingTipos ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('nombre')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder={t('nombre')}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tipo')} *
                  </label>
                  <select
                    required
                    value={formData.tipo_persona_id || ''}
                    onChange={(e) => setFormData({ ...formData, tipo_persona_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  >
                    <option value="">{t('seleccioneTipo')}</option>
                    {tiposPersona.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre_tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('email')} / {t('telefono')}
                  </label>
                  <textarea
                    value={formData.info_contacto}
                    onChange={(e) => setFormData({ ...formData, info_contacto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder={`${t('email')}, ${t('telefono')}`}
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t dark:border-slate-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  {t('cancelar')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {personaToEdit ? t('guardar') : t('crear')}...
                    </span>
                  ) : (
                    personaToEdit ? t('guardar') : t('crear')
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
