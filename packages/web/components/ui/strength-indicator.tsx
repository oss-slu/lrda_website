import { useMemo, useEffect, useRef } from 'react';
import { Check, Circle } from 'lucide-react';

type Props = {
  password: string;
  onUnmet?: (errs: string[]) => void;
};

const checks: Array<{ id: string; label: string; test: (s: string) => boolean }> = [
  { id: 'length', label: 'At least 8 characters', test: s => s.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: s => /[A-Z]/.test(s) },
  { id: 'lower', label: 'One lowercase letter', test: s => /[a-z]/.test(s) },
  { id: 'number', label: 'One number', test: s => /[0-9]/.test(s) },
  { id: 'special', label: 'One special character', test: s => /[^A-Za-z0-9]/.test(s) },
];

export default function StrengthIndicator({ password, onUnmet }: Props) {
  const isEmpty = password.length === 0;
  const onUnmetRef = useRef(onUnmet);
  onUnmetRef.current = onUnmet;

  const unmet = useMemo(() => {
    return checks.filter(c => !c.test(password)).map(c => c.label);
  }, [password]);

  useEffect(() => {
    onUnmetRef.current?.(isEmpty ? checks.map(c => c.label) : unmet);
  }, [unmet, isEmpty]);

  return (
    <ul
      aria-live='polite'
      className={`mt-2 space-y-0.5 text-xs transition-all duration-300 ease-out ${
        isEmpty ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-40 opacity-100'
      }`}
    >
      {checks.map(c => {
        const ok = c.test(password);
        return (
          <li
            key={c.id}
            className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-muted-foreground'}`}
          >
            {ok ?
              <Check className='h-3 w-3' />
            : <Circle className='h-3 w-3' />}
            <span>{c.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
