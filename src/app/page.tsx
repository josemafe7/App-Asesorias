import { redirect } from 'next/navigation'

import { getCurrentProfile, ROLE_HOME } from '@/data/profile'

// La portada no muestra nada: manda a cada uno a donde le toca.
export default async function HomePage() {
  const profile = await getCurrentProfile()
  redirect(profile ? ROLE_HOME[profile.role] : '/acceso')
}
