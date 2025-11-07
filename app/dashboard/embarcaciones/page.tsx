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
  const [showCreate, setShowCreate] = useState(false);
  const [buques, setBuques] = useState<Buque[]>([]);
  const [loading, setLoading] = useState(true);

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
    alert(`Editar buque ${id} - Funcionalidad próximamente`);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este buque?')) {
      try {
        await deleteBuque(id);
        await loadBuques(); // Recargar lista
        alert('Buque eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando buque:', error);
        alert('Error al eliminar el buque');
      }
    }
  };

  const handleCreate = () => {
    setShowCreate(true);
  };

  const handleCreateSubmit = async () => {
    await loadBuques(); // Recargar lista después de crear
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Buques</h1>
          <Button onClick={handleCreate} className="gap-2">
            <Icons.Plus />
            <span>Crear Buque</span>
          </Button>
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

        {showCreate && (
          <CreateEmbarcacionModal
            onCreate={handleCreateSubmit}
            onClose={() => setShowCreate(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
