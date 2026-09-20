-- R7 · La propuesta de la IA, esta vez de verdad.
--
-- La migración anterior quitaba el permiso de leer la columna `ai_proposal`, pero eso no servía de
-- nada: quitar el permiso de UNA columna no hace nada si el rol tiene el permiso de leer LA TABLA
-- entera, que es lo que Supabase concede por defecto. La prueba que ataca la base de datos lo dejó ver:
-- el cliente seguía leyéndola.
--
-- Lo que sí funciona: quitar el permiso sobre la tabla y devolverlo columna a columna, todas menos esa.
-- La propuesta se sigue guardando para poder comparar (I7) y la lee el servidor con la clave secreta.

revoke select on public.document_data from authenticated;
revoke select on public.document_data from anon;

grant select (
  document_id,
  issue_date,
  supplier,
  supplier_tax_id,
  tax_base,
  vat_rate,
  vat_amount,
  total,
  category_code,
  pending_fields,
  needs_review,
  approved_by,
  approved_by_name,
  approved_at,
  updated_at
) on public.document_data to authenticated;
