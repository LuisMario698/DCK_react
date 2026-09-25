-- Stubs mínimos de auth, storage y tablas previas de SiMAR para probar las migraciones sin Supabase.
-- Stubs mínimos de Supabase para probar las migraciones localmente
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claims', true)::jsonb->>'role' $$;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
create publication supabase_realtime;
grant usage on schema public, auth, storage to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
grant all on storage.objects to authenticated;
grant execute on function auth.uid(), auth.role() to anon, authenticated;

-- Tablas existentes en producción (forma reducida)
create table public.asociaciones_recolectoras (
  id bigserial primary key, nombre_asociacion text not null unique, tipo_asociacion text, contacto_asociacion text,
  email text, telefono text, direccion text, certificaciones text[], especialidad text[],
  estado text default 'Activo' check (estado in ('Activo','Inactivo','Suspendido')),
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.profiles (id uuid primary key references auth.users(id), email text, full_name text, avatar_url text, updated_at timestamptz);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);
create table public.manifiestos (id bigserial primary key, numero_manifiesto text);
alter table public.manifiestos enable row level security;
create policy manifiestos_all_authenticated on public.manifiestos for all to authenticated using (true) with check (true);
create table public.audit_log (id bigserial primary key, tabla text, operacion text, registro_id text, datos_ant jsonb, datos_nue jsonb);
create function public.audit_trigger_fn() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into audit_log (tabla, operacion, registro_id, datos_ant, datos_nue)
  values (TG_TABLE_NAME, TG_OP, case when TG_OP='DELETE' then OLD.id::text else NEW.id::text end,
          case when TG_OP in ('UPDATE','DELETE') then to_jsonb(OLD) end, case when TG_OP in ('INSERT','UPDATE') then to_jsonb(NEW) end);
  if TG_OP='DELETE' then return OLD; end if; return NEW;
end $$;
create function public.update_updated_at_column() returns trigger language plpgsql as $$ begin NEW.updated_at = now(); return NEW; end $$;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
-- usuario existente (quedará como admin)
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'admin@simar.mx');
insert into public.asociaciones_recolectoras (nombre_asociacion) values ('EcoRecicla'), ('Verde Costa');
insert into public.manifiestos (numero_manifiesto) values ('M-001');
