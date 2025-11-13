import { Icons } from '@/components/ui/Icons';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';
import { getManifiestosBasuron } from '@/lib/services/manifiesto_basuron';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard');
  
  const [buques, personas, manifiestos] = await Promise.all([
    getBuques(),
    getPersonas(),
    getManifiestosBasuron()
  ]);
  
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('titulo')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tarjetas de estadísticas */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('estadisticas.totalBuques')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{buques.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Icons.Ship />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('estadisticas.totalPersonas')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{personas.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                <Icons.Users />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3">{t('subtitulo')}</h2>
        </div>
      </div>
  );
}
