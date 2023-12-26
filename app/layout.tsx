// RootLayout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./lib/components/navbar";
import { Toaster } from "@/components/ui/toaster";
import { NextAppDirEmotionCacheProvider } from "tss-react/next/appDir";

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
        <NextAppDirEmotionCacheProvider options={{ key: "css" }}>
          {children}
        </NextAppDirEmotionCacheProvider>

        <Toaster />
      </body>
    </html>
  );
}
