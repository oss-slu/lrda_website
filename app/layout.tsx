// RootLayout.tsx
import './globals.css';
import { ReactNode } from 'react';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head />
      <div>
      <body>{children}</body>
      </div>
    </html>
  );

}
