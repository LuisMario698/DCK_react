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
        <div className="overflow-hidden border border-gray-200 sm:rounded-xl">
          <Table>
            <TableHeader>
              <TableHead className="hidden sm:table-cell">ID</TableHead>
              <TableHead>{t('tabla.nombre')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('tabla.matricula')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('tabla.tipo')}</TableHead>
              <TableHead className="hidden xl:table-cell">Puerto Base</TableHead>
              <TableHead className="hidden lg:table-cell">Capacidad</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Registro</TableHead>
              <TableHead>{t('tabla.acciones')}</TableHead>
            </TableHeader>
            <TableBody>
              {embarcaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    {t('sinResultados')}
                  </TableCell>
                </TableRow>
              ) : (
                embarcaciones.map((buque) => (
                  <TableRow key={buque.id}>
                    <TableCell className="hidden sm:table-cell">
                      <span className="font-medium text-gray-900">{buque.id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[150px]">
                        <span className="font-medium text-gray-900 text-sm sm:text-base">{buque.nombre_buque}</span>
                        <div className="text-xs text-gray-500 mt-0.5 sm:hidden">
                          {buque.matricula || '—'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-gray-600 whitespace-nowrap">{buque.matricula ?? '—'}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-gray-600 whitespace-nowrap">{buque.tipo_buque ?? '—'}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-gray-600 whitespace-nowrap">{buque.puerto_base ?? '—'}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-gray-600 whitespace-nowrap">
                        {buque.capacidad_toneladas ? `${buque.capacidad_toneladas} ton` : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        buque.estado === 'Activo' 
                          ? 'bg-green-100 text-green-800' 
                          : buque.estado === 'En Mantenimiento'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {buque.estado}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-gray-600 whitespace-nowrap">
                        {formatFechaRelativa(buque.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2 min-w-[120px]">
                        <button
                          onClick={() => {
                            console.log('⛴️ Click en botón EDITAR buque, buque.id:', buque.id);
                            console.log('⛴️ onEdit existe?', !!onEdit);
                            onEdit?.(buque.id);
                          }}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-1.5 font-medium text-gray-700 whitespace-nowrap"
                        >
                          <Icons.Edit />
                          <span className="hidden sm:inline">{t('acciones.editar')}</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('⛴️ Click en botón ELIMINAR buque, buque.id:', buque.id);
                            console.log('⛴️ onDelete existe?', !!onDelete);
                            onDelete?.(buque.id);
                          }}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
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
