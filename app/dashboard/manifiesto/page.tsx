'use client';

import { useState, useEffect } from 'react';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';
import { createManifiesto, getManifiestos, deleteManifiesto, generarNumeroManifiesto } from '@/lib/services/manifiestos';
import { ManifiestoConRelaciones, Buque, PersonaConTipo } from '@/types/database';

export default function ManifiestosPage() {
  const [manifiestos, setManifiestos] = useState<ManifiestoConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [viewingManifiesto, setViewingManifiesto] = useState<ManifiestoConRelaciones | null>(null);
  
  const [buques, setBuques] = useState<Buque[]>([]);
  const [personas, setPersonas] = useState<PersonaConTipo[]>([]);
  
  const [formData, setFormData] = useState({
    numero_manifiesto: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    buque_id: '',
    responsable_principal_id: '',
    responsable_secundario_id: '',
    observaciones: '',
  });
  
  const [residuos, setResiduos] = useState({
    aceite_usado: 0,
    filtros_aceite: 0,
    filtros_diesel: 0,
    basura: 0,
  });
  
  const [archivo, setArchivo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const steps = [
    { number: 1, title: 'Información Básica', icon: '📋' },
    { number: 2, title: 'Embarcación', icon: '🚢' },
    { number: 3, title: 'Residuos', icon: '♻️' },
    { number: 4, title: 'Responsable', icon: '👤' },
    { number: 5, title: 'Digitalizar', icon: '📤' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [buquesData, personasData, manifestosData] = await Promise.all([
        getBuques(),
        getPersonas(),
        getManifiestos()
      ]);
      setBuques(buquesData);
      setPersonas(personasData);
      setManifiestos(manifestosData);
    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.fecha_emision || !formData.buque_id || !formData.responsable_principal_id) {
        alert('❌ Por favor completa todos los campos obligatorios');
        return;
      }

      setSaving(true);
      
      const manifiestoData = {
        fecha_emision: formData.fecha_emision,
        buque_id: parseInt(formData.buque_id),
        responsable_principal_id: parseInt(formData.responsable_principal_id),
        responsable_secundario_id: formData.responsable_secundario_id ? parseInt(formData.responsable_secundario_id) : null,
        estado_digitalizacion: archivo ? 'completado' : 'pendiente' as any,
        observaciones: formData.observaciones || null,
        imagen_manifiesto_url: null,
      };

      const resultado = await createManifiesto(manifiestoData, residuos, archivo);
      alert(`✅ Manifiesto ${resultado.numero_manifiesto} creado exitosamente`);
      
      setFormData({
        numero_manifiesto: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        buque_id: '',
        responsable_principal_id: '',
        responsable_secundario_id: '',
        observaciones: '',
      });
      setResiduos({
        aceite_usado: 0,
        filtros_aceite: 0,
        filtros_diesel: 0,
        basura: 0,
      });
      setArchivo(null);
      setCurrentStep(1);
      
      loadData();
    } catch (error: any) {
      console.error('Error guardando manifiesto:', error);
      alert('❌ Error al guardar el manifiesto: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este manifiesto?')) {
      try {
        await deleteManifiesto(id);
        alert('✅ Manifiesto eliminado exitosamente');
        loadData();
      } catch (error) {
        console.error('Error eliminando manifiesto:', error);
        alert('❌ Error al eliminar el manifiesto');
      }
    }
  };

  const selectedBuque = buques.find(b => b.id === parseInt(formData.buque_id));
  const selectedResponsablePrincipal = personas.find(p => p.id === parseInt(formData.responsable_principal_id));
  const selectedResponsableSecundario = personas.find(p => p.id === parseInt(formData.responsable_secundario_id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <span className="text-5xl">📋</span>
          Gestión de Manifiestos
        </h1>
        <p className="text-gray-600 text-lg">Registra y gestiona los manifiestos de residuos marítimos</p>
      </div>

      {/* Proceso de Digitalización */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                      currentStep === step.number
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110 shadow-lg'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step.number ? '✓' : step.icon}
                    </div>
                    <div className="text-center mt-2">
                      <p className={`text-sm font-bold ${currentStep === step.number ? 'text-blue-600' : 'text-gray-600'}`}>
                        Paso {step.number}
                      </p>
                      <p className={`text-xs ${currentStep === step.number ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">📋 Información Básica</h2>
                  <p className="text-gray-600">Seleccione la fecha del manifiesto</p>
                  <p className="text-sm text-blue-600 mt-2">ℹ️ El número se generará automáticamente</p>
                </div>
                <div className="max-w-2xl mx-auto">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Fecha de Emisión <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fecha_emision}
                      onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">🚢 Embarcación</h2>
                  <p className="text-gray-600">Seleccione la embarcación generadora de residuos</p>
                </div>
                <div className="max-w-2xl mx-auto">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Seleccionar Buque <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.buque_id}
                    onChange={(e) => setFormData({ ...formData, buque_id: e.target.value })}
                    className="w-full px-5 py-4 text-lg font-medium border-2 border-cyan-400 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all hover:border-cyan-500 bg-white shadow-md"
                  >
                    <option value="">🔍 Seleccionar embarcación...</option>
                    {buques.map((buque) => (
                      <option key={buque.id} value={buque.id}>
                        🚢 {buque.nombre_buque} {buque.matricula ? `(${buque.matricula})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedBuque && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-400 rounded-xl shadow-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                        <p className="text-lg font-bold text-cyan-900">Embarcación Seleccionada</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Nombre:</p>
                          <p className="text-lg font-bold text-gray-900">{selectedBuque.nombre_buque}</p>
                        </div>
                        {selectedBuque.matricula && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Matrícula:</p>
                            <p className="text-lg font-bold text-gray-900">{selectedBuque.matricula}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">♻️ Residuos</h2>
                  <p className="text-gray-600">Especifique las cantidades de cada tipo de residuo</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-300">
                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🛢️</span>
                      Aceite Usado (Litros)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={residuos.aceite_usado}
                      onChange={(e) => setResiduos({ ...residuos, aceite_usado: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-lg bg-white"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-300">
                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">��</span>
                      Filtros de Aceite (Unidades)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={residuos.filtros_aceite}
                      onChange={(e) => setResiduos({ ...residuos, filtros_aceite: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg bg-white"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300">
                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">⚙️</span>
                      Filtros de Diesel (Unidades)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={residuos.filtros_diesel}
                      onChange={(e) => setResiduos({ ...residuos, filtros_diesel: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-lg bg-white"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-xl border-2 border-red-300">
                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🗑️</span>
                      Basura (Kilogramos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={residuos.basura}
                      onChange={(e) => setResiduos({ ...residuos, basura: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-lg bg-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">👤 Personas Responsables</h2>
                  <p className="text-gray-600">Seleccione las personas responsables del manifiesto</p>
                </div>
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Responsable Principal */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Responsable Principal <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.responsable_principal_id}
                      onChange={(e) => setFormData({ ...formData, responsable_principal_id: e.target.value })}
                      className="w-full px-5 py-4 text-lg font-medium border-2 border-purple-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all hover:border-purple-500 bg-white shadow-md"
                    >
                      <option value="">🔍 Seleccionar responsable principal...</option>
                      {personas.map((persona) => (
                        <option key={persona.id} value={persona.id}>
                          👤 {persona.nombre} {persona.tipo_persona?.nombre_tipo ? `(${persona.tipo_persona.nombre_tipo})` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedResponsablePrincipal && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 rounded-xl shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-xl">✅</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-purple-900">Responsable Principal</p>
                            <p className="text-gray-700">{selectedResponsablePrincipal.nombre}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Responsable Secundario */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Responsable Secundario <span className="text-gray-400">(Opcional)</span>
                    </label>
                    <select
                      value={formData.responsable_secundario_id}
                      onChange={(e) => setFormData({ ...formData, responsable_secundario_id: e.target.value })}
                      className="w-full px-5 py-4 text-lg font-medium border-2 border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-blue-500 bg-white shadow-md"
                    >
                      <option value="">🔍 Seleccionar responsable secundario (opcional)...</option>
                      {personas.filter(p => p.id !== parseInt(formData.responsable_principal_id)).map((persona) => (
                        <option key={persona.id} value={persona.id}>
                          👤 {persona.nombre} {persona.tipo_persona?.nombre_tipo ? `(${persona.tipo_persona.nombre_tipo})` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedResponsableSecundario && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-xl shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-xl">✅</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-blue-900">Responsable Secundario</p>
                            <p className="text-gray-700">{selectedResponsableSecundario.nombre}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">📤 Digitalizar Documento</h2>
                  <p className="text-gray-600">Cargue el archivo escaneado del manifiesto físico (opcional)</p>
                </div>
                <div className="max-w-2xl mx-auto">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
                      dragActive
                        ? 'border-orange-500 bg-orange-100'
                        : archivo
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                    
                    {!archivo ? (
                      <div>
                        <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xl font-bold text-gray-700 mb-2">Arrastre y suelte el archivo aquí</p>
                        <p className="text-gray-500 mb-4">o</p>
                        <label
                          htmlFor="file-upload"
                          className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl cursor-pointer hover:from-orange-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          📁 Seleccionar Archivo
                        </label>
                        <p className="text-xs text-gray-500 mt-4">Formatos: PDF, JPG, PNG (Máx. 10MB)</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center">
                          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-700 mb-1">✅ Archivo Cargado</p>
                          <p className="text-gray-700 font-semibold">{archivo.name}</p>
                          <p className="text-sm text-gray-500">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setArchivo(null)}
                          className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
                        >
                          🗑️ Eliminar Archivo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-3">📝 Observaciones (Opcional)</label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={4}
                      placeholder="Escriba cualquier observación adicional sobre el manifiesto..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-8 py-4 border-2 border-gray-400 text-gray-700 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl text-lg"
              >
                Siguiente
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl hover:shadow-2xl text-lg"
              >
                {saving ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ✨ Guardar Manifiesto
                  </>
                )}
              </button>
            )}
        </div>
      </div>

      {/* Tabla de Manifiestos */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Manifiestos Registrados
          </h2>
          <p className="text-gray-600 mt-1">Lista de todos los manifiestos creados en el sistema</p>
        </div>

        {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Número</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Buque</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Responsables</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {manifiestos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-semibold">No hay manifiestos registrados</p>
                          <p className="text-sm">Complete el formulario arriba para crear uno nuevo</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    manifiestos.map((manifiesto) => (
                      <tr key={manifiesto.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600">{manifiesto.numero_manifiesto}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(manifiesto.fecha_emision).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🚢</span>
                            <span className="font-medium text-gray-900">{manifiesto.buque?.nombre_buque || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👤</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {manifiesto.responsable_principal?.nombre || 'N/A'}
                              </span>
                            </div>
                            {manifiesto.responsable_secundario && (
                              <div className="flex items-center gap-2 pl-6">
                                <span className="text-sm text-gray-500">+</span>
                                <span className="text-sm text-gray-600">
                                  {manifiesto.responsable_secundario.nombre}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            manifiesto.estado_digitalizacion === 'completado' 
                              ? 'bg-green-100 text-green-800' 
                              : manifiesto.estado_digitalizacion === 'en_proceso'
                              ? 'bg-yellow-100 text-yellow-800'
                              : manifiesto.estado_digitalizacion === 'aprobado'
                              ? 'bg-blue-100 text-blue-800'
                              : manifiesto.estado_digitalizacion === 'rechazado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {manifiesto.estado_digitalizacion === 'completado' && '✅ Completado'}
                            {manifiesto.estado_digitalizacion === 'en_proceso' && '⚙️ En Proceso'}
                            {manifiesto.estado_digitalizacion === 'pendiente' && '⏳ Pendiente'}
                            {manifiesto.estado_digitalizacion === 'aprobado' && '👍 Aprobado'}
                            {manifiesto.estado_digitalizacion === 'rechazado' && '❌ Rechazado'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewingManifiesto(manifiesto)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(manifiesto.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modal de visualización de detalles */}
      {viewingManifiesto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Detalles del Manifiesto</h2>
                    <p className="text-blue-100 text-sm mt-1">{viewingManifiesto.numero_manifiesto}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingManifiesto(null)} 
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-6">
              {/* Información Básica */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Información Básica
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Número de Manifiesto</p>
                    <p className="text-lg font-bold text-blue-600">{viewingManifiesto.numero_manifiesto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Fecha de Emisión</p>
                    <p className="text-lg text-gray-900">
                      {new Date(viewingManifiesto.fecha_emision).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Estado</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      viewingManifiesto.estado_digitalizacion === 'completado' 
                        ? 'bg-green-100 text-green-800' 
                        : viewingManifiesto.estado_digitalizacion === 'en_proceso'
                        ? 'bg-yellow-100 text-yellow-800'
                        : viewingManifiesto.estado_digitalizacion === 'aprobado'
                        ? 'bg-blue-100 text-blue-800'
                        : viewingManifiesto.estado_digitalizacion === 'rechazado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingManifiesto.estado_digitalizacion === 'completado' && '✅ Completado'}
                      {viewingManifiesto.estado_digitalizacion === 'en_proceso' && '⚙️ En Proceso'}
                      {viewingManifiesto.estado_digitalizacion === 'pendiente' && '⏳ Pendiente'}
                      {viewingManifiesto.estado_digitalizacion === 'aprobado' && '👍 Aprobado'}
                      {viewingManifiesto.estado_digitalizacion === 'rechazado' && '❌ Rechazado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Embarcación */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border-2 border-cyan-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚢</span>
                  Embarcación
                </h3>
                <div>
                  <p className="text-lg font-bold text-gray-900">{viewingManifiesto.buque?.nombre_buque || 'N/A'}</p>
                </div>
              </div>

              {/* Responsables */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  Responsables
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Responsable Principal</p>
                    <p className="text-lg font-bold text-gray-900">{viewingManifiesto.responsable_principal?.nombre || 'N/A'}</p>
                  </div>
                  {viewingManifiesto.responsable_secundario && (
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Responsable Secundario</p>
                      <p className="text-lg font-bold text-gray-900">{viewingManifiesto.responsable_secundario.nombre}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Residuos */}
              {viewingManifiesto.residuos && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">♻️</span>
                    Residuos Registrados
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border-2 border-amber-200">
                      <p className="text-xs text-gray-600 font-semibold">Aceite Usado</p>
                      <p className="text-2xl font-bold text-amber-600">{viewingManifiesto.residuos.aceite_usado} L</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                      <p className="text-xs text-gray-600 font-semibold">Filtros de Aceite</p>
                      <p className="text-2xl font-bold text-blue-600">{viewingManifiesto.residuos.filtros_aceite} un</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                      <p className="text-xs text-gray-600 font-semibold">Filtros de Diesel</p>
                      <p className="text-2xl font-bold text-green-600">{viewingManifiesto.residuos.filtros_diesel} un</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-red-200">
                      <p className="text-xs text-gray-600 font-semibold">Basura</p>
                      <p className="text-2xl font-bold text-red-600">{viewingManifiesto.residuos.basura} kg</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Imagen del Manifiesto */}
              {viewingManifiesto.imagen_manifiesto_url && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📄</span>
                    Documento Digitalizado
                  </h3>
                  <div className="bg-white rounded-xl p-4 border-2 border-gray-300">
                    <img 
                      src={viewingManifiesto.imagen_manifiesto_url} 
                      alt="Manifiesto escaneado" 
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                    <a
                      href={viewingManifiesto.imagen_manifiesto_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Abrir imagen en nueva pestaña
                    </a>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {viewingManifiesto.observaciones && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    Observaciones
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingManifiesto.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
