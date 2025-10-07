import * as React from "react"
import { Input } from "@/components/ui/input"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  password?: string
  onPasswordChange?: (value: string) => void
  iconSize?: number
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ password, onPasswordChange, iconSize = 20, className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className={className}>
        <label htmlFor={props.id} className="block text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">
          Password
        </label>
        <div className="relative">
          <Input
            {...props}
            id={props.id}
            ref={ref}
            type={visible ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange?.(e.target.value)}
            placeholder={props.placeholder ?? "••••••••"}
          />
          <button
            type="button"
            aria-pressed={visible}
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {visible ? (
              // Visible: plain eye
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // Hidden: full eye with a slash through it for clarity
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 2l20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export default PasswordInput
