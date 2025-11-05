'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmbarcacionesTable } from '@/components/embarcaciones/EmbarcacionesTable';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { getEmbarcaciones } from '@/lib/data';
import { CreateEmbarcacionModal } from '@/components/embarcaciones/CreateEmbarcacionModal';
import { Embarcacion } from '@/types/embarcacion';

export default function EmbarcacionesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreate, setShowCreate] = useState(false);

  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>(() => getEmbarcaciones());

  const totalItems = embarcaciones.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handleEdit = (id: number) => {
    alert(`Editar embarcación ${id}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta embarcación?')) {
      setEmbarcaciones((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleCreate = () => {
    setShowCreate(true);
  };

  const handleCreateSubmit = (data: Embarcacion) => {
    setEmbarcaciones((prev) => [data, ...prev]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Panel principal</h1>
          <Button onClick={handleCreate} className="gap-2">
            <Icons.Plus />
            <span>Crear</span>
          </Button>
        </div>

        <div className="space-y-4">
          <EmbarcacionesTable 
            embarcaciones={embarcaciones}
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
