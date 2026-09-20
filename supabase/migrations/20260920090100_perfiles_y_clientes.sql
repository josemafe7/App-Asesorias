-- Perfiles (quién es cada usuario y qué rol tiene) y clientes (las empresas asesoradas).
--
-- Reglas de docs/spec.md que dependen de esta migración: A3, A4, C1, C2, C3, C4, C5, C6, C7.
--
-- El rol vive aquí, en una tabla protegida, y NUNCA en `user_metadata`, que el propio usuario puede
-- cambiar desde el navegador (docs/security.md · «Usuarios y permisos»).

create type public.user_role as enum ('admin', 'advisor', 'client');

-- C7 · Cada usuario cliente pertenece a una empresa; una empresa puede tener uno o varios usuarios.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null check (length(trim(full_name)) > 0),
  role public.user_role not null,
  client_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  -- Un usuario cliente pertenece siempre a una empresa; un administrador o un asesor, nunca.
  constraint profiles_client_matches_role check (
    (role = 'client' and client_id is not null)
    or (role <> 'client' and client_id is null)
  )
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  -- C1 · La razón social y el NIF son obligatorios; el correo y el teléfono, no.
  legal_name text not null check (length(trim(legal_name)) > 0),
  -- C2 · El NIF se guarda siempre en mayúsculas y sin espacios, y la restricción lo obliga. Así
  -- «b12345678» y «B12345678 » no pueden colarse como dos empresas distintas, y la unicidad de abajo
  -- es una comparación directa, no depende de que la app se acuerde de normalizar.
  tax_id text not null unique check (tax_id = upper(trim(tax_id)) and length(tax_id) > 0),
  email text,
  phone text,
  -- C3 · El asesor asignado. Si se borra su perfil, el cliente queda sin asignar, nunca se borra.
  advisor_id uuid references public.profiles (id) on delete set null,
  -- C6 · Desactivar un cliente no borra nada.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete restrict;

create index profiles_client_id_idx on public.profiles (client_id);
create index clients_advisor_id_idx on public.clients (advisor_id);

-- ---------------------------------------------------------------------------
-- Funciones de apoyo para las políticas
--
-- Van como SECURITY DEFINER a propósito: una política sobre `profiles` que consultara `profiles` entraría
-- en un bucle infinito. Estas funciones leen la tabla saltándose RLS, pero solo devuelven datos del
-- usuario que hace la petición, así que no filtran nada. `search_path = ''` obliga a nombrar los objetos
-- por su esquema y evita que alguien las engañe creando tablas con el mismo nombre.
-- ---------------------------------------------------------------------------

-- A4 · Un usuario desactivado no es nadie: estas funciones devuelven null y ninguna política le deja pasar.
create or replace function public.current_user_role()
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

create or replace function public.current_user_client_id()
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

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_user_role() = 'admin'
$$;

-- C4 · Un asesor solo ve los clientes que tiene asignados.
create or replace function public.advises_client(target_client_id uuid)
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
      and public.current_user_role() = 'advisor'
  )
$$;

-- ---------------------------------------------------------------------------
-- Políticas
--
-- El disparador de la migración anterior ya activó RLS en las dos tablas. Se repite aquí de forma
-- explícita para que esta migración se sostenga sola si alguien la lee suelta.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.clients enable row level security;

-- Perfiles: cada uno el suyo; el administrador, todos; el asesor, los de los usuarios de sus clientes.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy profiles_select_advisor on public.profiles
  for select to authenticated
  using (client_id is not null and public.advises_client(client_id));

-- Crear, cambiar y desactivar usuarios es solo del administrador (docs/spec.md · «Quién puede hacer qué»).
create policy profiles_write_admin on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Clientes: el administrador todos; el asesor los asignados; el usuario cliente, solo el suyo.
create policy clients_select_admin on public.clients
  for select to authenticated
  using (public.is_admin());

create policy clients_select_advisor on public.clients
  for select to authenticated
  using (advisor_id = (select auth.uid()) and public.current_user_role() = 'advisor');

create policy clients_select_own on public.clients
  for select to authenticated
  using (id = public.current_user_client_id());

-- Alta, edición y asignación: solo el administrador.
create policy clients_write_admin on public.clients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
