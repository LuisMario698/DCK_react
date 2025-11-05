'use client';

import { Embarcacion } from '@/types/embarcacion';
import { formatFechaRelativa } from '@/lib/data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Icons } from '@/components/ui/Icons';

interface EmbarcacionesTableProps {
  embarcaciones: Embarcacion[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
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
        <TableHead>Bandera</TableHead>
        <TableHead>Propietario</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Creado</TableHead>
        <TableHead>Actualizado</TableHead>
        <TableHead>Acciones</TableHead>
      </TableHeader>
      <TableBody>
        {embarcaciones.map((embarcacion) => (
          <TableRow key={embarcacion.id}>
            <TableCell>
              <span className="font-medium text-gray-900">{embarcacion.id}</span>
            </TableCell>
            <TableCell>
              <span className="font-medium text-gray-900">{embarcacion.nombre}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{embarcacion.matricula ?? '—'}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{embarcacion.bandera ?? '—'}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{embarcacion.propietario ?? '—'}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{embarcacion.tipoEmbarcacion}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{formatFechaRelativa(embarcacion.creado)}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{formatFechaRelativa(embarcacion.actualizado)}</span>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(embarcacion.id)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 font-medium text-gray-700"
                >
                  <Icons.Edit />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onDelete?.(embarcacion.id)}
                  className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Eliminar"
                >
                  <Icons.Trash />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
