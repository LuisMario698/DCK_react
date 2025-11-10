'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmbarcacionesTable } from '@/components/embarcaciones/EmbarcacionesTable';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { getBuques, deleteBuque } from '@/lib/services/buques';
import { CreateEmbarcacionModal } from '@/components/embarcaciones/CreateEmbarcacionModal';
import { Buque } from '@/types/database';

export default function EmbarcacionesPage() {
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
    if (confirm('¿Estás seguro de eliminar este buque?')) {
      try {
        console.log('🔴 Eliminando buque...');
        await deleteBuque(id);
        await loadBuques();
        alert('Buque eliminado exitosamente');
        console.log('🔴 Buque eliminado exitosamente');
      } catch (error) {
        console.error('❌ Error eliminando buque:', error);
        alert('Error al eliminar el buque');
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando buques...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const estadisticas = {
    total: buques.length,
    activos: buques.filter(b => b.estado === 'Activo').length,
    mantenimiento: buques.filter(b => b.estado === 'En Mantenimiento').length,
    inactivos: buques.filter(b => b.estado === 'Inactivo').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Buques</h1>
            <p className="text-sm text-gray-500 mt-1">Administra la flota de embarcaciones</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Icons.Plus />
            <span>Nuevo Buque</span>
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Buques</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Activos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{estadisticas.activos}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">En Mantenimiento</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{estadisticas.mantenimiento}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </DashboardLayout>
  );
}
