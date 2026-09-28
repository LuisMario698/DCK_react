'use client';

import { useTranslations } from 'next-intl';
import { Buque } from '@/types/database';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Icons } from '@/components/ui/Icons';
import { Ship } from 'lucide-react';
import { parseFechaLocal } from '@/lib/utils/fechas';

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

function colorEstado(estado: string | null | undefined): string {
  if (estado === 'Activo') return 'bg-simar-arrecife-suave text-simar-arrecife-tinta';
  if (estado === 'En Mantenimiento') return 'bg-simar-coral-suave text-simar-coral';
  return 'bg-simar-papel text-simar-texto-2';
}

export function EmbarcacionesTable({
  embarcaciones,
  onEdit,
  onDelete
}: EmbarcacionesTableProps) {
  const t = useTranslations('Embarcaciones');

  return (
    <Table>
      {/* En celular la lista no necesita cabecera: cada renglón se entiende solo */}
      <TableHeader className="movil:hidden">
        <TableHead className="hidden sm:table-cell w-14">#</TableHead>
        <TableHead>{t('tabla.nombre')}</TableHead>
        <TableHead className="hidden sm:table-cell">Estado</TableHead>
        <TableHead className="hidden md:table-cell">Registro</TableHead>
        <TableHead className="text-right">{t('tabla.acciones')}</TableHead>
      </TableHeader>
      <TableBody>
        {embarcaciones.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-16 text-center">
              <div className="flex flex-col items-center gap-3 text-simar-texto-2">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                </svg>
                <span className="text-lg font-bold text-simar-texto">{t('sinResultados')}</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          embarcaciones.map((buque) => (
            <TableRow key={buque.id}>
              <TableCell className="hidden sm:table-cell">
                <span className="text-[15px] font-mono text-simar-texto-2">#{buque.id}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                {/* En celular: un barco en un círculo, para recorrer la lista de un vistazo */}
                <span aria-hidden="true" className="hidden movil:flex w-10 h-10 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta items-center justify-center">
                  <Ship className="w-5 h-5" strokeWidth={2} />
                </span>
                <div className="flex flex-wrap items-center gap-2 movil:min-w-0 movil:gap-x-2 movil:gap-y-1">
                  <span className="text-lg font-bold text-simar-texto movil:text-[15px] movil:leading-snug">{buque.nombre_buque}</span>
                  {buque.registro_completo === false && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[15px] font-bold bg-simar-coral-suave text-simar-coral rounded-full" title="Registro incompleto">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Incompleto</span>
                    </span>
                  )}
                  {/* En celular el estado va debajo del nombre (su columna se oculta) */}
                  <span className="sm:hidden basis-full">
                    <span className={`inline-flex items-center px-3 py-0.5 text-[15px] font-bold rounded-full whitespace-nowrap ${colorEstado(buque.estado)}`}>
                      {buque.estado}
                    </span>
                  </span>
                </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className={`inline-flex items-center px-3 py-1 text-[15px] font-bold rounded-full whitespace-nowrap ${colorEstado(buque.estado)}`}>
                  {buque.estado}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell text-simar-texto-2 whitespace-nowrap">
                {buque.fecha_registro
                  ? parseFechaLocal(buque.fecha_registro).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
                  : formatFechaRelativa(buque.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit?.(buque.id)}
                    aria-label={t('acciones.editar')}
                    className="min-h-[44px] flex items-center gap-1.5 px-3.5 text-[15px] font-bold text-simar-texto border-2 border-simar-campo-borde rounded-xl bg-simar-superficie hover:border-simar-marea-tinta transition-colors whitespace-nowrap"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">{t('acciones.editar')}</span>
                  </button>
                  <button
                    onClick={() => onDelete?.(buque.id)}
                    className="w-11 h-11 flex items-center justify-center bg-simar-coral-suave text-simar-coral rounded-xl hover:bg-[#A63F0E] hover:text-white transition-colors flex-shrink-0"
                    title={t('acciones.eliminar')}
                    aria-label={t('acciones.eliminar')}
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

