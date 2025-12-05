'use client';

import { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';

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
  const buqueSelectRef = useRef<HTMLSelectElement | null>(null);
  
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
      observaciones: '',
      nombre_usuario: '',
    });
    setShowValidation(false);
  };

  const calcularTotalDepositado = () => {
    const entrada = parseFloat(formData.peso_entrada) || 0;
    const salida = parseFloat(formData.peso_salida) || 0;
    return Math.max(0, entrada - salida);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.buque_id || !formData.peso_entrada || !formData.peso_salida) {
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
        buque_id: parseInt(formData.buque_id),
        observaciones: formData.observaciones || null,
        nombre_usuario: formData.nombre_usuario || null,
      };

      await createManifiestoBasuron(payload);

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
      <div className={inline ? 'w-full' : 'bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto'}>
        
        {/* Formulario estilo documento físico - Dos columnas */}
        <div className="bg-white border-2 border-gray-800 rounded-lg overflow-hidden max-w-6xl mx-auto">
          {/* Encabezado del documento */}
          <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-black">REGISTRO DE PESAJE - BASURÓN</h2>
                <p className="text-base font-medium text-black">Puerto Peñasco, Sonora a {new Date(formData.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-black">Depósito calculado:</p>
                <p className="text-2xl font-bold text-blue-600">{calcularTotalDepositado().toFixed(2)} kg</p>
              </div>
            </div>
          </div>

          {/* Contenido del formulario - Layout de dos columnas */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-300">
              
              {/* COLUMNA IZQUIERDA - Datos generales */}
              <div className="p-6 space-y-4">
                <h3 className="text-base font-bold text-black uppercase tracking-wide mb-4">Información General</h3>
                
                {/* FECHA */}
                <div 
                  className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'fecha' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}
                >
                  <label className="text-base font-bold text-black w-36 flex-shrink-0">FECHA:</label>
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
                      className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 cursor-pointer ${
                        activeField === 'fecha' ? 'border-blue-600' : 'border-gray-400'
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

                {/* HORA ENTRADA */}
                <div 
                  className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'horaEntrada' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}
                >
                  <label className="text-base font-bold text-black w-36 flex-shrink-0">HORA ENTRADA:</label>
                  <div className="flex-1 flex items-center gap-2">
                    <DatePicker
                      selected={formData.hora_entrada ? (() => {
                        const [hours, minutes] = formData.hora_entrada.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours), parseInt(minutes), 0);
                        return date;
                      })() : null}
                      onChange={(date: Date | null) => {
                        if (date) {
                          const hours = String(date.getHours()).padStart(2, '0');
                          const minutes = String(date.getMinutes()).padStart(2, '0');
                          setFormData({ ...formData, hora_entrada: `${hours}:${minutes}` });
                        }
                      }}
                      onFocus={() => setActiveField('horaEntrada')}
                      onBlur={() => setActiveField(null)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Hora"
                      dateFormat="HH:mm"
                      timeFormat="HH:mm"
                      locale="es"
                      showPopperArrow={false}
                      className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 cursor-pointer ${
                        activeField === 'horaEntrada' ? 'border-blue-600' : 'border-gray-400'
                      }`}
                      wrapperClassName="flex-1"
                      popperClassName="datepicker-popper"
                    />
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* HORA SALIDA */}
                <div 
                  className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'horaSalida' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}
                >
                  <label className="text-base font-bold text-black w-36 flex-shrink-0">HORA SALIDA:</label>
                  <div className="flex-1 flex items-center gap-2">
                    <DatePicker
                      selected={formData.hora_salida ? (() => {
                        const [hours, minutes] = formData.hora_salida.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours), parseInt(minutes), 0);
                        return date;
                      })() : null}
                      onChange={(date: Date | null) => {
                        if (date) {
                          const hours = String(date.getHours()).padStart(2, '0');
                          const minutes = String(date.getMinutes()).padStart(2, '0');
                          setFormData({ ...formData, hora_salida: `${hours}:${minutes}` });
                        }
                      }}
                      onFocus={() => setActiveField('horaSalida')}
                      onBlur={() => setActiveField(null)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Hora"
                      dateFormat="HH:mm"
                      timeFormat="HH:mm"
                      locale="es"
                      showPopperArrow={false}
                      className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 cursor-pointer ${
                        activeField === 'horaSalida' ? 'border-blue-600' : 'border-gray-400'
                      }`}
                      wrapperClassName="flex-1"
                      popperClassName="datepicker-popper"
                      placeholderText="Seleccionar..."
                    />
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* EMBARCACIÓN */}
                <div className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'buque' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                  <label className="text-base font-bold text-black w-36 flex-shrink-0">EMBARCACIÓN:</label>
                  <select
                    ref={buqueSelectRef}
                    value={formData.buque_id}
                    onChange={(e) => {
                      setFormData({ ...formData, buque_id: e.target.value });
                      setShowValidation(false);
                    }}
                    onFocus={() => setActiveField('buque')}
                    onBlur={() => setActiveField(null)}
                    className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium cursor-pointer transition-all duration-200 ${
                      showValidation && !formData.buque_id ? 'border-red-500' : activeField === 'buque' ? 'border-blue-600' : 'border-gray-400'
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    {buques.map((buque) => (
                      <option key={buque.id} value={buque.id}>
                        {buque.nombre_buque} {buque.matricula ? `(${buque.matricula})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {showValidation && !formData.buque_id && <p className="text-sm text-red-600 ml-3">* Requerido</p>}

                {/* Línea divisoria */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* USUARIO */}
                <div className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'usuario' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                  <label className="text-base font-bold text-black w-36 flex-shrink-0">USUARIO:</label>
                  <input
                    type="text"
                    value={formData.nombre_usuario}
                    onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                    onFocus={() => setActiveField('usuario')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Nombre del usuario"
                    className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium placeholder:text-gray-500 transition-all duration-200 ${
                      activeField === 'usuario' ? 'border-blue-600' : 'border-gray-400'
                    }`}
                  />
                </div>

                {/* Observaciones */}
                <div className={`mt-4 transition-all duration-200 ${activeField === 'observaciones' ? 'bg-blue-100/60 border-l-4 border-l-blue-600 rounded-lg p-3 -mx-3' : 'border-l-4 border-l-transparent'}`}>
                  <label className="block text-sm font-bold text-black mb-1">OBSERVACIONES (opcional)</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    onFocus={() => setActiveField('observaciones')}
                    onBlur={() => setActiveField(null)}
                    rows={3}
                    placeholder="Notas adicionales..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-black text-base"
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA - Pesaje */}
              <div className="p-6 bg-gray-50/50 space-y-4">
                <h3 className="text-base font-bold text-black uppercase tracking-wide mb-4">Control de Pesaje</h3>
                
                {/* PESO DE ENTRADA */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-black">PESO DE ENTRADA</p>
                      <p className="text-sm text-black">Vehículo con carga</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.peso_entrada}
                      onChange={(e) => setFormData({ ...formData, peso_entrada: e.target.value })}
                      onFocus={() => setActiveField('pesoEntrada')}
                      onBlur={() => setActiveField(null)}
                      placeholder="0.00"
                      className={`flex-1 px-4 py-3 text-xl font-bold border-2 rounded-lg focus:outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        showValidation && !formData.peso_entrada ? 'border-red-500' : activeField === 'pesoEntrada' ? 'border-blue-600' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-lg font-bold text-black px-3 py-3 bg-gray-100 rounded-lg border-2 border-gray-300">kg</span>
                  </div>
                  {showValidation && !formData.peso_entrada && <p className="text-sm text-red-600 mt-1">* Requerido</p>}
                </div>

                {/* PESO DE SALIDA */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-black">PESO DE SALIDA</p>
                      <p className="text-sm text-black">Vehículo sin carga</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.peso_salida}
                      onChange={(e) => setFormData({ ...formData, peso_salida: e.target.value })}
                      onFocus={() => setActiveField('pesoSalida')}
                      onBlur={() => setActiveField(null)}
                      placeholder="0.00"
                      className={`flex-1 px-4 py-3 text-xl font-bold border-2 rounded-lg focus:outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        showValidation && !formData.peso_salida ? 'border-red-500' : activeField === 'pesoSalida' ? 'border-blue-600' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-lg font-bold text-black px-3 py-3 bg-gray-100 rounded-lg border-2 border-gray-300">kg</span>
                  </div>
                  {showValidation && !formData.peso_salida && <p className="text-sm text-red-600 mt-1">* Requerido</p>}
                </div>

                {/* TOTAL DEPOSITADO */}
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-black">TOTAL DEPOSITADO</p>
                      <p className="text-sm text-black">Diferencia de pesos</p>
                    </div>
                  </div>
                  <div className="text-center py-3 bg-white rounded-lg border-2 border-blue-300">
                    <p className="text-3xl font-bold text-blue-600">{calcularTotalDepositado().toFixed(2)} kg</p>
                  </div>
                </div>

                {/* Info de embarcación seleccionada */}
                {selectedBuque && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-800">Embarcación seleccionada</p>
                        <p className="text-base font-bold text-black">{selectedBuque.nombre_buque}</p>
                        {selectedBuque.matricula && (
                          <p className="text-sm text-black">Matrícula: {selectedBuque.matricula}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="border-t-2 border-gray-800 p-4 bg-white">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
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
                    <span>GUARDAR REGISTRO</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
