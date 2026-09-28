'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Droplet, X } from 'lucide-react';
import { getManifiestosBasuron } from '@/lib/services/manifiesto_basuron';
import { getManifiestos } from '@/lib/services/manifiestos';
import { ManifiestoBasuronConRelaciones, ManifiestoConRelaciones } from '@/types/database';
import { parseFechaLocal } from '@/lib/utils/fechas';

interface SimpleEstadisticasProps {
  onBack: () => void;
}

/**
 * Vista de Estadísticas Compacta - Todo en una pantalla
 */
export default function SimpleEstadisticas({ onBack }: SimpleEstadisticasProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [manifiestos, setManifiestos] = useState<ManifiestoConRelaciones[]>([]);
  const [basuron, setBasuron] = useState<ManifiestoBasuronConRelaciones[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'semana' | 'mes' | 'anio'>('mes');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [manifestosData, basuronData] = await Promise.all([
          getManifiestos(),
          getManifiestosBasuron()
        ]);
        setManifiestos(manifestosData);
        setBasuron(basuronData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filtrarPorPeriodo = <T extends { fecha?: string | null; fecha_emision?: string | null; created_at?: string | null }>(
    datos: T[]
  ): T[] => {
    const ahora = new Date();
    let fechaInicio: Date;

    switch (periodoSeleccionado) {
      case 'semana':
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        fechaInicio = new Date(ahora);
        fechaInicio.setMonth(ahora.getMonth() - 1);
        break;
      case 'anio':
        fechaInicio = new Date(ahora);
        fechaInicio.setFullYear(ahora.getFullYear() - 1);
        break;
      default:
        fechaInicio = new Date(0);
    }

    return datos.filter((item) => {
      const fechaItem = item.fecha || item.fecha_emision || item.created_at;
      if (!fechaItem) return false;
      const fecha = parseFechaLocal(fechaItem);
      return fecha >= fechaInicio && fecha <= ahora;
    });
  };

  const manifestosFiltrados = filtrarPorPeriodo(manifiestos);
  const basuronFiltrados = filtrarPorPeriodo(basuron);

  const totalManifiestos = manifestosFiltrados.length;
  const totalBasuron = basuronFiltrados.length;
  
  const pesoTotalDepositado = basuronFiltrados.reduce(
    (sum, item) => sum + (Number(item.total_depositado) || 0), 
    0
  );

  const residuosTotales = manifestosFiltrados.reduce(
    (acc, m) => {
      const r = m.residuos;
      if (r) {
        acc.aceite += Number(r.aceite_usado) || 0;
        acc.filtrosAceite += Number(r.filtros_aceite) || 0;
        acc.filtrosDiesel += Number(r.filtros_diesel) || 0;
        acc.basura += Number(r.basura) || 0;
      }
      return acc;
    },
    { aceite: 0, filtrosAceite: 0, filtrosDiesel: 0, basura: 0 }
  );

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-simar-violeta border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-simar-texto-2">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header compacto */}
      <div className="bg-[#5B3FA8] px-4 py-2 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-bold text-lg">Estadísticas</span>
        </div>
        <button onClick={onBack} className="min-h-[44px] px-4 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-base font-bold inline-flex items-center gap-2">
          <X className="w-5 h-5" /> Cerrar
        </button>
      </div>

      {/* Selector de periodo - Compacto */}
      <div className="bg-simar-superficie px-3 py-2 border-b flex justify-center gap-1 flex-shrink-0 border-simar-borde">
        {[
          { key: 'semana', label: 'Semana' },
          { key: 'mes', label: 'Mes' },
          { key: 'anio', label: 'Año' }
        ].map((periodo) => (
          <button
            key={periodo.key}
            onClick={() => setPeriodoSeleccionado(periodo.key as typeof periodoSeleccionado)}
            className={`px-4 py-1.5 rounded-lg font-medium text-base transition-colors ${
              periodoSeleccionado === periodo.key
                ? 'bg-[#5B3FA8] text-white'
                : 'bg-simar-papel text-simar-texto-2 hover:bg-simar-borde-suave'
            }`}
          >
            {periodo.label}
          </button>
        ))}
      </div>

      {/* Contenido - Grid de 3 columnas */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="grid grid-cols-3 gap-3 h-full">
          
          {/* Columna 1: Estadísticas principales */}
          <div className="bg-simar-superficie rounded-xl border-2 border-simar-borde p-3 flex flex-col">
            <h3 className="font-bold text-simar-texto text-base mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-simar-violeta-suave text-simar-violeta rounded-full flex items-center justify-center"><BarChart3 className="w-[18px] h-[18px]" /></span>
              Resumen
            </h3>
            
            <div className="space-y-3 flex-1">
              {/* Manifiestos */}
              <div className="bg-simar-marea-suave rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="bg-simar-marea p-1.5 rounded">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] text-simar-marea-tinta">Manifiestos</p>
                    <p className="text-2xl font-extrabold text-simar-marea-tinta">{totalManifiestos}</p>
                  </div>
                </div>
              </div>

              {/* Basurón */}
              <div className="bg-simar-arrecife-suave rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="bg-[#127A5D] p-1.5 rounded">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] text-simar-arrecife-tinta">Entregas Basurón</p>
                    <p className="text-2xl font-extrabold text-simar-arrecife-tinta">{totalBasuron}</p>
                  </div>
                </div>
              </div>

              {/* Peso Total */}
              <div className="bg-simar-coral-suave rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="bg-[#A63F0E] p-1.5 rounded">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] text-simar-coral">Peso Total</p>
                    <p className="text-2xl font-extrabold text-simar-coral">{formatNumber(pesoTotalDepositado)} kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón volver */}
            <button
              onClick={onBack}
              className="mt-3 w-full py-2 bg-simar-papel text-simar-texto-2 rounded-lg font-bold hover:bg-simar-borde-suave text-base min-h-[52px]"
            >
              ← Volver al Inicio
            </button>
          </div>

          {/* Columna 2: Residuos */}
          <div className="bg-simar-superficie rounded-xl border-2 border-simar-borde p-3 flex flex-col">
            <h3 className="font-bold text-simar-texto text-base mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-simar-violeta-suave text-simar-violeta rounded-full flex items-center justify-center"><Droplet className="w-[18px] h-[18px]" /></span>
              Residuos Recolectados
            </h3>

            <div className="space-y-3 flex-1">
              {/* Aceite Usado */}
              <div className="bg-simar-papel rounded-lg p-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[15px] text-simar-texto-2">Aceite Usado</span>
                  <span className="text-base font-bold text-simar-coral">{residuosTotales.aceite} L</span>
                </div>
                <div className="w-full bg-simar-borde-suave rounded-full h-2">
                  <div className="h-full bg-[#A63F0E] rounded-full" style={{ width: `${Math.min((residuosTotales.aceite / 500) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Filtros Aceite */}
              <div className="bg-simar-papel rounded-lg p-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[15px] text-simar-texto-2">Filtros Aceite</span>
                  <span className="text-base font-bold text-simar-marea-tinta">{residuosTotales.filtrosAceite} uds</span>
                </div>
                <div className="w-full bg-simar-borde-suave rounded-full h-2">
                  <div className="h-full bg-simar-marea rounded-full" style={{ width: `${Math.min((residuosTotales.filtrosAceite / 50) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Filtros Diesel */}
              <div className="bg-simar-papel rounded-lg p-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[15px] text-simar-texto-2">Filtros Diesel</span>
                  <span className="text-base font-bold text-simar-arrecife-tinta">{residuosTotales.filtrosDiesel} uds</span>
                </div>
                <div className="w-full bg-simar-borde-suave rounded-full h-2">
                  <div className="h-full bg-[#127A5D] rounded-full" style={{ width: `${Math.min((residuosTotales.filtrosDiesel / 50) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Basura */}
              <div className="bg-simar-papel rounded-lg p-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[15px] text-simar-texto-2">Basura General</span>
                  <span className="text-base font-bold text-simar-texto-2">{residuosTotales.basura} kg</span>
                </div>
                <div className="w-full bg-simar-borde-suave rounded-full h-2">
                  <div className="h-full bg-simar-texto-2 rounded-full" style={{ width: `${Math.min((residuosTotales.basura / 200) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Columna 3: Últimos registros */}
          <div className="bg-simar-superficie rounded-xl border-2 border-simar-borde p-3 flex flex-col">
            <h3 className="font-bold text-simar-texto text-base mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-simar-violeta-suave text-simar-violeta rounded-full flex items-center justify-center"><Clock className="w-[18px] h-[18px]" /></span>
              Últimos Registros
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2">
              {basuronFiltrados.slice(0, 6).map((item, index) => (
                <div key={index} className="bg-simar-papel rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-simar-arrecife-suave p-1.5 rounded flex-shrink-0">
                      <svg className="w-3 h-3 text-simar-arrecife-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v5.5M3 15v3a3 3 0 003 3h12a3 3 0 003-3v-3M3 15h18" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-simar-texto truncate">{item.buque?.nombre_buque || 'Embarcación'}</p>
                      <p className="text-[15px] text-simar-texto-2">{parseFechaLocal(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-simar-arrecife-tinta flex-shrink-0 ml-1">
                    {Number(item.total_depositado || 0).toLocaleString()}kg
                  </span>
                </div>
              ))}

              {basuronFiltrados.length === 0 && (
                <div className="text-center py-6 text-simar-texto-2 text-base">
                  <p>Sin registros</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
