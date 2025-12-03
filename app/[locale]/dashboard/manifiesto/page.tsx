'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';
import { createManifiesto, getManifiestos, deleteManifiesto, generarNumeroManifiesto } from '@/lib/services/manifiestos';
import { generarPDFManifiesto, generarNombreArchivoPDF } from '@/lib/utils/pdfGenerator';
import { ManifiestoConRelaciones, Buque, PersonaConTipo } from '@/types/database';

export default function ManifiestosPage() {
  const t = useTranslations('Manifiestos');
  const tm = useTranslations('Manifiestos.mensajes');
  const [manifiestos, setManifiestos] = useState<ManifiestoConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [viewingManifiesto, setViewingManifiesto] = useState<ManifiestoConRelaciones | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  
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
    filtros_aire: 0,
    basura: 0,
  });
  
  const [archivo, setArchivo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const buqueSelectRef = useRef<HTMLSelectElement | null>(null);

  const steps = [
    { number: 1, title: 'Información Básica' },
    { number: 2, title: 'Embarcación' },
    { number: 3, title: 'Residuos' },
    { number: 4, title: 'Responsable' },
    { number: 5, title: 'Digitalizar' },
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
    // Validar paso actual antes de avanzar
    if (currentStep === 1) {
      if (!formData.fecha_emision) {
        setShowValidation(true);
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.buque_id) {
        setShowValidation(true);
        // Llevar el foco y scroll al select de buque
        buqueSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        buqueSelectRef.current?.focus();
        return;
      }
    }
    // Paso 3 (residuos) es opcional, puede estar en 0
    if (currentStep === 4) {
      if (!formData.responsable_principal_id) {
        setShowValidation(true);
        return;
      }
    }
    if (currentStep === 5) {
      if (!archivo) {
        setShowValidation(true);
        return;
      }
    }
    
    setShowValidation(false);
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
      setShowValidation(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setShowValidation(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.fecha_emision || !formData.buque_id || !formData.responsable_principal_id) {
        alert('❌ Por favor completa todos los campos obligatorios');
        return;
      }

      if (!archivo) {
        alert('❌ Debes digitalizar el manifiesto antes de guardarlo. El archivo es obligatorio.');
        return;
      }

      setSaving(true);
      
      const manifiestoData = {
        fecha_emision: formData.fecha_emision,
        buque_id: parseInt(formData.buque_id),
        responsable_principal_id: parseInt(formData.responsable_principal_id),
        responsable_secundario_id: formData.responsable_secundario_id ? parseInt(formData.responsable_secundario_id) : null,
        estado_digitalizacion: 'completado' as any,
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
        filtros_aire: 0,
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

  const handleDescargarPDF = async (manifiesto: ManifiestoConRelaciones) => {
    try {
      setGenerandoPDF(manifiesto.id.toString());
      
      // Generar el PDF
      const pdfBlob = await generarPDFManifiesto(manifiesto);
      const nombreArchivo = generarNombreArchivoPDF(manifiesto.numero_manifiesto);
      
      // Crear URL del blob para descarga directa
      const url = URL.createObjectURL(pdfBlob);
      
      // Descargar el archivo
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar la URL del blob
      URL.revokeObjectURL(url);
      
      alert(tm('descargaExitosa'));
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert(tm('errorDescarga'));
    } finally {
      setGenerandoPDF(null);
    }
  };

  const selectedBuque = buques.find(b => b.id === parseInt(formData.buque_id));
  const selectedResponsablePrincipal = personas.find(p => p.id === parseInt(formData.responsable_principal_id));
  const selectedResponsableSecundario = personas.find(p => p.id === parseInt(formData.responsable_secundario_id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Manifiestos</span>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">Registra y gestiona los manifiestos de residuos marítimos</p>
            </div>
        </h1>
      </div>

      {/* Proceso de Digitalización */}
      <div className="rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 bg-white border border-gray-200">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="text-center mb-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Nuevo Manifiesto</h2>
              <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Complete los siguientes pasos para registrar el manifiesto</p>
            </div>
          </div>

          {/* Indicadores de Pasos - Diseño Moderno */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-6 md:mb-8 overflow-x-auto px-2 sm:px-0">
            {[
              { num: 1, label: 'Información', icon: 'document' },
              { num: 2, label: 'Embarcación', icon: 'ship' },
              { num: 3, label: 'Residuos', icon: 'recycle' },
              { num: 4, label: 'Responsables', icon: 'users' },
              { num: 5, label: 'Archivo', icon: 'upload' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-[50px] sm:min-w-[60px]">
                  <div 
                    className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-bold transition-all duration-300 ${
                      currentStep === step.num 
                        ? 'bg-blue-600 text-white' 
                        : currentStep > step.num
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-400 border border-gray-300'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.icon === 'document' ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : step.icon === 'ship' ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18m-9-6v6m-3-3h6" />
                      </svg>
                    ) : step.icon === 'recycle' ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : step.icon === 'users' ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] md:text-[11px] font-bold transition-colors text-center ${
                    currentStep === step.num ? 'text-blue-600' : currentStep > step.num ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`w-8 sm:w-10 md:w-14 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded-full transition-all duration-500 ${
                    currentStep > step.num ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

          {/* Contenedor con altura adaptable */}
          <div className="min-h-[280px] overflow-y-auto max-h-[500px] px-2 sm:px-0">
            <div key={currentStep} className="animate-slideIn">
            {currentStep === 1 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Información Básica</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Configure los datos iniciales del manifiesto</p>
                </div>
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                          Fecha de Emisión <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.fecha_emision}
                          onChange={(e) => {
                            setFormData({ ...formData, fecha_emision: e.target.value });
                            setShowValidation(false);
                          }}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-xs sm:text-sm text-gray-900"
                        />
                        {showValidation && !formData.fecha_emision && (
                          <p className="text-xs text-red-600 mt-1">Por favor, selecciona la fecha de emisión</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 p-2.5 sm:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-xs sm:text-sm text-blue-900 flex items-start sm:items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Embarcación</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Seleccione la embarcación generadora de residuos</p>
                </div>
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 14l2 1c2 1 4 1 6 1s4 0 6-1l2-1m-16 0l2-5h12l2 5M6 9l3-3h6l3 3" />
                        </svg>
                      </div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                        Seleccionar Buque <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <select
                      ref={buqueSelectRef}
                      required
                      value={formData.buque_id}
                      onChange={(e) => {
                        setFormData({ ...formData, buque_id: e.target.value });
                        setShowValidation(false);
                      }}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg focus:ring-2 outline-none transition-all text-gray-900 cursor-pointer border 
                        ${showValidation && !formData.buque_id 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
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
                      <div className="mt-3 p-2.5 sm:p-3 bg-green-50 border-l-4 border-green-500 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold text-green-800 mb-0.5">Embarcación Seleccionada</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{selectedBuque.nombre_buque}</p>
                            {selectedBuque.matricula && (
                              <p className="text-[10px] sm:text-xs text-gray-600">Matrícula: {selectedBuque.matricula}</p>
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
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Residuos</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Ingrese las cantidades de cada tipo de residuo</p>
                </div>
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Aceite Usado */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-600 flex items-center justify-center text-white flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Aceite Usado (Galones)
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={residuos.aceite_usado}
                        onChange={(e) => setResiduos({ ...residuos, aceite_usado: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-xs sm:text-sm text-gray-900 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* Filtros de Aceite */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-600 flex items-center justify-center text-white flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        </div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Filtros Aceite (Unidades)
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={residuos.filtros_aceite}
                        onChange={(e) => setResiduos({ ...residuos, filtros_aceite: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none text-xs sm:text-sm text-gray-900 transition-all"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Filtros de Diesel */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-600 flex items-center justify-center text-white flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Filtros Diesel (Unidades)
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={residuos.filtros_diesel}
                        onChange={(e) => setResiduos({ ...residuos, filtros_diesel: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-xs sm:text-sm text-gray-900 transition-all"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Filtros de Aire */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                        </div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Filtros Aire (Unidades)
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={residuos.filtros_aire}
                        onChange={(e) => setResiduos({ ...residuos, filtros_aire: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-xs sm:text-sm text-gray-900 transition-all"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Basura */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-600 flex items-center justify-center text-white flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Basura (Kilogramos)
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={residuos.basura}
                        onChange={(e) => setResiduos({ ...residuos, basura: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-xs sm:text-sm text-gray-900 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Responsables</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Asigne los responsables del manifiesto</p>
                </div>
                <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
                  {/* Responsable Principal */}
                  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 mb-2">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                          Responsable Principal <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.responsable_principal_id}
                          onChange={(e) => {
                            setFormData({ ...formData, responsable_principal_id: e.target.value });
                            setShowValidation(false);
                          }}
                          className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 cursor-pointer"
                        >
                          <option value="">Seleccionar responsable principal...</option>
                          {personas.map((persona) => (
                            <option key={persona.id} value={persona.id}>
                              {persona.nombre} {persona.tipo_persona?.nombre_tipo ? `(${persona.tipo_persona.nombre_tipo})` : ''}
                            </option>
                          ))}
                        </select>
                        {showValidation && !formData.responsable_principal_id && (
                          <p className="text-xs text-red-600 mt-1">Por favor, selecciona un responsable principal.</p>
                        )}
                      </div>
                    </div>

                    {selectedResponsablePrincipal && (
                      <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold text-purple-800">Responsable Principal</p>
                            <p className="text-xs sm:text-sm text-gray-900 font-medium truncate">{selectedResponsablePrincipal.nombre}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Responsable Secundario */}
                  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 mb-2">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                          Responsable Secundario <span className="text-[10px] sm:text-xs text-gray-500">(Opcional)</span>
                        </label>
                        <select
                          value={formData.responsable_secundario_id || ''}
                          onChange={(e) => setFormData({ ...formData, responsable_secundario_id: e.target.value || '' })}
                          className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 cursor-pointer"
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
                      <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold text-blue-800">Responsable Secundario</p>
                            <p className="text-xs sm:text-sm text-gray-900 font-medium truncate">{selectedResponsableSecundario.nombre}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-600 flex items-center justify-center text-white flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                        Observaciones <span className="text-[10px] sm:text-xs text-gray-500">(Opcional)</span>
                      </label>
                    </div>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                      placeholder="Escriba cualquier observación adicional..."
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none resize-none text-gray-900 text-xs sm:text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Digitalizar Documento</h2>
                  <p className="text-xs sm:text-sm text-red-600 font-semibold">⚠️ El archivo digitalizado es OBLIGATORIO para guardar el manifiesto</p>
                </div>
                
                {/* Instrucciones y botón de descarga PDF */}
                <div className="max-w-2xl mx-auto mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-blue-900 mb-2">📋 Instrucciones para digitalizar:</h3>
                      <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside mb-3">
                        <li>Descarga el PDF del manifiesto usando el botón de abajo</li>
                        <li>Imprime el documento</li>
                        <li>Solicita las firmas de los responsables</li>
                        <li>Escanea el documento firmado</li>
                        <li>Sube el archivo escaneado en esta sección</li>
                      </ol>
                      <button
                        type="button"
                        onClick={() => {
                          // Crear un manifiesto temporal para la descarga
                          const manifiestoTemp: ManifiestoConRelaciones = {
                            id: 0,
                            numero_manifiesto: 'BORRADOR-' + new Date().getTime(),
                            fecha_emision: formData.fecha_emision,
                            buque_id: parseInt(formData.buque_id),
                            responsable_principal_id: parseInt(formData.responsable_principal_id),
                            responsable_secundario_id: formData.responsable_secundario_id ? parseInt(formData.responsable_secundario_id) : null,
                            estado_digitalizacion: 'pendiente',
                            observaciones: formData.observaciones,
                            imagen_manifiesto_url: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            buque: selectedBuque,
                            responsable_principal: selectedResponsablePrincipal,
                            responsable_secundario: selectedResponsableSecundario,
                            residuos: {
                              id: 0,
                              manifiesto_id: 0,
                              ...residuos,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            }
                          };
                          handleDescargarPDF(manifiestoTemp);
                        }}
                        disabled={!formData.buque_id || !formData.responsable_principal_id}
                        className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar PDF del Manifiesto
                      </button>
                    </div>
                  </div>
                </div>
                <div className="max-w-2xl mx-auto">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-center transition-all ${
                      dragActive 
                        ? 'bg-blue-50 border-2 border-blue-500 border-dashed' 
                        : archivo 
                        ? 'bg-green-50 border-2 border-green-500 border-solid' 
                        : 'bg-white border-2 border-gray-300 border-dashed'
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
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-2">Arrastre y suelte el archivo aquí</p>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">o</p>
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition-all"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          Seleccionar Archivo
                        </label>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4">Formatos soportados: PDF, JPG, PNG • Tamaño máximo: 10MB</p>
                        {showValidation && !archivo && (
                          <p className="text-xs text-red-600 mt-2">Por favor, sube el archivo digitalizado del manifiesto.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto bg-green-600 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-green-700 mb-1.5 sm:mb-2">Archivo Cargado Exitosamente</p>
                          <p className="text-gray-900 font-semibold text-sm sm:text-base md:text-lg truncate px-4">{archivo.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setArchivo(null)}
                          className="inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-red-700 transition-all"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-2 sm:order-1"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                <span>Siguiente</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="whitespace-nowrap">Guardar Manifiesto</span>
                  </>
                )}
              </button>
            )}
        </div>
      </div>

      {/* Tabla de Manifiestos */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl"></span>
            <span className="break-words">Manifiestos Registrados</span>
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Lista de todos los manifiestos creados en el sistema</p>
        </div>

        {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border border-gray-200 sm:rounded-xl">
                  <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Buque</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Resp. Principal</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Resp. Secundario</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Estado</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                <tbody>
                  {manifiestos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 text-center py-8 text-gray-500">
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
                    manifiestos.map((manifiesto) => {
                      // Buscar el buque por ID si no viene en la relación
                      const buqueNombre = manifiesto.buque?.nombre_buque || 
                        buques.find(b => b.id === manifiesto.buque_id)?.nombre_buque || 
                        'N/A';
                      
                      // Buscar responsables por ID si no vienen en la relación
                      const respPrincipal = manifiesto.responsable_principal?.nombre || 
                        personas.find(p => p.id === manifiesto.responsable_principal_id)?.nombre || 
                        'N/A';
                      
                      const respSecundario = manifiesto.responsable_secundario?.nombre || 
                        (manifiesto.responsable_secundario_id ? 
                          personas.find(p => p.id === manifiesto.responsable_secundario_id)?.nombre : 
                          null);

                      return (
                        <tr key={manifiesto.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <span className="font-semibold text-blue-600 whitespace-nowrap">{manifiesto.numero_manifiesto}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                            <span className="font-medium text-gray-900 truncate">{buqueNombre}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 hidden md:table-cell">
                            <span className="font-medium text-gray-900">{respPrincipal}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 hidden lg:table-cell">
                            <span className="text-gray-600">{respSecundario || '—'}</span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 hidden lg:table-cell">
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
                              {manifiesto.estado_digitalizacion === 'completado' && 'Completado'}
                              {manifiesto.estado_digitalizacion === 'en_proceso' && 'En Proceso'}
                              {manifiesto.estado_digitalizacion === 'pendiente' && 'Pendiente'}
                              {manifiesto.estado_digitalizacion === 'aprobado' && 'Aprobado'}
                              {manifiesto.estado_digitalizacion === 'rechazado' && 'Rechazado'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 hidden sm:table-cell">
                            <span className="text-gray-600 whitespace-nowrap">
                              {new Date(manifiesto.fecha_emision).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700">
                          <div className="flex gap-1 sm:gap-2 min-w-[160px]">
                            <button
                              onClick={() => handleDescargarPDF(manifiesto)}
                              disabled={generandoPDF === manifiesto.id.toString()}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 sm:gap-1.5 font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('acciones.descargarPDF')}
                            >
                              {generandoPDF === manifiesto.id.toString() ? (
                                <>
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="hidden sm:inline">...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="hidden lg:inline">PDF</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setViewingManifiesto(manifiesto)}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-1.5 font-medium text-gray-700 whitespace-nowrap"
                              title="Ver detalles"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="hidden sm:inline">Ver</span>
                            </button>
                            <button
                              onClick={() => handleDelete(manifiesto.id)}
                              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
                              title="Eliminar"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Modal de visualización de detalles */}
      {viewingManifiesto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-5 sm:py-6 rounded-t-xl sm:rounded-t-2xl z-10 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/30">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">Detalles del Manifiesto</h2>
                    <p className="text-blue-100 text-sm sm:text-base mt-1 truncate flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      {viewingManifiesto.numero_manifiesto}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingManifiesto(null)} 
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all flex-shrink-0 hover:scale-110 active:scale-95 shadow-lg ring-2 ring-white/20"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 bg-gradient-to-br from-gray-50 to-white">
              {(() => {
                // Buscar el buque por ID si no viene en la relación
                const buqueNombre = viewingManifiesto.buque?.nombre_buque || 
                  buques.find(b => b.id === viewingManifiesto.buque_id)?.nombre_buque || 
                  'N/A';
                
                // Buscar responsables por ID si no vienen en la relación
                const respPrincipal = viewingManifiesto.responsable_principal?.nombre || 
                  personas.find(p => p.id === viewingManifiesto.responsable_principal_id)?.nombre || 
                  'N/A';
                
                const respSecundario = viewingManifiesto.responsable_secundario?.nombre || 
                  (viewingManifiesto.responsable_secundario_id ? 
                    personas.find(p => p.id === viewingManifiesto.responsable_secundario_id)?.nombre : 
                    null);

                return (
                  <>
                    {/* Información Básica */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 sm:p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-gray-800">Información Básica</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <p className="text-xs sm:text-sm text-gray-600 font-semibold">Número de Manifiesto</p>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-blue-600">{viewingManifiesto.numero_manifiesto}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs sm:text-sm text-gray-600 font-semibold">Fecha de Emisión</p>
                          </div>
                          <p className="text-base sm:text-lg font-semibold text-gray-900">
                            {new Date(viewingManifiesto.fecha_emision).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:border-blue-300 transition-colors sm:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs sm:text-sm text-gray-600 font-semibold">Estado</p>
                          </div>
                          <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm ${
                            viewingManifiesto.estado_digitalizacion === 'completado' 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : viewingManifiesto.estado_digitalizacion === 'en_proceso'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : viewingManifiesto.estado_digitalizacion === 'aprobado'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : viewingManifiesto.estado_digitalizacion === 'rechazado'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}>
                            {viewingManifiesto.estado_digitalizacion === 'completado' && '✓ Completado'}
                            {viewingManifiesto.estado_digitalizacion === 'en_proceso' && '⟳ En Proceso'}
                            {viewingManifiesto.estado_digitalizacion === 'pendiente' && '○ Pendiente'}
                            {viewingManifiesto.estado_digitalizacion === 'aprobado' && '✓ Aprobado'}
                            {viewingManifiesto.estado_digitalizacion === 'rechazado' && '✕ Rechazado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Embarcación */}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 sm:p-6 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18" />
                          </svg>
                        </div>
                        <span className="text-gray-800">Embarcación</span>
                      </h3>
                      <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-cyan-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-medium mb-1">Nombre del Buque</p>
                            <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{buqueNombre}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Responsables */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 sm:p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <span className="text-gray-800">Responsables</span>
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Principal</p>
                              <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{respPrincipal}</p>
                            </div>
                            <div className="px-2 py-1 bg-purple-100 rounded-md">
                              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        {respSecundario && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 hover:border-purple-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium mb-0.5">Secundario</p>
                                <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{respSecundario}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Residuos */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 sm:p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-5 sm:mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-gray-800">Residuos Registrados</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Aceite Usado */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">L</span>
                    </div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wide">Aceite Usado</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                      {viewingManifiesto.residuos?.aceite_usado || 0}
                    </p>
                  </div>

                  {/* Filtros de Aceite */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-300 hover:border-gray-500 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md">un</span>
                    </div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wide">Filtros Aceite</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-700">
                      {viewingManifiesto.residuos?.filtros_aceite || 0}
                    </p>
                  </div>

                  {/* Filtros de Diesel */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-slate-300 hover:border-slate-500 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">un</span>
                    </div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wide">Filtros Diesel</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-700">
                      {viewingManifiesto.residuos?.filtros_diesel || 0}
                    </p>
                  </div>

                  {/* Basura */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-green-300 hover:border-green-500 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">kg</span>
                    </div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wide">Basura</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">
                      {viewingManifiesto.residuos?.basura || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Imagen del Manifiesto */}
              {viewingManifiesto.imagen_manifiesto_url && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-800">Documento Digitalizado</span>
                  </h3>
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-300 shadow-inner">
                    <div className="relative group">
                      <img 
                        src={viewingManifiesto.imagen_manifiesto_url} 
                        alt="Manifiesto escaneado" 
                        className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-md group-hover:shadow-xl transition-shadow duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors duration-300"></div>
                    </div>
                    <a
                      href={viewingManifiesto.imagen_manifiesto_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 sm:mt-5 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold hover:scale-105 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="text-sm sm:text-base">Abrir en nueva pestaña</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {viewingManifiesto.observaciones && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 sm:p-6 border border-amber-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <span className="text-gray-800">Observaciones</span>
                  </h3>
                  <div className="bg-white rounded-lg p-4 sm:p-5 border border-amber-200 shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap flex-1">{viewingManifiesto.observaciones}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
