import React from 'react';

interface TableProps {
  children: React.ReactNode;
}

export function Table({ children }: TableProps) {
  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full">
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
    <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
      <tr>{children}</tr>
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps {
  children: React.ReactNode;
}

export function TableRow({ children }: TableRowProps) {
  return <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">{children}</tr>;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className || ''}`}>
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
    <td className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 dark:text-gray-300 ${className || ''}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

