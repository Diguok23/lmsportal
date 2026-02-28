import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const programId = searchParams.get('program_id')

  if (!sessionId || !programId) return NextResponse.redirect(new URL('/dashboard', request.url))

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status === 'paid') {
    const supabase = await createClient()
    const studentId = session.metadata?.student_id

    if (studentId) {
      // Update payment record
      await supabase.from('payments')
        .update({
          status: 'paid',
          stripe_payment_intent: session.payment_intent as string,
          paid_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', sessionId)

      // Activate enrollment
      await supabase.from('enrollments').upsert({
        student_id: studentId,
        program_id: programId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'student_id,program_id' })
    }
  }

  return NextResponse.redirect(new URL(`/dashboard/programs/${programId}`, request.url))
}
