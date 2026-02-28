import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { programId } = await request.json()

  const { data: program } = await supabase
    .from('programs')
    .select('id, title, price_cents')
    .eq('id', programId)
    .single()

  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: program.title },
          unit_amount: program.price_cents,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/api/payments/success?session_id={CHECKOUT_SESSION_ID}&program_id=${programId}`,
    cancel_url: `${origin}/dashboard/programs/${programId}/enroll`,
    metadata: {
      student_id: user.id,
      program_id: programId,
    },
  })

  // Record pending payment
  await supabase.from('payments').insert({
    student_id: user.id,
    program_id: programId,
    stripe_session_id: session.id,
    amount_cents: program.price_cents,
    status: 'pending',
  })

  return NextResponse.json({ url: session.url })
}
