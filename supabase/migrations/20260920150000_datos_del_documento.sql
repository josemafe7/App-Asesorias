-- Los datos de cada documento: lo que propone la IA y lo que el asesor da por bueno.
--
-- Reglas de docs/spec.md que dependen de esta migración: I1, I2, I3, I7 y, cuando llegue la revisión,
-- R3, R4, R5 y R7.
--
-- R7 · El cliente no ve en ningún momento lo que propuso la IA: solo ve los datos cuando el documento
-- está aprobado. Eso no es una pantalla que se esconde, es una política.

-- I3 · El catálogo de categorías de gasto. Lista fija: se carga aquí y nadie la escribe desde la app.
create table public.expense_categories (
  code text primary key,
  label text not null,
  sort_order smallint not null
);

insert into public.expense_categories (code, label, sort_order) values
  ('suministros', 'Suministros (luz, agua, gas)', 1),
  ('telefonia_internet', 'Teléfono e internet', 2),
  ('alquiler', 'Alquiler', 3),
  ('compras_mercaderias', 'Compras y mercaderías', 4),
  ('servicios_profesionales', 'Servicios profesionales', 5),
  ('seguros', 'Seguros', 6),
  ('reparaciones', 'Reparaciones y mantenimiento', 7),
  ('transporte_combustible', 'Transporte y combustible', 8),
  ('viajes_dietas', 'Viajes y dietas', 9),
  ('publicidad', 'Publicidad y marketing', 10),
  ('material_oficina', 'Material de oficina', 11),
  ('equipamiento', 'Equipamiento y mobiliario', 12),
  ('formacion', 'Formación', 13),
  ('gastos_financieros', 'Gastos financieros', 14),
  ('tributos', 'Impuestos y tasas', 15),
  ('otros', 'Otros gastos', 16);

alter table public.expense_categories enable row level security;

create policy expense_categories_select on public.expense_categories
  for select to authenticated
  using (true);

-- I1 · Los datos de un documento. Uno por documento.
create table public.document_data (
  document_id uuid primary key references public.documents (id) on delete cascade,
  issue_date date,
  supplier text,
  supplier_tax_id text,
  tax_base numeric(12, 2),
  vat_rate numeric(5, 2),
  vat_amount numeric(12, 2),
  total numeric(12, 2),
  category_code text references public.expense_categories (code),
  -- I2 · Qué campos se quedaron pendientes de rellenar a mano.
  pending_fields text[] not null default '{}',
  -- I7 · Lo que propuso la IA, tal cual, aparte del dato ya validado.
  ai_proposal jsonb,
  -- I4 · Los importes no cuadraban: lo mira una persona.
  needs_review boolean not null default false,
  -- R4 · Al aprobar se guarda quién y cuándo.
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  updated_at timestamptz not null default now()
);

-- R5 · Al rechazar un documento, el motivo es obligatorio: si hay motivo, hay rechazo, y al revés.
alter table public.documents add column rejection_reason text;
alter table public.documents add constraint documents_rejection_reason_matches_status check (
  (status = 'rejected' and length(trim(coalesce(rejection_reason, ''))) > 0)
  or (status <> 'rejected' and rejection_reason is null)
);

alter table public.document_data enable row level security;

/** Si un documento está aprobado. Lo usa la política que deja al cliente ver sus datos (R7). */
create or replace function private.document_is_approved(target_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.documents d where d.id = target_document_id and d.status = 'approved'
  )
$$;

/** La empresa de un documento, para saber quién lo alcanza. */
create or replace function private.document_client_id(target_document_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select private.dossier_client_id(d.dossier_id)
  from public.documents d
  where d.id = target_document_id
$$;

revoke all on function private.document_is_approved(uuid) from public;
revoke all on function private.document_client_id(uuid) from public;
grant execute on function private.document_is_approved(uuid) to authenticated;
grant execute on function private.document_client_id(uuid) to authenticated;

-- La asesoría ve los datos siempre.
create policy document_data_select_staff on public.document_data
  for select to authenticated
  using (
    private.is_admin()
    or private.advises_client(private.document_client_id(document_id))
  );

-- R7 · El cliente, solo cuando el documento está aprobado.
create policy document_data_select_client on public.document_data
  for select to authenticated
  using (
    private.current_user_client_id() = private.document_client_id(document_id)
    and private.document_is_approved(document_id)
  );

-- Escribir los datos es de la asesoría. Lo que propone la IA lo guarda el propio servidor, que para
-- eso no pasa por estas políticas (ver docs/decisions/0006).
create policy document_data_write_staff on public.document_data
  for all to authenticated
  using (private.is_admin() or private.advises_client(private.document_client_id(document_id)))
  with check (private.is_admin() or private.advises_client(private.document_client_id(document_id)));
