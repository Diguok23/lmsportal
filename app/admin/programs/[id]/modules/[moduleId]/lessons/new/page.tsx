'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string; moduleId: string }>
}

export default function NewLessonPage({ params }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    objectives: '',
    content: '',
    sort_order: 0,
    is_published: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resolvedParams, setResolvedParams] = useState<{ id: string; moduleId: string } | null>(null)

  // Resolve params on mount
  if (!resolvedParams) {
    params.then(p => setResolvedParams(p))
    return <div className="p-8 text-muted-foreground text-sm">Loading…</div>
  }

  const { id: programId, moduleId } = resolvedParams

  function update(field: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('lessons').insert({
      ...form,
      module_id: moduleId,
      sort_order: Number(form.sort_order),
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/admin/programs/${programId}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit text-muted-foreground">
        <Link href={`/admin/programs/${programId}`}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-primary">New Lesson</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add a lesson to this module</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Lesson Title</Label>
          <Input id="title" value={form.title} onChange={e => update('title', e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objectives">Learning Objectives</Label>
          <Textarea id="objectives" value={form.objectives} onChange={e => update('objectives', e.target.value)} rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="content">Lesson Content</Label>
          <Textarea id="content" value={form.content} onChange={e => update('content', e.target.value)} rows={8} placeholder="Paste or type content here. You can also use the AI Content feature after saving." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order">Sort Order</Label>
            <Input id="order" type="number" min={0} value={form.sort_order} onChange={e => update('sort_order', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Published</Label>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={form.is_published} onCheckedChange={v => update('is_published', v)} />
              <span className="text-sm text-muted-foreground">{form.is_published ? 'Published' : 'Draft'}</span>
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? 'Saving…' : 'Save Lesson'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/programs/${programId}`)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
