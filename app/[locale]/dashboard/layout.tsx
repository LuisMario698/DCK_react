import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BaseDatosProvider } from '@/components/layout/BaseDatos';
import { baseElegida } from '@/lib/supabase/server';

// Las traducciones se cargan aquí y no en el layout de [locale]: sólo el recinto usa useTranslations
// (menú, Personas, Embarcaciones y Manifiesto)
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  // La base de DCK (sólo consulta) si el superadmin la eligió para este navegador
  return (
    <NextIntlClientProvider messages={messages}>
      <BaseDatosProvider base={await baseElegida()}>
        <DashboardLayout>{children}</DashboardLayout>
      </BaseDatosProvider>
    </NextIntlClientProvider>
  );
}
