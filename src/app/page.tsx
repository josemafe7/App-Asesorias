import { redirect } from 'next/navigation'

import { getCurrentProfile } from '@/data/profile'
import { ROLE_HOME } from '@/lib/roles'

// La portada no muestra nada: manda a cada uno a donde le toca.
export default async function HomePage() {
  const profile = await getCurrentProfile()
  redirect(profile ? ROLE_HOME[profile.role] : '/acceso')
}
