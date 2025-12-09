'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PersonasTable } from '@/components/personas/PersonasTable';
import { CreatePersonaModal } from '@/components/personas/CreatePersonaModal';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { getPersonas, deletePersona } from '@/lib/services/personas';
import { PersonaConTipo } from '@/types/database';

import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function PersonasPage() {
  const t = useTranslations('Personas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [personas, setPersonas] = useState<PersonaConTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [personaToEdit, setPersonaToEdit] = useState<PersonaConTipo | null>(null);

  // Estados para el modal de confirmación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  async function loadPersonas() {
    try {
      setLoading(true);
      const data = await getPersonas();
      setPersonas(data);
    } catch (error) {
      console.error('Error cargando personas:', error);
      alert('Error al cargar las personas');
    } finally {
      setLoading(false);
    }
  }

  const totalItems = personas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleEdit = (id: number) => {
    console.log('🔵 handleEdit llamado con id:', id);
    const persona = personas.find(p => p.id === id);
    if (persona) {
      setPersonaToEdit(persona);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    setPersonaToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!personaToDelete) return;

    try {
      setIsDeleting(true);
      await deletePersona(personaToDelete);
      await loadPersonas();
      setDeleteModalOpen(false);
      setPersonaToDelete(null);
    } catch (error: any) {
      console.error('❌ Error eliminando persona:', error);
      setDeleteModalOpen(false);

      // Manejo de errores de llave foránea (similar a embarcaciones)
      if (error?.code === '23503' || error?.message?.includes('violates foreign key constraint') || error?.details?.includes('is still referenced')) {
        alert('No se puede eliminar porque esta persona tiene registros asociados (ej. Manifiestos o Buques).\n\nSugerencia: Edítala y cambia su estado a "Inactivo" si es posible.');
      } else {
        alert(t('mensajes.errorEliminar'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async () => {
    await loadPersonas();
    setIsModalOpen(false);
    setPersonaToEdit(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPersonaToEdit(null);
  };

  const estadisticas = {
    total: personas.length,
    motoristas: personas.filter(p => p.tipo_persona?.nombre_tipo === 'Motorista').length,
    cocineros: personas.filter(p => p.tipo_persona?.nombre_tipo === 'Cocinero').length,
    incompletos: personas.filter(p => p.registro_completo === false).length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{t('titulo')}</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg">{t('subtitulo')}</p>
            </div>
          </h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">{t('nuevaPersona')}</span>
            <span className="sm:hidden">{t('nuevaPersona')}</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Total Personas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{estadisticas.total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Total Motoristas</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5 sm:mt-1">{estadisticas.motoristas}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Cocineros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{estadisticas.cocineros}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de registros incompletos */}
      {estadisticas.incompletos > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-orange-800 dark:text-orange-300">
              {estadisticas.incompletos} persona{estadisticas.incompletos > 1 ? 's' : ''} con registro incompleto
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Fueron creadas automáticamente desde manifiestos. Haz clic en "Editar" para completar sus datos.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <PersonasTable
          personas={personas}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      <CreatePersonaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreate}
        personaToEdit={personaToEdit}
      />

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar persona?"
        message={t('mensajes.confirmEliminar')}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </div>
  );
}
