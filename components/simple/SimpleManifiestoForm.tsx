'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Droplet, Filter, Fuel, Ship, Trash2, Wind, X } from 'lucide-react';
import { hoyLocal } from '@/lib/utils/fechas';
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
  responsableLiquidosId: number | null;
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
  const [showLiquidosList, setShowLiquidosList] = useState(false);
  const firmaRef = useRef<SignaturePadRef>(null);
  
  // Refs para los inputs de residuos (para navegación con Enter)
  const aceiteRef = useRef<HTMLInputElement>(null);
  const filtrosAceiteRef = useRef<HTMLInputElement>(null);
  const filtrosDieselRef = useRef<HTMLInputElement>(null);
  const filtrosAireRef = useRef<HTMLInputElement>(null);
  const basuraRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fecha: '', // se llena al montar con la fecha local (ver efecto abajo)
    buqueId: null,
    responsableCocineroId: null,
    responsableMotoristaid: null,
    responsableLiquidosId: null,
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

  // Fecha de hoy en hora local; calcularla en el estado inicial daría valores
  // distintos en el servidor (UTC) y en el navegador y rompería la hidratación.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la fecha local sólo existe en el navegador
    setFormData((f) => (f.fecha ? f : { ...f, fecha: hoyLocal() }));
  }, []);

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
  const selectedLiquidos = personas.find(p => p.id === formData.responsableLiquidosId);

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
          responsable_liquidos_id: formData.responsableLiquidosId,
          observaciones: formData.observaciones || null,
          imagen_manifiesto_url: null,
          pdf_manifiesto_url: null,
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
      <div className="fixed inset-0 bg-[rgba(11,34,54,0.55)] flex items-center justify-center z-50 p-4">
        <div className="simar-aparece bg-simar-superficie rounded-[28px] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
          <div className="p-5 border-b flex justify-between items-center bg-simar-papel rounded-t-2xl border-simar-borde">
            <h3 className="text-2xl font-extrabold text-simar-texto">{title}</h3>
            <button onClick={() => { onClose(); setSearch(''); }} aria-label="Cerrar" className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-superficie text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors"><X className="w-6 h-6" /></button>
          </div>
          <div className="p-4 border-b border-simar-borde">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {items.length === 0 ? (
              <p className="text-center text-simar-texto-2 py-8">No se encontraron resultados</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item.id); onClose(); setSearch(''); }}
                  className="w-full p-4 text-left hover:bg-simar-marea-suave rounded-xl flex items-center gap-4 mb-2 border-2 border-transparent hover:border-simar-marea-tinta/30 transition-all"
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
      <div className="fixed inset-0 bg-[rgba(11,34,54,0.55)] flex items-center justify-center z-50 p-4">
        <div className="simar-aparece bg-simar-superficie rounded-[28px] p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-simar-arrecife-suave rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-simar-arrecife-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-extrabold text-simar-texto">¡Guardado!</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="h-full grid grid-cols-12 gap-4">

        {/* COLUMNA 1: Info + Observaciones (5 cols) */}
        <div className="col-span-5 flex flex-col gap-2">
          <div className="bg-simar-superficie rounded-xl p-3 shadow-simar border border-simar-borde">
            <h3 className="font-bold text-simar-texto text-lg flex items-center gap-2 pb-1 border-b mb-2 border-simar-borde">
              <span className="w-7 h-7 bg-simar-texto-2 text-white rounded-full flex items-center justify-center text-base font-bold">1</span>
              Información
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[17px] font-bold text-simar-texto mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[17px] font-bold text-simar-texto mb-2">Embarcación</label>
                <button
                  onClick={() => setShowBuqueList(true)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                    selectedBuque ? 'bg-simar-papel border-simar-campo-borde' : 'bg-simar-superficie border-simar-campo-borde'
                  }`}
                >
                  <span className={`truncate text-lg ${selectedBuque ? 'font-bold text-simar-texto' : 'text-simar-texto-2'}`}>
                    {selectedBuque?.nombre_buque || 'Seleccionar...'}
                  </span>
                  <span className="text-simar-texto-2 text-2xl">›</span>
                </button>
              </div>
              <div>
                <label className="block text-[17px] font-bold text-simar-texto mb-2">Cocinero</label>
                <button
                  onClick={() => setShowCocineroList(true)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                    selectedCocinero ? 'bg-simar-papel border-simar-campo-borde' : 'bg-simar-superficie border-simar-campo-borde'
                  }`}
                >
                  <span className={`truncate text-lg ${selectedCocinero ? 'font-bold text-simar-texto' : 'text-simar-texto-2'}`}>
                    {selectedCocinero?.nombre || 'Seleccionar...'}
                  </span>
                  <span className="text-simar-texto-2 text-2xl">›</span>
                </button>
              </div>
              <div>
                <label className="block text-[17px] font-bold text-simar-texto mb-2">Motorista</label>
                <button
                  onClick={() => setShowMotoristaList(true)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                    selectedMotorista ? 'bg-simar-papel border-simar-campo-borde' : 'bg-simar-superficie border-simar-campo-borde'
                  }`}
                >
                  <span className={`truncate text-lg ${selectedMotorista ? 'font-bold text-simar-texto' : 'text-simar-texto-2'}`}>
                    {selectedMotorista?.nombre || 'Seleccionar...'}
                  </span>
                  <span className="text-simar-texto-2 text-2xl">›</span>
                </button>
              </div>
              <div>
                <label className="block text-[17px] font-bold text-simar-texto mb-2">Resp. de líquidos</label>
                <button
                  onClick={() => setShowLiquidosList(true)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                    selectedLiquidos ? 'bg-simar-papel border-simar-campo-borde' : 'bg-simar-superficie border-simar-campo-borde'
                  }`}
                >
                  <span className={`truncate text-lg ${selectedLiquidos ? 'font-bold text-simar-texto' : 'text-simar-texto-2'}`}>
                    {selectedLiquidos?.nombre || 'Seleccionar...'}
                  </span>
                  <span className="text-simar-texto-2 text-2xl">›</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Observaciones */}
          <div className="bg-simar-superficie rounded-xl p-3 shadow-simar border flex-1 min-h-0 border-simar-borde">
            <label className="block text-[17px] font-bold text-simar-texto mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Notas adicionales..."
              className="w-full h-[calc(100%-2rem)] resize-none px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
            />
          </div>
        </div>

        {/* COLUMNA 2: Residuos en grid vertical (3 cols - centro) */}
        <div className="col-span-3 bg-simar-superficie rounded-xl p-3 shadow-simar border flex flex-col border-simar-borde" style={{minWidth: 0}}>
          <h3 className="font-bold text-simar-texto text-lg flex items-center gap-2 pb-1 border-b mb-2 border-simar-borde">
            <span className="w-7 h-7 bg-simar-texto-2 text-white rounded-full flex items-center justify-center text-base font-bold">2</span>
            Residuos
          </h3>
          <div className="flex-1 flex flex-col gap-1 min-h-0">
            <div className="flex-1 bg-simar-coral-suave/50 rounded-xl p-2 border border-simar-coral/30 flex items-center gap-3">
              <Droplet className="w-6 h-6 text-simar-marea-tinta" />
              <div className="flex-1">
                <label className="block text-[17px] font-bold text-simar-coral">Aceite (L)</label>
              </div>
              <input
                ref={aceiteRef}
                type="number"
                min="0"
                value={formData.aceiteUsado || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, aceiteUsado: parseFloat(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, filtrosAceiteRef)}
                className="w-24 text-2xl font-extrabold text-center px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
              />
            </div>
            <div className="flex-1 bg-simar-marea-suave/50 rounded-xl p-2 border border-simar-marea-tinta/30 flex items-center gap-3">
              <Filter className="w-6 h-6 text-simar-marea-tinta" />
              <div className="flex-1">
                <label className="block text-[17px] font-bold text-simar-marea-tinta">Filtros Aceite</label>
              </div>
              <input
                ref={filtrosAceiteRef}
                type="number"
                min="0"
                value={formData.filtrosAceite || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filtrosAceite: parseInt(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, filtrosDieselRef)}
                className="w-24 text-2xl font-extrabold text-center px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
              />
            </div>
            <div className="flex-1 bg-simar-coral-suave/50 rounded-xl p-2 border border-simar-coral/30 flex items-center gap-3">
              <Fuel className="w-6 h-6 text-simar-marea-tinta" />
              <div className="flex-1">
                <label className="block text-[17px] font-bold text-simar-coral">Filtros Diesel</label>
              </div>
              <input
                ref={filtrosDieselRef}
                type="number"
                min="0"
                value={formData.filtrosDiesel || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filtrosDiesel: parseInt(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, filtrosAireRef)}
                className="w-24 text-2xl font-extrabold text-center px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
              />
            </div>
            <div className="flex-1 bg-simar-marea-suave/50 rounded-xl p-2 border border-simar-marea-tinta/30 flex items-center gap-3">
              <Wind className="w-6 h-6 text-simar-marea-tinta" />
              <div className="flex-1">
                <label className="block text-[17px] font-bold text-simar-marea-tinta">Filtros Aire</label>
              </div>
              <input
                ref={filtrosAireRef}
                type="number"
                min="0"
                value={formData.filtrosAire || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filtrosAire: parseInt(e.target.value) || 0 }))}
                onKeyDown={(e) => handleKeyDown(e, basuraRef)}
                className="w-24 text-2xl font-extrabold text-center px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
              />
            </div>
            <div className="flex-1 bg-simar-papel/50 rounded-xl p-2 border border-simar-borde flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-simar-marea-tinta" />
              <div className="flex-1">
                <label className="block text-[17px] font-bold text-simar-texto">Basura (kg)</label>
              </div>
              <input
                ref={basuraRef}
                type="number"
                min="0"
                value={formData.basura || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, basura: parseFloat(e.target.value) || 0 }))}
                className="w-24 text-2xl font-extrabold text-center px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* COLUMNA 3: Firma + Botones (4 cols) */}
        <div className="col-span-4 flex flex-col gap-2">
          {/* Firma */}
          <div className="flex-1 bg-simar-superficie rounded-xl p-3 shadow-simar border flex flex-col min-h-0 border-simar-borde">
            <h3 className="font-bold text-simar-texto text-lg flex items-center gap-2 pb-1 border-b mb-2 border-simar-borde">
              <span className="w-7 h-7 bg-simar-texto-2 text-white rounded-full flex items-center justify-center text-base font-bold">3</span>
              Firma del responsable
            </h3>
            <div className="flex-1 border border-simar-campo-borde rounded-xl overflow-hidden bg-simar-papel min-h-0">
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
              className="px-10 py-4 rounded-xl font-extrabold text-xl text-simar-texto-2 bg-simar-borde-suave hover:bg-simar-campo-borde transition-all min-h-[52px]"
            >
              ← Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.buqueId || !formData.responsableCocineroId || !formData.responsableMotoristaid}
              className={`flex-1 py-4 rounded-xl font-bold text-2xl flex items-center justify-center gap-2 transition-all ${
                formData.buqueId && formData.responsableCocineroId && formData.responsableMotoristaid
                  ? 'bg-simar-abismo text-white hover:bg-simar-abismo shadow-simar'
                  : 'bg-simar-campo-borde text-simar-texto-2 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <><Check className="w-6 h-6" strokeWidth={2.6} /> Guardar manifiesto</>
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
              <div className="w-12 h-12 bg-simar-marea-suave text-simar-marea-tinta rounded-full flex items-center justify-center"><Ship className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-lg text-simar-texto">{b.nombre_buque}</p>
                <p className="text-base text-simar-texto-2">{b.matricula || 'Sin matrícula'}</p>
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
              <div className="w-12 h-12 bg-simar-papel rounded-full flex items-center justify-center font-extrabold text-xl text-simar-texto-2">
                {p.nombre.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg text-simar-texto">{p.nombre}</p>
                <p className="text-base text-simar-texto-2">{p.tipo_persona?.nombre_tipo || ''}</p>
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
              <div className="w-12 h-12 bg-simar-papel rounded-full flex items-center justify-center font-extrabold text-xl text-simar-texto-2">
                {p.nombre.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg text-simar-texto">{p.nombre}</p>
                <p className="text-base text-simar-texto-2">{p.tipo_persona?.nombre_tipo || ''}</p>
              </div>
            </>
          )}
        />
      )}

      {showLiquidosList && (
        <SelectModal<PersonaConTipo>
          title="Seleccionar Resp. de Líquidos"
          items={filteredPersonas}
          onSelect={(id) => setFormData(prev => ({ ...prev, responsableLiquidosId: id }))}
          onClose={() => setShowLiquidosList(false)}
          renderItem={(p) => (
            <>
              <div className="w-12 h-12 bg-simar-papel rounded-full flex items-center justify-center font-extrabold text-xl text-simar-texto-2">
                {p.nombre.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg text-simar-texto">{p.nombre}</p>
                <p className="text-base text-simar-texto-2">{p.tipo_persona?.nombre_tipo || ''}</p>
              </div>
            </>
          )}
        />
      )}
    </div>
  );
}
