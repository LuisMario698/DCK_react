'use client';

import { useState, useEffect, useRef } from 'react';
import { createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';

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
  const [selectedBuque, setSelectedBuque] = useState<Buque | null>(null);
  const steps = [
    'Fecha',
    'Embarcación',
    'Pesaje',
    'Observaciones',
    'Confirmación',
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
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
    // ...
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
      // ...
      nombre_usuario: '',
    });
    setSelectedBuque(null);
    setCurrentStep(0);
  };

  const handleBuqueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buqueId = e.target.value;
    setFormData({ ...formData, buque_id: buqueId });
    setShowValidation(false);
    const buque = buques.find(b => b.id === parseInt(buqueId));
    setSelectedBuque(buque || null);
  };

  const calcularTotalDepositado = () => {
    const entrada = parseFloat(formData.peso_entrada) || 0;
    const salida = parseFloat(formData.peso_salida) || 0;
    return Math.max(0, entrada - salida);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones por paso y avance
    // Validaciones específicas por paso
    if (currentStep < steps.length - 1) {
      if (currentStep === 0) {
        if (!formData.fecha) {
          setShowValidation(true);
          return;
        }
        if (!formData.hora_entrada) {
          setShowValidation(true);
          return;
        }
      }
      if (currentStep === 1) {
        if (!formData.buque_id) {
          setShowValidation(true);
          buqueSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          buqueSelectRef.current?.focus();
          return;
        }
      }
      if (currentStep === 2) {
        if (!formData.peso_entrada || parseFloat(formData.peso_entrada) <= 0) {
          setShowValidation(true);
          return;
        }
        if (!formData.peso_salida || parseFloat(formData.peso_salida) < 0) {
          setShowValidation(true);
          return;
        }
      }
      setCurrentStep((s) => s + 1);
      return;
    }

    // Último paso: enviar
    setLoading(true);
    try {
      if (!formData.buque_id || !formData.peso_entrada) {
        alert('❌ Por favor completa los campos obligatorios');
        return;
      }

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
      // Mejor diagnóstico de errores de Supabase/PostgREST
      const details = typeof error === 'object' ? JSON.stringify(error) : String(error);
      console.error('Error creando manifiesto basurón:', error, details);
      const msg = error?.message || error?.details || error?.hint || details || 'Error desconocido';
      alert('❌ Error al crear el registro: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !inline) return null;

  return (
    <div className={inline ? '' : 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'}>
      <div className={inline ? 'bg-white rounded-xl sm:rounded-2xl border border-gray-200 w-full' : 'bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto'}>
        {/* Encabezado del Wizard (estilo manifiestos) */}
        <div className={`px-4 sm:px-6 md:px-8 py-5 sm:py-6 ${inline ? '' : 'rounded-t-3xl'} bg-white border-b border-gray-200`}>
          <div className="text-center mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Nuevo Registro Basurón</h2>
            <p className="text-gray-500 mt-1 sm:mt-2 text-sm">Complete los pasos para registrar el depósito</p>
          </div>
          {/* Stepper moderno */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto px-2 sm:px-0">
            {[
              { num: 1, label: 'Información', icon: 'document' },
              { num: 2, label: 'Embarcación', icon: 'ship' },
              { num: 3, label: 'Pesaje', icon: 'scale' },
              { num: 4, label: 'Observaciones', icon: 'note' },
              { num: 5, label: 'Confirmar', icon: 'check' }
            ].map((step, index, arr) => {
              const uiStep = currentStep + 1;
              return (
                <div key={step.num} className="flex items-center">
                  <div className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-[50px] sm:min-w-[60px]">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-bold transition-all duration-300 ${
                        uiStep === step.num
                          ? 'bg-blue-600 text-white'
                          : uiStep > step.num
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-400 border border-gray-300'
                      }`}
                    >
                      {uiStep > step.num ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.icon === 'document' ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : step.icon === 'ship' ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M3.62,17.28a1,1,0,0,0,1.86-.74L4.36,13.72,11,12.25V17a1,1,0,0,0,2,0V12.25l6.64,1.47-1.12,2.82a1,1,0,0,0,.56,1.3,1,1,0,0,0,.37.07,1,1,0,0,0,.93-.63l1.55-3.91a1,1,0,0,0-.05-.84,1,1,0,0,0-.66-.51L18,11.31V7a1,1,0,0,0-1-1H15V3a1,1,0,0,0-1-1H10A1,1,0,0,0,9,3V6H7A1,1,0,0,0,6,7v4.31L2.78,12a1,1,0,0,0-.66.51,1,1,0,0,0-.05.84ZM11,4h2V6H11ZM8,8h8v2.86L12.22,10h-.1L12,10l-.12,0h-.1L8,10.86ZM20.71,19.28a4.38,4.38,0,0,0-1,.45,2.08,2.08,0,0,1-2.1,0,4.62,4.62,0,0,0-4.54,0,2.14,2.14,0,0,1-2.12,0,4.64,4.64,0,0,0-4.54,0,2.08,2.08,0,0,1-2.1,0,4.38,4.38,0,0,0-1-.45A1,1,0,0,0,2,20a1,1,0,0,0,.67,1.24,2.1,2.1,0,0,1,.57.25,4,4,0,0,0,2,.55,4.14,4.14,0,0,0,2.08-.56,2.65,2.65,0,0,1,2.56,0,4.15,4.15,0,0,0,4.12,0,2.65,2.65,0,0,1,2.56,0,4,4,0,0,0,4.1,0,2.1,2.1,0,0,1,.57-.25A1,1,0,0,0,22,20,1,1,0,0,0,20.71,19.28Z" />
                        </svg>
                      ) : step.icon === 'scale' ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M4 9v6M8 7v10M16 7v10M20 9v6" />
                        </svg>
                      ) : step.icon === 'user' ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : step.icon === 'status' ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : step.icon === 'note' ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] md:text-[11px] font-bold transition-colors text-center ${
                        uiStep === step.num
                          ? 'text-blue-600'
                          : uiStep > step.num
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < arr.length - 1 && (
                    <div className={`w-8 sm:w-10 md:w-14 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded-full transition-all duration-500 ${
                      uiStep > step.num ? 'bg-blue-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
          {/* Contenedor pasos con altura similar */}
          <div className="min-h-[280px] overflow-y-auto max-h-[500px] px-1 sm:px-0">
          {currentStep === 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Fecha del Registro</h3>
                <p className="text-sm text-gray-600">Seleccione la fecha del depósito</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-lg"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hora de entrada <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  required
                  value={formData.hora_entrada}
                  onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-lg"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hora de salida</label>
                <input
                  type="time"
                  value={formData.hora_salida}
                  onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-lg"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Usuario</label>
              <input
                type="text"
                value={formData.nombre_usuario}
                onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                placeholder="Nombre completo del usuario"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-lg"
                disabled={loading}
              />
            </div>
          </div>
          )}
          {/* Paso 2: Embarcación */}
          {currentStep === 1 && (
          <section className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18m-9-6v6m-3-3h6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Embarcación</h3>
                <p className="text-sm text-gray-600">Seleccione la embarcación que deposita residuos</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Buque <span className="text-red-500">*</span></label>
              <select
                ref={buqueSelectRef}
                required
                value={formData.buque_id}
                onChange={handleBuqueChange}
                className={`w-full px-4 py-3 text-sm rounded-lg focus:ring-2 outline-none transition-all bg-white border 
                  ${showValidation && !formData.buque_id 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                disabled={loading}
              >
                <option value="">Seleccionar embarcación...</option>
                {buques.map((buque) => (
                  <option key={buque.id} value={buque.id}>
                    {buque.nombre_buque} {buque.matricula ? `(${buque.matricula})` : ''}
                  </option>
                ))}
              </select>

              {showValidation && !formData.buque_id && (
                <p className="text-xs text-red-600 mt-1">Por favor, selecciona un objeto de la lista.</p>
              )}

              {selectedBuque && (
                <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-800 mb-0.5">Embarcación Seleccionada</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedBuque.nombre_buque}</p>
                      {selectedBuque.matricula && (
                        <p className="text-xs text-gray-600">Matrícula: {selectedBuque.matricula}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
          )}
          {/* Paso 3: Pesaje */}
          {currentStep === 2 && (
          <section className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v4M5 21h14M7 10a5 5 0 0010 0" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Control de Pesaje</h3>
                <p className="text-gray-600">Registre los pesos de entrada y salida del vehículo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Peso de Entrada */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl"></span>
                  </div>
                  <label className="text-sm font-bold text-gray-700">PESO DE ENTRADA <span className="text-red-500">*</span></label>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.peso_entrada}
                      onChange={(e) => setFormData({ ...formData, peso_entrada: e.target.value })}
                      className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                    kg
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Peso del vehículo al ingresar (con carga)</p>
              </div>

              {/* Peso de Salida */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl"></span>
                  </div>
                  <label className="text-sm font-bold text-gray-700">PESO DE SALIDA <span className="text-red-500">*</span></label>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.peso_salida}
                      onChange={(e) => setFormData({ ...formData, peso_salida: e.target.value })}
                      className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                    kg
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Peso del vehículo al salir (sin carga)</p>
              </div>
            </div>

            {/* Resumen de pesaje eliminado */}
          </section>
          )}
          {/* Paso eliminado: Responsable */}
          
          {/* Paso 4: Observaciones */}
          {currentStep === 3 && (
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">Observaciones (Opcional)</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={4}
              placeholder="Escriba cualquier observación adicional sobre el depósito..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white"
              disabled={loading}
            />
          </div>
          )}

          {/* Paso 6: Confirmación */}
          {currentStep === 4 && (
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🔎 Revisión Final</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Fecha</p>
                <p className="font-bold">{formData.fecha}</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Hora de entrada</p>
                <p className="font-bold">{formData.hora_entrada}</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Hora de salida</p>
                <p className="font-bold">{formData.hora_salida || '—'}</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Embarcación</p>
                <p className="font-bold">{selectedBuque ? selectedBuque.nombre_buque : '—'}</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Peso entrada</p>
                <p className="font-bold">{formData.peso_entrada || '0'} kg</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Peso salida</p>
                <p className="font-bold">{formData.peso_salida || '0'} kg</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Total depositado</p>
                <p className="font-bold">{calcularTotalDepositado().toFixed(2)} kg</p>
              </div>
              
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Nombre del Usuario</p>
                <p className="font-bold">{formData.nombre_usuario || '—'}</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                <p className="font-bold whitespace-pre-wrap">{formData.observaciones || '—'}</p>
              </div>
            </div>
          </div>
          )}
          </div>

          {/* Navegación */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={loading || currentStep === 0}
              className="px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-2 sm:order-1"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="submit"
                disabled={loading}
                className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                <span>Siguiente</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="whitespace-nowrap">Guardar Registro</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
