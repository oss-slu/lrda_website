import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { authClient } from '@/app/lib/auth/client'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResendButton } from '@/components/ui/resend-button'
import { Link } from '@tanstack/react-router'
import { Mail, ArrowLeft, Inbox } from 'lucide-react'

export const Route = createFileRoute('/confirm')({
  head: () => ({
    meta: [{ title: "Confirm Email | Where's Religion?" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    sent: search.sent === true || search.sent === 'true',
  }),
  component: ConfirmPage,
})

function ConfirmPage() {
  const { email, sent } = Route.useSearch()
  const [hasSent, setHasSent] = useState(sent)
  const [isSending, setIsSending] = useState(false)

  const sendVerification = useCallback(async () => {
    if (!email) return
    setIsSending(true)
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/login`,
      })
      toast.success('Verification email sent')
      setHasSent(true)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send email',
      )
      throw err
    } finally {
      setIsSending(false)
    }
  }, [email])

  const handleResend = useCallback(async () => {
    await sendVerification()
  }, [sendVerification])

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex justify-center">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-center">Verify your email</CardTitle>
          <CardDescription className="mt-2 text-center">
            {hasSent ? (
              <>
                We sent a verification link to{' '}
                <span className="font-medium text-foreground">{email}</span>
              </>
            ) : email ? (
              <>
                We need to verify{' '}
                <span className="font-medium text-foreground">{email}</span>
                {' '}before you can log in.
              </>
            ) : (
              'We need to verify your email address before you can log in.'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {hasSent && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="mb-2 font-medium">Next steps:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link</li>
                  <li>Come back here and log in</li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {email && !hasSent && (
              <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                disabled={isSending}
                onClick={sendVerification}
              >
                {isSending ? 'Sending...' : 'Send verification email'}
              </Button>
            )}

            {email && hasSent && (
              <ResendButton
                onResend={handleResend}
                label="Resend verification email"
                resendingLabel="Sending..."
                className="w-full"
              />
            )}

            <Link to="/login">
              <Button
                variant={hasSent ? 'default' : 'outline'}
                className={hasSent
                  ? 'w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                  : 'w-full'
                }
              >
                Go to login
              </Button>
            </Link>

            <Link
              to="/signup"
              className="inline-flex items-center justify-center text-sm text-blue-600 underline-offset-4 hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
