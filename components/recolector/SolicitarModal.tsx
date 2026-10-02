'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { PUERTO_PENASCO, formatCantidad, unidadEscrita, type TipoResiduo } from '@/lib/constants/residuos';
import { hoyLocal } from '@/lib/utils/fechas';
import { InventarioResiduo } from '@/types/database';
import { crearSolicitud } from '@/lib/services/solicitudes';
import { BotonPrimario, BotonSecundario, Campo, Modal, ResiduoBadge, inputCls, mensajeError } from '@/components/asociaciones/ui';
import { SelectorFecha } from '@/components/ui/SelectorFecha';

/**
 * Ventana para pedir un residuo del centro de acopio. La usan Residuos disponibles y el Inicio del
 * portal. Si la cantidad o la fecha no sirven, lo dice debajo del campo (no sólo apaga el botón).
 */
export function SolicitarModal({
    residuo,
    onClose,
    onCreada,
    locale,
    enfocar = true,
}: {
    residuo: InventarioResiduo;
    onClose: () => void;
    onCreada: () => void;
    locale: string;
    /** En celular no: el teclado taparía media hoja antes de ver qué se pide */
    enfocar?: boolean;
}) {
    const hoy = hoyLocal();
    const [cantidad, setCantidad] = useState(String(residuo.cantidad));
    const [fecha, setFecha] = useState(hoy);
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);

    const valor = Number(cantidad);
    const maximo = `${formatCantidad(residuo.cantidad)} ${unidadEscrita(residuo.unidad, residuo.cantidad)}`;
    const errorCantidad = !cantidad
        ? 'Escribe cuánto quieres recoger.'
        : Number.isNaN(valor) || valor <= 0
          ? 'La cantidad debe ser mayor que cero.'
          : valor > residuo.cantidad
            ? `Sólo hay ${maximo} disponibles.`
            : null;
    const errorFecha = !fecha ? 'Elige el día de la recolección.' : fecha < hoy ? 'La fecha no puede ser anterior a hoy.' : null;

    const enviar = async () => {
        setEnviando(true);
        try {
            await crearSolicitud({ tipo: residuo.tipo as TipoResiduo, cantidad: valor, fechaPropuesta: fecha, mensaje });
            toast.success('Solicitud enviada al centro de acopio', {
                description: 'Te avisaremos cuando la aprueben.',
                action: {
                    label: 'Ver',
                    onClick: () => (window.location.href = `/${locale}/dashboard-recolector/solicitudes`),
                },
            });
            onCreada();
        } catch (err) {
            toast.error(mensajeError(err));
            setEnviando(false);
        }
    };

    return (
        <Modal titulo="Solicitar recolección" subtitulo={`${PUERTO_PENASCO.nombre} · disponible: ${maximo}`} onClose={onClose}>
            <div className="space-y-4">
                <ResiduoBadge tipo={residuo.tipo} size="md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Campo label={`Cantidad (${residuo.unidad})`} ayuda={errorCantidad ? undefined : `Máximo ${maximo}`}>
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            max={residuo.cantidad}
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            aria-invalid={!!errorCantidad}
                            className={inputCls}
                            autoFocus={enfocar}
                        />
                        {errorCantidad && <span className="block mt-1.5 text-[15px] font-bold text-simar-coral">{errorCantidad}</span>}
                    </Campo>
                    <Campo label="Fecha propuesta de recolección">
                        <SelectorFecha etiqueta="Fecha propuesta de recolección" valor={fecha} onCambiar={setFecha} min={hoy} />
                        {errorFecha && <span className="block mt-1.5 text-[15px] font-bold text-simar-coral">{errorFecha}</span>}
                    </Campo>
                </div>
                <Campo label="Mensaje (opcional)" ayuda="Horario, tipo de unidad que enviarás, persona que recoge…">
                    <textarea rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className={inputCls} />
                </Campo>
                {/* En celular la acción principal lleva el ancho sobrante: "Enviar solicitud" en una línea */}
                <div className="grid grid-cols-2 gap-3 pt-1 movil:grid-cols-[auto_1fr]">
                    <BotonSecundario onClick={onClose}>Cancelar</BotonSecundario>
                    <BotonPrimario onClick={enviar} cargando={enviando} disabled={!!errorCantidad || !!errorFecha}>
                        <Send className="w-4 h-4" /> Enviar solicitud
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}
