-- Seguridad por filas activada por defecto.
--
-- Esta es la primera migración del proyecto y su única misión es que nadie pueda crear una tabla en
-- `public` sin protección. Un disparador de eventos (event trigger) se ejecuta después de cada CREATE TABLE
-- y le activa Row Level Security. Sin políticas, una tabla con RLS activo no deja pasar a nadie: el fallo
-- por descuido es "no se ve nada", no "se ve todo".
--
-- docs/security.md · «Row Level Security se activa en la misma migración que crea cada tabla, y la primera
-- migración añade un disparador que lo activa solo en las tablas nuevas».

create or replace function public.enable_rls_on_new_tables()
returns event_trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  obj record;
begin
  for obj in
    select * from pg_event_trigger_ddl_commands()
    where command_tag = 'CREATE TABLE' and schema_name = 'public'
  loop
    execute format('alter table %s enable row level security', obj.object_identity);
  end loop;
end;
$$;

comment on function public.enable_rls_on_new_tables() is
  'Activa Row Level Security en cada tabla nueva de public. No toca las tablas existentes.';

drop event trigger if exists enable_rls_on_new_tables;

create event trigger enable_rls_on_new_tables
  on ddl_command_end
  when tag in ('CREATE TABLE')
  execute function public.enable_rls_on_new_tables();
