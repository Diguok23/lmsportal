import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[IICAR] Payment callback received:', { externalId: body.data?.external_id, status: body.data?.status })

    const supabase = await createClient()
    
    // Verify webhook signature (implement according to Kopo Kopo docs)
    const paymentId = body.data?.external_id
    const status = body.data?.status
    const amount = body.data?.amount

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Invalid callback' }, { status: 400 })
    }

    // Update payment status
    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: status === 'completed' ? 'paid' : status === 'failed' ? 'failed' : 'pending',
        paid_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (updateError) {
      console.error('[IICAR] Payment update error:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    // If payment successful, create enrollment
    if (status === 'completed' && payment) {
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          student_id: payment.student_id,
          program_id: payment.program_id,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        })
        .eq('student_id', payment.student_id)
        .eq('program_id', payment.program_id)

      if (enrollError && enrollError.code !== '23505') { // Ignore unique constraint
        console.error('[IICAR] Enrollment creation error:', enrollError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[IICAR] Callback processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
