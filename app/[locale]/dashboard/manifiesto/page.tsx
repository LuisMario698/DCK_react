'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Check, Download, FilePlus2, FileText, List, PenLine, Search, Upload } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { tiempoRelativo } from '@/lib/constants/residuos';
import {
  borrarSinTerminar,
  describirSinTerminar,
  guardarSinTerminar,
  leerSinTerminar,
  tieneContenido,
  type DatosSinTerminar,
  type ManifiestoSinTerminar,
} from '@/lib/utils/manifiestoSinTerminar';
import { getBuques, createBuqueAutomatico } from '@/lib/services/buques';
import { getPersonas, createPersonaAutomatica, getOrCreateTipoPersona } from '@/lib/services/personas';
import { createManifiesto, getManifiestos, deleteManifiesto, generarNumeroManifiesto, updateManifiesto } from '@/lib/services/manifiestos';
import { generarPDFManifiesto, generarNombreArchivoPDF, FirmasManifiesto } from '@/lib/utils/pdfGenerator';
import { uploadManifiestoPDF } from '@/lib/services/storage';
import { ManifiestoConRelaciones, Buque, PersonaConTipo } from '@/types/database';
import { hoyLocal, parseFechaLocal } from '@/lib/utils/fechas';
import { PalomitaAnimada } from '@/components/ui/movimiento';
import { PestanasMovil } from '@/components/ui/simar';
import { SelectorFecha } from '@/components/ui/SelectorFecha';


export default function ManifiestosPage() {
  const t = useTranslations('Manifiestos');
  const tm = useTranslations('Manifiestos.mensajes');
  const [manifiestos, setManifiestos] = useState<ManifiestoConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewingManifiesto, setViewingManifiesto] = useState<ManifiestoConRelaciones | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  // Sólo en celular: el formulario y la lista van en pestañas (en pantallas grandes se ven los dos)
  const [vistaMovil, setVistaMovil] = useState<'nuevo' | 'registros'>('nuevo');

  const [buques, setBuques] = useState<Buque[]>([]);
  const [personas, setPersonas] = useState<PersonaConTipo[]>([]);

  // La fecha se llena al montar en el navegador (hoy en hora local); calcularla
  // aquí daría valores distintos en el servidor (UTC) y en el cliente.
  const [formData, setFormData] = useState({
    numero_manifiesto: '',
    fecha_emision: '',
    buque_id: '',
    responsable_principal_id: '',
    responsable_secundario_id: '',
    responsable_liquidos_id: '',
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
  const [liquidosSignature, setLiquidosSignature] = useState<string | null>(null);
  const [activeSignature, setActiveSignature] = useState<'motorista' | 'cocinero' | 'oficial' | 'liquidos' | null>(null);

  // Estado para el modal de firma flotante
  const [signatureModalType, setSignatureModalType] = useState<'motorista' | 'cocinero' | 'oficial' | 'liquidos' | null>(null);
  const signatureModalCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Estados para autocompletado de nombres
  const [motoristaNombre, setMotoristaNombre] = useState('');
  const [cocineroNombre, setCocineroNombre] = useState('');
  const [liquidosNombre, setLiquidosNombre] = useState('');
  const [showMotoristaSuggestions, setShowMotoristaSuggestions] = useState(false);
  const [showCocineroSuggestions, setShowCocineroSuggestions] = useState(false);
  const [showLiquidosSuggestions, setShowLiquidosSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Estados para filtros y búsqueda de manifiestos
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'buque' | 'motorista' | 'cocinero' | 'fecha' | 'numero'>('todos');
  const [fechaFiltroInicio, setFechaFiltroInicio] = useState('');
  const [fechaFiltroFin, setFechaFiltroFin] = useState('');
  const [showFiltroFecha, setShowFiltroFecha] = useState(false);
  const [filtroSeleccionBuque, setFiltroSeleccionBuque] = useState<number | null>(null);
  const [filtroSeleccionMotorista, setFiltroSeleccionMotorista] = useState<number | null>(null);
  const [filtroSeleccionCocinero, setFiltroSeleccionCocinero] = useState<number | null>(null);

  // Paginación
  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para autocompletado de embarcaciones
  const [buqueNombre, setBuqueNombre] = useState('');
  const [showBuqueSuggestions, setShowBuqueSuggestions] = useState(false);
  const [selectedBuqueIndex, setSelectedBuqueIndex] = useState(-1);

  const buqueInputRef = useRef<HTMLInputElement | null>(null);

  // Manifiesto sin terminar (ver lib/utils/manifiestoSinTerminar.ts): lo que se captura se guarda
  // solo en este equipo y, si al entrar había uno, se ofrece continuarlo
  const { user } = useAuth();
  const usuarioId = user?.id ?? null;
  const [sinTerminar, setSinTerminar] = useState<ManifiestoSinTerminar | null>(null);
  // Nombre del archivo que se había adjuntado: el archivo no se guarda, hay que adjuntarlo otra vez
  const [archivoPorAdjuntar, setArchivoPorAdjuntar] = useState<string | null>(null);
  const revisadoParaRef = useRef<string | null>(null);

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
  const liquidosCanvasRef = useRef<HTMLCanvasElement>(null);
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'motorista' | 'cocinero' | 'oficial' | 'liquidos') => {
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : type === 'liquidos' ? liquidosCanvasRef : oficialCanvasRef;
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'motorista' | 'cocinero' | 'oficial' | 'liquidos') => {
    if (!isDrawing || activeSignature !== type) return;
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : type === 'liquidos' ? liquidosCanvasRef : oficialCanvasRef;
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

  const stopDrawing = (type: 'motorista' | 'cocinero' | 'oficial' | 'liquidos') => {
    if (activeSignature !== type) return;
    setIsDrawing(false);
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : type === 'liquidos' ? liquidosCanvasRef : oficialCanvasRef;
    const canvas = canvasRef.current;
    if (canvas) {
      const data = canvas.toDataURL();
      if (type === 'motorista') {
        setMotoristaSignature(data);
      } else if (type === 'cocinero') {
        setCocineroSignature(data);
      } else if (type === 'liquidos') {
        setLiquidosSignature(data);
      } else {
        setOficialSignature(data);
      }
    }
    setActiveSignature(null);
  };

  const clearSignature = (type: 'motorista' | 'cocinero' | 'oficial' | 'liquidos') => {
    const canvasRef = type === 'motorista' ? motoristaCanvasRef : type === 'cocinero' ? cocineroCanvasRef : type === 'liquidos' ? liquidosCanvasRef : oficialCanvasRef;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (type === 'motorista') {
      setMotoristaSignature(null);
    } else if (type === 'cocinero') {
      setCocineroSignature(null);
    } else if (type === 'liquidos') {
      setLiquidosSignature(null);
    } else {
      setOficialSignature(null);
    }
  };

  // Funciones para el modal de firma flotante
  const openSignatureModal = (type: 'motorista' | 'cocinero' | 'oficial' | 'liquidos') => {
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
    } else if (signatureModalType === 'liquidos') {
      setLiquidosSignature(data);
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
      case 'liquidos': return 'Firma del Resp. de Líquidos';
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

  // Fecha de hoy en hora local (ver comentario en formData)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la fecha local sólo existe en el navegador
    setFormData((f) => (f.fecha_emision ? f : { ...f, fecha_emision: hoyLocal() }));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Al entrar (en cuanto se sabe quién es): ¿quedó un manifiesto sin terminar?
  useEffect(() => {
    if (!usuarioId || revisadoParaRef.current === usuarioId) return;
    revisadoParaRef.current = usuarioId;
    setSinTerminar(leerSinTerminar(usuarioId));
  }, [usuarioId]);

  // Mientras se escribe se guarda solo, un momento después de la última tecla. Un formulario vacío no
  // se guarda (ni borra lo guardado): sólo lo borran "Guardar manifiesto" y "Empezar de nuevo".
  useEffect(() => {
    if (!usuarioId || saving) return;
    const datos: DatosSinTerminar = {
      formData,
      residuos,
      nombres: { buque: buqueNombre, motorista: motoristaNombre, cocinero: cocineroNombre, liquidos: liquidosNombre },
      firmas: { motorista: motoristaSignature, cocinero: cocineroSignature, oficial: oficialSignature, liquidos: liquidosSignature },
      archivo: archivo?.name ?? archivoPorAdjuntar,
    };
    if (!tieneContenido(datos)) return;
    const espera = setTimeout(() => {
      guardarSinTerminar(usuarioId, datos);
      // Se empezó a capturar otro: el que se ofrecía al entrar quedó reemplazado
      setSinTerminar(null);
    }, 700);
    return () => clearTimeout(espera);
  }, [usuarioId, saving, formData, residuos, buqueNombre, motoristaNombre, cocineroNombre, liquidosNombre, motoristaSignature, cocineroSignature, oficialSignature, liquidosSignature, archivo, archivoPorAdjuntar]);

  const continuarSinTerminar = () => {
    if (!sinTerminar) return;
    const m = sinTerminar;
    setFormData(m.formData);
    setResiduos(m.residuos);
    setBuqueNombre(m.nombres.buque);
    setMotoristaNombre(m.nombres.motorista);
    setCocineroNombre(m.nombres.cocinero);
    setLiquidosNombre(m.nombres.liquidos);
    setMotoristaSignature(m.firmas.motorista);
    setCocineroSignature(m.firmas.cocinero);
    setOficialSignature(m.firmas.oficial);
    setLiquidosSignature(m.firmas.liquidos);
    setArchivoPorAdjuntar(archivo ? null : m.archivo);
    setSinTerminar(null);
  };

  const descartarSinTerminar = () => {
    if (!confirm('¿Borrar el manifiesto sin terminar? Lo que se había capturado ya no se podrá recuperar.')) return;
    if (usuarioId) borrarSinTerminar(usuarioId);
    setSinTerminar(null);
  };

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
        const fechaManifiesto = parseFechaLocal(manifiesto.fecha_emision);
        fechaManifiesto.setHours(0, 0, 0, 0);

        if (fechaFiltroInicio) {
          const inicio = parseFechaLocal(fechaFiltroInicio);
          inicio.setHours(0, 0, 0, 0);
          if (fechaManifiesto < inicio) return false;
        }

        if (fechaFiltroFin) {
          const fin = parseFechaLocal(fechaFiltroFin);
          fin.setHours(23, 59, 59, 999);
          if (fechaManifiesto > fin) return false;
        }
      }

      return true;
    });
  }, [manifiestos, buques, personas, searchQuery, filtroActivo, fechaFiltroInicio, fechaFiltroFin, filtroSeleccionBuque, filtroSeleccionMotorista, filtroSeleccionCocinero]);

  // Volver a página 1 cuando cambia cualquier filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filtroActivo, fechaFiltroInicio, fechaFiltroFin, filtroSeleccionBuque, filtroSeleccionMotorista, filtroSeleccionCocinero]);

  const totalPages = Math.max(1, Math.ceil(manifiestosFiltrados.length / PAGE_SIZE));
  const manifiestosPagina = manifiestosFiltrados.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
      setGenerandoPDF('iniciando'); // Indicador visual temporal

      // 1. Paralelizar creación de entidades y generación de número
      const [buqueResult, motoristaResult, cocineroResult, numeroManifiesto] = await Promise.all([
        // Buque
        (!formData.buque_id && buqueNombre.trim())
          ? createBuqueAutomatico(buqueNombre.trim())
          : Promise.resolve(null),
        // Motorista
        (!formData.responsable_principal_id && motoristaNombre.trim())
          ? getOrCreateTipoPersona('Motorista').then(tipo => createPersonaAutomatica(motoristaNombre.trim(), tipo.id))
          : Promise.resolve(null),
        // Cocinero
        (!formData.responsable_secundario_id && cocineroNombre.trim())
          ? getOrCreateTipoPersona('Cocinero').then(tipo => createPersonaAutomatica(cocineroNombre.trim(), tipo.id))
          : Promise.resolve(null),
        // Generar número anticipadamente
        generarNumeroManifiesto(formData.fecha_emision)
      ]);

      const buqueId = buqueResult ? buqueResult.id.toString() : formData.buque_id;
      const motoristaId = motoristaResult ? motoristaResult.id.toString() : formData.responsable_principal_id;
      const cocineroId = cocineroResult ? cocineroResult.id.toString() : formData.responsable_secundario_id;

      let pdfBlob: Blob | null = null;

      // 2. Generar PDF en el cliente (si no se adjuntó archivo)
      if (!archivo) {
        try {
          // Construir objetos completos para el PDF
          const buqueObj = buqueResult || buques.find(b => b.id === Number(buqueId)) || { id: Number(buqueId), nombre_buque: buqueNombre.trim() } as any;
          const respPrincObj = motoristaResult || personas.find(p => p.id === Number(motoristaId)) || { id: Number(motoristaId), nombre: motoristaNombre.trim() } as any;
          const respSecObj = cocineroResult || personas.find(p => p.id === Number(cocineroId)) || (cocineroNombre.trim() ? { id: Number(cocineroId || 0), nombre: cocineroNombre.trim() } as any : undefined);

          const manifestoCompleto = {
            id: 0, // ID temporal
            created_at: new Date().toISOString(),
            numero_manifiesto: numeroManifiesto,
            fecha_emision: formData.fecha_emision,
            buque: buqueObj,
            responsable_principal: respPrincObj,
            responsable_secundario: respSecObj,
            residuos: { ...residuos }
          } as unknown as ManifiestoConRelaciones;

          const firmasPDF: FirmasManifiesto = {
            motoristaFirma: motoristaSignature,
            motoristaNombre: motoristaNombre || respPrincObj?.nombre,
            cocineroFirma: cocineroSignature,
            cocineroNombre: cocineroNombre || respSecObj?.nombre,
            oficialFirma: oficialSignature,
            liquidosFirma: liquidosSignature,
            liquidosNombre: liquidosNombre || personas.find(p => p.id === parseInt(formData.responsable_liquidos_id))?.nombre
          };

          pdfBlob = await generarPDFManifiesto(manifestoCompleto, firmasPDF);
        } catch (e) {
          console.error("Error generando PDF preliminar:", e);
        }
      }

      // 3. Crear Manifiesto (Subida + Insert en un paso optimizado)
      const manifiestoData = {
        fecha_emision: formData.fecha_emision,
        buque_id: parseInt(buqueId),
        responsable_principal_id: parseInt(motoristaId),
        responsable_secundario_id: cocineroId ? parseInt(cocineroId) : null,
        responsable_liquidos_id: formData.responsable_liquidos_id ? parseInt(formData.responsable_liquidos_id) : null,
        estado_digitalizacion: 'completado' as any,
        observaciones: formData.observaciones || null,
        imagen_manifiesto_url: null,
        pdf_manifiesto_url: null,
      };

      const resultado = await createManifiesto(
        manifiestoData,
        residuos,
        archivo,
        pdfBlob,
        numeroManifiesto // Pasamos el número generado
      );

      alert(`✅ Manifiesto ${resultado.numero_manifiesto} creado exitosamente`);

      // Ya quedó guardado en la base: lo capturado en este equipo sobra
      if (usuarioId) borrarSinTerminar(usuarioId);
      setArchivoPorAdjuntar(null);

      setFormData({
        numero_manifiesto: '',
        fecha_emision: hoyLocal(),
        buque_id: '',
        responsable_principal_id: '',
        responsable_secundario_id: '',
        responsable_liquidos_id: '',
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
      setLiquidosNombre('');
      setMotoristaSignature(null);
      setCocineroSignature(null);
      setOficialSignature(null);
      setLiquidosSignature(null);

      loadData();
    } catch (error: any) {
      console.error('Error guardando manifiesto:', error);
      alert('❌ Error al guardar el manifiesto: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
      setGenerandoPDF(null);
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
      // 1. Validar datos mínimos (Nombre de buque requerido, aunque no esté registrado)
      if (!formData.buque_id && !buqueNombre.trim()) {
        alert('Por favor ingresa un nombre de buque');
        return;
      }

      setGenerandoPDF('borrador'); // Indicador visual

      // 2. Auto-registro o recuperación de IDs (Paralelizado)
      const [buqueResult, motoristaResult, cocineroResult] = await Promise.all([
        // Buque
        (!formData.buque_id && buqueNombre.trim())
          ? createBuqueAutomatico(buqueNombre.trim())
          : Promise.resolve(null),
        // Motorista
        (!formData.responsable_principal_id && motoristaNombre.trim())
          ? getOrCreateTipoPersona('Motorista').then(tipo => createPersonaAutomatica(motoristaNombre.trim(), tipo.id))
          : Promise.resolve(null),
        // Cocinero
        (!formData.responsable_secundario_id && cocineroNombre.trim())
          ? getOrCreateTipoPersona('Cocinero').then(tipo => createPersonaAutomatica(cocineroNombre.trim(), tipo.id))
          : Promise.resolve(null)
      ]);

      // 3. Obtener objetos completos para el PDF
      // Usar el resultado del auto-registro O buscar en el estado existente O crear objeto temporal
      const buqueIdFinal = buqueResult ? buqueResult.id : formData.buque_id;
      const motoristaIdFinal = motoristaResult ? motoristaResult.id : formData.responsable_principal_id;
      const cocineroIdFinal = cocineroResult ? cocineroResult.id : formData.responsable_secundario_id;

      let buqueObj = buqueResult || buques.find(b => b.id === Number(buqueIdFinal));
      if (!buqueObj && buqueNombre.trim()) {
        // Fallback visual si por alguna razón no tenemos objeto DB aún
        buqueObj = { id: 0, nombre_buque: buqueNombre.trim(), estado: 'Activo' } as any;
      }

      let motoristaObj = motoristaResult || personas.find(p => p.id === Number(motoristaIdFinal));
      if (!motoristaObj && motoristaNombre.trim()) {
        motoristaObj = { id: 0, nombre: motoristaNombre.trim() } as any;
      }

      let cocineroObj = cocineroResult || personas.find(p => p.id === Number(cocineroIdFinal));
      if (!cocineroObj && cocineroNombre.trim()) {
        cocineroObj = { id: 0, nombre: cocineroNombre.trim() } as any;
      }

      // Actualizar el formulario con los nuevos IDs para que el usuario no tenga que volver a seleccionarlos
      // si decide guardar el manifiesto después de descargar el borrador.
      const newFormData = { ...formData };
      if (buqueResult) newFormData.buque_id = buqueResult.id.toString();
      if (motoristaResult) newFormData.responsable_principal_id = motoristaResult.id.toString();
      if (cocineroResult) newFormData.responsable_secundario_id = cocineroResult.id.toString();
      setFormData(newFormData);

      // Si hubo nuevos registros, recargar listas para que aparezcan en los selectores
      if (buqueResult || motoristaResult || cocineroResult) {
        loadData();
      }

      if (!buqueObj) {
        alert('Error: No se pudo determinar el buque. verifica los datos.');
        setGenerandoPDF(null);
        return;
      }

      // 4. Construir objeto Manifiesto temporal
      const borradorManifiesto: ManifiestoConRelaciones = {
        id: 0, // ID temporal
        created_at: new Date().toISOString(),
        numero_manifiesto: formData.numero_manifiesto || 'BORRADOR',
        fecha_emision: formData.fecha_emision,
        buque_id: Number(buqueIdFinal),
        responsable_principal_id: Number(motoristaIdFinal) || 0,
        responsable_secundario_id: Number(cocineroIdFinal) || null,
        estado_digitalizacion: 'pendiente',
        observaciones: formData.observaciones || null,
        pdf_manifiesto_url: null,
        imagen_manifiesto_url: null,
        updated_at: new Date().toISOString(),
        buque: buqueObj,
        responsable_principal: motoristaObj as any, // Cast para evitar conflictos estrictos de tipo en borrador
        responsable_secundario: cocineroObj as any,
        residuos: {
          id: 0,
          manifiesto_id: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          observaciones: null,
          ...residuos
        }
      };

      // 5. Generar PDF SIN firmas (Solo nombres escritos)
      const firmasVacias: FirmasManifiesto = {
        motoristaFirma: null,
        motoristaNombre: motoristaNombre || motoristaObj?.nombre,
        cocineroFirma: null,
        cocineroNombre: cocineroNombre || cocineroObj?.nombre,
        oficialFirma: null,
        liquidosFirma: null,
        liquidosNombre: liquidosNombre || personas.find(p => p.id === parseInt(formData.responsable_liquidos_id))?.nombre
      };

      const pdfBlob = await generarPDFManifiesto(borradorManifiesto, firmasVacias);

      // 6. Descargar
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
    } finally {
      setGenerandoPDF(null);
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
            oficialFirma: oficialSignature,
            liquidosFirma: liquidosSignature,
            liquidosNombre: liquidosNombre || (manifiesto.responsable_liquidos_id
              ? personas.find(p => p.id === manifiesto.responsable_liquidos_id)?.nombre
              : undefined)
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
          oficialFirma: oficialSignature,
          liquidosFirma: liquidosSignature,
          liquidosNombre: liquidosNombre || (manifiesto.responsable_liquidos_id
            ? personas.find(p => p.id === manifiesto.responsable_liquidos_id)?.nombre
            : undefined)
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
          oficialFirma: oficialSignature,
          liquidosFirma: liquidosSignature,
          liquidosNombre: liquidosNombre || (manifiesto.responsable_liquidos_id
            ? personas.find(p => p.id === manifiesto.responsable_liquidos_id)?.nombre
            : undefined)
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
  // Sólo para el texto de la barra de guardar
  const firmasListas = [oficialSignature, motoristaSignature, cocineroSignature, liquidosSignature].filter(Boolean).length;
  // En celular, con la pestaña "Registros" el formulario se oculta (y al revés)
  const soloEnNuevo = vistaMovil === 'registros' ? 'movil:hidden' : '';

  return (
    <div className="max-w-[1600px] space-y-6 movil:space-y-4">
      {/* Formulario de manifiesto — lenguaje de diseño SiMAR (ver DISEÑO_SIMAR.md) */}
      <div className="space-y-6 movil:space-y-4">
        {/* Encabezado del documento */}
        <header className="simar-aparece flex flex-wrap items-center gap-5 movil:gap-x-3 movil:gap-y-2">
          <span className="w-16 h-16 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center movil:w-[40px] movil:h-[40px] movil:self-start movil:mt-0.5">
            <FileText className="w-[30px] h-[30px] movil:w-[22px] movil:h-[22px]" strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-[240px] movil:min-w-0">
            <h1 className="text-[28px] md:text-[34px] font-extrabold leading-tight text-simar-texto movil:text-[19px]">Manifiesto de entrega-recepción</h1>
            <p className="mt-1 text-lg md:text-[19px] text-simar-texto-2 movil:mt-0 movil:text-[14px]">Puerto Peñasco, Sonora a {formData.fecha_emision ? parseFechaLocal(formData.fecha_emision).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
          </div>
          {formData.numero_manifiesto && (
            <div className={`px-5 py-2.5 rounded-2xl bg-simar-superficie border border-simar-borde shadow-simar text-right movil:w-full movil:flex movil:items-center movil:justify-between movil:px-4 movil:py-2 ${soloEnNuevo}`}>
              <p className="text-[15px] text-simar-texto-2">Folio No.</p>
              <p className="text-[21px] font-extrabold tracking-wide text-simar-texto">{formData.numero_manifiesto}</p>
            </div>
          )}
        </header>

        <PestanasMovil
          etiqueta="Vista del manifiesto"
          valor={vistaMovil}
          onCambiar={setVistaMovil}
          opciones={[
            { valor: 'nuevo', texto: 'Nuevo', icono: FilePlus2 },
            { valor: 'registros', texto: 'Registros', icono: List, conteo: manifiestos.length },
          ]}
        />

        {/* Manifiesto sin terminar (guardado solo en este equipo): se ofrece continuarlo */}
        {sinTerminar && (
          <div role="status" className={`simar-aparece rounded-2xl p-5 bg-simar-marea-suave flex flex-wrap items-center gap-x-4 gap-y-3 movil:p-3.5 movil:gap-x-3 ${soloEnNuevo}`}>
            <PenLine className="w-6 h-6 flex-shrink-0 text-simar-marea-tinta movil:w-5 movil:h-5" strokeWidth={2} />
            <div className="flex-1 min-w-[220px] movil:min-w-0">
              <p className="text-lg font-bold text-simar-texto movil:text-[15px]">Tienes un manifiesto sin terminar</p>
              <p className="text-base text-simar-texto-2 movil:text-[13px]">
                {describirSinTerminar(sinTerminar)} · {tiempoRelativo(new Date(sinTerminar.guardadoEn).toISOString()).toLowerCase()}
              </p>
            </div>
            <div className="flex gap-2.5 movil:w-full movil:gap-2">
              <button
                type="button"
                onClick={descartarSinTerminar}
                className="simar-presiona min-h-[52px] px-5 rounded-[16px] border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold hover:border-simar-marea-tinta transition-colors movil:flex-1 movil:min-h-[44px] movil:px-3 movil:text-[15px]"
              >
                Empezar de nuevo
              </button>
              <button
                type="button"
                onClick={continuarSinTerminar}
                className="simar-presiona min-h-[52px] px-6 rounded-[16px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold transition-colors movil:flex-1 movil:min-h-[44px] movil:px-3 movil:text-[15px]"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-[1.08fr_1fr] gap-6 movil:gap-4 ${soloEnNuevo}`}>
          {/* COLUMNA IZQUIERDA - Datos del formulario */}
          <section className="simar-aparece flex flex-col bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 md:p-7 movil:p-4" style={{ animationDelay: '0.06s' }}>
            <h2 className="text-[23px] font-extrabold text-simar-texto">Datos del manifiesto</h2>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-[210px_1fr] gap-4 movil:mt-3 movil:gap-3">
              {/* FECHA */}
              <div>
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Fecha</label>
                <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'fecha' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
                  <CalendarDays className="w-[22px] h-[22px] text-simar-texto-2 flex-shrink-0 pointer-events-none" />
                  <SelectorFecha
                    variante="incrustado"
                    etiqueta="Fecha del manifiesto"
                    valor={formData.fecha_emision}
                    onCambiar={(fecha) => fecha && setFormData({ ...formData, fecha_emision: fecha })}
                    onAbrir={() => setActiveField('fecha')}
                    onCerrar={() => setActiveField(null)}
                    className="text-xl"
                  />
                </div>
              </div>

              {/* NOMBRE DEL BARCO */}
              <div>
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Barco</label>
                <div className="relative">
                  <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${showValidation && !formData.buque_id ? 'border-simar-coral' : activeField === 'buque' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
                    <Search className="w-[22px] h-[22px] text-simar-texto-2 flex-shrink-0" />
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
                      className="flex-1 min-w-0 bg-transparent focus:outline-none text-xl font-bold text-simar-texto placeholder:text-simar-texto-3 placeholder:font-medium placeholder:text-lg"
                    />
                  </div>
                  {showBuqueSuggestions && (
                    <div className="absolute z-50 w-full mt-2 rounded-2xl border border-simar-borde bg-simar-superficie shadow-[0_16px_32px_-16px_rgba(11,34,54,0.45)] max-h-56 overflow-y-auto py-1">
                      {buques.filter(b => b.nombre_buque.toLowerCase().includes(buqueNombre.toLowerCase())).map((buque, index) => (
                        <div
                          key={buque.id}
                          onClick={() => {
                            setBuqueNombre(buque.nombre_buque);
                            setFormData({ ...formData, buque_id: buque.id.toString() });
                            setShowBuqueSuggestions(false);
                          }}
                          className={`px-4 py-3 cursor-pointer text-lg text-simar-texto ${index === selectedBuqueIndex ? 'bg-simar-marea-suave' : 'hover:bg-simar-papel'}`}
                        >
                          {buque.nombre_buque}
                          {buque.matricula && <span className="text-base text-simar-texto-2 ml-2">({buque.matricula})</span>}
                        </div>
                      ))}
                      {buques.filter(b => b.nombre_buque.toLowerCase().includes(buqueNombre.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-base text-simar-texto-2">No se encontraron embarcaciones</div>
                      )}
                    </div>
                  )}
                  {showValidation && !formData.buque_id && <p className="mt-1.5 text-[15px] font-bold text-simar-coral">* Seleccione una embarcación válida</p>}
                </div>
              </div>
            </div>

            {/* RESIDUOS (en celular, dos por fila: son números cortos con su unidad) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 movil:mt-3 movil:grid-cols-2 movil:gap-x-2.5 movil:gap-y-3">
              {/* ACEITE USADO */}
              <div>
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Aceite usado</label>
                <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'aceite' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
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
                    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[22px] font-extrabold text-simar-texto placeholder:text-simar-texto-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[17px] font-bold text-simar-texto-2">litros</span>
                </div>
              </div>

              {/* FILTROS DE ACEITE */}
              <div>
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Filtros de aceite</label>
                <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'filtrosAceite' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
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
                    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[22px] font-extrabold text-simar-texto placeholder:text-simar-texto-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[17px] font-bold text-simar-texto-2">piezas</span>
                </div>
              </div>

              {/* FILTROS DE DIESEL */}
              <div>
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Filtros de diésel</label>
                <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'filtrosDiesel' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
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
                    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[22px] font-extrabold text-simar-texto placeholder:text-simar-texto-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[17px] font-bold text-simar-texto-2">piezas</span>
                </div>
              </div>

              {/* FILTROS DE AIRE */}
              <div>
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Filtros de aire</label>
                <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'filtrosAire' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
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
                    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[22px] font-extrabold text-simar-texto placeholder:text-simar-texto-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[17px] font-bold text-simar-texto-2">piezas</span>
                </div>
              </div>

              {/* BASURA */}
              <div className="movil:col-span-2">
                <label className="block mb-2 text-[17px] font-bold text-simar-texto">Basura</label>
                <div className={`flex items-center gap-2.5 min-h-[60px] px-4 movil:px-3 movil:gap-2 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activeField === 'basura' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
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
                    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[22px] font-extrabold text-simar-texto placeholder:text-simar-texto-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[17px] font-bold text-simar-texto-2">kg</span>
                </div>
              </div>
            </div>

            {/* Observaciones (crece para que la tarjeta termine a la par de Firmas) */}
            <div className="mt-5 flex-1 flex flex-col movil:mt-3">
              <label className="block mb-2 text-[17px] font-bold text-simar-texto">Observaciones <span className="font-medium text-simar-texto-2">(opcional)</span></label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                onFocus={() => setActiveField('observaciones')}
                onBlur={() => setActiveField(null)}
                rows={3}
                placeholder="Notas adicionales..."
                className={`w-full flex-1 min-h-[120px] movil:min-h-[80px] px-4 py-3 rounded-[14px] border-2 bg-simar-superficie outline-none resize-none text-lg text-simar-texto placeholder:text-simar-texto-3 transition-colors ${activeField === 'observaciones' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}
              />
            </div>
          </section>

          {/* COLUMNA DERECHA - Firmas */}
          <div className="flex flex-col">
            <section className="simar-aparece flex-1 bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] px-6 md:px-7 pt-6 pb-2 movil:px-4 movil:pt-4 movil:pb-0" style={{ animationDelay: '0.12s' }}>
              <h2 className="text-[23px] font-extrabold text-simar-texto">Firmas</h2>

              {/* FIRMA OFICIAL COMISIONADO */}
              <div className="py-4 border-b border-simar-borde-suave">
                <p className="text-lg font-extrabold text-simar-texto">Recibe: Oficial comisionado</p>
                <p className="text-[15px] text-simar-texto-2">Recolección de basura y residuos aceitosos (MARPOL Anexo V)</p>
                <div className="mt-3">
                  {!oficialSignature ? (
                    <button
                      type="button"
                      onClick={() => openSignatureModal('oficial')}
                      className="w-full min-h-[60px] movil:px-4 rounded-[14px] border-2 border-dashed border-simar-campo-borde bg-simar-marea-suave/50 text-simar-marea-tinta text-lg font-bold flex items-center justify-center gap-2 hover:border-simar-marea-tinta transition-colors"
                    >
                      <PenLine className="w-5 h-5" />
                      Firmar
                    </button>
                  ) : (
                    <div>
                      <div className="rounded-[14px] border-2 border-simar-arrecife/40 bg-white p-2">
                        <img src={oficialSignature} alt="Firma Oficial" className="w-full h-16 object-contain" />
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="simar-confirma flex items-center gap-1.5 text-[15px] font-bold text-simar-arrecife-tinta"><PalomitaAnimada tamano={20} circulo={false} />Firmado</span>
                        <span className="flex gap-4">
                          <button type="button" onClick={() => openSignatureModal('oficial')} className="min-h-[44px] text-[15px] font-bold text-simar-marea-tinta hover:underline">Editar</button>
                          <button type="button" onClick={() => setOficialSignature(null)} className="min-h-[44px] text-[15px] font-bold text-simar-coral hover:underline">Eliminar</button>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FIRMA MOTORISTA */}
              <div className="py-4 border-b border-simar-borde-suave">
                <p className="flex items-baseline gap-2.5"><span className="text-lg font-extrabold text-simar-texto">Motorista</span><span className="text-[15px] font-bold text-simar-coral">Requerido</span></p>
                <p className="text-[15px] text-simar-texto-2">Responsable de entrega de líquidos</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3 items-start movil:grid-cols-[1fr_auto] movil:gap-2">
                  <div className="relative">
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
                      className={`w-full min-h-[60px] px-4 rounded-[14px] border-2 bg-simar-superficie focus:outline-none text-lg font-bold text-simar-texto placeholder:text-simar-texto-3 placeholder:font-medium transition-colors ${showValidation && !formData.responsable_principal_id ? 'border-simar-coral' : activeField === 'motorista' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}
                    />
                    {showMotoristaSuggestions && (
                      <div className="absolute z-30 w-full mt-2 rounded-2xl border border-simar-borde bg-simar-superficie shadow-[0_16px_32px_-16px_rgba(11,34,54,0.45)] max-h-48 overflow-y-auto py-1">
                        {personas.filter(p => p.nombre.toLowerCase().includes(motoristaNombre.toLowerCase())).map((persona, index) => (
                          <div key={persona.id} onClick={() => { setMotoristaNombre(persona.nombre); setFormData({ ...formData, responsable_principal_id: persona.id.toString() }); setShowMotoristaSuggestions(false); }}
                            className={`px-4 py-3 cursor-pointer text-lg text-simar-texto ${index === selectedSuggestionIndex ? 'bg-simar-marea-suave' : 'hover:bg-simar-papel'}`}>
                            {persona.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                    {showValidation && !formData.responsable_principal_id && <p className="mt-1.5 text-[15px] font-bold text-simar-coral">* Requerido</p>}
                  </div>

                  <div className={motoristaSignature ? 'movil:col-span-2' : ''}>
                    {!motoristaSignature ? (
                      <button type="button" onClick={() => openSignatureModal('motorista')}
                        className="w-full min-h-[60px] movil:px-4 rounded-[14px] border-2 border-dashed border-simar-campo-borde bg-simar-marea-suave/50 text-simar-marea-tinta text-lg font-bold flex items-center justify-center gap-2 hover:border-simar-marea-tinta transition-colors">
                        <PenLine className="w-5 h-5" />
                        Firmar
                      </button>
                    ) : (
                      <div>
                        <div className="rounded-[14px] border-2 border-simar-arrecife/40 bg-white p-1.5">
                          <img src={motoristaSignature} alt="Firma Motorista" className="w-full h-12 object-contain" />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="simar-confirma flex items-center gap-1 text-[15px] font-bold text-simar-arrecife-tinta"><PalomitaAnimada tamano={17} circulo={false} />Firmado</span>
                          <span className="flex gap-3">
                            <button type="button" onClick={() => openSignatureModal('motorista')} className="min-h-[44px] text-[15px] font-bold text-simar-marea-tinta hover:underline">Editar</button>
                            <button type="button" onClick={() => setMotoristaSignature(null)} className="min-h-[44px] text-[15px] font-bold text-simar-coral hover:underline">Eliminar</button>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FIRMA COCINERO */}
              <div className="py-4 border-b border-simar-borde-suave">
                <p className="flex items-baseline gap-2.5"><span className="text-lg font-extrabold text-simar-texto">Cocinero</span><span className="text-[15px] text-simar-texto-2">Opcional</span></p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3 items-start movil:grid-cols-[1fr_auto] movil:gap-2">
                  <div className="relative">
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
                      className={`w-full min-h-[60px] px-4 rounded-[14px] border-2 bg-simar-superficie focus:outline-none text-lg font-bold text-simar-texto placeholder:text-simar-texto-3 placeholder:font-medium transition-colors ${activeField === 'cocinero' ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}
                    />
                    {showCocineroSuggestions && (
                      <div className="absolute z-30 w-full mt-2 rounded-2xl border border-simar-borde bg-simar-superficie shadow-[0_16px_32px_-16px_rgba(11,34,54,0.45)] max-h-48 overflow-y-auto py-1">
                        {personas.filter(p => p.id !== parseInt(formData.responsable_principal_id)).filter(p => p.nombre.toLowerCase().includes(cocineroNombre.toLowerCase())).map((persona, index) => (
                          <div key={persona.id} onClick={() => { setCocineroNombre(persona.nombre); setFormData({ ...formData, responsable_secundario_id: persona.id.toString() }); setShowCocineroSuggestions(false); }}
                            className={`px-4 py-3 cursor-pointer text-lg text-simar-texto ${index === selectedSuggestionIndex ? 'bg-simar-marea-suave' : 'hover:bg-simar-papel'}`}>
                            {persona.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={cocineroSignature ? 'movil:col-span-2' : ''}>
                    {!cocineroSignature ? (
                      <button type="button" onClick={() => openSignatureModal('cocinero')}
                        className="w-full min-h-[60px] movil:px-4 rounded-[14px] border-2 border-dashed border-simar-campo-borde bg-simar-marea-suave/50 text-simar-marea-tinta text-lg font-bold flex items-center justify-center gap-2 hover:border-simar-marea-tinta transition-colors">
                        <PenLine className="w-5 h-5" />
                        Firmar
                      </button>
                    ) : (
                      <div>
                        <div className="rounded-[14px] border-2 border-simar-arrecife/40 bg-white p-1.5">
                          <img src={cocineroSignature} alt="Firma Cocinero" className="w-full h-12 object-contain" />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="simar-confirma flex items-center gap-1 text-[15px] font-bold text-simar-arrecife-tinta"><PalomitaAnimada tamano={17} circulo={false} />Firmado</span>
                          <span className="flex gap-3">
                            <button type="button" onClick={() => openSignatureModal('cocinero')} className="min-h-[44px] text-[15px] font-bold text-simar-marea-tinta hover:underline">Editar</button>
                            <button type="button" onClick={() => setCocineroSignature(null)} className="min-h-[44px] text-[15px] font-bold text-simar-coral hover:underline">Eliminar</button>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FIRMA RESPONSABLE DE LÍQUIDOS */}
              <div className="py-4">
                <p className="flex items-baseline gap-2.5"><span className="text-lg font-extrabold text-simar-texto">Resp. de líquidos</span><span className="text-[15px] text-simar-texto-2">Opcional</span></p>
                <p className="text-[15px] text-simar-texto-2">Responsable de entrega de líquidos (aceite usado)</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3 items-start movil:grid-cols-[1fr_auto] movil:gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={liquidosNombre}
                      placeholder="Nombre"
                      onChange={(e) => {
                        const value = e.target.value;
                        setLiquidosNombre(value);
                        setShowLiquidosSuggestions(value.length > 0);
                        const personaExacta = personas.find(p => p.nombre.toLowerCase() === value.toLowerCase());
                        if (personaExacta) {
                          setFormData({ ...formData, responsable_liquidos_id: personaExacta.id.toString() });
                        } else {
                          setFormData({ ...formData, responsable_liquidos_id: '' });
                        }
                      }}
                      onFocus={() => { if (liquidosNombre.length > 0) setShowLiquidosSuggestions(true); }}
                      onBlur={() => { setTimeout(() => setShowLiquidosSuggestions(false), 200); }}
                      className="w-full min-h-[60px] px-4 rounded-[14px] border-2 border-simar-campo-borde focus:border-simar-marea-tinta bg-simar-superficie focus:outline-none text-lg font-bold text-simar-texto placeholder:text-simar-texto-3 placeholder:font-medium transition-colors"
                    />
                    {showLiquidosSuggestions && (
                      <div className="absolute z-30 w-full mt-2 rounded-2xl border border-simar-borde bg-simar-superficie shadow-[0_16px_32px_-16px_rgba(11,34,54,0.45)] max-h-48 overflow-y-auto py-1">
                        {personas.filter(p => p.nombre.toLowerCase().includes(liquidosNombre.toLowerCase())).map((persona) => (
                          <div key={persona.id} onClick={() => { setLiquidosNombre(persona.nombre); setFormData({ ...formData, responsable_liquidos_id: persona.id.toString() }); setShowLiquidosSuggestions(false); }}
                            className="px-4 py-3 cursor-pointer text-lg text-simar-texto hover:bg-simar-papel">
                            {persona.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={liquidosSignature ? 'movil:col-span-2' : ''}>
                    {!liquidosSignature ? (
                      <button type="button" onClick={() => openSignatureModal('liquidos')}
                        className="w-full min-h-[60px] movil:px-4 rounded-[14px] border-2 border-dashed border-simar-campo-borde bg-simar-marea-suave/50 text-simar-marea-tinta text-lg font-bold flex items-center justify-center gap-2 hover:border-simar-marea-tinta transition-colors">
                        <PenLine className="w-5 h-5" />
                        Firmar
                      </button>
                    ) : (
                      <div>
                        <div className="rounded-[14px] border-2 border-simar-arrecife/40 bg-white p-1.5">
                          <img src={liquidosSignature} alt="Firma Líquidos" className="w-full h-12 object-contain" />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="simar-confirma flex items-center gap-1 text-[15px] font-bold text-simar-arrecife-tinta"><PalomitaAnimada tamano={17} circulo={false} />Firmado</span>
                          <span className="flex gap-3">
                            <button type="button" onClick={() => openSignatureModal('liquidos')} className="min-h-[44px] text-[15px] font-bold text-simar-marea-tinta hover:underline">Editar</button>
                            <button type="button" onClick={() => setLiquidosSignature(null)} className="min-h-[44px] text-[15px] font-bold text-simar-coral hover:underline">Eliminar</button>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Adjuntar documento y descargar borrador */}
        <section className={`simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 md:p-7 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-7 movil:p-4 movil:gap-3 ${soloEnNuevo}`} style={{ animationDelay: '0.18s' }}>
          <div className="flex items-center gap-3 lg:w-[290px] flex-shrink-0">
            <span className="w-12 h-12 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center movil:w-10 movil:h-10">
              <Upload className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-simar-texto">Adjuntar documento</h2>
              {archivoPorAdjuntar && !archivo ? (
                // Se continuó un manifiesto sin terminar que tenía un archivo: el archivo no se guarda
                <p className="text-[15px] font-bold text-simar-coral">Vuelve a adjuntar «{archivoPorAdjuntar}»</p>
              ) : (
                <p className="text-[15px] text-simar-texto-2">Opcional · documento escaneado</p>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 movil:grid-cols-2 movil:gap-2">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative min-h-[64px] rounded-[14px] p-2 flex items-center justify-center transition-colors ${dragActive ? 'bg-simar-marea-suave border-2 border-dashed border-simar-marea-tinta' : archivo ? 'bg-simar-arrecife-suave border-2 border-simar-arrecife/50' : 'border-2 border-dashed border-simar-campo-borde'}`}
            >
              <input type="file" id="file-upload" onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />

              {!archivo ? (
                <label htmlFor="file-upload" className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 text-[17px] font-bold text-simar-texto cursor-pointer movil:text-center">
                  <Upload className="w-5 h-5" />
                  Elegir archivo
                </label>
              ) : (
                <div className="w-full flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <PalomitaAnimada tamano={20} circulo={false} className="text-simar-arrecife-tinta" />
                    <span className="text-[15px] font-bold text-simar-texto truncate">{archivo.name}</span>
                  </div>
                  <button type="button" onClick={() => setArchivo(null)} className="min-h-[44px] px-3 text-[15px] font-bold text-simar-coral hover:underline">Quitar</button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDescargarBorrador}
              className="min-h-[64px] px-4 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto flex items-center gap-2.5 text-left hover:border-simar-marea-tinta transition-colors movil:px-3 movil:gap-2 movil:py-2"
              title="Descargar datos actuales para firmar"
            >
              <Download className="w-5 h-5 flex-shrink-0" />
              <span>
                <span className="block text-[17px] font-bold leading-tight">Descargar borrador</span>
                <span className="block text-[15px] text-simar-texto-2 leading-tight movil:text-[13px]">Imprimir y firmar a mano</span>
              </span>
            </button>
          </div>
        </section>

        {/* Barra de guardar (vidrio, flota sobre el formulario) */}
        {/* En celular va en una sola fila: estado corto a la izquierda y el botón a la derecha */}
        <div className={`simar-vidrio simar-pegada-abajo sticky z-20 rounded-[28px] p-3 md:pl-7 flex flex-wrap items-center gap-3 movil:flex-nowrap movil:gap-2 movil:p-2 movil:pl-4 ${soloEnNuevo}`}>
          <span className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px] px-2 sm:px-0 text-base sm:text-lg text-simar-texto movil:w-auto movil:flex-1 movil:min-w-0 movil:px-0 movil:text-[14px] movil:leading-snug">
            {firmasListas === 0
              ? <><span className="movil:hidden">Aún no hay firmas. También puedes adjuntar el documento firmado.</span><span className="hidden movil:inline">Aún no hay firmas.</span></>
              : firmasListas === 1 ? '1 firma lista.' : `${firmasListas} firmas listas.`}
          </span>
          <button
            onClick={() => document.getElementById('registros-list')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden sm:flex min-h-[60px] px-6 rounded-[18px] border-2 border-simar-texto bg-white/60 dark:bg-white/5 text-simar-texto text-lg font-bold items-center gap-2.5 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
          >
            <List className="w-[22px] h-[22px]" />
            Ver registros
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="simar-presiona w-full sm:w-auto min-h-[60px] px-7 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[19px] font-extrabold flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed movil:w-auto movil:flex-shrink-0 movil:px-5"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-[22px] h-[22px]" strokeWidth={2.6} />
                <span>Guardar manifiesto</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabla de Manifiestos */}
      <div id="registros-list" className={`bg-simar-superficie rounded-[28px] border border-simar-borde shadow-simar p-5 sm:p-7 movil:p-4 ${vistaMovil === 'nuevo' ? 'movil:hidden' : ''}`}>
        <div className="mb-4 sm:mb-6 movil:mb-3">
          <h2 className="text-2xl sm:text-[26px] font-extrabold text-simar-texto break-words">Manifiestos registrados</h2>
          <p className="text-simar-texto-2 mt-1 text-base sm:text-lg movil:hidden">Lista de todos los manifiestos creados en el sistema</p>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 space-y-4 movil:mb-3 movil:space-y-3">
          {/* Barra de búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-simar-texto-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número, buque, motorista, cocinero..."
              className="block w-full min-h-[56px] pl-11 pr-12 border-2 border-simar-campo-borde rounded-2xl bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Borrar búsqueda"
                className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-simar-texto-3 hover:text-simar-texto"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Botones de filtros (en celular, una sola fila que se desliza de lado) */}
          <div className="simar-desliza flex flex-wrap gap-2 movil:flex-nowrap movil:overflow-x-auto movil:-mx-4 movil:px-4">
            <button
              onClick={() => { setFiltroActivo('todos'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`min-h-[48px] px-5 rounded-full text-base font-bold transition-colors whitespace-nowrap flex-shrink-0 movil:px-4 ${filtroActivo === 'todos'
                ? 'bg-simar-marea text-white'
                : 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => { setFiltroActivo('buque'); setShowFiltroFecha(false); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`min-h-[48px] px-5 rounded-full text-base font-bold transition-colors whitespace-nowrap flex-shrink-0 movil:px-4 ${filtroActivo === 'buque'
                ? 'bg-simar-marea text-white'
                : 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta'
                }`}
            >
              Por buque
            </button>
            <button
              onClick={() => { setFiltroActivo('motorista'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionCocinero(null); }}
              className={`min-h-[48px] px-5 rounded-full text-base font-bold transition-colors whitespace-nowrap flex-shrink-0 movil:px-4 ${filtroActivo === 'motorista'
                ? 'bg-simar-marea text-white'
                : 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta'
                }`}
            >
              Por motorista
            </button>
            <button
              onClick={() => { setFiltroActivo('cocinero'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); }}
              className={`min-h-[48px] px-5 rounded-full text-base font-bold transition-colors whitespace-nowrap flex-shrink-0 movil:px-4 ${filtroActivo === 'cocinero'
                ? 'bg-simar-marea text-white'
                : 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta'
                }`}
            >
              Por cocinero
            </button>
            <button
              onClick={() => { setFiltroActivo('numero'); setShowFiltroFecha(false); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`min-h-[48px] px-5 rounded-full text-base font-bold transition-colors whitespace-nowrap flex-shrink-0 movil:px-4 ${filtroActivo === 'numero'
                ? 'bg-simar-marea text-white'
                : 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta'
                }`}
            >
              Por número
            </button>
            <button
              onClick={() => { setFiltroActivo('fecha'); setShowFiltroFecha(!showFiltroFecha); setFiltroSeleccionBuque(null); setFiltroSeleccionMotorista(null); setFiltroSeleccionCocinero(null); }}
              className={`min-h-[48px] px-5 rounded-full text-base font-bold transition-colors whitespace-nowrap flex-shrink-0 movil:px-4 ${filtroActivo === 'fecha'
                ? 'bg-simar-marea text-white'
                : 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta'
                }`}
            >
              Por fecha
            </button>

            {/* Limpiar filtros */}
            {(searchQuery || filtroActivo !== 'todos' || fechaFiltroInicio || fechaFiltroFin || filtroSeleccionBuque || filtroSeleccionMotorista || filtroSeleccionCocinero) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFiltroActivo('todos');
                  setFechaFiltroInicio('');
                  setFechaFiltroFin('');
                  setShowFiltroFecha(false);
                  setFiltroSeleccionBuque(null);
                  setFiltroSeleccionMotorista(null);
                  setFiltroSeleccionCocinero(null);
                }}
                className="min-h-[48px] px-5 rounded-full text-base font-bold bg-simar-coral-suave text-simar-coral hover:underline whitespace-nowrap flex-shrink-0 movil:px-4"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Selector de Buque */}
          {filtroActivo === 'buque' && (
            <div className="p-4 bg-simar-papel rounded-2xl border border-simar-borde">
              <label className="block text-[17px] font-bold text-simar-texto mb-2">Selecciona un buque</label>
              <select
                value={filtroSeleccionBuque || ''}
                onChange={(e) => setFiltroSeleccionBuque(e.target.value ? Number(e.target.value) : null)}
                className="w-full min-h-[56px] px-4 border-2 border-simar-campo-borde rounded-xl bg-simar-superficie text-lg text-simar-texto focus:outline-none focus:border-simar-marea-tinta"
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
            <div className="p-4 bg-simar-papel rounded-2xl border border-simar-borde">
              <label className="block text-[17px] font-bold text-simar-texto mb-2">Selecciona un motorista</label>
              <select
                value={filtroSeleccionMotorista || ''}
                onChange={(e) => setFiltroSeleccionMotorista(e.target.value ? Number(e.target.value) : null)}
                className="w-full min-h-[56px] px-4 border-2 border-simar-campo-borde rounded-xl bg-simar-superficie text-lg text-simar-texto focus:outline-none focus:border-simar-marea-tinta"
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
            <div className="p-4 bg-simar-papel rounded-2xl border border-simar-borde">
              <label className="block text-[17px] font-bold text-simar-texto mb-2">Selecciona un cocinero</label>
              <select
                value={filtroSeleccionCocinero || ''}
                onChange={(e) => setFiltroSeleccionCocinero(e.target.value ? Number(e.target.value) : null)}
                className="w-full min-h-[56px] px-4 border-2 border-simar-campo-borde rounded-xl bg-simar-superficie text-lg text-simar-texto focus:outline-none focus:border-simar-marea-tinta"
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
            // En celular las dos fechas lado a lado, con su palabra encima
            <div className="flex flex-wrap items-center gap-4 p-4 bg-simar-papel rounded-2xl border border-simar-borde movil:grid movil:grid-cols-2 movil:gap-2 movil:p-3">
              <label className="flex items-center gap-3 movil:flex-col movil:items-stretch movil:gap-1.5">
                <span className="text-[17px] font-bold text-simar-texto">Desde</span>
                <SelectorFecha
                  etiqueta="Desde"
                  valor={fechaFiltroInicio}
                  onCambiar={setFechaFiltroInicio}
                  max={fechaFiltroFin || undefined}
                  rango={{ desde: fechaFiltroInicio, hasta: fechaFiltroFin }}
                  borrable
                  className="w-56 movil:w-full"
                />
              </label>
              <label className="flex items-center gap-3 movil:flex-col movil:items-stretch movil:gap-1.5">
                <span className="text-[17px] font-bold text-simar-texto">Hasta</span>
                <SelectorFecha
                  etiqueta="Hasta"
                  valor={fechaFiltroFin}
                  onCambiar={setFechaFiltroFin}
                  min={fechaFiltroInicio || undefined}
                  rango={{ desde: fechaFiltroInicio, hasta: fechaFiltroFin }}
                  borrable
                  className="w-56 movil:w-full"
                />
              </label>
            </div>
          )}

          {/* Indicador de resultados */}
          <div className="flex items-center justify-between text-base text-simar-texto-2">
            <span>
              {manifiestosFiltrados.length < manifiestos.length
                ? <><strong className="text-simar-texto">{manifiestosFiltrados.length}</strong> resultado{manifiestosFiltrados.length !== 1 ? 's' : ''} de {manifiestos.length}</>
                : <><strong className="text-simar-texto">{manifiestos.length}</strong> manifiestos en total</>
              }
            </span>
            <span className="text-[15px]">
              Página <strong className="text-simar-texto">{currentPage}</strong> de {totalPages}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-simar-marea border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (<>
          <div className="sm:overflow-x-auto sm:-mx-4 md:mx-0">
            <div className="sm:inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-xl border border-simar-borde shadow-sm">
                <table className="w-full border-collapse block sm:table">
                  <thead className="hidden sm:table-header-group">
                    <tr className="bg-simar-papel border-b border-simar-borde">
                      <th className="px-4 md:px-5 py-3 text-left text-[15px] font-bold text-simar-texto-2">Número</th>
                      <th className="px-4 md:px-5 py-3 text-left text-[15px] font-bold text-simar-texto-2">Buque</th>
                      <th className="px-4 md:px-5 py-3 text-left text-[15px] font-bold text-simar-texto-2 hidden md:table-cell">Motorista</th>
                      <th className="px-4 md:px-5 py-3 text-left text-[15px] font-bold text-simar-texto-2 hidden lg:table-cell">Cocinero</th>
                      <th className="px-4 md:px-5 py-3 text-left text-[15px] font-bold text-simar-texto-2 hidden sm:table-cell">Fecha</th>
                      <th className="px-4 md:px-5 py-3 text-right text-[15px] font-bold text-simar-texto-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="block sm:table-row-group divide-y divide-simar-borde-suave">
                    {manifiestos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-simar-texto-3">
                            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-bold text-simar-texto">No hay manifiestos registrados</p>
                            <p className="text-base text-simar-texto-2">Complete el formulario arriba para crear uno nuevo</p>
                          </div>
                        </td>
                      </tr>
                    ) : manifiestosPagina.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-simar-texto-3">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-lg font-bold text-simar-texto">Sin resultados para esta búsqueda</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      manifiestosPagina.map((manifiesto, idx) => {
                        const buqueNombre = manifiesto.buque?.nombre_buque ||
                          buques.find(b => b.id === manifiesto.buque_id)?.nombre_buque || 'N/A';
                        const respPrincipal = manifiesto.responsable_principal?.nombre ||
                          personas.find(p => p.id === manifiesto.responsable_principal_id)?.nombre || 'N/A';
                        const respSecundario = manifiesto.responsable_secundario?.nombre ||
                          (manifiesto.responsable_secundario_id
                            ? personas.find(p => p.id === manifiesto.responsable_secundario_id)?.nombre
                            : null);

                        return (
                          <tr
                            key={manifiesto.id}
                            className="group block sm:table-row bg-simar-superficie hover:bg-simar-papel transition-colors duration-150 movil:relative"
                            style={{ animationDelay: `${idx * 20}ms` }}
                          >
                            <td className="block sm:table-cell px-4 pt-4 sm:pt-3.5 pb-0 sm:pb-3.5 md:px-5 movil:px-3.5 movil:pt-3 movil:pb-3">
                              {/* En celular las acciones van a la derecha de esta primera línea (ver la última celda) */}
                              <span className="inline-flex items-center gap-1.5 font-mono text-[15px] font-bold text-simar-marea-tinta bg-simar-marea-suave px-2.5 py-1 rounded-lg whitespace-nowrap movil:mt-[5px] movil:inline-block movil:align-top movil:truncate movil:max-w-[calc(100%-148px)] movil:text-[13px] movil:px-2">
                                {manifiesto.numero_manifiesto}
                              </span>
                              {/* En celular: barco y fecha debajo del folio (sin columnas que se corten) */}
                              <p className="sm:hidden mt-2 text-[17px] font-bold text-simar-texto movil:mt-2.5 movil:text-[15px]">
                                {buqueNombre}
                                <span className="font-normal text-simar-texto-2">
                                  {' · '}
                                  {parseFechaLocal(manifiesto.fecha_emision).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </p>
                              <p className="sm:hidden text-[15px] text-simar-texto-2 movil:text-[14px] movil:truncate">Motorista: {respPrincipal}</p>
                            </td>
                            <td className="hidden sm:table-cell px-4 md:px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-simar-papel flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-simar-texto-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                                  </svg>
                                </div>
                                <span className="text-base font-bold text-simar-texto truncate max-w-[160px]">{buqueNombre}</span>
                              </div>
                            </td>
                            <td className="px-4 md:px-5 py-3.5 hidden md:table-cell">
                              <span className="text-base text-simar-texto">{respPrincipal}</span>
                            </td>
                            <td className="px-4 md:px-5 py-3.5 hidden lg:table-cell">
                              <span className="text-base text-simar-texto-2">{respSecundario || <span className="text-simar-texto-3">—</span>}</span>
                            </td>
                            <td className="px-4 md:px-5 py-3.5 hidden sm:table-cell">
                              <span className="text-base text-simar-texto-2 whitespace-nowrap">
                                {parseFechaLocal(manifiesto.fecha_emision).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="block sm:table-cell px-4 pt-3 pb-4 sm:py-3.5 md:px-5 movil:absolute movil:top-[10px] movil:right-3 movil:p-0">
                              <div className="flex items-center justify-start sm:justify-end gap-2 movil:gap-1.5">
                                <button
                                  onClick={() => setViewingManifiesto(manifiesto)}
                                  className="min-h-[44px] flex items-center gap-1.5 px-3.5 text-[15px] font-bold text-simar-texto border-2 border-simar-campo-borde rounded-xl bg-simar-superficie hover:border-simar-marea-tinta transition-colors whitespace-nowrap movil:px-3"
                                  title="Ver detalles"
                                >
                                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>Ver</span>
                                </button>
                                <button
                                  onClick={() => handleDescargarPDF(manifiesto)}
                                  disabled={generandoPDF === manifiesto.id.toString()}
                                  aria-label={t('acciones.descargarPDF')}
                                  className="w-11 h-11 flex items-center justify-center bg-simar-marea text-white rounded-xl hover:bg-simar-marea-hover transition-colors disabled:opacity-60 disabled:cursor-wait"
                                  title={t('acciones.descargarPDF')}
                                >
                                  {generandoPDF === manifiesto.id.toString() ? (
                                    <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(manifiesto.id)}
                                  className="w-11 h-11 flex items-center justify-center bg-simar-coral-suave text-simar-coral rounded-xl hover:bg-simar-coral hover:text-white transition-colors"
                                  title="Eliminar"
                                  aria-label="Eliminar"
                                >
                                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-simar-borde-suave">
              <span className="text-base text-simar-texto-2">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, manifiestosFiltrados.length)} de {manifiestosFiltrados.length}
              </span>

              <div className="flex items-center gap-1">
                {/* Anterior */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border-2 border-simar-campo-borde text-simar-texto hover:border-simar-marea-tinta disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Números de página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="w-11 h-11 flex items-center justify-center text-base text-simar-texto-3">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl text-base font-bold transition-colors ${
                          currentPage === p
                            ? 'bg-simar-marea text-white'
                            : 'border-2 border-simar-campo-borde text-simar-texto hover:border-simar-marea-tinta'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                {/* Siguiente */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border-2 border-simar-campo-borde text-simar-texto hover:border-simar-marea-tinta disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>)}
      </div>

      {/* Modal de visualización de detalles */}
      {viewingManifiesto && (
        <div className="simar-velo fixed inset-0 z-50 overflow-y-auto bg-[rgba(11,34,54,0.72)] backdrop-blur-sm">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="simar-ventana relative w-full max-w-5xl flex flex-col gap-6 my-8">

              {/* Botón de cierre flotante */}
              <div className="flex justify-end sticky top-0 z-10 pt-2 pr-2">
                <button
                  onClick={() => setViewingManifiesto(null)}
                  aria-label="Cerrar detalles"
                  className="simar-vidrio-fuerte w-14 h-14 rounded-full text-simar-texto flex items-center justify-center"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Card 1: Información General */}
              <div className="bg-simar-superficie rounded-[28px] shadow-2xl p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl sm:text-[28px] font-extrabold text-simar-texto flex items-center gap-3">
                    <div className="p-2.5 bg-simar-marea-suave rounded-full text-simar-marea-tinta">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      Detalles del manifiesto
                      <span className="block text-base font-normal text-simar-texto-2 mt-1">#{viewingManifiesto.numero_manifiesto}</span>
                    </div>
                  </h3>
                  {/* Status Badge */}
                  <span className={`px-4 py-1.5 rounded-full text-[15px] font-bold capitalize ${viewingManifiesto.estado_digitalizacion === 'completado'
                    ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta'
                    : viewingManifiesto.estado_digitalizacion === 'en_proceso'
                      ? 'bg-simar-coral-suave text-simar-coral'
                      : 'bg-simar-papel text-simar-texto-2'
                    }`}>
                    {viewingManifiesto.estado_digitalizacion?.replace('_', ' ') || 'Pendiente'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Fecha */}
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-simar-texto-2">Fecha de emisión</p>
                    <p className="text-simar-texto font-medium text-lg">
                      {new Date(viewingManifiesto.fecha_emision + 'T12:00:00').toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Buque */}
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-simar-texto-2">Buque</p>
                    <p className="text-simar-texto font-medium text-lg">
                      {viewingManifiesto.buque?.nombre_buque || buques.find(b => b.id === viewingManifiesto.buque_id)?.nombre_buque || 'N/A'}
                    </p>
                  </div>

                  {/* Motorista */}
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-simar-texto-2">Motorista</p>
                    <p className="text-simar-texto font-medium text-lg truncate" title={viewingManifiesto.responsable_principal?.nombre}>
                      {viewingManifiesto.responsable_principal?.nombre || personas.find(p => p.id === viewingManifiesto.responsable_principal_id)?.nombre || 'N/A'}
                    </p>
                  </div>

                  {/* Cocinero (Optional) */}
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-simar-texto-2">Cocinero</p>
                    <p className="text-simar-texto font-medium text-lg truncate">
                      {viewingManifiesto.responsable_secundario?.nombre || (viewingManifiesto.responsable_secundario_id ? personas.find(p => p.id === viewingManifiesto.responsable_secundario_id)?.nombre : 'N/A')}
                    </p>
                  </div>

                  {/* Observaciones */}
                  {(viewingManifiesto.observaciones) && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-[15px] font-bold text-simar-texto-2">Observaciones</p>
                      <p className="text-simar-texto bg-simar-papel p-3 rounded-lg border border-simar-borde-suave text-sm leading-relaxed">
                        {viewingManifiesto.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Residuos Section - Styled as Highlighted Stats */}
                <div className="mt-8 pt-8 border-t border-simar-borde-suave">
                  <h4 className="text-lg font-extrabold text-simar-texto mb-5">Residuos recolectados</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-simar-marea-suave p-4 rounded-2xl text-center">
                      <p className="text-3xl font-extrabold text-simar-marea-tinta mb-1">{viewingManifiesto.residuos?.aceite_usado || 0}</p>
                      <p className="text-[15px] font-bold text-simar-texto-2">Aceite (L)</p>
                    </div>
                    <div className="bg-simar-papel p-4 rounded-2xl border border-simar-borde text-center">
                      <p className="text-3xl font-extrabold text-simar-texto mb-1">{viewingManifiesto.residuos?.filtros_aceite || 0}</p>
                      <p className="text-[15px] font-bold text-simar-texto-2">Filtros de aceite</p>
                    </div>
                    <div className="bg-simar-papel p-4 rounded-2xl border border-simar-borde text-center">
                      <p className="text-3xl font-extrabold text-simar-texto mb-1">{viewingManifiesto.residuos?.filtros_diesel || 0}</p>
                      <p className="text-[15px] font-bold text-simar-texto-2">Filtros de diésel</p>
                    </div>
                    <div className="bg-simar-papel p-4 rounded-2xl border border-simar-borde text-center">
                      <p className="text-3xl font-extrabold text-simar-texto mb-1">{viewingManifiesto.residuos?.basura || 0}</p>
                      <p className="text-[15px] font-bold text-simar-texto-2">Basura (kg)</p>
                    </div>
                    {/* Extras if needed */}
                  </div>
                </div>
              </div>

              {/* Card 2: Documento Digitalizado */}
              <div className="bg-simar-superficie rounded-[28px] shadow-2xl overflow-hidden flex-col">
                <div className="p-4 sm:p-6 border-b border-simar-borde-suave flex justify-between items-center bg-simar-papel">
                  <h3 className="text-lg font-extrabold text-simar-texto flex items-center gap-2">
                    <svg className="w-5 h-5 text-simar-texto-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Documento digitalizado
                  </h3>
                  {(viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url) && (
                    <a
                      href={viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] text-base text-simar-marea-tinta font-bold flex items-center gap-1.5 hover:underline"
                    >
                      Abrir original
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>

                <div className="bg-simar-papel min-h-[500px] p-4 flex justify-center items-center">
                  {(viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url) ? (
                    (() => {
                      const url = viewingManifiesto.pdf_manifiesto_url || viewingManifiesto.imagen_manifiesto_url;
                      if (!url) return null;
                      const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('.pdf');
                      if (isPdf) {
                        return (
                          <iframe
                            src={url}
                            className="w-full min-h-[1200px] rounded-lg border border-simar-campo-borde shadow-md"
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
                    <div className="text-center text-simar-texto-3">
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
            className="simar-velo absolute inset-0 bg-[rgba(11,34,54,0.55)]"
            onClick={closeSignatureModal}
          />

          {/* Panel de firma */}
          <div className="simar-ventana relative w-full max-w-2xl bg-simar-superficie rounded-[28px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex-shrink-0 bg-simar-marea-suave rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[22px] font-extrabold text-simar-texto leading-tight">{getSignatureModalTitle()}</h3>
                  <p className="text-simar-texto-2 text-[17px]">Dibuje su firma en el área de abajo</p>
                </div>
              </div>
              <button
                onClick={closeSignatureModal}
                aria-label="Cerrar"
                className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel hover:bg-simar-borde-suave flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-simar-texto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Área de firma */}
            <div className="p-6">
              <div className="relative border-2 border-dashed border-simar-campo-borde rounded-xl bg-simar-papel overflow-hidden">
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
                  <p className="text-[#9AA5B1] text-xl">Firme aquí</p>
                </div>
                {/* Línea de firma */}
                <div className="absolute bottom-8 left-8 right-8 border-b-2 border-[#D9D2C2] pointer-events-none" />
                <div className="absolute bottom-2 left-8 text-sm text-[#6B7785] pointer-events-none">Firma</div>
              </div>

              {/* Botones */}
              <div className="flex flex-wrap justify-between items-center mt-6 gap-3">
                <button
                  type="button"
                  onClick={clearModalSignature}
                  className="min-h-[56px] px-5 text-[17px] font-bold text-simar-coral bg-simar-coral-suave rounded-2xl flex items-center gap-2 hover:underline"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Borrar
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeSignatureModal}
                    className="min-h-[56px] px-5 text-[17px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta rounded-2xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveModalSignature}
                    className="min-h-[56px] px-6 text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover rounded-2xl flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar firma
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
