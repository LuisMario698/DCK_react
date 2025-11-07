'use client';

import { Manifiesto } from '@/types/manifiesto';
import { formatFechaRelativa } from '@/lib/data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface ManifiestosTableProps {
  manifiestos: Manifiesto[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
}

export function ManifiestosTable({ 
  manifiestos,
  onEdit,
  onDelete,
  onView 
}: ManifiestosTableProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Pendiente':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Inactivo':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableHead>ID</TableHead>
        <TableHead>Responsable</TableHead>
        <TableHead>Embarcación</TableHead>
        <TableHead>Descripción</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead>Fecha de creación</TableHead>
        <TableHead>Acciones</TableHead>
      </TableHeader>
      <TableBody>
        {manifiestos.map((manifiesto) => (
          <TableRow key={manifiesto.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  {manifiesto.id}
                </div>
                <span className="font-semibold text-gray-900">#{manifiesto.id.toString().padStart(3, '0')}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {manifiesto.personaNombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{manifiesto.personaNombre}</p>
                  <p className="text-xs text-gray-500">ID Persona: {manifiesto.personaId}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{manifiesto.embarcacionNombre}</p>
                  <p className="text-xs text-gray-500">ID: {manifiesto.embarcacionId}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="max-w-xs">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {manifiesto.descripcion || 'Sin descripción'}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(manifiesto.estado)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  manifiesto.estado === 'Activo' ? 'bg-green-500' : 
                  manifiesto.estado === 'Pendiente' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></span>
                {manifiesto.estado}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {formatFechaRelativa(manifiesto.fechaCreacion)}
                </span>
                <span className="text-xs text-gray-400">
                  {manifiesto.fechaCreacion.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <button
                  onClick={() => onView?.(manifiesto.id)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1.5 font-medium"
                  title="Ver detalles"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Ver</span>
                </button>
                <button
                  onClick={() => onEdit?.(manifiesto.id)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-1.5 font-medium text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onDelete?.(manifiesto.id)}
                  className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
