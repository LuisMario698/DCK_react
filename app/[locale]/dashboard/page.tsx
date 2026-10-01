import { PanelInicio } from '@/components/dashboard/PanelInicio';
import { createServerClient } from '@/lib/supabase/server';
import { getResumenPanel, getVistazoPanel } from '@/lib/services/panel_recinto';
import { hoyPuerto } from '@/lib/utils/fechas';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const hoy = hoyPuerto();
  const supabase = await createServerClient();

  // Cada parte por su lado: si una falla, el Panel sigue con la otra (y, sin las dos, es el menú de
  // siempre)
  const [resumen, vistazo] = await Promise.all([
    getResumenPanel(supabase, hoy).catch((e) => {
      console.error('Error cargando el resumen del Panel:', e);
      return null;
    }),
    getVistazoPanel(supabase).catch((e) => {
      console.error('Error cargando lo último y el acopio del Panel:', e);
      return null;
    }),
  ]);

  return <PanelInicio locale={locale} hoy={hoy} resumen={resumen} vistazo={vistazo} />;
}
