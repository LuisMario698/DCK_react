'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { EmbarcacionesTable } from '@/components/embarcaciones/EmbarcacionesTable';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { getBuques, deleteBuque } from '@/lib/services/buques';
import { CreateEmbarcacionModal } from '@/components/embarcaciones/CreateEmbarcacionModal';
import { Buque } from '@/types/database';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function EmbarcacionesPage() {
  const t = useTranslations('Embarcaciones');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buques, setBuques] = useState<Buque[]>([]);
  const [loading, setLoading] = useState(true);
  const [buqueToEdit, setBuqueToEdit] = useState<Buque | null>(null);

  // Estados para el modal de confirmación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [buqueToDelete, setBuqueToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Activo' | 'Inactivo' | 'En Mantenimiento'>('Todos');

  useEffect(() => {
    loadBuques();
  }, []);

  async function loadBuques() {
    try {
      setLoading(true);
      const data = await getBuques();
      setBuques(data);
    } catch (error) {
      console.error('Error cargando buques:', error);
      alert('Error al cargar los buques');
    } finally {
      setLoading(false);
    }
  }

  // Lógica de Filtrado y Búsqueda
  const filteredBuques = buques.filter(buque => {
    const matchesSearch =
      buque.nombre_buque.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (buque.matricula && buque.matricula.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'Todos' || buque.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Lógica de Paginación
  const totalItems = filteredBuques.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBuques = filteredBuques.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (id: number) => {
    const buque = buques.find(b => b.id === id);
    if (buque) {
      setBuqueToEdit(buque);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    setBuqueToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!buqueToDelete) return;

    try {
      setIsDeleting(true);
      await deleteBuque(buqueToDelete);
      await loadBuques();
      setDeleteModalOpen(false);
      setBuqueToDelete(null);
    } catch (error: any) {
      console.error('❌ Error eliminando buque:', error);
      setDeleteModalOpen(false);
      if (error?.code === '23503' || error?.message?.includes('violates foreign key constraint') || error?.details?.includes('is still referenced')) {
        alert('No se puede eliminar porque esta embarcación tiene manifiestos o registros asociados.\n\nSugerencia: Edítala y cambia su estado a "Inactivo".');
      } else {
        alert(t('mensajes.errorEliminar'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async () => {
    await loadBuques();
    setIsModalOpen(false);
    setBuqueToEdit(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBuqueToEdit(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando buques...</p>
        </div>
      </div>
    );
  }

  const estadisticas = {
    total: buques.length,
    activos: buques.filter(b => b.estado === 'Activo').length,
    mantenimiento: buques.filter(b => b.estado === 'En Mantenimiento').length,
    inactivos: buques.filter(b => b.estado === 'Inactivo').length,
    incompletos: buques.filter(b => b.registro_completo === false).length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18" />
              </svg>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{t('titulo')}</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg">{t('subtitulo')}</p>
            </div>
          </h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto">
          <Icons.Plus />
          <span>{t('nuevaEmbarcacion')}</span>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Total Buques</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{estadisticas.total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Activos</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5 sm:mt-1">{estadisticas.activos}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Inactivos</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300 mt-1">{estadisticas.inactivos}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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
              {estadisticas.incompletos} embarcación{estadisticas.incompletos > 1 ? 'es' : ''} con registro incompleto
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Fueron creadas automáticamente desde manifiestos. Haz clic en "Editar" para completar sus datos.
            </p>
          </div>
        </div>
      )}

      {/* Controles de búsqueda y filtro */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o matrícula..."
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Filtros de estado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(['Todos', 'Activo', 'Inactivo'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === status
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <EmbarcacionesTable
            embarcaciones={paginatedBuques}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {isModalOpen && (
        <CreateEmbarcacionModal
          onCreate={handleCreate}
          onClose={handleCloseModal}
          buqueToEdit={buqueToEdit}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar embarcación?"
        message={t('mensajes.confirmEliminar')}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </div>
  );
}
