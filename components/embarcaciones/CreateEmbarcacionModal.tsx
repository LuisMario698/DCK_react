 'use client';

import { useState } from 'react';
import { Embarcacion } from '@/types/embarcacion';
import { Button } from '@/components/ui/Button';

interface Props {
  onCreate: (data: Embarcacion) => void;
  onClose: () => void;
}

export function CreateEmbarcacionModal({ onCreate, onClose }: Props) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Boat');
  const [matricula, setMatricula] = useState('');
  const [bandera, setBandera] = useState('');
  const [eslora, setEslora] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [propietario, setPropietario] = useState('');
  type Estado = 'Activo' | 'Inactivo' | 'En Mantenimiento' | '';
  const [estado, setEstado] = useState<Estado>('Activo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const newItem: Embarcacion = {
      id: Math.floor(Math.random() * 1000000),
      nombre,
      tipoEmbarcacion: tipo,
      matricula,
      bandera,
      eslora,
      capacidad,
      propietario,
      estado: estado || 'Activo',
      fechaEntrada: now,
      creado: now,
      actualizado: now,
    };

    onCreate(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Crear nueva embarcación</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✖</button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <input required value={nombre} onChange={(e)=>setNombre(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Tipo de embarcación</label>
            <select value={tipo} onChange={(e)=>setTipo(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
              <option>Boat</option>
              <option>Ship</option>
              <option>Yacht</option>
              <option>Cargo</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Matrícula</label>
            <input value={matricula} onChange={(e)=>setMatricula(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Bandera</label>
            <input value={bandera} onChange={(e)=>setBandera(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Eslora</label>
            <input value={eslora} onChange={(e)=>setEslora(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Capacidad</label>
            <input value={capacidad} onChange={(e)=>setCapacidad(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Propietario</label>
            <input value={propietario} onChange={(e)=>setPropietario(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Estado</label>
            <select value={estado} onChange={(e)=>setEstado(e.target.value as any)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="En Mantenimiento">En Mantenimiento</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Crear embarcación</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
