'use client';

import React, { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { getBuques } from '@/lib/services/buques';
import { createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';
import { Buque } from '@/types/database';

// Registrar locale español
registerLocale('es', es);

interface FormData {
  fecha: Date;
  numeroRecibo: string;
  recibimosde: string;
  direccion: string;
  telefono: string;
  buqueId: number | null;
  concepto: string;
  pesoEntrada: number;
  pesoSalida: number;
  totalKilos: number;
  observaciones: string;
  nombreRecibe: string;
}

interface SimpleBasuronFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function SimpleBasuronForm({ onBack, onSuccess }: SimpleBasuronFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [searchBuque, setSearchBuque] = useState('');
  const [showBuqueList, setShowBuqueList] = useState(false);
  const buqueInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date(),
    numeroRecibo: '',
    recibimosde: '',
    direccion: '',
    telefono: '',
    buqueId: null,
    concepto: '',
    pesoEntrada: 0,
    pesoSalida: 0,
    totalKilos: 0,
    observaciones: '',
    nombreRecibe: ''
  });
  
  const [buques, setBuques] = useState<Buque[]>([]);

  useEffect(() => {
    const loadBuques = async () => {
      try {
        const data = await getBuques();
        setBuques(data);
      } catch (error) {
        console.error('Error cargando buques:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBuques();
  }, []);

  // Calcular total automáticamente
  useEffect(() => {
    const total = Math.max(0, formData.pesoEntrada - formData.pesoSalida);
    setFormData(prev => ({ ...prev, totalKilos: total }));
  }, [formData.pesoEntrada, formData.pesoSalida]);

  const selectedBuque = buques.find(b => b.id === formData.buqueId);
  const filteredBuques = buques.filter(b => 
    b.nombre_buque.toLowerCase().includes(searchBuque.toLowerCase())
  );

  const isFormValid = formData.recibimosde && formData.pesoEntrada > 0;

  const handleSubmit = async () => {
    if (!isFormValid) {
      alert('❌ Completa los campos requeridos: "Recibimos de" y "Peso Entrada"');
      return;
    }

    setIsSaving(true);
    try {
      await createManifiestoBasuron({
        fecha: formData.fecha.toISOString().split('T')[0],
        hora_entrada: new Date().toTimeString().slice(0, 8),
        hora_salida: null,
        buque_id: formData.buqueId || 1, // Default si no hay buque
        peso_entrada: formData.pesoEntrada,
        peso_salida: formData.pesoSalida || null,
        nombre_usuario: formData.nombreRecibe || null,
        observaciones: `Recibo #${formData.numeroRecibo} | De: ${formData.recibimosde} | Dir: ${formData.direccion} | Tel: ${formData.telefono} | Concepto: ${formData.concepto} | ${formData.observaciones}`.trim(),
        estado: 'Completado',
        usuario_sistema_id: null,
        tipo_residuo_id: null,
        comprobante_url: null
      });
      
      setShowSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      console.error('Error guardando registro:', error);
      alert('Error al guardar el registro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuqueSelect = (buque: Buque) => {
    setFormData(prev => ({ 
      ...prev, 
      buqueId: buque.id,
      recibimosde: buque.nombre_buque 
    }));
    setSearchBuque(buque.nombre_buque);
    setShowBuqueList(false);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">¡Recibo Guardado!</h3>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-green-600">{formData.totalKilos.toLocaleString()} kg</span> registrados
          </p>
        </div>
      </div>
    );
  }

  const formatDateHeader = () => {
    return formData.fecha.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Documento estilo recibo físico */}
      <div className="bg-white border-2 border-gray-800 rounded-lg shadow-xl overflow-hidden">
        
        {/* Encabezado del recibo - Estilo OOMISLIM */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo camión */}
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM9 12V7a2 2 0 012-2h6a2 2 0 012 2v5m-4 0H5a2 2 0 00-2 2v3h2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider">RELLENO SANITARIO</h1>
                <p className="text-amber-200 text-sm">Puerto Peñasco, Sonora</p>
              </div>
            </div>
            <div className="text-right">
              {/* Logo ancla */}
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21V3m0 0L9 6m3-3l3 3M4.5 15h15M12 3a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>
              <p className="text-xs text-amber-200">Puerto Peñasco</p>
            </div>
          </div>
        </div>

        {/* Barra de fecha y número de recibo */}
        <div className="bg-gray-100 border-b-2 border-gray-800 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Fecha con DatePicker */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700 uppercase">Fecha:</span>
              <div className={`transition-all duration-200 ${activeField === 'fecha' ? 'ring-2 ring-amber-500 rounded-lg' : ''}`}>
                <DatePicker
                  selected={formData.fecha}
                  onChange={(date: Date | null) => date && setFormData(prev => ({ ...prev, fecha: date }))}
                  onFocus={() => setActiveField('fecha')}
                  onBlur={() => setActiveField(null)}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  className="px-3 py-2 border-2 border-gray-400 rounded-lg text-black font-medium text-base w-36 focus:outline-none focus:border-amber-600 cursor-pointer"
                  showPopperArrow={false}
                />
              </div>
            </div>
          </div>
          
          {/* Número de recibo */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700 uppercase">Recibo No.</span>
            <input
              type="text"
              value={formData.numeroRecibo}
              onChange={(e) => setFormData(prev => ({ ...prev, numeroRecibo: e.target.value }))}
              onFocus={() => setActiveField('numeroRecibo')}
              onBlur={() => setActiveField(null)}
              placeholder="12345"
              className={`w-28 px-3 py-2 border-2 rounded-lg text-black font-bold text-lg text-center focus:outline-none transition-all duration-200 ${
                activeField === 'numeroRecibo' ? 'border-amber-600 bg-amber-50' : 'border-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Contenido del formulario */}
        <div className="p-6 space-y-4">
          
          {/* RECIBIMOS DE - Campo principal con autocompletado de buques */}
          <div className={`relative py-3 px-4 -mx-4 rounded-xl transition-all duration-200 ${activeField === 'recibimosde' ? 'bg-amber-50 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}>
            <div className="flex items-center gap-4">
              <label className="text-base font-bold text-black w-36 flex-shrink-0 uppercase">Recibimos de:</label>
              <div className="flex-1 relative">
                <input
                  ref={buqueInputRef}
                  type="text"
                  value={searchBuque || formData.recibimosde}
                  onChange={(e) => {
                    setSearchBuque(e.target.value);
                    setFormData(prev => ({ ...prev, recibimosde: e.target.value, buqueId: null }));
                    setShowBuqueList(true);
                  }}
                  onFocus={() => {
                    setActiveField('recibimosde');
                    setShowBuqueList(true);
                  }}
                  onBlur={() => {
                    setActiveField(null);
                    setTimeout(() => setShowBuqueList(false), 200);
                  }}
                  placeholder="Nombre o embarcación..."
                  className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 ${
                    activeField === 'recibimosde' ? 'border-amber-600' : 'border-gray-400'
                  }`}
                />
                {/* Lista de buques */}
                {showBuqueList && filteredBuques.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredBuques.slice(0, 8).map(buque => (
                      <button
                        key={buque.id}
                        type="button"
                        onMouseDown={() => handleBuqueSelect(buque)}
                        className="w-full text-left px-4 py-2 hover:bg-amber-100 border-b last:border-b-0 transition-colors"
                      >
                        <span className="font-semibold text-black">{buque.nombre_buque}</span>
                        {buque.matricula && <span className="text-gray-500 text-sm ml-2">({buque.matricula})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Línea: Dirección y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DIRECCIÓN */}
            <div className={`py-3 px-4 -mx-4 md:mx-0 rounded-xl transition-all duration-200 ${activeField === 'direccion' ? 'bg-amber-50 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <label className="text-base font-bold text-black w-24 flex-shrink-0 uppercase">Dirección:</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  onFocus={() => setActiveField('direccion')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Dirección..."
                  className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 ${
                    activeField === 'direccion' ? 'border-amber-600' : 'border-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* TELÉFONO */}
            <div className={`py-3 px-4 -mx-4 md:mx-0 rounded-xl transition-all duration-200 ${activeField === 'telefono' ? 'bg-amber-50 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <label className="text-base font-bold text-black w-24 flex-shrink-0 uppercase">Teléfono:</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  onFocus={() => setActiveField('telefono')}
                  onBlur={() => setActiveField(null)}
                  placeholder="(000) 000-0000"
                  className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 ${
                    activeField === 'telefono' ? 'border-amber-600' : 'border-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* POR CONCEPTO DE */}
          <div className={`py-3 px-4 -mx-4 rounded-xl transition-all duration-200 ${activeField === 'concepto' ? 'bg-amber-50 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}>
            <div className="flex items-center gap-4">
              <label className="text-base font-bold text-black w-36 flex-shrink-0 uppercase">Por concepto de:</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
                onFocus={() => setActiveField('concepto')}
                onBlur={() => setActiveField(null)}
                placeholder="Descripción del depósito..."
                className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 ${
                  activeField === 'concepto' ? 'border-amber-600' : 'border-gray-400'
                }`}
              />
            </div>
          </div>

          {/* Separador visual */}
          <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

          {/* SECCIÓN DE KILOS - El campo más importante */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-300">
            <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              # KILOS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Peso Entrada */}
              <div className="text-center">
                <label className="block text-sm font-bold text-gray-700 mb-2">ENTRADA</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.pesoEntrada || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pesoEntrada: parseFloat(e.target.value) || 0 }))}
                    onFocus={() => setActiveField('pesoEntrada')}
                    onBlur={() => setActiveField(null)}
                    placeholder="0"
                    className={`w-full p-4 text-2xl font-bold text-center border-2 rounded-xl bg-white focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      activeField === 'pesoEntrada' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">kg</span>
                </div>
              </div>

              {/* Peso Salida */}
              <div className="text-center">
                <label className="block text-sm font-bold text-gray-700 mb-2">SALIDA</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.pesoSalida || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pesoSalida: parseFloat(e.target.value) || 0 }))}
                    onFocus={() => setActiveField('pesoSalida')}
                    onBlur={() => setActiveField(null)}
                    placeholder="0"
                    className={`w-full p-4 text-2xl font-bold text-center border-2 rounded-xl bg-white focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      activeField === 'pesoSalida' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">kg</span>
                </div>
              </div>

              {/* Total = Diferencia */}
              <div className="text-center">
                <label className="block text-sm font-bold text-amber-700 mb-2">= TOTAL</label>
                <div className={`p-4 text-3xl font-bold text-center rounded-xl transition-all ${
                  formData.totalKilos > 0 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {formData.totalKilos > 0 ? formData.totalKilos.toLocaleString() : '0'}
                  <span className="text-lg ml-1">kg</span>
                </div>
              </div>
            </div>

            {/* Botones rápidos para peso */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-gray-600 mr-2">Rápido:</span>
              {[500, 1000, 1500, 2000, 2500, 3000].map(peso => (
                <button
                  key={peso}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pesoEntrada: peso }))}
                  className="px-3 py-1 text-sm bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 font-medium transition-colors"
                >
                  {peso >= 1000 ? `${peso/1000}T` : `${peso}kg`}
                </button>
              ))}
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div className={`py-3 px-4 -mx-4 rounded-xl transition-all duration-200 ${activeField === 'observaciones' ? 'bg-amber-50 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}>
            <label className="block text-base font-bold text-black mb-2 uppercase">Observaciones:</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              onFocus={() => setActiveField('observaciones')}
              onBlur={() => setActiveField(null)}
              rows={2}
              placeholder="Notas adicionales..."
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-black text-base resize-none transition-all duration-200 ${
                activeField === 'observaciones' ? 'border-amber-600 bg-white' : 'border-gray-300 bg-gray-50'
              }`}
            />
          </div>

          {/* Separador */}
          <div className="border-t-2 border-gray-300 my-4"></div>

          {/* RECIBÍ - Firma */}
          <div className={`py-3 px-4 -mx-4 rounded-xl transition-all duration-200 ${activeField === 'nombreRecibe' ? 'bg-amber-50 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}>
            <div className="flex items-center gap-4">
              <label className="text-base font-bold text-black w-24 flex-shrink-0 uppercase">Recibí:</label>
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.nombreRecibe}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombreRecibe: e.target.value }))}
                  onFocus={() => setActiveField('nombreRecibe')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Nombre y firma de quien recibe..."
                  className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium transition-all duration-200 ${
                    activeField === 'nombreRecibe' ? 'border-amber-600' : 'border-gray-400'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1 text-center uppercase">Nombre y firma de la persona que recibe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con disclaimer y botón */}
        <div className="border-t-2 border-gray-800 bg-gray-50 px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 italic text-center md:text-left">
              POR UNA CIUDAD MÁS LIMPIA Y DIGNA PARA TODOS<br/>
              <span className="font-bold">NO ES COMPROBANTE FISCAL</span>
            </p>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || !isFormValid}
              className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all shadow-lg ${
                isFormValid && !isSaving
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
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
      </div>
    </div>
  );
}
