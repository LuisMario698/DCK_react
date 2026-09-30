'use client';

/**
 * "¿A dónde se fue?" de Estadísticas: cierra la trazabilidad que promete SiMAR. Por material:
 * lo que se recibió de las embarcaciones en el período → lo que se llevaron las empresas
 * recolectoras (recolecciones completadas del período) → lo que sigue hoy en el centro de acopio
 * (inventario, no depende del período), con quién se lo llevó.
 *
 * Aceite y filtros coinciden en ambos lados (manifiestos e inventario), así que llevan el
 * porcentaje "ya salió a reciclaje". Los reciclables (plástico, cartón…) no: en los manifiestos
 * sólo hay "basura" en general, así que ahí se muestra lo que salió y lo que queda, sin porcentaje.
 */
import { ArrowDown, Droplet, Filter, Recycle, type LucideIcon } from 'lucide-react';
import { NumeroAnimado } from '@/components/ui/movimiento';
import type { DestinoResiduos as Destino, EmpresaRecolectora, TotalesPeriodo } from '@/lib/services/dashboard_stats';
import { TIPO_RESIDUO_LABEL, type TipoResiduo } from '@/lib/constants/residuos';

const fmt = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: n < 100 && !Number.isInteger(n) ? 1 : 0 });

/** "Recicladora del Golfo (1,400 L) y EcoPeñasco (700 L)"; con más de dos, "y 3 más" */
function textoEmpresas(empresas: EmpresaRecolectora[], unidad: string) {
    const nombres = empresas.slice(0, 2).map((e) => `${e.nombre} (${fmt(e.cantidad)} ${unidad})`);
    const resto = empresas.length - 2;
    return resto > 0 ? `${nombres.join(', ')} y ${resto} más` : nombres.join(' y ');
}

/**
 * El recorrido, de arriba abajo: recibido ↓ a reciclaje ↓ en acopio hoy (o sin "recibido").
 * Vertical y no en fila: en la tarjeta de un tercio de ancho, tres cajas lado a lado cortaban
 * las cantidades.
 */
function Recorrido({ pasos }: { pasos: { etiqueta: string; valor: number; unidad: string; destacado?: boolean }[] }) {
    return (
        <ol className="mt-4 movil:mt-3">
            {pasos.map((p, i) => (
                <li key={p.etiqueta}>
                    {i > 0 && <ArrowDown aria-hidden="true" className="ml-3.5 my-0.5 w-4 h-4 text-simar-texto-3" strokeWidth={2.4} />}
                    <div
                        className={`flex items-baseline justify-between gap-3 rounded-xl px-3.5 py-2.5 movil:px-3 movil:py-2 ${p.destacado ? 'bg-simar-arrecife-suave' : 'bg-simar-papel'}`}
                    >
                        <span className={`text-[15px] font-bold leading-tight movil:text-[13.5px] ${p.destacado ? 'text-simar-arrecife-tinta' : 'text-simar-texto-2'}`}>
                            {p.etiqueta}
                        </span>
                        <span className="text-[21px] font-extrabold leading-none text-simar-texto whitespace-nowrap movil:text-[18px]">
                            <NumeroAnimado valor={p.valor} decimales={p.valor < 100 && !Number.isInteger(p.valor) ? 1 : 0} />
                            <span className="ml-1 text-[14px] font-bold text-simar-texto-2 movil:text-[12.5px]">{p.unidad}</span>
                        </span>
                    </div>
                </li>
            ))}
        </ol>
    );
}

/** Barra de "cuánto de lo recibido ya salió", con su explicación en palabras */
function AvanceReciclaje({ recibido, reciclado, nombre }: { recibido: number; reciclado: number; nombre: string }) {
    let texto: string;
    let pct = 0;
    if (recibido <= 0 && reciclado <= 0) texto = 'Sin movimiento en el período';
    else if (recibido <= 0) texto = `Lo que salió venía del acopio: en el período no se recibió ${nombre}`;
    else if (reciclado > recibido) {
        pct = 100;
        texto = `Salió más de lo recibido: también se llevaron ${nombre} que ya estaba en acopio`;
    } else {
        pct = Math.round((reciclado / recibido) * 100);
        texto = `${pct} % de lo recibido ya salió a reciclaje`;
    }
    return (
        <div className="mt-3">
            {recibido > 0 && (
                <div className="h-2.5 rounded-full bg-simar-papel overflow-hidden movil:h-2" aria-hidden="true">
                    <div
                        className="simar-crece-x h-full rounded-full bg-simar-arrecife transition-[width] duration-500"
                        style={{ width: `${pct}%`, animationDelay: '0.35s', transitionTimingFunction: 'var(--simar-frena)' }}
                    />
                </div>
            )}
            <p className="mt-1.5 text-[15px] font-bold text-simar-texto movil:text-[13.5px]">{texto}</p>
        </div>
    );
}

function TarjetaMaterial({
    icono: Icono,
    titulo,
    detalle,
    children,
    empresas,
}: {
    icono: LucideIcon;
    titulo: string;
    detalle?: string;
    children: React.ReactNode;
    empresas: string;
}) {
    return (
        <li className="rounded-[22px] border border-simar-borde-suave p-4 md:p-5 flex flex-col min-w-0 movil:p-3.5 movil:rounded-[18px]">
            <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 flex-shrink-0 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta flex items-center justify-center movil:w-8 movil:h-8">
                    <Icono className="w-5 h-5 movil:w-[17px] movil:h-[17px]" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h4 className="text-[18px] font-extrabold leading-tight text-simar-texto movil:text-[16px]">{titulo}</h4>
                    {detalle && <p className="text-[14px] leading-snug text-simar-texto-2 movil:text-[12.5px]">{detalle}</p>}
                </div>
            </div>
            {children}
            <p className="mt-auto pt-3 text-[14px] leading-snug text-simar-texto-2 movil:pt-2.5 movil:text-[12.5px]">
                {empresas ? (
                    <>
                        <span className="font-bold text-simar-texto">Se lo llevaron:</span> {empresas}
                    </>
                ) : (
                    'Ninguna empresa se lo llevó en el período'
                )}
            </p>
        </li>
    );
}

export function DestinoResiduos({ destino, recibidos }: { destino: Destino; recibidos: TotalesPeriodo }) {
    const { aceite, filtros, reciclables } = destino;
    return (
        <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 md:p-7 movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-3">
                <span className="w-12 h-12 flex-shrink-0 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta flex items-center justify-center movil:w-9 movil:h-9">
                    <Recycle className="w-6 h-6 movil:w-[18px] movil:h-[18px]" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h3 className="text-[22px] md:text-2xl font-extrabold text-simar-texto movil:text-[18px]">¿A dónde se fue?</h3>
                    <p className="text-[17px] text-simar-texto-2 movil:text-[14px]">
                        Lo que se recibió, lo que ya salió a reciclaje con las empresas recolectoras y lo que sigue en el centro de acopio
                    </p>
                </div>
            </div>

            {!destino.hayDatos ? (
                <p className="mt-4 rounded-2xl bg-simar-papel px-5 py-8 text-center text-[17px] text-simar-texto-2 movil:text-[14px]">
                    Todavía no hay recolecciones ni inventario registrados. Cuando una empresa recolectora se lleve residuos del centro de acopio, aquí se verá a
                    dónde fueron.
                </p>
            ) : (
                <ul className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 movil:mt-3.5 movil:gap-2.5">
                    <TarjetaMaterial icono={Droplet} titulo="Aceite usado" empresas={textoEmpresas(aceite.empresas, 'L')}>
                        <Recorrido
                            pasos={[
                                { etiqueta: 'Recibido', valor: aceite.recibido, unidad: 'L' },
                                { etiqueta: 'A reciclaje', valor: aceite.reciclado, unidad: 'L', destacado: true },
                                { etiqueta: 'En acopio hoy', valor: aceite.enAcopio, unidad: 'L' },
                            ]}
                        />
                        <AvanceReciclaje recibido={aceite.recibido} reciclado={aceite.reciclado} nombre="aceite" />
                    </TarjetaMaterial>

                    <TarjetaMaterial
                        icono={Filter}
                        titulo="Filtros de motor"
                        detalle={`Recibidos: ${fmt(recibidos.filtrosAceite)} de aceite · ${fmt(recibidos.filtrosDiesel)} de diésel · ${fmt(recibidos.filtrosAire)} de aire`}
                        empresas={textoEmpresas(filtros.empresas, 'pz')}
                    >
                        <Recorrido
                            pasos={[
                                { etiqueta: 'Recibidos', valor: filtros.recibido, unidad: 'pz' },
                                { etiqueta: 'A reciclaje', valor: filtros.reciclado, unidad: 'pz', destacado: true },
                                { etiqueta: 'En acopio hoy', valor: filtros.enAcopio, unidad: 'pz' },
                            ]}
                        />
                        <AvanceReciclaje recibido={filtros.recibido} reciclado={filtros.reciclado} nombre="filtros" />
                    </TarjetaMaterial>

                    <TarjetaMaterial
                        icono={Recycle}
                        titulo="Materiales reciclables"
                        detalle="Plástico, cartón, chatarra, vidrio y orgánico, ya separados"
                        empresas={textoEmpresas(reciclables.empresas, 'kg')}
                    >
                        <Recorrido
                            pasos={[
                                { etiqueta: 'A reciclaje', valor: reciclables.reciclado, unidad: 'kg', destacado: true },
                                { etiqueta: 'En acopio hoy', valor: reciclables.enAcopio, unidad: 'kg' },
                            ]}
                        />
                        <p className="mt-3 text-[15px] font-bold text-simar-texto movil:text-[13.5px]">
                            {reciclables.porTipo.length > 0
                                ? reciclables.porTipo.map((t) => `${TIPO_RESIDUO_LABEL[t.tipo as TipoResiduo] ?? t.tipo} ${fmt(t.reciclado)} kg`).join(' · ')
                                : 'Sin salidas en el período'}
                        </p>
                    </TarjetaMaterial>
                </ul>
            )}
        </section>
    );
}
