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
    <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-xl">
          <Table>
            <TableHeader>
              <TableHead className="hidden sm:table-cell">ID</TableHead>
              <TableHead>{t('tabla.nombre')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('tabla.tipo')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('tabla.telefono')}</TableHead>
              <TableHead className="hidden md:table-cell">Registro</TableHead>
              <TableHead>{t('tabla.acciones')}</TableHead>
            </TableHeader>
            <TableBody>
              {personas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('sinResultados')}
                  </TableCell>
                </TableRow>
              ) : (
                personas.map((persona) => {
                  const iniciales = persona.nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2);

                  return (
                    <TableRow key={persona.id}>
                      <TableCell className="hidden sm:table-cell">
                        <span className="font-semibold text-gray-900 dark:text-white">{persona.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3 min-w-[150px]">

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{persona.nombre}</p>
                              {persona.registro_completo === false && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full" title="Registro creado automáticamente - Falta completar datos">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span className="hidden sm:inline">Incompleto</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">ID: {persona.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getTipoColor(persona.tipo_persona?.nombre_tipo)}`}>
                          {persona.tipo_persona?.nombre_tipo || 'Sin tipo'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {persona.info_contacto || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {new Date(persona.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2 min-w-[120px]">
                          <button
                            onClick={() => {
                              console.log('⭐ Click en botón EDITAR, persona.id:', persona.id);
                              console.log('⭐ onEdit existe?', !!onEdit);
                              onEdit?.(persona.id);
                            }}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all flex items-center gap-1 sm:gap-1.5 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">{t('acciones.editar')}</span>
                          </button>
                          <button
                            onClick={() => {
                              console.log('⭐ Click en botón ELIMINAR, persona.id:', persona.id);
                              console.log('⭐ onDelete existe?', !!onDelete);
                              onDelete?.(persona.id);
                            }}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all shadow-sm hover:shadow flex-shrink-0"
                            title={t('acciones.eliminar')}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

