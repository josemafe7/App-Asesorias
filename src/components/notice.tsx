/**
 * Un aviso corto encima del contenido: «guardado», «invitación enviada».
 *
 * Lo pinta el servidor a partir de la dirección (por ejemplo `?guardado=1`), y no un mensaje guardado en
 * el navegador: así la pantalla siempre enseña lo que hay de verdad en la base de datos.
 */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-md border border-success bg-card px-4 py-3 text-[15px] text-success">
      {children}
    </p>
  )
}
