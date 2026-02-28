'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export default function NewProgramPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    price_cents: 0,
    duration_weeks: 8,
    level: 'intermediate',
    passing_score: 70,
    max_attempts: 3,
    is_published: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('programs').insert({
      ...form,
      price_cents: Number(form.price_cents),
      duration_weeks: Number(form.duration_weeks),
      passing_score: Number(form.passing_score),
      max_attempts: Number(form.max_attempts),
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/admin/programs')
    router.refresh()
  }

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">New Program</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a new certification program</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Program Title</Label>
          <Input id="title" value={form.title} onChange={e => update('title', e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" value={form.description} onChange={e => update('description', e.target.value)} rows={3} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Price (in cents, 0 = Free)</Label>
            <Input id="price" type="number" min={0} value={form.price_cents} onChange={e => update('price_cents', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weeks">Duration (weeks)</Label>
            <Input id="weeks" type="number" min={1} value={form.duration_weeks} onChange={e => update('duration_weeks', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Level</Label>
            <Select value={form.level} onValueChange={v => update('level', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passing">Passing Score (%)</Label>
            <Input id="passing" type="number" min={1} max={100} value={form.passing_score} onChange={e => update('passing_score', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attempts">Max Exam Attempts</Label>
            <Input id="attempts" type="number" min={1} value={form.max_attempts} onChange={e => update('max_attempts', e.target.value)} />
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
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? 'Creating…' : 'Create Program'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/programs')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
