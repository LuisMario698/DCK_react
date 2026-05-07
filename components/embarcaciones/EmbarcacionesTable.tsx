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
    <Table>
      <TableHeader>
        <TableHead className="w-14">#</TableHead>
        <TableHead>{t('tabla.nombre')}</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="hidden md:table-cell">Registro</TableHead>
        <TableHead className="text-right">{t('tabla.acciones')}</TableHead>
      </TableHeader>
      <TableBody>
        {embarcaciones.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                </svg>
                <span className="text-sm font-medium">{t('sinResultados')}</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          embarcaciones.map((buque) => (
            <TableRow key={buque.id}>
              <TableCell>
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">#{buque.id}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{buque.nombre_buque}</span>
                  {buque.registro_completo === false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/50" title="Registro incompleto">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="hidden sm:inline">Incompleto</span>
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap ${
                  buque.estado === 'Activo'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : buque.estado === 'En Mantenimiento'
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {buque.estado}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {buque.fecha_registro
                  ? new Date(buque.fecha_registro).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
                  : formatFechaRelativa(buque.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onEdit?.(buque.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 transition-all whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">{t('acciones.editar')}</span>
                  </button>
                  <button
                    onClick={() => onDelete?.(buque.id)}
                    className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
                    title={t('acciones.eliminar')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

