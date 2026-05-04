import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onFocus, onBlur, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
