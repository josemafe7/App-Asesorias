-- Tres agujeros que encontró la revisión de la fase 3.
--
-- 1. R7 · «El cliente no ve en ningún momento los datos propuestos por la IA». La política dejaba al
--    cliente leer la fila entera de sus documentos aprobados, y en esa fila está `ai_proposal`. Una
--    política decide qué FILAS se ven, no qué columnas: para las columnas hacen falta permisos.
--    Se le quita a todo el mundo: la propuesta se guarda para poder comparar (I7) y la lee el servidor
--    con la clave secreta, no el navegador de nadie.
--
-- 2. D7 · «Una vez aprobado, no puede borrarlo ni cambiar su archivo». La ficha sí estaba protegida,
--    pero el archivo del almacén no: un cliente podía borrarlo y subir otro en su sitio, dejando un
--    documento aprobado que apunta a otra cosa.
--
-- 3. «Quién puede hacer qué» no le da al asesor borrar documentos, y lo que no aparece ahí no está
--    permitido. Se queda solo para el administrador, que sí hace todo lo de cualquier cliente.

revoke select (ai_proposal) on public.document_data from authenticated;
revoke select (ai_proposal) on public.document_data from anon;

/** Si el archivo que hay en esa ruta pertenece a un documento ya aprobado. */
create or replace function private.storage_object_is_approved(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.documents d
    where d.storage_path = object_name and d.status = 'approved'
  )
$$;

revoke all on function private.storage_object_is_approved(text) from public;
grant execute on function private.storage_object_is_approved(text) to authenticated;

drop policy if exists documentos_delete on storage.objects;

create policy documentos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and private.can_reach_client(((storage.foldername(name))[1])::uuid)
    -- D7 · El cliente no toca el archivo de un documento aprobado. La asesoría sí, si hace falta.
    and (
      private.current_user_role() <> 'client'
      or not private.storage_object_is_approved(name)
    )
  );

drop policy if exists documents_delete_staff on public.documents;

create policy documents_delete_admin on public.documents
  for delete to authenticated
  using (private.is_admin());
