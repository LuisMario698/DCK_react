/**
 * Panel inicial del recinto (/dashboard). Sin estado propio: recibe lo ya consultado
 * (`getResumenPanel` y `getVistazoPanel`) y lo dice. Con los dos en null (si fallaron) queda el
 * menú de siempre, sin datos. Ver DISEÑO_SIMAR.md → "Tarjeta de acción" y "El Panel del recinto".
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  Inbox,
  MessageSquare,
  Package,
  Scale,
  Ship,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { NumeroAnimado } from '@/components/ui/movimiento';
import { InsigniaCalma } from './InsigniaCalma';
import { PanelEnVivo } from './PanelEnVivo';
import { PastillaManifiesto } from './PastillaManifiesto';
import { clasePastilla } from './pastilla';
import type {
  MovimientoReciente,
  ResiduoEnAcopio,
  ResumenPanel,
  SolicitudBreve,
  VistazoPanel,
} from '@/lib/services/panel_recinto';
import {
  TIPO_RESIDUO_COLOR,
  TIPO_RESIDUO_LABEL,
  formatCantidad,
  tiempoRelativo,
  unidadEscrita,
  type TipoResiduo,
} from '@/lib/constants/residuos';
import { fechaHoyPuerto, formatearFecha, saludoPuerto } from '@/lib/utils/fechas';

// Tarjeta grande de acción del Panel (ver DISEÑO_SIMAR.md → "Tarjeta de acción")
const ActionCard = ({
  title,
  Icon,
  description,
  dato,
  href,
  principal = false,
  tono,
  delay,
}: {
  title: string;
  Icon: LucideIcon;
  description: string;
  /** Un dato vivo en una pastilla bajo la descripción ("Último: hace 2 h"), o la pastilla ya hecha */
  dato?: string | ReactNode;
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
      {typeof dato === 'string' ? <span className={clasePastilla(principal)}>{dato}</span> : dato}
    </span>
    <ChevronRight
      aria-hidden="true"
      className={`md:hidden w-7 h-7 flex-shrink-0 ${principal ? 'text-white/80' : 'text-simar-texto-2 movil:absolute movil:top-4 movil:right-3.5 movil:w-5 movil:h-5'}`}
      strokeWidth={2}
    />
  </Link>
);

// Acceso a otra sección. En celular es un mosaico (ícono arriba y palabra), tres por fila.
// `dato`: cuántos hay ("48", "3 activas"); en el mosaico va debajo de la palabra.
const OtraSeccion = ({ href, Icon, label, dato }: { href: string; Icon: LucideIcon; label: string; dato?: string }) => (
  <Link
    href={href}
    className="simar-presiona min-h-[60px] px-6 rounded-[18px] bg-simar-superficie border border-simar-borde shadow-simar text-simar-texto text-[19px] font-bold flex items-center gap-3 hover:bg-simar-superficie hover:border-simar-marea movil:flex-col movil:justify-center movil:gap-1 movil:min-h-[88px] movil:px-1.5 movil:text-[14px] movil:text-center movil:leading-tight"
  >
    <Icon className="w-6 h-6 text-simar-marea-tinta" strokeWidth={2} />
    {label}
    {dato && (
      <span className="px-2.5 py-0.5 rounded-full bg-simar-papel text-[15px] font-semibold text-simar-texto-2 tabular-nums movil:px-0 movil:py-0 movil:bg-transparent movil:text-[12px]">
        {dato}
      </span>
    )}
    <ChevronRight aria-hidden="true" className="sm:hidden movil:hidden ml-auto w-6 h-6 text-simar-texto-2" strokeWidth={2} />
  </Link>
);

// ── Lo que el Panel dice con los datos ───────────────────────────────────────

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/** "200 L de aceite usado" */
const residuo = (s: SolicitudBreve) => `${formatCantidad(s.cantidad)} ${s.unidad} de ${TIPO_RESIDUO_LABEL[s.tipo]?.toLowerCase() ?? s.tipo}`;

/** "Último: hace 2 h" */
const ultimo = (iso: string | null) => (iso ? `Último: ${tiempoRelativo(iso).toLowerCase()}` : undefined);

/** "Hoy van 3 manifiestos y 1 recibo del basurón." Los números cuentan al entrar y al cambiar. */
function LineaDeHoy({ hoy }: { hoy: ResumenPanel['hoy'] }) {
  const partes = [
    { n: hoy.manifiestos, texto: plural(hoy.manifiestos, 'manifiesto', 'manifiestos') },
    { n: hoy.recibosBasuron, texto: plural(hoy.recibosBasuron, 'recibo del basurón', 'recibos del basurón') },
  ].filter((p) => p.n > 0);
  if (partes.length === 0) return <>Aún no hay registros de hoy.</>;

  const verbo = partes.length === 1 && partes[0].n === 1 ? 'va' : 'van';
  return (
    <>
      Hoy {verbo}{' '}
      {partes.map((p, i) => (
        <span key={p.texto}>
          {i > 0 && ' y '}
          <strong className="font-bold text-simar-texto">
            <NumeroAnimado valor={p.n} duracion={600} /> {p.texto}
          </strong>
        </span>
      ))}
      .
    </>
  );
}

interface Pendiente {
  clave: string;
  total: number;
  titulo: string;
  detalle: ReactNode;
  href: string;
  Icon: LucideIcon;
  /** Coral si ya se pasó o espera respuesta; azul si sólo hay que tenerlo presente */
  urgente: boolean;
}

/** Lo que hay por atender, en el orden en que conviene hacerlo. Vacío si no hay nada. */
function pendientesDe(r: ResumenPanel, hoy: string, base: string): Pendiente[] {
  const lista: Pendiente[] = [];

  const { porRecolectar: rec, porRevisar: rev, mensajes: men } = r;
  if (rec.total > 0) {
    const cuando = (s: SolicitudBreve) =>
      s.fechaPropuesta < hoy ? `era para el ${formatearFecha(s.fechaPropuesta, 'es-MX', { day: 'numeric', month: 'long' })}` : 'hoy';
    lista.push({
      clave: 'recolectar',
      total: rec.total,
      titulo: plural(rec.total, 'solicitud por recolectar', 'solicitudes por recolectar'),
      detalle: rec.unica
        ? `${rec.unica.empresa} · ${residuo(rec.unica)} · ${cuando(rec.unica)}`
        : rec.atrasadas === 0
          ? 'Las empresas vienen hoy'
          : rec.atrasadas === rec.total
            ? 'Ya pasó su fecha'
            : `${rec.atrasadas} ${plural(rec.atrasadas, 'ya pasó su fecha', 'ya pasaron su fecha')}`,
      href: rec.unica ? `${base}/asociaciones?solicitud=${rec.unica.id}` : `${base}/asociaciones?ver=por-recolectar`,
      Icon: Truck,
      urgente: rec.atrasadas > 0,
    });
  }
  if (rev.total > 0) {
    lista.push({
      clave: 'revisar',
      total: rev.total,
      titulo: plural(rev.total, 'solicitud por revisar', 'solicitudes por revisar'),
      detalle: rev.unica
        ? `${rev.unica.empresa} pide ${residuo(rev.unica)}`
        : rev.masAntigua
          ? `La más antigua, ${tiempoRelativo(rev.masAntigua).toLowerCase()}`
          : 'Apruébalas o recházalas',
      href: rev.unica ? `${base}/asociaciones?solicitud=${rev.unica.id}` : `${base}/asociaciones`,
      Icon: Inbox,
      urgente: true,
    });
  }
  if (men.total > 0) {
    const una = men.empresas.length === 1 ? men.empresas[0] : null;
    lista.push({
      clave: 'mensajes',
      total: men.total,
      titulo: plural(men.total, 'mensaje sin leer', 'mensajes sin leer'),
      detalle: una ? `De ${una.nombre}` : `De ${men.empresas.length} empresas`,
      href: `${base}/asociaciones?ver=mensajes${una ? `&empresa=${una.id}` : ''}`,
      Icon: MessageSquare,
      urgente: false,
    });
  }
  return lista;
}

// ── Un vistazo: debajo de las tarjetas grandes ───────────────────────────────

const tarjetaVistazo =
  'simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[24px] p-5 md:p-6 movil:p-4 movil:rounded-[20px]';

const nombreResiduo = (t: TipoResiduo) => TIPO_RESIDUO_LABEL[t] ?? t;

/**
 * Qué es (título), cuánto y quién (detalle), y a dónde lleva cada movimiento. La cantidad va antes
 * que el nombre: si no cabe, se corta el nombre (las razones sociales son largas) y no la cantidad.
 */
function describirMovimiento(m: MovimientoReciente, base: string) {
  switch (m.tipo) {
    case 'manifiesto':
      return {
        Icon: FileText,
        tono: 'bg-simar-marea-suave text-simar-marea-tinta',
        titulo: m.numero ? `Manifiesto ${m.numero}` : 'Manifiesto',
        detalle: m.embarcacion ?? 'Sin embarcación',
        href: `${base}/manifiesto`,
      };
    case 'basuron':
      return {
        Icon: Scale,
        tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        titulo: 'Recibo del basurón',
        detalle: [`${formatCantidad(m.kg)} kg`, m.deQuien].filter(Boolean).join(' · '),
        href: `${base}/manifiesto-basuron`,
      };
    case 'recoleccion':
      return {
        Icon: Truck,
        tono: TIPO_RESIDUO_COLOR[m.residuo],
        titulo: `Recolección de ${nombreResiduo(m.residuo).toLowerCase()}`,
        detalle: `${formatCantidad(m.cantidad)} ${unidadEscrita(m.unidad, m.cantidad)} · ${m.empresa}`,
        href: `${base}/asociaciones?solicitud=${m.solicitudId}`,
      };
  }
}

/** Los últimos movimientos del recinto, de cualquier tipo: para ver qué se hizo sin buscarlo */
function LoUltimo({ recientes, base }: { recientes: MovimientoReciente[]; base: string }) {
  return (
    <section aria-labelledby="lo-ultimo" className={tarjetaVistazo} style={{ animationDelay: '0.24s' }}>
      <h2 id="lo-ultimo" className="text-[21px] font-extrabold text-simar-texto movil:text-[16px]">Lo último registrado</h2>
      {recientes.length === 0 ? (
        <p className="mt-2 text-[17px] text-simar-texto-2 movil:text-[14px]">
          Aquí verás los últimos manifiestos, recibos del basurón y recolecciones.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-simar-borde-suave movil:mt-1">
          {recientes.map((m) => {
            const d = describirMovimiento(m, base);
            return (
              <li key={`${m.tipo}-${m.id}`}>
                <Link
                  href={d.href}
                  className="-mx-2 px-2 flex items-center gap-3.5 min-h-[64px] py-2 rounded-xl transition-colors hover:bg-simar-papel/60 movil:min-h-[54px] movil:gap-3"
                >
                  <span className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center movil:w-9 movil:h-9 ${d.tono}`}>
                    <d.Icon className="w-[22px] h-[22px] movil:w-[18px] movil:h-[18px]" strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[17px] font-bold text-simar-texto movil:text-[14px]">{d.titulo}</span>
                    <span className="block truncate text-[15px] text-simar-texto-2 movil:text-[12.5px]">{d.detalle}</span>
                  </span>
                  <span className="flex-shrink-0 text-[15px] text-simar-texto-2 movil:text-[12px]">{tiempoRelativo(m.fecha).toLowerCase()}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Lo que hay hoy en el centro de acopio. Sin barras a propósito: aceite en litros, filtros en piezas
 * y lo demás en kg no se comparan entre sí (ver "Estadísticas, números correctos").
 */
function Acopio({ acopio, base }: { acopio: ResiduoEnAcopio[]; base: string }) {
  return (
    <section aria-labelledby="acopio" className={tarjetaVistazo} style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="acopio" className="text-[21px] font-extrabold text-simar-texto movil:text-[16px]">En el centro de acopio</h2>
        <Link
          href={`${base}/asociaciones?ver=inventario`}
          className="flex-shrink-0 -mr-2 inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-xl text-[15px] font-bold text-simar-marea-tinta transition-colors hover:bg-simar-marea-suave movil:min-h-[36px] movil:text-[13px]"
        >
          Inventario
          <ChevronRight aria-hidden="true" className="w-4 h-4" strokeWidth={2.4} />
        </Link>
      </div>
      {acopio.length === 0 ? (
        <p className="mt-2 text-[17px] text-simar-texto-2 movil:text-[14px]">
          Está vacío. Cuando agregues residuos al inventario, aparecerán aquí.
        </p>
      ) : (
        <ul className="mt-2 space-y-1 movil:mt-1">
          {acopio.map((r) => (
            <li key={r.tipo} className="flex items-center gap-3.5 min-h-[56px] movil:min-h-[46px] movil:gap-3">
              <span className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center movil:w-9 movil:h-9 ${TIPO_RESIDUO_COLOR[r.tipo]}`}>
                <Package className="w-[22px] h-[22px] movil:w-[18px] movil:h-[18px]" strokeWidth={2} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-[17px] font-bold text-simar-texto movil:text-[14px]">{nombreResiduo(r.tipo)}</span>
                {!r.publicado && <span className="block text-[14px] text-simar-texto-2 movil:text-[12px]">Sin publicar</span>}
              </span>
              <span className="flex-shrink-0 whitespace-nowrap">
                <span className="text-[22px] font-extrabold tabular-nums text-simar-texto movil:text-[17px]">{formatCantidad(r.cantidad)}</span>{' '}
                <span className="text-[15px] text-simar-texto-2 movil:text-[12.5px]">{unidadEscrita(r.unidad, r.cantidad)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PanelInicio({
  locale,
  hoy,
  resumen,
  vistazo,
}: {
  locale: string;
  hoy: string;
  resumen: ResumenPanel | null;
  vistazo: VistazoPanel | null;
}) {
  const base = `/${locale}/dashboard`;
  const pendientes = resumen ? pendientesDe(resumen, hoy, base) : [];
  const conteos = vistazo?.conteos;

  return (
    // En columna para poder reacomodar en celular: ahí "Un vistazo" baja al final (movil:order-1)
    <div className="relative max-w-[1600px] flex flex-col">
      <PanelEnVivo />

      {/* Encabezado: marca SiMAR + saludo del momento y lo que va del día */}
      <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[30px] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-9 movil:p-4 movil:gap-2.5">
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
        <div className="min-w-0">
          <p className="text-[17px] md:text-[19px] font-semibold text-simar-texto-2 movil:text-[14px]">{fechaHoyPuerto()}</p>
          <h1 className="mt-0.5 text-3xl md:text-[38px] font-extrabold leading-tight tracking-tight text-simar-texto">
            {saludoPuerto()}
          </h1>
          <p className="mt-2 text-lg md:text-xl text-simar-texto-2 movil:mt-1">
            {resumen ? <LineaDeHoy hoy={resumen.hoy} /> : 'Selecciona una opción del panel de control.'}
          </p>
        </div>
        {/* Sin pendientes, la calma también se dice (con la misma insignia que "Firmado"): "Todo al
            día", o "Nada pendiente" si la campana tiene avisos sin leer */}
        {resumen && pendientes.length === 0 && <InsigniaCalma avisosIniciales={resumen.avisosSinLeer} />}
      </section>

      {/* Por atender: sólo aparece si hay algo. Cada renglón lleva a donde se resuelve */}
      {pendientes.length > 0 && (
        <section aria-labelledby="por-atender" className="simar-aparece mt-5 md:mt-7 movil:mt-3" style={{ animationDelay: '0.05s' }}>
          <h2 id="por-atender" className="text-xl font-bold text-simar-texto-2 movil:text-[15px] movil:px-1">Por atender</h2>
          <ul className="mt-3.5 bg-simar-superficie border border-simar-borde shadow-simar rounded-[24px] overflow-hidden divide-y divide-simar-borde-suave movil:mt-2 movil:rounded-[20px]">
            {pendientes.map((p) => (
              <li key={p.clave}>
                <Link
                  href={p.href}
                  className="flex items-center gap-4 min-h-[76px] px-5 py-3 transition-colors hover:bg-simar-papel/60 movil:min-h-[60px] movil:gap-3 movil:px-3.5 movil:py-2.5"
                >
                  <span
                    className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center movil:w-10 movil:h-10 ${
                      p.urgente ? 'bg-simar-coral-suave text-simar-coral' : 'bg-simar-marea-suave text-simar-marea-tinta'
                    }`}
                  >
                    <p.Icon className="w-6 h-6 movil:w-5 movil:h-5" strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[19px] font-bold leading-snug text-simar-texto movil:text-[15px]">
                      {/* Si el número cambia en vivo, entra de nuevo con un pulso */}
                      <span key={p.total} className="simar-confirma inline-block tabular-nums">{p.total}</span> {p.titulo}
                    </span>
                    <span className="block text-[17px] leading-snug text-simar-texto-2 movil:text-[13px] movil:line-clamp-2">{p.detalle}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="w-6 h-6 flex-shrink-0 text-simar-texto-2 movil:w-5 movil:h-5" strokeWidth={2} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Acciones principales */}
      <div className="mt-5 md:mt-7 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 movil:grid-cols-2 movil:gap-3 movil:mt-3">
        <ActionCard
          title="Manifiesto"
          Icon={FileText}
          description="Recolección de barco"
          dato={<PastillaManifiesto ultimo={ultimo(resumen?.ultimoManifiesto ?? null)} />}
          href={`${base}/manifiesto`}
          principal
          tono=""
          delay="0.08s"
        />
        <ActionCard
          title="Basurón"
          Icon={Scale}
          description="Pesar en relleno"
          dato={ultimo(resumen?.ultimoRecibo ?? null)}
          href={`${base}/manifiesto-basuron`}
          tono="bg-simar-arrecife-suave text-simar-arrecife-tinta"
          delay="0.14s"
        />
        <ActionCard
          title="Estadísticas"
          Icon={BarChart3}
          description="Ver reportes y KPI"
          dato={resumen ? `${formatCantidad(resumen.manifiestosMes)} ${plural(resumen.manifiestosMes, 'manifiesto', 'manifiestos')} en 30 días` : undefined}
          href={`${base}/estadisticas`}
          tono="bg-simar-violeta-suave text-simar-violeta"
          delay="0.2s"
        />
      </div>

      {/* Un vistazo: lo último registrado y lo que hay en el acopio. En celular va al final, después
          de "Otras secciones", para que lo de arriba siga cabiendo en una pantalla */}
      {vistazo && (
        <div className="mt-5 md:mt-7 grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-4 md:gap-6 movil:order-1 movil:mt-5 movil:gap-3">
          <LoUltimo recientes={vistazo.recientes} base={base} />
          <Acopio acopio={vistazo.acopio} base={base} />
        </div>
      )}

      {/* Accesos rápidos a otras secciones, con cuántos hay */}
      <section className="simar-aparece mt-9 movil:mt-5" style={{ animationDelay: '0.36s' }}>
        <h2 className="text-xl font-bold text-simar-texto-2 movil:text-[15px] movil:px-1">Otras secciones</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:gap-3.5 movil:grid-cols-3 movil:gap-2.5 movil:mt-2">
          <OtraSeccion href={`${base}/embarcaciones`} Icon={Ship} label="Embarcaciones" dato={conteos && formatCantidad(conteos.embarcaciones)} />
          <OtraSeccion href={`${base}/personas`} Icon={Users} label="Personas" dato={conteos && formatCantidad(conteos.personas)} />
          <OtraSeccion
            href={`${base}/asociaciones`}
            Icon={Building2}
            label="Asociaciones"
            dato={conteos && `${conteos.asociacionesActivas} ${plural(conteos.asociacionesActivas, 'activa', 'activas')}`}
          />
        </div>
      </section>
    </div>
  );
}
