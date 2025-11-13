'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PersonasTable } from '@/components/personas/PersonasTable';
import { CreatePersonaModal } from '@/components/personas/CreatePersonaModal';
import { TiposPersonaManager } from '@/components/personas/TiposPersonaManager';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { getPersonas, deletePersona } from '@/lib/services/personas';
import { PersonaConTipo } from '@/types/database';

export default function PersonasPage() {
  const t = useTranslations('Personas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTiposManager, setShowTiposManager] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [personas, setPersonas] = useState<PersonaConTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [personaToEdit, setPersonaToEdit] = useState<PersonaConTipo | null>(null);

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
    console.log('🔵 Persona encontrada:', persona);
    if (persona) {
      setPersonaToEdit(persona);
      setIsModalOpen(true);
      console.log('🔵 Modal abierto con persona:', persona);
    } else {
      console.error('❌ No se encontró persona con id:', id);
    }
  };
  
  const handleDelete = async (id: number) => {
    console.log('🔴 handleDelete llamado con id:', id);
    if (confirm(t('mensajes.confirmEliminar'))) {
      try {
        console.log('🔴 Eliminando persona...');
        await deletePersona(id);
        await loadPersonas();
        alert(t('mensajes.personaEliminada'));
        console.log('🔴 Persona eliminada exitosamente');
      } catch (error) {
        console.error('❌ Error eliminando persona:', error);
        alert(t('mensajes.errorEliminar'));
      }
    } else {
      console.log('🔴 Eliminación cancelada por el usuario');
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
    activos: personas.length, // Ajustar según tu lógica
    capitanes: personas.filter(p => p.tipo_persona?.nombre_tipo === 'Capitán').length,
    tripulantes: personas.filter(p => p.tipo_persona?.nombre_tipo === 'Tripulante').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          {/* <div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
          </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Personas</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Administra el personal y tripulación del sistema</p>
          </div> */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-gray-800">{t('titulo')}</span>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">{t('subtitulo')}</p>
            </div>
          </h1>
        </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowTiposManager(!showTiposManager)} variant="secondary" className="flex-1 sm:flex-none">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">{t('gestionarTipos')}</span>
              <span className="sm:hidden">{t('gestionarTipos')}</span>
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">{t('nuevaPersona')}</span>
              <span className="sm:hidden">{t('nuevaPersona')}</span>
            </Button>
          </div>
        </div>

        {/* Gestor de Tipos de Persona */}
        {showTiposManager && (
          <div 
            className="rounded-lg sm:rounded-xl p-4 sm:p-6 relative overflow-hidden"
            style={{
              background: 'rgba(240, 240, 245, 0.25)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
            }}
          >
            <TiposPersonaManager onUpdate={loadPersonas} />
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Personas</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{estadisticas.total}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                <p className="text-sm text-gray-500 font-medium">Capitanes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.capitanes}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Tripulantes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.tripulantes}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
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
        
        <CreatePersonaModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCreate={handleCreate}
          personaToEdit={personaToEdit}
        />
      </div>
  );
}
