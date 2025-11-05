'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PersonasTable } from '@/components/personas/PersonasTable';
import { CreatePersonaModal, PersonaFormData } from '@/components/personas/CreatePersonaModal';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { getPersonas } from '@/lib/data';

export default function PersonasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const personas = getPersonas();
  const totalItems = personas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const handleEdit = (id: number) => {
    alert(`Editar persona ${id}`);
  };
  
  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta persona?')) {
      alert(`Eliminar persona ${id}`);
    }
  };
  
  const handleCreate = (data: PersonaFormData) => {
    console.log('Crear persona:', data);
    alert(`Persona creada: ${data.nombre} ${data.apellido}`);
    setIsModalOpen(false);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Personas</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear
          </Button>
        </div>
        
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
      </div>
      
      <CreatePersonaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </DashboardLayout>
  );
}
