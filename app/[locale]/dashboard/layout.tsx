import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BaseDatosProvider } from '@/components/layout/BaseDatos';
import { baseElegida } from '@/lib/supabase/server';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La base de DCK (sólo consulta) si el superadmin la eligió para este navegador
  return (
    <BaseDatosProvider base={await baseElegida()}>
      <DashboardLayout>{children}</DashboardLayout>
    </BaseDatosProvider>
  );
}
