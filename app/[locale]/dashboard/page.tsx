import Link from 'next/link';
import { BarChart3, Building2, FileText, Scale, Ship, Users, type LucideIcon } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';

export const dynamic = 'force-dynamic';

// Tarjeta grande de acción del Panel (ver DISEÑO_SIMAR.md → "Tarjeta de acción")
const ActionCard = ({
  title,
  Icon,
  description,
  href,
  principal = false,
  tono,
  delay,
}: {
  title: string;
  Icon: LucideIcon;
  description: string;
  href: string;
  principal?: boolean;
  tono: string;
  delay: string;
}) => (
  <Link
    href={href}
    style={{ animationDelay: delay }}
    className={`simar-aparece simar-tarjeta-accion flex flex-col min-h-[230px] md:min-h-[250px] rounded-[28px] p-7 ${principal
      ? 'bg-simar-marea text-white shadow-simar'
      : 'bg-simar-superficie border border-simar-borde shadow-simar text-simar-texto'
      }`}
  >
    <span className={`w-[72px] h-[72px] rounded-full flex items-center justify-center ${principal ? 'bg-white text-[#1B5FC9]' : tono}`}>
      <Icon className="w-[34px] h-[34px]" strokeWidth={2} />
    </span>
    <span className="mt-auto pt-6 text-[32px] font-extrabold leading-tight">{title}</span>
    <span className={`mt-1 text-[19px] ${principal ? 'text-[#E6EEFB]' : 'text-simar-texto-2'}`}>{description}</span>
  </Link>
);

const OtraSeccion = ({ href, Icon, label }: { href: string; Icon: LucideIcon; label: string }) => (
  <Link
    href={href}
    className="min-h-[60px] px-6 rounded-[18px] bg-simar-superficie border border-simar-borde shadow-simar text-simar-texto text-[19px] font-bold flex items-center gap-3 hover:bg-simar-superficie hover:border-simar-marea transition-colors"
  >
    <Icon className="w-6 h-6 text-simar-marea-tinta" strokeWidth={2} />
    {label}
  </Link>
);

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="relative max-w-[1600px]">
      {/* Encabezado: marca SiMAR + saludo */}
      <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[30px] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-9">
        <div className="flex items-center gap-4 flex-shrink-0">
          <LogoSimar variante="simbolo" tamano={92} />
          <div>
            <LogoSimar variante="nombre" tamano={80} />
            <p className="mt-2.5 text-[17px] leading-snug text-simar-texto-2 max-w-[240px]">
              Sistema Integral de Manejo Ambiental de Residuos
            </p>
          </div>
        </div>
        <div aria-hidden="true" className="hidden md:block w-px self-stretch bg-simar-borde" />
        <div>
          <h1 className="text-3xl md:text-[38px] font-extrabold leading-tight tracking-tight text-simar-texto">
            ¡Hola! ¿Qué vamos a hacer hoy?
          </h1>
          <p className="mt-2 text-lg md:text-xl text-simar-texto-2">Selecciona una opción del panel de control.</p>
        </div>
      </section>

      {/* Acciones principales */}
      <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        <ActionCard
          title="Manifiesto"
          Icon={FileText}
          description="Recolección de barco"
          href={`/${locale}/dashboard/manifiesto`}
          principal
          tono=""
          delay="0.08s"
        />
        <ActionCard
          title="Basurón"
          Icon={Scale}
          description="Pesar en relleno"
          href={`/${locale}/dashboard/manifiesto-basuron`}
          tono="bg-simar-arrecife-suave text-simar-arrecife-tinta"
          delay="0.14s"
        />
        <ActionCard
          title="Estadísticas"
          Icon={BarChart3}
          description="Ver reportes y KPI"
          href={`/${locale}/dashboard/estadisticas`}
          tono="bg-simar-violeta-suave text-simar-violeta"
          delay="0.2s"
        />
      </div>

      {/* Accesos rápidos a otras secciones */}
      <section className="simar-aparece mt-9" style={{ animationDelay: '0.26s' }}>
        <h2 className="text-xl font-bold text-simar-texto-2">Otras secciones</h2>
        <div className="mt-3.5 flex flex-wrap gap-3.5">
          <OtraSeccion href={`/${locale}/dashboard/embarcaciones`} Icon={Ship} label="Embarcaciones" />
          <OtraSeccion href={`/${locale}/dashboard/personas`} Icon={Users} label="Personas" />
          <OtraSeccion href={`/${locale}/dashboard/asociaciones`} Icon={Building2} label="Asociaciones" />
        </div>
      </section>
    </div>
  );
}
