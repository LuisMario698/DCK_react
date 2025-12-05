'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';
import { createManifiesto, getManifiestos, deleteManifiesto, generarNumeroManifiesto } from '@/lib/services/manifiestos';
import { generarPDFManifiesto, generarNombreArchivoPDF, FirmasManifiesto } from '@/lib/utils/pdfGenerator';
import { ManifiestoConRelaciones, Buque, PersonaConTipo } from '@/types/database';

// Registrar locale español
registerLocale('es', es);

export default function ManifiestosPage() {
  const t = useTranslations('Manifiestos');
  const tm = useTranslations('Manifiestos.mensajes');
  const [manifiestos, setManifiestos] = useState<ManifiestoConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [activeField, setActiveField] = useState<string | null>(null);
  const [showMotoristaSignature, setShowMotoristaSignature] = useState(false);
  const [showCocineroSignature, setShowCocineroSignature] = useState(false);
  const [showOficialSignature, setShowOficialSignature] = useState(false);
  const [motoristaSignature, setMotoristaSignature] = useState<string | null>(null);
  const [cocineroSignature, setCocineroSignature] = useState<string | null>(null);
  const [oficialSignature, setOficialSignature] = useState<string | null>(null);
  const [activeSignature, setActiveSignature] = useState<'motorista' | 'cocinero' | 'oficial' | null>(null);
  
  // Estados para autocompletado de nombres
  const [motoristaNombre, setMotoristaNombre] = useState('');
  const [cocineroNombre, setCocineroNombre] = useState('');
  const [showMotoristaSuggestions, setShowMotoristaSuggestions] = useState(false);
  const [showCocineroSuggestions, setShowCocineroSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const buqueSelectRef = useRef<HTMLSelectElement | null>(null);
  
  // Referencias para navegación con Enter
  const fechaRef = useRef<HTMLInputElement>(null);
  const aceiteRef = useRef<HTMLInputElement>(null);
  const filtrosAceiteRef = useRef<HTMLInputElement>(null);
  const filtrosDieselRef = useRef<HTMLInputElement>(null);
  const filtrosAireRef = useRef<HTMLInputElement>(null);
  const basuraRef = useRef<HTMLInputElement>(null);
  const motoristaRef = useRef<HTMLInputElement>(null);
  const cocineroRef = useRef<HTMLInputElement>(null);
  const motoristaCanvasRef = useRef<HTMLCanvasElement>(null);
  const cocineroCanvasRef = useRef<HTMLCanvasElement>(null);
  const oficialCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Lista de referencias en orden para navegación
  const fieldRefs = [
    { ref: fechaRef, name: 'fecha' },
    { ref: buqueSelectRef, name: 'buque' },
    { ref: aceiteRef, name: 'aceite' },
    { ref: filtrosAceiteRef, name: 'filtrosAceite' },
    { ref: filtrosDieselRef, name: 'filtrosDiesel' },
    { ref: filtrosAireRef, name: 'filtrosAire' },
    { ref: basuraRef, name: 'basura' },
    { ref: motoristaRef, name: 'motorista' },
    { ref: cocineroRef, name: 'cocinero' },
  ];

  // Funciones para el canvas de firma
  const getCanvasRef = () => {
    if (activeSignature === 'motorista') return motoristaCanvasRef;
    if (activeSignature === 'cocinero') return cocineroCanvasRef;
    return null;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'motorista' | 'cocinero' | 'oficial') => {
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : oficialCanvasRef;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setActiveSignature(type);
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'motorista' | 'cocinero' | 'oficial') => {
    if (!isDrawing || activeSignature !== type) return;
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : oficialCanvasRef;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (type: 'motorista' | 'cocinero' | 'oficial') => {
    if (activeSignature !== type) return;
    setIsDrawing(false);
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : oficialCanvasRef;
    const canvas = canvasRef.current;
    if (canvas) {
      const data = canvas.toDataURL();
      if (type === 'motorista') {
        setMotoristaSignature(data);
      } else if (type === 'cocinero') {
        setCocineroSignature(data);
      } else {
        setOficialSignature(data);
      }
    }
    setActiveSignature(null);
  };

  const clearSignature = (type: 'motorista' | 'cocinero' | 'oficial') => {
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : oficialCanvasRef;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (type === 'motorista') {
      setMotoristaSignature(null);
    } else if (type === 'cocinero') {
      setCocineroSignature(null);
    } else {
      setOficialSignature(null);
    }
  };

  // Función para manejar navegación con teclado (Enter y flechas)
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < fieldRefs.length) {
        fieldRefs[nextIndex].ref.current?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        fieldRefs[prevIndex].ref.current?.focus();
      }
    }
  };

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

      // El archivo ahora es opcional
      // if (!archivo) {
      //   alert('❌ Debes digitalizar el manifiesto antes de guardarlo. El archivo es obligatorio.');
      //   return;
      // }

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
      setMotoristaNombre('');
      setCocineroNombre('');
      setMotoristaSignature(null);
      setCocineroSignature(null);
      setOficialSignature(null);
      
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
      
      // Preparar firmas para el PDF
      const firmasPDF: FirmasManifiesto = {
        motoristaFirma: motoristaSignature,
        motoristaNombre: motoristaNombre || personas.find(p => p.id === manifiesto.responsable_principal_id)?.nombre,
        cocineroFirma: cocineroSignature,
        cocineroNombre: cocineroNombre || (manifiesto.responsable_secundario_id 
          ? personas.find(p => p.id === manifiesto.responsable_secundario_id)?.nombre 
          : undefined),
        oficialFirma: oficialSignature
      };
      
      // Generar el PDF con firmas
      const pdfBlob = await generarPDFManifiesto(manifiesto, firmasPDF);
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
    <div className="space-y-4">
      {/* Formulario estilo documento físico - Dos columnas */}
      <div className="bg-white border-2 border-gray-800 rounded-lg overflow-hidden max-w-6xl mx-auto">
        {/* Encabezado del documento */}
        <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-800">
          <p className="text-base font-medium text-black">Puerto Peñasco, Sonora a {new Date(formData.fecha_emision).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Contenido del formulario - Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-300">
          {/* COLUMNA IZQUIERDA - Datos del formulario */}
          <div className="p-6 space-y-4">
            <h3 className="text-base font-bold text-black uppercase tracking-wide mb-4">Datos del Manifiesto</h3>
            
            {/* FECHA */}
            <div 
              className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'fecha' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}
            >
              <label className="text-base font-bold text-black w-36 flex-shrink-0">FECHA:</label>
              <div className="flex-1 flex items-center gap-2">
                <DatePicker
                  selected={formData.fecha_emision ? new Date(formData.fecha_emision + 'T00:00:00') : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setFormData({ ...formData, fecha_emision: `${year}-${month}-${day}` });
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
                  calendarClassName="custom-datepicker"
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

            {/* NOMBRE DEL BARCO */}
            <div className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'buque' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
              <label className="text-base font-bold text-black w-36 flex-shrink-0">BARCO:</label>
              <select
                ref={buqueSelectRef}
                value={formData.buque_id}
                onChange={(e) => {
                  setFormData({ ...formData, buque_id: e.target.value });
                  setShowValidation(false);
                }}
                onFocus={() => setActiveField('buque')}
                onBlur={() => setActiveField(null)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                className={`flex-1 px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium cursor-pointer transition-all duration-200 ${
                  showValidation && !formData.buque_id ? 'border-red-500' : activeField === 'buque' ? 'border-blue-600' : 'border-gray-400'
                }`}
              >
                <option value="">Seleccionar...</option>
                {buques.map((buque) => (
                  <option key={buque.id} value={buque.id}>
                    {buque.nombre_buque}
                  </option>
                ))}
              </select>
            </div>

            {/* Línea divisoria */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* RESIDUOS - Grid compacto */}
            <div className="grid grid-cols-2 gap-3">
              {/* ACEITE USADO */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'aceite' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black block mb-1">ACEITE USADO</label>
                <div className="flex items-center gap-1">
                  <input
                    ref={aceiteRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={residuos.aceite_usado || ''}
                    onChange={(e) => setResiduos({ ...residuos, aceite_usado: parseFloat(e.target.value) || 0 })}
                    onFocus={() => setActiveField('aceite')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                    placeholder="0"
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      activeField === 'aceite' ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium text-black">gal</span>
                </div>
              </div>

              {/* FILTROS DE ACEITE */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'filtrosAceite' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black block mb-1">FILTROS ACEITE</label>
                <div className="flex items-center gap-1">
                  <input
                    ref={filtrosAceiteRef}
                    type="number"
                    min="0"
                    value={residuos.filtros_aceite || ''}
                    onChange={(e) => setResiduos({ ...residuos, filtros_aceite: parseInt(e.target.value) || 0 })}
                    onFocus={() => setActiveField('filtrosAceite')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 3)}
                    placeholder="0"
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      activeField === 'filtrosAceite' ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium text-black">uds</span>
                </div>
              </div>

              {/* FILTROS DE DIESEL */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'filtrosDiesel' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black block mb-1">FILTROS DIESEL</label>
                <div className="flex items-center gap-1">
                  <input
                    ref={filtrosDieselRef}
                    type="number"
                    min="0"
                    value={residuos.filtros_diesel || ''}
                    onChange={(e) => setResiduos({ ...residuos, filtros_diesel: parseInt(e.target.value) || 0 })}
                    onFocus={() => setActiveField('filtrosDiesel')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 4)}
                    placeholder="0"
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      activeField === 'filtrosDiesel' ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium text-black">uds</span>
                </div>
              </div>

              {/* FILTROS DE AIRE */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'filtrosAire' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black block mb-1">FILTROS AIRE</label>
                <div className="flex items-center gap-1">
                  <input
                    ref={filtrosAireRef}
                    type="number"
                    min="0"
                    value={residuos.filtros_aire || ''}
                    onChange={(e) => setResiduos({ ...residuos, filtros_aire: parseInt(e.target.value) || 0 })}
                    onFocus={() => setActiveField('filtrosAire')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 5)}
                    placeholder="0"
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      activeField === 'filtrosAire' ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium text-black">uds</span>
                </div>
              </div>

              {/* BASURA - Ocupa 2 columnas */}
              <div className={`col-span-2 py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'basura' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black block mb-1">BASURA</label>
                <div className="flex items-center gap-1">
                  <input
                    ref={basuraRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={residuos.basura || ''}
                    onChange={(e) => setResiduos({ ...residuos, basura: parseFloat(e.target.value) || 0 })}
                    onFocus={() => setActiveField('basura')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 6)}
                    placeholder="0"
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      activeField === 'basura' ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium text-black">kg</span>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className={`mt-4 transition-all duration-200 ${activeField === 'observaciones' ? 'bg-blue-100/60 border-l-4 border-l-blue-600 rounded-lg p-3 -mx-3' : 'border-l-4 border-l-transparent'}`}>
              <label className="block text-sm font-bold text-black mb-1">OBSERVACIONES (opcional)</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                onFocus={() => setActiveField('observaciones')}
                onBlur={() => setActiveField(null)}
                rows={2}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-black text-base"
              />
            </div>
          </div>

          {/* COLUMNA DERECHA - Firmas */}
          <div className="p-6 bg-gray-50/50 space-y-4">
            <h3 className="text-base font-bold text-black uppercase tracking-wide mb-4">Firmas</h3>
            
            {/* FIRMA OFICIAL COMISIONADO */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-base font-bold text-black">RECIBE: Oficial Comisionado</p>
              <p className="text-sm text-black mb-3">Recolección de Basura y Residuos Aceitosos (MARPOL ANEXO V)</p>
              
              {!showOficialSignature ? (
                <button
                  type="button"
                  onClick={() => setShowOficialSignature(true)}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Firmar
                </button>
              ) : (
                <div>
                  <div className="relative border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                    <canvas
                      ref={oficialCanvasRef}
                      width={300}
                      height={60}
                      className="w-full cursor-crosshair touch-none"
                      onMouseDown={(e) => startDrawing(e, 'oficial')}
                      onMouseMove={(e) => draw(e, 'oficial')}
                      onMouseUp={() => stopDrawing('oficial')}
                      onMouseLeave={() => stopDrawing('oficial')}
                      onTouchStart={(e) => startDrawing(e, 'oficial')}
                      onTouchMove={(e) => draw(e, 'oficial')}
                      onTouchEnd={() => stopDrawing('oficial')}
                    />
                    {!oficialSignature && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-300 text-xs">Firme aquí</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-2 mt-2">
                    <button type="button" onClick={() => clearSignature('oficial')} className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Borrar</button>
                    <button type="button" onClick={() => setShowOficialSignature(false)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Ocultar</button>
                  </div>
                </div>
              )}
              {oficialSignature && !showOficialSignature && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs text-green-600">Firmado</span>
                  <button type="button" onClick={() => setShowOficialSignature(true)} className="text-xs text-blue-600 hover:underline ml-2">Editar</button>
                </div>
              )}
            </div>

            {/* FIRMA MOTORISTA */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-base font-bold text-black mb-1">MOTORISTA</p>
              <p className="text-sm text-black mb-2">Responsable de entrega de líquidos</p>
              <input
                ref={motoristaRef}
                type="text"
                value={motoristaNombre}
                placeholder="Nombre"
                onChange={(e) => {
                  const value = e.target.value;
                  setMotoristaNombre(value);
                  setShowMotoristaSuggestions(value.length > 0);
                  setSelectedSuggestionIndex(-1);
                  const personaExacta = personas.find(p => p.nombre.toLowerCase() === value.toLowerCase());
                  if (personaExacta) {
                    setFormData({ ...formData, responsable_principal_id: personaExacta.id.toString() });
                  } else {
                    setFormData({ ...formData, responsable_principal_id: '' });
                  }
                  setShowValidation(false);
                }}
                onFocus={() => { setActiveField('motorista'); if (motoristaNombre.length > 0) setShowMotoristaSuggestions(true); }}
                onBlur={() => { setActiveField(null); setTimeout(() => setShowMotoristaSuggestions(false), 200); }}
                onKeyDown={(e) => {
                  const filteredPersonas = personas.filter(p => p.nombre.toLowerCase().includes(motoristaNombre.toLowerCase()));
                  if (e.key === 'ArrowDown' && showMotoristaSuggestions && filteredPersonas.length > 0) {
                    e.preventDefault();
                    setSelectedSuggestionIndex(prev => prev < filteredPersonas.length - 1 ? prev + 1 : prev);
                  } else if (e.key === 'ArrowUp' && showMotoristaSuggestions && selectedSuggestionIndex > 0) {
                    e.preventDefault();
                    setSelectedSuggestionIndex(prev => prev - 1);
                  } else if (e.key === 'Enter' && showMotoristaSuggestions && selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    const persona = filteredPersonas[selectedSuggestionIndex];
                    setMotoristaNombre(persona.nombre);
                    setFormData({ ...formData, responsable_principal_id: persona.id.toString() });
                    setShowMotoristaSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  } else if (e.key === 'Escape') {
                    setShowMotoristaSuggestions(false);
                  }
                }}
                className={`w-full px-3 py-2.5 border-b-2 bg-gray-50 rounded-t-lg focus:outline-none text-base font-semibold text-black placeholder:text-black ${
                  showValidation && !formData.responsable_principal_id ? 'border-red-500' : activeField === 'motorista' ? 'border-blue-600' : 'border-gray-300'
                }`}
              />
              {showMotoristaSuggestions && (
                <div className="bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-32 overflow-y-auto">
                  {personas.filter(p => p.nombre.toLowerCase().includes(motoristaNombre.toLowerCase())).map((persona, index) => (
                    <div key={persona.id} onClick={() => { setMotoristaNombre(persona.nombre); setFormData({ ...formData, responsable_principal_id: persona.id.toString() }); setShowMotoristaSuggestions(false); }}
                      className={`px-3 py-2 cursor-pointer text-base ${index === selectedSuggestionIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-black'}`}>
                      {persona.nombre}
                    </div>
                  ))}
                </div>
              )}
              {showValidation && !formData.responsable_principal_id && <p className="text-xs text-red-600 mt-1">* Requerido</p>}
              
              <div className="mt-3">
                {!showMotoristaSignature ? (
                  <button type="button" onClick={() => setShowMotoristaSignature(true)}
                    className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Firmar
                  </button>
                ) : (
                  <div>
                    <div className="relative border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                      <canvas ref={motoristaCanvasRef} width={300} height={60} className="w-full cursor-crosshair touch-none"
                        onMouseDown={(e) => startDrawing(e, 'motorista')} onMouseMove={(e) => draw(e, 'motorista')}
                        onMouseUp={() => stopDrawing('motorista')} onMouseLeave={() => stopDrawing('motorista')}
                        onTouchStart={(e) => startDrawing(e, 'motorista')} onTouchMove={(e) => draw(e, 'motorista')} onTouchEnd={() => stopDrawing('motorista')} />
                      {!motoristaSignature && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><p className="text-gray-300 text-xs">Firme aquí</p></div>}
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                      <button type="button" onClick={() => clearSignature('motorista')} className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Borrar</button>
                      <button type="button" onClick={() => setShowMotoristaSignature(false)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Ocultar</button>
                    </div>
                  </div>
                )}
                {motoristaSignature && !showMotoristaSignature && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs text-green-600">Firmado</span>
                    <button type="button" onClick={() => setShowMotoristaSignature(true)} className="text-xs text-blue-600 hover:underline ml-2">Editar</button>
                  </div>
                )}
              </div>
            </div>

            {/* FIRMA COCINERO */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-base font-bold text-black mb-1">COCINERO <span className="font-normal text-gray-600">(Opcional)</span></p>
              <input
                ref={cocineroRef}
                type="text"
                value={cocineroNombre}
                placeholder="Nombre"
                onChange={(e) => {
                  const value = e.target.value;
                  setCocineroNombre(value);
                  setShowCocineroSuggestions(value.length > 0);
                  setSelectedSuggestionIndex(-1);
                  const personaExacta = personas.find(p => p.nombre.toLowerCase() === value.toLowerCase());
                  if (personaExacta) {
                    setFormData({ ...formData, responsable_secundario_id: personaExacta.id.toString() });
                  } else {
                    setFormData({ ...formData, responsable_secundario_id: '' });
                  }
                }}
                onFocus={() => { setActiveField('cocinero'); if (cocineroNombre.length > 0) setShowCocineroSuggestions(true); }}
                onBlur={() => { setActiveField(null); setTimeout(() => setShowCocineroSuggestions(false), 200); }}
                onKeyDown={(e) => {
                  const filteredPersonas = personas.filter(p => p.id !== parseInt(formData.responsable_principal_id)).filter(p => p.nombre.toLowerCase().includes(cocineroNombre.toLowerCase()));
                  if (e.key === 'ArrowDown' && showCocineroSuggestions && filteredPersonas.length > 0) {
                    e.preventDefault();
                    setSelectedSuggestionIndex(prev => prev < filteredPersonas.length - 1 ? prev + 1 : prev);
                  } else if (e.key === 'ArrowUp' && showCocineroSuggestions && selectedSuggestionIndex > 0) {
                    e.preventDefault();
                    setSelectedSuggestionIndex(prev => prev - 1);
                  } else if (e.key === 'Enter' && showCocineroSuggestions && selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    const persona = filteredPersonas[selectedSuggestionIndex];
                    setCocineroNombre(persona.nombre);
                    setFormData({ ...formData, responsable_secundario_id: persona.id.toString() });
                    setShowCocineroSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  } else if (e.key === 'Escape') {
                    setShowCocineroSuggestions(false);
                  }
                }}
                className={`w-full px-3 py-2.5 border-b-2 bg-gray-50 rounded-t-lg focus:outline-none text-base font-semibold text-black placeholder:text-black ${
                  activeField === 'cocinero' ? 'border-blue-600' : 'border-gray-300'
                }`}
              />
              {showCocineroSuggestions && (
                <div className="bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-32 overflow-y-auto">
                  {personas.filter(p => p.id !== parseInt(formData.responsable_principal_id)).filter(p => p.nombre.toLowerCase().includes(cocineroNombre.toLowerCase())).map((persona, index) => (
                    <div key={persona.id} onClick={() => { setCocineroNombre(persona.nombre); setFormData({ ...formData, responsable_secundario_id: persona.id.toString() }); setShowCocineroSuggestions(false); }}
                      className={`px-3 py-2 cursor-pointer text-base ${index === selectedSuggestionIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-black'}`}>
                      {persona.nombre}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3">
                {!showCocineroSignature ? (
                  <button type="button" onClick={() => setShowCocineroSignature(true)}
                    className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Firmar
                  </button>
                ) : (
                  <div>
                    <div className="relative border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                      <canvas ref={cocineroCanvasRef} width={300} height={60} className="w-full cursor-crosshair touch-none"
                        onMouseDown={(e) => startDrawing(e, 'cocinero')} onMouseMove={(e) => draw(e, 'cocinero')}
                        onMouseUp={() => stopDrawing('cocinero')} onMouseLeave={() => stopDrawing('cocinero')}
                        onTouchStart={(e) => startDrawing(e, 'cocinero')} onTouchMove={(e) => draw(e, 'cocinero')} onTouchEnd={() => stopDrawing('cocinero')} />
                      {!cocineroSignature && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><p className="text-gray-300 text-xs">Firme aquí</p></div>}
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                      <button type="button" onClick={() => clearSignature('cocinero')} className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Borrar</button>
                      <button type="button" onClick={() => setShowCocineroSignature(false)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Ocultar</button>
                    </div>
                  </div>
                )}
                {cocineroSignature && !showCocineroSignature && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs text-green-600">Firmado</span>
                    <button type="button" onClick={() => setShowCocineroSignature(true)} className="text-xs text-blue-600 hover:underline ml-2">Editar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Digitalización y Botón Guardar */}
        <div className="border-t-2 border-gray-800 p-4 bg-gray-50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            {/* Adjuntar documento */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Adjuntar documento</h3>
                  <p className="text-xs text-gray-500">Opcional - documento escaneado</p>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg p-3 text-center transition-all ${
                  dragActive ? 'bg-blue-50 border-2 border-blue-500 border-dashed' : archivo ? 'bg-green-50 border-2 border-green-500' : 'bg-white border-2 border-gray-300 border-dashed'
                }`}
              >
                <input type="file" id="file-upload" onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
                
                {!archivo ? (
                  <label htmlFor="file-upload" className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Seleccionar
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm font-medium text-gray-900 truncate">{archivo.name}</span>
                    </div>
                    <button type="button" onClick={() => setArchivo(null)} className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200">Quitar</button>
                  </div>
                )}
              </div>
            </div>

            {/* Botón Guardar */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>GUARDAR MANIFIESTO</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Botón para ir a la lista */}
      <div className="flex justify-center">
        <button
          onClick={() => document.getElementById('registros-list')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
        >
          <span>Ver registros</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* Tabla de Manifiestos */}
      <div id="registros-list" className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
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
