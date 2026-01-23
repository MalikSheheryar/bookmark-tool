'use client'

import { useAuth } from '@/components/auth-provider'
import { useEffect, useState } from 'react'

export const FREE_TIER_LIMITS = {
  maxBookmarks: 50,
  maxPrivateCategories: 1, // NEW: Only 1 private category for free users
  maxPublicCategories: 999, // Unlimited public categories
  emojiSet: 'free', // 'free' or 'premium'
}

export function useSubscription() {
  const { dbUser } = useAuth()
  const [subscriptionData, setSubscriptionData] = useState({
    isPremium: false,
    isActive: false,
    tier: 'free' as 'free' | 'premium',
    status: 'inactive' as string,
  })

  useEffect(() => {
    if (dbUser) {
      const isPremium = dbUser.subscription_tier === 'premium'
      const isActive = dbUser.subscription_status === 'active'

      setSubscriptionData({
        isPremium: isPremium && isActive,
        isActive,
        tier: dbUser.subscription_tier || 'free',
        status: dbUser.subscription_status || 'inactive',
      })
    } else {
      setSubscriptionData({
        isPremium: false,
        isActive: false,
        tier: 'free',
        status: 'inactive',
      })
    }
  }, [dbUser])

  const canCreateBookmark = (currentBookmarkCount: number) => {
    if (subscriptionData.isPremium) return true
    return currentBookmarkCount < FREE_TIER_LIMITS.maxBookmarks
  }

  // NEW: Check if user can create a private category
  const canCreatePrivateCategory = (currentPrivateCategoryCount: number) => {
    if (subscriptionData.isPremium) return true
    return currentPrivateCategoryCount < FREE_TIER_LIMITS.maxPrivateCategories
  }

  // NEW: Check if user can create a public category (always true for now)
  const canCreatePublicCategory = () => {
    return true // Unlimited public categories for everyone
  }

  const getAvailableEmojis = () => {
    return subscriptionData.isPremium ? 'premium' : 'free'
  }

  const getRemainingBookmarks = (currentBookmarkCount: number) => {
    if (subscriptionData.isPremium) return Infinity
    return Math.max(0, FREE_TIER_LIMITS.maxBookmarks - currentBookmarkCount)
  }

  // NEW: Get remaining private categories count
  const getRemainingPrivateCategories = (
    currentPrivateCategoryCount: number,
  ) => {
    if (subscriptionData.isPremium) return Infinity
    return Math.max(
      0,
      FREE_TIER_LIMITS.maxPrivateCategories - currentPrivateCategoryCount,
    )
  }

  return {
    ...subscriptionData,
    canCreateBookmark,
    canCreatePrivateCategory,
    canCreatePublicCategory,
    getAvailableEmojis,
    getRemainingBookmarks,
    getRemainingPrivateCategories,
    limits: FREE_TIER_LIMITS,
  }
}
