'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default function NewModulePage({ params }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', description: '', sort_order: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [programId, setProgramId] = useState<string | null>(null)

  if (!programId) {
    params.then(p => setProgramId(p.id))
    return <div className="p-8 text-muted-foreground text-sm">Loading…</div>
  }

  function update(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('modules').insert({
      ...form,
      program_id: programId,
      sort_order: Number(form.sort_order),
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/admin/programs/${programId}`)
    router.refresh()
  }

  return (
    <div className="max-w-xl flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit text-muted-foreground">
        <Link href={`/admin/programs/${programId}`}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-primary">New Module</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add a module to this program</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Module Title</Label>
          <Input id="title" value={form.title} onChange={e => update('title', e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" value={form.description} onChange={e => update('description', e.target.value)} rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="order">Sort Order</Label>
          <Input id="order" type="number" min={0} value={form.sort_order} onChange={e => update('sort_order', e.target.value)} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? 'Saving…' : 'Save Module'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/programs/${programId}`)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
