'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { PenLine } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { interpretarSinTerminar, leerTextoSinTerminar, suscribirSinTerminar } from '@/lib/utils/manifiestoSinTerminar';
import { clasePastilla } from './pastilla';

/**
 * Pastilla de la tarjeta Manifiesto del Panel. Si en este equipo quedó un manifiesto sin terminar,
 * lo dice ("Sin terminar: Don Chuy II"; al entrar, la pantalla ofrece continuarlo); si no, el último
 * guardado ("Último: hace 2 h"). Lo guardado vive en el navegador: en el servidor sale lo segundo.
 */
export function PastillaManifiesto({ ultimo }: { ultimo?: string }) {
  const { user } = useAuth();
  const usuarioId = user?.id ?? null;
  const texto = useSyncExternalStore(
    suscribirSinTerminar,
    () => (usuarioId ? leerTextoSinTerminar(usuarioId) : null),
    () => null
  );
  const sinTerminar = useMemo(() => interpretarSinTerminar(texto), [texto]);

  if (sinTerminar) {
    return (
      <span className={clasePastilla(true, true)}>
        <PenLine aria-hidden="true" className="w-4 h-4 flex-shrink-0" strokeWidth={2.4} />
        Sin terminar: {sinTerminar.nombres.buque.trim() || 'sin barco todavía'}
      </span>
    );
  }
  return ultimo ? <span className={clasePastilla(true)}>{ultimo}</span> : null;
}
