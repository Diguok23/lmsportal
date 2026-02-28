'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default function NewQuestionPage({ params }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a',
    question_type: 'final_exam',
    module_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [programId, setProgramId] = useState<string | null>(null)

  if (!programId) {
    params.then(p => setProgramId(p.id))
    return <div className="p-8 text-muted-foreground text-sm">Loading…</div>
  }

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('questions').insert({
      question_text: form.question_text,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      option_d: form.option_d,
      correct_answer: form.correct_answer,
      question_type: form.question_type,
      program_id: programId,
      module_id: form.question_type === 'module_quiz' && form.module_id ? form.module_id : null,
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
        <h1 className="text-2xl font-bold text-primary">New Question</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add a multiple-choice question</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col gap-1.5">
          <Label>Question Type</Label>
          <Select value={form.question_type} onValueChange={v => update('question_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="final_exam">Final Exam</SelectItem>
              <SelectItem value="module_quiz">Module Quiz</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q">Question Text</Label>
          <Textarea id="q" value={form.question_text} onChange={e => update('question_text', e.target.value)} required rows={3} />
        </div>
        {(['a', 'b', 'c', 'd'] as const).map(opt => (
          <div key={opt} className="flex flex-col gap-1.5">
            <Label htmlFor={`opt_${opt}`}>Option {opt.toUpperCase()}</Label>
            <Input id={`opt_${opt}`} value={form[`option_${opt}`]} onChange={e => update(`option_${opt}`, e.target.value)} required />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label>Correct Answer</Label>
          <Select value={form.correct_answer} onValueChange={v => update('correct_answer', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['a', 'b', 'c', 'd'].map(o => (
                <SelectItem key={o} value={o}>Option {o.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? 'Saving…' : 'Save Question'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/programs/${programId}`)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
