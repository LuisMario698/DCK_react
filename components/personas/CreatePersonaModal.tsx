'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { usePresencia } from '@/components/ui/movimiento';
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
      // Seleccionar por defecto el primer tipo disponible (Motorista o Cocinero)
      tipo_persona_id: tiposPersona.length > 0 ? tiposPersona[0].id : null,
      info_contacto: '',
    });
  };

  const loadTiposPersona = async () => {
    try {
      setLoadingTipos(true);
      const tipos = await getTiposPersona();
      const tiposPermitidos = tipos.filter(t => ['Motorista', 'Cocinero', 'Responsable de Líquidos'].includes(t.nombre_tipo));
      setTiposPersona(tiposPermitidos);

      // Seleccionar por defecto el primero disponible si existe
      if (tiposPermitidos.length > 0 && !formData.tipo_persona_id) {
        setFormData(prev => ({ ...prev, tipo_persona_id: tiposPermitidos[0].id }));
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

      // El registro está completo si tiene todos los campos requeridos populados (especialmente info_contacto/teléfono)
      const isRegistroCompleto = Boolean(formData.nombre && formData.tipo_persona_id && formData.info_contacto && formData.info_contacto.trim() !== '');

      if (personaToEdit) {
        // Editar persona existente
        await updatePersona(personaToEdit.id, {
          nombre: formData.nombre,
          tipo_persona_id: formData.tipo_persona_id,
          info_contacto: formData.info_contacto,
          registro_completo: isRegistroCompleto
        });
        alert(tm('personaEditada'));
      } else {
        // Crear nueva persona
        await createPersona({
          nombre: formData.nombre,
          tipo_persona_id: formData.tipo_persona_id,
          info_contacto: formData.info_contacto,
          registro_completo: isRegistroCompleto,
        });
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

  // Se queda montada mientras hace la salida (ver DISEÑO_SIMAR.md → Movimiento)
  const { montado, saliendo } = usePresencia(isOpen);
  if (!montado) return null;

  return (
    <div className={`${saliendo ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 bg-[rgba(11,34,54,0.55)] flex items-center justify-center z-50 p-4`}>
      <div className={`${saliendo ? 'simar-ventana-sale' : 'simar-ventana'} bg-simar-superficie rounded-[28px] p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] font-extrabold leading-tight text-simar-texto">
            {personaToEdit ? t('tituloEditar') : t('tituloCrear')}
          </h2>
          <button aria-label="Cerrar"
            onClick={onClose}
            className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingTipos ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-simar-marea-tinta border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[17px] font-bold text-simar-texto mb-2">
                    {t('nombre')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                    placeholder={t('nombre')}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[17px] font-bold text-simar-texto mb-2">
                    {t('tipo')} *
                  </label>
                  <select
                    required
                    value={formData.tipo_persona_id || ''}
                    onChange={(e) => setFormData({ ...formData, tipo_persona_id: Number(e.target.value) })}
                    className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
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
                  <label className="block text-[17px] font-bold text-simar-texto mb-2">
                    {t('telefono')}
                  </label>
                  <textarea
                    value={formData.info_contacto}
                    onChange={(e) => setFormData({ ...formData, info_contacto: e.target.value })}
                    className="w-full resize-none px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                    placeholder={`${t('email')}, ${t('telefono')}`}
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-simar-borde">
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
