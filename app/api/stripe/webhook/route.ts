import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  console.log('\n')
  console.log('════════════════════════════════════════════════════════════')
  console.log('🎯 WEBHOOK RECEIVED')
  console.log('════════════════════════════════════════════════════════════')
  console.log('⏰ Timestamp:', new Date().toISOString())
  console.log('✅ Signature present:', !!signature)
  console.log('📏 Body length:', body.length)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
    console.log('✅ Webhook signature verified successfully')
  } catch (error: any) {
    console.error('❌ Webhook signature verification failed:', error.message)
    console.error(
      '🔑 Webhook secret (first 10 chars):',
      process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...',
    )
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 },
    )
  }

  console.log('📨 Event Type:', event.type)
  console.log('🆔 Event ID:', event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('\n💳 ═══════ CHECKOUT SESSION COMPLETED ═══════')
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        console.log('\n🔄 ═══════ SUBSCRIPTION UPDATED ═══════')
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        console.log('\n🗑️ ═══════ SUBSCRIPTION DELETED ═══════')
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        console.log('\n💰 ═══════ PAYMENT SUCCEEDED ═══════')
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        console.log('\n⚠️ ═══════ PAYMENT FAILED ═══════')
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    console.log('✅ Webhook processed successfully')
    console.log(
      '════════════════════════════════════════════════════════════\n',
    )
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('\n❌ ═══════ WEBHOOK PROCESSING ERROR ═══════')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error(
      '════════════════════════════════════════════════════════════\n',
    )
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 },
    )
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  console.log('📦 Full session object:', JSON.stringify(session, null, 2))

  const userId = session.metadata?.userId
  const planType = session.metadata?.planType

  console.log('🔍 Metadata extracted:')
  console.log('  - User ID:', userId)
  console.log('  - Plan Type:', planType)
  console.log('  - Customer ID:', session.customer)
  console.log('  - Subscription ID:', session.subscription)

  if (!userId || !planType) {
    console.error('❌ CRITICAL: Missing metadata!')
    console.error('Session metadata:', session.metadata)
    return
  }

  // Retrieve full subscription details
  console.log('📡 Retrieving subscription from Stripe...')
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  )

  const endDate = new Date(subscription.current_period_end * 1000)

  console.log('📊 Subscription retrieved:')
  console.log('  - Subscription ID:', subscription.id)
  console.log('  - Customer ID:', subscription.customer)
  console.log('  - Status:', subscription.status)
  console.log('  - Current period end:', endDate.toISOString())

  // Update user in database
  console.log('💾 Updating user in database...')
  console.log('  - Looking for user ID:', userId)

  const updateData = {
    subscription_tier: 'premium',
    subscription_status: 'active',
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscription.id,
    subscription_end_date: endDate.toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log('  - Update data:', updateData)

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()

  if (updateError) {
    console.error('❌ DATABASE UPDATE FAILED!')
    console.error('Error code:', updateError.code)
    console.error('Error message:', updateError.message)
    console.error('Error details:', updateError.details)
    console.error('Error hint:', updateError.hint)
    throw updateError
  }

  console.log('✅ User updated successfully:')
  console.log('  - Updated rows:', updatedUser?.length || 0)
  if (updatedUser && updatedUser.length > 0) {
    console.log('  - User ID:', updatedUser[0].id)
    console.log('  - Email:', updatedUser[0].email)
    console.log('  - Tier:', updatedUser[0].subscription_tier)
    console.log('  - Status:', updatedUser[0].subscription_status)
    console.log('  - Stripe Customer:', updatedUser[0].stripe_customer_id)
    console.log(
      '  - Stripe Subscription:',
      updatedUser[0].stripe_subscription_id,
    )
  }

  // Create subscription history
  console.log('📝 Creating subscription history...')
  const { error: historyError } = await supabaseAdmin
    .from('subscription_history')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: session.customer as string,
      plan_type: planType,
      amount: (session.amount_total || 0) / 100,
      currency: 'usd',
      status: 'active',
      started_at: new Date().toISOString(),
    })

  if (historyError) {
    console.error('⚠️ Subscription history creation failed:', historyError)
  } else {
    console.log('✅ Subscription history created')
  }

  console.log('🎉 SUBSCRIPTION ACTIVATION COMPLETE!')
  console.log('  User:', userId)
  console.log('  Plan:', planType)
  console.log('  Status: PREMIUM ACTIVE')
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  console.log('🔍 Subscription metadata:')
  console.log('  - User ID:', userId)
  console.log('  - Subscription ID:', subscription.id)
  console.log('  - Status:', subscription.status)

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
    return
  }

  const endDate = new Date(subscription.current_period_end * 1000)

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: subscription.status,
      subscription_end_date: endDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('❌ Error updating subscription:', error)
    throw error
  }

  console.log('✅ Subscription updated for user:', userId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  console.log('🔍 Deletion metadata:')
  console.log('  - User ID:', userId)
  console.log('  - Subscription ID:', subscription.id)

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
    return
  }

  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (userError) {
    console.error('❌ Error updating user on cancellation:', userError)
    throw userError
  }

  const { error: historyError } = await supabaseAdmin
    .from('subscription_history')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
    .eq('user_id', userId)

  if (historyError) {
    console.error('❌ Error updating subscription history:', historyError)
  }

  console.log('✅ Subscription canceled for user:', userId)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.userId

  console.log('💳 Payment succeeded:')
  console.log('  - User ID:', userId)
  console.log('  - Invoice ID:', invoice.id)

  if (!userId) return

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('❌ Error updating payment status:', error)
  } else {
    console.log('✅ Payment succeeded for user:', userId)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.userId

  console.log('⚠️ Payment failed:')
  console.log('  - User ID:', userId)
  console.log('  - Invoice ID:', invoice.id)

  if (!userId) return

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('❌ Error updating payment failure status:', error)
  } else {
    console.log('⚠️ Payment failed for user:', userId)
  }
}
