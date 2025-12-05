import React, { useState, useRef, useEffect } from 'react';
import { 
  Ship, 
  Trash2, 
  FileText, 
  PenTool, 
  Save, 
  BarChart3, 
  Home, 
  ArrowLeft, 
  CheckCircle, 
  Upload,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

/**
 * TIPOS Y DEFINICIONES
 * Mantenemos la estructura de datos estricta con TypeScript
 */

type WasteType = 'Plastico' | 'Organico' | 'Aceite' | 'General';

interface ManifestItem {
  type: WasteType;
  amount: number; // en kg
  unit: string;
}

interface Manifest {
  id: string;
  boatName: string;
  captainName: string;
  date: string;
  items: ManifestItem[];
  signature: string | null; // Base64 string
  status: 'completed' | 'pending';
}

interface LandfillReceipt {
  id: string;
  ticketNumber: string;
  date: string;
  totalWeight: number;
  imageUrl?: string;
}

// Datos falsos para la demostración de estadísticas
const MOCK_STATS_DATA = [
  { name: 'Lun', kg: 120 },
  { name: 'Mar', kg: 230 },
  { name: 'Mie', kg: 180 },
  { name: 'Jue', kg: 340 },
  { name: 'Vie', kg: 290 },
  { name: 'Sab', kg: 450 },
  { name: 'Dom', kg: 100 },
];

/**
 * COMPONENTES DE UTILIDAD
 */

// Botón Grande estilo "Tarjeta" para el menú principal
const ActionCard = ({ title, icon: Icon, description, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl bg-white border-2 ${color} w-full h-64`}
  >
    <div className={`p-4 rounded-full bg-opacity-10 mb-4 ${color.replace('border-', 'bg-').replace('500', '100')}`}>
      <Icon size={48} className={color.replace('border-', 'text-')} />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-center">{description}</p>
  </button>
);

// Componente simple de Firma (Canvas)
const SignaturePad = ({ onSave, onClear }: { onSave: (data: string) => void, onClear: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
      }
    }
  }, []);

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onClear();
    }
  };

  return (
    <div className="w-full">
      <div className="border-4 border-dashed border-gray-300 rounded-xl bg-gray-50 h-64 relative touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
          Firma aquí (Don Francisco / Capitán)
        </div>
      </div>
      <button 
        type="button"
        onClick={clearCanvas} 
        className="mt-2 text-sm text-red-500 underline flex items-center gap-1 hover:text-red-700"
      >
        <Trash2 size={14} /> Borrar firma y empezar de nuevo
      </button>
    </div>
  );
};

/**
 * APP PRINCIPAL
 */
export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'new-manifest' | 'landfill' | 'stats'>('home');
  const [notification, setNotification] = useState<string | null>(null);

  // Estados para el formulario de Manifiesto
  const [boatName, setBoatName] = useState('');
  const [wasteAmount, setWasteAmount] = useState('');
  const [wasteType, setWasteType] = useState<WasteType>('General');
  const [signature, setSignature] = useState<string | null>(null);

  // Función simulada de guardar
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveManifest = () => {
    // Aquí iría la lógica de Firebase/Backend
    showNotification('¡Manifiesto guardado y generado correctamente!');
    setBoatName('');
    setWasteAmount('');
    setSignature(null);
    setCurrentView('home');
  };

  // --- VISTAS ---

  const renderHome = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      <ActionCard 
        title="Nuevo Manifiesto" 
        icon={FileText} 
        description="Registrar recolección de un barco"
        color="border-blue-500"
        onClick={() => setCurrentView('new-manifest')}
      />
      <ActionCard 
        title="Recibo Relleno" 
        icon={Upload} 
        description="Subir ticket del basurero municipal"
        color="border-emerald-500"
        onClick={() => setCurrentView('landfill')}
      />
      <ActionCard 
        title="Estadísticas" 
        icon={BarChart3} 
        description="Ver total de kilos recolectados"
        color="border-violet-500"
        onClick={() => setCurrentView('stats')}
      />
    </div>
  );

  const renderNewManifest = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ship /> Nuevo Manifiesto de Recolección
        </h2>
      </div>
      
      <div className="p-8 space-y-8">
        {/* Paso 1: Datos del Barco */}
        <section>
          <label className="block text-gray-700 font-bold mb-2 text-lg">1. Nombre de la Embarcación</label>
          <input 
            type="text" 
            value={boatName}
            onChange={(e) => setBoatName(e.target.value)}
            placeholder="Ej. El Pescador II" 
            className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </section>

        {/* Paso 2: Detalles de la Basura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <label className="block text-gray-700 font-bold mb-2 text-lg">2. Tipo de Residuo</label>
            <select 
              value={wasteType}
              onChange={(e) => setWasteType(e.target.value as WasteType)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg bg-white"
            >
              <option value="General">Basura General</option>
              <option value="Plastico">Plástico</option>
              <option value="Aceite">Aceites / Filtros</option>
              <option value="Organico">Orgánico (Pescado)</option>
            </select>
          </section>

          <section>
            <label className="block text-gray-700 font-bold mb-2 text-lg">3. Cantidad (Kg)</label>
            <input 
              type="number" 
              value={wasteAmount}
              onChange={(e) => setWasteAmount(e.target.value)}
              placeholder="0.0" 
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl font-mono text-right"
            />
          </section>
        </div>

        {/* Paso 3: Firma */}
        <section>
          <label className="block text-gray-700 font-bold mb-2 text-lg flex items-center gap-2">
            <PenTool className="text-blue-600"/> 4. Firma del Capitán / Encargado
          </label>
          <SignaturePad onSave={setSignature} onClear={() => setSignature(null)} />
        </section>

        {/* Acciones */}
        <div className="pt-6 border-t border-gray-100 flex gap-4">
          <button 
            onClick={() => setCurrentView('home')}
            className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={!boatName || !wasteAmount || !signature}
            onClick={handleSaveManifest}
            className={`flex-1 py-4 px-6 rounded-xl text-white font-bold shadow-lg flex justify-center items-center gap-2 transition-all
              ${(!boatName || !wasteAmount || !signature) 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1'}`}
          >
            <Save /> Guardar y Generar Manifiesto
          </button>
        </div>
      </div>
    </div>
  );

  const renderLandfill = () => (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
       <div className="bg-emerald-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Upload /> Registro Relleno Sanitario
        </h2>
      </div>
      <div className="p-8 space-y-6">
        <div className="border-4 border-dashed border-emerald-100 bg-emerald-50 rounded-2xl h-64 flex flex-col items-center justify-center text-emerald-700 cursor-pointer hover:bg-emerald-100 transition-colors">
          <Upload size={64} className="mb-4 opacity-50"/>
          <span className="font-bold text-lg">Tomar Foto del Recibo</span>
          <span className="text-sm opacity-75">(O hacer clic para subir)</span>
        </div>
        
        <div>
           <label className="block text-gray-700 font-bold mb-2">Folio del Ticket</label>
           <input type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="#12345" />
        </div>

        <button 
          onClick={() => {
            showNotification('Recibo registrado correctamente');
            setCurrentView('home');
          }}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg"
        >
          Guardar Recibo
        </button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="w-full bg-white rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reporte Semanal</h2>
          <p className="text-gray-500">Kilos recolectados en el puerto</p>
        </div>
        <div className="bg-violet-100 text-violet-700 px-4 py-2 rounded-lg font-bold">
          Total: 1,710 Kg
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_STATS_DATA}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{fill: '#f3f4f6'}}
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Bar dataKey="kg" radius={[6, 6, 0, 0]}>
              {MOCK_STATS_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#a78bfa'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Navbar Simple */}
      <nav className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Ship size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">CDK Recolección</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Puerto Peñasco, Sonora</p>
          </div>
        </div>
        
        {currentView !== 'home' && (
          <button 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Volver al Inicio</span>
          </button>
        )}
      </nav>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Notificación Flotante */}
        {notification && (
          <div className="fixed top-24 right-4 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in z-50">
            <CheckCircle />
            {notification}
          </div>
        )}

        <div className="mb-6">
          {currentView === 'home' && (
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-800">Hola, Don Francisco 👋</h2>
              <p className="text-slate-500 text-lg">¿Qué vamos a hacer hoy?</p>
            </div>
          )}
        </div>

        {/* Renderizado Condicional de Vistas */}
        <div className="transition-all duration-300">
          {currentView === 'home' && renderHome()}
          {currentView === 'new-manifest' && renderNewManifest()}
          {currentView === 'landfill' && renderLandfill()}
          {currentView === 'stats' && renderStats()}
        </div>
      </main>
    </div>
  );
}