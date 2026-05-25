import { SupabaseClient } from '@supabase/supabase-js';

export interface Backup {
    id: number;
    nombre: string;
    tipo: 'manual' | 'automatico';
    tablas: string[];
    storage_path: string | null;
    tamanio_kb: number;
    estado: 'completado' | 'fallido' | 'en_proceso';
    creado_por: string | null;
    created_at: string;
}

export interface BackupSchedule {
    id: number;
    activo: boolean;
    frecuencia: 'diario' | 'semanal';
    dia_semana: number;
    hora: string;
    updated_at: string;
}

export type FormatoBackup = 'json' | 'csv' | 'sql';

const TABLAS_RESPALDO = [
    'buques',
    'personas',
    'tipos_persona',
    'manifiestos',
    'manifiestos_residuos',
    'manifiesto_basuron',
    'asociaciones_recolectoras',
];

// ──────────────────────────────────────────
// Historial de backups
// ──────────────────────────────────────────
export async function getBackups(supabase: SupabaseClient): Promise<Backup[]> {
    const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Backup[];
}

export async function eliminarBackup(supabase: SupabaseClient, id: number, storagePath: string | null) {
    if (storagePath) {
        await supabase.storage.from('backups').remove([storagePath]);
    }
    const { error } = await supabase.from('backups').delete().eq('id', id);
    if (error) throw error;
}

// ──────────────────────────────────────────
// Crear respaldo
// ──────────────────────────────────────────
export async function crearRespaldo(
    supabase: SupabaseClient,
    formato: FormatoBackup,
    tipo: 'manual' | 'automatico' = 'manual',
    creadoPor?: string
): Promise<{ backup: Backup; blob: Blob; filename: string }> {
    // 1. Exportar datos de cada tabla
    const datos: Record<string, unknown[]> = {};
    for (const tabla of TABLAS_RESPALDO) {
        const { data } = await supabase.from(tabla).select('*').order('id');
        datos[tabla] = data ?? [];
    }

    // 2. Convertir al formato elegido
    let contenido: string;
    let mimeType: string;
    let ext: string;

    if (formato === 'json') {
        contenido = JSON.stringify({ version: 1, fecha: new Date().toISOString(), tablas: datos }, null, 2);
        mimeType = 'application/json';
        ext = 'json';
    } else if (formato === 'csv') {
        contenido = Object.entries(datos)
            .map(([tabla, filas]) => {
                if (!filas.length) return `## ${tabla}\n(sin datos)\n`;
                const cols = Object.keys(filas[0] as object);
                const header = cols.join(',');
                const rows = filas.map(f =>
                    cols.map(c => {
                        const v = (f as Record<string, unknown>)[c];
                        if (v === null || v === undefined) return '';
                        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
                        return s.includes(',') || s.includes('"') || s.includes('\n')
                            ? `"${s.replace(/"/g, '""')}"` : s;
                    }).join(',')
                ).join('\n');
                return `## ${tabla}\n${header}\n${rows}\n`;
            })
            .join('\n');
        mimeType = 'text/csv';
        ext = 'csv';
    } else {
        // SQL INSERT statements
        contenido = Object.entries(datos)
            .map(([tabla, filas]) => {
                if (!filas.length) return `-- ${tabla}: sin datos\n`;
                const cols = Object.keys(filas[0] as object);
                const inserts = filas.map(f => {
                    const vals = cols.map(c => {
                        const v = (f as Record<string, unknown>)[c];
                        if (v === null || v === undefined) return 'NULL';
                        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
                        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
                        return `'${s.replace(/'/g, "''")}'`;
                    }).join(', ');
                    return `INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${vals});`;
                }).join('\n');
                return `-- ============\n-- ${tabla}\n-- ============\n${inserts}\n`;
            })
            .join('\n');
        mimeType = 'text/plain';
        ext = 'sql';
    }

    const blob = new Blob([contenido], { type: mimeType });
    const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const nombre = `backup_${fecha}_${tipo}`;
    const filename = `${nombre}.${ext}`;
    const storagePath = `${fecha}/${filename}`;
    const tamanioKb = Math.ceil(blob.size / 1024);

    // 3. Subir a Storage
    await supabase.storage.from('backups').upload(storagePath, blob, { contentType: mimeType });

    // 4. Registrar en tabla backups
    const { data: reg, error } = await supabase
        .from('backups')
        .insert({
            nombre,
            tipo,
            tablas: TABLAS_RESPALDO,
            storage_path: storagePath,
            tamanio_kb: tamanioKb,
            estado: 'completado',
            creado_por: creadoPor ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return { backup: reg as Backup, blob, filename };
}

export async function descargarBackup(supabase: SupabaseClient, storagePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage.from('backups').download(storagePath);
    if (error) throw error;
    return data;
}

// ──────────────────────────────────────────
// Programación
// ──────────────────────────────────────────
export async function getSchedule(supabase: SupabaseClient): Promise<BackupSchedule> {
    const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .order('id')
        .limit(1)
        .single();
    if (error) throw error;
    return data as BackupSchedule;
}

export async function saveSchedule(
    supabase: SupabaseClient,
    config: Partial<Omit<BackupSchedule, 'id' | 'updated_at'>>
): Promise<void> {
    const { data: existing } = await supabase.from('backup_schedules').select('id').limit(1).single();
    if (existing) {
        const { error } = await supabase
            .from('backup_schedules')
            .update({ ...config, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('backup_schedules').insert(config);
        if (error) throw error;
    }
}
