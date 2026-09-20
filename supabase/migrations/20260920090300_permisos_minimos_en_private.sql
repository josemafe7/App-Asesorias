-- Permiso mínimo en las funciones de apoyo.
--
-- PostgreSQL da permiso de ejecución a `PUBLIC` en cada función nueva. Hoy eso no expone nada, porque
-- `anon` no tiene acceso al esquema `private` y PostgREST no lo publica. Pero deja el permiso diciendo
-- una cosa distinta de lo que queremos, y toda la protección colgando de una sola barrera: si algún día
-- alguien concede acceso al esquema, las funciones quedarían al alcance de cualquiera sin darse cuenta.
--
-- Aquí se quita el permiso heredado y se concede solo a quien lo necesita: los usuarios con sesión, para
-- que sus políticas puedan evaluarse.

revoke all on function private.current_user_role() from public;
revoke all on function private.current_user_client_id() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.advises_client(uuid) from public;

grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_user_client_id() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.advises_client(uuid) to authenticated;

-- Y lo mismo para lo que venga después: cualquier función nueva en `private` nace sin permiso para nadie.
alter default privileges in schema private revoke execute on functions from public;
