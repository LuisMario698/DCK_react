import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AjustesClient } from '@/components/ajustes/AjustesClient';

export default async function AjustesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/${locale}/login`);

    const role = user.user_metadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'Administrador') {
        redirect(`/${locale}/dashboard`);
    }

    return <AjustesClient />;
}
