'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
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
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between mt-4 px-2 flex-wrap gap-3">
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Mostrando{' '}
        <span className="font-semibold text-gray-800 dark:text-white">{startItem}–{endItem}</span>
        {' '}de{' '}
        <span className="font-semibold text-gray-800 dark:text-white">{totalItems}</span>
        {' '}registros
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Selector de filas por página */}
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all"
        >
          <option value={10}>10 / pág.</option>
          <option value={25}>25 / pág.</option>
          <option value={50}>50 / pág.</option>
          <option value={100}>100 / pág.</option>
        </select>

        {/* Botones de navegación */}
        <div className="flex items-center gap-1">
          {/* Anterior */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Página anterior"
          >
            ‹
          </button>

          {/* Números de página */}
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-gray-400 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[32px] px-2.5 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                  currentPage === p
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/50'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400'
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Siguiente */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Página siguiente"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
