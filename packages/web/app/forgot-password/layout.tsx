import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export default function ForgotPasswordLayout({ children }: LayoutProps) {
  return <div className="h-full w-full overflow-hidden">{children}</div>;
}
