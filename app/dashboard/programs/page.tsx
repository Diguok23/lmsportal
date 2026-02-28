import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ChevronRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ProgramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, status, enrolled_at, programs(id, title, description, duration_weeks, level, price_cents)')
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })

  const { data: available } = await supabase
    .from('programs')
    .select('id, title, description, price_cents, duration_weeks, level')
    .eq('is_published', true)

  const enrolledIds = new Set(enrollments?.map(e => (e.programs as { id: string }).id))
  const unenrolled = available?.filter(p => !enrolledIds.has(p.id)) ?? []

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Programs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your enrolled and available certification programs</p>
      </div>

      {enrollments && enrollments.length > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-foreground">My Enrollments</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((e) => {
              const p = e.programs as { id: string; title: string; description: string; duration_weeks: number; level: string } | null
              return (
                <Link key={e.id} href={`/dashboard/programs/${p?.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground leading-snug">{p?.title}</h3>
                    <Badge variant={e.status === 'completed' ? 'default' : 'secondary'} className="capitalize shrink-0 text-xs">
                      {e.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{p?.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground capitalize">{p?.level} · {p?.duration_weeks}w</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {unenrolled.length > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-foreground">Available Programs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {unenrolled.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground leading-snug">{p.title}</h3>
                  <Badge variant="outline" className="capitalize shrink-0 text-xs">{p.level}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <span className="text-sm font-bold text-primary">
                    {p.price_cents === 0 ? 'Free' : `$${(p.price_cents / 100).toFixed(0)}`}
                  </span>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                    <Link href={`/dashboard/programs/${p.id}/enroll`}>Enroll Now</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {enrollments?.length === 0 && unenrolled.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No programs available yet. Check back soon.</p>
        </div>
      )}
    </div>
  )
}
