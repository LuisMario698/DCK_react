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
    className={`@container simar-aparece simar-tarjeta-accion relative flex flex-row items-center gap-5 min-h-[112px] p-5 md:flex-col md:items-stretch md:gap-0 md:min-h-[250px] md:p-7 rounded-[28px] ${principal
      ? 'bg-simar-marea text-white shadow-simar movil:col-span-2 movil:min-h-[108px] movil:gap-4 movil:p-4'
      : 'bg-simar-superficie border border-simar-borde shadow-simar text-simar-texto movil:flex-col movil:items-start movil:gap-3 movil:min-h-[140px] movil:p-4'
      }`}
  >
    <span className={`w-16 h-16 md:w-[72px] md:h-[72px] flex-shrink-0 rounded-full flex items-center justify-center ${principal ? 'bg-white text-[#1B5FC9] movil:w-[54px] movil:h-[54px]' : `${tono} movil:w-[46px] movil:h-[46px]`}`}>
      <Icon className="w-[30px] h-[30px] md:w-[34px] md:h-[34px]" strokeWidth={2} />
    </span>
    <span className="flex-1 min-w-0 flex flex-col md:mt-auto md:pt-6">
      {/* En tarjetas angostas (laptop con el menú abierto) el título se achica con la tarjeta: 32 px se salía ("Estadísticas") */}
      <span className={`text-[26px] md:text-[length:min(32px,calc(100cqi/7.2))] font-extrabold leading-tight ${principal ? 'movil:text-[22px]' : 'movil:text-[19px]'}`}>{title}</span>
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
  /** Ya con el número: "1 solicitud por revisar" */
  titulo: string;
  detalle: ReactNode;
  href: string;
  Icon: LucideIcon;
  /** Coral: ya se pasó o espera una decisión; azul: hay que tenerlo presente hoy */
  tono: 'coral' | 'marea';
  /** Lo que pide, escrito en su tono arriba del título (DISEÑO_SIMAR.md §10.6): "Requiere tu respuesta" */
  insignia: string;
  /** La palabra del botón: "Revisar", "Ver", "Abrir chat" */
  accion: string;
}

/** Lo que hay por atender, en el orden en que conviene hacerlo. Vacío si no hay nada. */
function pendientesDe(r: ResumenPanel, hoy: string, base: string): Pendiente[] {
  const lista: Pendiente[] = [];

  const { porRecolectar: rec, porRevisar: rev, mensajes: men } = r;
  if (rec.total > 0) {
    const fecha = (s: SolicitudBreve) => formatearFecha(s.fechaPropuesta, 'es-MX', { day: 'numeric', month: 'long' });
    const todasHoy = rec.atrasadas === 0;
    const todasAtrasadas = rec.atrasadas === rec.total;
    lista.push({
      clave: 'recolectar',
      total: rec.total,
      titulo: todasHoy
        ? `${rec.total} ${plural(rec.total, 'recolección para hoy', 'recolecciones para hoy')}`
        : todasAtrasadas
          ? `${rec.total} ${plural(rec.total, 'recolección atrasada', 'recolecciones atrasadas')}`
          : `${rec.total} recolecciones por recibir`,
      detalle: rec.unica
        ? todasHoy
          ? `${rec.unica.empresa} viene por ${residuo(rec.unica)}`
          : `${rec.unica.empresa} · ${residuo(rec.unica)} · era para el ${fecha(rec.unica)}`
        : todasHoy
          ? 'Las empresas vienen hoy'
          : todasAtrasadas
            ? 'Ya pasó su fecha y no se han registrado'
            : `${rec.atrasadas} ${plural(rec.atrasadas, 'ya pasó su fecha', 'ya pasaron su fecha')}`,
      href: rec.unica ? `${base}/asociaciones?solicitud=${rec.unica.id}` : `${base}/asociaciones?ver=por-recolectar`,
      Icon: Truck,
      tono: todasHoy ? 'marea' : 'coral',
      insignia: todasHoy ? 'Hoy' : 'Ya pasó su fecha',
      accion: 'Ver',
    });
  }
  if (rev.total > 0) {
    lista.push({
      clave: 'revisar',
      total: rev.total,
      titulo: `${rev.total} ${plural(rev.total, 'solicitud por revisar', 'solicitudes por revisar')}`,
      detalle: rev.unica
        ? `${rev.unica.empresa} pide ${residuo(rev.unica)}`
        : rev.masAntigua
          ? `La más antigua, ${tiempoRelativo(rev.masAntigua).toLowerCase()}`
          : 'Apruébalas o recházalas',
      href: rev.unica ? `${base}/asociaciones?solicitud=${rev.unica.id}` : `${base}/asociaciones`,
      Icon: Inbox,
      tono: 'coral',
      insignia: 'Requiere tu respuesta',
      accion: 'Revisar',
    });
  }
  if (men.total > 0) {
    const una = men.empresas.length === 1 ? men.empresas[0] : null;
    lista.push({
      clave: 'mensajes',
      total: men.total,
      titulo: `${men.total} ${plural(men.total, 'mensaje sin leer', 'mensajes sin leer')}`,
      detalle: una ? `De ${una.nombre}` : `De ${men.empresas.length} empresas`,
      href: `${base}/asociaciones?ver=mensajes${una ? `&empresa=${una.id}` : ''}`,
      Icon: MessageSquare,
      tono: 'marea',
      insignia: 'Nuevos',
      accion: 'Abrir chat',
    });
  }
  return lista;
}

// El tono va en el círculo del ícono (suave) y en la insignia escrita; la tarjeta es blanca como todas
const TONO_PENDIENTE = {
  coral: { circulo: 'bg-simar-coral-suave text-simar-coral', insignia: 'text-simar-coral' },
  marea: { circulo: 'bg-simar-marea-suave text-simar-marea-tinta', insignia: 'text-simar-marea-tinta' },
};

/**
 * Por atender: una tarjeta por tarea (como las del Panel: blanca, ícono en círculo suave), con lo que
 * pide escrito en su tono, el número en el título y el botón azul de lo que hay que hacer.
 */
function PorAtender({ pendientes, angosto }: { pendientes: Pendiente[]; angosto: boolean }) {
  return (
    <section aria-labelledby="por-atender" className="simar-aparece min-w-0" style={{ animationDelay: '0.05s' }}>
      <h2 id="por-atender" className="flex items-center gap-2.5 text-xl font-bold text-simar-texto-2 movil:text-[15px] movil:px-1">
        Por atender
        {/* Contador de SiMAR (DISEÑO_SIMAR.md §10.6) */}
        <span className="min-w-[26px] h-[26px] px-1.5 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold inline-flex items-center justify-center">
          {pendientes.length}
        </span>
      </h2>
      <ul className={`mt-3.5 grid gap-3 movil:mt-2 movil:gap-2 ${!angosto && pendientes.length > 1 ? 'xl:grid-cols-2' : ''}`}>
        {pendientes.map((p) => {
          const t = TONO_PENDIENTE[p.tono];
          return (
            <li key={p.clave}>
              <Link
                href={p.href}
                className="simar-tarjeta-accion flex items-center gap-4 h-full min-h-[104px] p-5 rounded-[22px] bg-simar-superficie border border-simar-borde shadow-simar movil:min-h-[84px] movil:gap-3 movil:p-3.5 movil:rounded-[20px]"
              >
                <span className={`w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center ${t.circulo} movil:w-11 movil:h-11`}>
                  <p.Icon aria-hidden="true" className="w-7 h-7 movil:w-[22px] movil:h-[22px]" strokeWidth={2} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[15px] font-bold leading-snug ${t.insignia} movil:text-[13px]`}>{p.insignia}</span>
                  <span className="block text-[21px] font-extrabold leading-snug text-simar-texto movil:text-[16px]">
                    {/* Si el número cambia en vivo, el título entra de nuevo con un pulso */}
                    <span key={p.total} className="simar-confirma inline-block">{p.titulo}</span>
                  </span>
                  <span className="block mt-0.5 text-[17px] leading-snug text-simar-texto-2 movil:text-[13.5px] movil:line-clamp-2">{p.detalle}</span>
                </span>
                <span className="flex-shrink-0 inline-flex items-center gap-1 min-h-[52px] px-5 rounded-2xl bg-simar-marea text-white text-[17px] font-bold movil:hidden">
                  {p.accion}
                  <ChevronRight aria-hidden="true" className="w-5 h-5" strokeWidth={2.4} />
                </span>
                <ChevronRight aria-hidden="true" className="hidden movil:block w-5 h-5 flex-shrink-0 text-simar-texto-2" strokeWidth={2} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "Jue" y "8" de una fecha YYYY-MM-DD */
function diaCorto(fecha: string) {
  const d = new Date(`${fecha}T12:00:00`);
  const dia = d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '');
  return { dia: dia.charAt(0).toUpperCase() + dia.slice(1), numero: d.getDate(), mes: d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '') };
}

/** Próximas recolecciones: las aprobadas de los próximos días, como una agenda (tarjeta blanca) */
function ProximasRecolecciones({ proximas, hoy, base }: { proximas: ResumenPanel['proximas']; hoy: string; base: string }) {
  const dias = (f: string) => Math.round((new Date(`${f}T12:00:00`).getTime() - new Date(`${hoy}T12:00:00`).getTime()) / 86400000);
  return (
    <section aria-labelledby="agenda" className="simar-aparece min-w-0 flex flex-col" style={{ animationDelay: '0.08s' }}>
      <h2 id="agenda" className="flex items-center gap-2 text-xl font-bold text-simar-texto-2 movil:text-[15px] movil:px-1">
        Próximas recolecciones
      </h2>
      <div className="mt-3.5 flex-1 flex flex-col bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] overflow-hidden movil:mt-2 movil:rounded-[20px]">
        <ul className="flex-1 divide-y divide-simar-borde-suave">
          {proximas.lista.map((s) => {
            const d = diaCorto(s.fechaPropuesta);
            const n = dias(s.fechaPropuesta);
            return (
              <li key={s.id}>
                <Link href={`${base}/asociaciones?solicitud=${s.id}`} className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-simar-papel/60 movil:gap-3 movil:px-3 movil:py-2.5">
                  {/* El día como en un calendario */}
                  <span className="w-[58px] flex-shrink-0 rounded-2xl bg-simar-marea-suave text-center py-1.5 movil:w-[50px] movil:py-1">
                    <span className="block text-[14px] font-bold leading-tight text-simar-marea-tinta movil:text-[12px]">{d.dia}</span>
                    <span className="block text-[24px] font-extrabold leading-none text-simar-texto movil:text-[20px]">{d.numero}</span>
                    <span className="block text-[13px] leading-tight text-simar-texto-2 movil:text-[11px]">{d.mes}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[18px] font-bold leading-snug text-simar-texto truncate movil:whitespace-normal movil:line-clamp-2 movil:text-[15px]">{s.empresa}</span>
                    <span className="block text-[16px] leading-snug text-simar-texto-2 movil:text-[13px]">{residuo(s)}</span>
                  </span>
                  <span className={`flex-shrink-0 text-[15px] font-bold text-simar-marea-tinta movil:text-[13px]`}>
                    {n === 1 ? 'Mañana' : `En ${n} días`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href={`${base}/asociaciones?ver=por-recolectar`}
          className="flex items-center justify-center gap-1 min-h-[48px] border-t border-simar-borde-suave text-[16px] font-bold text-simar-marea-tinta hover:bg-simar-papel/60 movil:min-h-[42px] movil:text-[14px]"
        >
          {proximas.total > proximas.lista.length ? `Ver las ${proximas.total}` : 'Ver en Solicitudes'}
          <ChevronRight aria-hidden="true" className="w-4 h-4" strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
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
        href: `${base}/manifiesto?ver=${m.id}`,
      };
    case 'basuron':
      return {
        Icon: Scale,
        tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        titulo: 'Recibo del basurón',
        detalle: [`${formatCantidad(m.kg)} kg`, m.deQuien].filter(Boolean).join(' · '),
        href: `${base}/manifiesto-basuron?ver=${m.id}`,
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
  const hayAgenda = (resumen?.proximas.total ?? 0) > 0;
  const conteos = vistazo?.conteos;

  return (
    // En columna para poder reacomodar en celular: ahí "Un vistazo" baja al final (movil:order-1)
    <div className="relative max-w-[1600px] flex flex-col">
      <PanelEnVivo />

      {/* Encabezado: marca SiMAR + saludo del momento y lo que va del día */}
      <section data-recorrido="panel-saludo" className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[30px] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-9 movil:p-4 movil:gap-2.5">
        {/* La marca grande sólo con espacio (≥ 1280 px): en pantallas menores ya está en el menú o en la
            píldora de arriba, y le quitaba lugar al saludo ("Buenas / noches" en dos renglones) */}
        <div className="hidden xl:flex items-center gap-4 flex-shrink-0">
          <LogoSimar variante="simbolo" tamano={92} />
          <div>
            <LogoSimar variante="nombre" tamano={80} />
            <p className="mt-2.5 text-[17px] leading-snug text-simar-texto-2 max-w-[240px]">
              Sistema Integral de Manejo Ambiental de Residuos
            </p>
          </div>
        </div>
        <div aria-hidden="true" className="hidden xl:block w-px self-stretch bg-simar-borde" />
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

      {/* Lo importante, a la vista: Por atender (tarjetas de color, cada una lleva a donde se resuelve) y
          las próximas recolecciones aprobadas. Lado a lado si están las dos; cada una sólo si hay algo */}
      {(pendientes.length > 0 || hayAgenda) && (
        <div data-recorrido="panel-importante" className={`mt-5 md:mt-7 grid gap-5 movil:mt-3 movil:gap-3 ${pendientes.length > 0 && hayAgenda ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]' : ''}`}>
          {pendientes.length > 0 && <PorAtender pendientes={pendientes} angosto={hayAgenda} />}
          {hayAgenda && resumen && <ProximasRecolecciones proximas={resumen.proximas} hoy={hoy} base={base} />}
        </div>
      )}

      {/* Acciones principales */}
      <div data-recorrido="panel-acciones" className="mt-5 md:mt-7 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 movil:grid-cols-2 movil:gap-3 movil:mt-3">
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
          description="Cifras y reportes"
          dato={resumen ? `${formatCantidad(resumen.manifiestosMes)} ${plural(resumen.manifiestosMes, 'manifiesto', 'manifiestos')} en 30 días` : undefined}
          href={`${base}/estadisticas`}
          tono="bg-simar-violeta-suave text-simar-violeta"
          delay="0.2s"
        />
      </div>

      {/* Un vistazo: lo último registrado y lo que hay en el acopio. En celular va al final, después
          de "Otras secciones", para que lo de arriba siga cabiendo en una pantalla */}
      {vistazo && (
        <div className="mt-5 md:mt-7 grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4 md:gap-6 movil:order-1 movil:mt-5 movil:gap-3">
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
            label="Empresas"
            dato={conteos && `${conteos.asociacionesActivas} ${plural(conteos.asociacionesActivas, 'activa', 'activas')}`}
          />
        </div>
      </section>
    </div>
  );
}
