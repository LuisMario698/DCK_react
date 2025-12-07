
import { createServerClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/services/dashboard_stats';
import { getBuques } from '@/lib/services/buques';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

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
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Estadísticas y Reportes</h1>
                <p className="text-gray-500 mt-1">Análisis detallado de recolección y generación de residuos</p>
            </div>

            <DashboardClient initialStats={dashboardStats} buques={buques} />
        </div>
    );
}
