import { VariantCinematic } from '@/components/landing/VariantCinematic';
import { createServerClient } from '@/lib/supabase/server';
import { getLandingStats } from '@/lib/services/landing_stats';

export default async function LandingPage() {
    let stats = null;
    try {
        const supabase = await createServerClient();
        stats = await getLandingStats(supabase);
    } catch {
        // Si falla el fetch, la página sigue funcionando con datos nulos
    }

    return <VariantCinematic stats={stats} />;
}
