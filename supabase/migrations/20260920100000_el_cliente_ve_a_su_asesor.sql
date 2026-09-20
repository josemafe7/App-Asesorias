-- El usuario cliente puede ver el perfil del asesor asignado a su empresa, y solo el suyo.
--
-- Regla de docs/spec.md que depende de esta migración: A10 · «Escribir a mi asesor» abre el programa de
-- correo con la dirección del asesor asignado ya puesta. Sin esta política, un cliente no puede leer
-- ningún perfil que no sea el suyo, así que la app no tiene de dónde sacar ese correo.
--
-- Lo que se abre es lo justo: la fila del asesor de su propia empresa. Ni la de otro asesor, ni la del
-- administrador, ni la de ningún otro usuario.

-- El asesor de mi empresa. Va en `private` y como `security definer` por lo mismo que sus hermanas de la
-- migración anterior: las políticas la llaman, la API de Supabase no la ve, y solo devuelve un dato del
-- usuario que pregunta. Un usuario desactivado no tiene empresa a efectos de esta función, porque
-- `current_user_client_id()` ya devuelve null.
create or replace function private.current_client_advisor_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.advisor_id
  from public.clients c
  where c.id = private.current_user_client_id()
$$;

create policy profiles_select_my_advisor on public.profiles
  for select to authenticated
  using (
    private.current_user_role() = 'client'
    and role = 'advisor'
    and id = private.current_client_advisor_id()
  );

-- La migración anterior dejó dicho que toda función nueva de `private` nace sin permiso para nadie, así
-- que hay que dárselo a quien lo necesita: los usuarios con sesión, para que su política se pueda evaluar.
revoke all on function private.current_client_advisor_id() from public;
grant execute on function private.current_client_advisor_id() to authenticated;
