'use client';

import { useState } from 'react';
import { ManifiestosTable } from '@/components/manifiestos/ManifiestosTable';
import { Pagination } from '@/components/embarcaciones/Pagination';
import { Button } from '@/components/ui/Button';
import { getManifiestos } from '@/lib/data';

export default function ManifiestosPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nombreEmbarcacion: '',
    matricula: '',
    tipoEmbarcacion: '',
    puerto: '',
    tipoResiduo: '',
    cantidad: '',
    unidad: '',
    descripcionResiduo: '',
    nombreResponsable: '',
    cedula: '',
    telefono: '',
    email: '',
    cargo: '',
    archivo: null as File | null,
    observaciones: '',
  });

  const steps = [
    { number: 1, title: 'Embarcación', icon: '⛵' },
    { number: 2, title: 'Residuos', icon: '♻️' },
    { number: 3, title: 'Personas', icon: '👤' },
    { number: 4, title: 'Archivo', icon: '📄' }
  ];
  
  const allManifiestos = getManifiestos();
  const totalItems = allManifiestos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const manifiestos = allManifiestos.slice(startIndex, endIndex);
  
  const handleEdit = (id: number) => {
    alert(`Editar manifiesto ${id}`);
  };
  
  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este manifiesto?')) {
      alert(`Eliminar manifiesto ${id}`);
    }
  };

  const handleView = (id: number) => {
    alert(`Ver detalles del manifiesto ${id}`);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Formulario enviado:', formData);
    alert('Manifiesto digitalizado exitosamente');
    // Reset form
    setFormData({
      nombreEmbarcacion: '',
      matricula: '',
      tipoEmbarcacion: '',
      puerto: '',
      tipoResiduo: '',
      cantidad: '',
      unidad: '',
      descripcionResiduo: '',
      nombreResponsable: '',
      cedula: '',
      telefono: '',
      email: '',
      cargo: '',
      archivo: null,
      observaciones: '',
    });
    setCurrentStep(1);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Digitalización de Manifiestos</h1>
        <p className="text-sm text-gray-500 mt-1">Complete el proceso de digitalización paso a paso</p>
      </div>

      {/* Proceso de Digitalización */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Steps Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                      currentStep === step.number
                        ? 'bg-blue-500 text-white shadow-lg scale-110'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step.number ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-2xl">{step.icon}</span>
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      currentStep === step.number ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded transition-all ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Paso 1: Embarcación */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Información de la Embarcación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Embarcación
                    </label>
                    <input
                      type="text"
                      value={formData.nombreEmbarcacion}
                      onChange={(e) => setFormData({ ...formData, nombreEmbarcacion: e.target.value })}
                      placeholder="Ej: El Oro Jackson"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      placeholder="Ej: ABC-1234"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Embarcación
                    </label>
                    <select
                      value={formData.tipoEmbarcacion}
                      onChange={(e) => setFormData({ ...formData, tipoEmbarcacion: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="Ship">Barco</option>
                      <option value="Boat">Lancha</option>
                      <option value="Yacht">Yate</option>
                      <option value="Cargo">Carga</option>
                      <option value="Pesquero">Pesquero</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puerto
                    </label>
                    <input
                      type="text"
                      value={formData.puerto}
                      onChange={(e) => setFormData({ ...formData, puerto: e.target.value })}
                      placeholder="Ej: Puerto Limón"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Residuos */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Información de Residuos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Residuo
                    </label>
                    <select
                      value={formData.tipoResiduo}
                      onChange={(e) => setFormData({ ...formData, tipoResiduo: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="Orgánico">Orgánico</option>
                      <option value="Plástico">Plástico</option>
                      <option value="Metal">Metal</option>
                      <option value="Vidrio">Vidrio</option>
                      <option value="Aceites">Aceites</option>
                      <option value="Químicos">Químicos</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                        placeholder="0"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <select
                        value={formData.unidad}
                        onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                        className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">Unidad</option>
                        <option value="kg">Kg</option>
                        <option value="litros">Litros</option>
                        <option value="m3">m³</option>
                        <option value="unidades">Unidades</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del Residuo
                    </label>
                    <textarea
                      value={formData.descripcionResiduo}
                      onChange={(e) => setFormData({ ...formData, descripcionResiduo: e.target.value })}
                      rows={4}
                      placeholder="Describa las características del residuo..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Personas */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Información del Responsable</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={formData.nombreResponsable}
                      onChange={(e) => setFormData({ ...formData, nombreResponsable: e.target.value })}
                      placeholder="Ej: Juan Pérez García"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      placeholder="Ej: 1-1234-5678"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="Ej: +506 8888-8888"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ejemplo@correo.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <select
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Seleccionar cargo</option>
                      <option value="Capitán">Capitán</option>
                      <option value="Tripulante">Tripulante</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Inspector">Inspector</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4: Archivo */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Cargar Documento</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo del Manifiesto
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        id="archivo"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setFormData({ ...formData, archivo: e.target.files?.[0] || null })}
                        className="hidden"
                      />
                      <label htmlFor="archivo" className="cursor-pointer">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {formData.archivo ? formData.archivo.name : 'Click para seleccionar archivo'}
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG (máx. 10MB)
                        </p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={4}
                      placeholder="Agregue observaciones adicionales sobre el manifiesto..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNextStep}>
                Siguiente
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finalizar Digitalización
              </Button>
            )}
        </div>
      </div>

      {/* Tabla de Manifiestos */}
      <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Manifiestos Digitalizados</h2>
          <div className="space-y-4">
            <ManifiestosTable 
              manifiestos={manifiestos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
    </div>
  );
}