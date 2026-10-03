// Arma supabase/demo/simar-demo.sql: TODO lo que necesita un proyecto Supabase nuevo y vacío para la
// demostración, en un solo archivo para pegarlo en el editor SQL.
//
//   1. El esquema base (estructura_completa.sql) sin las tablas del POS ajeno que trae el volcado.
//   2. Las migraciones de supabase/migrations/, en orden.
//   3. Los archivos de esta carpeta: almacenamiento, datos de ejemplo y candado de sólo lectura.
//
// Uso (desde la raíz del repo):  node supabase/demo/armar.mjs

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..', '..');

/** Parte un archivo SQL en sentencias respetando cadenas, comentarios y cuerpos $$ … $$. */
function sentencias(sql) {
    const salida = [];
    let inicio = 0;
    let i = 0;
    while (i < sql.length) {
        const c = sql[i];
        if (c === '-' && sql[i + 1] === '-') {
            const fin = sql.indexOf('\n', i);
            i = fin === -1 ? sql.length : fin + 1;
        } else if (c === '/' && sql[i + 1] === '*') {
            const fin = sql.indexOf('*/', i + 2);
            i = fin === -1 ? sql.length : fin + 2;
        } else if (c === "'" || c === '"') {
            let j = i + 1;
            while (j < sql.length) {
                if (sql[j] === c && sql[j + 1] === c) j += 2;
                else if (sql[j] === c) break;
                else j++;
            }
            i = j + 1;
        } else if (c === '$') {
            const m = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
            if (m) {
                const fin = sql.indexOf(m[0], i + m[0].length);
                i = fin === -1 ? sql.length : fin + m[0].length;
            } else i++;
        } else if (c === ';') {
            salida.push(sql.slice(inicio, i + 1).trim());
            inicio = i + 1;
            i++;
        } else i++;
    }
    const resto = sql.slice(inicio).trim();
    if (resto) salida.push(resto);
    return salida;
}

// Lo que el volcado trae de un punto de venta que no es de SiMAR (ya no existe en el proyecto real)
const AJENO = /"public"\."(tenants|users|products|categories|orders|order_items)"|get_user_tenant_id|get_user_role\b|process_credit_payment|generar_numero_ticket/;

const base = sentencias(readFileSync(join(raiz, 'estructura_completa.sql'), 'utf8'))
    .map((s) => s.replace(/^(--[^\n]*\n|\s)+/, '')) // los comentarios del volcado sobran
    .filter((s) => s && !AJENO.test(s));

const migraciones = readdirSync(join(raiz, 'supabase', 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => join(raiz, 'supabase', 'migrations', f));

const propios = ['10_almacenamiento.sql', '20_datos.sql', '30_candado.sql'].map((f) => join(aqui, f));

const bloque = (ruta) => `\n-- >>>>> ${relative(raiz, ruta).replaceAll('\\', '/')}\n\n${readFileSync(ruta, 'utf8').trim()}\n`;

const sql = `-- ============================================================================
-- SiMAR · Base de datos de la DEMOSTRACIÓN (archivo generado: no lo edites)
-- ----------------------------------------------------------------------------
-- Generado con: node supabase/demo/armar.mjs
-- Sólo para un proyecto Supabase NUEVO y vacío. Nunca en el de producción.
-- Pasos completos en supabase/demo/README.md.
-- ============================================================================

begin;

-- Seguro: sólo en un proyecto vacío. Si la base ya tiene tablas de SiMAR (la demo ya creada, o
-- peor, producción) no se toca nada.
do $$
begin
    if to_regclass('public.manifiestos') is not null then
        raise exception 'Esta base ya tiene las tablas de SiMAR: no se cambió nada. Si es la demo y ya corriste este archivo, ya está lista (para el candado nuevo corre sólo supabase/demo/30_candado.sql). Si es el proyecto de producción, no corras nada de supabase/demo.';
    end if;
end $$;

-- Marca de la base de la demo: 20_datos.sql y 30_candado.sql se niegan a correr donde no está
create or replace function public.es_base_demo() returns boolean language sql immutable as 'select true';

-- >>>>> estructura_completa.sql (sin las tablas del POS ajeno)

${base.join('\n\n')}

-- El volcado deja la ruta de búsqueda vacía, sin revisar cuerpos de funciones y sin RLS en la sesión
select pg_catalog.set_config('search_path', 'public, extensions', false);
set check_function_bodies = true;
reset row_security;
${migraciones.map(bloque).join('')}${propios.map(bloque).join('')}
commit;
`;

writeFileSync(join(aqui, 'simar-demo.sql'), sql);
console.log(`supabase/demo/simar-demo.sql: ${base.length} sentencias del esquema base, ${migraciones.length} migraciones y ${propios.length} archivos de la demo`);
