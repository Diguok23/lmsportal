import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { modules } = await request.json()
    if (!Array.isArray(modules)) return NextResponse.json({ error: 'modules must be an array' }, { status: 400 })

    // Ensure program_modules table exists by attempting upsert
    // First delete existing modules for this program
    await adminDb.from('program_modules').delete().eq('program_id', programId)

    const rows = modules.map((m: {
      module_number: number
      title: string
      description: string
      learning_outcomes: string[]
      duration_hours: number
      topics: string[]
    }) => ({
      program_id: programId,
      module_number: m.module_number,
      title: m.title,
      description: m.description,
      learning_outcomes: m.learning_outcomes ?? [],
      duration_hours: m.duration_hours ?? 0,
      topics: m.topics ?? [],
    }))

    const { data, error } = await adminDb.from('program_modules').insert(rows).select('id')
    if (error) {
      // If table doesn't exist, give a clear instruction
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          error: 'The program_modules table does not exist yet. Please run scripts/create-program-modules.sql in your Supabase SQL Editor first.',
        }, { status: 500 })
      }
      throw error
    }

    return NextResponse.json({ saved: data?.length ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
