import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Las traducciones se cargan aquí y no en el layout de [locale]: sólo el recinto usa useTranslations
// (menú, Personas, Embarcaciones y Manifiesto)
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <DashboardLayout>{children}</DashboardLayout>
    </NextIntlClientProvider>
  );
}
