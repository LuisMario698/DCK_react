import Link from 'next/link';
import { BarChart3, Building2, ChevronRight, FileText, Scale, Ship, Users, type LucideIcon } from 'lucide-react';
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
  // De 640 a 767 px la tarjeta es horizontal (ícono, texto y flecha); desde 768 px vuelve a ser la
  // tarjeta alta del diseño. En celular la principal va a lo ancho y las otras dos son mosaicos
  // lado a lado, para que el Panel completo quepa en una pantalla sin desplazarse.
  <Link
    href={href}
    style={{ animationDelay: delay }}
    className={`simar-aparece simar-tarjeta-accion relative flex flex-row items-center gap-5 min-h-[112px] p-5 md:flex-col md:items-stretch md:gap-0 md:min-h-[250px] md:p-7 rounded-[28px] ${principal
      ? 'bg-simar-marea text-white shadow-simar movil:col-span-2 movil:min-h-[108px] movil:gap-4 movil:p-4'
      : 'bg-simar-superficie border border-simar-borde shadow-simar text-simar-texto movil:flex-col movil:items-start movil:gap-3 movil:min-h-[140px] movil:p-4'
      }`}
  >
    <span className={`w-16 h-16 md:w-[72px] md:h-[72px] flex-shrink-0 rounded-full flex items-center justify-center ${principal ? 'bg-white text-[#1B5FC9] movil:w-[54px] movil:h-[54px]' : `${tono} movil:w-[46px] movil:h-[46px]`}`}>
      <Icon className="w-[30px] h-[30px] md:w-[34px] md:h-[34px]" strokeWidth={2} />
    </span>
    <span className="flex-1 min-w-0 flex flex-col md:mt-auto md:pt-6">
      <span className={`text-[26px] md:text-[32px] font-extrabold leading-tight ${principal ? 'movil:text-[22px]' : 'movil:text-[19px]'}`}>{title}</span>
      <span className={`mt-0.5 md:mt-1 text-[17px] md:text-[19px] ${principal ? 'text-[#E6EEFB]' : 'text-simar-texto-2 movil:text-[14px] movil:leading-snug'}`}>{description}</span>
    </span>
    <ChevronRight
      aria-hidden="true"
      className={`md:hidden w-7 h-7 flex-shrink-0 ${principal ? 'text-white/80' : 'text-simar-texto-2 movil:absolute movil:top-4 movil:right-3.5 movil:w-5 movil:h-5'}`}
      strokeWidth={2}
    />
  </Link>
);

// Acceso a otra sección. En celular es un mosaico (ícono arriba y palabra), tres por fila.
const OtraSeccion = ({ href, Icon, label }: { href: string; Icon: LucideIcon; label: string }) => (
  <Link
    href={href}
    className="simar-presiona min-h-[60px] px-6 rounded-[18px] bg-simar-superficie border border-simar-borde shadow-simar text-simar-texto text-[19px] font-bold flex items-center gap-3 hover:bg-simar-superficie hover:border-simar-marea movil:flex-col movil:justify-center movil:gap-1.5 movil:min-h-[88px] movil:px-1.5 movil:text-[14px] movil:text-center movil:leading-tight"
  >
    <Icon className="w-6 h-6 text-simar-marea-tinta" strokeWidth={2} />
    {label}
    <ChevronRight aria-hidden="true" className="sm:hidden movil:hidden ml-auto w-6 h-6 text-simar-texto-2" strokeWidth={2} />
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
      <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[30px] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-9 movil:p-4">
        {/* En celular el logo ya está en el encabezado: aquí sólo va el saludo */}
        <div className="flex items-center gap-4 flex-shrink-0 movil:hidden">
          {/* En celular la marca es más chica: el saludo es lo importante */}
          <LogoSimar variante="simbolo" tamano={64} className="md:hidden" />
          <LogoSimar variante="simbolo" tamano={92} className="hidden md:inline-flex" />
          <div>
            <LogoSimar variante="nombre" tamano={60} className="md:hidden" />
            <LogoSimar variante="nombre" tamano={80} className="hidden md:inline-flex" />
            <p className="mt-2 md:mt-2.5 text-[15px] md:text-[17px] leading-snug text-simar-texto-2 max-w-[240px]">
              Sistema Integral de Manejo Ambiental de Residuos
            </p>
          </div>
        </div>
        <div aria-hidden="true" className="hidden md:block w-px self-stretch bg-simar-borde" />
        <div>
          <h1 className="text-3xl md:text-[38px] font-extrabold leading-tight tracking-tight text-simar-texto">
            ¡Hola! ¿Qué vamos a hacer hoy?
          </h1>
          <p className="mt-2 text-lg md:text-xl text-simar-texto-2 movil:mt-1">Selecciona una opción del panel de control.</p>
        </div>
      </section>

      {/* Acciones principales */}
      <div className="mt-5 md:mt-7 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 movil:grid-cols-2 movil:gap-3 movil:mt-3">
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
      <section className="simar-aparece mt-9 movil:mt-5" style={{ animationDelay: '0.26s' }}>
        <h2 className="text-xl font-bold text-simar-texto-2 movil:text-[15px] movil:px-1">Otras secciones</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:gap-3.5 movil:grid-cols-3 movil:gap-2.5 movil:mt-2">
          <OtraSeccion href={`/${locale}/dashboard/embarcaciones`} Icon={Ship} label="Embarcaciones" />
          <OtraSeccion href={`/${locale}/dashboard/personas`} Icon={Users} label="Personas" />
          <OtraSeccion href={`/${locale}/dashboard/asociaciones`} Icon={Building2} label="Asociaciones" />
        </div>
      </section>
    </div>
  );
}
