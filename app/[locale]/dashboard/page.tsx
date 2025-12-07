import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Componente de Tarjeta Grande para el menú principal
const ActionCard = ({
  title,
  icon,
  description,
  href
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  href: string;
}) => (
  <Link
    href={href}
    className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl bg-white hover:bg-blue-500 border-2 border-gray-200 hover:border-blue-500 w-full h-48 md:h-56 group"
  >
    <div className="p-4 rounded-xl mb-3 transition-all bg-gray-100 group-hover:bg-blue-400">
      <div className="transition-colors group-hover:[&_svg]:text-white">
        {icon}
      </div>
    </div>
    <h3 className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-white text-center transition-colors">{title}</h3>
    <p className="text-gray-500 group-hover:text-blue-100 text-center text-sm md:text-base mt-2 transition-colors">{description}</p>
  </Link>
);

// Iconos SVG grandes y claros
const ManifiestoIcon = () => (
  <svg className="w-12 h-12 md:w-14 md:h-14 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BasuronIcon = () => (
  <svg className="w-12 h-12 md:w-14 md:h-14 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const EstadisticasIcon = () => (
  <svg className="w-12 h-12 md:w-14 md:h-14 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ShipIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18" />
  </svg>
);

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col justify-center">
      {/* Header con logo y título */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-4 mb-4">
          <div className="bg-blue-600 text-white p-3 rounded-xl">
            <ShipIcon />
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">CDK Recolección</h1>
            <p className="text-gray-500 text-sm md:text-base">Puerto Peñasco, Sonora</p>
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mt-6">
          ¡Hola! 👋 ¿Qué vamos a hacer?
        </h2>
      </div>

      {/* Tarjetas de Acciones - Layout horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full px-4">
        <ActionCard
          title="Manifiesto"
          icon={<ManifiestoIcon />}
          description="Recolección de barco"
          href={`/${locale}/dashboard/manifiesto`}
        />
        <ActionCard
          title="Basurón"
          icon={<BasuronIcon />}
          description="Pesar en relleno"
          href={`/${locale}/dashboard/manifiesto-basuron`}
        />
        <ActionCard
          title="Estadísticas"
          icon={<EstadisticasIcon />}
          description="Ver reportes y KPI"
          href={`/${locale}/dashboard/estadisticas`}
        />
      </div>

      {/* Accesos rápidos a otras secciones */}
      <div className="mt-10 text-center">
        <p className="text-gray-400 text-sm mb-3">Otras secciones</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}/dashboard/embarcaciones`}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors"
          >
            🚢 Embarcaciones
          </Link>
          <Link
            href={`/${locale}/dashboard/personas`}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors"
          >
            👥 Personas
          </Link>
          <Link
            href={`/${locale}/dashboard/asociaciones`}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors"
          >
            🏢 Asociaciones
          </Link>
        </div>
      </div>
    </div>
  );
}
