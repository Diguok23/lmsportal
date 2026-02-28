import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiatePayment } from '@/lib/kopokopo'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programId, phoneNumber, amount } = await request.json()

    if (!programId || !phoneNumber || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate phone number format (Kenya: 254 or 07/01)
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('254') 
      ? cleanPhone 
      : cleanPhone.startsWith('7') || cleanPhone.startsWith('1')
      ? '254' + cleanPhone.slice(1)
      : null

    if (!formattedPhone) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: user.id,
        program_id: programId,
        amount_cents: Math.round(amount * 100),
        currency: 'KES',
        status: 'pending',
      })
      .select()
      .single()

    if (paymentError) {
      console.error('[IICAR] Payment record error:', paymentError)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Initiate M-Pesa payment
    const paymentResult = await initiatePayment({
      phoneNumber: formattedPhone,
      amount: Math.round(amount),
      description: `IICAR Program Enrollment - Payment ID: ${payment.id}`,
      externalId: payment.id,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback`,
    })

    // Update payment with transaction ID
    await supabase
      .from('payments')
      .update({
        kopokopo_transaction_id: paymentResult.transactionId,
      })
      .eq('id', payment.id)

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      transactionId: paymentResult.transactionId,
      message: 'M-Pesa prompt sent to your phone',
    })
  } catch (error) {
    console.error('[IICAR] Payment initiation error:', error)
    return NextResponse.json({ 
      error: 'Payment processing failed. Please try again.' 
    }, { status: 500 })
  }
}
