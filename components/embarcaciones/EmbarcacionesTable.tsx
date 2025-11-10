'use client';

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
  return (
    <Table>
      <TableHeader>
        <TableHead>ID</TableHead>
        <TableHead>Nombre</TableHead>
        <TableHead>Matrícula</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Puerto Base</TableHead>
        <TableHead>Capacidad</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead>Registro</TableHead>
        <TableHead>Acciones</TableHead>
      </TableHeader>
      <TableBody>
        {embarcaciones.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              No hay buques registrados
            </TableCell>
          </TableRow>
        ) : (
          embarcaciones.map((buque) => (
            <TableRow key={buque.id}>
              <TableCell>
                <span className="font-medium text-gray-900">{buque.id}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-gray-900">{buque.nombre_buque}</span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">{buque.matricula ?? '—'}</span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">{buque.tipo_buque ?? '—'}</span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">{buque.puerto_base ?? '—'}</span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">
                  {buque.capacidad_toneladas ? `${buque.capacidad_toneladas} ton` : '—'}
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  buque.estado === 'Activo' 
                    ? 'bg-green-100 text-green-800' 
                    : buque.estado === 'En Mantenimiento'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {buque.estado}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">
                  {formatFechaRelativa(buque.created_at)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('⛴️ Click en botón EDITAR buque, buque.id:', buque.id);
                      console.log('⛴️ onEdit existe?', !!onEdit);
                      onEdit?.(buque.id);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 font-medium text-gray-700"
                  >
                    <Icons.Edit />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('⛴️ Click en botón ELIMINAR buque, buque.id:', buque.id);
                      console.log('⛴️ onDelete existe?', !!onDelete);
                      onDelete?.(buque.id);
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    title="Eliminar"
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
  );
}
