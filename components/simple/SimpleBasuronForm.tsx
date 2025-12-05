'use client';

import React, { useState, useEffect } from 'react';
import { getBuques } from '@/lib/services/buques';
import { createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';
import { Buque } from '@/types/database';

interface FormData {
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  buqueId: number | null;
  pesoEntrada: number;
  pesoSalida: number;
  nombreUsuario: string;
  observaciones: string;
}

interface SimpleBasuronFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function SimpleBasuronForm({ onBack, onSuccess }: SimpleBasuronFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchBuque, setSearchBuque] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split('T')[0],
    horaEntrada: new Date().toTimeString().slice(0, 5),
    horaSalida: '',
    buqueId: null,
    pesoEntrada: 0,
    pesoSalida: 0,
    nombreUsuario: '',
    observaciones: ''
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

  const selectedBuque = buques.find(b => b.id === formData.buqueId);
  const filteredBuques = buques.filter(b => 
    b.nombre_buque.toLowerCase().includes(searchBuque.toLowerCase())
  );
  
  const totalDepositado = formData.pesoEntrada > formData.pesoSalida 
    ? formData.pesoEntrada - formData.pesoSalida 
    : 0;

  const isFormValid = formData.buqueId && formData.pesoEntrada > 0;

  const handleSubmit = async () => {
    if (!isFormValid) {
      alert('❌ Selecciona una embarcación y registra el peso de entrada');
      return;
    }

    setIsSaving(true);
    try {
      // Formatear horas
      const horaEntradaSql = formData.horaEntrada.length === 5 
        ? `${formData.horaEntrada}:00` 
        : formData.horaEntrada;
      const horaSalidaSql = formData.horaSalida 
        ? (formData.horaSalida.length === 5 ? `${formData.horaSalida}:00` : formData.horaSalida)
        : null;

      await createManifiestoBasuron({
        fecha: formData.fecha,
        hora_entrada: horaEntradaSql,
        hora_salida: horaSalidaSql,
        buque_id: formData.buqueId!,
        peso_entrada: formData.pesoEntrada,
        peso_salida: formData.pesoSalida || null,
        nombre_usuario: formData.nombreUsuario || null,
        observaciones: formData.observaciones || null,
        estado: 'En Proceso',
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

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">¡Registrado!</h3>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-green-600">{totalDepositado.toLocaleString()} kg</span> depositados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 py-3 flex items-center gap-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <span className="font-bold text-lg">Registro de Basurón</span>
      </div>

      {/* Contenido en grid */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Columna 1: Embarcación (4 cols) */}
          <div className="col-span-4 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 pb-2 border-b">
              <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Embarcación
            </h3>

            {/* Buscador */}
            <input
              type="text"
              placeholder="🔍 Buscar embarcación..."
              value={searchBuque}
              onChange={(e) => setSearchBuque(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
            
            {/* Lista de buques */}
            <div className="h-40 overflow-y-auto border rounded-lg">
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Cargando...</div>
              ) : filteredBuques.slice(0, 10).map((buque) => (
                <button
                  key={buque.id}
                  onClick={() => setFormData(prev => ({ ...prev, buqueId: buque.id }))}
                  className={`w-full text-left p-3 border-b last:border-b-0 transition-all ${
                    formData.buqueId === buque.id
                      ? 'bg-emerald-100 border-l-4 border-l-emerald-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold truncate">{buque.nombre_buque}</div>
                  <div className="text-xs text-gray-500">{buque.matricula || 'Sin matrícula'}</div>
                </button>
              ))}
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Hora entrada</label>
                <input
                  type="time"
                  value={formData.horaEntrada}
                  onChange={(e) => setFormData(prev => ({ ...prev, horaEntrada: e.target.value }))}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Columna 2: Pesaje (4 cols) */}
          <div className="col-span-4 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 pb-2 border-b">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Pesaje
            </h3>

            {/* Peso Entrada */}
            <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
              <label className="block text-sm font-bold text-amber-700 mb-2">⚖️ Peso ENTRADA (kg)</label>
              <input
                type="number"
                min="0"
                value={formData.pesoEntrada || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pesoEntrada: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full p-3 text-2xl font-bold text-center border-2 border-amber-300 rounded-lg bg-white focus:border-amber-500 focus:outline-none"
              />
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2000].map(p => (
                  <button
                    key={p}
                    onClick={() => setFormData(prev => ({ ...prev, pesoEntrada: p }))}
                    className="flex-1 py-1 text-sm bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 font-medium"
                  >
                    {p >= 1000 ? `${p/1000}T` : `${p}kg`}
                  </button>
                ))}
              </div>
            </div>

            {/* Peso Salida */}
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <label className="block text-sm font-bold text-blue-700 mb-2">⚖️ Peso SALIDA (kg)</label>
              <input
                type="number"
                min="0"
                value={formData.pesoSalida || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pesoSalida: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full p-3 text-2xl font-bold text-center border-2 border-blue-300 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-2">
                <label className="block text-xs text-blue-600 mb-1">Hora salida</label>
                <input
                  type="time"
                  value={formData.horaSalida}
                  onChange={(e) => setFormData(prev => ({ ...prev, horaSalida: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded-lg"
                />
              </div>
            </div>

            {/* Total */}
            <div className={`rounded-xl p-4 text-center ${
              totalDepositado > 0 ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-100 border-2 border-gray-200'
            }`}>
              <span className={`text-sm font-medium ${totalDepositado > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                TOTAL DEPOSITADO
              </span>
              <div className={`text-3xl font-bold ${totalDepositado > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {totalDepositado > 0 ? `${totalDepositado.toLocaleString()} kg` : '---'}
              </div>
            </div>
          </div>

          {/* Columna 3: Confirmar (4 cols) */}
          <div className="col-span-4 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 pb-2 border-b">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Confirmar
            </h3>

            {/* Resumen */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-gray-500 mb-1">Embarcación seleccionada:</p>
              <p className="font-bold text-gray-800 truncate">
                {selectedBuque?.nombre_buque || '(No seleccionada)'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-200">
                <p className="text-xs text-amber-600">Entrada</p>
                <p className="font-bold text-amber-700">{formData.pesoEntrada.toLocaleString()} kg</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
                <p className="text-xs text-blue-600">Salida</p>
                <p className="font-bold text-blue-700">{formData.pesoSalida.toLocaleString()} kg</p>
              </div>
            </div>

            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Registrado por</label>
              <input
                type="text"
                value={formData.nombreUsuario}
                onChange={(e) => setFormData(prev => ({ ...prev, nombreUsuario: e.target.value }))}
                placeholder="Nombre..."
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Notas..."
                rows={2}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg resize-none focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Botón Guardar */}
            <button
              onClick={handleSubmit}
              disabled={isSaving || !isFormValid}
              className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                isFormValid && !isSaving
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>✓ GUARDAR</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
