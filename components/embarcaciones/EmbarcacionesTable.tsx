'use client';

import { useTranslations } from 'next-intl';
import { Buque } from '@/types/database';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Icons } from '@/components/ui/Icons';

interface EmbarcacionesTableProps {
  embarcaciones: Buque[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

function formatFechaRelativa(fecha: string): string {
  const date = new Date(fecha);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  return `Hace ${Math.floor(days / 30)} meses`;
}

export function EmbarcacionesTable({
  embarcaciones,
  onEdit,
  onDelete
}: EmbarcacionesTableProps) {
  const t = useTranslations('Embarcaciones');

  return (
    <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-xl">
          <Table>
            <TableHeader>
              <TableHead className="w-16">#</TableHead>
              <TableHead>{t('tabla.nombre')}</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead className="w-32">{t('tabla.acciones')}</TableHead>
            </TableHeader>
            <TableBody>
              {embarcaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('sinResultados')}
                  </TableCell>
                </TableRow>
              ) : (
                embarcaciones.map((buque, index) => (
                  <TableRow key={buque.id}>
                    <TableCell>
                      <span className="font-medium text-gray-500 dark:text-gray-400">#{buque.id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-base">{buque.nombre_buque}</span>
                        {buque.registro_completo === false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full" title="Registro creado automáticamente">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="hidden sm:inline">Incompleto</span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${buque.estado === 'Activo'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : buque.estado === 'En Mantenimiento'
                          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                        {buque.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap text-sm">
                        {buque.fecha_registro ? new Date(buque.fecha_registro).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : formatFechaRelativa(buque.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => onEdit?.(buque.id)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 sm:gap-1.5 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap shadow-sm"
                        >
                          <Icons.Edit />
                          <span className="hidden sm:inline">{t('acciones.editar')}</span>
                        </button>
                        <button
                          onClick={() => onDelete?.(buque.id)}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex-shrink-0"
                          title={t('acciones.eliminar')}
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

