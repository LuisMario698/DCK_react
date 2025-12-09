'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
      setFechaRegistro(new Date().toISOString().split('T')[0]);
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
        estado: 'Activo' as const,
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
      setFechaRegistro(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error guardando buque:', error);
      alert(buqueToEdit ? tm('errorEditar') : tm('errorCrear'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold dark:text-white">
            {buqueToEdit ? t('tituloEditar') : t('tituloCrear')}
          </h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✖</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1 block">{t('nombreBuque')} *</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: La Perla Negra"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <input
              type="date"
              required
              value={fechaRegistro}
              onChange={(e) => setFechaRegistro(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-4"
            />

            {buqueToEdit && (
              <div className="mt-4">
                <label className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as 'Activo' | 'Inactivo')}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading} className="px-6">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {buqueToEdit ? 'Guardando...' : 'Creando...'}
                </span>
              ) : (
                buqueToEdit ? 'Guardar Cambios' : 'Crear Embarcación'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
