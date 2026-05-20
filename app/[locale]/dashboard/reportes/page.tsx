import { createServerClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/services/dashboard_stats';
import { getBuques } from '@/lib/services/buques';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function ReportesPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createServerClient();

    const [dashboardStats, buques] = await Promise.all([
        getDashboardStats(supabase),
        getBuques(supabase)
    ]);

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reportes</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Genera reportes por rango de fechas, buque y tipo de residuo</p>
            </div>

            <DashboardClient
                initialStats={dashboardStats}
                buques={buques}
                defaultTab="reportes"
                hideTabs
            />
        </div>
    );
}
