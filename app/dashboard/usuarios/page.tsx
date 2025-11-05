import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function UsuariosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Usuarios del sistema</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Módulo de gestión de usuarios en desarrollo...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
