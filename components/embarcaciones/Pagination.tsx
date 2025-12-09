'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <div className="text-xs text-gray-700 dark:text-gray-300">
        Mostrando del <span className="font-medium text-gray-800 dark:text-white">{startItem}</span> al{' '}
        <span className="font-medium text-gray-800 dark:text-white">{endItem}</span> de{' '}
        <span className="font-medium text-gray-800 dark:text-white">{totalItems}</span> registros
      </div>

      <div className="flex items-center gap-2">
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <div className="flex gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Primero
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Anterior
          </button>

          <div className="min-w-[36px] px-3 py-1 text-xs bg-blue-500 dark:bg-blue-600 text-white font-medium rounded flex items-center justify-center">
            {currentPage}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Siguiente
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Último
          </button>
        </div>
      </div>
    </div>
  );
}

