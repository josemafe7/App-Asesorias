-- A11 · Un administrador no puede quitarse a sí mismo el rol ni desactivar su propia cuenta.
--
-- Hasta ahora esto solo lo impedía la app. La política de escritura de perfiles dejaba a un administrador
-- cambiar cualquier fila, también la suya, así que con la clave publicable que lleva su propio navegador
-- podía degradarse o desactivarse por la puerta de atrás, que es justo lo que A11 quiere evitar.
--
-- Ahora la base de datos tampoco le deja: su propia fila queda fuera de su alcance. Si hay que cambiarla,
-- lo hace otro administrador.
--
-- La política de antes servía para todo a la vez (`for all`); aquí se parte en tres para poder dejar la
-- excepción solo donde toca: crear perfiles nuevos sigue igual, y cambiar o borrar excluye el suyo.

drop policy if exists profiles_write_admin on public.profiles;

create policy profiles_insert_admin on public.profiles
  for insert to authenticated
  with check (private.is_admin());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (private.is_admin() and id <> (select auth.uid()))
  with check (private.is_admin() and id <> (select auth.uid()));

create policy profiles_delete_admin on public.profiles
  for delete to authenticated
  using (private.is_admin() and id <> (select auth.uid()));
