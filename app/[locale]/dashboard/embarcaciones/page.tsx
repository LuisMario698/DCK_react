'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { EmbarcacionesTable } from '@/components/embarcaciones/EmbarcacionesTable';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { Ban, CheckCircle2, Plus, Ship } from 'lucide-react';
import { Aviso, CampoBusqueda, CargandoPantalla, claseChip, EncabezadoPantalla, Tarjeta, TarjetaDato } from '@/components/ui/simar';
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
    return <CargandoPantalla texto="Cargando buques…" />;
  }

  const estadisticas = {
    total: buques.length,
    activos: buques.filter(b => b.estado === 'Activo').length,
    mantenimiento: buques.filter(b => b.estado === 'En Mantenimiento').length,
    inactivos: buques.filter(b => b.estado === 'Inactivo').length,
    incompletos: buques.filter(b => b.registro_completo === false).length,
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      {/* Lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
      <EncabezadoPantalla
        icono={Ship}
        titulo={t('titulo')}
        subtitulo={t('subtitulo')}
        acciones={
          <Button size="lg" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-[22px] h-[22px]" strokeWidth={2.4} />
            <span>{t('nuevaEmbarcacion')}</span>
          </Button>
        }
      />

      {/* Conteos (en celular, los tres en una fila con tarjetas apiladas) */}
      <div className="simar-aparece grid grid-cols-3 gap-2.5 sm:gap-4" style={{ animationDelay: '0.06s' }}>
        <TarjetaDato apilada etiqueta="Total de buques" valor={estadisticas.total} icono={Ship} />
        <TarjetaDato apilada etiqueta="Activos" valor={estadisticas.activos} icono={CheckCircle2} tono="arrecife" />
        <TarjetaDato apilada etiqueta="Inactivos" valor={estadisticas.inactivos} icono={Ban} tono="neutro" />
      </div>

      {/* Alerta de registros incompletos */}
      {estadisticas.incompletos > 0 && (
        <Aviso
          tono="advertencia"
          titulo={<>{estadisticas.incompletos} embarcación{estadisticas.incompletos > 1 ? 'es' : ''} con registro incompleto</>}
        >
          Fueron creadas automáticamente desde manifiestos. Haz clic en &quot;Editar&quot; para completar sus datos.
        </Aviso>
      )}

      {/* Búsqueda y filtro por estado */}
      <Tarjeta className="simar-aparece p-5 flex flex-col md:flex-row md:items-center gap-4">
        <CampoBusqueda
          className="flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o matrícula..."
          aria-label="Buscar embarcación"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {(['Todos', 'Activo', 'Inactivo'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              aria-pressed={filterStatus === status}
              className={claseChip(filterStatus === status)}
            >
              {status}
            </button>
          ))}
        </div>
      </Tarjeta>

      <div>
        <EmbarcacionesTable
          embarcaciones={paginatedBuques}
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
