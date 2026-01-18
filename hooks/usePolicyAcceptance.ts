// hooks/usePolicyAcceptance.ts
import { useState, useCallback } from 'react'

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

  /**
   * Shows the policy modal and stores the action to execute after acceptance
   */
  const requirePolicyAcceptance = useCallback(
    (action: () => Promise<void>) => {
      setState({
        showModal: true,
        pendingAction: action,
        isProcessing: false,
      })
    },
    []
  )

  /**
   * Handles when user accepts the policy
   */
  const handlePolicyAccept = useCallback(async () => {
    if (!state.pendingAction) return

    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      // Execute the pending action (sign up or OAuth)
      await state.pendingAction()
      
      // Close modal after successful action
      setState({
        showModal: false,
        pendingAction: null,
        isProcessing: false,
      })
    } catch (error) {
      // Keep modal open on error, just reset processing state
      setState((prev) => ({ ...prev, isProcessing: false }))
      // Re-throw so the calling component can handle it
      throw error
    }
  }, [state.pendingAction])

  /**
   * Handles when user closes/cancels the policy modal
   */
  const handlePolicyClose = useCallback(() => {
    setState({
      showModal: false,
      pendingAction: null,
      isProcessing: false,
    })
  }, [])

  return {
    showPolicyModal: state.showModal,
    isPolicyProcessing: state.isProcessing,
    requirePolicyAcceptance,
    handlePolicyAccept,
    handlePolicyClose,
  }
}