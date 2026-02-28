import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, ChevronLeft } from 'lucide-react'
import ProgramPublishToggle from '@/components/admin/program-publish-toggle'
import AdminAIContent from '@/components/admin/ai-content-button'

export default async function AdminProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: program } = await supabase
    .from('programs')
    .select('*, modules(id, title, description, sort_order, lessons(id, title, is_published, sort_order))')
    .eq('id', id)
    .single()

  if (!program) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, question_type, module_id')
    .eq('program_id', id)
    .order('created_at', { ascending: true })

  const sortedModules = (program.modules ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/admin/programs"><ChevronLeft className="h-4 w-4 mr-1" /> Programs</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">{program.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{program.description}</p>
          <div className="flex gap-3 mt-3">
            <Badge variant="secondary" className="capitalize">{program.level}</Badge>
            <Badge variant={program.is_published ? 'default' : 'outline'}>
              {program.is_published ? 'Published' : 'Draft'}
            </Badge>
            <span className="text-xs text-muted-foreground self-center">${(program.price_cents / 100).toFixed(0)} · {program.duration_weeks}w · Pass: {program.passing_score}%</span>
          </div>
        </div>
        <ProgramPublishToggle programId={id} isPublished={program.is_published} />
      </div>

      {/* MODULES */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Modules & Lessons</h2>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
            <Link href={`/admin/programs/${id}/modules/new`}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Module</Link>
          </Button>
        </div>

        {sortedModules.map((module: { id: string; title: string; description: string; lessons: { id: string; title: string; is_published: boolean; sort_order: number }[] }) => {
          const lessons = (module.lessons ?? []).sort((a, b) => a.sort_order - b.sort_order)
          return (
            <div key={module.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between bg-primary/5 px-5 py-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{module.title}</h3>
                  {module.description && <p className="text-xs text-muted-foreground mt-0.5">{module.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href={`/admin/programs/${id}/modules/${module.id}/lessons/new`}>
                      <Plus className="h-3 w-3 mr-1" /> Add Lesson
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${lesson.is_published ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                      <span className="text-sm text-foreground">{lesson.title}</span>
                      {!lesson.is_published && <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <AdminAIContent lessonId={lesson.id} lessonTitle={lesson.title} />
                      <Button asChild variant="ghost" size="sm" className="text-xs">
                        <Link href={`/admin/programs/${id}/modules/${module.id}/lessons/${lesson.id}`}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {lessons.length === 0 && (
                  <p className="px-5 py-4 text-xs text-muted-foreground">No lessons yet. Add your first lesson.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* QUESTIONS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Assessment Questions</h2>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
            <Link href={`/admin/programs/${id}/questions/new`}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Question</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Question</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questions?.map((q, i) => (
                <tr key={q.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-5 py-3 text-foreground text-sm">{q.question_text}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="capitalize text-xs">{q.question_type.replace('_', ' ')}</Badge>
                  </td>
                </tr>
              ))}
              {(!questions || questions.length === 0) && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground text-sm">No questions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
