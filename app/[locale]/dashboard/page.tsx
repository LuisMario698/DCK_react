import { getBuques } from '@/lib/services/buques';
import { getDashboardStats } from '@/lib/services/dashboard_stats';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard');

  // Cargar datos iniciales en el servidor para SEO y rendimiento
  const [stats, buques] = await Promise.all([
    getDashboardStats(),
    getBuques()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('titulo')}</h1>
          <p className="text-gray-500 mt-1">Resumen general y estadísticas</p>
        </div>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Última actualización: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <DashboardClient initialStats={stats} buques={buques} />
    </div>
  );
}
