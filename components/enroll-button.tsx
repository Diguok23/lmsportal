'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { EnrollmentPayment } from '@/components/enrollment-payment'

interface Props {
  programId: string
  price: number
  title: string
}

export default function EnrollButton({ programId, price, title }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPayment, setShowPayment] = useState(false)

  async function handleEnroll() {
    setLoading(true)
    setError('')

    if (price === 0) {
      // Free: create enrollment directly
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      await supabase.from('enrollments').upsert({
        student_id: user.id,
        program_id: programId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'student_id,program_id' })

      router.push(`/dashboard/programs/${programId}`)
      router.refresh()
      return
    }

    // Paid: show payment form
    setShowPayment(true)
    setLoading(false)
  }

  if (showPayment) {
    return (
      <EnrollmentPayment
        programId={programId}
        programTitle={title}
        amount={price / 100}
        onSuccess={() => {
          router.push(`/dashboard/programs/${programId}`)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleEnroll} disabled={loading}
        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
        {loading ? 'Processing…' : price === 0 ? 'Enroll Free' : 'Pay & Enroll'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

