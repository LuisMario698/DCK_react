'use client';

import { useState, useEffect } from 'react';
import { createManifiesto, updateManifiesto } from '@/lib/services/manifiestos';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';
import { ManifiestoConRelaciones, Buque, PersonaConTipo } from '@/types/database';

interface CreateManifiestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  manifiestoToEdit?: ManifiestoConRelaciones | null;
}

interface ResiduosData {
  aceite_usado: number;
  filtros_aceite: number;
  filtros_diesel: number;
  filtros_aire: number;
  basura: number;
}

export function CreateManifiestoModal({ isOpen, onClose, onSave, manifiestoToEdit }: CreateManifiestoModalProps) {
  const [loading, setLoading] = useState(false);
  const [buques, setBuques] = useState<Buque[]>([]);
  const [personas, setPersonas] = useState<PersonaConTipo[]>([]);
  const [selectedBuque, setSelectedBuque] = useState<Buque | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [formData, setFormData] = useState({
    numero_manifiesto: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    buque_id: '',
    persona_id: '',
    observaciones: '',
  });

  const [residuos, setResiduos] = useState<ResiduosData>({
    aceite_usado: 0,
    filtros_aceite: 0,
    filtros_diesel: 0,
    filtros_aire: 0,
    basura: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  async function loadData() {
    try {
      console.log('🔄 Cargando datos...');
      const [buquesData, personasData] = await Promise.all([
        getBuques(),
        getPersonas()
      ]);
      console.log('✅ Datos cargados:', { buques: buquesData.length, personas: personasData.length });
      setBuques(buquesData);
      setPersonas(personasData);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      alert('Error al cargar los datos');
    }
  }

  const handleBuqueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buqueId = e.target.value;
    setFormData({ ...formData, buque_id: buqueId });
    const buque = buques.find(b => b.id === parseInt(buqueId));
    setSelectedBuque(buque || null);
  };

  const updateResiduo = (field: keyof ResiduosData, value: number) => {
    setResiduos(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos ANTES de setLoading
    if (!formData.numero_manifiesto.trim()) {
      alert('❌ El número de manifiesto es obligatorio');
      return;
    }
    if (!formData.fecha_emision) {
      alert('❌ La fecha de emisión es obligatoria');
      return;
    }
    if (!formData.buque_id) {
      alert('❌ Selecciona una embarcación');
      return;
    }
    if (!formData.persona_id) {
      alert('❌ Selecciona una persona responsable');
      return;
    }
    // Los residuos pueden ser >= 0, no requieren validación extra

    setLoading(true);

    try {
      // Aquí puedes agregar la lógica para subir el archivo si es necesario
      const manifiestoData = {
        numero_manifiesto: formData.numero_manifiesto,
        fecha_emision: formData.fecha_emision,
        buque_id: parseInt(formData.buque_id),
        responsable_principal_id: parseInt(formData.persona_id),
        responsable_secundario_id: null,
        estado_digitalizacion: archivo ? 'completado' : 'pendiente' as any,
        observaciones: formData.observaciones || null,
        imagen_manifiesto_url: null,
      };

      if (manifiestoToEdit) {
        await updateManifiesto(manifiestoToEdit.id, manifiestoData, residuos);
        alert('✅ Manifiesto actualizado exitosamente');
      } else {
        await createManifiesto(manifiestoData, residuos);
        alert('✅ Manifiesto creado exitosamente');
      }

      onSave();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error guardando manifiesto:', error);
      alert('❌ Error al guardar el manifiesto: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_manifiesto: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      buque_id: '',
      persona_id: '',
      observaciones: '',
    });
    setSelectedBuque(null);
    setResiduos({
      aceite_usado: 0,
      filtros_aceite: 0,
      filtros_diesel: 0,
      filtros_aire: 0,
      basura: 0,
    });
    setArchivo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {manifiestoToEdit ? '✏️ Editar Manifiesto' : '📋 Nuevo Manifiesto'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">Complete toda la información del manifiesto de residuos</p>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Número de Manifiesto <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.numero_manifiesto}
                onChange={(e) => setFormData({ ...formData, numero_manifiesto: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                placeholder="Ej: MAN-2025-001"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Emisión <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.fecha_emision}
                onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                disabled={loading}
              />
            </div>
          </div>

          {/* Sección 1: Embarcación */}
          <section className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-300 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">🚢 1. Embarcación</h3>
                <p className="text-gray-600">Seleccione la embarcación generadora de residuos</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Seleccionar Buque <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.buque_id}
                onChange={handleBuqueChange}
                className="w-full px-5 py-4 text-lg font-medium border-2 border-cyan-400 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all hover:border-cyan-500 bg-white shadow-md"
                disabled={loading}
              >
                <option value="">🔍 Seleccionar embarcación...</option>
                {buques.map((buque) => (
                  <option key={buque.id} value={buque.id}>
                    🚢 {buque.nombre_buque} {buque.matricula ? `(${buque.matricula})` : ''}
                  </option>
                ))}
              </select>

              {selectedBuque && (
                <div className="mt-4 p-6 bg-white border-2 border-cyan-400 rounded-xl shadow-md animate-fadeIn">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-cyan-700 uppercase tracking-wide">Embarcación Seleccionada</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Nombre:</p>
                      <p className="text-lg font-bold text-gray-900">{selectedBuque.nombre_buque}</p>
                    </div>
                    {selectedBuque.matricula && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Matrícula:</p>
                        <p className="text-lg font-bold text-gray-900">{selectedBuque.matricula}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sección 2: Residuos */}
          <section className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">♻️ 2. Residuos Marítimos</h3>
                <p className="text-gray-600">Especifique las cantidades de cada tipo de residuo</p>
              </div>
            </div>

            {/* Campos específicos de residuos según el manifiesto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aceite Usado */}
              <div className="bg-white border-2 border-green-300 rounded-xl p-5 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🛢️</span>
                  </div>
                  <label className="text-sm font-bold text-gray-700">ACEITE USADO</label>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={residuos.aceite_usado}
                      onChange={(e) => updateResiduo('aceite_usado', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                    Litros
                  </div>
                </div>
              </div>

              {/* Filtros de Aceite */}
              <div className="bg-white border-2 border-green-300 rounded-xl p-5 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <label className="text-sm font-bold text-gray-700">FILTROS DE ACEITE</label>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={residuos.filtros_aceite}
                      onChange={(e) => updateResiduo('filtros_aceite', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                    Unidades
                  </div>
                </div>
              </div>

              {/* Filtros de Diesel */}
              <div className="bg-white border-2 border-green-300 rounded-xl p-5 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⛽</span>
                  </div>
                  <label className="text-sm font-bold text-gray-700">FILTROS DE DIESEL</label>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={residuos.filtros_diesel}
                      onChange={(e) => updateResiduo('filtros_diesel', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                    Unidades
                  </div>
                </div>
              </div>

              {/* Filtros de Aire */}
              <div className="bg-white border-2 border-green-300 rounded-xl p-5 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💨</span>
                  </div>
                  <label className="text-sm font-bold text-gray-700">FILTROS DE AIRE</label>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={residuos.filtros_aire}
                      onChange={(e) => updateResiduo('filtros_aire', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                    Unidades
                  </div>
                </div>
              </div>

              {/* Basura */}
              <div className="bg-white border-2 border-green-300 rounded-xl p-5 shadow-md md:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🗑️</span>
                  </div>
                  <label className="text-sm font-bold text-gray-700">BASURA</label>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={residuos.basura}
                      onChange={(e) => updateResiduo('basura', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                    Kilogramos
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-6 p-4 bg-white border-2 border-green-400 rounded-xl">
              <p className="text-sm font-semibold text-gray-600 mb-2">📊 Resumen de Residuos:</p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500">Aceite</p>
                  <p className="text-lg font-bold text-green-700">{residuos.aceite_usado} L</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">F. Aceite</p>
                  <p className="text-lg font-bold text-green-700">{residuos.filtros_aceite} un</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">F. Diesel</p>
                  <p className="text-lg font-bold text-green-700">{residuos.filtros_diesel} un</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">F. Aire</p>
                  <p className="text-lg font-bold text-green-700">{residuos.filtros_aire} un</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Basura</p>
                  <p className="text-lg font-bold text-green-700">{residuos.basura} kg</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sección 3: Persona */}
          <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-300 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">👤 3. Persona Responsable</h3>
                <p className="text-gray-600">Seleccione la persona responsable del manifiesto</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Seleccionar Persona <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.persona_id}
                onChange={(e) => setFormData({ ...formData, persona_id: e.target.value })}
                className="w-full px-5 py-4 text-lg font-medium border-2 border-purple-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all hover:border-purple-500 bg-white shadow-md"
                disabled={loading}
              >
                <option value="">🔍 Seleccionar persona...</option>
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    👤 {persona.nombre} {persona.tipo_persona?.nombre_tipo ? `(${persona.tipo_persona.nombre_tipo})` : ''}
                  </option>
                ))}
              </select>

              {formData.persona_id && (
                <div className="mt-4 p-6 bg-white border-2 border-purple-400 rounded-xl shadow-md animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-purple-700 uppercase tracking-wide">✅ Persona Seleccionada</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sección 4: Digitalizar */}
          <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-300 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">📤 4. Digitalizar Documento</h3>
                <p className="text-gray-600">Cargue el archivo escaneado del manifiesto físico</p>
              </div>
            </div>

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
          </section>

          {/* Observaciones */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">📝 Observaciones (Opcional)</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={4}
              placeholder="Escriba cualquier observación adicional sobre el manifiesto..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white"
              disabled={loading}
            />
          </div>

          {/* Botones */}
          <div className="sticky bottom-0 bg-gradient-to-r from-gray-100 via-white to-gray-100 px-8 py-6 -mx-8 -mb-8 rounded-b-3xl border-t-2 border-gray-300 shadow-2xl">
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-8 py-4 border-2 border-gray-400 text-gray-700 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl hover:shadow-2xl text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {manifiestoToEdit ? '✨ Actualizar Manifiesto' : '✨ Crear Manifiesto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
