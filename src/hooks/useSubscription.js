import { useCallback, useState } from 'react'

/**
 * Simulated ImagesBazaar subscription state.
 *
 * No payment processing exists in this build — activating a plan simply flips
 * a flag so the download gate can be demonstrated end to end.
 */
export function useSubscription() {
  const [plan, setPlan] = useState(null)

  const activate = useCallback((planId) => setPlan(planId), [])
  const cancel = useCallback(() => setPlan(null), [])

  return { plan, isSubscribed: plan !== null, activate, cancel }
}
