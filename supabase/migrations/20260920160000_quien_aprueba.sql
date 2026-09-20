-- X2 · El CSV lleva el nombre de quien aprobó cada documento.
--
-- Se guarda el nombre, además del identificador, por dos motivos: un asesor no puede leer el perfil de
-- otro (sus políticas solo le dejan ver a sus clientes), y una exportación es una foto de un momento,
-- así que tiene que seguir diciendo quién aprobó aunque esa persona ya no esté en la asesoría.
alter table public.document_data add column approved_by_name text;
