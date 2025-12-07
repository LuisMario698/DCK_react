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

export default function EmbarcacionesPage() {
  const t = useTranslations('Embarcaciones');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buques, setBuques] = useState<Buque[]>([]);
  const [loading, setLoading] = useState(true);
  const [buqueToEdit, setBuqueToEdit] = useState<Buque | null>(null);

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

  const totalItems = buques.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  const handleEdit = (id: number) => {
    console.log('🚢 handleEdit llamado con id:', id);
    const buque = buques.find(b => b.id === id);
    console.log('🚢 Buque encontrado:', buque);
    if (buque) {
      setBuqueToEdit(buque);
      setIsModalOpen(true);
      console.log('🚢 Modal abierto con buque:', buque);
    } else {
      console.error('❌ No se encontró buque con id:', id);
    }
  };

  const handleDelete = async (id: number) => {
    console.log('🔴 handleDelete llamado con id:', id);
    if (confirm(t('mensajes.confirmEliminar'))) {
      try {
        console.log('🔴 Eliminando buque...');
        await deleteBuque(id);
        await loadBuques();
        alert(t('mensajes.embarcacionEliminada'));
        console.log('🔴 Buque eliminado exitosamente');
      } catch (error) {
        console.error('❌ Error eliminando buque:', error);
        alert(t('mensajes.errorEliminar'));
      }
    } else {
      console.log('🔴 Eliminación cancelada por el usuario');
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
            <span className="text-xl sm:text-2xl font-bold text-gray-800">{t('titulo')}</span>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">{t('subtitulo')}</p>
            </div>
          </h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto">
          <Icons.Plus />
          <span>{t('nuevaEmbarcacion')}</span>
        </Button>
      </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Buques</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{estadisticas.total}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Activos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{estadisticas.activos}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Mantenimiento</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-0.5 sm:mt-1">{estadisticas.mantenimiento}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Inactivos</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{estadisticas.inactivos}</p>
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
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-orange-800">
                {estadisticas.incompletos} embarcación{estadisticas.incompletos > 1 ? 'es' : ''} con registro incompleto
              </p>
              <p className="text-sm text-orange-600">
                Fueron creadas automáticamente desde manifiestos. Haz clic en "Editar" para completar sus datos.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <EmbarcacionesTable 
            embarcaciones={buques}
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

        {isModalOpen && (
          <CreateEmbarcacionModal
            onCreate={handleCreate}
            onClose={handleCloseModal}
            buqueToEdit={buqueToEdit}
          />
        )}
      </div>
  );
}
