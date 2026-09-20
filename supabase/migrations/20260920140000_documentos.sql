-- Los documentos que sube el cliente y el almacén privado donde se guardan.
--
-- Reglas de docs/spec.md que dependen de esta migración: D1-D8, y con ellos E4 (con el expediente
-- cerrado el cliente no sube nada) y S4 (subir respondiendo a una solicitud la deja cumplida).

create type public.document_status as enum (
  'uploaded',
  'reading',
  'pending_review',
  'approved',
  'rejected'
);

-- Para poder exigir que la solicitud a la que responde un documento sea del mismo expediente.
alter table public.document_requests
  add constraint document_requests_id_dossier_key unique (id, dossier_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  -- D4 · Puede responder a una solicitud o no responder a ninguna.
  request_id uuid,
  -- El nombre con el que llegó, solo para enseñarlo. Nunca se usa como ruta (docs/security.md).
  original_name text not null check (length(trim(original_name)) > 0),
  -- D2 · El tipo lo decide el servidor mirando el archivo, no lo que diga el navegador.
  mime_type text not null check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  ),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  -- D5 · Dónde está en el almacén privado. Único: dos documentos no comparten archivo.
  storage_path text not null unique,
  -- D8 · Subido, leyéndose, pendiente de revisión, aprobado o rechazado.
  status public.document_status not null default 'uploaded',
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  -- La solicitud tiene que ser del mismo expediente: lo garantiza la base de datos, no la pantalla.
  constraint documents_request_same_dossier
    foreign key (request_id, dossier_id)
    references public.document_requests (id, dossier_id)
    on delete set null (request_id)
);

create index documents_dossier_id_idx on public.documents (dossier_id);
create index documents_request_id_idx on public.documents (request_id);

-- ---------------------------------------------------------------------------
-- Dos preguntas que las políticas necesitan hacerse
-- ---------------------------------------------------------------------------

/** Quién alcanza a una empresa: el administrador, su asesor y sus propios usuarios. */
create or replace function private.can_reach_client(target_client_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_admin()
      or private.advises_client(target_client_id)
      or private.current_user_client_id() = target_client_id
$$;

-- E4 · Con el expediente cerrado, el cliente no sube documentos nuevos.
create or replace function private.dossier_is_open(target_dossier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.dossiers d where d.id = target_dossier_id and d.status = 'open'
  )
$$;

revoke all on function private.can_reach_client(uuid) from public;
revoke all on function private.dossier_is_open(uuid) from public;
grant execute on function private.can_reach_client(uuid) to authenticated;
grant execute on function private.dossier_is_open(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- S4 · Subir un documento respondiendo a una solicitud la deja cumplida
--
-- Lo hace la base de datos y no la app: el usuario cliente no puede escribir en las solicitudes, y así
-- no hace falta abrirle ese permiso para algo que es consecuencia de lo que acaba de hacer.
-- ---------------------------------------------------------------------------

create or replace function private.fulfill_request_on_upload()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.request_id is not null then
    update public.document_requests
      set status = 'fulfilled'
      where id = new.request_id and status = 'pending';
  end if;

  return new;
end;
$$;

create trigger documents_fulfill_request
  after insert on public.documents
  for each row
  execute function private.fulfill_request_on_upload();

-- ---------------------------------------------------------------------------
-- Políticas de la tabla
-- ---------------------------------------------------------------------------

alter table public.documents enable row level security;

create policy documents_select on public.documents
  for select to authenticated
  using (private.can_reach_client(private.dossier_client_id(dossier_id)));

-- La asesoría sube a cualquier expediente de sus clientes.
create policy documents_insert_staff on public.documents
  for insert to authenticated
  with check (
    (private.is_admin() or private.advises_client(private.dossier_client_id(dossier_id)))
    and uploaded_by = (select auth.uid())
  );

-- E4 · El cliente, solo a los suyos y solo mientras estén abiertos.
create policy documents_insert_client on public.documents
  for insert to authenticated
  with check (
    private.current_user_client_id() = private.dossier_client_id(dossier_id)
    and private.dossier_is_open(dossier_id)
    and uploaded_by = (select auth.uid())
  );

create policy documents_delete_staff on public.documents
  for delete to authenticated
  using (private.is_admin() or private.advises_client(private.dossier_client_id(dossier_id)));

-- D7 · El cliente borra un documento de su empresa mientras no esté aprobado.
create policy documents_delete_client on public.documents
  for delete to authenticated
  using (
    private.current_user_client_id() = private.dossier_client_id(dossier_id)
    and status <> 'approved'
  );

-- Cambiar un documento (su estado, y más adelante sus datos) es cosa de la asesoría.
create policy documents_update_staff on public.documents
  for update to authenticated
  using (private.is_admin() or private.advises_client(private.dossier_client_id(dossier_id)))
  with check (private.is_admin() or private.advises_client(private.dossier_client_id(dossier_id)));

-- ---------------------------------------------------------------------------
-- El almacén privado (D5)
--
-- Nada de esto es público: no hay ninguna dirección que muestre un archivo sin comprobar antes quién
-- lo pide. El tamaño y los tipos se vuelven a limitar aquí, además de en la app.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- La ruta de cada archivo empieza por el identificador de la empresa: `empresa/expediente/archivo`.
-- Así la política sabe de quién es sin leer ninguna otra tabla.
create policy documentos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and private.can_reach_client(((storage.foldername(name))[1])::uuid)
  );

create policy documentos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and private.can_reach_client(((storage.foldername(name))[1])::uuid)
  );

create policy documentos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and private.can_reach_client(((storage.foldername(name))[1])::uuid)
  );
