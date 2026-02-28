'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function RevokeCertButton({ certId }: { certId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function revoke() {
    if (!confirmed) { setConfirmed(true); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('certificates').update({ revoked: true }).eq('id', certId)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={revoke} disabled={loading}
      className={`text-xs ${confirmed ? 'text-destructive hover:text-destructive border border-destructive/30' : 'text-muted-foreground'}`}>
      {loading ? '…' : confirmed ? 'Confirm Revoke' : 'Revoke'}
    </Button>
  )
}
