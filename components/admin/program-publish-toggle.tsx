'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  programId: string
  isPublished: boolean
}

export default function ProgramPublishToggle({ programId, isPublished: initial }: Props) {
  const router = useRouter()
  const [published, setPublished] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('programs').update({ is_published: !published }).eq('id', programId)
    setPublished(p => !p)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button onClick={toggle} variant="outline" size="sm" disabled={loading}
      className={published ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}>
      {loading ? '…' : published ? 'Unpublish' : 'Publish'}
    </Button>
  )
}
