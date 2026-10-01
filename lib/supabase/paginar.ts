/**
 * Trae todas las filas de una consulta, de 1,000 en 1,000. Supabase corta cada respuesta en 1,000
 * filas aunque no se pida límite: sin esto, una lista con más registros se quedaba corta sin avisar.
 *
 * `pagina(desde, hasta)` arma la consulta completa y termina en `.range(desde, hasta)`. Su orden debe
 * desempatar (terminar en `id`): si dos filas empatan, entre una página y otra se repiten o se saltan.
 */
export async function traerTodas<T>(
    pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
    const TAMANO = 1000;
    const filas: T[] = [];
    for (let desde = 0; ; desde += TAMANO) {
        const { data, error } = await pagina(desde, desde + TAMANO - 1);
        if (error) throw error;
        filas.push(...(data ?? []));
        if (!data || data.length < TAMANO) return filas;
    }
}
