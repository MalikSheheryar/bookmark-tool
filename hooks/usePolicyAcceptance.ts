// hooks/usePolicyAcceptance.ts
import { useState, useCallback, useRef } from 'react'

interface PolicyAcceptanceState {
  showModal: boolean
  pendingAction: (() => Promise<void>) | null
  isProcessing: boolean
}

export function usePolicyAcceptance() {
  const [state, setState] = useState<PolicyAcceptanceState>({
    showModal: false,
    pendingAction: null,
    isProcessing: false,
  })

  // ✅ Single ref to prevent duplicate executions
  const isExecutingRef = useRef(false)

  /**
   * Shows the policy modal and stores the action to execute after acceptance
   */
  const requirePolicyAcceptance = useCallback((action: () => Promise<void>) => {
    setState({
      showModal: true,
      pendingAction: action,
      isProcessing: false,
    })
  }, [])

  /**
   * Handles when user accepts the policy
   */
  const handlePolicyAccept = useCallback(async () => {
    // ✅ Guard: Check if we have an action and not already executing
    if (!state.pendingAction || isExecutingRef.current) {
      console.log('⚠️ Already executing or no action')
      return
    }

    // ✅ Set the lock immediately
    isExecutingRef.current = true
    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      console.log('✅ Executing signup action...')
      await state.pendingAction()

      console.log('✅ Signup completed successfully')
      // Close modal after successful action
      setState({
        showModal: false,
        pendingAction: null,
        isProcessing: false,
      })
    } catch (error) {
      console.error('❌ Signup error in hook:', error)
      // Keep modal open on error, just reset processing state
      setState((prev) => ({ ...prev, isProcessing: false }))
    } finally {
      // ✅ Reset lock after a delay
      setTimeout(() => {
        isExecutingRef.current = false
      }, 2000)
    }
  }, [state.pendingAction])

  /**
   * Handles when user closes/cancels the policy modal
   */
  const handlePolicyClose = useCallback(() => {
    if (state.isProcessing) {
      console.log('⚠️ Cannot close while processing')
      return
    }

    setState({
      showModal: false,
      pendingAction: null,
      isProcessing: false,
    })

    isExecutingRef.current = false
  }, [state.isProcessing])

  return {
    showPolicyModal: state.showModal,
    isPolicyProcessing: state.isProcessing,
    requirePolicyAcceptance,
    handlePolicyAccept,
    handlePolicyClose,
  }
}
