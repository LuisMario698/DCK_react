'use client';

import { useTranslations } from 'next-intl';
import { PersonaConTipo } from '@/types/database';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface PersonasTableProps {
  personas: PersonaConTipo[];
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

export function PersonasTable({
  personas,
  onEdit,
  onDelete
}: PersonasTableProps) {
  const t = useTranslations('Personas');

  const getTipoColor = (tipo: string | undefined) => {
    switch (tipo) {
      case 'Capitán':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Tripulante':
        return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Administrativo':
        return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Inspector':
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableHead className="hidden sm:table-cell w-14">ID</TableHead>
        <TableHead>{t('tabla.nombre')}</TableHead>
        <TableHead className="hidden md:table-cell">{t('tabla.tipo')}</TableHead>
        <TableHead className="hidden lg:table-cell">{t('tabla.telefono')}</TableHead>
        <TableHead className="hidden md:table-cell">Registro</TableHead>
        <TableHead className="text-right">{t('tabla.acciones')}</TableHead>
      </TableHeader>
      <TableBody>
        {personas.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">{t('sinResultados')}</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          personas.map((persona) => (
            <TableRow key={persona.id}>
              <TableCell className="hidden sm:table-cell">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">#{persona.id}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{persona.nombre}</span>
                  {persona.registro_completo === false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/50" title="Registro incompleto">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="hidden sm:inline">Incompleto</span>
                    </span>
                  )}
                  <span className="text-xs text-gray-400 sm:hidden">#{persona.id}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${getTipoColor(persona.tipo_persona?.nombre_tipo)}`}>
                  {persona.tipo_persona?.nombre_tipo || 'Sin tipo'}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {persona.info_contacto || <span className="text-gray-300 dark:text-gray-600">—</span>}
              </TableCell>
              <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {new Date(persona.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onEdit?.(persona.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 transition-all whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">{t('acciones.editar')}</span>
                  </button>
                  <button
                    onClick={() => onDelete?.(persona.id)}
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

