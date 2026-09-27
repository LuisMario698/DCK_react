'use client';

import { useState, useEffect } from 'react';
import { hoyLocal } from '@/lib/utils/fechas';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createBuque, updateBuque } from '@/lib/services/buques';
import { Buque } from '@/types/database';

interface Props {
  onCreate: () => void;
  onClose: () => void;
  buqueToEdit?: Buque | null;
}

export function CreateEmbarcacionModal({ onCreate, onClose, buqueToEdit }: Props) {
  const t = useTranslations('Embarcaciones.modal');
  const tm = useTranslations('Embarcaciones.mensajes');

  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [estado, setEstado] = useState<'Activo' | 'Inactivo' | 'En Mantenimiento'>('Activo');

  // Cargar datos si estamos editando
  useEffect(() => {
    if (buqueToEdit) {
      setNombre(buqueToEdit.nombre_buque);
      setEstado(buqueToEdit.estado);
      setFechaRegistro(buqueToEdit.fecha_registro.split('T')[0]);
    } else {
      setNombre('');
      setEstado('Activo');
      setFechaRegistro(hoyLocal());
    }
  }, [buqueToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const buqueData = {
        nombre_buque: nombre,
        tipo_buque: 'Barco', // Valor por defecto
        matricula: null,
        puerto_base: null,
        capacidad_toneladas: null,
        estado: estado,
        propietario_id: null,
        fecha_registro: fechaRegistro,
        registro_completo: true
      };

      if (buqueToEdit) {
        await updateBuque(buqueToEdit.id, buqueData);
        alert(tm('embarcacionEditada'));
      } else {
        try {
          await createBuque(buqueData);
          alert(tm('embarcacionCreada'));
        } catch (err: any) {
          // Capturar error de índice único (código Postgres 23505)
          if (err.code === '23505' || err.message?.includes('unique') || err.details?.includes('already exists')) {
            alert('Error: Ya existe una embarcación con este nombre.');
            setLoading(false);
            return;
          }
          throw err;
        }
      }

      onCreate();
      onClose();
      setNombre('');
      setFechaRegistro(hoyLocal());
    } catch (error) {
      console.error('Error guardando buque:', error);
      alert(buqueToEdit ? tm('errorEditar') : tm('errorCrear'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(11,34,54,0.55)]">
      <div role="dialog" aria-modal="true" className="simar-aparece w-full max-w-lg bg-simar-superficie rounded-[28px] shadow-2xl p-7">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h3 className="text-[22px] font-extrabold leading-tight text-simar-texto">
            {buqueToEdit ? t('tituloEditar') : t('tituloCrear')}
          </h3>
          <button onClick={onClose} aria-label="Cerrar" className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[17px] font-bold text-simar-texto mb-2 block">{t('nombreBuque')} *</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: La Perla Negra"
              className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
            />


            {buqueToEdit && (
              <div className="mt-4">
                <label className="text-[17px] font-bold text-simar-texto mb-2 block">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as 'Activo' | 'Inactivo')}
                  className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading} className="px-6">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {buqueToEdit ? 'Guardando...' : 'Creando...'}
                </span>
              ) : (
                buqueToEdit ? 'Guardar cambios' : 'Crear embarcación'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
