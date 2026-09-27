'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PersonasTable } from '@/components/personas/PersonasTable';
import { CreatePersonaModal } from '@/components/personas/CreatePersonaModal';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { ChefHat, Plus, Users, Wrench } from 'lucide-react';
import { Aviso, CampoBusqueda, CargandoPantalla, claseChip, EncabezadoPantalla, Tarjeta, TarjetaDato } from '@/components/ui/simar';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');

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

  // Lógica de Filtrado y Búsqueda
  const filteredPersonas = personas.filter(persona => {
    const matchesSearch =
      persona.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (persona.info_contacto && persona.info_contacto.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = filterRole === 'Todos' || persona.tipo_persona?.nombre_tipo === filterRole;

    return matchesSearch && matchesRole;
  });

  // Lógica de Paginación
  const totalItems = filteredPersonas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonas = filteredPersonas.slice(startIndex, startIndex + itemsPerPage);

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

  const roles = ['Todos', 'Motorista', 'Cocinero'];

  return (
    <div className="max-w-[1600px] space-y-6">
      {/* Lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
      <EncabezadoPantalla
        icono={Users}
        titulo={t('titulo')}
        subtitulo={t('subtitulo')}
        acciones={
          <Button size="lg" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-[22px] h-[22px]" strokeWidth={2.4} />
            <span>{t('nuevaPersona')}</span>
          </Button>
        }
      />

      {/* Conteos */}
      <div className="simar-aparece grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ animationDelay: '0.06s' }}>
        <TarjetaDato etiqueta="Total de personas" valor={estadisticas.total} icono={Users} />
        <TarjetaDato etiqueta="Motoristas" valor={estadisticas.motoristas} icono={Wrench} tono="neutro" />
        <TarjetaDato etiqueta="Cocineros" valor={estadisticas.cocineros} icono={ChefHat} tono="neutro" />
      </div>

      {/* Alerta de registros incompletos */}
      {estadisticas.incompletos > 0 && (
        <Aviso
          tono="advertencia"
          titulo={<>{estadisticas.incompletos} persona{estadisticas.incompletos > 1 ? 's' : ''} con registro incompleto</>}
        >
          Fueron creadas automáticamente desde manifiestos. Haz clic en &quot;Editar&quot; para completar sus datos.
        </Aviso>
      )}

      {/* Búsqueda y filtro por rol */}
      <Tarjeta className="simar-aparece p-5 flex flex-col md:flex-row md:items-center gap-4">
        <CampoBusqueda
          className="flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o contacto..."
          aria-label="Buscar persona"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por rol">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              aria-pressed={filterRole === role}
              className={claseChip(filterRole === role)}
            >
              {role}
            </button>
          ))}
        </div>
      </Tarjeta>

      {loading ? (
        <CargandoPantalla texto="Cargando personas…" />
      ) : (
        <div>
          <PersonasTable
            personas={paginatedPersonas}
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
      )}

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
