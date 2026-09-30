import { createServerClient } from '@/lib/supabase/server';
import { getEmbarcacionesSinEntregar, getEstadisticasPeriodo } from '@/lib/services/dashboard_stats';
import { getBuques } from '@/lib/services/buques';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { BarChart3 } from 'lucide-react';
import { EncabezadoPantalla } from '@/components/ui/simar';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage() {
    const supabase = await createServerClient();

    // El período inicial ("1 mes") llega ya calculado; los demás se piden al elegirlos.
    // "Sin entregar" no depende del período: se pide una vez (si falla, la pantalla sigue sin él).
    const [estadisticas, buques, sinEntregar] = await Promise.all([
        getEstadisticasPeriodo(supabase, 'mes'),
        getBuques(supabase),
        getEmbarcacionesSinEntregar(supabase).catch((e) => {
            console.error('Error cargando embarcaciones sin entregar:', e);
            return undefined;
        }),
    ]);

    return (
        <div className="max-w-[1600px] space-y-6">
            {/* Lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
            <EncabezadoPantalla
                icono={BarChart3}
                tono="violeta"
                titulo="Estadísticas y reportes"
                subtitulo="Lo que se recibe en el recinto y cómo cambia con el tiempo"
            />

            <DashboardClient inicial={estadisticas} buques={buques} sinEntregar={sinEntregar} />
        </div>
    );
}
