'use client';

import { Icons } from '@/components/ui/Icons';
import Link from 'next/link';

export default function AsociacionesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Icons.Building className="w-12 h-12 text-blue-500" />
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-3 block">
        Próximamente
      </h1>

      <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
        Estamos trabajando en el nuevo módulo de <span className="font-semibold text-blue-600">Asociaciones Recolectoras</span>.
        Muy pronto podrás gestionar todos los convenios desde aquí.
      </p>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
