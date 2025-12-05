'use client';

import React, { useState, useEffect, useRef } from 'react';
import SignaturePad, { SignaturePadRef } from '@/components/ui/SignaturePad';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';
import { createManifiesto } from '@/lib/services/manifiestos';
import { Buque, PersonaConTipo } from '@/types/database';

interface FormData {
  fecha: string;
  buqueId: number | null;
  responsableCocineroId: number | null;
  responsableMotoristaid: number | null;
  aceiteUsado: number;
  filtrosAceite: number;
  filtrosDiesel: number;
  filtrosAire: number;
  basura: number;
  observaciones: string;
  firmaResponsable: string;
}

interface SimpleManifiestoFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function SimpleManifiestoForm({ onBack, onSuccess }: SimpleManifiestoFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBuqueList, setShowBuqueList] = useState(false);
  const [showCocineroList, setShowCocineroList] = useState(false);
  const [showMotoristaList, setShowMotoristaList] = useState(false);
  const firmaRef = useRef<SignaturePadRef>(null);
  
  // Refs para los inputs de residuos (para navegación con Enter)
  const aceiteRef = useRef<HTMLInputElement>(null);
  const filtrosAceiteRef = useRef<HTMLInputElement>(null);
  const filtrosDieselRef = useRef<HTMLInputElement>(null);
  const filtrosAireRef = useRef<HTMLInputElement>(null);
  const basuraRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split('T')[0],
    buqueId: null,
    responsableCocineroId: null,
    responsableMotoristaid: null,
    aceiteUsado: 0,
    filtrosAceite: 0,
    filtrosDiesel: 0,
    filtrosAire: 0,
    basura: 0,
    observaciones: '',
    firmaResponsable: ''
  });
  
  const [buques, setBuques] = useState<Buque[]>([]);
  const [personas, setPersonas] = useState<PersonaConTipo[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [buquesData, personasData] = await Promise.all([getBuques(), getPersonas()]);
        setBuques(buquesData);
        setPersonas(personasData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    loadData();
  }, []);

  const selectedBuque = buques.find(b => b.id === formData.buqueId);
  const selectedCocinero = personas.find(p => p.id === formData.responsableCocineroId);
  const selectedMotorista = personas.find(p => p.id === formData.responsableMotoristaid);

  const filteredBuques = buques.filter(b => 
    b.nombre_buque.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPersonas = personas.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  // Navegación con Enter entre campos de residuos
  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
      nextRef.current?.select();
    }
  };

  const handleSubmit = async () => {
    if (!formData.buqueId) {
      alert('❌ Selecciona una embarcación');
      return;
    }
    if (!formData.responsableCocineroId) {
      alert('❌ Selecciona el cocinero responsable');
      return;
    }
    if (!formData.responsableMotoristaid) {
      alert('❌ Selecciona el motorista responsable');
      return;
    }

    setIsSaving(true);
    try {
      await createManifiesto(
        {
          fecha_emision: formData.fecha,
          buque_id: formData.buqueId,
          responsable_principal_id: formData.responsableCocineroId,
          responsable_secundario_id: formData.responsableMotoristaid,
          observaciones: formData.observaciones || null,
          imagen_manifiesto_url: null,
          estado_digitalizacion: 'pendiente'
        },
        {
          aceite_usado: formData.aceiteUsado,
          filtros_aceite: formData.filtrosAceite,
          filtros_diesel: formData.filtrosDiesel,
          filtros_aire: formData.filtrosAire,
          basura: formData.basura
        }
      );
      setShowSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  // Modal de selección con blur y texto visible
  function SelectModal<T extends {id: number}>({ 
    title, 
    items, 
    onSelect, 
    onClose,
    renderItem 
  }: { 
    title: string; 
    items: T[]; 
    onSelect: (id: number) => void; 
    onClose: () => void;
    renderItem: (item: T) => React.ReactNode;
  }) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
          <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
            <button onClick={() => { onClose(); setSearch(''); }} className="p-2 hover:bg-gray-200 rounded-lg text-2xl text-gray-600">✕</button>
          </div>
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="🔍 Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron resultados</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item.id); onClose(); setSearch(''); }}
                  className="w-full p-4 text-left hover:bg-blue-50 rounded-xl flex items-center gap-4 mb-2 border-2 border-transparent hover:border-blue-300 transition-all"
                >
                  {renderItem(item)}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">¡Guardado!</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="h-full grid grid-cols-12 gap-4">
        
        {/* COLUMNA 1: Info + Observaciones (4 cols) */}
        <div className="col-span-4 flex flex-col gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm border">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 pb-1 border-b mb-2">
              <span className="w-7 h-7 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Información
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-0.5">📅 Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-3 py-2 text-lg font-medium text-gray-800 border border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-0.5">🚢 Embarcación</label>
                <button
                  onClick={() => setShowBuqueList(true)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                    selectedBuque ? 'bg-slate-50 border-slate-400' : 'bg-white border-gray-300'
                  }`}
                >
                  <span className={`truncate text-lg ${selectedBuque ? 'font-bold text-slate-700' : 'text-gray-500'}`}>
                    {selectedBuque?.nombre_buque || 'Seleccionar...'}
                  </span>
                  <span className="text-slate-500 text-2xl">›</span>
                </button>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-0.5">👨‍🍳 Cocinero</label>
                <button
                  onClick={() => setShowCocineroList(true)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                    selectedCocinero ? 'bg-slate-50 border-slate-400' : 'bg-white border-gray-300'
                  }`}
                >
                  <span className={`truncate text-lg ${selectedCocinero ? 'font-bold text-slate-700' : 'text-gray-500'}`}>
                    {selectedCocinero?.nombre || 'Seleccionar...'}
                  </span>
                  <span className="text-slate-500 text-2xl">›</span>
                </button>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-0.5">🔧 Motorista</label>
                <button
                  onClick={() => setShowMotoristaList(true)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                    selectedMotorista ? 'bg-slate-50 border-slate-400' : 'bg-white border-gray-300'
                  }`}
                >
                  <span className={`truncate text-lg ${selectedMotorista ? 'font-bold text-slate-700' : 'text-gray-500'}`}>
                    {selectedMotorista?.nombre || 'Seleccionar...'}
                  </span>
                  <span className="text-slate-500 text-2xl">›</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Observaciones */}
          <div className="bg-white rounded-xl p-3 shadow-sm border flex-1 min-h-0">
            <label className="block text-base font-semibold text-gray-700 mb-1">📝 Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Notas adicionales..."
              className="w-full h-[calc(100%-2rem)] px-3 py-2 text-lg text-gray-800 border border-gray-300 rounded-lg resize-none focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* COLUMNA 2: Residuos en grid vertical (3 cols - centro) */}
        <div className="col-span-3 bg-white rounded-xl p-3 shadow-sm border flex flex-col">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 pb-1 border-b mb-2">
            <span className="w-7 h-7 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Residuos
          </h3>
          <div className="flex-1 flex flex-col gap-1 min-h-0">
            <div className="flex-1 bg-amber-50/50 rounded-xl p-2 border border-amber-200/50 flex items-center gap-3">
              <span className="text-2xl">🛢️</span>
              <div className="flex-1">
                <label className="block text-base font-bold text-amber-800/70">Aceite (L)</label>
              </div>
              <input
                ref={aceiteRef}
                type="number"
                min="0"
                value={formData.aceiteUsado || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, aceiteUsado: parseFloat(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, filtrosAceiteRef)}
                className="w-24 p-1.5 text-2xl font-bold text-center text-gray-800 border border-amber-300/50 rounded-lg bg-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 bg-blue-50/50 rounded-xl p-2 border border-blue-200/50 flex items-center gap-3">
              <span className="text-2xl">🔧</span>
              <div className="flex-1">
                <label className="block text-base font-bold text-blue-800/70">Filtros Aceite</label>
              </div>
              <input
                ref={filtrosAceiteRef}
                type="number"
                min="0"
                value={formData.filtrosAceite || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filtrosAceite: parseInt(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, filtrosDieselRef)}
                className="w-24 p-1.5 text-2xl font-bold text-center text-gray-800 border border-blue-300/50 rounded-lg bg-white focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 bg-orange-50/50 rounded-xl p-2 border border-orange-200/50 flex items-center gap-3">
              <span className="text-2xl">⛽</span>
              <div className="flex-1">
                <label className="block text-base font-bold text-orange-800/70">Filtros Diesel</label>
              </div>
              <input
                ref={filtrosDieselRef}
                type="number"
                min="0"
                value={formData.filtrosDiesel || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filtrosDiesel: parseInt(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, filtrosAireRef)}
                className="w-24 p-1.5 text-2xl font-bold text-center text-gray-800 border border-orange-300/50 rounded-lg bg-white focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 bg-cyan-50/50 rounded-xl p-2 border border-cyan-200/50 flex items-center gap-3">
              <span className="text-2xl">💨</span>
              <div className="flex-1">
                <label className="block text-base font-bold text-cyan-800/70">Filtros Aire</label>
              </div>
              <input
                ref={filtrosAireRef}
                type="number"
                min="0"
                value={formData.filtrosAire || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filtrosAire: parseInt(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, basuraRef)}
                className="w-24 p-1.5 text-2xl font-bold text-center text-gray-800 border border-cyan-300/50 rounded-lg bg-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 bg-gray-100/50 rounded-xl p-2 border border-gray-200 flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
              <div className="flex-1">
                <label className="block text-base font-bold text-gray-600">Basura (kg)</label>
              </div>
              <input
                ref={basuraRef}
                type="number"
                min="0"
                value={formData.basura || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, basura: parseFloat(e.target.value) || 0 }))}
                className="w-24 p-1.5 text-2xl font-bold text-center text-gray-800 border border-gray-300 rounded-lg bg-white focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* COLUMNA 3: Firma + Botones (5 cols) */}
        <div className="col-span-5 flex flex-col gap-2">
          {/* Firma */}
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border flex flex-col min-h-0">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 pb-1 border-b mb-2">
              <span className="w-7 h-7 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              ✍️ FIRMA DEL RESPONSABLE
            </h3>
            <div className="flex-1 border border-gray-300 rounded-xl overflow-hidden bg-gray-50 min-h-0">
              <SignaturePad 
                ref={firmaRef}
                label=""
                responsive={true}
                onSave={(sig) => setFormData(prev => ({ ...prev, firmaResponsable: sig }))}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-10 py-4 rounded-xl font-bold text-xl text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all"
            >
              ← Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.buqueId || !formData.responsableCocineroId || !formData.responsableMotoristaid}
              className={`flex-1 py-4 rounded-xl font-bold text-2xl flex items-center justify-center gap-2 transition-all ${
                formData.buqueId && formData.responsableCocineroId && formData.responsableMotoristaid
                  ? 'bg-slate-700 text-white hover:bg-slate-800 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>✓ GUARDAR MANIFIESTO</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modales de selección */}
      {showBuqueList && (
        <SelectModal<Buque>
          title="Seleccionar Embarcación"
          items={filteredBuques}
          onSelect={(id) => setFormData(prev => ({ ...prev, buqueId: id }))}
          onClose={() => setShowBuqueList(false)}
          renderItem={(b) => (
            <>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">🚢</div>
              <div>
                <p className="font-bold text-lg text-gray-800">{b.nombre_buque}</p>
                <p className="text-base text-gray-600">{b.matricula || 'Sin matrícula'}</p>
              </div>
            </>
          )}
        />
      )}

      {showCocineroList && (
        <SelectModal<PersonaConTipo>
          title="Seleccionar Cocinero"
          items={filteredPersonas}
          onSelect={(id) => setFormData(prev => ({ ...prev, responsableCocineroId: id }))}
          onClose={() => setShowCocineroList(false)}
          renderItem={(p) => (
            <>
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-xl text-slate-600">
                {p.nombre.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg text-gray-800">{p.nombre}</p>
                <p className="text-base text-gray-600">{p.tipo_persona?.nombre_tipo || ''}</p>
              </div>
            </>
          )}
        />
      )}

      {showMotoristaList && (
        <SelectModal<PersonaConTipo>
          title="Seleccionar Motorista"
          items={filteredPersonas}
          onSelect={(id) => setFormData(prev => ({ ...prev, responsableMotoristaid: id }))}
          onClose={() => setShowMotoristaList(false)}
          renderItem={(p) => (
            <>
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-xl text-slate-600">
                {p.nombre.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg text-gray-800">{p.nombre}</p>
                <p className="text-base text-gray-600">{p.tipo_persona?.nombre_tipo || ''}</p>
              </div>
            </>
          )}
        />
      )}
    </div>
  );
}
