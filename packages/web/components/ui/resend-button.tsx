'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ResendButtonProps {
  onResend: () => Promise<void>
  cooldownSeconds?: number
  label?: string
  resendingLabel?: string
  className?: string
}

export function ResendButton({
  onResend,
  cooldownSeconds = 60,
  label = 'Resend email',
  resendingLabel = 'Sending...',
  className,
}: ResendButtonProps) {
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleClick = useCallback(async () => {
    setSending(true)
    try {
      await onResend()
      setCooldown(cooldownSeconds)
    } catch {
      // Let the parent handle errors; don't block the button
    } finally {
      setSending(false)
    }
  }, [onResend, cooldownSeconds])

  const disabled = sending || cooldown > 0

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {sending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {resendingLabel}
        </>
      ) : cooldown > 0 ? (
        `Resend in ${cooldown}s`
      ) : (
        label
      )}
    </Button>
  )
}
