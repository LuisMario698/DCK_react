import { createServerClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/services/dashboard_stats';
import { getBuques } from '@/lib/services/buques';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { BarChart3 } from 'lucide-react';
import { EncabezadoPantalla } from '@/components/ui/simar';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createServerClient();

    // Obtener datos iniciales en paralelo
    const [dashboardStats, buques] = await Promise.all([
        getDashboardStats(supabase),
        getBuques(supabase)
    ]);

    return (
        <div className="max-w-[1600px] space-y-6">
            {/* Lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
            <EncabezadoPantalla
                icono={BarChart3}
                tono="violeta"
                titulo="Estadísticas y reportes"
                subtitulo="Análisis detallado de recolección y generación de residuos"
            />

            <DashboardClient initialStats={dashboardStats} buques={buques} />
        </div>
    );
}
