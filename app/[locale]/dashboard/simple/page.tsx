'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SimpleManifiestoForm from '@/components/simple/SimpleManifiestoForm';
import SimpleBasuronForm from '@/components/simple/SimpleBasuronForm';
import SimpleEstadisticas from '@/components/simple/SimpleEstadisticas';

/**
 * Dashboard Simplificado para Don Francisco
 * Diseño enfocado en usabilidad para usuarios no técnicos
 */

// Componente de Tarjeta Grande para el menú principal
const ActionCard = ({ 
  title, 
  icon, 
  description, 
  onClick
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  colorClass?: string;
}) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl bg-gray-100 hover:bg-blue-500 border-2 border-gray-200 hover:border-blue-500 w-full h-40 md:h-48 group"
  >
    <div className="p-3 rounded-xl mb-2 transition-all bg-gray-200 group-hover:bg-blue-400">
      <div className="transition-colors group-hover:[&_svg]:text-white">
        {icon}
      </div>
    </div>
    <h3 className="text-lg md:text-2xl font-bold text-gray-800 group-hover:text-white text-center transition-colors">{title}</h3>
    <p className="text-gray-500 group-hover:text-blue-100 text-center text-xs md:text-sm mt-1 transition-colors">{description}</p>
  </button>
);

export default function SimpleDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') as 'home' | 'manifiesto' | 'basuron' | 'estadisticas' || 'home';
  const [currentView, setCurrentView] = useState<'home' | 'manifiesto' | 'basuron' | 'estadisticas'>(
    initialView === 'estadisticas' ? 'estadisticas' : 'home'
  );

  // Actualizar vista si cambia el parámetro
  useEffect(() => {
    const view = searchParams.get('view') as 'home' | 'manifiesto' | 'basuron' | 'estadisticas';
    if (view === 'estadisticas') {
      setCurrentView('estadisticas');
    }
  }, [searchParams]);

  // Iconos SVG grandes y claros
  const ManifiestoIcon = () => (
    <svg className="w-10 h-10 md:w-12 md:h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const BasuronIcon = () => (
    <svg className="w-10 h-10 md:w-12 md:h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );

  const EstadisticasIcon = () => (
    <svg className="w-10 h-10 md:w-12 md:h-12 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const BackIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );

  const ShipIcon = () => (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18" />
    </svg>
  );

  // Manejar éxito de formularios
  const handleSuccess = () => {
    setCurrentView('home');
  };

  // Manejar volver
  const handleBack = () => {
    setCurrentView('home');
  };

  // Vista del Menú Principal - Compacta para caber en una pantalla
  const renderHome = () => (
    <div className="h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* Saludo compacto */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          ¡Hola! 👋 ¿Qué vamos a hacer?
        </h2>
      </div>

      {/* Tarjetas de Acciones - Layout horizontal */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto w-full">
        <ActionCard 
          title="Manifiesto" 
          icon={<ManifiestoIcon />}
          description="Recolección de barco"
          onClick={() => setCurrentView('manifiesto')}
        />
        <ActionCard 
          title="Basurón" 
          icon={<BasuronIcon />}
          description="Pesar en relleno"
          onClick={() => setCurrentView('basuron')}
        />
        <ActionCard 
          title="Estadísticas" 
          icon={<EstadisticasIcon />}
          description="Ver reportes"
          onClick={() => setCurrentView('estadisticas')}
        />
      </div>

      {/* Acceso al modo avanzado */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-gray-600 text-sm underline"
        >
          Modo avanzado →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar Simple - Solo visible en home */}
      {currentView === 'home' && (
        <nav className="bg-white shadow-sm sticky top-0 z-10 px-4 py-2 md:px-8">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2.5 rounded-xl">
                <ShipIcon />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">CDK Recolección</h1>
                <p className="text-xs md:text-sm text-gray-500">Puerto Peñasco, Sonora</p>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Contenido Principal */}
      <main className={currentView === 'home' ? 'max-w-7xl mx-auto px-4 py-4' : 'h-[calc(100vh-1rem)] px-4 py-2'}>
        {currentView === 'home' && renderHome()}
        {currentView === 'manifiesto' && (
          <SimpleManifiestoForm onBack={handleBack} onSuccess={handleSuccess} />
        )}
        {currentView === 'basuron' && (
          <SimpleBasuronForm onBack={handleBack} onSuccess={handleSuccess} />
        )}
        {currentView === 'estadisticas' && (
          <SimpleEstadisticas onBack={handleBack} />
        )}
      </main>
    </div>
  );
}
