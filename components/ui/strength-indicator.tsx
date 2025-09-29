import * as React from "react"

const requirementsList = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8, error: "at least 8 characters" },
  { label: "Uppercase letter (A-Z)", test: (pw: string) => /[A-Z]/.test(pw), error: "an uppercase letter" },
  { label: "Lowercase letter (a-z)", test: (pw: string) => /[a-z]/.test(pw), error: "a lowercase letter" },
  { label: "Number (0-9)", test: (pw: string) => /\d/.test(pw), error: "a number" },
  { label: "Special character (e.g. !?<>@#$%)", test: (pw: string) => /[^A-Za-z0-9]/.test(pw), error: "a special character" },
]

export type StrengthIndicatorProps = {
  password?: string
  onUnmet?: (errors: string[]) => void
}

export default function StrengthIndicator({ password = "", onUnmet }: StrengthIndicatorProps) {
  const met = React.useMemo(() => requirementsList.filter((r) => r.test(password)).map((r) => r.label), [password])
  const unmet = React.useMemo(() => requirementsList.filter((r) => !r.test(password)).map((r) => r.label), [password])
  const errors = React.useMemo(() => requirementsList.filter((r) => !r.test(password)).map((r) => r.error), [password])

  React.useEffect(() => {
    onUnmet?.(errors)
  }, [errors, onUnmet])

  return (
    <div className="w-full mt-3 sm:mt-4" aria-live="polite">
      <div className="text-sm sm:text-base text-gray-700" id="password-requirements">
        <ul className="pace-y-0.5 sm:space-y-1">
          {requirementsList.map((req) => {
            const ok = met.includes(req.label)
            return (
              <li key={req.label} className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 sm:w-4 sm:h-4 ml-1 rounded-full flex items-center justify-center ${
                    ok ? "bg-white text-green-500 border-green-500 border-[1.5px]" : "border-red-500 border-[1.5px] text-red-500"
                  }`}
                  aria-hidden="true"
                >
                  {ok ? (
                    <svg className="w-2 h-2 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l3 3 5-5" />
                    </svg>
                  ) : (
                    <svg className="w-2 h-2 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 16 16">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5l6 6M11 5l-6 6" />
                    </svg>
                  )}
                </span>
                <span className={ok ? "text-green-500" : "text-red-500"}>{req.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
