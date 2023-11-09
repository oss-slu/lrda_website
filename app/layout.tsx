// RootLayout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./lib/components/navbar";

const inter = Inter({ subsets: ["latin"] });

import { ReactNode } from "react";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head />
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
