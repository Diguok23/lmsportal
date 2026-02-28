'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Props {
  lessonId: string
  lessonTitle: string
}

export default function AdminAIContent({ lessonId, lessonTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function generateContent() {
    setLoading(true)
    setContent('')
    setSaved(false)
    const res = await fetch('/api/ai/generate-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonTitle }),
    })
    const data = await res.json()
    setContent(data.content ?? 'Could not generate content.')
    setLoading(false)
  }

  async function saveContent() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('lessons').update({ ai_draft: content, content }).eq('id', lessonId)
    setSaved(true)
    setSaving(false)
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent" onClick={() => { setOpen(true); generateContent() }}>
        <Sparkles className="h-3 w-3 mr-1" /> AI Content
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI-Generated Content</DialogTitle>
            <DialogDescription>{lessonTitle}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <textarea
                className="min-h-[300px] w-full rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            )}
            <div className="flex gap-3">
              <Button onClick={generateContent} variant="outline" size="sm" disabled={loading} className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Regenerate
              </Button>
              <Button onClick={saveContent} disabled={loading || saving || saved} size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                {saved ? 'Saved!' : saving ? 'Saving…' : 'Save to Lesson'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
