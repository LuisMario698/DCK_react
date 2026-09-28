import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-simar-borde shadow-simar bg-simar-superficie ${className || ''}`}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead>
      <tr className="bg-simar-papel border-b border-simar-borde">
        {children}
      </tr>
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return (
    <tbody className="divide-y divide-simar-borde-suave">
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

export function TableRow({ children, className }: TableRowProps) {
  return (
    <tr className={`bg-simar-superficie hover:bg-simar-papel/60 transition-colors duration-150 ${className || ''}`}>
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th className={`px-4 md:px-5 py-3.5 text-left text-[15px] font-bold text-simar-texto-2 whitespace-nowrap ${className || ''}`}>
      {children}
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  colSpan?: number;
  className?: string;
}

export function TableCell({ children, colSpan, className }: TableCellProps) {
  return (
    <td className={`px-4 md:px-5 py-4 text-base text-simar-texto ${className || ''}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
