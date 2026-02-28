import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LessonCompleteButton from '@/components/lesson-complete-button'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id: programId, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status')
    .eq('student_id', user.id)
    .eq('program_id', programId)
    .single()

  if (!enrollment || enrollment.status !== 'active') redirect(`/dashboard/programs/${programId}`)

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, objectives, content, module_id, modules(title, program_id)')
    .eq('id', lessonId)
    .eq('is_published', true)
    .single()

  if (!lesson) notFound()

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  const isCompleted = progress?.completed === true

  const module_ = lesson.modules as { title: string; program_id: string } | null

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href={`/dashboard/programs/${programId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Program
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-primary/5 border-b border-border px-8 py-5">
          <p className="text-xs text-muted-foreground mb-1">{module_?.title}</p>
          <h1 className="text-xl font-bold text-primary">{lesson.title}</h1>
        </div>

        <div className="p-8 flex flex-col gap-6">
          {lesson.objectives && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">Learning Objectives</h3>
              <p className="text-sm text-foreground leading-relaxed">{lesson.objectives}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none text-foreground">
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {lesson.content ?? 'Content coming soon.'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-medium text-foreground">
            {isCompleted ? 'Lesson completed' : 'Mark this lesson as complete'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCompleted ? 'You have already completed this lesson' : 'Mark done when you finish reading'}
          </p>
        </div>
        <LessonCompleteButton lessonId={lessonId} programId={programId} completed={isCompleted} />
      </div>
    </div>
  )
}
