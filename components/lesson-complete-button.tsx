'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface Props {
  lessonId: string
  programId: string
  completed: boolean
}

export default function LessonCompleteButton({ lessonId, programId, completed: initialCompleted }: Props) {
  const router = useRouter()
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)

  async function markComplete() {
    if (completed) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('lesson_progress').upsert({
      student_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' })

    setCompleted(true)
    setLoading(false)
    router.push(`/dashboard/programs/${programId}`)
    router.refresh()
  }

  return (
    <Button
      onClick={markComplete}
      disabled={completed || loading}
      className={completed
        ? 'bg-green-600 text-white cursor-default hover:bg-green-600'
        : 'bg-primary text-primary-foreground hover:bg-primary/90'}
    >
      {completed ? (
        <><CheckCircle className="mr-2 h-4 w-4" /> Completed</>
      ) : loading ? 'Saving…' : 'Mark Complete'}
    </Button>
  )
}
