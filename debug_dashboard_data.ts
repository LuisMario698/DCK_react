
import { createClient } from '@supabase/supabase-js';

// dotenv removed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    console.log('Fetching dashboard stats...');

    // 1. Check KPIs
    const { data: kpis, error: kpiError } = await supabase.rpc('get_dashboard_kpis');
    if (kpiError) console.error('KPI Error:', kpiError);
    else console.log('KPIs:', kpis);

    // 2. Check Monthly Stats (Default 6 months)
    const { data: monthly, error: monthlyError } = await supabase.rpc('get_monthly_waste_stats', { months_limit: 6 });
    if (monthlyError) console.error('Monthly Error:', monthlyError);
    else console.log('Monthly Stats (6 months):', monthly);

    // 3. Check Monthly Stats (12 months)
    const { data: monthly12, error: monthly12Error } = await supabase.rpc('get_monthly_waste_stats', { months_limit: 12 });
    if (monthly12Error) console.error('Monthly Error (12 months):', monthly12Error);
    else console.log('Monthly Stats (12 months):', monthly12);

    // 4. Check Date Range in Tables
    const { data: manifiestosRange, error: mRangeError } = await supabase
        .from('manifiestos')
        .select('fecha_emision')
        .order('fecha_emision', { ascending: true })
        .limit(1);

    const { data: manifiestosRangeDesc, error: mRangeDescError } = await supabase
        .from('manifiestos')
        .select('fecha_emision')
        .order('fecha_emision', { ascending: false })
        .limit(1);

    console.log('Manifiestos Date Range:',
        manifiestosRange?.[0]?.fecha_emision, 'to',
        manifiestosRangeDesc?.[0]?.fecha_emision
    );
}

debugData();
