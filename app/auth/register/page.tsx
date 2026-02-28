import { Suspense } from 'react'
import RegisterPageClient from './register-client'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-primary text-primary-foreground">Loading…</div>}>
      <RegisterPageClient />
    </Suspense>
  )
}
