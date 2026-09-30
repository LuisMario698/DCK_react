'use client';

import { useAvisosRecinto } from '@/components/layout/AvisosRecinto';
import { PalomitaAnimada } from '@/components/ui/movimiento';

/**
 * Insignia del saludo del Panel cuando no hay nada en "Por atender". Sin avisos sin leer dice
 * "Todo al día"; con avisos sin leer, "Nada pendiente" (los avisos son historial, no tareas, y
 * "Todo al día" junto a una campana con número se leía como contradicción).
 * Sigue a la campana en vivo; hasta que ella cuenta, usa el número que trajo el servidor.
 */
export function InsigniaCalma({ avisosIniciales }: { avisosIniciales: number }) {
  const { noLeidos, contado } = useAvisosRecinto();
  const avisos = contado ? noLeidos : avisosIniciales;
  const texto = avisos > 0 ? 'Nada pendiente' : 'Todo al día';

  return (
    // Con la clave, si cambia el texto entra de nuevo (pulso de simar-confirma)
    <span
      key={texto}
      className="simar-confirma self-start md:self-center md:ml-auto flex-shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta text-[17px] font-bold movil:min-h-[34px] movil:px-3 movil:text-[14px]"
    >
      <PalomitaAnimada tamano={18} circulo={false} />
      {texto}
    </span>
  );
}
