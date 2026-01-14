'use client';
import React from 'react';

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
  const unmet = React.useMemo(() => {
    return checks.filter(c => !c.test(password)).map(c => c.label);
  }, [password]);

  React.useEffect(() => {
    if (onUnmet) onUnmet(unmet);
  }, [unmet, onUnmet]);

  const strength = Math.max(0, checks.length - unmet.length);

  return (
    <div className='mt-2'>
      <div className='h-2 w-full overflow-hidden rounded bg-gray-200'>
        <div
          className={`h-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-200`}
          style={{ width: `${(strength / checks.length) * 100}%` }}
          aria-hidden
        />
      </div>
      <ul className='mt-2 text-xs text-gray-600'>
        {checks.map(c => {
          const ok = c.test(password);
          return (
            <li
              key={c.id}
              className={`flex items-center gap-2 ${ok ? 'text-green-600' : 'text-gray-500'}`}
            >
              <span aria-hidden>{ok ? '✓' : '•'}</span>
              <span>{c.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
