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
      <div className="rounded-3xl p-8 bg-white shadow-xl border border-gray-100">
        <div className="mb-8">
          <div className="mb-8">
            <div className="text-center mb-2">
              <h2 className="text-3xl font-bold text-gray-900">Nuevo Manifiesto</h2>
              <p className="text-gray-500 mt-2">Complete los siguientes pasos para registrar el manifiesto</p>
            </div>
          </div>

          {/* Indicadores de Pasos - Diseño Moderno */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { num: 1, label: 'Información', icon: 'document' },
              { num: 2, label: 'Embarcación', icon: 'ship' },
              { num: 3, label: 'Residuos', icon: 'recycle' },
              { num: 4, label: 'Responsables', icon: 'users' },
              { num: 5, label: 'Archivo', icon: 'upload' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div 
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                      currentStep === step.num 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/40 scale-105' 
                        : currentStep > step.num
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-gray-150'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.icon === 'document' ? (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : step.icon === 'ship' ? (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18m-9-6v6m-3-3h6" />
                      </svg>
                    ) : step.icon === 'recycle' ? (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : step.icon === 'users' ? (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold transition-colors ${
                    currentStep === step.num ? 'text-blue-600' : currentStep > step.num ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`w-14 h-1 mx-2 rounded-full transition-all duration-500 ${
                    currentStep > step.num ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

          {/* Contenedor con altura fija */}
          <div className="h-[400px]">
            <div key={currentStep} className="animate-slideIn">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Información Básica</h2>
                  <p className="text-sm text-gray-500">Configure los datos iniciales del manifiesto</p>
                </div>
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/30">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Fecha de Emisión <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.fecha_emision}
                          onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-900 bg-gray-50 hover:bg-white font-medium"
                        />
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                      <p className="text-sm text-blue-900 flex items-center gap-2 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>El número de manifiesto se generará automáticamente al guardar</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Embarcación</h2>
                  <p className="text-sm text-gray-500">Seleccione la embarcación generadora de residuos</p>
                </div>
                <div className="max-w-2xl mx-auto">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18m-9-6v6m-3-3h6" />
                      </svg>
                    </div>
                    <label className="block text-sm font-bold text-gray-900">
                      Seleccionar Buque <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <select
                    required
                    value={formData.buque_id}
                    onChange={(e) => setFormData({ ...formData, buque_id: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 cursor-pointer"
                  >
                    <option value="">Seleccionar embarcación...</option>
                    {buques.map((buque) => (
                      <option key={buque.id} value={buque.id}>
                        {buque.nombre_buque} {buque.matricula ? `(${buque.matricula})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedBuque && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-green-900 mb-1">Embarcación Seleccionada</p>
                          <p className="text-sm font-bold text-gray-900">{selectedBuque.nombre_buque}</p>
                          {selectedBuque.matricula && (
                            <p className="text-xs text-gray-600 mt-0.5">Matrícula: {selectedBuque.matricula}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Residuos</h2>
                  <p className="text-sm text-gray-500">Ingrese las cantidades de cada tipo de residuo</p>
                </div>
                <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aceite Usado */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <label className="block text-sm font-bold text-gray-900">
                        Aceite Usado (Galones)
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={residuos.aceite_usado}
                      onChange={(e) => setResiduos({ ...residuos, aceite_usado: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm bg-gray-50 hover:bg-white text-gray-900 transition-all font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Filtros de Aceite */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-gray-400 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white shadow-lg shadow-gray-600/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <label className="block text-sm font-bold text-gray-900">
                        Filtros de Aceite (Unidades)
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={residuos.filtros_aceite}
                      onChange={(e) => setResiduos({ ...residuos, filtros_aceite: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 outline-none text-sm bg-gray-50 hover:bg-white text-gray-900 transition-all font-medium"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Filtros de Diesel */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-600/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <label className="block text-sm font-bold text-gray-900">
                        Filtros de Diesel (Unidades)
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={residuos.filtros_diesel}
                      onChange={(e) => setResiduos({ ...residuos, filtros_diesel: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 outline-none text-sm bg-gray-50 hover:bg-white text-gray-900 transition-all font-medium"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Basura */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <label className="block text-sm font-bold text-gray-900">
                        Basura (Kilogramos)
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={residuos.basura}
                      onChange={(e) => setResiduos({ ...residuos, basura: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm bg-gray-50 hover:bg-white text-gray-900 transition-all font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Responsables</h2>
                  <p className="text-sm text-gray-500">Asigne los responsables del manifiesto</p>
                </div>
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Responsable Principal */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-500/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Responsable Principal <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.responsable_principal_id}
                          onChange={(e) => setFormData({ ...formData, responsable_principal_id: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 cursor-pointer"
                        >
                          <option value="">Seleccionar responsable principal...</option>
                          {personas.map((persona) => (
                            <option key={persona.id} value={persona.id}>
                              {persona.nombre} {persona.tipo_persona?.nombre_tipo ? `(${persona.tipo_persona.nombre_tipo})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedResponsablePrincipal && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-500 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-purple-900">Responsable Principal</p>
                            <p className="text-gray-700 font-medium">{selectedResponsablePrincipal.nombre}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Responsable Secundario */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Responsable Secundario <span className="text-xs text-gray-500">(Opcional)</span>
                        </label>
                        <select
                          value={formData.responsable_secundario_id || ''}
                          onChange={(e) => setFormData({ ...formData, responsable_secundario_id: e.target.value || '' })}
                          className="w-full px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 cursor-pointer"
                        >
                          <option value="">Seleccionar responsable secundario (opcional)...</option>
                          {personas.filter(p => p.id !== parseInt(formData.responsable_principal_id)).map((persona) => (
                            <option key={persona.id} value={persona.id}>
                              {persona.nombre} {persona.tipo_persona?.nombre_tipo ? `(${persona.tipo_persona.nombre_tipo})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedResponsableSecundario && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-blue-900">Responsable Secundario</p>
                            <p className="text-gray-700 font-medium">{selectedResponsableSecundario.nombre}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-gray-600/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <label className="block text-sm font-bold text-gray-900">
                        Observaciones <span className="text-xs text-gray-500">(Opcional)</span>
                      </label>
                    </div>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                      placeholder="Escriba cualquier observación adicional sobre el manifiesto..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 outline-none resize-none bg-gray-50 hover:bg-white text-gray-900 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Digitalizar Documento</h2>
                  <p className="text-sm text-gray-500">Cargue el archivo escaneado del manifiesto físico (opcional)</p>
                </div>
                <div className="max-w-2xl mx-auto">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl p-8 text-center transition-all duration-300 border-3 ${
                      dragActive 
                        ? 'bg-blue-50 border-blue-500 shadow-xl border-dashed' 
                        : archivo 
                        ? 'bg-green-50 border-green-500 shadow-lg border-solid' 
                        : 'bg-white border-gray-300 shadow-md border-dashed hover:shadow-lg hover:border-gray-400'
                    }`}
                    style={{
                      borderWidth: '3px',
                    }}
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
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mb-2">Arrastre y suelte el archivo aquí</p>
                        <p className="text-sm text-gray-500 mb-4">o</p>
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-xl cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          Seleccionar Archivo
                        </label>
                        <p className="text-xs text-gray-500 mt-4 font-medium">Formatos soportados: PDF, JPG, PNG • Tamaño máximo: 10MB</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-700 mb-2">Archivo Cargado Exitosamente</p>
                          <p className="text-gray-900 font-bold text-lg">{archivo.name}</p>
                          <p className="text-sm text-gray-600 mt-1 font-medium">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setArchivo(null)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar Archivo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200/50">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02]"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
