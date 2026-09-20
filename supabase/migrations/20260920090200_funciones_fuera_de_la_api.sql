-- Las funciones de apoyo de las políticas salen de la API pública.
--
-- Por qué: al crearlas en `public`, PostgREST las publica como `/rest/v1/rpc/<nombre>` y quedan al alcance
-- de cualquiera, con sesión o sin ella. El Security Advisor de Supabase lo avisa con ocho lints
-- (0028 y 0029). No filtraban datos de otros —cada una devuelve solo lo del usuario que pregunta—, pero
-- una función `security definer` alcanzable desde internet es superficie de ataque que no hace falta.
--
-- Por qué no basta con quitar el permiso de ejecución: las políticas se evalúan con los permisos de quien
-- hace la consulta, así que si `authenticated` no puede ejecutarlas, deja de poder leer sus propios datos.
--
-- La solución es moverlas a un esquema que PostgREST no publica. Las políticas las siguen llamando igual;
-- la API ya no las ve.

create schema if not exists private;

-- Nadie sin sesión entra aquí. Quien la tiene, solo para que sus políticas puedan evaluarse.
revoke all on schema private from anon;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Las funciones, ahora en `private`
-- ---------------------------------------------------------------------------

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function private.current_user_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.client_id
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.current_user_role() = 'admin'
$$;

create or replace function private.advises_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and c.advisor_id = (select auth.uid())
      and private.current_user_role() = 'advisor'
  )
$$;

-- ---------------------------------------------------------------------------
-- 2. Las políticas, apuntando a las nuevas
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_select_advisor on public.profiles;
drop policy if exists profiles_write_admin on public.profiles;

drop policy if exists clients_select_admin on public.clients;
drop policy if exists clients_select_advisor on public.clients;
drop policy if exists clients_select_own on public.clients;
drop policy if exists clients_write_admin on public.clients;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (private.is_admin());

create policy profiles_select_advisor on public.profiles
  for select to authenticated
  using (client_id is not null and private.advises_client(client_id));

create policy profiles_write_admin on public.profiles
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy clients_select_admin on public.clients
  for select to authenticated
  using (private.is_admin());

create policy clients_select_advisor on public.clients
  for select to authenticated
  using (advisor_id = (select auth.uid()) and private.current_user_role() = 'advisor');

create policy clients_select_own on public.clients
  for select to authenticated
  using (id = private.current_user_client_id());

create policy clients_write_admin on public.clients
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Fuera las de `public`
-- ---------------------------------------------------------------------------

drop function if exists public.advises_client(uuid);
drop function if exists public.is_admin();
drop function if exists public.current_user_client_id();
drop function if exists public.current_user_role();

-- La del disparador tampoco pinta nada en la API: la llama el sistema, no una persona. Se mueve tal cual,
-- sin recrearla, porque el disparador guarda su identificador interno y lo sigue encontrando.
alter function public.enable_rls_on_new_tables() set schema private;
revoke all on function private.enable_rls_on_new_tables() from public, anon, authenticated;
