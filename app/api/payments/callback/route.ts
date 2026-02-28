// KopoKopo STK Push callback
// Docs: https://api-docs.kopokopo.com/#incoming-payment-result
// Payload structure: { topic, id, created_at, event: { type, resource: { ... } }, _links }

import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[IICAR] Payment callback:', JSON.stringify(body, null, 2))

    const adminDb = createAdminClient()

    // KopoKopo wraps the result in event.resource
    const resource = body?.event?.resource ?? body?.data?.attributes ?? {}
    const metadata  = resource?.metadata ?? body?.metadata ?? {}
    const status    = resource?.status ?? 'Pending'   // "Success", "Failed", "Cancelled", "Pending"
    const reference = resource?.reference as string | undefined

    // payment_id is stored in metadata when we initiated the payment
    const paymentId = metadata?.payment_id as string | undefined

    if (!paymentId) {
      // Try matching by kopokopo_location using the self link
      const selfLink = body?._links?.self as string | undefined
      if (selfLink) {
        await handleByLocation(adminDb, selfLink, status, reference)
      }
      return NextResponse.json({ received: true })
    }

    await handleByPaymentId(adminDb, paymentId, status, reference)
    return NextResponse.json({ received: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[IICAR] Callback error:', msg)
    // Always return 200 to KopoKopo so it doesn't retry indefinitely
    return NextResponse.json({ received: true })
  }
}

async function handleByPaymentId(
  adminDb: ReturnType<typeof createAdminClient>,
  paymentId: string,
  status: string,
  reference?: string
) {
  const isPaid = status === 'Success'
  const isFailed = status === 'Failed' || status === 'Cancelled'

  const { data: payment, error } = await adminDb
    .from('payments')
    .update({
      status:             isPaid ? 'paid' : isFailed ? 'failed' : 'pending',
      paid_at:            isPaid ? new Date().toISOString() : null,
      kopokopo_reference: reference ?? null,
    })
    .eq('id', paymentId)
    .select('id, student_id, program_id, status')
    .single()

  if (error) {
    console.error('[IICAR] Payment update error:', error)
    return
  }

  if (isPaid && payment) {
    await activateEnrollment(adminDb, payment.student_id, payment.program_id)
  }
}

async function handleByLocation(
  adminDb: ReturnType<typeof createAdminClient>,
  location: string,
  status: string,
  reference?: string
) {
  const isPaid   = status === 'Success'
  const isFailed = status === 'Failed' || status === 'Cancelled'

  const { data: payment } = await adminDb
    .from('payments')
    .update({
      status:             isPaid ? 'paid' : isFailed ? 'failed' : 'pending',
      paid_at:            isPaid ? new Date().toISOString() : null,
      kopokopo_reference: reference ?? null,
    })
    .eq('kopokopo_location', location)
    .select('id, student_id, program_id')
    .single()

  if (isPaid && payment) {
    await activateEnrollment(adminDb, payment.student_id, payment.program_id)
  }
}

async function activateEnrollment(
  adminDb: ReturnType<typeof createAdminClient>,
  studentId: string,
  programId: string
) {
  const { error } = await adminDb
    .from('enrollments')
    .upsert(
      {
        student_id:   studentId,
        program_id:   programId,
        status:       'active',
        enrolled_at:  new Date().toISOString(),
      },
      { onConflict: 'student_id,program_id' }
    )

  if (error) {
    console.error('[IICAR] Enrollment activation error:', error)
  } else {
    console.log('[IICAR] Enrollment activated for student', studentId, 'program', programId)
  }
}
