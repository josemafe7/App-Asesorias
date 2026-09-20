-- Expedientes trimestrales y solicitudes de documentación.
--
-- Reglas de docs/spec.md que dependen de esta migración: E1, E2, E3, E5, S1, S3, S5, S6.
--
-- Quién puede qué, y lo dice la base de datos, no solo la pantalla: el administrador todo; el asesor,
-- los expedientes y las solicitudes de los clientes que tiene asignados; el usuario cliente, los de su
-- propia empresa y solo para mirarlos.

create type public.dossier_status as enum ('open', 'closed');
create type public.request_status as enum ('pending', 'fulfilled', 'cancelled');

-- E1 · Un expediente es un cliente, un año y un trimestre.
create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  year smallint not null check (year between 2000 and 2100),
  quarter smallint not null check (quarter between 1 and 4),
  -- E3 · Abierto o cerrado. El asesor lo cierra al terminar y puede volver a abrirlo.
  status public.dossier_status not null default 'open',
  created_at timestamptz not null default now(),
  -- E2 · Ni uno más por cliente, año y trimestre. La restricción está aquí a propósito: si dos asesores
  -- lo abren en el mismo instante, la pantalla no llega a tiempo de evitarlo y la base de datos sí.
  constraint dossiers_one_per_quarter unique (client_id, year, quarter)
);

-- S1 · El título y la fecha límite son obligatorios; la descripción, no.
create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  due_date date not null,
  -- S3 · Pendiente, cumplida o cancelada.
  status public.request_status not null default 'pending',
  -- M3 · Cuándo salió el último recordatorio de esta solicitud. Se usa al llegar los recordatorios.
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index dossiers_client_id_idx on public.dossiers (client_id);
create index document_requests_dossier_id_idx on public.document_requests (dossier_id);

-- ---------------------------------------------------------------------------
-- La empresa a la que pertenece un expediente
--
-- Las políticas de las solicitudes la necesitan para saber de quién son. Va en `private` y como
-- `security definer` por lo mismo que sus hermanas: las políticas la llaman, la API de Supabase no la
-- ve, y solo sirve para responder a una pregunta que el propio usuario ya puede hacerse.
-- ---------------------------------------------------------------------------

create or replace function private.dossier_client_id(target_dossier_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.client_id
  from public.dossiers d
  where d.id = target_dossier_id
$$;

revoke all on function private.dossier_client_id(uuid) from public;
grant execute on function private.dossier_client_id(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas
-- ---------------------------------------------------------------------------

alter table public.dossiers enable row level security;
alter table public.document_requests enable row level security;

-- Expedientes: mirar.
create policy dossiers_select_admin on public.dossiers
  for select to authenticated
  using (private.is_admin());

create policy dossiers_select_advisor on public.dossiers
  for select to authenticated
  using (private.advises_client(client_id));

-- E5 · El cliente ve los expedientes de su empresa.
create policy dossiers_select_client on public.dossiers
  for select to authenticated
  using (client_id = private.current_user_client_id());

-- Expedientes: abrir, cerrar y volver a abrir. El usuario cliente no, en ningún caso.
create policy dossiers_write_admin on public.dossiers
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy dossiers_write_advisor on public.dossiers
  for all to authenticated
  using (private.advises_client(client_id))
  with check (private.advises_client(client_id));

-- Solicitudes: mirar.
create policy requests_select_admin on public.document_requests
  for select to authenticated
  using (private.is_admin());

create policy requests_select_advisor on public.document_requests
  for select to authenticated
  using (private.advises_client(private.dossier_client_id(dossier_id)));

-- S6 · El cliente ve las solicitudes de su empresa.
create policy requests_select_client on public.document_requests
  for select to authenticated
  using (private.dossier_client_id(dossier_id) = private.current_user_client_id());

-- Solicitudes: crearlas y cancelarlas (S1, S5). Del asesor del cliente y del administrador.
create policy requests_write_admin on public.document_requests
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy requests_write_advisor on public.document_requests
  for all to authenticated
  using (private.advises_client(private.dossier_client_id(dossier_id)))
  with check (private.advises_client(private.dossier_client_id(dossier_id)));
