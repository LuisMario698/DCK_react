import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import logoIcon from '@/Contexto-DCK/logo_DCK_no_letras.png';
import { DashboardBackground } from '@/components/dashboard/DashboardBackground';

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
    className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl shadow-lg dark:shadow-gray-950/50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl bg-white dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-600 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 w-full h-48 md:h-56 group"
  >
    <div className="p-4 rounded-xl mb-3 transition-all bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-400 dark:group-hover:bg-blue-500">
      <div className="transition-colors group-hover:[&_svg]:text-white">
        {icon}
      </div>
    </div>
    <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white group-hover:text-white text-center transition-colors">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 group-hover:text-blue-100 text-center text-sm md:text-base mt-2 transition-colors">{description}</p>
  </Link>
);

// Iconos SVG grandes y claros
const ManifiestoIcon = () => (
  <svg className="w-12 h-12 md:w-14 md:h-14 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BasuronIcon = () => (
  <svg className="w-12 h-12 md:w-14 md:h-14 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const EstadisticasIcon = () => (
  <svg className="w-12 h-12 md:w-14 md:h-14 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="min-h-[calc(100vh-120px)] flex flex-col justify-center relative">
      <DashboardBackground />
      <div className="relative z-10 w-full">
        {/* Hero Banner */}
        <div className="w-full max-w-5xl mx-auto mb-12 px-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 border border-blue-100/60 dark:border-gray-700 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-blue-900/5 dark:shadow-gray-950/50">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 dark:bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/5 dark:bg-teal-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
              {/* Logo */}
              <div className="relative w-48 h-48 md:w-64 md:h-64 transition-transform hover:scale-105 duration-500">
                <Image
                  src={logoIcon}
                  alt="DCK Icon"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Texto */}
              <div className="text-center md:text-left flex flex-col items-center md:items-start">
                <h1 className="text-7xl md:text-8xl font-black text-gray-900 dark:text-white leading-none tracking-tighter mb-2">
                  DCK
                </h1>
                <div className="h-1.5 w-24 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full mb-4"></div>
                <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium tracking-[0.25em] uppercase">
                  Conciencia y Cultura
                </p>
              </div>
            </div>

            {/* Separador sutil */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-100 dark:via-gray-600 to-transparent my-8"></div>

            {/* Saludo Integrado */}
            <div className="text-center relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                ¡Hola! 👋 ¿Qué vamos a hacer hoy?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Selecciona una opción del panel de control</p>
            </div>
          </div>
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
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">Otras secciones</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/${locale}/dashboard/embarcaciones`}
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors"
            >
              🚢 Embarcaciones
            </Link>
            <Link
              href={`/${locale}/dashboard/personas`}
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors"
            >
              👥 Personas
            </Link>
            <Link
              href={`/${locale}/dashboard/asociaciones`}
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors"
            >
              🏢 Asociaciones
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

