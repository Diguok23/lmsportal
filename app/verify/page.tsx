import { Suspense } from 'react'
import VerifyPageClient from './verify-client'

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-primary text-primary-foreground">Loading…</div>}>
      <VerifyPageClient />
    </Suspense>
  )
}
