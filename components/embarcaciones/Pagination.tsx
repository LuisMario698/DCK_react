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
  const botonExtremo = 'hidden sm:block min-h-[44px] px-3.5 text-[15px] font-bold text-simar-texto border-2 border-simar-campo-borde rounded-xl bg-simar-superficie hover:border-simar-marea-tinta disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
  const botonPaso = 'flex-1 sm:flex-none min-h-[52px] sm:min-h-[44px] px-3.5 text-[15px] font-bold text-simar-texto border-2 border-simar-campo-borde rounded-xl bg-simar-superficie hover:border-simar-marea-tinta disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  return (
    // En celular: resumen y "por página" en una fila; abajo Anterior · página · Siguiente a lo ancho
    // ("Primero" y "Último" sólo desde 640 px, donde caben).
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 px-1">
      <div className="flex-1 min-w-0 text-base text-simar-texto-2">
        Mostrando del <span className="font-bold text-simar-texto">{startItem}</span> al{' '}
        <span className="font-bold text-simar-texto">{endItem}</span> de{' '}
        <span className="font-bold text-simar-texto">{totalItems}</span> registros
      </div>

      <select
        aria-label="Registros por página"
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="font-bold px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>

      <div className="basis-full sm:basis-auto flex gap-1.5 sm:gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={botonExtremo}>
          Primero
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={botonPaso}>
          Anterior
        </button>

        <div aria-current="page" className="min-w-[52px] sm:min-w-[44px] min-h-[52px] sm:min-h-[44px] px-3 text-[15px] bg-simar-marea text-white font-bold rounded-xl flex items-center justify-center whitespace-nowrap">
          {currentPage}
          <span className="sm:hidden font-medium">&nbsp;de {Math.max(totalPages, 1)}</span>
        </div>

        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={botonPaso}>
          Siguiente
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className={botonExtremo}>
          Último
        </button>
      </div>
    </div>
  );
}
