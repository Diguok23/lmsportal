'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Module {
  id?: string
  module_number: number
  title: string
  description: string
  learning_outcomes: string[]
  duration_hours: number
  topics: string[]
}

interface Props {
  programId: string
  programTitle: string
  programDescription: string
  programLevel: string
  durationWeeks: number
  initialModules: Module[]
}

export default function ProgramModulesManager({
  programId,
  programTitle,
  programDescription,
  programLevel,
  durationWeeks,
  initialModules,
}: Props) {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>(initialModules)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(modules.length > 0 ? 0 : null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function generateModules() {
    setGenerating(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: programTitle,
          description: programDescription,
          level: programLevel,
          duration_weeks: durationWeeks,
          type: 'modules',
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })
        }
      }
      const parsed = JSON.parse(raw.trim())
      if (Array.isArray(parsed)) {
        setModules(parsed)
        setExpandedIdx(0)
      } else throw new Error('Unexpected response format')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function saveModules() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/programs/${programId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setSuccess(`${modules.length} modules saved successfully.`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-foreground">Course Modules</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {modules.length > 0
              ? `${modules.length} modules · ${modules.reduce((s, m) => s + (m.duration_hours ?? 0), 0)}h total study time`
              : 'No modules yet — generate them with Grok AI'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {modules.length > 0 && (
            <Button onClick={saveModules} disabled={saving} size="sm" variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/5">
              {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Modules</>}
            </Button>
          )}
          <Button onClick={generateModules} disabled={generating} size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            {generating
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating…</>
              : modules.length > 0
                ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Regenerate</>
                : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate with AI</>}
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive border border-destructive/20">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 border border-emerald-200">{success}</div>}

      {generating && (
        <div className="flex flex-col items-center gap-3 py-14">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Grok AI is designing the curriculum…</p>
          <p className="text-xs text-muted-foreground/60">This may take up to 30 seconds</p>
        </div>
      )}

      {!generating && modules.length > 0 && (
        <div className="flex flex-col gap-2">
          {modules.map((mod, idx) => (
            <div key={idx} className="rounded-lg border border-border overflow-hidden">
              <button type="button"
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {mod.module_number}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{mod.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {mod.duration_hours}h · {mod.topics?.length ?? 0} topics · {mod.learning_outcomes?.length ?? 0} outcomes
                    </p>
                  </div>
                </div>
                {expandedIdx === idx
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
              {expandedIdx === idx && (
                <div className="px-4 py-5 border-t border-border flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Topics Covered</p>
                      <ul className="flex flex-col gap-1.5">
                        {mod.topics?.map((t, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Learning Outcomes</p>
                      <ul className="flex flex-col gap-1.5">
                        {mod.learning_outcomes?.map((o, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!generating && modules.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 border-2 border-dashed border-border rounded-xl">
          <Sparkles className="h-10 w-10 text-muted-foreground/20" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No modules yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Click &quot;Generate with AI&quot; to have Grok automatically create a full module breakdown with topics and learning outcomes.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
