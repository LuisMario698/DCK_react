import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 ${className || ''}`}>
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
      <tr className="bg-gray-50 dark:bg-slate-700/60 border-b border-gray-200 dark:border-slate-600">
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
    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
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
    <tr className={`bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors duration-150 ${className || ''}`}>
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
    <th className={`px-4 md:px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap ${className || ''}`}>
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
    <td className={`px-4 md:px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 ${className || ''}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
