import Stripe from 'stripe'

// ✅ FIXED: Store actual Stripe amounts in USD
// UI will display in GBP (£3.99, £39) but backend uses USD
export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
    amount: 5.39, // Actual Stripe price in USD
    displayAmount: 3.99, // Display price in GBP for UI
    currency: 'usd', // Stripe currency
    displayCurrency: 'gbp', // UI currency
    interval: 'month',
  },
  yearly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!,
    amount: 52.64, // Actual Stripe price in USD
    displayAmount: 39.0, // Display price in GBP for UI
    currency: 'usd', // Stripe currency
    displayCurrency: 'gbp', // UI currency
    interval: 'year',
  },
} as const

export type PlanType = keyof typeof STRIPE_PLANS

// ✅ Lazy initialization - only creates Stripe when actually used at RUNTIME
let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }

  return stripeInstance
}

// ✅ Export a Proxy that looks like Stripe but only initializes when accessed
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const instance = getStripeInstance()
    const value = instance[prop as keyof Stripe]

    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance)
    }

    return value
  },
})
