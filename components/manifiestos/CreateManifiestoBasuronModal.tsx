'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';
import { TimePicker } from '@/components/ui/TimePicker';
import { CalendarDays, Check, Clock, Scale, Upload } from 'lucide-react';
import { horaLocal, hoyLocal, parseFechaLocal } from '@/lib/utils/fechas';
import { PalomitaAnimada } from '@/components/ui/movimiento';

// Registrar locale español
registerLocale('es', es);

interface Buque {
  id: number;
  nombre_buque: string;
  matricula?: string;
}

interface CreateManifiestoBasuronModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buques: Buque[];
  inline?: boolean;
  /** Pestañas de celular (Nuevo / Registros) que van justo bajo el encabezado */
  pestanasMovil?: ReactNode;
  /** En celular, con la pestaña "Registros" el formulario se oculta y sólo queda el encabezado */
  ocultarFormularioMovil?: boolean;
}

export function CreateManifiestoBasuronModal({
  isOpen,
  onClose,
  onSuccess,
  buques,
  inline = false,
  pestanasMovil,
  ocultarFormularioMovil = false,
}: CreateManifiestoBasuronModalProps) {
  const [loading, setLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const buqueSelectRef = useRef<HTMLSelectElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fecha y hora arrancan vacías y se llenan al montar en el navegador: calcularlas
  // aquí daría valores distintos en el servidor (UTC) y en el cliente (hora local)
  // y rompería la hidratación.
  const [formData, setFormData] = useState({
    fecha: '',
    hora_entrada: '',
    hora_salida: '',
    peso_entrada: '',
    peso_salida: '',
    buque_id: '',
    recibimos_de: '',
    direccion: '',
    observaciones: '',
    nombre_usuario: '',
  });

  useEffect(() => {
    if (isOpen || inline) {
      resetForm();
    }
  }, [isOpen, inline]);

  const resetForm = () => {
    setFormData({
      fecha: hoyLocal(),
      hora_entrada: horaLocal(),
      hora_salida: '',
      peso_entrada: '',
      peso_salida: '',
      buque_id: '',
      recibimos_de: '',
      direccion: '',
      observaciones: '',
      nombre_usuario: '',
    });
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowValidation(false);
  };

  const calcularTotalDepositado = () => {
    const entrada = parseFloat(formData.peso_entrada) || 0;
    const salida = parseFloat(formData.peso_salida) || 0;
    return Math.max(0, entrada - salida);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones - ahora recibimos_de es texto libre
    if (!formData.recibimos_de || !formData.peso_entrada || !formData.peso_salida) {
      setShowValidation(true);
      return;
    }

    setLoading(true);
    try {
      const pesoEntrada = parseFloat(formData.peso_entrada);
      const pesoSalida = parseFloat(formData.peso_salida);

      const horaEntradaSql = formData.hora_entrada && formData.hora_entrada.length === 5
        ? `${formData.hora_entrada}:00`
        : formData.hora_entrada;
      const horaSalidaSql = formData.hora_salida.length === 5
        ? `${formData.hora_salida}:00`
        : (formData.hora_salida ? formData.hora_salida : null);

      const payload: any = {
        fecha: formData.fecha,
        hora_entrada: horaEntradaSql,
        hora_salida: horaSalidaSql,
        peso_entrada: pesoEntrada,
        peso_salida: pesoSalida,
        // buque_id ya no es obligatorio, enviamos null si no hay
        buque_id: formData.buque_id ? parseInt(formData.buque_id) : null,
        observaciones: formData.observaciones, // Ya no concatenamos datos
        recibimos_de: formData.recibimos_de,
        direccion: formData.direccion,
        recibido_por: formData.nombre_usuario, // Mapeamos input "Recibí" a columna recibido_por
        nombre_usuario: formData.nombre_usuario, // Mantenemos compatibilidad por si acaso
      };

      await createManifiestoBasuron(payload, file || undefined);

      alert('✅ Registro creado exitosamente');
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      const details = typeof error === 'object' ? JSON.stringify(error) : String(error);
      console.error('Error creando manifiesto basurón:', error, details);
      const msg = error?.message || error?.details || error?.hint || details || 'Error desconocido';
      alert('❌ Error al crear el registro: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !inline) return null;

  const selectedBuque = buques.find(b => b.id === parseInt(formData.buque_id));
  const soloEnNuevo = ocultarFormularioMovil ? 'movil:hidden' : '';

  return (
    <div className={inline ? '' : 'simar-velo fixed inset-0 bg-[rgba(11,34,54,0.55)] flex items-center justify-center z-50 p-4'}>
      <div className={inline ? 'w-full' : 'simar-ventana bg-simar-papel rounded-[28px] shadow-2xl max-w-7xl w-full h-full overflow-y-auto p-6'}>
        {/* Recibo del relleno sanitario — lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
        <form onSubmit={handleSubmit} className="space-y-6 movil:space-y-4">
          {/* Encabezado del recibo */}
          <header className="simar-aparece flex flex-wrap items-center gap-5 movil:gap-x-3 movil:gap-y-2">
            <span className="w-16 h-16 flex-shrink-0 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta flex items-center justify-center movil:w-[40px] movil:h-[40px] movil:self-start movil:mt-0.5">
              <Scale className="w-[30px] h-[30px] movil:w-[22px] movil:h-[22px]" strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-[240px] movil:min-w-0">
              <h1 className="text-[28px] md:text-[34px] font-extrabold leading-tight text-simar-texto movil:text-[19px]">Recibo del relleno sanitario</h1>
              <p className="mt-1 text-lg md:text-[19px] text-simar-texto-2 movil:mt-0 movil:text-[14px]">Puerto Peñasco, Sonora a {formData.fecha ? parseFechaLocal(formData.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
            </div>
            {/* En celular el total ya se ve al final de Pesaje */}
            <div className="px-5 py-2.5 rounded-2xl bg-simar-superficie border border-simar-borde shadow-simar text-right movil:hidden">
              <p className="text-[15px] text-simar-texto-2">Total depositado</p>
              <p className="text-[21px] font-extrabold text-simar-texto">{calcularTotalDepositado().toFixed(0)} kg</p>
            </div>
          </header>

          {pestanasMovil}

          <div className={`grid grid-cols-1 lg:grid-cols-[1.08fr_1fr] gap-6 movil:gap-4 ${soloEnNuevo}`}>
            {/* COLUMNA IZQUIERDA - Datos del recibo */}
            <section className="simar-aparece flex flex-col bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 md:p-7 movil:p-4" style={{ animationDelay: '0.06s' }}>
              <h2 className="text-[23px] font-extrabold text-simar-texto">Datos del recibo</h2>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 movil:mt-3 movil:grid-cols-2 movil:gap-2.5">
                {/* FECHA */}
                <div>
                  <label className="block mb-2 text-[17px] font-bold text-simar-texto">Fecha</label>
                  <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'fecha' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
                    <CalendarDays className="w-[22px] h-[22px] text-simar-texto-2 flex-shrink-0 pointer-events-none" />
                    <DatePicker
                      selected={formData.fecha ? new Date(formData.fecha + 'T00:00:00') : null}
                      onChange={(date: Date | null) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setFormData({ ...formData, fecha: `${year}-${month}-${day}` });
                        }
                      }}
                      onFocus={() => setActiveField('fecha')}
                      onBlur={() => setActiveField(null)}
                      dateFormat="dd/MM/yyyy"
                      locale="es"
                      showPopperArrow={false}
                      className="w-full bg-transparent focus:outline-none !text-simar-texto !font-bold text-xl cursor-pointer"
                      wrapperClassName="flex-1"
                      popperClassName="datepicker-popper"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      todayButton="Hoy"
                    />
                  </div>
                </div>

                {/* HORA */}
                <div>
                  <label className="block mb-2 text-[17px] font-bold text-simar-texto">Hora</label>
                  <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'horaEntrada' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
                    <Clock className="w-[22px] h-[22px] text-simar-texto-2 flex-shrink-0 pointer-events-none" />
                    <TimePicker
                      value={formData.hora_entrada || ''}
                      onChange={(time) => setFormData({ ...formData, hora_entrada: time })}
                      onFocus={() => setActiveField('horaEntrada')}
                      onBlur={() => setActiveField(null)}
                      className="!px-0 bg-transparent focus:outline-none text-simar-texto text-xl font-bold cursor-pointer"
                      placeholder="HH:MM"
                    />
                  </div>
                </div>
              </div>

              {/* RECIBIMOS DE - Campo de texto libre */}
              <div className="mt-5 movil:mt-3">
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Recibimos de</label>
                <input
                  type="text"
                  value={formData.recibimos_de}
                  onChange={(e) => {
                    setFormData({ ...formData, recibimos_de: e.target.value });
                    setShowValidation(false);
                  }}
                  onFocus={() => setActiveField('recibimos')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Nombre de quien entrega..."
                  className={`w-full min-h-[60px] px-4 rounded-[14px] border-2 bg-simar-superficie focus:outline-none text-lg font-bold text-simar-texto placeholder:text-simar-texto-3 placeholder:font-medium transition-colors ${showValidation && !formData.recibimos_de ? 'border-simar-coral' : activeField === 'recibimos' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'
                    }`}
                />
                {showValidation && !formData.recibimos_de && <p className="mt-1.5 text-[15px] font-bold text-simar-coral">* Requerido</p>}
              </div>

              {/* DIRECCIÓN */}
              <div className="mt-5 movil:mt-3">
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Dirección <span className="font-medium text-simar-texto-2">(opcional)</span></label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  onFocus={() => setActiveField('direccion')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Dirección..."
                  className={`w-full min-h-[60px] px-4 rounded-[14px] border-2 bg-simar-superficie focus:outline-none text-lg font-bold text-simar-texto placeholder:text-simar-texto-3 placeholder:font-medium transition-colors ${activeField === 'direccion' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'
                    }`}
                />
              </div>

              {/* RECIBÍ */}
              <div className="mt-5 movil:mt-3">
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Recibí</label>
                <input
                  type="text"
                  value={formData.nombre_usuario}
                  onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                  onFocus={() => setActiveField('usuario')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Nombre de quien recibe"
                  className={`w-full min-h-[60px] px-4 rounded-[14px] border-2 bg-simar-superficie focus:outline-none text-lg font-bold text-simar-texto placeholder:text-simar-texto-3 placeholder:font-medium transition-colors ${activeField === 'usuario' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'
                    }`}
                />
              </div>

              {/* Observaciones (crece para que la tarjeta termine a la par de Pesaje) */}
              <div className="mt-5 flex-1 flex flex-col movil:mt-3">
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Observaciones <span className="font-medium text-simar-texto-2">(opcional)</span></label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  onFocus={() => setActiveField('observaciones')}
                  onBlur={() => setActiveField(null)}
                  rows={3}
                  placeholder="Notas adicionales..."
                  className={`w-full flex-1 min-h-[110px] movil:min-h-[80px] px-4 py-3 rounded-[14px] border-2 bg-simar-superficie outline-none resize-none text-lg text-simar-texto placeholder:text-simar-texto-3 transition-colors ${activeField === 'observaciones' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}
                />
              </div>
            </section>

            {/* COLUMNA DERECHA - Pesaje */}
            <section className="simar-aparece flex flex-col bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 md:p-7 movil:p-4" style={{ animationDelay: '0.12s' }}>
              <h2 className="text-[23px] font-extrabold text-simar-texto">Pesaje</h2>

              {/* flex items-center gap-2.5 min-h-[64px] px-4 rounded-[14px] border-2 bg-simar-superficie transition-colors DE ENTRADA */}
              <div className="mt-5 movil:mt-3">
                <p className="flex items-baseline gap-2.5"><span className="text-lg font-extrabold text-simar-texto">Peso de entrada</span><span className="text-[15px] font-bold text-simar-coral">Requerido</span></p>
                <p className="text-[15px] text-simar-texto-2">Vehículo con carga</p>
                <div className={`mt-2 flex items-center gap-2.5 min-h-[64px] px-4 rounded-[14px] border-2 bg-simar-superficie transition-colors ${showValidation && !formData.peso_entrada ? 'border-simar-coral' : activeField === 'pesoEntrada' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.peso_entrada}
                    onChange={(e) => setFormData({ ...formData, peso_entrada: e.target.value })}
                    onFocus={() => setActiveField('pesoEntrada')}
                    onBlur={() => setActiveField(null)}
                    placeholder="0"
                    aria-label="Peso de entrada en kilos"
                    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[26px] font-extrabold text-simar-texto placeholder:text-simar-texto-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[17px] font-bold text-simar-texto-2">kg</span>
                </div>
                {showValidation && !formData.peso_entrada && <p className="mt-1.5 text-[15px] font-bold text-simar-coral">* Requerido</p>}

                {/* Botones rápidos (en celular, una fila que se desliza de lado) */}
                <div className="simar-desliza mt-3 flex flex-wrap items-center gap-2 movil:flex-nowrap movil:overflow-x-auto movil:-mx-4 movil:px-4 movil:gap-1.5">
                  <span className="text-[15px] font-bold text-simar-texto-2 mr-1 flex-shrink-0">Rápido:</span>
                  {[500, 1000, 1500, 2000, 2500, 3000].map(peso => (
                    <button
                      key={peso}
                      type="button"
                      onClick={() => setFormData({ ...formData, peso_entrada: String(peso) })}
                      className="min-h-[44px] px-3.5 rounded-xl text-base font-bold text-simar-texto bg-simar-superficie border-2 border-simar-campo-borde hover:border-simar-marea-tinta transition-colors flex-shrink-0 whitespace-nowrap"
                    >
                      {peso >= 1000 ? `${peso / 1000}T` : `${peso}kg`}
                    </button>
                  ))}
                </div>
              </div>

              {/* flex items-center gap-2.5 min-h-[64px] px-4 rounded-[14px] border-2 bg-simar-superficie transition-colors DE SALIDA */}
              <div className="mt-6 pt-5 border-t border-simar-borde-suave movil:mt-4 movil:pt-4">
                <p className="flex items-baseline gap-2.5"><span className="text-lg font-extrabold text-simar-texto">Peso de salida</span><span className="text-[15px] font-bold text-simar-coral">Requerido</span></p>
                <p className="text-[15px] text-simar-texto-2">Vehículo sin carga</p>
                <div className={`mt-2 flex items-center gap-2.5 min-h-[64px] px-4 rounded-[14px] border-2 bg-simar-superficie transition-colors ${showValidation && !formData.peso_salida ? 'border-simar-coral' : activeField === 'pesoSalida' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.peso_salida}
                    onChange={(e) => setFormData({ ...formData, peso_salida: e.target.value })}
                    onFocus={() => setActiveField('pesoSalida')}
                    onBlur={() => setActiveField(null)}
                    placeholder="0"
                    aria-label="Peso de salida en kilos"
                    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[26px] font-extrabold text-simar-texto placeholder:text-simar-texto-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[17px] font-bold text-simar-texto-2">kg</span>
                </div>
                {showValidation && !formData.peso_salida && <p className="mt-1.5 text-[15px] font-bold text-simar-coral">* Requerido</p>}
              </div>

              {/* TOTAL DEPOSITADO */}
              <div className="mt-6 flex-1 flex flex-col justify-end movil:mt-4">
                <div className="rounded-[22px] bg-simar-marea-suave px-5 py-4 flex items-center justify-between gap-4 movil:px-4 movil:py-3">
                  <span className="text-lg font-bold text-simar-texto">Total depositado</span>
                  <span className="text-[34px] font-extrabold leading-none text-simar-marea-tinta">{calcularTotalDepositado().toFixed(0)} <span className="text-xl text-simar-texto-2">kg</span></span>
                </div>

                {/* Info de embarcación seleccionada */}
                {selectedBuque && (
                  <div className="mt-3 rounded-[22px] bg-simar-arrecife-suave px-5 py-4 flex items-center gap-3">
                    <Check className="w-6 h-6 text-simar-arrecife-tinta flex-shrink-0" strokeWidth={2.6} />
                    <div>
                      <p className="text-[15px] font-bold text-simar-arrecife-tinta">Embarcación seleccionada</p>
                      <p className="text-lg font-bold text-simar-texto">{selectedBuque.nombre_buque}</p>
                      {selectedBuque.matricula && (
                        <p className="text-[15px] text-simar-texto-2">Matrícula: {selectedBuque.matricula}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Documento digitalizado (franja a lo ancho, como en Manifiesto) */}
          <section className={`simar-aparece bg-simar-superficie border shadow-simar rounded-[28px] p-6 md:p-7 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-7 movil:p-4 movil:gap-3 ${!file && showValidation ? 'border-simar-coral' : 'border-simar-borde'} ${soloEnNuevo}`} style={{ animationDelay: '0.18s' }}>
            <div className="flex items-center gap-3 lg:w-[290px] flex-shrink-0">
              <span className="movil:w-10 movil:h-10 w-12 h-12 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-simar-texto">Documento</h2>
                <p className="text-[15px] text-simar-texto-2">Foto o PDF del recibo firmado</p>
              </div>
            </div>
            {/* Botón propio en lugar del control nativo, que en celular corta su texto ("Sin archivos…") */}
            <div className={`flex-1 min-h-[64px] rounded-[14px] p-2 flex items-center border-2 ${file ? 'border-simar-arrecife/50 bg-simar-arrecife-suave' : 'border-dashed border-simar-campo-borde'}`}>
              <input
                ref={fileInputRef}
                id="archivo-basuron"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="sr-only"
              />
              {!file ? (
                <label htmlFor="archivo-basuron" className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 text-[17px] font-bold text-simar-texto cursor-pointer rounded-xl hover:bg-simar-marea-suave/60 transition-colors">
                  <Upload className="w-5 h-5" />
                  Elegir foto o PDF
                </label>
              ) : (
                <div className="w-full flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <PalomitaAnimada tamano={20} circulo={false} className="text-simar-arrecife-tinta" />
                    <span className="text-[15px] font-bold text-simar-texto truncate">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="min-h-[44px] px-3 text-[15px] font-bold text-simar-coral hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Barra de guardar (vidrio, flota sobre el formulario) */}
          {/* En celular va en una sola fila: la leyenda corta a la izquierda y el botón a la derecha */}
          <div className={`simar-vidrio ${inline ? 'simar-pegada-abajo' : 'bottom-4'} sticky z-20 rounded-[28px] p-3 md:pl-7 flex flex-wrap items-center gap-3 movil:flex-nowrap movil:gap-2 movil:p-2 movil:pl-4 ${soloEnNuevo}`}>
            <p className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px] px-2 sm:px-0 text-base text-simar-texto-2 movil:w-auto movil:flex-1 movil:min-w-0 movil:px-0 movil:text-[14px] movil:leading-snug">
              <span className="hidden sm:inline">Por una ciudad más limpia y digna para todos · </span><span className="font-bold text-simar-texto">No es comprobante fiscal</span>
            </p>
            <button
              type="submit"
              disabled={loading}
              className="simar-presiona w-full sm:w-auto min-h-[60px] px-7 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[19px] font-extrabold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed movil:w-auto movil:flex-shrink-0 movil:px-5"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-[22px] h-[22px]" strokeWidth={2.6} />
                  <span>Guardar recibo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
