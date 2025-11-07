'use client';

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
  const getTipoColor = (tipo: string | undefined) => {
    switch (tipo) {
      case 'Capitán':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Tripulante':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Administrativo':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Inspector':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableHead>ID</TableHead>
        <TableHead>Nombre</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Información de Contacto</TableHead>
        <TableHead>Registro</TableHead>
        <TableHead>Acciones</TableHead>
      </TableHeader>
      <TableBody>
        {personas.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
              No hay personas registradas
            </TableCell>
          </TableRow>
        ) : (
          personas.map((persona) => {
            const iniciales = persona.nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2);
            
            return (
              <TableRow key={persona.id}>
                <TableCell>
                  <span className="font-semibold text-gray-900">{persona.id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm uppercase">
                      {iniciales}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{persona.nombre}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getTipoColor(persona.tipo_persona?.nombre_tipo)}`}>
                    {persona.tipo_persona?.nombre_tipo || 'Sin tipo'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-700 max-w-xs truncate">
                    {persona.info_contacto || '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700">
                      {formatFechaRelativa(persona.created_at)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ID: {persona.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(persona.id)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-1.5 font-medium text-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onDelete?.(persona.id)}
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
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
