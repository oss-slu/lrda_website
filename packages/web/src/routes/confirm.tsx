import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export const Route = createFileRoute('/confirm')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? decodeURIComponent(search.email) : '',
  }),
  component: ConfirmPage,
})

function ConfirmPage() {
  const navigate = useNavigate()
  const { email } = Route.useSearch()

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-6 flex justify-center">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">Verify your email</h1>
          <p className="mb-6 text-center text-gray-600">A verification link has been sent to:</p>
          {email && <p className="mb-6 text-center text-sm font-semibold text-gray-800">{email}</p>}
          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="mb-2 font-medium">Next steps:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>You'll be able to log in to your account</li>
            </ul>
          </div>
          <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <p className="mb-2 font-medium">In development mode:</p>
            <p>Check the server console for the verification link.</p>
          </div>
          <Button
            onClick={() => navigate({ to: '/login' })}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
          >
            Go to Login
          </Button>
        </div>
      </Card>
    </div>
  )
}
