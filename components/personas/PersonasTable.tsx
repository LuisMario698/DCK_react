'use client';

import { Persona } from '@/types/persona';
import { formatFechaRelativa } from '@/lib/data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface PersonasTableProps {
  personas: Persona[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function PersonasTable({ 
  personas,
  onEdit,
  onDelete 
}: PersonasTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableHead>ID</TableHead>
        <TableHead>Nombre</TableHead>
        <TableHead>Apellido</TableHead>
        <TableHead>Cédula</TableHead>
        <TableHead>Teléfono</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Rol</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead>Creado</TableHead>
        <TableHead>Actualizado</TableHead>
        <TableHead>Acciones</TableHead>
      </TableHeader>
      <TableBody>
        {personas.map((persona) => (
          <TableRow key={persona.id}>
            <TableCell>
              <span className="font-medium text-gray-900">{persona.id}</span>
            </TableCell>
            <TableCell>
              <span className="font-medium text-gray-900">{persona.nombre}</span>
            </TableCell>
            <TableCell>
              <span className="font-medium text-gray-900">{persona.apellido}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{persona.cedula}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{persona.telefono}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{persona.email}</span>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {persona.rol}
              </span>
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                persona.estado === 'Activo' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {persona.estado}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{formatFechaRelativa(persona.creado)}</span>
            </TableCell>
            <TableCell>
              <span className="text-gray-600">{formatFechaRelativa(persona.actualizado)}</span>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(persona.id)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 font-medium text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onDelete?.(persona.id)}
                  className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
