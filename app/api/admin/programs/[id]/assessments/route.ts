import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface QuestionInput {
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()
  const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { moduleId, questions, type } = await request.json()
  // type = 'module_quiz' | 'final_exam'

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'questions array required' }, { status: 400 })
  }

  // Delete existing questions for this scope before re-inserting
  if (type === 'module_quiz' && moduleId) {
    await adminDb.from('questions').delete()
      .eq('module_id', moduleId)
      .eq('question_type', 'module_quiz')
  } else if (type === 'final_exam') {
    await adminDb.from('questions').delete()
      .eq('program_id', programId)
      .eq('question_type', 'final_exam')
  }

  const rows = questions.map((q: QuestionInput, idx: number) => ({
    program_id: programId,
    module_id: type === 'module_quiz' ? moduleId : null,
    question_type: type,
    question_text: q.question,
    option_a: q.options[0] ?? '',
    option_b: q.options[1] ?? '',
    option_c: q.options[2] ?? '',
    option_d: q.options[3] ?? '',
    correct_answer: q.correct_answer,
    explanation: q.explanation ?? null,
    sort_order: idx,
  }))

  const { data, error } = await adminDb.from('questions').insert(rows).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: data?.length ?? 0 })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params
  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('moduleId')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()
  const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let query = adminDb.from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, question_type, module_id, sort_order')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true })

  if (moduleId) {
    query = query.eq('module_id', moduleId).eq('question_type', 'module_quiz')
  } else {
    query = query.eq('question_type', 'final_exam')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: data ?? [] })
}
