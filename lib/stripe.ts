import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

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
