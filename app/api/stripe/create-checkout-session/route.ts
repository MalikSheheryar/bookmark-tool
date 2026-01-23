import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS, PlanType } from '@/lib/stripe'
import { getServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { planType } = await req.json()

    if (!planType || !STRIPE_PLANS[planType as PlanType]) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await getServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (dbError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const plan = STRIPE_PLANS[planType as PlanType]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Create or retrieve Stripe customer
    let customerId = dbUser.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: dbUser.id,
          authId: user.id,
        },
      })
      customerId = customer.id

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', dbUser.id)
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
      metadata: {
        userId: dbUser.id,
        planType,
      },
      subscription_data: {
        metadata: {
          userId: dbUser.id,
          planType,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
