'use client';

import { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';
import { TimePicker } from '@/components/ui/TimePicker';

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
}

export function CreateManifiestoBasuronModal({
  isOpen,
  onClose,
  onSuccess,
  buques,
  inline = false,
}: CreateManifiestoBasuronModalProps) {
  const [loading, setLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const buqueSelectRef = useRef<HTMLSelectElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora_entrada: (() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    })(),
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
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      hora_entrada: (() => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      })(),
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

  return (
    <div className={inline ? '' : 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'}>
      <div className={inline ? 'w-full' : 'bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto'}>

        {/* Formulario estilo documento físico - Recibo Relleno Sanitario */}
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-800 dark:border-gray-700 rounded-lg overflow-hidden max-w-6xl mx-auto">
          {/* Encabezado del recibo - Estilo azul */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-700 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo camión */}
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM9 12V7a2 2 0 012-2h6a2 2 0 012 2v5m-4 0H5a2 2 0 00-2 2v3h2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wider">RECIBO RELLENO SANITARIO</h2>
                  <p className="text-blue-200 text-sm">Puerto Peñasco, Sonora a {new Date(formData.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="text-right bg-white/10 rounded-xl px-4 py-2">
                <p className="text-xs text-blue-200">Total depositado:</p>
                <p className="text-2xl font-bold text-white">{calcularTotalDepositado().toFixed(0)} kg</p>
              </div>
            </div>
          </div>

          {/* Contenido del formulario - Layout de dos columnas */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-300">

              {/* COLUMNA IZQUIERDA - Datos generales */}
              <div className="p-6 space-y-4">
                <h3 className="text-base font-bold text-black dark:text-white uppercase tracking-wide mb-4">Información General</h3>

                {/* FECHA */}
                <div
                  className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'fecha' ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">FECHA:</label>
                  <div className="flex-1 flex items-center gap-2">
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
                      className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black dark:!text-white text-base font-medium transition-all duration-200 cursor-pointer ${activeField === 'fecha' ? 'border-blue-600' : 'border-gray-400 dark:border-gray-600'
                        }`}
                      wrapperClassName="flex-1"
                      popperClassName="datepicker-popper"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      todayButton="Hoy"
                    />
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* HORA */}
                <div
                  className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'horaEntrada' ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">HORA:</label>
                  <div className="flex-1 flex items-center gap-2">
                    <TimePicker
                      value={formData.hora_entrada || ''}
                      onChange={(time) => setFormData({ ...formData, hora_entrada: time })}
                      onFocus={() => setActiveField('horaEntrada')}
                      onBlur={() => setActiveField(null)}
                      className={`border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-lg font-medium transition-all duration-200 cursor-pointer ${activeField === 'horaEntrada' ? 'border-blue-600' : 'border-gray-400 dark:border-gray-600'
                        }`}
                      placeholder="HH:MM"
                    />
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* RECIBIMOS DE - Campo de texto libre */}
                <div className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'recibimos' ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">RECIBIMOS DE:</label>
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
                    className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200 ${showValidation && !formData.recibimos_de ? 'border-red-500' : activeField === 'recibimos' ? 'border-blue-600' : 'border-gray-400 dark:border-gray-600'
                      }`}
                  />
                </div>
                {showValidation && !formData.recibimos_de && <p className="text-sm text-red-600 ml-3">* Requerido</p>}

                {/* DIRECCIÓN */}
                <div className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'direccion' ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">DIRECCIÓN:</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    onFocus={() => setActiveField('direccion')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Dirección..."
                    className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200 ${activeField === 'direccion' ? 'border-blue-600' : 'border-gray-400 dark:border-gray-600'
                      }`}
                  />
                </div>

                {/* Línea divisoria */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                {/* RECIBÍ */}
                <div className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'usuario' ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">RECIBÍ:</label>
                  <input
                    type="text"
                    value={formData.nombre_usuario}
                    onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                    onFocus={() => setActiveField('usuario')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Nombre de quien recibe"
                    className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200 ${activeField === 'usuario' ? 'border-blue-600' : 'border-gray-400 dark:border-gray-600'
                      }`}
                  />
                </div>

                {/* DOCUMENTO DIGITALIZADO */}
                <div className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${!file && showValidation ? 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20' : file ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">DOCUMENTO:</label>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div className={`mt-4 transition-all duration-200 ${activeField === 'observaciones' ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600 rounded-lg p-3 -mx-3' : 'border-l-4 border-l-transparent'}`}>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1 uppercase">Observaciones (opcional)</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    onFocus={() => setActiveField('observaciones')}
                    onBlur={() => setActiveField(null)}
                    rows={3}
                    placeholder="Notas adicionales..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-black dark:text-white text-base placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA - Pesaje (# KILOS) */}
              <div className="p-6 bg-gradient-to-b from-blue-50/50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-900 space-y-4">
                <h3 className="text-lg font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  # KILOS
                </h3>

                {/* PESO DE ENTRADA */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-green-200 dark:border-green-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-black dark:text-white">PESO ENTRADA</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Vehículo con carga</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.peso_entrada}
                      onChange={(e) => setFormData({ ...formData, peso_entrada: e.target.value })}
                      onFocus={() => setActiveField('pesoEntrada')}
                      onBlur={() => setActiveField(null)}
                      placeholder="0"
                      className={`flex-1 px-4 py-3 text-2xl font-bold text-center border-2 rounded-xl focus:outline-none text-black dark:text-white bg-white dark:bg-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showValidation && !formData.peso_entrada ? 'border-red-500' : activeField === 'pesoEntrada' ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-800' : 'border-gray-300 dark:border-gray-600'
                        }`}
                    />
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-300 px-3 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">kg</span>
                  </div>
                  {showValidation && !formData.peso_entrada && <p className="text-sm text-red-600 mt-1">* Requerido</p>}
                </div>

                {/* PESO DE SALIDA */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-red-200 dark:border-red-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-black dark:text-white">PESO SALIDA</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Vehículo sin carga</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.peso_salida}
                      onChange={(e) => setFormData({ ...formData, peso_salida: e.target.value })}
                      onFocus={() => setActiveField('pesoSalida')}
                      onBlur={() => setActiveField(null)}
                      placeholder="0"
                      className={`flex-1 px-4 py-3 text-2xl font-bold text-center border-2 rounded-xl focus:outline-none text-black dark:text-white bg-white dark:bg-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showValidation && !formData.peso_salida ? 'border-red-500' : activeField === 'pesoSalida' ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-800' : 'border-gray-300 dark:border-gray-600'
                        }`}
                    />
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-300 px-3 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">kg</span>
                  </div>
                  {showValidation && !formData.peso_salida && <p className="text-sm text-red-600 mt-1">* Requerido</p>}
                </div>

                {/* TOTAL DEPOSITADO */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/80">= TOTAL DEPOSITADO</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center py-3 bg-white dark:bg-gray-900 rounded-lg">
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{calcularTotalDepositado().toFixed(0)} <span className="text-xl">kg</span></p>
                  </div>
                </div>

                {/* Botones rápidos */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Rápido:</span>
                  {[500, 1000, 1500, 2000, 2500, 3000].map(peso => (
                    <button
                      key={peso}
                      type="button"
                      onClick={() => setFormData({ ...formData, peso_entrada: String(peso) })}
                      className="px-3 py-1 text-sm bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-300 dark:hover:bg-blue-800 font-medium transition-colors"
                    >
                      {peso >= 1000 ? `${peso / 1000}T` : `${peso}kg`}
                    </button>
                  ))}
                </div>

                {/* Info de embarcación seleccionada */}
                {selectedBuque && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-800 dark:text-green-400">Embarcación seleccionada</p>
                        <p className="text-base font-bold text-black dark:text-white">{selectedBuque.nombre_buque}</p>
                        {selectedBuque.matricula && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Matrícula: {selectedBuque.matricula}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con botón Guardar */}
            <div className="border-t-2 border-gray-800 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center md:text-left">
                  POR UNA CIUDAD MÁS LIMPIA Y DIGNA PARA TODOS<br />
                  <span className="font-bold">NO ES COMPROBANTE FISCAL</span>
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>GUARDAR RECIBO</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
