import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/app/lib/stores/authStore'
import { useShallow } from 'zustand/react/shallow'
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
  const [snackState, setSnackState] = useState(false)

  useEffect(() => {
    if (!snackState) return
    const timer = setTimeout(() => setSnackState(false), 3000)
    return () => clearTimeout(timer)
  }, [snackState])

  const handleLogin = async () => {
    if (!email || !password) return

    setIsLoading(true)
    try {
      const status = await login(email, password)
      if (status === 'success') {
        navigate({ to: '/map' })
      }
    } catch (err) {
      console.error(err)
      setSnackState(true)
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
        </CardContent>
      </Card>

      {snackState && (
        <div className="fixed inset-x-0 bottom-10 flex justify-center">
          <div className="w-80 rounded-lg bg-white p-3 text-center shadow">
            <p className="mb-2">Invalid user credentials</p>
            <button
              className="text-sm text-blue-500 hover:underline"
              onClick={() => setSnackState(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
