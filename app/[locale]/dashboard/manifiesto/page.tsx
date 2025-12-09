'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { getBuques, createBuqueAutomatico } from '@/lib/services/buques';
import { getPersonas, createPersonaAutomatica, getOrCreateTipoPersona } from '@/lib/services/personas';
import { createManifiesto, getManifiestos, deleteManifiesto, generarNumeroManifiesto, updateManifiesto } from '@/lib/services/manifiestos';
import { generarPDFManifiesto, generarNombreArchivoPDF, FirmasManifiesto } from '@/lib/utils/pdfGenerator';
import { uploadManifiestoPDF } from '@/lib/services/storage';
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

  // Estado para el modal de firma flotante
  const [signatureModalType, setSignatureModalType] = useState<'motorista' | 'cocinero' | 'oficial' | null>(null);
  const signatureModalCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Estados para autocompletado de nombres
  const [motoristaNombre, setMotoristaNombre] = useState('');
  const [cocineroNombre, setCocineroNombre] = useState('');
  const [showMotoristaSuggestions, setShowMotoristaSuggestions] = useState(false);
  const [showCocineroSuggestions, setShowCocineroSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Estados para filtros y búsqueda de manifiestos
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'buque' | 'motorista' | 'cocinero' | 'fecha' | 'numero'>('todos');
  const [fechaFiltroInicio, setFechaFiltroInicio] = useState<Date | null>(null);
  const [fechaFiltroFin, setFechaFiltroFin] = useState<Date | null>(null);
  const [showFiltroFecha, setShowFiltroFecha] = useState(false);
  const [filtroSeleccionBuque, setFiltroSeleccionBuque] = useState<number | null>(null);
  const [filtroSeleccionMotorista, setFiltroSeleccionMotorista] = useState<number | null>(null);
  const [filtroSeleccionCocinero, setFiltroSeleccionCocinero] = useState<number | null>(null);

  // Estados para autocompletado de embarcaciones
  const [buqueNombre, setBuqueNombre] = useState('');
  const [showBuqueSuggestions, setShowBuqueSuggestions] = useState(false);
  const [selectedBuqueIndex, setSelectedBuqueIndex] = useState(-1);

  const buqueInputRef = useRef<HTMLInputElement | null>(null);

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
    { ref: buqueInputRef, name: 'buque' },
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

  // Funciones para el modal de firma flotante
  const openSignatureModal = (type: 'motorista' | 'cocinero' | 'oficial') => {
    setSignatureModalType(type);
    // Limpiar refs al abrir
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const closeSignatureModal = () => {
    setSignatureModalType(null);
    setActiveSignature(null);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startModalDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!signatureModalType) return;
    const canvas = signatureModalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();
    const point = getCanvasCoordinates(e, canvas);

    isDrawingRef.current = true;
    lastPointRef.current = point;

    // Configurar el contexto una sola vez
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a5f';
  };

  const drawModal = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !signatureModalType) return;
    const canvas = signatureModalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPointRef.current) return;

    e.preventDefault();
    const point = getCanvasCoordinates(e, canvas);

    // Dibujar línea directamente sin usar setState
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
  };

  const stopModalDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearModalSignature = () => {
    const canvas = signatureModalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveModalSignature = () => {
    if (!signatureModalType) return;
    const canvas = signatureModalCanvasRef.current;
    if (!canvas) return;

    const data = canvas.toDataURL();
    if (signatureModalType === 'motorista') {
      setMotoristaSignature(data);
    } else if (signatureModalType === 'cocinero') {
      setCocineroSignature(data);
    } else {
      setOficialSignature(data);
    }
    closeSignatureModal();
  };

  const getSignatureModalTitle = () => {
    switch (signatureModalType) {
      case 'oficial': return 'Firma del Oficial Comisionado';
      case 'motorista': return 'Firma del Motorista';
      case 'cocinero': return 'Firma del Cocinero';
      default: return 'Firma';
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

  // Lógica de filtrado de manifiestos con useMemo para mejor rendimiento
  const manifiestosFiltrados = useMemo(() => {
    return manifiestos.filter((manifiesto) => {
      // Obtener nombres para búsqueda
      const buqueNombreManifiesto = manifiesto.buque?.nombre_buque ||
        buques.find(b => b.id === manifiesto.buque_id)?.nombre_buque || '';

      const motoristaNombreManifiesto = manifiesto.responsable_principal?.nombre ||
        personas.find(p => p.id === manifiesto.responsable_principal_id)?.nombre || '';

      const cocineroNombreManifiesto = manifiesto.responsable_secundario?.nombre ||
        (manifiesto.responsable_secundario_id ?
          personas.find(p => p.id === manifiesto.responsable_secundario_id)?.nombre : '') || '';

      // Filtro por selección específica
      if (filtroActivo === 'buque' && filtroSeleccionBuque !== null) {
        if (manifiesto.buque_id !== filtroSeleccionBuque) return false;
      }

      if (filtroActivo === 'motorista' && filtroSeleccionMotorista !== null) {
        if (manifiesto.responsable_principal_id !== filtroSeleccionMotorista) return false;
      }

      if (filtroActivo === 'cocinero' && filtroSeleccionCocinero !== null) {
        if (manifiesto.responsable_secundario_id !== filtroSeleccionCocinero) return false;
      }

      // Búsqueda general
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          manifiesto.numero_manifiesto?.toLowerCase().includes(query) ||
          buqueNombreManifiesto.toLowerCase().includes(query) ||
          motoristaNombreManifiesto.toLowerCase().includes(query) ||
          cocineroNombreManifiesto.toLowerCase().includes(query);

        // Si hay filtro activo específico, combinar con búsqueda
        if (filtroActivo !== 'todos') {
          switch (filtroActivo) {
            case 'buque':
              if (!buqueNombreManifiesto.toLowerCase().includes(query)) return false;
              break;
            case 'motorista':
              if (!motoristaNombreManifiesto.toLowerCase().includes(query)) return false;
              break;
            case 'cocinero':
              if (!cocineroNombreManifiesto.toLowerCase().includes(query)) return false;
              break;
            case 'numero':
              if (!manifiesto.numero_manifiesto?.toLowerCase().includes(query)) return false;
              break;
            case 'fecha':
              // El filtro de fecha usa los DatePickers, no la búsqueda de texto
              break;
          }
        } else {
          if (!matchesSearch) return false;
        }
      }

      // Filtro por rango de fechas
      if (filtroActivo === 'fecha' && (fechaFiltroInicio || fechaFiltroFin)) {
        const fechaManifiesto = new Date(manifiesto.fecha_emision);
        fechaManifiesto.setHours(0, 0, 0, 0);

        if (fechaFiltroInicio) {
          const inicio = new Date(fechaFiltroInicio);
          inicio.setHours(0, 0, 0, 0);
          if (fechaManifiesto < inicio) return false;
        }

        if (fechaFiltroFin) {
          const fin = new Date(fechaFiltroFin);
          fin.setHours(23, 59, 59, 999);
          if (fechaManifiesto > fin) return false;
        }
      }

      return true;
    });
  }, [manifiestos, buques, personas, searchQuery, filtroActivo, fechaFiltroInicio, fechaFiltroFin, filtroSeleccionBuque, filtroSeleccionMotorista, filtroSeleccionCocinero]);

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
      // Validar campos requeridos (ahora validamos por nombre, no por ID)
      if (!formData.fecha_emision || (!formData.buque_id && !buqueNombre.trim()) || (!formData.responsable_principal_id && !motoristaNombre.trim())) {
        alert('❌ Por favor completa todos los campos obligatorios');
        setShowValidation(true);
        return;
      }

      setSaving(true);

      // Auto-registrar embarcación si es nueva
      let buqueId = formData.buque_id;
      if (!buqueId && buqueNombre.trim()) {
        const nuevaBuque = await createBuqueAutomatico(buqueNombre.trim());
        buqueId = nuevaBuque.id.toString();
      }

      // Auto-registrar motorista si es nuevo
      let motoristaId = formData.responsable_principal_id;
      if (!motoristaId && motoristaNombre.trim()) {
        const tipoMotorista = await getOrCreateTipoPersona('Motorista');
        const nuevoMotorista = await createPersonaAutomatica(motoristaNombre.trim(), tipoMotorista.id);
        motoristaId = nuevoMotorista.id.toString();
      }

      // Auto-registrar cocinero si es nuevo
      let cocineroId = formData.responsable_secundario_id;
      if (!cocineroId && cocineroNombre.trim()) {
        const tipoCocinero = await getOrCreateTipoPersona('Cocinero');
        const nuevoCocinero = await createPersonaAutomatica(cocineroNombre.trim(), tipoCocinero.id);
        cocineroId = nuevoCocinero.id.toString();
      }

      const manifiestoData = {
        fecha_emision: formData.fecha_emision,
        buque_id: parseInt(buqueId),
        responsable_principal_id: parseInt(motoristaId),
        responsable_secundario_id: cocineroId ? parseInt(cocineroId) : null,
        estado_digitalizacion: 'completado' as any,
        observaciones: formData.observaciones || null,
        imagen_manifiesto_url: null,
        pdf_manifiesto_url: null,
      };

      const resultado = await createManifiesto(manifiestoData, residuos, archivo);

      // --- Generar y subir PDF Automáticamente (Solo si NO se adjuntó archivo) ---
      if (!archivo) {
        try {
          setGenerandoPDF(resultado.id.toString());

          // 1. Preparar datos completos para el PDF (Relaciones)
          // Intentar encontrar en el estado (existentes).
          let buqueObj = buques.find(b => b.id === resultado.buque_id);
          let respPrincObj = personas.find(p => p.id === resultado.responsable_principal_id);
          let respSecObj = personas.find(p => p.id === resultado.responsable_secundario_id);

          // FALLBACK: Si no existe en el estado (acaba de crearse), construir objeto manual
          if (!buqueObj && resultado.buque_id) {
            buqueObj = { id: resultado.buque_id, nombre_buque: buqueNombre.trim() } as any;
          }
          if (!respPrincObj && resultado.responsable_principal_id) {
            respPrincObj = { id: resultado.responsable_principal_id, nombre: motoristaNombre.trim() } as any;
          }
          if (!respSecObj && resultado.responsable_secundario_id) {
            respSecObj = { id: resultado.responsable_secundario_id, nombre: cocineroNombre.trim() } as any;
          }

          // Construir objeto con la estructura que espera el generador
          const manifestoCompleto = {
            ...resultado,
            buque: buqueObj, // El generador suele esperar el objeto o { nombre_buque }
            responsable_principal: respPrincObj,
            responsable_secundario: respSecObj,
            residuos: { ...residuos } // Pasamos los valores actuales
          } as unknown as ManifiestoConRelaciones;

          // 2. Preparar Firmas
          const firmasPDF: FirmasManifiesto = {
            motoristaFirma: motoristaSignature,
            motoristaNombre: motoristaNombre || respPrincObj?.nombre,
            cocineroFirma: cocineroSignature,
            cocineroNombre: cocineroNombre || respSecObj?.nombre,
            oficialFirma: oficialSignature
          };

          // 3. Generar PDF Blob
          const pdfBlob = await generarPDFManifiesto(manifestoCompleto, firmasPDF);

          // 4. Subir PDF
          console.log("Subiendo PDF generado...");
          const pdfUrl = await uploadManifiestoPDF(pdfBlob, resultado.numero_manifiesto);

          // 5. Actualizar Manifiesto con URL
          if (pdfUrl) {
            await updateManifiesto(resultado.id, { pdf_manifiesto_url: pdfUrl });
            console.log("✅ PDF vinculado exitosamente");
          }

        } catch (pdfError) {
          console.error("⚠️ Error generando/subiendo PDF automático:", pdfError);
          // No bloqueamos el flujo principal, pero avisamos en consola
        } finally {
          setGenerandoPDF(null);
        }
      } else {
        console.log("ℹ️ Se omitió generación automática de PDF porque se adjuntó archivo.");
      }

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
      setBuqueNombre('');
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

  const handleDescargarBorrador = async () => {
    try {
      // 1. Validar datos mínimos
      if (!formData.buque_id) {
        alert('Por favor selecciona un buque primero');
        return;
      }

      // 2. Construir objeto Manifiesto temporal
      const buqueSeleccionado = buques.find(b => b.id === Number(formData.buque_id));
      const motoristaSeleccionado = personas.find(p => p.id === Number(formData.responsable_principal_id));
      const cocineroSeleccionado = personas.find(p => p.id === Number(formData.responsable_secundario_id));

      if (!buqueSeleccionado) {
        alert('Error: Buque no encontrado');
        return;
      }

      const borradorManifiesto: ManifiestoConRelaciones = {
        id: 0, // ID temporal
        created_at: new Date().toISOString(),
        numero_manifiesto: formData.numero_manifiesto || 'BORRADOR',
        fecha_emision: formData.fecha_emision,
        buque_id: Number(formData.buque_id),
        responsable_principal_id: Number(formData.responsable_principal_id) || 0,
        responsable_secundario_id: Number(formData.responsable_secundario_id) || null,
        estado_digitalizacion: 'pendiente',
        observaciones: formData.observaciones || null,
        pdf_manifiesto_url: null,
        imagen_manifiesto_url: null,
        updated_at: new Date().toISOString(),
        buque: buqueSeleccionado,
        responsable_principal: motoristaSeleccionado,
        responsable_secundario: cocineroSeleccionado,
        residuos: {
          id: 0,
          manifiesto_id: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...residuos
        }
      };

      // 3. Generar PDF SIN firmas
      const firmasVacias: FirmasManifiesto = {
        motoristaFirma: null,
        motoristaNombre: motoristaNombre, // Usar nombre escrito si existe
        cocineroFirma: null,
        cocineroNombre: cocineroNombre, // Usar nombre escrito si existe
        oficialFirma: null
      };

      const pdfBlob = await generarPDFManifiesto(borradorManifiesto, firmasVacias);

      // 4. Descargar
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BORRADOR_Manifiesto_${formData.numero_manifiesto || 'SN'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generando borrador:', error);
      alert('Error al generar el borrador');
    }
  };

  const handleDescargarPDF = async (manifiesto: ManifiestoConRelaciones) => {
    try {
      setGenerandoPDF(manifiesto.id.toString());
      const nombreArchivo = generarNombreArchivoPDF(manifiesto.numero_manifiesto);

      let pdfBlob: Blob;

      if (manifiesto.pdf_manifiesto_url) {
        // Opción A: Usar URL existente
        try {
          const response = await fetch(manifiesto.pdf_manifiesto_url);
          pdfBlob = await response.blob();
        } catch (e) {
          console.warn("Fallo al descargar existing PDF, regenerando...", e);
          // Fallback to regeneration
          const firmasPDF: FirmasManifiesto = {
            motoristaFirma: motoristaSignature,
            motoristaNombre: motoristaNombre || personas.find(p => p.id === manifiesto.responsable_principal_id)?.nombre,
            cocineroFirma: cocineroSignature,
            cocineroNombre: cocineroNombre || (manifiesto.responsable_secundario_id
              ? personas.find(p => p.id === manifiesto.responsable_secundario_id)?.nombre
              : undefined),
            oficialFirma: oficialSignature
          };
          pdfBlob = await generarPDFManifiesto(manifiesto, firmasPDF);
        }
      } else {
        // Opción B: Generar nuevo
        const firmasPDF: FirmasManifiesto = {
          motoristaFirma: motoristaSignature,
          motoristaNombre: motoristaNombre || personas.find(p => p.id === manifiesto.responsable_principal_id)?.nombre,
          cocineroFirma: cocineroSignature,
          cocineroNombre: cocineroNombre || (manifiesto.responsable_secundario_id
            ? personas.find(p => p.id === manifiesto.responsable_secundario_id)?.nombre
            : undefined),
          oficialFirma: oficialSignature
        };
        pdfBlob = await generarPDFManifiesto(manifiesto, firmasPDF);
      }

      // Descargar
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(tm('descargaExitosa'));
    } catch (error) {
      console.error('Error generando/descargando PDF:', error);
      alert(tm('errorDescarga'));
    } finally {
      setGenerandoPDF(null);
    }
  };

  const handleImprimirManifiesto = async (manifiesto: ManifiestoConRelaciones) => {
    try {
      setGenerandoPDF(manifiesto.id.toString());

      let urlParaImprimir: string | null = null;
      let blobParaImprimir: Blob | null = null;

      if (manifiesto.pdf_manifiesto_url) {
        try {
          const response = await fetch(manifiesto.pdf_manifiesto_url);
          blobParaImprimir = await response.blob();
          urlParaImprimir = URL.createObjectURL(blobParaImprimir);
        } catch (e) {
          console.warn("Error fetching existing PDF for print", e);
        }
      }

      if (!urlParaImprimir) {
        const firmasPDF: FirmasManifiesto = {
          motoristaFirma: motoristaSignature,
          motoristaNombre: motoristaNombre || personas.find(p => p.id === manifiesto.responsable_principal_id)?.nombre,
          cocineroFirma: cocineroSignature,
          cocineroNombre: cocineroNombre || (manifiesto.responsable_secundario_id
            ? personas.find(p => p.id === manifiesto.responsable_secundario_id)?.nombre
            : undefined),
          oficialFirma: oficialSignature
        };
        blobParaImprimir = await generarPDFManifiesto(manifiesto, firmasPDF);
        urlParaImprimir = URL.createObjectURL(blobParaImprimir);
      }

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = urlParaImprimir!;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.print();
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          if (urlParaImprimir) URL.revokeObjectURL(urlParaImprimir);
        }, 60000);
      };

    } catch (error) {
      console.error('Error al imprimir:', error);
      alert('Error al intentar imprimir.');
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
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden max-w-6xl mx-auto shadow-lg">
        {/* Encabezado del documento */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">MANIFIESTO DE ENTREGA-RECEPCIÓN</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Puerto Peñasco, Sonora a {new Date(formData.fecha_emision + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="text-right">
              {formData.numero_manifiesto && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Folio No.</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formData.numero_manifiesto}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenido del formulario - Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-slate-700">
          {/* COLUMNA IZQUIERDA - Datos del formulario */}
          <div className="p-6 space-y-4">
            <h3 className="text-base font-bold text-black dark:text-white uppercase tracking-wide mb-4">Datos del Manifiesto</h3>

            {/* FECHA */}
            <div
              className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-xl transition-all duration-200 ${activeField === 'fecha' ? 'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">FECHA:</label>
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
                  className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black dark:!text-white text-base font-medium transition-all duration-200 cursor-pointer ${activeField === 'fecha' ? 'border-blue-600' : 'border-gray-400 dark:border-gray-600'
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
              <label className="text-base font-bold text-black dark:text-white w-36 flex-shrink-0">BARCO:</label>
              <div className="flex-1 relative">
                <input
                  ref={buqueInputRef}
                  type="text"
                  value={buqueNombre}
                  placeholder="Escribe el nombre del barco..."
                  onChange={(e) => {
                    const value = e.target.value;
                    setBuqueNombre(value);
                    setShowBuqueSuggestions(value.length > 0);
                    setSelectedBuqueIndex(-1);
                    const buqueExacto = buques.find(b => b.nombre_buque.toLowerCase() === value.toLowerCase());
                    if (buqueExacto) {
                      setFormData({ ...formData, buque_id: buqueExacto.id.toString() });
                    } else {
                      setFormData({ ...formData, buque_id: '' });
                    }
                    setShowValidation(false);
                  }}
                  onFocus={() => { setActiveField('buque'); if (buqueNombre.length > 0) setShowBuqueSuggestions(true); }}
                  onBlur={() => { setActiveField(null); setTimeout(() => setShowBuqueSuggestions(false), 200); }}
                  onKeyDown={(e) => {
                    const filteredBuques = buques.filter(b => b.nombre_buque.toLowerCase().includes(buqueNombre.toLowerCase()));
                    if (e.key === 'ArrowDown' && showBuqueSuggestions && filteredBuques.length > 0) {
                      e.preventDefault();
                      setSelectedBuqueIndex(prev => prev < filteredBuques.length - 1 ? prev + 1 : prev);
                    } else if (e.key === 'ArrowUp' && showBuqueSuggestions && selectedBuqueIndex > 0) {
                      e.preventDefault();
                      setSelectedBuqueIndex(prev => prev - 1);
                    } else if (e.key === 'Enter' && showBuqueSuggestions && selectedBuqueIndex >= 0) {
                      e.preventDefault();
                      const buque = filteredBuques[selectedBuqueIndex];
                      setBuqueNombre(buque.nombre_buque);
                      setFormData({ ...formData, buque_id: buque.id.toString() });
                      setShowBuqueSuggestions(false);
                      setSelectedBuqueIndex(-1);
                    } else if (e.key === 'Escape') {
                      setShowBuqueSuggestions(false);
                    } else if (e.key === 'Enter' && !showBuqueSuggestions) {
                      handleKeyDown(e, 1);
                    }
                  }}
                  className={`w-full px-3 py-2 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium transition-all duration-200 ${showValidation && !formData.buque_id ? 'border-red-500' : activeField === 'buque' ? 'border-blue-600' : 'border-gray-400'
                    }`}
                />
                {showBuqueSuggestions && (
                  <div className="absolute z-50 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                    {buques.filter(b => b.nombre_buque.toLowerCase().includes(buqueNombre.toLowerCase())).map((buque, index) => (
                      <div
                        key={buque.id}
                        onClick={() => {
                          setBuqueNombre(buque.nombre_buque);
                          setFormData({ ...formData, buque_id: buque.id.toString() });
                          setShowBuqueSuggestions(false);
                        }}
                        className={`px-3 py-2 cursor-pointer text-base ${index === selectedBuqueIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white'
                          }`}
                      >
                        {buque.nombre_buque}
                        {buque.matricula && <span className="text-sm text-gray-500 ml-2">({buque.matricula})</span>}
                      </div>
                    ))}
                    {buques.filter(b => b.nombre_buque.toLowerCase().includes(buqueNombre.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">No se encontraron embarcaciones</div>
                    )}
                  </div>
                )}
                {showValidation && !formData.buque_id && <p className="text-xs text-red-600 mt-1">* Seleccione una embarcación válida</p>}
              </div>
            </div>

            {/* Línea divisoria */}
            <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>

            {/* RESIDUOS - Grid compacto */}
            <div className="grid grid-cols-2 gap-3">
              {/* ACEITE USADO */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'aceite' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black dark:text-white block mb-1">ACEITE USADO</label>
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
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${activeField === 'aceite' ? 'border-blue-600' : 'border-gray-300'
                      }`}
                  />
                  <span className="text-sm font-medium text-black dark:text-gray-300">Lt</span>
                </div>
              </div>

              {/* FILTROS DE ACEITE */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'filtrosAceite' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black dark:text-white block mb-1">FILTROS ACEITE</label>
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
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${activeField === 'filtrosAceite' ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                  />
                  <span className="text-sm font-medium text-black dark:text-gray-300">Pza</span>
                </div>
              </div>

              {/* FILTROS DE DIESEL */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'filtrosDiesel' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black dark:text-white block mb-1">FILTROS DIESEL</label>
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
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${activeField === 'filtrosDiesel' ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                  />
                  <span className="text-sm font-medium text-black dark:text-gray-300">Pza</span>
                </div>
              </div>

              {/* FILTROS DE AIRE */}
              <div className={`py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'filtrosAire' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black dark:text-white block mb-1">FILTROS AIRE</label>
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
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${activeField === 'filtrosAire' ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                  />
                  <span className="text-sm font-medium text-black dark:text-gray-300">Pza</span>
                </div>
              </div>

              {/* BASURA - Ocupa 2 columnas */}
              <div className={`col-span-2 py-2 px-3 rounded-lg transition-all duration-200 ${activeField === 'basura' ? 'bg-blue-100/60 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                <label className="text-sm font-bold text-black dark:text-white block mb-1">BASURA</label>
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
                    className={`w-full px-2 py-1.5 border-b-2 bg-transparent focus:outline-none text-black dark:text-white text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${activeField === 'basura' ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                  />
                  <span className="text-sm font-medium text-black dark:text-gray-300">Kg</span>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className={`mt-4 transition-all duration-200 ${activeField === 'observaciones' ? 'bg-blue-100/60 border-l-4 border-l-blue-600 rounded-lg p-3 -mx-3' : 'border-l-4 border-l-transparent'}`}>
              <label className="block text-sm font-bold text-black dark:text-white mb-1">OBSERVACIONES (opcional)</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                onFocus={() => setActiveField('observaciones')}
                onBlur={() => setActiveField(null)}
                rows={2}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none resize-none text-black dark:text-white text-base dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* COLUMNA DERECHA - Firmas */}
          <div className="p-6 bg-gray-50 dark:bg-slate-700/30 space-y-4">
            <h3 className="text-base font-bold text-black dark:text-white uppercase tracking-wide mb-4">Firmas</h3>

            {/* FIRMA OFICIAL COMISIONADO */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-base font-bold text-black dark:text-white">RECIBE: Oficial Comisionado</p>
              <p className="text-sm text-black dark:text-gray-300 mb-3">Recolección de Basura y Residuos Aceitosos (MARPOL ANEXO V)</p>

              {!oficialSignature ? (
                <button
                  type="button"
                  onClick={() => openSignatureModal('oficial')}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Firmar
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-green-200 rounded-lg p-2 bg-green-50">
                    <img src={oficialSignature} alt="Firma Oficial" className="w-full h-16 object-contain" />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-green-600 font-medium">Firmado</span>
                    <button type="button" onClick={() => openSignatureModal('oficial')} className="text-sm text-blue-600 hover:underline">Editar</button>
                    <button type="button" onClick={() => setOficialSignature(null)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                  </div>
                </div>
              )}
            </div>

            {/* FIRMA MOTORISTA */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-base font-bold text-black dark:text-white mb-1">MOTORISTA</p>
              <p className="text-sm text-black dark:text-gray-300 mb-2">Responsable de entrega de líquidos</p>
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
                className={`w-full px-3 py-2.5 border-b-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg focus:outline-none text-base font-semibold text-black dark:text-white placeholder:text-black dark:placeholder:text-gray-400 ${showValidation && !formData.responsable_principal_id ? 'border-red-500' : activeField === 'motorista' ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
              />
              {showMotoristaSuggestions && (
                <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-b-lg shadow-lg max-h-32 overflow-y-auto">
                  {personas.filter(p => p.nombre.toLowerCase().includes(motoristaNombre.toLowerCase())).map((persona, index) => (
                    <div key={persona.id} onClick={() => { setMotoristaNombre(persona.nombre); setFormData({ ...formData, responsable_principal_id: persona.id.toString() }); setShowMotoristaSuggestions(false); }}
                      className={`px-3 py-2 cursor-pointer text-base ${index === selectedSuggestionIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white'}`}>
                      {persona.nombre}
                    </div>
                  ))}
                </div>
              )}
              {showValidation && !formData.responsable_principal_id && <p className="text-xs text-red-600 mt-1">* Requerido</p>}

              <div className="mt-3">
                {!motoristaSignature ? (
                  <button type="button" onClick={() => openSignatureModal('motorista')}
                    className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Firmar
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="border-2 border-green-200 rounded-lg p-2 bg-green-50">
                      <img src={motoristaSignature} alt="Firma Motorista" className="w-full h-12 object-contain" />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm text-green-600 font-medium">Firmado</span>
                      <button type="button" onClick={() => openSignatureModal('motorista')} className="text-sm text-blue-600 hover:underline">Editar</button>
                      <button type="button" onClick={() => setMotoristaSignature(null)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FIRMA COCINERO */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-base font-bold text-black dark:text-white mb-1">COCINERO <span className="font-normal text-gray-600 dark:text-gray-400">(Opcional)</span></p>
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
                className={`w-full px-3 py-2.5 border-b-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg focus:outline-none text-base font-semibold text-black dark:text-white placeholder:text-black dark:placeholder:text-gray-400 ${activeField === 'cocinero' ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
              />
              {showCocineroSuggestions && (
                <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-b-lg shadow-lg max-h-32 overflow-y-auto">
                  {personas.filter(p => p.id !== parseInt(formData.responsable_principal_id)).filter(p => p.nombre.toLowerCase().includes(cocineroNombre.toLowerCase())).map((persona, index) => (
                    <div key={persona.id} onClick={() => { setCocineroNombre(persona.nombre); setFormData({ ...formData, responsable_secundario_id: persona.id.toString() }); setShowCocineroSuggestions(false); }}
                      className={`px-3 py-2 cursor-pointer text-base ${index === selectedSuggestionIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white'}`}>
                      {persona.nombre}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3">
                {!cocineroSignature ? (
                  <button type="button" onClick={() => openSignatureModal('cocinero')}
                    className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Firmar
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="border-2 border-green-200 rounded-lg p-2 bg-green-50">
                      <img src={cocineroSignature} alt="Firma Cocinero" className="w-full h-12 object-contain" />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm text-green-600 font-medium">Firmado</span>
                      <button type="button" onClick={() => openSignatureModal('cocinero')} className="text-sm text-blue-600 hover:underline">Editar</button>
                      <button type="button" onClick={() => setCocineroSignature(null)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Digitalización y Botón Guardar */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-700/30">
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
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Adjuntar documento</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Opcional - documento escaneado</p>
                </div>
              </div>

              {/* Botón Descargar Borrador */}
              <button
                type="button"
                onClick={handleDescargarBorrador}
                className="w-full mb-4 py-2 px-3 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all flex items-center justify-center gap-2 group"
                title="Descargar datos actuales para firmar"
              >
                <div className="bg-gray-100 dark:bg-gray-600 p-1.5 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold">Descargar Borrador</span>
                  <span className="block text-xs font-normal opacity-75">Imprimir y firmar a mano</span>
                </div>
              </button>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg p-3 text-center transition-all ${dragActive ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 border-dashed' : archivo ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 border-dashed'
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
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{archivo.name}</span>
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
          className="group flex items-center gap-2 px-6 py-3 border-2 border-blue-500 bg-transparent hover:bg-blue-500 text-blue-500 hover:text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
        >
          <span>Ver registros</span>
          <svg className="w-5 h-5 animate-bounce stroke-blue-500 group-hover:stroke-white transition-colors duration-300" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* Tabla de Manifiestos */}
      <div id="registros-list" className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl"></span>
            <span className="break-words">Manifiestos Registrados</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Lista de todos los manifiestos creados en el sistema</p>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número, buque, motorista, cocinero..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Botones de filtros */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFiltroActivo('todos'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroActivo === 'todos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              📋 Todos
            </button>
            <button
              onClick={() => { setFiltroActivo('buque'); setShowFiltroFecha(false); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroActivo === 'buque'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              🚢 Por Buque
            </button>
            <button
              onClick={() => { setFiltroActivo('motorista'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionCocinero(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroActivo === 'motorista'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              👨‍🔧 Por Motorista
            </button>
            <button
              onClick={() => { setFiltroActivo('cocinero'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroActivo === 'cocinero'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              👨‍🍳 Por Cocinero
            </button>
            <button
              onClick={() => { setFiltroActivo('numero'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroActivo === 'numero'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              🔢 Por Número
            </button>
            <button
              onClick={() => { setFiltroActivo('fecha'); setShowFiltroFecha(!showFiltroFecha); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroActivo === 'fecha'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              📅 Por Fecha
            </button>

            {/* Limpiar filtros */}
            {(searchQuery || filtroActivo !== 'todos' || fechaFiltroInicio || fechaFiltroFin || filtroSeleccionBuque || filtroSeleccionMotorista || filtroSeleccionCocinero) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFiltroActivo('todos');
                  setFechaFiltroInicio(null);
                  setFechaFiltroFin(null);
                  setShowFiltroFecha(false);
                  setFiltroSeleccionBuque(null);
                  setFiltroSeleccionMotorista(null);
                  setFiltroSeleccionCocinero(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all"
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          {/* Selector de Buque */}
          {filtroActivo === 'buque' && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-blue-800 mb-2">🚢 Selecciona un buque:</label>
              <select
                value={filtroSeleccionBuque || ''}
                onChange={(e) => setFiltroSeleccionBuque(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">-- Todos los buques --</option>
                {buques.map((buque) => (
                  <option key={buque.id} value={buque.id}>
                    {buque.nombre_buque}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Motorista */}
          {filtroActivo === 'motorista' && (
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-orange-800 mb-2">👨‍🔧 Selecciona un motorista:</label>
              <select
                value={filtroSeleccionMotorista || ''}
                onChange={(e) => setFiltroSeleccionMotorista(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900"
              >
                <option value="">-- Todos los motoristas --</option>
                {/* Obtener IDs únicos de responsables principales usados en manifiestos */}
                {Array.from(new Set(manifiestos.map(m => m.responsable_principal_id).filter(Boolean)))
                  .map(id => personas.find(p => p.id === id))
                  .filter(Boolean)
                  .map((persona) => (
                    <option key={persona!.id} value={persona!.id}>
                      {persona!.nombre}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Selector de Cocinero */}
          {filtroActivo === 'cocinero' && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-green-800 mb-2">👨‍🍳 Selecciona un cocinero:</label>
              <select
                value={filtroSeleccionCocinero || ''}
                onChange={(e) => setFiltroSeleccionCocinero(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
              >
                <option value="">-- Todos los cocineros --</option>
                {/* Obtener IDs únicos de responsables secundarios usados en manifiestos */}
                {Array.from(new Set(manifiestos.map(m => m.responsable_secundario_id).filter(Boolean)))
                  .map(id => personas.find(p => p.id === id))
                  .filter(Boolean)
                  .map((persona) => (
                    <option key={persona!.id} value={persona!.id}>
                      {persona!.nombre}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Selector de rango de fechas */}
          {showFiltroFecha && filtroActivo === 'fecha' && (
            <div className="flex flex-wrap items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-700">Desde:</span>
                </div>
                <DatePicker
                  selected={fechaFiltroInicio}
                  onChange={(date) => setFechaFiltroInicio(date)}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="Seleccionar fecha"
                  className="px-4 py-2.5 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-44 font-semibold text-gray-900 bg-white shadow-sm placeholder:text-gray-400"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-700">Hasta:</span>
                </div>
                <DatePicker
                  selected={fechaFiltroFin}
                  onChange={(date) => setFechaFiltroFin(date)}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="Seleccionar fecha"
                  className="px-4 py-2.5 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-44 font-semibold text-gray-900 bg-white shadow-sm placeholder:text-gray-400"
                  isClearable
                  minDate={fechaFiltroInicio || undefined}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>
          )}

          {/* Indicador de resultados */}
          {(searchQuery || filtroActivo !== 'todos' || fechaFiltroInicio || fechaFiltroFin || filtroSeleccionBuque || filtroSeleccionMotorista || filtroSeleccionCocinero) && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>
                Mostrando <strong>{manifiestosFiltrados.length}</strong> de <strong>{manifiestos.length}</strong> manifiestos
                {filtroActivo === 'buque' && filtroSeleccionBuque && ` - Buque: ${buques.find(b => b.id === filtroSeleccionBuque)?.nombre_buque}`}
                {filtroActivo === 'motorista' && filtroSeleccionMotorista && ` - Motorista: ${personas.find(p => p.id === filtroSeleccionMotorista)?.nombre}`}
                {filtroActivo === 'cocinero' && filtroSeleccionCocinero && ` - Cocinero: ${personas.find(p => p.id === filtroSeleccionCocinero)?.nombre}`}
                {filtroActivo === 'fecha' && ' (filtrado por fecha)'}
                {filtroActivo === 'numero' && searchQuery && ` (buscando: "${searchQuery}")`}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 dark:border-slate-700 sm:rounded-xl">
                <table className="w-full">
                  <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Número</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Buque</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Motorista</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Cocinero</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifiestos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 dark:text-gray-300 text-center py-8">
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-semibold dark:text-gray-300">No hay manifiestos registrados</p>
                            <p className="text-sm dark:text-gray-400">Complete el formulario arriba para crear uno nuevo</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      manifiestosFiltrados.map((manifiesto) => {
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
                          <tr key={manifiesto.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm">
                              <span className="font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{manifiesto.numero_manifiesto}</span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm">
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{buqueNombre}</span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm hidden md:table-cell">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{respPrincipal}</span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm hidden lg:table-cell">
                              <span className="text-gray-600 dark:text-gray-400">{respSecundario || '—'}</span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm hidden sm:table-cell">
                              <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {new Date(manifiesto.fecha_emision).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm">
                              <div className="flex gap-1 sm:gap-2 min-w-[160px]">
                                <button
                                  onClick={() => setViewingManifiesto(manifiesto)}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 sm:gap-1.5 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap bg-white dark:bg-slate-800"
                                  title="Ver detalles"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span className="hidden sm:inline">Ver Detalles</span>
                                </button>
                                <button
                                  onClick={() => handleDescargarPDF(manifiesto)}
                                  disabled={generandoPDF === manifiesto.id.toString()}
                                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm disabled:opacity-70 disabled:cursor-wait"
                                  title={t('acciones.descargarPDF')}
                                >
                                  {generandoPDF === manifiesto.id.toString() ? (
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  )}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative w-full max-w-5xl flex flex-col gap-6 my-8">

              {/* Botón de cierre flotante */}
              <div className="flex justify-end sticky top-0 z-10 pt-2 pr-2">
                <button
                  onClick={() => setViewingManifiesto(null)}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm border border-white/20 shadow-lg"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Card 1: Información General */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      Detalles del Manifiesto
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">#{viewingManifiesto.numero_manifiesto}</span>
                    </div>
                  </h3>
                  {/* Status Badge */}
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase ${viewingManifiesto.estado_digitalizacion === 'completado'
                    ? 'bg-green-100 text-green-700'
                    : viewingManifiesto.estado_digitalizacion === 'en_proceso'
                      ? 'bg-yellow-100 text-yellow-700'
                      : viewingManifiesto.estado_digitalizacion === 'aprobado'
                        ? 'bg-blue-100 text-blue-700'
                        : viewingManifiesto.estado_digitalizacion === 'rechazado'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                    {viewingManifiesto.estado_digitalizacion?.replace('_', ' ') || 'Pendiente'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Fecha */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
                    <p className="text-gray-900 dark:text-white font-medium text-lg">
                      {new Date(viewingManifiesto.fecha_emision + 'T12:00:00').toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Buque */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Buque</p>
                    <p className="text-gray-900 dark:text-white font-medium text-lg">
                      {viewingManifiesto.buque?.nombre_buque || buques.find(b => b.id === viewingManifiesto.buque_id)?.nombre_buque || 'N/A'}
                    </p>
                  </div>

                  {/* Motorista */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Motorista</p>
                    <p className="text-gray-900 dark:text-white font-medium text-lg truncate" title={viewingManifiesto.responsable_principal?.nombre}>
                      {viewingManifiesto.responsable_principal?.nombre || personas.find(p => p.id === viewingManifiesto.responsable_principal_id)?.nombre || 'N/A'}
                    </p>
                  </div>

                  {/* Cocinero (Optional) */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Cocinero</p>
                    <p className="text-gray-900 dark:text-white font-medium text-lg truncate">
                      {viewingManifiesto.responsable_secundario?.nombre || (viewingManifiesto.responsable_secundario_id ? personas.find(p => p.id === viewingManifiesto.responsable_secundario_id)?.nombre : 'N/A')}
                    </p>
                  </div>

                  {/* Observaciones */}
                  {(viewingManifiesto.observaciones) && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Observaciones</p>
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600 text-sm leading-relaxed">
                        {viewingManifiesto.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Residuos Section - Styled as Highlighted Stats */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">Residuos Recolectados</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-700 text-center transition-transform hover:scale-105">
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">{viewingManifiesto.residuos?.aceite_usado || 0}</p>
                      <p className="text-xs font-bold text-blue-400 dark:text-blue-500 uppercase">Aceite (L)</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-700 text-center transition-transform hover:scale-105">
                      <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mb-1">{viewingManifiesto.residuos?.filtros_aceite || 0}</p>
                      <p className="text-xs font-bold text-indigo-400 dark:text-indigo-500 uppercase">F. Aceite (U)</p>
                    </div>
                    <div className="bg-violet-50 dark:bg-violet-900/30 p-4 rounded-xl border border-violet-100 dark:border-violet-700 text-center transition-transform hover:scale-105">
                      <p className="text-3xl font-bold text-violet-700 dark:text-violet-400 mb-1">{viewingManifiesto.residuos?.filtros_diesel || 0}</p>
                      <p className="text-xs font-bold text-violet-400 dark:text-violet-500 uppercase">F. Diesel (U)</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border border-gray-200 dark:border-slate-600 text-center transition-transform hover:scale-105">
                      <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-1">{viewingManifiesto.residuos?.basura || 0}</p>
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Basura (Kg)</p>
                    </div>
                    {/* Extras if needed */}
                  </div>
                </div>
              </div>

              {/* Card 2: Documento Digitalizado */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Documento Digitalizado
                  </h3>
                  {(viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url) && (
                    <a
                      href={viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      Abrir original
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>

                <div className="bg-gray-100 dark:bg-slate-900 min-h-[500px] p-4 flex justify-center items-center">
                  {(viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url) ? (
                    (() => {
                      const url = viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url;
                      if (!url) return null;
                      const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('.pdf');
                      if (isPdf) {
                        return (
                          <iframe
                            src={url}
                            className="w-full min-h-[1200px] rounded-lg border border-gray-300 dark:border-slate-600 shadow-md"
                            title="Documento PDF"
                            style={{ height: '1200px' }}
                          />
                        );
                      } else {
                        return (
                          <img
                            src={url}
                            alt="Documento"
                            className="w-full h-auto rounded-lg shadow-md"
                            style={{ display: 'block' }}
                          />
                        );
                      }
                    })()
                  ) : (
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">Sin documento adjunto</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal de Firma Flotante */}
      {signatureModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Fondo oscuro sin blur para mejor rendimiento */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={closeSignatureModal}
          />

          {/* Panel de firma */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-slate-700 dark:to-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{getSignatureModalTitle()}</h3>
                  <p className="text-blue-100 dark:text-gray-300 text-sm">Dibuje su firma en el área de abajo</p>
                </div>
              </div>
              <button
                onClick={closeSignatureModal}
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Área de firma */}
            <div className="p-6">
              <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 overflow-hidden">
                <canvas
                  ref={signatureModalCanvasRef}
                  width={600}
                  height={200}
                  className="w-full cursor-crosshair touch-none bg-white"
                  onMouseDown={startModalDrawing}
                  onMouseMove={drawModal}
                  onMouseUp={stopModalDrawing}
                  onMouseLeave={stopModalDrawing}
                  onTouchStart={startModalDrawing}
                  onTouchMove={drawModal}
                  onTouchEnd={stopModalDrawing}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-300 dark:text-gray-500 text-lg">Firme aquí</p>
                </div>
                {/* Línea de firma */}
                <div className="absolute bottom-8 left-8 right-8 border-b-2 border-gray-300 dark:border-gray-600 pointer-events-none" />
                <div className="absolute bottom-2 left-8 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">Firma</div>
              </div>

              {/* Botones */}
              <div className="flex justify-between items-center mt-6 gap-4">
                <button
                  type="button"
                  onClick={clearModalSignature}
                  className="px-5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Borrar
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeSignatureModal}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveModalSignature}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Firma
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
