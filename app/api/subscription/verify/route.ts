import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase-server'

// ✅ Force dynamic rendering - prevents static generation error
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  console.log('\n🔍 ═══════ VERIFICATION API CALLED ═══════')
  console.log('⏰ Time:', new Date().toISOString())

  try {
    const supabase = await getServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 Authenticated user:', user.id)

    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (dbError) {
      console.error('❌ Database query failed:', dbError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isPremium =
      dbUser.subscription_tier === 'premium' &&
      dbUser.subscription_status === 'active'

    console.log('📊 User subscription status:')
    console.log('  - User ID:', dbUser.id)
    console.log('  - Email:', dbUser.email)
    console.log('  - Tier:', dbUser.subscription_tier)
    console.log('  - Status:', dbUser.subscription_status)
    console.log('  - Is Premium:', isPremium)
    console.log('  - Stripe Customer:', dbUser.stripe_customer_id || 'none')
    console.log(
      '  - Stripe Subscription:',
      dbUser.stripe_subscription_id || 'none',
    )
    console.log('════════════════════════════════════════════\n')

    return NextResponse.json({
      success: true,
      isPremium,
      tier: dbUser.subscription_tier,
      status: dbUser.subscription_status,
      hasStripeCustomer: !!dbUser.stripe_customer_id,
      hasStripeSubscription: !!dbUser.stripe_subscription_id,
      stripeCustomerId: dbUser.stripe_customer_id,
      stripeSubscriptionId: dbUser.stripe_subscription_id,
      subscriptionEndDate: dbUser.subscription_end_date,
    })
  } catch (error: any) {
    console.error('❌ Verification API error:', error)
    console.error('════════════════════════════════════════════\n')
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}
