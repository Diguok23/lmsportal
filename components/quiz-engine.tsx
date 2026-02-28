'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Award, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

interface Attempt {
  id: string
  score: number
  passed: boolean
  submitted_at: string
}

interface Props {
  programId: string
  moduleId: string | null
  moduleTitle: string
  questions: Question[]
  attempts: Attempt[]
  type: 'module_quiz' | 'final_exam'
  passingScore?: number
}

export default function QuizEngine({
  programId,
  moduleId,
  moduleTitle,
  questions,
  attempts,
  type,
  passingScore = 70,
}: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const current = questions[currentIndex]
  const totalAnswered = Object.keys(answers).length
  const allAnswered = totalAnswered === questions.length

  function selectAnswer(questionId: string, option: string) {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  async function submitQuiz() {
    if (!allAnswered) { setError('Please answer all questions before submitting.'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Score by fetching correct answers server side via API
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId, moduleId, answers, type }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Submission failed'); setLoading(false); return }

    setScore(data.score)
    setPassed(data.passed)
    setSubmitted(true)
    setLoading(false)
    router.refresh()
  }

  if (submitted && score !== null) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">
        <div className={`rounded-2xl border p-10 text-center flex flex-col items-center gap-4 ${passed ? 'border-green-200 bg-green-50' : 'border-destructive/20 bg-destructive/5'}`}>
          {passed ? (
            <Award className="h-16 w-16 text-green-600" />
          ) : (
            <AlertCircle className="h-16 w-16 text-destructive" />
          )}
          <h2 className="text-2xl font-bold text-foreground">
            {passed ? 'Congratulations!' : 'Not Quite There'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-5xl font-bold text-primary">{score}%</span>
          </div>
          <p className="text-muted-foreground text-sm">
            {passed
              ? `You passed with ${score}%. Well done!`
              : `You scored ${score}%. The passing score is ${passingScore}%.`}
          </p>
          {passed && type === 'final_exam' && (
            <div className="mt-2 rounded-lg bg-green-100 border border-green-200 px-6 py-3 text-sm text-green-800 font-medium">
              Your certificate is being processed. Check your certificates page shortly.
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href={`/dashboard/programs/${programId}`}>Back to Program</Link>
          </Button>
          {type === 'final_exam' && passed && (
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/certificates">View Certificates</Link>
            </Button>
          )}
        </div>
        {attempts.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">Attempt History</h3>
            <div className="flex flex-col gap-2">
              {attempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(a.submitted_at).toLocaleDateString()}</span>
                  <span className={`font-semibold ${a.passed ? 'text-green-600' : 'text-destructive'}`}>
                    {a.score}% — {a.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-primary">{moduleTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{questions.length} questions · Passing score: {passingScore}%</p>
      </div>

      {attempts.length > 0 && (
        <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground">
          Previous attempts: {attempts.length} · Best score: {Math.max(...attempts.map(a => a.score))}%
        </div>
      )}

      {/* PROGRESS */}
      <div className="flex gap-1.5">
        {questions.map((q, i) => (
          <button key={q.id} onClick={() => setCurrentIndex(i)}
            className={`h-2 flex-1 rounded-full transition-colors ${answers[q.id] ? 'bg-primary' : i === currentIndex ? 'bg-primary/40' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right -mt-4">{totalAnswered}/{questions.length} answered</p>

      {/* QUESTION */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-foreground leading-relaxed">{currentIndex + 1}. {current.question_text}</p>
        </div>
        <div className="grid gap-3">
          {(['a', 'b', 'c', 'd'] as const).map((opt) => {
            const text = current[`option_${opt}` as keyof Question] as string
            const selected = answers[current.id] === opt
            return (
              <button key={opt} onClick={() => selectAnswer(current.id, opt)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${selected
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50 text-foreground'}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>
                  {opt.toUpperCase()}
                </span>
                {text}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button variant="outline" size="sm" onClick={() => setCurrentIndex(i => i + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submitQuiz} disabled={loading || !allAnswered}
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? 'Submitting…' : 'Submit Quiz'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  )
}
