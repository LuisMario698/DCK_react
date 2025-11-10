import { Icons } from '@/components/ui/Icons';
import { getBuques } from '@/lib/services/buques';
import { getPersonas } from '@/lib/services/personas';
import { getResiduos } from '@/lib/services/residuos';
import { getManifiestosBasuron } from '@/lib/services/manifiesto_basuron';

export default async function DashboardPage() {
  const [buques, personas, residuos, manifiestos] = await Promise.all([
    getBuques(),
    getPersonas(),
    getResiduos(),
    getManifiestosBasuron()
  ]);
  
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Panel principal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tarjetas de estadísticas */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Buques</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{buques.length}</p>
                <p className="text-xs text-gray-400 mt-1">Registrados en el sistema</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Icons.Ship />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Personas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{personas.length}</p>
                <p className="text-xs text-gray-400 mt-1">Usuarios registrados</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                <Icons.Users />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Residuos Generados</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{residuos.length}</p>
                <p className="text-xs text-gray-400 mt-1">Registros de residuos</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                <Icons.Document />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Bienvenido al Sistema CIAD</h2>
          <p className="text-gray-600 leading-relaxed">
            Sistema de gestión integral para embarcaciones, personas y manifiestos. 
            Utiliza el menú lateral para navegar entre las diferentes secciones y comenzar a gestionar tu información.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Gestión completa</h3>
                <p className="text-xs text-gray-600 mt-1">Administra embarcaciones, tripulación y documentación</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Interfaz moderna</h3>
                <p className="text-xs text-gray-600 mt-1">Diseño intuitivo y responsive para todos tus dispositivos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
