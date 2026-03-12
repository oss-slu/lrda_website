import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/lib/stores/authStore'
import { useShallow } from 'zustand/react/shallow'
import { checkMigrationStatus } from '@/app/lib/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: "Log In | Where's Religion?" }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore(
    useShallow(state => ({
      login: state.login,
    }))
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMigratedUser, setIsMigratedUser] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return

    setIsLoading(true)
    setIsMigratedUser(false)
    try {
      const status = await login(email, password)
      if (status === 'success') {
        navigate({ to: '/map' })
      }
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : ''

      if (message.toLowerCase().includes('email not verified')) {
        navigate({ to: '/confirm', search: { email, sent: false } })
        return
      }

      try {
        const needsReset = await checkMigrationStatus(email)
        if (needsReset) {
          setIsMigratedUser(true)
        } else {
          toast.error('Invalid user credentials')
        }
      } catch {
        toast.error('Invalid user credentials')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="ml-auto text-sm text-blue-600 underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                >
                  {isLoading ? 'Loading...' : 'Login'}
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="text-blue-600 underline-offset-4 hover:underline">
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>

          {isMigratedUser && (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-medium">Welcome back!</p>
              <p className="mt-1 text-blue-800">
                We've upgraded our system since your last visit. To keep
                your account secure, we'll just need you to set a new
                password. It only takes a moment!
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() =>
                  navigate({
                    to: '/forgot-password',
                    search: { email },
                  })
                }
              >
                Set up your password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
